import { runDriverTour } from './driverTour';

function buildPanelSteps() {
  const steps = [
    {
      element: '#panel-tour-welcome',
      popover: {
        title: 'Tu panel de control',
        description: 'Desde acá ves el resumen de tu inmobiliaria y accedés a todos los módulos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#panel-tour-stats',
      popover: {
        title: 'Métricas rápidas',
        description: 'Clientes, propiedades, contratos y recibos se actualizan automáticamente a medida que cargás datos.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour-module="clientes"]',
      popover: {
        title: '1 · Clientes',
        description: 'Empezá registrando propietarios, inquilinos o compradores. Son la base de contratos y operaciones.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour-module="propiedades"]',
      popover: {
        title: '2 · Propiedades',
        description: 'Cargá inmuebles con fotos, precio y datos. Podés generar fichas PDF y compartir por WhatsApp.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour-module="contratos"]',
      popover: {
        title: '3 · Contratos',
        description: 'Generá contratos de alquiler u órdenes de venta vinculando cliente y propiedad.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour-module="recibos"]',
      popover: {
        title: 'Recibos de pago',
        description: 'Registrá cobros de cuotas y descargá recibos con los datos de tu inmobiliaria.',
        side: 'bottom',
      },
    },
    {
      element: '#panel-tour-config',
      popover: {
        title: 'Configuración',
        description: 'Logo, plantillas PDF, WhatsApp e integraciones. Podés volver cuando quieras.',
        side: 'bottom',
        align: 'end',
      },
    },
  ];

  if (document.querySelector('#panel-tour-subscription')) {
    steps.splice(2, 0, {
      element: '#panel-tour-subscription',
      popover: {
        title: 'Tu plan de prueba',
        description: 'Acá ves los días restantes del trial. Cuando quieras, gestioná tu suscripción desde "Mi plan".',
        side: 'bottom',
      },
    });
  }

  return steps;
}

export function startPanelWelcomeTour({ onComplete } = {}) {
  return runDriverTour(buildPanelSteps(), {
    doneBtnText: '¡Empezar!',
    onComplete,
  });
}
