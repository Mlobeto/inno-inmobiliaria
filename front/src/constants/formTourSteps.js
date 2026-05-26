/** Pasos del tour — formulario nuevo cliente */
export function getClientesFormTourSteps() {
  return [
    {
      element: '#tour-cliente-identidad',
      popover: {
        title: 'Identificación del cliente',
        description: 'Completá CUIL/DNI, nombre y teléfono. No podés avanzar hasta tenerlos listos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-cliente-domicilio',
      popover: {
        title: 'Domicilio',
        description: 'Provincia, ciudad, CP y dirección. Completalos para seguir.',
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
        description: 'Elegí el propietario antes de continuar. Podés crear uno nuevo con +.',
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
        description: 'Buscá un inquilino o creá uno con +. Es obligatorio para seguir.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-contrato-condiciones',
      popover: {
        title: 'Condiciones del alquiler',
        description: 'Completá fecha, monto, frecuencia IPC y duración antes de avanzar.',
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

/** Selección de propiedad antes de crear contrato de alquiler */
export function getSeleccionAlquilerTourSteps() {
  return [
    {
      element: '#tour-listado-intro',
      popover: {
        title: 'Elegí una propiedad',
        description: 'Buscá el inmueble y tocá «Crear Contrato de Alquiler» en la tarjeta correspondiente.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-listado-seleccion',
      popover: {
        title: 'Acción en cada propiedad',
        description: 'Este botón abre el formulario de contrato con los datos del lote precargados.',
        side: 'top',
      },
    },
  ];
}

/** Selección de propiedad antes de compraventa */
export function getSeleccionVentaTourSteps() {
  return [
    {
      element: '#tour-listado-intro',
      popover: {
        title: 'Elegí una propiedad en venta',
        description: 'Seleccioná el inmueble y usá «Gestionar Compraventa» para asignar al comprador.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-listado-seleccion',
      popover: {
        title: 'Gestionar compraventa',
        description: 'Tocá este botón en la propiedad que querés vender.',
        side: 'top',
      },
    },
  ];
}

/** Selección de contrato antes de registrar un pago */
export function getSeleccionContratoTourSteps() {
  return [
    {
      element: '#tour-contratos-intro',
      popover: {
        title: 'Elegí un contrato',
        description: 'Buscá el contrato de alquiler activo para el cual querés registrar el cobro.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-contratos-seleccion',
      popover: {
        title: 'Seleccionar para pago',
        description: 'Tocá este botón para abrir el formulario de recibo con los datos del contrato.',
        side: 'top',
      },
    },
  ];
}

/** Compraventa — asignar comprador */
export function getCompraventaFormTourSteps() {
  return [
    {
      element: '#tour-venta-propiedad',
      popover: {
        title: 'Propiedad en venta',
        description: 'Verificá vendedor y precio antes de continuar.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-venta-comprador',
      popover: {
        title: 'Comprador',
        description: 'Buscá y seleccioná al comprador. Es obligatorio para seguir.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-venta-precio',
      popover: {
        title: 'Precio y comisión',
        description: 'Confirmá el precio de venta (y comisión si aplica).',
        side: 'top',
      },
    },
    {
      element: '#tour-venta-guardar',
      popover: {
        title: 'Asignar comprador',
        description: 'Al guardar, el cliente queda vinculado como comprador de esta propiedad.',
        side: 'top',
      },
    },
  ];
}

/** Recibo / pago de cuota de alquiler */
export function getRecibosFormTourSteps() {
  return [
    {
      element: '#tour-pago-contrato',
      popover: {
        title: 'Contrato',
        description: 'Confirmá inquilino, propiedad y monto de alquiler.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-pago-monto',
      popover: {
        title: 'Fecha y monto',
        description: 'Ingresá cuándo se cobró y cuánto. Podés elegir ARS o USD.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-pago-detalle',
      popover: {
        title: 'Cuota y tipo',
        description: 'Elegí el tipo de pago y seleccioná la cuota si corresponde.',
        side: 'top',
      },
    },
    {
      element: '#tour-pago-guardar',
      popover: {
        title: 'Registrar pago',
        description: 'Al crear el pago podés descargar el recibo PDF con tu membrete.',
        side: 'top',
      },
    },
  ];
}

/** Panel loteos — vista lista */
export function getLoteosIntroTourSteps() {
  return [
    {
      element: '#tour-loteos-tabs',
      popover: {
        title: 'Loteos y cobranzas',
        description: 'Gestioná proyectos de lotes y seguí las cuotas desde las pestañas.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-loteos-nuevo-btn',
      popover: {
        title: 'Crear proyecto',
        description: 'Empezá registrando un loteo con nombre, ubicación y cantidad de lotes.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '#tour-loteos-ver',
      popover: {
        title: 'Ver lotes',
        description: 'Entrá a cada proyecto para cargar lotes individuales y planes de venta.',
        side: 'top',
      },
    },
  ];
}

/** Detalle de un loteo — grid de lotes */
export function getLoteosDetalleTourSteps() {
  return [
    {
      element: '#tour-loteos-detalle-info',
      popover: {
        title: 'Proyecto seleccionado',
        description: 'Acá ves la info general del loteo. Podés editarlo o publicarlo en tu web.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-loteos-plano-map',
      popover: {
        title: 'Plano interactivo',
        description: 'Elegí una foto del loteo y arrastrá cada lote al lugar correcto. En la web se verá con colores: verde disponible, amarillo reservado, rojo vendido.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-loteos-venta-plan',
      popover: {
        title: 'Plan de venta',
        description: 'En cada lote podés registrar comprador, financiación y cuotas. También generar presupuesto PDF.',
        side: 'top',
      },
    },
  ];
}

/** Modal — alta de loteo (proyecto) */
export function getLoteosProyectoTourSteps() {
  return [
    {
      element: '#tour-loteo-identidad',
      popover: {
        title: 'Nombre del proyecto',
        description: 'El nombre es obligatorio. Ej: «Loteo Los Álamos».',
        side: 'bottom',
      },
    },
    {
      element: '#tour-loteo-ubicacion',
      popover: {
        title: 'Ubicación',
        description: 'Dirección, ciudad y provincia aparecen en fichas y documentos.',
        side: 'top',
      },
    },
    {
      element: '#tour-loteo-guardar',
      popover: {
        title: 'Guardar loteo',
        description: 'Después podés cargar lotes individuales y publicar el proyecto.',
        side: 'top',
      },
    },
  ];
}

/** Modal — alta de lote individual */
export function getLoteosLoteTourSteps() {
  return [
    {
      element: '#tour-lote-identificacion',
      popover: {
        title: 'Identificación',
        description: 'El número de lote es obligatorio. La parcela ayuda a ubicarlo en el plano.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-lote-precio',
      popover: {
        title: 'Precio y moneda',
        description: 'Definí el precio base del lote. Podés usar ARS o USD.',
        side: 'top',
      },
    },
    {
      element: '#tour-lote-guardar',
      popover: {
        title: 'Guardar lote',
        description: 'Luego asigná un plan de venta con el botón «Plan» en la grilla.',
        side: 'top',
      },
    },
  ];
}

/** Modal — plan de venta / financiación de lote */
export function getLoteosVentaTourSteps() {
  return [
    {
      element: '#tour-venta-lote-comprador',
      popover: {
        title: 'Comprador',
        description: 'Nombre completo obligatorio. CUIL y teléfono son recomendables para el contrato.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-venta-lote-condiciones',
      popover: {
        title: 'Condiciones de venta',
        description: 'Precio total, anticipo y comisión. El precio es obligatorio.',
        side: 'top',
      },
    },
    {
      element: '#tour-venta-lote-plan',
      popover: {
        title: 'Plan de financiación',
        description: 'Elegí cuotas periódicas o fechas personalizadas antes de registrar.',
        side: 'top',
      },
    },
    {
      element: '#tour-venta-lote-guardar',
      popover: {
        title: 'Registrar venta',
        description: 'Se generan las cuotas automáticamente. Podés cobrarlas desde Cobranzas.',
        side: 'top',
      },
    },
  ];
}

/** Pestaña cobranzas de loteos */
export function getLoteosCobranzasTourSteps() {
  return [
    {
      element: '#tour-cobranzas-resumen',
      popover: {
        title: 'Resumen de cobranzas',
        description: 'Cuotas vencidas, pendientes y cobradas del mes en un vistazo.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-cobranzas-tabla',
      popover: {
        title: 'Registrar pagos',
        description: 'Filtrá por estado, marcá cuotas como pagadas y descargá recibos PDF.',
        side: 'top',
      },
    },
  ];
}
