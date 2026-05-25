/** Pasos del tour — formulario nuevo cliente */
export function getClientesFormTourSteps() {
  return [
    {
      element: '#tour-cliente-identidad',
      popover: {
        title: 'Identificación del cliente',
        description: 'Completá CUIL/DNI, nombre, email y teléfono. Estos datos se usan en contratos y recibos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-cliente-domicilio',
      popover: {
        title: 'Domicilio',
        description: 'Provincia, ciudad, código postal y dirección. Necesarios para documentos legales.',
        side: 'top',
      },
    },
    {
      element: '#tour-cliente-guardar',
      popover: {
        title: 'Guardar cliente',
        description: 'Al crearlo podés vincularlo como propietario, inquilino o comprador desde propiedades y contratos.',
        side: 'top',
        align: 'end',
      },
    },
  ];
}

/** Pasos del tour — alta de propiedad */
export function getPropiedadesFormTourSteps() {
  return [
    {
      element: '#tour-prop-cliente',
      popover: {
        title: 'Propietario',
        description: 'Elegí el cliente propietario. Si no existe, podés crearlo desde acá sin salir del formulario.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-prop-ubicacion',
      popover: {
        title: 'Ubicación',
        description: 'Dirección, barrio y localidad. Aparecen en fichas PDF, WhatsApp y tu página web.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-prop-caracteristicas',
      popover: {
        title: 'Tipo y características',
        description: 'Definí si es alquiler o venta, tipo de inmueble, ambientes y superficie.',
        side: 'top',
      },
    },
    {
      element: '#tour-prop-precio',
      popover: {
        title: 'Precio y comisión',
        description: 'Monto, moneda y comisión inmobiliaria. Podés ver el equivalente en dólares si aplica.',
        side: 'top',
      },
    },
    {
      element: '#tour-prop-imagenes',
      popover: {
        title: 'Fotos',
        description: 'Subí imágenes para fichas PDF, compartir por WhatsApp y publicar en tu web.',
        side: 'top',
      },
    },
    {
      element: '#tour-prop-guardar',
      popover: {
        title: 'Publicar propiedad',
        description: 'Guardá y después generá PDF, compartí por WhatsApp o creá un contrato desde el listado.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

/** Pasos del tour — contrato de alquiler (paso 1 del wizard) */
export function getContratosFormTourSteps() {
  return [
    {
      element: '#tour-contrato-propiedad',
      popover: {
        title: 'Propiedad seleccionada',
        description: 'Acá ves el inmueble y el propietario. Los montos se precargan desde la ficha de la propiedad.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-contrato-pasos',
      popover: {
        title: 'Dos pasos',
        description: 'Primero completás datos del contrato; después elegís garantía (garantes o seguro de caución).',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-contrato-inquilino',
      popover: {
        title: 'Inquilino',
        description: 'Buscá un cliente existente o creá uno nuevo con el botón +.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-contrato-condiciones',
      popover: {
        title: 'Condiciones del alquiler',
        description: 'Fecha de inicio, monto, actualización por IPC, honorarios y duración en meses.',
        side: 'top',
      },
    },
    {
      element: '#tour-contrato-siguiente',
      popover: {
        title: 'Siguiente: garantía',
        description: 'Continuá al paso 2 para definir garantes o seguro de caución, y luego generá el contrato PDF.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}
