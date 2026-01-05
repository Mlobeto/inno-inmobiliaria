import { 
  IoHomeSharp, 
  IoPeopleSharp, 
  IoDocumentTextSharp, 
  IoLogoWhatsapp, 
  IoCashSharp, 
  IoStatsChartSharp,
  IoCloudDownloadSharp,
  IoCheckmarkCircleSharp
} from 'react-icons/io5';

function LandingFeatures() {
  const features = [
    {
      icon: <IoHomeSharp className="text-4xl text-indigo-600" />,
      title: "Gestión de Propiedades",
      description: "Alta, edición y seguimiento completo de propiedades. Carga múltiples fotos, estados y características detalladas.",
      items: ["Carga de fotos ilimitadas", "Estados dinámicos", "Búsqueda avanzada"]
    },
    {
      icon: <IoPeopleSharp className="text-4xl text-indigo-600" />,
      title: "Gestión de Clientes",
      description: "Administra propietarios, vendedores, inquilinos y garantes desde un solo lugar con roles automáticos.",
      items: ["Roles dinámicos", "Historial completo", "Documentación asociada"]
    },
    {
      icon: <IoDocumentTextSharp className="text-4xl text-indigo-600" />,
      title: "Contratos Personalizables",
      description: "Genera contratos de alquiler y autorizaciones de venta en PDF con tu propio template editable.",
      items: ["Editor de plantillas", "Variables dinámicas", "Descarga en PDF"]
    },
    {
      icon: <IoLogoWhatsapp className="text-4xl text-indigo-600" />,
      title: "Integración WhatsApp",
      description: "Copia respuestas automáticas con características de propiedades y plantillas de requisitos para enviar rápidamente.",
      items: ["Respuestas predefinidas", "Plantilla de requisitos", "Envío rápido"]
    },
    {
      icon: <IoCashSharp className="text-4xl text-indigo-600" />,
      title: "Seguimiento de Pagos",
      description: "Registra pagos mensuales de alquileres, genera recibos y recibe notificaciones de vencimientos.",
      items: ["Registro de pagos", "Recibos automáticos", "Alertas de vencimiento"]
    },
    {
      icon: <IoStatsChartSharp className="text-4xl text-indigo-600" />,
      title: "Estadísticas y Reportes",
      description: "Dashboard con métricas clave, propiedades más consultadas y comisiones generadas.",
      items: ["Métricas en tiempo real", "Reportes por período", "Rendimiento por agente"]
    },
    {
      icon: <IoCloudDownloadSharp className="text-4xl text-indigo-600" />,
      title: "Exportación de Datos",
      description: "Exporta propiedades, clientes, contratos y pagos a Excel o CSV para análisis externos.",
      items: ["Excel/CSV", "Reportes personalizados", "Backup de datos"]
    },
    {
      icon: <IoCheckmarkCircleSharp className="text-4xl text-indigo-600" />,
      title: "Actualización Automática",
      description: "Ajusta alquileres por inflación/IPC automáticamente con cálculos y notificaciones.",
      items: ["Ajuste por IPC", "Cálculo automático", "Historial de ajustes"]
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para gestionar tu inmobiliaria
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una plataforma completa que simplifica cada aspecto de tu operación diaria
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition border border-gray-100"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <IoCheckmarkCircleSharp className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingFeatures;
