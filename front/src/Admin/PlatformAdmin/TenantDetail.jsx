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
  useUpdateTenantSubscriptionMutation,
  useResetTenantAdminPasswordMutation,
  useGetTenantPaymentsQuery,
  useSendEmailToTenantMutation,
  useGetTenantActivityQuery,
  useGetTenantErrorsQuery,
  useCheckSubdomainAvailabilityQuery,
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
  const [updateTenantSubscription, { isLoading: isUpdatingSubscription }] = useUpdateTenantSubscriptionMutation();
  const [resetTenantAdminPassword, { isLoading: isResettingPassword }] = useResetTenantAdminPasswordMutation();
  const { data: operationalData } = useGetTenantOperationalQuery(tenantId);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const { data: paymentsData, isFetching: isLoadingPayments } = useGetTenantPaymentsQuery({ tenantId, page: paymentsPage, limit: 10 });
  const [sendEmailToTenant, { isLoading: isSendingEmail }] = useSendEmailToTenantMutation();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const { data: activityData, isFetching: isLoadingActivity } = useGetTenantActivityQuery({ tenantId, limit: 50 });
  const { data: errorsData, isFetching: isLoadingErrors } = useGetTenantErrorsQuery(tenantId);

  // Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({ status: '', trialEnd: '', currentPeriodEnd: '' });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '' });
  const [resetLink, setResetLink] = useState('');

  // Estado local del formulario de edición
  const [editForm, setEditForm] = useState({});
  const [subdomainToCheck, setSubdomainToCheck] = useState('');
  const { data: subdomainCheckData, isFetching: checkingSubdomain } = useCheckSubdomainAvailabilityQuery(
    subdomainToCheck,
    { skip: !subdomainToCheck || subdomainToCheck.length < 3 },
  );
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
      subdomain: tenant.subdomain || '',
    });
    setSubdomainToCheck('');
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setActionError('');
    setResetLink('');
    try {
      const payload = { tenantId: parseInt(tenantId) };
      if (resetPasswordForm.newPassword) payload.newPassword = resetPasswordForm.newPassword;
      const res = await resetTenantAdminPassword(payload).unwrap();
      if (res.data?.resetLink) {
        setResetLink(res.data.resetLink);
      } else {
        setShowResetPasswordModal(false);
        setResetPasswordForm({ newPassword: '' });
      }
    } catch (err) {
      setActionError(err?.data?.message || 'Error al resetear contraseña');
    }
  };

  const openSubscriptionModal = () => {
    const sub = data?.data?.subscription;
    setSubscriptionForm({
      status: sub?.status || '',
      trialEnd: sub?.trialEnd ? new Date(sub.trialEnd).toISOString().slice(0, 16) : '',
      currentPeriodEnd: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 16) : '',
    });
    setActionError('');
    setShowSubscriptionModal(true);
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const payload = { tenantId: parseInt(tenantId) };
      if (subscriptionForm.status) payload.status = subscriptionForm.status;
      if (subscriptionForm.trialEnd) payload.trialEnd = subscriptionForm.trialEnd;
      if (subscriptionForm.currentPeriodEnd) payload.currentPeriodEnd = subscriptionForm.currentPeriodEnd;
      await updateTenantSubscription(payload).unwrap();
      setShowSubscriptionModal(false);
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || 'Error al actualizar suscripción');
    }
  };

  const handleExpireTrial = async () => {
    try {
      await updateTenantSubscription({
        tenantId: parseInt(tenantId),
        status: 'past_due',
        trialEnd: new Date(Date.now() - 86400000).toISOString(),
        currentPeriodEnd: new Date(Date.now() - 86400000).toISOString(),
      }).unwrap();
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || 'Error al expirar trial');
    }
  };

  const handleImpersonate = async () => {
    setActionError('');
    try {
      const res = await impersonateTenant(parseInt(tenantId)).unwrap();
      const token = res?.data?.token || res?.token;
      if (!token) throw new Error('Token no recibido');
      const tenantInfo = res?.data?.tenant || res?.tenant || {};
      const tenantParam = encodeURIComponent(JSON.stringify(tenantInfo));
      // Abrir en nueva pestaña pasando el token por URL (sin guardarlo en localStorage de esta sesión)
      window.open(`/?impersonate=${token}&impersonateTenant=${tenantParam}`, '_blank');
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
                <button
                  onClick={openSubscriptionModal}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-left"
                >
                  💳 Editar Suscripción
                </button>
                <button
                  onClick={() => { setResetLink(''); setResetPasswordForm({ newPassword: '' }); setActionError(''); setShowResetPasswordModal(true); }}
                  className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-left"
                >
                  🔑 Resetear Contraseña Admin
                </button>
                <button
                  onClick={() => { setEmailForm({ subject: '', body: '' }); setActionError(''); setShowEmailModal(true); }}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-left"
                >
                  ✉️ Enviar Email al Tenant
                </button>
                <button
                  onClick={handleExpireTrial}
                  disabled={isUpdatingSubscription}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-left disabled:opacity-50"
                >
                  {isUpdatingSubscription ? '⏳ Procesando...' : '⏱️ Simular Trial Vencido'}
                </button>
              </div>
            </div>

            {/* Historial de Pagos de Suscripción */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💳 Historial de Pagos</h2>
              {isLoadingPayments ? (
                <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
              ) : paymentsData?.data?.payments?.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500 uppercase">
                          <th className="pb-2 pr-4">Fecha</th>
                          <th className="pb-2 pr-4">Estado</th>
                          <th className="pb-2 pr-4">Monto</th>
                          <th className="pb-2 pr-4">Período</th>
                          <th className="pb-2">ID MP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paymentsData.data.payments.map((p) => (
                          <tr key={p.id} className="text-gray-700">
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleDateString('es-AR')}
                            </td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                p.status === 'approved' ? 'bg-green-100 text-green-700' :
                                p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                p.status === 'authorized' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>{p.status}</span>
                            </td>
                            <td className="py-2 pr-4 font-semibold">
                              {p.amount ? `${p.currency} ${Number(p.amount).toLocaleString('es-AR')}` : '—'}
                            </td>
                            <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                              {p.periodStart ? new Date(p.periodStart).toLocaleDateString('es-AR') : '—'}
                              {p.periodEnd ? ` → ${new Date(p.periodEnd).toLocaleDateString('es-AR')}` : ''}
                            </td>
                            <td className="py-2 text-xs text-gray-400 font-mono">
                              {p.mpPaymentId || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {paymentsData.data.pagination?.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Página {paymentsPage} de {paymentsData.data.pagination.totalPages} ({paymentsData.data.pagination.total} registros)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                          disabled={paymentsPage === 1}
                          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                        >← Anterior</button>
                        <button
                          onClick={() => setPaymentsPage(p => Math.min(paymentsData.data.pagination.totalPages, p + 1))}
                          disabled={paymentsPage === paymentsData.data.pagination.totalPages}
                          className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                        >Siguiente →</button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin registros de pagos de suscripción.</p>
              )}
            </div>

            {/* Errores Recientes */}
            {(() => {
              const summary = errorsData?.data?.summary;
              const errs = errorsData?.data?.errors || [];
              const hasErrors = errs.length > 0;
              return (
                <div className={`rounded-lg shadow p-6 ${hasErrors ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {hasErrors ? '🚨 Errores Recientes' : '✅ Sin Errores Recientes'}
                    </h2>
                    {summary && hasErrors && (
                      <div className="flex gap-2">
                        {summary.fiscal > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{summary.fiscal} fiscal</span>
                        )}
                        {summary.payments > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{summary.payments} pagos</span>
                        )}
                        {summary.tickets > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">{summary.tickets} tickets</span>
                        )}
                      </div>
                    )}
                  </div>
                  {isLoadingErrors ? (
                    <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
                  ) : hasErrors ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {errs.map((e) => (
                        <div key={e.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                          e.severity === 'critical' ? 'bg-red-100 border-red-300' :
                          e.severity === 'error' ? 'bg-orange-50 border-orange-200' :
                          'bg-yellow-50 border-yellow-200'
                        }`}>
                          <span className="text-xl shrink-0 mt-0.5">{e.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                            <p className="text-xs text-gray-600 truncate">{e.detail}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(e.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                              <span className="ml-2 uppercase tracking-wide opacity-60">{e.source}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No se registraron errores en los últimos 30 días.</p>
                  )}
                </div>
              );
            })()}

            {/* Logs de Actividad */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Actividad Reciente</h2>
              {isLoadingActivity ? (
                <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
              ) : activityData?.data?.events?.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {activityData.data.events.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-lg shrink-0 mt-0.5">{ev.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{ev.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(ev.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        ev.type === 'cliente' ? 'bg-blue-100 text-blue-700' :
                        ev.type === 'propiedad' ? 'bg-green-100 text-green-700' :
                        ev.type === 'contrato' ? 'bg-purple-100 text-purple-700' :
                        ev.type === 'pago' ? 'bg-yellow-100 text-yellow-700' :
                        ev.type === 'ticket' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{ev.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Sin actividad registrada.</p>
              )}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdominio</label>
                <div className="relative">
                  <input
                    className="w-full border rounded-lg px-3 py-2 pr-24"
                    value={editForm.subdomain || ''}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setEditForm(p => ({ ...p, subdomain: val }));
                      setSubdomainToCheck('');
                    }}
                    onBlur={() => {
                      const val = editForm.subdomain || '';
                      if (val.length >= 3 && val !== tenant.subdomain) {
                        setSubdomainToCheck(val);
                      }
                    }}
                    placeholder={tenant.subdomain}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">.innoinmo.com</span>
                </div>
                {editForm.subdomain === tenant.subdomain && (
                  <p className="text-xs text-gray-400 mt-1">Subdominio actual</p>
                )}
                {editForm.subdomain !== tenant.subdomain && editForm.subdomain?.length >= 3 && (
                  checkingSubdomain
                    ? <p className="text-xs text-blue-500 mt-1">Verificando...</p>
                    : subdomainCheckData?.available === true
                      ? <p className="text-xs text-green-600 mt-1">✓ Disponible</p>
                      : subdomainCheckData?.available === false
                        ? <p className="text-xs text-red-600 mt-1">✗ Ya está en uso</p>
                        : null
                )}
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

      {/* ── MODAL: Editar Suscripción ── */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">💳 Editar Suscripción</h3>
            <p className="text-xs text-gray-500 mb-3">
              Para <strong>Lifetime</strong>, usá &quot;Cambiar plan&quot; → Lifetime (sincroniza tenant y suscripción).
            </p>
            <form onSubmit={handleUpdateSubscription}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={subscriptionForm.status}
                  onChange={e => setSubscriptionForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">-- Sin cambiar --</option>
                  <option value="trialing">trialing</option>
                  <option value="active">active</option>
                  <option value="past_due">past_due</option>
                  <option value="canceled">canceled</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin del Trial</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2"
                  value={subscriptionForm.trialEnd}
                  onChange={e => setSubscriptionForm(f => ({ ...f, trialEnd: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin del Período Actual</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2"
                  value={subscriptionForm.currentPeriodEnd}
                  onChange={e => setSubscriptionForm(f => ({ ...f, currentPeriodEnd: e.target.value }))}
                />
              </div>
              {actionError && <p className="text-red-600 text-sm mb-2">{actionError}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowSubscriptionModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isUpdatingSubscription} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">
                  {isUpdatingSubscription ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Resetear Contraseña ── */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">🔑 Resetear Contraseña Admin</h3>
            <p className="text-sm text-gray-500 mb-4">
              Admin: <strong>{data?.data?.admins?.[0]?.email || data?.data?.tenant?.email || '(principal del tenant)'}</strong>
            </p>

            {resetLink ? (
              <div>
                <p className="text-sm text-green-700 mb-2 font-medium">✅ Link generado (válido 24 horas):</p>
                <div className="bg-gray-100 rounded p-2 text-xs break-all mb-3 select-all">{resetLink}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(resetLink); }}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    📋 Copiar link
                  </button>
                  <button
                    onClick={() => { setShowResetPasswordModal(false); setResetLink(''); }}
                    className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p className="text-sm text-gray-600 mb-4">
                  Podés generar un <strong>link de reset</strong> para enviarle al usuario, o forzar una <strong>contraseña nueva</strong> directamente.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña (opcional — dejá vacío para generar link)
                  </label>
                  <input
                    type="password"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Mínimo 8 caracteres"
                    value={resetPasswordForm.newPassword}
                    onChange={e => setResetPasswordForm({ newPassword: e.target.value })}
                  />
                </div>
                {actionError && <p className="text-red-600 text-sm mb-2">{actionError}</p>}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowResetPasswordModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" disabled={isResettingPassword} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                    {isResettingPassword ? 'Procesando...' : resetPasswordForm.newPassword ? 'Forzar contraseña' : 'Generar link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Enviar Email ── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-1">✉️ Enviar Email al Tenant</h3>
            <p className="text-sm text-gray-500 mb-4">
              Destinatario: <span className="font-medium text-gray-700">{tenant.email}</span>
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setActionError('');
                try {
                  const res = await sendEmailToTenant({ tenantId, subject: emailForm.subject, body: emailForm.body }).unwrap();
                  alert(res.message || 'Email enviado correctamente');
                  setShowEmailModal(false);
                } catch (err) {
                  setActionError(err?.data?.message || 'Error al enviar el email');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Ej: Actualización importante de tu cuenta"
                  value={emailForm.subject}
                  onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-40 resize-none"
                  placeholder="Escribí el mensaje aquí..."
                  value={emailForm.body}
                  onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))}
                  required
                />
              </div>
              {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSendingEmail} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  {isSendingEmail ? 'Enviando...' : 'Enviar Email'}
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
