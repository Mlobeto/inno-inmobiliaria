'use strict';

/**
 * Errores del dominio fiscal / ARCA
 *
 * Separamos errores funcionales (reglas de negocio) de errores técnicos (SOAP, red).
 * El controller decide cómo mapear cada error a un status HTTP.
 */

class ArcaError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'ArcaError';
    this.code = code;
    this.details = details;
  }
}

// Error técnico de autenticación WSAA (red, cert inválido, SOAP)
class ArcaAuthError extends ArcaError {
  constructor(message, details = null) {
    super(message, 'ARCA_AUTH_ERROR', details);
    this.name = 'ArcaAuthError';
  }
}

// Error técnico en operaciones de factura (SOAP, red, respuesta malformada)
class ArcaInvoiceError extends ArcaError {
  constructor(message, details = null) {
    super(message, 'ARCA_INVOICE_ERROR', details);
    this.name = 'ArcaInvoiceError';
  }
}

// Error funcional: el tenant no tiene perfil fiscal configurado
class FiscalProfileNotFoundError extends ArcaError {
  constructor(tenantId) {
    super(
      `No se encontró perfil fiscal para el tenant ${tenantId}`,
      'FISCAL_PROFILE_NOT_FOUND'
    );
    this.name = 'FiscalProfileNotFoundError';
    this.tenantId = tenantId;
  }
}

// Error funcional: el perfil fiscal existe pero no está listo para facturar
class NotReadyToInvoiceError extends ArcaError {
  constructor(onboardingStatus) {
    super(
      `El perfil fiscal no está listo para facturar. Estado actual: ${onboardingStatus}`,
      'NOT_READY_TO_INVOICE'
    );
    this.name = 'NotReadyToInvoiceError';
    this.onboardingStatus = onboardingStatus;
  }
}

// Error funcional: el certificado venció o no está cargado
class CertificateError extends ArcaError {
  constructor(message) {
    super(message, 'CERTIFICATE_ERROR');
    this.name = 'CertificateError';
  }
}

// Error funcional: intento de doble emisión (idempotencia)
class DuplicateInvoiceError extends ArcaError {
  constructor(invoiceId) {
    super(
      `La factura ${invoiceId} ya fue procesada o está en curso`,
      'DUPLICATE_INVOICE'
    );
    this.name = 'DuplicateInvoiceError';
    this.invoiceId = invoiceId;
  }
}

// Error funcional: la factura no pertenece al tenant actual
class InvoiceTenantMismatchError extends ArcaError {
  constructor() {
    super(
      'La factura solicitada no pertenece a esta inmobiliaria',
      'INVOICE_TENANT_MISMATCH'
    );
    this.name = 'InvoiceTenantMismatchError';
  }
}

// Error funcional: ARCA rechazó el comprobante (resultado 'R')
class InvoiceRejectedByArcaError extends ArcaError {
  constructor(observations = []) {
    const detail = observations.map((o) => `[${o.code}] ${o.message}`).join('; ');
    super(`ARCA rechazó la factura: ${detail}`, 'INVOICE_REJECTED_BY_ARCA');
    this.name = 'InvoiceRejectedByArcaError';
    this.observations = observations;
  }
}

module.exports = {
  ArcaError,
  ArcaAuthError,
  ArcaInvoiceError,
  FiscalProfileNotFoundError,
  NotReadyToInvoiceError,
  CertificateError,
  DuplicateInvoiceError,
  InvoiceTenantMismatchError,
  InvoiceRejectedByArcaError,
};
