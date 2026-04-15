/**
 * Platform Admin Dashboard - Ejemplo de uso de Redux
 * 
 * Este componente demuestra cómo usar RTK Query hooks y estado local
 * para crear una interfaz interactiva con tabs y navegación.
 */


import { useSelector, useDispatch } from 'react-redux';

// Importar hooks y actions desde shared (compartido con mobile)
import {
  useGetDashboardQuery,
  useGetMetricsQuery,
  useGetRevenueQuery,
  setActiveView,
  selectActiveView,
} from '@shared/redux';

const PlatformDashboard = () => {
  const dispatch = useDispatch();
  const activeView = useSelector(selectActiveView);
  
  // RTK Query - hace el fetch automáticamente al montar el componente
  // También maneja loading, error, refetch, cache, etc.
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useGetDashboardQuery();
  
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
  } = useGetMetricsQuery();
  
  const {
    data: revenueData,
    isLoading: isRevenueLoading,
  } = useGetRevenueQuery({ period: 'month' });
  
  // Tabs de navegación
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'metrics', label: 'Métricas', icon: '📈' },
    { id: 'revenue', label: 'Ingresos', icon: '💰' },
  ];
  
  // Función para cambiar de vista
  const handleTabChange = (tabId) => {
    dispatch(setActiveView(tabId));
  };
  
  // Estados de carga
  if (isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Error
  if (isDashboardError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error al cargar dashboard</div>
          <p className="text-gray-600 mb-4">{dashboardError?.data?.message || 'Error desconocido'}</p>
          <button
            onClick={refetchDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  // Datos disponibles
  const dashboard = dashboardData?.data;
  const metrics = metricsData?.data;
  const revenue = revenueData?.data;
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Platform Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Panel de control de AdminProp</p>
      </div>
      
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Content Based on Active View */}
      {activeView === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Tenants */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Tenants</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.tenants?.total || 0}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-green-600">✅ {dashboard?.tenants?.active || 0} activos</span>
                <span className="text-red-600">⏸️ {dashboard?.tenants?.suspended || 0} suspendidos</span>
              </div>
            </div>
            
            {/* Active Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Suscripciones Activas</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.subscriptions?.active || 0}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <span className="text-2xl">💳</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-blue-600">🔄 {dashboard?.subscriptions?.trial || 0} trial</span>
                <span className="text-green-600">💰 {dashboard?.subscriptions?.paid || 0} pagadas</span>
              </div>
            </div>
            
            {/* MRR */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">MRR (Mensual)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${dashboard?.revenue?.mrr?.toLocaleString('es-AR') || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <span className="text-2xl">💵</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                ARR: ${dashboard?.revenue?.arr?.toLocaleString('es-AR') || 0}
              </p>
            </div>
            
            {/* Churn Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Churn Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.metrics?.churnRate || 0}%</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <span className="text-2xl">📉</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Conversión: {dashboard?.metrics?.conversionRate || 0}%
              </p>
            </div>
          </div>
          
          {/* Métricas Avanzadas Preview */}
          {!isMetricsLoading && metrics && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Growth Rate (30 días)</p>
                  <p className="text-2xl font-bold text-green-600">+{metrics.growthRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">{metrics.newTenants} nuevos tenants</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Engagement Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.engagementRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {metrics.activeTenantsWithData}/{metrics.totalActiveTenants} con actividad
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Retention Rate (90 días)</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.retentionRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Avg subs: ${metrics.avgSubscriptionValue?.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Nuevos Tenants Este Mes */}
          {dashboard?.tenants?.newThisMonth > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                🎉 <strong>{dashboard.tenants.newThisMonth}</strong> nuevos tenants este mes!
              </p>
            </div>
          )}
        </>
      )}
      
      {/* Metrics View */}
      {activeView === 'metrics' && (
        <div className="space-y-6">
          {isMetricsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando métricas...</p>
            </div>
          ) : metrics ? (
            <>
              {/* Growth Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📈 Crecimiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-gray-500 text-sm mb-1">Growth Rate</p>
                    <p className="text-3xl font-bold text-green-600">+{metrics.growthRate}%</p>
                    <p className="text-sm text-gray-500 mt-2">Últimos 30 días</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-gray-500 text-sm mb-1">Nuevos Tenants</p>
                    <p className="text-3xl font-bold text-blue-600">{metrics.newTenants}</p>
                    <p className="text-sm text-gray-500 mt-2">Este mes</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="text-gray-500 text-sm mb-1">Tasa de Conversión</p>
                    <p className="text-3xl font-bold text-purple-600">{metrics.conversionRate || 0}%</p>
                    <p className="text-sm text-gray-500 mt-2">Trial → Paid</p>
                  </div>
                </div>
              </div>
              
              {/* Engagement Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">🎯 Engagement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Tenants Activos con Datos</span>
                      <span className="font-bold text-gray-900">{metrics.engagementRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${metrics.engagementRate}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {metrics.activeTenantsWithData} de {metrics.totalActiveTenants} tenants activos
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Retention Rate (90 días)</span>
                      <span className="font-bold text-gray-900">{metrics.retentionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${metrics.retentionRate}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Valor promedio: ${metrics.avgSubscriptionValue?.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Churn & Conversion */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Conversión y Retención</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Churn Rate</p>
                    <p className="text-4xl font-bold text-red-600">{dashboard?.metrics?.churnRate || 0}%</p>
                    <p className="text-sm text-gray-500 mt-2">Cancelaciones/mes</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Tasa de Conversión</p>
                    <p className="text-4xl font-bold text-green-600">{dashboard?.metrics?.conversionRate || 0}%</p>
                    <p className="text-sm text-gray-500 mt-2">Trial a Paid</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600 text-sm mb-2">Retention</p>
                    <p className="text-4xl font-bold text-blue-600">{metrics.retentionRate}%</p>
                    <p className="text-sm text-gray-500 mt-2">Últimos 90 días</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay datos de métricas disponibles
            </div>
          )}
        </div>
      )}
      
      {/* Revenue View */}
      {activeView === 'revenue' && (
        <div className="space-y-6">
          {isRevenueLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando datos de ingresos...</p>
            </div>
          ) : revenue ? (
            <>
              {/* Revenue Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-blue-100 text-sm mb-2">MRR (Monthly Recurring Revenue)</p>
                  <p className="text-4xl font-bold">${revenue.mrr?.toLocaleString('es-AR') || 0}</p>
                  <p className="text-blue-100 text-sm mt-2">Ingreso mensual recurrente</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-green-100 text-sm mb-2">ARR (Annual Recurring Revenue)</p>
                  <p className="text-4xl font-bold">${revenue.arr?.toLocaleString('es-AR') || 0}</p>
                  <p className="text-green-100 text-sm mt-2">Proyección anual</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-purple-100 text-sm mb-2">Total Este Mes</p>
                  <p className="text-4xl font-bold">${revenue.totalRevenue?.toLocaleString('es-AR') || 0}</p>
                  <p className="text-purple-100 text-sm mt-2">Ingresos acumulados</p>
                </div>
              </div>
              
              {/* Revenue by Plan */}
              {revenue.byPlan && revenue.byPlan.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">💰 Ingresos por Plan</h2>
                  <div className="space-y-4">
                    {revenue.byPlan.map((plan, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-gray-900">{plan.planName}</span>
                            <span className="text-sm text-gray-500">
                              {plan.subscriptions} suscripciones
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(plan.revenue / revenue.totalRevenue) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-6 text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ${plan.revenue?.toLocaleString('es-AR')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {((plan.revenue / revenue.totalRevenue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional Revenue Metrics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Métricas Adicionales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Valor Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${metrics?.avgSubscriptionValue?.toLocaleString('es-AR') || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Por suscripción</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Suscripciones Pagadas</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard?.subscriptions?.paid || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Activas actualmente</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Trial Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard?.subscriptions?.trial || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Potencial conversión</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Growth MRR</p>
                    <p className="text-2xl font-bold text-green-600">+{metrics?.growthRate || 0}%</p>
                    <p className="text-sm text-gray-500 mt-1">Últimos 30 días</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay datos de ingresos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformDashboard;
