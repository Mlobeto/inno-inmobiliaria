import {
  IoHomeSharp,
  IoPeopleSharp,
  IoDocumentTextSharp,
  IoLogoWhatsapp,
  IoCashSharp,
  IoStatsChartSharp,
  IoCloudDownloadSharp,
  IoCheckmarkCircleSharp,
} from 'react-icons/io5';

function LandingFeatures() {
  const features = [
    {
      icon: IoHomeSharp,
      title: 'Gestión de Propiedades',
      description:
        'Alta, edición y seguimiento completo de propiedades. Carga múltiples fotos, estados y características detalladas.',
      items: ['Carga de fotos ilimitadas', 'Estados dinámicos', 'Búsqueda avanzada'],
    },
    {
      icon: IoPeopleSharp,
      title: 'Gestión de Clientes',
      description:
        'Administra propietarios, vendedores, inquilinos y garantes desde un solo lugar con roles automáticos.',
      items: ['Roles dinámicos', 'Historial completo', 'Documentación asociada'],
    },
    {
      icon: IoDocumentTextSharp,
      title: 'Contratos Personalizables',
      description:
        'Genera contratos de alquiler y autorizaciones de venta en PDF con tu propio template editable.',
      items: ['Editor de plantillas', 'Variables dinámicas', 'Descarga en PDF'],
    },
    {
      icon: IoLogoWhatsapp,
      title: 'Integración WhatsApp',
      description:
        'Copia respuestas automáticas con características de propiedades y plantillas de requisitos para enviar rápidamente.',
      items: ['Respuestas predefinidas', 'Plantilla de requisitos', 'Envío rápido'],
    },
    {
      icon: IoCashSharp,
      title: 'Seguimiento de Pagos',
      description:
        'Registra pagos mensuales de alquileres, genera recibos y recibe notificaciones de vencimientos.',
      items: ['Registro de pagos', 'Recibos automáticos', 'Alertas de vencimiento'],
    },
    {
      icon: IoStatsChartSharp,
      title: 'Estadísticas y Reportes',
      description:
        'Dashboard con métricas clave, propiedades más consultadas y comisiones generadas.',
      items: ['Métricas en tiempo real', 'Reportes por período', 'Rendimiento por agente'],
    },
    {
      icon: IoCloudDownloadSharp,
      title: 'Exportación de Datos',
      description:
        'Exporta propiedades, clientes, contratos y pagos a Excel o CSV para análisis externos.',
      items: ['Excel/CSV', 'Reportes personalizados', 'Backup de datos'],
    },
    {
      icon: IoCheckmarkCircleSharp,
      title: 'Actualización Automática',
      description:
        'Ajusta alquileres por inflación/IPC automáticamente con cálculos y notificaciones.',
      items: ['Ajuste por IPC', 'Cálculo automático', 'Historial de ajustes'],
    },
  ];

  return (
    <section id="funcionalidades" className="py-16 sm:py-20 bg-bgBase font-Montserrat border-t border-borderBase">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <p className="text-brand-light text-sm font-semibold uppercase tracking-wider mb-2">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-textPrimary mb-3">
            Todo lo que necesitás para gestionar tu inmobiliaria
          </h2>
          <p className="text-base sm:text-lg text-textSecondary max-w-3xl mx-auto">
            Una plataforma completa que simplifica cada aspecto de tu operación diaria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-bgSurface border border-borderBase hover:border-borderStrong rounded-xl p-5 sm:p-6 transition-all hover:shadow-brandGlow"
              >
                <div className="mb-4 inline-flex rounded-lg bg-brand-muted p-2.5">
                  <Icon className="text-2xl text-brand-light" />
                </div>
                <h3 className="text-lg font-bold text-textPrimary mb-2">{feature.title}</h3>
                <p className="text-textSecondary mb-4 text-sm leading-relaxed">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-textSecondary">
                      <IoCheckmarkCircleSharp className="text-brand-light mt-0.5 flex-shrink-0 w-4 h-4" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LandingFeatures;
