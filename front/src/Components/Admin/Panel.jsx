import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllClients, getAllProperties, getAllLeases, getAllPayments } from '../../redux/Actions/actions';
import { 
  IoLogOutOutline, 
  IoPeopleOutline, 
  IoHomeOutline, 
  IoDocumentTextOutline, 
  IoReceiptOutline, 
  IoStatsChartOutline
} from 'react-icons/io5';
import UpcomingExpiryPopup from '../Contratos/UpcomingExpiryPopup';

const Panel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Obtener datos desde Redux
  const { clients = [], properties = [], leases = [], payments = [], loading } = useSelector((state) => ({
    clients: state.clients || [],
    properties: state.properties || [],
    leases: state.leases || [],
    payments: state.allPayments || [],
    loading: state.loading
  }));

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    dispatch(getAllClients());
    dispatch(getAllProperties());
    dispatch(getAllLeases());
    dispatch(getAllPayments());
  }, [dispatch]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    return {
      clientesActivos: clients.filter(client => 
        client.properties && client.properties.length > 0
      ).length,
      totalPropiedades: properties.length,
      contratosActivos: leases.filter(lease => lease.status === 'active').length,
      totalRecibos: payments.length
    };
  }, [clients, properties, leases, payments]);

  const handleLogout = () => {
    // Aquí agregarías tu lógica de logout
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Clientes',
      path: '/panelClientes',
      icon: IoPeopleOutline,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      description: 'Gestionar clientes'
    },
    {
      title: 'Propiedades',
      path: '/panelPropiedades',
      icon: IoHomeOutline,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 to-emerald-700',
      description: 'Administrar propiedades'
    },
    {
      title: 'Contratos',
      path: '/panelContratos',
      icon: IoDocumentTextOutline,
      gradient: 'from-amber-500 to-orange-500',
      hoverGradient: 'from-amber-600 to-orange-600',
      description: 'Gestionar contratos'
    },
    {
      title: 'Recibos',
      path: '/create-payment',
      icon: IoReceiptOutline,
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700',
      description: 'Generar recibos'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mostrar el popup de vencimientos */}
      <UpcomingExpiryPopup />

      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link 
            to="/" 
            className="text-white text-xl font-bold hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2"
          >
            <IoHomeOutline className="w-6 h-6" />
            <span>Panel de Administración</span>
          </Link>
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
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bienvenido al Panel de Control
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Gestiona todos los aspectos de tu inmobiliaria desde un solo lugar
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative bg-gradient-to-br ${item.gradient} hover:${item.hoverGradient} p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10`}
              >
                <div className="flex flex-col items-center space-y-4 text-white">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold">{item.title}</h3>
                    <p className="text-sm text-white/80 mt-1">{item.description}</p>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </div>

        {/* Informes Section - Full Width */}
        <div className="w-full">
          <Link
            to="/PanelInformes"
            className="group block w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-white/10"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-white">
              <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                <IoStatsChartOutline className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl font-bold">Informes y Estadísticas</h3>
                <p className="text-white/80 mt-2">Analiza el rendimiento de tu negocio con reportes detallados</p>
              </div>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <IoStatsChartOutline className="w-6 h-6 mr-2" />
            Vista Rápida
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Clientes Activos', value: loading ? '...' : stats.clientesActivos, icon: IoPeopleOutline, color: 'blue' },
              { label: 'Propiedades', value: loading ? '...' : stats.totalPropiedades, icon: IoHomeOutline, color: 'emerald' },
              { label: 'Contratos Activos', value: loading ? '...' : stats.contratosActivos, icon: IoDocumentTextOutline, color: 'amber' },
              { label: 'Recibos', value: loading ? '...' : stats.totalRecibos, icon: IoReceiptOutline, color: 'purple' }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 text-${stat.color}-400`} />
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-300">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panel;