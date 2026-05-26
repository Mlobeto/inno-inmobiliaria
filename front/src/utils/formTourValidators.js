/** @returns {{ valid: boolean, message?: string }} */
function ok() {
  return { valid: true };
}

/** @returns {{ valid: boolean, message?: string }} */
function fail(message) {
  return { valid: false, message };
}

function fieldValue(container, selector) {
  const el = container?.querySelector?.(selector);
  if (!el) return '';
  if (el.type === 'checkbox') return el.checked ? '1' : '';
  return String(el.value ?? '').trim();
}

function phone10(container, selector) {
  const digits = fieldValue(container, selector).replace(/\D/g, '');
  if (!digits) return fail('Ingresá el teléfono móvil');
  if (!/^\d{10}$/.test(digits)) return fail('El teléfono debe tener 10 dígitos');
  return ok();
}

/** Pasos informativos — no bloquean. */
const INFO_OK = () => ok();

export const FORM_TOUR_VALIDATORS = {
  clientes: {
    'tour-cliente-identidad': (container) => {
      if (!fieldValue(container, '#cuil')) return fail('Ingresá el CUIL/DNI');
      if (!fieldValue(container, '#name')) return fail('Ingresá el nombre completo');
      const phoneCheck = phone10(container, '#mobilePhone');
      if (!phoneCheck.valid) return phoneCheck;
      return ok();
    },
    'tour-cliente-domicilio': (container) => {
      if (!fieldValue(container, '#provincia')) return fail('Seleccioná la provincia');
      if (!fieldValue(container, '#ciudad')) return fail('Seleccioná la ciudad');
      if (!fieldValue(container, '#codigoPostal')) return fail('Ingresá el código postal');
      if (!/^\d{4}$/.test(fieldValue(container, '#codigoPostal'))) {
        return fail('El código postal debe tener 4 dígitos');
      }
      if (!fieldValue(container, '#direccion')) return fail('Ingresá la dirección');
      return ok();
    },
    'tour-cliente-guardar': INFO_OK,
  },

  propiedades: {
    'tour-prop-cliente': (container) => {
      const id = fieldValue(container, '#tour-prop-idClient');
      if (!id) return fail('Seleccioná o creá el cliente propietario');
      return ok();
    },
    'tour-prop-ubicacion': (container) => {
      if (!fieldValue(container, '#address')) return fail('Ingresá la dirección');
      if (!fieldValue(container, '#provincia')) return fail('Seleccioná la provincia');
      if (!fieldValue(container, '#ciudad')) return fail('Seleccioná la ciudad');
      return ok();
    },
    'tour-prop-caracteristicas': (container) => {
      if (!fieldValue(container, '#operationType')) return fail('Elegí alquiler o venta');
      if (!fieldValue(container, '#typeProperty')) return fail('Seleccioná el tipo de propiedad');
      return ok();
    },
    'tour-prop-precio': (container) => {
      const price = fieldValue(container, '#price');
      if (!price || Number(price) <= 0) return fail('Ingresá un precio válido');
      return ok();
    },
    'tour-prop-imagenes': INFO_OK,
    'tour-prop-guardar': INFO_OK,
  },

  contratos: {
    'tour-contrato-propiedad': INFO_OK,
    'tour-contrato-pasos': INFO_OK,
    'tour-contrato-inquilino': (container) => {
      const id = fieldValue(container, '#tour-contrato-locatarioId');
      if (!id) return fail('Seleccioná o creá el inquilino');
      return ok();
    },
    'tour-contrato-condiciones': (container) => {
      if (!fieldValue(container, '[name="startDate"]')) return fail('Ingresá la fecha de inicio');
      const rent = fieldValue(container, '[name="rentAmount"]');
      if (!rent || Number(rent) <= 0) return fail('Ingresá el monto de alquiler');
      if (!fieldValue(container, '[name="updateFrequency"]')) {
        return fail('Seleccioná la frecuencia de actualización');
      }
      const months = fieldValue(container, '[name="totalMonths"]');
      if (!months || Number(months) <= 0) return fail('Ingresá la duración en meses');
      return ok();
    },
    'tour-contrato-siguiente': (container) => {
      const inquilino = document.getElementById('tour-contrato-inquilino');
      const condiciones = document.getElementById('tour-contrato-condiciones');
      const steps = [
        FORM_TOUR_VALIDATORS.contratos['tour-contrato-inquilino'](inquilino),
        FORM_TOUR_VALIDATORS.contratos['tour-contrato-condiciones'](condiciones),
      ];
      const failed = steps.find((s) => !s.valid);
      return failed || ok();
    },
  },

  compraventa: {
    'tour-venta-propiedad': INFO_OK,
    'tour-venta-comprador': (container) => {
      const id = fieldValue(container, '#tour-venta-compradorId');
      if (!id) return fail('Seleccioná el comprador de la lista');
      return ok();
    },
    'tour-venta-precio': (container) => {
      const price = fieldValue(container, '[name="salePrice"]');
      if (!price || Number(price) <= 0) return fail('Ingresá el precio de venta');
      return ok();
    },
    'tour-venta-guardar': INFO_OK,
  },

  recibos: {
    'tour-pago-contrato': INFO_OK,
    'tour-pago-monto': (container) => {
      if (!fieldValue(container, '[name="paymentDate"]')) return fail('Ingresá la fecha del pago');
      const amount = fieldValue(container, '[name="amount"]');
      if (!amount || Number(amount) <= 0) return fail('Ingresá un monto válido');
      return ok();
    },
    'tour-pago-detalle': (container) => {
      const type = fieldValue(container, '#tour-pago-type') || fieldValue(container, '[name="type"]');
      if (!type) return fail('Seleccioná el tipo de pago');
      if (type === 'installment') {
        const cuota = fieldValue(container, '#tour-pago-installmentNumber');
        const period = fieldValue(container, '[name="period"]');
        if (!cuota && !period) return fail('Seleccioná la cuota a pagar');
      } else if (type !== 'initial' && !fieldValue(container, '[name="period"]')) {
        return fail('Ingresá el período del pago');
      }
      return ok();
    },
    'tour-pago-guardar': INFO_OK,
  },

  'seleccion-alquiler': {
    'tour-listado-intro': INFO_OK,
    'tour-listado-seleccion': INFO_OK,
  },

  'seleccion-venta': {
    'tour-listado-intro': INFO_OK,
    'tour-listado-seleccion': INFO_OK,
  },

  'seleccion-contrato': {
    'tour-contratos-intro': INFO_OK,
    'tour-contratos-seleccion': INFO_OK,
  },

  'loteos-intro': {
    'tour-loteos-tabs': INFO_OK,
    'tour-loteos-nuevo-btn': INFO_OK,
    'tour-loteos-ver': INFO_OK,
  },

  'loteos-detalle': {
    'tour-loteos-detalle-info': INFO_OK,
    'tour-loteos-plano-map': INFO_OK,
    'tour-loteos-venta-plan': INFO_OK,
  },

  'loteos-proyecto': {
    'tour-loteo-identidad': (container) => {
      const name = fieldValue(container, '#tour-loteo-name');
      if (!name) return fail('Ingresá el nombre del loteo');
      return ok();
    },
    'tour-loteo-ubicacion': INFO_OK,
    'tour-loteo-guardar': INFO_OK,
  },

  'loteos-lote': {
    'tour-lote-identificacion': (container) => {
      const num = fieldValue(container, '#tour-lote-number');
      if (!num || Number(num) <= 0) return fail('Ingresá el número de lote');
      return ok();
    },
    'tour-lote-precio': INFO_OK,
    'tour-lote-guardar': INFO_OK,
  },

  'loteos-venta': {
    'tour-venta-lote-comprador': (container) => {
      const name = fieldValue(container, '#tour-venta-lote-clienteNombre');
      if (!name) return fail('Ingresá el nombre del comprador');
      return ok();
    },
    'tour-venta-lote-condiciones': (container) => {
      const price = fieldValue(container, '#tour-venta-lote-precioTotal');
      if (!price || Number(price) <= 0) return fail('Ingresá el precio total');
      return ok();
    },
    'tour-venta-lote-plan': (container) => {
      const modo = fieldValue(container, '#tour-venta-lote-modoPlan');
      if (modo === 'personalizado') {
        const count = fieldValue(container, '#tour-venta-lote-customCount');
        if (!count || Number(count) === 0) return fail('Agregá al menos una cuota con fecha');
      } else {
        const cuotas = fieldValue(container, '#tour-venta-lote-cantidadCuotas');
        if (!cuotas || Number(cuotas) <= 0) return fail('Ingresá la cantidad de cuotas');
      }
      return ok();
    },
    'tour-venta-lote-guardar': INFO_OK,
  },

  'loteos-cobranzas': {
    'tour-cobranzas-resumen': INFO_OK,
    'tour-cobranzas-tabla': INFO_OK,
  },
};

export function validateFormTourStep(tourKey, stepElementId, container) {
  const validator = FORM_TOUR_VALIDATORS[tourKey]?.[stepElementId];
  if (!validator) return ok();
  const root = container || document.getElementById(stepElementId);
  if (!root) return fail('Completá los campos resaltados');
  return validator(root);
}
