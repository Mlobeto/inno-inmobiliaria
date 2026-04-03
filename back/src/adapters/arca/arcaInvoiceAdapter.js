'use strict';

/**
 * ArcaInvoiceAdapter – adaptador para wsfev1 (Facturación Electrónica V1 de AFIP/ARCA)
 *
 * Responsabilidades:
 *  - Consultar el último número de comprobante autorizado (FECompUltimoAutorizado)
 *  - Solicitar autorización de comprobante (FECAESolicitar)
 *  - Consultar un comprobante ya emitido (FECompConsultar)
 *  - Generar la URL del código QR AFIP
 *
 * Este adapter NO conoce Prisma, ni tenants, ni la lógica de negocio.
 * Solo traduce entre el dominio interno y el protocolo SOAP de AFIP.
 *
 * Dependencias externas requeridas:
 *   npm install soap
 */

const soap = require('soap');
const logger = require('../../utils/logger');
const { ArcaInvoiceError } = require('./arcaErrors');

// URLs WSDL del servicio de facturación según ambiente
const WSFEV1_WSDL = {
  homologacion: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL',
  produccion: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL',
};

/**
 * Crea un cliente SOAP para wsfev1.
 * @param {string} environment
 * @returns {Promise<object>} cliente SOAP
 */
async function createSoapClient(environment) {
  const wsdlUrl = WSFEV1_WSDL[environment];
  if (!wsdlUrl) {
    throw new ArcaInvoiceError(`Ambiente inválido para WSFEV1: "${environment}"`);
  }
  try {
    return await soap.createClientAsync(wsdlUrl);
  } catch (err) {
    throw new ArcaInvoiceError(
      `No se pudo conectar al servicio WSFEV1 de AFIP (${environment}): ${err.message}`
    );
  }
}

/**
 * Construye el objeto Auth requerido por todos los métodos de wsfev1.
 */
function buildAuth(cuit, token, sign) {
  return { Token: token, Sign: sign, Cuit: cuit };
}

/**
 * Extrae y normaliza errores del response de ARCA.
 * AFIP puede devolver errores como objeto individual o array.
 */
function extractErrors(errorsNode) {
  if (!errorsNode) return null;
  const raw = errorsNode.Err;
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((e) => ({ code: e.Code, message: e.Msg }));
}

/**
 * Obtiene el último número de comprobante autorizado para un punto de venta y tipo.
 *
 * @param {object} params
 * @param {string} params.environment
 * @param {string} params.cuit - CUIT del emisor (sin guiones)
 * @param {string} params.token
 * @param {string} params.sign
 * @param {number} params.pointOfSale
 * @param {number} params.invoiceType - 1=FC-A, 6=FC-B, 11=FC-C, etc.
 * @returns {Promise<number>} último número autorizado (0 si no hay ninguno aún)
 */
async function getLastInvoiceNumber({ environment, cuit, token, sign, pointOfSale, invoiceType }) {
  const client = await createSoapClient(environment);
  const auth = buildAuth(cuit, token, sign);

  let result;
  try {
    [result] = await client.FECompUltimoAutorizadoAsync({
      Auth: auth,
      PtoVta: pointOfSale,
      CbteTipo: invoiceType,
    });
  } catch (err) {
    throw new ArcaInvoiceError(`Error en FECompUltimoAutorizado: ${err.message}`);
  }

  const response = result?.FECompUltimoAutorizadoResult;
  if (!response) {
    throw new ArcaInvoiceError('FECompUltimoAutorizado devolvió respuesta vacía');
  }

  const errors = extractErrors(response.Errors);
  if (errors) {
    throw new ArcaInvoiceError(
      `Error ARCA en FECompUltimoAutorizado [${errors[0].code}]: ${errors[0].message}`
    );
  }

  return response.CbteNro || 0;
}

/**
 * Solicita autorización (CAE) para un comprobante a ARCA.
 *
 * @param {object} params
 * @param {string} params.environment
 * @param {string} params.cuit
 * @param {string} params.token
 * @param {string} params.sign
 * @param {object} params.invoiceData - Ver descripción de campos abajo
 * @returns {Promise<object>} Resultado de autorización
 *
 * invoiceData shape:
 * {
 *   invoiceType: number,           // 1=FC-A, 6=FC-B, 11=FC-C, 3=NC-A, 8=NC-B, 13=NC-C
 *   pointOfSale: number,
 *   invoiceNumber: number,         // próximo número (último + 1)
 *   concept: number,               // 1=productos, 2=servicios, 3=ambos
 *   customerDocType: number,       // 80=CUIT, 86=CUIL, 96=DNI, 99=consumidor final
 *   customerDocNumber: string,
 *   issuedDate: string,            // YYYYMMDD
 *   netAmount: number|Decimal,
 *   taxAmount: number|Decimal,
 *   totalAmount: number|Decimal,
 *   currency: string,              // 'PES' por defecto
 *   exchangeRate: number,          // 1 para ARS
 *   serviceFromDate?: string,      // YYYYMMDD — obligatorio si concept=2 o 3
 *   serviceToDate?: string,        // YYYYMMDD
 *   dueDate?: string,              // YYYYMMDD
 *   taxBreakdown?: Array<{ ivaId, baseAmount, taxAmount }>  // alícuotas IVA
 * }
 */
async function requestCAE({ environment, cuit, token, sign, invoiceData }) {
  const client = await createSoapClient(environment);
  const auth = buildAuth(cuit, token, sign);

  // Construir detalle del comprobante
  const detail = {
    Concepto: invoiceData.concept,
    DocTipo: invoiceData.customerDocType,
    DocNro: invoiceData.customerDocNumber,
    CbteDesde: invoiceData.invoiceNumber,
    CbteHasta: invoiceData.invoiceNumber,
    CbteFch: invoiceData.issuedDate, // YYYYMMDD
    ImpTotal: Number(invoiceData.totalAmount),
    ImpTotConc: 0,
    ImpNeto: Number(invoiceData.netAmount),
    ImpOpEx: 0,
    ImpIVA: Number(invoiceData.taxAmount),
    ImpTrib: 0,
    MonId: invoiceData.currency || 'PES',
    MonCotiz: invoiceData.currency === 'PES' ? 1 : Number(invoiceData.exchangeRate || 1),
  };

  // Fechas de servicio (obligatorias para conceptos 2 y 3)
  if (invoiceData.concept === 2 || invoiceData.concept === 3) {
    detail.FchServDesde = invoiceData.serviceFromDate;
    detail.FchServHasta = invoiceData.serviceToDate;
    detail.FchVtoPago = invoiceData.dueDate;
  }

  // Alícuotas de IVA (opcional, para desglose)
  if (invoiceData.taxBreakdown && invoiceData.taxBreakdown.length > 0) {
    detail.Iva = {
      AlicIva: invoiceData.taxBreakdown.map((item) => ({
        Id: item.ivaId,
        BaseImp: Number(item.baseAmount),
        Importe: Number(item.taxAmount),
      })),
    };
  }

  const fecaeRequest = {
    Auth: auth,
    FeCAEReq: {
      FeCabReq: {
        CantReg: 1,
        PtoVta: invoiceData.pointOfSale,
        CbteTipo: invoiceData.invoiceType,
      },
      FeDetReq: {
        FECAEDetRequest: detail,
      },
    },
  };

  logger.debug('FECAESolicitar enviando request a ARCA', {
    cuit,
    environment,
    invoiceType: invoiceData.invoiceType,
    pointOfSale: invoiceData.pointOfSale,
    invoiceNumber: invoiceData.invoiceNumber,
  });

  let result;
  try {
    [result] = await client.FECAESolicitarAsync(fecaeRequest);
  } catch (err) {
    throw new ArcaInvoiceError(`Error en la llamada SOAP FECAESolicitar: ${err.message}`);
  }

  const response = result?.FECAESolicitarResult;
  if (!response) {
    throw new ArcaInvoiceError('FECAESolicitar devolvió respuesta vacía');
  }

  // Errores a nivel de cabecera (problemas de auth, punto de venta, etc.)
  const headerErrors = extractErrors(response.Errors);
  if (headerErrors) {
    throw new ArcaInvoiceError(
      `Error ARCA en FECAESolicitar [${headerErrors[0].code}]: ${headerErrors[0].message}`
    );
  }

  const detResponse = response.FeDetResp?.FECAEDetResponse;
  const observationsRaw = detResponse?.Observaciones?.Obs;
  const observations = observationsRaw
    ? (Array.isArray(observationsRaw) ? observationsRaw : [observationsRaw]).map((obs) => ({
        code: obs.Code,
        message: obs.Msg,
      }))
    : [];

  logger.debug('FECAESolicitar respuesta recibida', {
    cuit,
    environment,
    resultado: detResponse?.Resultado,
    cae: detResponse?.CAE,
  });

  return {
    // 'A' = aprobado, 'R' = rechazado, 'P' = aprobado con observaciones
    resultado: detResponse?.Resultado || 'R',
    cae: detResponse?.CAE || null,
    caeExpiresAt: detResponse?.CAEFchVto ? parseFechaYYYYMMDD(detResponse.CAEFchVto) : null,
    invoiceNumber: detResponse?.CbteDesde || invoiceData.invoiceNumber,
    observations,
    rawRequest: fecaeRequest,
    rawResponse: response,
  };
}

/**
 * Consulta un comprobante ya emitido en ARCA.
 *
 * @param {object} params
 * @param {string} params.environment
 * @param {string} params.cuit
 * @param {string} params.token
 * @param {string} params.sign
 * @param {number} params.pointOfSale
 * @param {number} params.invoiceType
 * @param {number} params.invoiceNumber
 */
async function getInvoiceDetails({ environment, cuit, token, sign, pointOfSale, invoiceType, invoiceNumber }) {
  const client = await createSoapClient(environment);
  const auth = buildAuth(cuit, token, sign);

  let result;
  try {
    [result] = await client.FECompConsultarAsync({
      Auth: auth,
      FeCompConsReq: {
        CbteTipo: invoiceType,
        CbteNro: invoiceNumber,
        PtoVta: pointOfSale,
      },
    });
  } catch (err) {
    throw new ArcaInvoiceError(`Error en FECompConsultar: ${err.message}`);
  }

  const response = result?.FECompConsultarResult;
  if (!response) {
    throw new ArcaInvoiceError('FECompConsultar devolvió respuesta vacía');
  }

  const errors = extractErrors(response.Errors);
  if (errors) {
    throw new ArcaInvoiceError(
      `Error ARCA en FECompConsultar [${errors[0].code}]: ${errors[0].message}`
    );
  }

  return response;
}

/**
 * Genera la URL del código QR de AFIP para una factura autorizada.
 * Formato según Manual de Código QR AFIP.
 *
 * @param {object} params
 * @returns {string} URL del QR
 */
function generateQrUrl({
  cuit,
  pointOfSale,
  invoiceType,
  invoiceNumber,
  issuedDate,
  totalAmount,
  currency,
  cae,
  customerDocType = 80,
  customerDocNumber = 0,
}) {
  const data = {
    ver: 1,
    fecha: issuedDate, // YYYY-MM-DD
    cuit: String(cuit).replace(/-/g, ''),
    ptoVta: pointOfSale,
    tipoCmp: invoiceType,
    nroCmp: invoiceNumber,
    importe: Number(totalAmount),
    moneda: currency || 'PES',
    ctz: 1,
    tipoDocRec: customerDocType,
    nroDocRec: String(customerDocNumber),
    tipoCodAut: 'E',
    codAut: cae,
  };

  const json = JSON.stringify(data);
  const base64 = Buffer.from(json).toString('base64url');
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`;
}

/**
 * Convierte una fecha YYYYMMDD a objeto Date (UTC midnight).
 */
function parseFechaYYYYMMDD(dateStr) {
  if (!dateStr || String(dateStr).length !== 8) return null;
  const s = String(dateStr);
  const year = parseInt(s.slice(0, 4), 10);
  const month = parseInt(s.slice(4, 6), 10) - 1;
  const day = parseInt(s.slice(6, 8), 10);
  return new Date(Date.UTC(year, month, day));
}

/**
 * Convierte una fecha JS a formato YYYYMMDD requerido por AFIP.
 * @param {Date|string} date
 * @returns {string}
 */
function toAfipDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

module.exports = {
  getLastInvoiceNumber,
  requestCAE,
  getInvoiceDetails,
  generateQrUrl,
  toAfipDate,
  parseFechaYYYYMMDD,
};
