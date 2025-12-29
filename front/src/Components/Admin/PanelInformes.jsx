import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IoLogOutOutline,
  IoArrowBackOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoCashOutline,
  IoStatsChartOutline
} from 'react-icons/io5';

const PanelInformes = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/panel');
  };

  const informeActions = [
    {
      title: 'Informes',
      path: '/reportes',
      icon: IoDocumentTextOutline,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      description: 'Generar informes y reportes'
    },
    {
      title: 'Pagos por Contrato',
      path: '/paymentList',
      icon: IoCashOutline,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 to-emerald-700',
      description: 'Gestionar pagos de contratos'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link 
              to="/panel" 
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver al Panel</span>
            </Link>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <Link to="/panel" className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </Link>
              <span>/</span>
              <span className="text-white font-medium">Informes</span>
            </nav>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-white flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all duration-300"
          >
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
            <IoLogOutOutline className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-500/20 rounded-full">
              <IoStatsChartOutline className="w-12 h-12 text-purple-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Informes y Reportes
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Accede a informes detallados y gestiona los pagos de contratos
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          {informeActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className={`group relative bg-gradient-to-br ${action.gradient} hover:${action.hoverGradient} p-8 sm:p-12 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10`}
              >
                <div className="flex flex-col items-center space-y-6 text-white">
                  <div className="p-6 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{action.title}</h3>
                    <p className="text-white/80 text-sm sm:text-base">{action.description}</p>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PanelInformes;