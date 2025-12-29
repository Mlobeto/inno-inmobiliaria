import { Link, useNavigate } from 'react-router-dom';
import { 
  IoLogOutOutline, 
  IoArrowBackOutline, 
  IoHomeOutline,
  IoDocumentTextOutline,
  IoListOutline,
  IoKeyOutline,
  IoBusinessOutline,
  IoWarningOutline,
  IoCalculatorOutline
} from 'react-icons/io5';

const PanelContratos = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí agregarías tu lógica de logout
    navigate('/panel'); // Redirigir al panel después del logout
  };

  const contractOptions = [
    {
      to: "/leaseList",
      title: "Listado de Contratos",
      description: "Ver y gestionar todos los contratos existentes",
      icon: IoListOutline,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700"
    },
    {
      to: "/contratoAlquiler",
      title: "Contrato de Alquiler",
      description: "Crear nuevos contratos de alquiler",
      icon: IoKeyOutline,
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700"
    },
    {
      to: "/sale",
      title: "Compra Venta",
      description: "Gestionar contratos de compraventa",
      icon: IoBusinessOutline,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header moderno */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)} 
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <span className="text-white font-medium">Panel de Contratos</span>
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="text-white hover:text-red-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30"
          >
            <span className="hidden sm:inline">Salir</span>
            <IoLogOutOutline className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Header principal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoDocumentTextOutline className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Panel de Contratos
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
              Gestiona todos los aspectos relacionados con contratos de alquiler, compraventa y seguimiento de alertas
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Grid de opciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {contractOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Link
                key={index}
                to={option.to}
                className={`group relative overflow-hidden bg-gradient-to-br ${option.color} ${option.hoverColor} rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-6 group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                    {option.description}
                  </p>
                </div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-16 translate-y-16 group-hover:scale-150 transition-transform duration-500" />
              </Link>
            );
          })}
        </div>

        {/* Sección de Alertas y Actualización */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Link
            to="/alertas"
            className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl block"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-6 group-hover:bg-white/30 transition-colors duration-300">
                <IoWarningOutline className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                Centro de Alertas
              </h3>
              <p className="text-white/80 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                Monitorea vencimientos de contratos, pagos pendientes y notificaciones importantes del sistema
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full transform translate-x-20 translate-y-20 group-hover:scale-150 transition-transform duration-500" />
          </Link>

          <Link
            to="/actualizarAlquileres"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl block"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-xl mb-6 group-hover:bg-white/30 transition-colors duration-300">
                <IoCalculatorOutline className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                Actualizar Alquileres
              </h3>
              <p className="text-white/80 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                Actualiza los montos de alquiler según IPC y genera PDFs de actualización automáticamente
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full transform translate-x-20 translate-y-20 group-hover:scale-150 transition-transform duration-500" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PanelContratos;