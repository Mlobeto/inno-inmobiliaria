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
};

export function validateFormTourStep(tourKey, stepElementId, container) {
  const validator = FORM_TOUR_VALIDATORS[tourKey]?.[stepElementId];
  if (!validator) return ok();
  const root = container || document.getElementById(stepElementId);
  if (!root) return fail('Completá los campos resaltados');
  return validator(root);
}
