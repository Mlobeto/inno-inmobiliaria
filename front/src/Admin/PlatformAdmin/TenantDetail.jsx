/**
 * Detalle de Tenant para Platform Admin
 * Muestra información completa del tenant, suscripción y estadísticas
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useGetTenantDetailQuery } from '@shared/redux';

const TenantDetail = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, isError, error } = useGetTenantDetailQuery(tenantId);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar tenant</h2>
            <p className="text-red-600 mb-4">{error?.data?.message || 'Error desconocido'}</p>
            <button
              onClick={() => navigate('/platform-admin/tenants')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              ← Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const tenant = data?.data?.tenant || {};
  const subscription = data?.data?.subscription || null;
  const stats = data?.data?.stats || {};
  
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    
    const labels = {
      ACTIVE: 'Activo',
      TRIAL: 'Prueba',
      SUSPENDED: 'Suspendido',
      CANCELLED: 'Cancelado',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };
  
  const getPlanBadge = (plan) => {
    const badges = {
      FREE: 'bg-gray-100 text-gray-700',
      BASIC: 'bg-blue-100 text-blue-700',
      PROFESSIONAL: 'bg-purple-100 text-purple-700',
      ENTERPRISE: 'bg-yellow-100 text-yellow-700',
    };
    
    const labels = {
      FREE: 'Gratis',
      BASIC: 'Básico',
      PROFESSIONAL: 'Profesional',
      ENTERPRISE: 'Empresarial',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badges[plan] || 'bg-gray-100 text-gray-800'}`}>
        {labels[plan] || plan}
      </span>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/platform-admin/tenants')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
            >
              ← Volver a la lista
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{tenant.businessName}</h1>
            <p className="text-gray-600 mt-1">Tenant ID: {tenant.tenantId}</p>
          </div>
          <div className="flex gap-3">
            {getStatusBadge(tenant.status)}
            {getPlanBadge(tenant.plan)}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda - Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Información General */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información General</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre del Negocio</p>
                  <p className="font-semibold text-gray-900">{tenant.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CUIT</p>
                  <p className="font-semibold text-gray-900">{tenant.cuit || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{tenant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-semibold text-gray-900">{tenant.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subdomain</p>
                  <a
                    href={`https://inno-inmobiliaria.vercel.app/${tenant.subdomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {tenant.subdomain}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-semibold text-gray-900">{tenant.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Registro</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(tenant.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Actualización</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(tenant.updatedAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Límites y Características */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Límites y Características</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Máximo de Agentes</p>
                  <p className="font-semibold text-gray-900">{tenant.maxAgents || 'Ilimitado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Máximo de Propiedades</p>
                  <p className="font-semibold text-gray-900">{tenant.maxProperties || 'Ilimitado'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Características Habilitadas</p>
                  <div className="flex flex-wrap gap-2">
                    {tenant.features && Array.isArray(tenant.features) && tenant.features.length > 0 ? (
                      tenant.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Sin características configuradas</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Suscripción */}
            {subscription && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Suscripción Actual</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold text-gray-900">{subscription.planId?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-semibold text-gray-900">{subscription.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Inicio</p>
                    <p className="font-semibold text-gray-900">
                      {subscription.currentPeriodStart
                        ? new Date(subscription.currentPeriodStart).toLocaleDateString('es-AR')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                    <p className="font-semibold text-gray-900">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-semibold text-gray-900">
                      ${subscription.amount || 0} {subscription.currency || 'ARS'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método de Pago</p>
                    <p className="font-semibold text-gray-900">
                      {subscription.paymentProvider || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notas */}
            {tenant.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Notas Internas</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{tenant.notes}</p>
              </div>
            )}
            
          </div>
          
          {/* Columna Derecha - Estadísticas */}
          <div className="space-y-6">
            
            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-gray-600">Propiedades</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.properties || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-gray-600">Clientes</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.clients || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-gray-600">Contratos</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.leases || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Usuarios</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.users || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left">
                  📝 Editar Información
                </button>
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-left">
                  ⏸️ Suspender Tenant
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left">
                  🔄 Cambiar Plan
                </button>
                <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left">
                  🗑️ Eliminar Tenant
                </button>
              </div>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TenantDetail;
