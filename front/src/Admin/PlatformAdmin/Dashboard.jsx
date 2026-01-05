import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardQuery } from '../../redux/platformAdmin';
import CreateManualTenantForm from './CreateManualTenantForm';
import PlanManagement from './PlanManagement';

function PlatformAdminDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useGetDashboardQuery();
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, plans

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
          <p>{error?.data?.message || error?.message || 'Error desconocido'}</p>
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const dashboardData = data?.data || {};

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Panel de administración de la plataforma</p>
        </div>

        {/* Tabs de Navegación */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'plans'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Planes
            </button>
          </nav>
        </div>

        {/* Contenido según Tab Activo */}
        {activeTab === 'dashboard' && (
          <>
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tenants */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Tenants</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {dashboardData.tenants?.total || 0}
            </div>
            <div className="text-sm text-green-600 mt-2">
              {dashboardData.tenants?.active || 0} activos
            </div>
          </div>

          {/* Total Propiedades */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Propiedades</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {dashboardData.properties?.total || 0}
            </div>
          </div>

          {/* Total Contratos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Total Contratos</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {dashboardData.leases?.total || 0}
            </div>
            <div className="text-sm text-blue-600 mt-2">
              {dashboardData.leases?.active || 0} activos
            </div>
          </div>

          {/* Ingresos Mensuales */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">MRR</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              ${dashboardData.revenue?.mrr || 0}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowCreateTenant(true)}
              className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-semibold"
            >
              ✨ Crear Tenant Manual
            </button>
            <button 
              onClick={() => navigate('/platform-admin/tenants')}
              className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Ver Tenants
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Gestionar Planes
            </button>
            <button className="px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              Configuración
            </button>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estado del Sistema</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Última actualización:</span>
              <span className="text-gray-900 font-medium">
                {new Date().toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="text-green-600 font-medium">✓ Operativo</span>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Tab de Planes */}
        {activeTab === 'plans' && (
          <PlanManagement />
        )}
      </div>

      {/* Modal para Crear Tenant */}
      {showCreateTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <CreateManualTenantForm
            onSuccess={() => {
              setShowCreateTenant(false);
              refetch(); // Actualizar datos del dashboard
            }}
            onCancel={() => setShowCreateTenant(false)}
          />
        </div>
      )}
    </div>
  );
}

export default PlatformAdminDashboard;
