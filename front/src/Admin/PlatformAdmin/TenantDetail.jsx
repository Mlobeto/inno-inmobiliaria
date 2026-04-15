/**
 * Detalle de Tenant para Platform Admin
 * Muestra información completa del tenant, suscripción y estadísticas
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetTenantDetailQuery,
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
  useDeleteTenantMutation,
  useListPlansQuery,
  useImpersonateTenantMutation,
  useGetTenantOperationalQuery,
} from '@shared/redux';

const TenantDetail = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetTenantDetailQuery(tenantId);
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();
  const [suspendTenant, { isLoading: isSuspending }] = useSuspendTenantMutation();
  const [activateTenant, { isLoading: isActivating }] = useActivateTenantMutation();
  const [deleteTenant, { isLoading: isDeleting }] = useDeleteTenantMutation();
  const { data: plansData } = useListPlansQuery();
  const [impersonateTenant, { isLoading: isImpersonating }] = useImpersonateTenantMutation();
  const { data: operationalData } = useGetTenantOperationalQuery(tenantId);

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estado local del formulario de edición
  const [editForm, setEditForm] = useState({});
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [actionError, setActionError] = useState('');

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
  const plans = plansData?.plans || [];

  // ── Handlers ───────────────────────────────────────────────

  const openEditModal = () => {
    setEditForm({
      businessName: tenant.businessName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: tenant.address || '',
      maxAgents: tenant.maxAgents || 5,
      maxProperties: tenant.maxProperties || 100,
    });
    setActionError('');
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await updateTenant({ tenantId: parseInt(tenantId), ...editForm }).unwrap();
      setShowEditModal(false);
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || 'Error al actualizar');
    }
  };

  const handleSuspendOrActivate = async () => {
    setActionError('');
    try {
      if (tenant.status === 'active') {
        await suspendTenant({ tenantId: parseInt(tenantId), reason: suspendReason }).unwrap();
      } else {
        await activateTenant(parseInt(tenantId)).unwrap();
      }
      setShowSuspendModal(false);
      setSuspendReason('');
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || 'Error al cambiar estado');
    }
  };

  const handleChangePlan = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await updateTenant({ tenantId: parseInt(tenantId), plan: selectedPlanId }).unwrap();
      setShowChangePlanModal(false);
      setSelectedPlanId('');
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || 'Error al cambiar plan');
    }
  };

  const handleDelete = async () => {
    setActionError('');
    try {
      await deleteTenant(parseInt(tenantId)).unwrap();
      navigate('/platform-admin/tenants');
    } catch (err) {
      setActionError(err?.data?.message || 'Error al eliminar tenant');
    }
  };

  const handleImpersonate = async () => {
    setActionError('');
    try {
      const res = await impersonateTenant(parseInt(tenantId)).unwrap();
      const token = res?.data?.token || res?.token;
      if (!token) throw new Error('Token no recibido');
      // Guardar token de impersonación y redirigir al panel del tenant
      localStorage.setItem('impersonation_token', token);
      localStorage.setItem('impersonation_tenantId', tenantId);
      // Abrir en nueva pestaña para no perder la sesión admin
      window.open('/', '_blank');
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Error al impersonar tenant');
    }
  };

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
    <>
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
                    href={`yellow-mud-000b27d0f.6.azurestaticapps.net/${tenant.subdomain}`}
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
                <button
                  onClick={openEditModal}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-left"
                >
                  📝 Editar Información
                </button>
                <button
                  onClick={() => { setActionError(''); setShowSuspendModal(true); }}
                  className={`w-full px-4 py-2 text-white rounded-lg text-left ${
                    tenant.status === 'active'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {tenant.status === 'active' ? '⏸️ Suspender Tenant' : '▶️ Activar Tenant'}
                </button>
                <button
                  onClick={() => { setSelectedPlanId(tenant.plan?.toLowerCase() || ''); setActionError(''); setShowChangePlanModal(true); }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-left"
                >
                  🔄 Cambiar Plan
                </button>
                <button
                  onClick={() => { setActionError(''); setShowDeleteModal(true); }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-left"
                >
                  🗑️ Eliminar Tenant
                </button>
                <button
                  onClick={handleImpersonate}
                  disabled={isImpersonating}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-left disabled:opacity-50"
                >
                  {isImpersonating ? '⏳ Generando token...' : '🎭 Impersonar Tenant'}
                </button>
              </div>
            </div>

            {/* Panel Operacional */}
            {operationalData && (() => {
              const op = operationalData?.data || operationalData;
              const counts = op?.counts || {};
              const recentPayments = op?.recentPayments || [];
              const openTickets = op?.openTickets || [];
              return (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Panel Operacional</h2>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Clientes', value: counts.clients },
                      { label: 'Propiedades', value: counts.properties },
                      { label: 'Contratos', value: counts.leases },
                      { label: 'Pagos', value: counts.payments },
                      { label: 'Leads', value: counts.leads },
                      { label: 'Tickets', value: counts.tickets },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-gray-800">{value ?? 0}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                  {recentPayments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Pagos Recientes</p>
                      <div className="space-y-1.5">
                        {recentPayments.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            <span>{p.concept || 'Pago'}</span>
                            <span className="font-semibold">${p.amount?.toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {openTickets.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Tickets Abiertos</p>
                      <div className="space-y-1.5">
                        {openTickets.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs text-gray-600 bg-blue-50 rounded px-2 py-1">
                            <span className="truncate flex-1">{t.title}</span>
                            <span className={`ml-2 shrink-0 font-medium ${
                              t.priority === 'CRITICA' ? 'text-red-600' :
                              t.priority === 'ALTA' ? 'text-orange-500' : 'text-gray-500'
                            }`}>{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
          </div>
        </div>
        
      </div>
    </div>

      {/* ── MODAL: Editar Información ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Editar Información</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editForm.businessName || ''} onChange={e => setEditForm(p => ({ ...p, businessName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input className="w-full border rounded-lg px-3 py-2" value={editForm.address || ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Agentes</label>
                  <input type="number" min="1" className="w-full border rounded-lg px-3 py-2" value={editForm.maxAgents || ''} onChange={e => setEditForm(p => ({ ...p, maxAgents: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Propiedades</label>
                  <input type="number" min="1" className="w-full border rounded-lg px-3 py-2" value={editForm.maxProperties || ''} onChange={e => setEditForm(p => ({ ...p, maxProperties: parseInt(e.target.value) }))} />
                </div>
              </div>
              {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isUpdating ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Suspender / Activar ── */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {tenant.status === 'active' ? '⏸️ Suspender Tenant' : '▶️ Activar Tenant'}
            </h3>
            {tenant.status === 'active' ? (
              <>
                <p className="text-gray-600 mb-3">¿Estás seguro que quieres suspender <strong>{tenant.businessName}</strong>? El tenant no podrá acceder al sistema.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                  <textarea className="w-full border rounded-lg px-3 py-2" rows="2" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Ej: Pago vencido, incumplimiento, etc." />
                </div>
              </>
            ) : (
              <p className="text-gray-600 mb-3">¿Reactivar el acceso de <strong>{tenant.businessName}</strong>?</p>
            )}
            {actionError && <p className="text-red-600 text-sm mt-2">{actionError}</p>}
            <div className="flex gap-3 justify-end pt-4">
              <button onClick={() => setShowSuspendModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleSuspendOrActivate}
                disabled={isSuspending || isActivating}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${tenant.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {(isSuspending || isActivating) ? 'Procesando...' : tenant.status === 'active' ? 'Suspender' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Cambiar Plan ── */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">🔄 Cambiar Plan</h3>
            <p className="text-gray-600 mb-4">Plan actual: <strong>{tenant.plan}</strong></p>
            <form onSubmit={handleChangePlan}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Plan</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mb-4"
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar plan --</option>
                {plans.map(p => (
                  <option key={p.planId} value={p.planId}>{p.name}</option>
                ))}
              </select>
              {actionError && <p className="text-red-600 text-sm mb-2">{actionError}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowChangePlanModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isUpdating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {isUpdating ? 'Cambiando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Eliminar ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-red-700 mb-4">🗑️ Eliminar Tenant</h3>
            <p className="text-gray-700 mb-2">Esta acción es <strong>irreversible</strong>. Se eliminarán todos los datos de:</p>
            <p className="font-bold text-gray-900 mb-4">{tenant.businessName}</p>
            <p className="text-sm text-red-600 mb-4">Propiedades, clientes, contratos, pagos y usuarios serán eliminados permanentemente.</p>
            {actionError && <p className="text-red-600 text-sm mb-2">{actionError}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantDetail;
