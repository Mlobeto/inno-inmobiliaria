import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  selectCurrentUser, 
  logout as logoutAction, 
  useGetCurrentSubscriptionQuery,
  useGetAllClientsQuery,
  useGetAllPropertiesQuery,
  useGetAllLeasesQuery,
  useGetAllPaymentsQuery,
} from '@shared/redux';
import { 
  IoLogOutOutline, 
  IoPeopleOutline, 
  IoHomeOutline, 
  IoDocumentTextOutline, 
  IoReceiptOutline, 
  IoStatsChartOutline,
  IoSettingsOutline,
  IoBusiness,
  IoRocketOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline
} from 'react-icons/io5';
import UpcomingExpiryPopup from '../Contratos/UpcomingExpiryPopup';

const Panel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Obtener usuario actual (incluye tenantId)
  const currentUser = useSelector(selectCurrentUser);
  
  // Obtener suscripción actual usando RTK Query
  const { data: subscriptionData, isLoading: loadingSubscription } = useGetCurrentSubscriptionQuery(
    undefined,
    { skip: !currentUser?.tenantId } // Solo cargar si hay tenantId
  );

  // Obtener datos usando RTK Query
  const { data: clients = [], isLoading: loadingClients } = useGetAllClientsQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );
  
  const { data: properties = [], isLoading: loadingProperties } = useGetAllPropertiesQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );
  
  const { data: leases = [], isLoading: loadingLeases } = useGetAllLeasesQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );
  
  const { data: payments = [], isLoading: loadingPayments } = useGetAllPaymentsQuery(
    undefined,
    { skip: !currentUser?.tenantId }
  );

  // Estado de carga general
  const loading = loadingClients || loadingProperties || loadingLeases || loadingPayments;

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
    dispatch(logoutAction());
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  // Helpers para suscripción
  const subscription = subscriptionData?.subscription;
  
  const getPlanName = (planId) => {
    const plans = {
      free: 'Gratis',
      basic: 'Básico',
      professional: 'Profesional',
      enterprise: 'Empresarial'
    };
    return plans[planId] || planId?.toUpperCase();
  };
  
  const getPlanColor = (planId) => {
    const colors = {
      free: 'from-gray-500 to-gray-600',
      basic: 'from-blue-500 to-blue-600',
      professional: 'from-purple-500 to-purple-600',
      enterprise: 'from-yellow-500 to-yellow-600'
    };
    return colors[planId] || 'from-gray-500 to-gray-600';
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      trialing: { text: 'Periodo de Prueba', color: 'bg-blue-500' },
      active: { text: 'Activo', color: 'bg-green-500' },
      past_due: { text: 'Vencido', color: 'bg-red-500' },
      canceled: { text: 'Cancelado', color: 'bg-gray-500' }
    };
    return badges[status] || { text: status, color: 'bg-gray-500' };
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
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-white text-xl font-bold hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2"
            >
              <IoBusiness className="w-6 h-6" />
              <span className="hidden sm:inline">{currentUser?.username || 'Panel de Administración'}</span>
            </Link>
            {currentUser?.tenantId && (
              <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm">
                <IoBusiness className="w-4 h-4 mr-1" />
                Tenant ID: {currentUser.tenantId}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/company-settings"
              className="text-white flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 transition-all duration-300"
            >
              <IoSettingsOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Configuración</span>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Bienvenido, {currentUser?.username || 'Usuario'}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Gestiona todos los aspectos de tu inmobiliaria desde un solo lugar
          </p>
          {currentUser?.email && (
            <p className="text-slate-400 text-sm mt-2">{currentUser.email}</p>
          )}
        </div>

        {/* Suscripción Card */}
        {currentUser?.tenantId && (
          <div className="mb-8">
            {loadingSubscription ? (
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ) : subscription ? (
              <div className={`bg-gradient-to-br ${getPlanColor(subscription.planId)} p-6 rounded-2xl shadow-lg border border-white/20`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <IoRocketOutline className="w-8 h-8 text-white" />
                      <div>
                        <h3 className="text-2xl font-bold text-white">Plan {getPlanName(subscription.planId)}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadge(subscription.status).color}`}>
                            {getStatusBadge(subscription.status).text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/90">
                      <div className="flex items-center space-x-2">
                        <IoCalendarOutline className="w-5 h-5" />
                        <div>
                          <p className="text-xs text-white/70">Vencimiento</p>
                          <p className="font-semibold">
                            {subscription.currentPeriodEnd 
                              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })
                              : 'Sin fecha'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {subscription.Plan && (
                        <div className="flex items-center space-x-2">
                          <IoCheckmarkCircleOutline className="w-5 h-5" />
                          <div>
                            <p className="text-xs text-white/70">Características</p>
                            <p className="font-semibold">{subscription.Plan.name || 'Plan Activo'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate('/subscriptions/manage')}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-colors border border-white/30"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-6 rounded-2xl shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <IoRocketOutline className="w-8 h-8 text-white" />
                    <div>
                      <h3 className="text-2xl font-bold text-white">Sin Suscripción Activa</h3>
                      <p className="text-white/80 mt-1">Activa una suscripción para acceder a todas las funcionalidades</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/subscriptions/plans')}
                    className="px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Ver Planes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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