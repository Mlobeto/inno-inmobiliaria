import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentUser,
  logout as logoutAction,
  useGetCommissionsQuery,
  useGetAgentsQuery,
  useGetSettlementQuery,
  useCreateCommissionMutation,
  useUpdateCommissionMutation,
  useApproveCommissionMutation,
  useMarkCommissionPaidMutation,
  useCancelCommissionMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoPencilOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCashOutline,
  IoFilterOutline,
  IoStatsChartOutline,
  IoDocumentTextOutline,
  IoCheckmarkDoneOutline,
  IoCloseCircleOutline,
  IoLogOutOutline,
  IoChatbubblesOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from './AdminPanelLayout';
import {
  alertError,
  alertSuccess,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  modalBox,
  modalHeader,
  modalOverlay,
  selectClass,
  spinner,
  card,
  statCard,
  tabActive,
  tabInactive,
  tableHeadRow,
  tableRow,
  tableTh,
  tableWrap,
} from './adminPanelTheme';

const TRANSACTION_TYPES = [
  { value: 'VENTA', label: 'Venta', color: 'emerald' },
  { value: 'ALQUILER', label: 'Alquiler', color: 'blue' },
  { value: 'ALQUILER_TEMPORAL', label: 'Alquiler temporal', color: 'purple' },
  { value: 'VENTA_LOTE', label: 'Venta de Lote', color: 'orange' },
];

const STATUS_LIST = [
  { value: 'PENDING', label: 'Pendiente', color: 'amber' },
  { value: 'APPROVED', label: 'Aprobada', color: 'blue' },
  { value: 'PAID', label: 'Pagada', color: 'emerald' },
  { value: 'CANCELLED', label: 'Cancelada', color: 'red' },
];

const STATUS_BADGE = {
  PENDING: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
  APPROVED: 'bg-customBlueMuted text-customBlue border border-customBlue/30',
  PAID: 'bg-brand-muted text-brand-light border border-borderStrong',
  CANCELLED: 'bg-customRedMuted text-customRed border border-customRed/30',
};

const TX_BADGE = {
  VENTA: 'bg-brand-muted text-brand-light border border-borderStrong',
  ALQUILER: 'bg-customBlueMuted text-customBlue border border-customBlue/30',
  ALQUILER_TEMPORAL: 'bg-brand-subtle text-brand border border-borderStrong',
  VENTA_LOTE: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
};

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const EMPTY_FORM = {
  agentId: '',
  transactionType: 'VENTA',
  transactionId: '',
  propertyId: '',
  clientId: '',
  transactionAmount: '',
  inmobiliariaCommissionPercent: '',
  agentCommissionPercent: '',
  agentCommissionFixedAmount: '',
  commissionBasis: 'percent', // 'percent' | 'fixed'
  notes: '',
};

const now = new Date();

export default function PanelComisiones() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAgent = currentUser?.role === 'AGENT';

  const [activeTab, setActiveTab] = useState('lista'); // 'lista' | 'liquidacion'
  const [filters, setFilters] = useState({
    agentId: '',
    status: '',
    transactionType: '',
    year: String(now.getFullYear()),
    month: '',
    page: 1,
    limit: 20,
  });
  const [settlementPeriod, setSettlementPeriod] = useState({
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: commData, isLoading } = useGetCommissionsQuery(filters);
  const { data: settlementData } = useGetSettlementQuery(settlementPeriod, {
    skip: activeTab !== 'liquidacion' || !isSuperAdmin,
  });
  const { data: agentsRaw = [] } = useGetAgentsQuery(undefined, { skip: !currentUser?.tenantId });

  const [createCommission, { isLoading: isCreating }] = useCreateCommissionMutation();
  const [updateCommission, { isLoading: isUpdating }] = useUpdateCommissionMutation();
  const [approveCommission] = useApproveCommissionMutation();
  const [markCommissionPaid] = useMarkCommissionPaidMutation();
  const [cancelCommission] = useCancelCommissionMutation();

  const commissions = commData?.commissions || [];
  const totals = commData?.totals || {};
  const settlement = settlementData?.settlement || [];
  const agents = Array.isArray(agentsRaw) ? agentsRaw : [];

  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'liquidacion') {
      setActiveTab('lista');
    }
  }, [isSuperAdmin, activeTab]);

  const propertyRequired = form.transactionType !== 'VENTA_LOTE';
  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      agentId:
        isAgent && currentUser?.adminId !== undefined ? String(currentUser.adminId) : '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (comm) => {
    setEditingId(comm.id);
    const fixed = comm.agentCommissionFixedAmount != null;
    setForm({
      agentId: String(comm.agentId),
      transactionType: comm.transactionType,
      transactionId: String(comm.transactionId || ''),
      propertyId: comm.propertyId != null ? String(comm.propertyId) : '',
      clientId: String(comm.clientId || ''),
      transactionAmount: String(comm.transactionAmount),
      inmobiliariaCommissionPercent: comm.inmobiliariaCommissionPercent != null ? String(comm.inmobiliariaCommissionPercent) : '',
      agentCommissionPercent: comm.agentCommissionPercent != null ? String(comm.agentCommissionPercent) : '',
      agentCommissionFixedAmount:
        fixed && comm.agentCommissionFixedAmount != null ? String(comm.agentCommissionFixedAmount) : '',
      commissionBasis: fixed ? 'fixed' : 'percent',
      notes: comm.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const isVentaLote = form.transactionType === 'VENTA_LOTE';
    try {
      const agentPct =
        form.commissionBasis === 'percent' && form.agentCommissionPercent
          ? Number(form.agentCommissionPercent)
          : null;
      const agentFixed =
        form.commissionBasis === 'fixed' && form.agentCommissionFixedAmount
          ? Number(form.agentCommissionFixedAmount)
          : null;

      const payload = {
        agentId: Number(form.agentId),
        transactionType: form.transactionType,
        transactionId: form.transactionId ? Number(form.transactionId) : undefined,
        ...(isVentaLote ? {} : { propertyId: Number(form.propertyId) }),
        clientId: form.clientId ? Number(form.clientId) : undefined,
        transactionAmount: Number(form.transactionAmount),
        inmobiliariaCommissionPercent: form.inmobiliariaCommissionPercent
          ? Number(form.inmobiliariaCommissionPercent)
          : null,
        agentCommissionPercent: agentPct,
        agentCommissionFixedAmount: agentFixed,
        notes: form.notes || '',
      };

      if (!payload.agentId || Number.isNaN(payload.agentId)) {
        setError('Seleccioná un agente');
        return;
      }
      if (!isVentaLote && (!form.propertyId || Number.isNaN(Number(form.propertyId)))) {
        setError('El ID de propiedad es obligatorio para esta operación');
        return;
      }

      if (editingId) {
        await updateCommission({ id: editingId, ...payload }).unwrap();
        setSuccess('Comisión actualizada');
      } else {
        await createCommission(payload).unwrap();
        setSuccess('Comisión creada correctamente');
      }
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al guardar');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('¿Aprobar esta comisión?')) return;
    try {
      await approveCommission(id).unwrap();
      setSuccess('Comisión aprobada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al aprobar');
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('¿Marcar esta comisión como pagada?')) return;
    try {
      await markCommissionPaid(id).unwrap();
      setSuccess('Comisión marcada como pagada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al marcar como pagada');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta comisión? Esta acción no se puede deshacer.')) return;
    try {
      await cancelCommission(id).unwrap();
      setSuccess('Comisión cancelada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al cancelar');
    }
  };

  return (
    <AdminPanelLayout
      wide
      backTo={isAgent ? '/panelLeads' : '/panel'}
      backLabel={isAgent ? 'Mis leads' : 'Panel'}
      title="Comisiones"
      subtitle={
        isAgent
          ? 'Registrá tus operaciones; el administrador aprueba el pago'
          : 'Gestioná y liquidá las comisiones de tus agentes'
      }
      icon={IoCashOutline}
      iconClassName="text-brand-light"
      actions={
        <>
          {isAgent && (
            <>
              <Link to="/soporte" className={btnGhost} title="Soporte GestProp">
                <IoChatbubblesOutline className="w-4 h-4 text-brand-light" />
                <span className="hidden sm:inline">Soporte</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  dispatch(logoutAction());
                  navigate('/login');
                }}
                className={btnGhost}
                title="Cerrar sesión"
              >
                <IoLogOutOutline className="w-4 h-4 text-customRed" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          )}
          <button type="button" onClick={openCreate} className={btnPrimary}>
            <IoAdd className="w-5 h-5" />
            <span className="hidden sm:inline">{isAgent ? 'Registrar mi comisión' : 'Nueva'}</span>
          </button>
        </>
      }
    >
        {success && (
          <div className={alertSuccess}>
            <IoCheckmarkCircleOutline className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className={alertError}>
            <IoAlertCircleOutline className="w-5 h-5 shrink-0" />
            {error}
            <button type="button" onClick={() => setError('')} className="ml-auto"><IoCloseOutline /></button>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'lista' ? tabActive : tabInactive
            }`}
          >
            <IoDocumentTextOutline className="inline w-4 h-4 mr-1" />
            Lista de comisiones
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('liquidacion')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'liquidacion' ? tabActive : tabInactive
              }`}
            >
              <IoStatsChartOutline className="inline w-4 h-4 mr-1" />
              Liquidación
            </button>
          )}
        </div>

        {activeTab === 'lista' && (
          <>
            {/* Totales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className={statCard}>
                <p className="text-textMuted text-xs mb-1">Volumen de operaciones</p>
                <p className="text-xl font-bold text-textPrimary">{formatCurrency(totals.transactionAmount)}</p>
              </div>
              <div className={statCard}>
                <p className="text-textMuted text-xs mb-1">Comisión inmobiliaria</p>
                <p className="text-xl font-bold text-customBlue">{formatCurrency(totals.inmobiliariaCommissionAmount)}</p>
              </div>
              <div className={statCard}>
                <p className="text-textMuted text-xs mb-1">Comisión agentes</p>
                <p className="text-xl font-bold text-brand-light">{formatCurrency(totals.agentCommissionAmount)}</p>
              </div>
            </div>

            <div className={`${statCard} mb-4 flex flex-wrap gap-3 items-end p-4`}>
              <IoFilterOutline className="w-5 h-5 text-textMuted self-center" />
              <div>
                <label className={labelClass}>Agente</label>
                <select
                  value={filters.agentId}
                  onChange={(e) => setFilters({ ...filters, agentId: e.target.value, page: 1 })}
                  disabled={isAgent}
                  className={`${selectClass} disabled:opacity-50`}
                >
                  <option value="">Todos</option>
                  {agents.map((a) => (
                    <option key={a.adminId} value={a.adminId}>
                      {a.fullName || a.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value, page: 1 })}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Año</label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                  className={`${inputClass} w-24`}
                  min="2020" max="2099"
                />
              </div>
              <div>
                <label className={labelClass}>Mes</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className={`w-10 h-10 ${spinner}`} />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-16">
                <IoCashOutline className="w-16 h-16 text-textMuted mx-auto mb-4" />
                <p className="text-textMuted">No hay comisiones para los filtros seleccionados</p>
                <button type="button" onClick={openCreate} className={`mt-6 ${btnPrimary}`}>
                  Registrar primera comisión
                </button>
              </div>
            ) : (
              <div className={tableWrap}>
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className={tableHeadRow}>
                      <th className={tableTh}>Agente</th>
                      <th className={tableTh}>Propiedad</th>
                      <th className={tableTh}>Tipo</th>
                      <th className={`${tableTh} text-right`}>Importe op.</th>
                      <th className={`${tableTh} text-right`}>Comisión agente</th>
                      <th className={tableTh}>Estado</th>
                      <th className={tableTh}>Fecha</th>
                      <th className={`${tableTh} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => {
                      const agentName = c.admins_commissions_agentIdToadmins?.fullName
                        || c.admins_commissions_agentIdToadmins?.username || '—';
                      const propAddr = c.transactionType === 'VENTA_LOTE'
                        ? (c.loteoNombre || `Lote #${c.transactionId}`)
                        : (c.Property?.address || `#${c.propertyId}`);
                      return (
                        <tr key={c.id} className={tableRow}>
                          <td className="px-4 py-3 text-sm font-medium text-textPrimary">{agentName}</td>
                          <td className="px-4 py-3 text-sm text-textSecondary max-w-[140px] truncate">{propAddr}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${TX_BADGE[c.transactionType] || ''}`}>
                              {TRANSACTION_TYPES.find((t) => t.value === c.transactionType)?.label || c.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-textPrimary">{formatCurrency(c.transactionAmount)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-brand-light">
                            {c.agentCommissionAmount != null ? formatCurrency(c.agentCommissionAmount) : '—'}
                            {c.agentCommissionFixedAmount != null && (
                              <span className="text-textMuted text-xs ml-1">(fijo)</span>
                            )}
                            {c.agentCommissionFixedAmount == null && c.agentCommissionPercent != null && (
                              <span className="text-textMuted text-xs ml-1">({c.agentCommissionPercent}%)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[c.status] || ''}`}>
                              {STATUS_LIST.find((s) => s.value === c.status)?.label || c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-textMuted">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isSuperAdmin && c.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => openEdit(c)}
                                    className="p-1.5 rounded hover:bg-brand-subtle text-textMuted hover:text-textPrimary transition-colors"
                                    title="Editar"
                                  >
                                    <IoPencilOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(c.id)}
                                    className="p-1.5 rounded hover:bg-customBlueMuted text-textMuted hover:text-customBlue transition-colors"
                                    title="Aprobar"
                                  >
                                    <IoCheckmarkDoneOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(c.id)}
                                    className="p-1.5 rounded hover:bg-customRedMuted text-textMuted hover:text-customRed transition-colors"
                                    title="Cancelar"
                                  >
                                    <IoCloseCircleOutline className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {isSuperAdmin && c.status === 'APPROVED' && (
                                <>
                                  <button
                                    onClick={() => handlePay(c.id)}
                                    className="p-1.5 rounded hover:bg-brand-muted text-textMuted hover:text-brand-light transition-colors"
                                    title="Marcar como pagada"
                                  >
                                    <IoCashOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(c.id)}
                                    className="p-1.5 rounded hover:bg-customRedMuted text-textMuted hover:text-customRed transition-colors"
                                    title="Cancelar"
                                  >
                                    <IoCloseCircleOutline className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'liquidacion' && (
          <>
            {/* Selector de período */}
            <div className={`${card} p-4 mb-6 flex flex-wrap gap-3 items-end`}>
              <div>
                <label className={labelClass}>Año</label>
                <input
                  type="number"
                  value={settlementPeriod.year}
                  onChange={(e) => setSettlementPeriod({ ...settlementPeriod, year: e.target.value })}
                  className={`${inputClass} w-24`}
                  min="2020" max="2099"
                />
              </div>
              <div>
                <label className={labelClass}>Mes</label>
                <select
                  value={settlementPeriod.month}
                  onChange={(e) => setSettlementPeriod({ ...settlementPeriod, month: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Todo el año</option>
                  {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {settlement.length === 0 ? (
              <div className="text-center py-16">
                <IoStatsChartOutline className="w-16 h-16 text-textMuted mx-auto mb-4" />
                <p className="text-textMuted">No hay datos para el período seleccionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlement.map(({ agent, operationsCount, totalTransactionAmount, totalInmobiliariaCommission, totalAgentCommission, byStatus }) => (
                  <div key={agent.adminId} className={`${card} p-5`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{agent.fullName || agent.username}</h3>
                        <p className="text-textMuted text-sm">@{agent.username} · {operationsCount} operaciones</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-light">{formatCurrency(totalAgentCommission)}</p>
                        <p className="text-textMuted text-xs">comisión total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-bgElevated rounded-lg p-3">
                        <p className="text-xs text-textMuted">Vol. operaciones</p>
                        <p className="font-semibold">{formatCurrency(totalTransactionAmount)}</p>
                      </div>
                      <div className="bg-bgElevated rounded-lg p-3">
                        <p className="text-xs text-textMuted">Com. inmobiliaria</p>
                        <p className="font-semibold text-customBlue">{formatCurrency(totalInmobiliariaCommission)}</p>
                      </div>
                      {byStatus.map((s) => (
                        <div key={s.status} className={`rounded-lg p-3 ${STATUS_BADGE[s.status] || 'bg-bgElevated'}`}>
                          <p className="text-xs opacity-70">{STATUS_LIST.find((st) => st.value === s.status)?.label || s.status}</p>
                          <p className="font-semibold">{formatCurrency(s.amount)} <span className="text-xs opacity-70">({s.count})</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      {/* Modal crear / editar comisión */}
      {showModal && (
        <div className={modalOverlay}>
          <div className={`${modalBox} max-w-lg my-4`}>
            <div className={modalHeader}>
              <h2 className="text-lg font-bold flex items-center gap-2 text-textPrimary">
                <IoCashOutline className="w-5 h-5 text-brand-light" />
                {editingId ? 'Editar comisión' : 'Nueva comisión'}
              </h2>
              <button type="button" onClick={closeModal} className="text-textMuted hover:text-textPrimary">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className={alertError}>
                  <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Agente *</label>
                  <select
                    value={form.agentId}
                    onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                    disabled={isAgent}
                    className={`${selectClass} w-full disabled:opacity-60`}
                    required
                  >
                    <option value="">Seleccionar agente</option>
                    {agents.map((a) => (
                      <option key={a.adminId} value={a.adminId}>
                        {a.fullName || a.username}
                      </option>
                    ))}
                  </select>
                  {isAgent && (
                    <p className="text-textMuted text-xs mt-1">
                      Solo podés cargar comisiones a tu nombre para revisión del administrador.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Tipo de operación *</label>
                  <select
                    value={form.transactionType}
                    onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                    className={inputClass}
                    required
                  >
                    {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    ID Propiedad {propertyRequired ? '*' : '(opcional)'}
                  </label>
                  <input
                    type="number"
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    placeholder={propertyRequired ? 'ID propiedad' : 'Solo si aplica'}
                    className={inputClass}
                    required={propertyRequired}
                    min={0}
                  />
                </div>

                <div>
                  <label className={labelClass}>Importe de la operación *</label>
                  <input
                    type="number"
                    value={form.transactionAmount}
                    onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })}
                    placeholder="0"
                    className={inputClass}
                    required min="0" step="0.01"
                  />
                </div>

                <div>
                  <label className={labelClass}>ID cliente (opcional)</label>
                  <input
                    type="number"
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    placeholder="ID cliente"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>% com. inmobiliaria</label>
                  <input
                    type="number"
                    value={form.inmobiliariaCommissionPercent}
                    onChange={(e) => setForm({ ...form, inmobiliariaCommissionPercent: e.target.value })}
                    placeholder="ej: 3"
                    className={inputClass}
                    min="0" max="100" step="0.01"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <span className={`block ${labelClass}`}>Comisión del agente *</span>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="commissionBasis"
                        checked={form.commissionBasis === 'percent'}
                        onChange={() => setForm({ ...form, commissionBasis: 'percent' })}
                        className="text-brand"
                      />
                      <span className="text-textSecondary">Porcentaje del importe</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="commissionBasis"
                        checked={form.commissionBasis === 'fixed'}
                        onChange={() => setForm({ ...form, commissionBasis: 'fixed' })}
                        className="text-brand"
                      />
                      <span className="text-textSecondary">Monto fijo ($)</span>
                    </label>
                  </div>
                  {form.commissionBasis === 'percent' ? (
                    <input
                      type="number"
                      value={form.agentCommissionPercent}
                      onChange={(e) => setForm({ ...form, agentCommissionPercent: e.target.value })}
                      placeholder="ej: 50 (sobre la operación)"
                      className={inputClass}
                      min="0" max="100" step="0.01"
                    />
                  ) : (
                    <input
                      type="number"
                      value={form.agentCommissionFixedAmount}
                      onChange={(e) => setForm({ ...form, agentCommissionFixedAmount: e.target.value })}
                      placeholder="Monto fijo en $"
                      className={inputClass}
                      min="0" step="0.01"
                    />
                  )}
                </div>

                <div className="col-span-2">
                  <label className={labelClass}>Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Detalles adicionales..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {form.transactionAmount && (form.inmobiliariaCommissionPercent || (form.commissionBasis === 'percent' ? form.agentCommissionPercent : form.agentCommissionFixedAmount)) && (
                <div className="bg-bgElevated rounded-lg p-3 text-sm space-y-1">
                  <p className="text-textMuted text-xs font-medium uppercase tracking-wide">Vista previa</p>
                  {form.inmobiliariaCommissionPercent && (
                    <p className="text-customBlue">
                      Com. inmobiliaria:{' '}
                      {formatCurrency((parseFloat(form.transactionAmount, 10) * parseFloat(form.inmobiliariaCommissionPercent, 10)) / 100)}
                    </p>
                  )}
                  {form.commissionBasis === 'percent' && form.agentCommissionPercent && (
                    <p className="text-brand-light font-medium">
                      Com. agente:{' '}
                      {formatCurrency((parseFloat(form.transactionAmount, 10) * parseFloat(form.agentCommissionPercent, 10)) / 100)}
                    </p>
                  )}
                  {form.commissionBasis === 'fixed' && form.agentCommissionFixedAmount && (
                    <p className="text-brand-light font-medium">
                      Com. agente (fijo): {formatCurrency(parseFloat(form.agentCommissionFixedAmount, 10))}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`flex-1 ${btnSecondary} justify-center`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className={`flex-1 ${btnPrimary} justify-center`}
                >
                  {(isCreating || isUpdating) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IoCheckmarkCircleOutline className="w-5 h-5" />
                  )}
                  {editingId ? 'Guardar cambios' : 'Registrar comisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
}
