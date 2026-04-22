import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
} from 'react-icons/io5';

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
  PENDING: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  APPROVED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  PAID: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const TX_BADGE = {
  VENTA: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ALQUILER: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  ALQUILER_TEMPORAL: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  VENTA_LOTE: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
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
  notes: '',
};

const now = new Date();

export default function PanelComisiones() {
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
  const { data: settlementData } = useGetSettlementQuery(settlementPeriod, { skip: activeTab !== 'liquidacion' });
  const { data: agentsRaw = [] } = useGetAgentsQuery();

  const [createCommission, { isLoading: isCreating }] = useCreateCommissionMutation();
  const [updateCommission, { isLoading: isUpdating }] = useUpdateCommissionMutation();
  const [approveCommission] = useApproveCommissionMutation();
  const [markCommissionPaid] = useMarkCommissionPaidMutation();
  const [cancelCommission] = useCancelCommissionMutation();

  const commissions = commData?.commissions || [];
  const totals = commData?.totals || {};
  const settlement = settlementData?.settlement || [];
  const agents = Array.isArray(agentsRaw) ? agentsRaw : [];

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (comm) => {
    setEditingId(comm.id);
    setForm({
      agentId: String(comm.agentId),
      transactionType: comm.transactionType,
      transactionId: String(comm.transactionId || ''),
      propertyId: comm.propertyId != null ? String(comm.propertyId) : '',
      clientId: String(comm.clientId || ''),
      transactionAmount: String(comm.transactionAmount),
      inmobiliariaCommissionPercent: comm.inmobiliariaCommissionPercent != null ? String(comm.inmobiliariaCommissionPercent) : '',
      agentCommissionPercent: comm.agentCommissionPercent != null ? String(comm.agentCommissionPercent) : '',
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
    try {
      const payload = {
        agentId: Number(form.agentId),
        transactionType: form.transactionType,
        transactionId: form.transactionId ? Number(form.transactionId) : undefined,
        propertyId: Number(form.propertyId),
        clientId: form.clientId ? Number(form.clientId) : undefined,
        transactionAmount: Number(form.transactionAmount),
        inmobiliariaCommissionPercent: form.inmobiliariaCommissionPercent ? Number(form.inmobiliariaCommissionPercent) : null,
        agentCommissionPercent: form.agentCommissionPercent ? Number(form.agentCommissionPercent) : null,
        notes: form.notes || '',
      };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/panel" className="flex items-center text-slate-300 hover:text-white transition-colors">
              <IoArrowBack className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IoCashOutline className="w-7 h-7 text-emerald-400" />
                Comisiones
              </h1>
              <p className="text-slate-400 text-sm mt-1">Gestioná y liquidá las comisiones de tus agentes</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            <IoAdd className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>

        {/* Alertas */}
        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-300">
            <IoCheckmarkCircleOutline className="w-5 h-5" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
            <IoAlertCircleOutline className="w-5 h-5" />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><IoCloseOutline /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'lista' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <IoDocumentTextOutline className="inline w-4 h-4 mr-1" />
            Lista de comisiones
          </button>
          <button
            onClick={() => setActiveTab('liquidacion')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'liquidacion' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <IoStatsChartOutline className="inline w-4 h-4 mr-1" />
            Liquidación
          </button>
        </div>

        {activeTab === 'lista' && (
          <>
            {/* Totales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-slate-400 text-xs mb-1">Volumen de operaciones</p>
                <p className="text-xl font-bold">{formatCurrency(totals.transactionAmount)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-slate-400 text-xs mb-1">Comisión inmobiliaria</p>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(totals.inmobiliariaCommissionAmount)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-slate-400 text-xs mb-1">Comisión agentes</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.agentCommissionAmount)}</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 flex flex-wrap gap-3 items-end">
              <IoFilterOutline className="w-5 h-5 text-slate-400 self-center" />
              <div>
                <label className="block text-xs text-slate-400 mb-1">Agente</label>
                <select
                  value={filters.agentId}
                  onChange={(e) => setFilters({ ...filters, agentId: e.target.value, page: 1 })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
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
                <label className="block text-xs text-slate-400 mb-1">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                >
                  <option value="">Todos</option>
                  {STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value, page: 1 })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                >
                  <option value="">Todos</option>
                  {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Año</label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value, page: 1 })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24 focus:outline-none"
                  min="2020" max="2099"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mes</label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value, page: 1 })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
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
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-16">
                <IoCashOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hay comisiones para los filtros seleccionados</p>
                <button onClick={openCreate} className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors">
                  Registrar primera comisión
                </button>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left px-4 py-3 text-slate-300 font-medium text-xs">Agente</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-medium text-xs">Propiedad</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-medium text-xs">Tipo</th>
                      <th className="text-right px-4 py-3 text-slate-300 font-medium text-xs">Importe op.</th>
                      <th className="text-right px-4 py-3 text-slate-300 font-medium text-xs">Comisión agente</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-medium text-xs">Estado</th>
                      <th className="text-left px-4 py-3 text-slate-300 font-medium text-xs">Fecha</th>
                      <th className="text-right px-4 py-3 text-slate-300 font-medium text-xs">Acciones</th>
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
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">{agentName}</td>
                          <td className="px-4 py-3 text-sm text-slate-300 max-w-[140px] truncate">{propAddr}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${TX_BADGE[c.transactionType] || ''}`}>
                              {TRANSACTION_TYPES.find((t) => t.value === c.transactionType)?.label || c.transactionType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{formatCurrency(c.transactionAmount)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-emerald-400">
                            {c.agentCommissionAmount != null ? formatCurrency(c.agentCommissionAmount) : '—'}
                            {c.agentCommissionPercent != null && (
                              <span className="text-slate-500 text-xs ml-1">({c.agentCommissionPercent}%)</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[c.status] || ''}`}>
                              {STATUS_LIST.find((s) => s.value === c.status)?.label || c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {c.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => openEdit(c)}
                                    className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    title="Editar"
                                  >
                                    <IoPencilOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleApprove(c.id)}
                                    className="p-1.5 rounded hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                                    title="Aprobar"
                                  >
                                    <IoCheckmarkDoneOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(c.id)}
                                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                    title="Cancelar"
                                  >
                                    <IoCloseCircleOutline className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {c.status === 'APPROVED' && (
                                <>
                                  <button
                                    onClick={() => handlePay(c.id)}
                                    className="p-1.5 rounded hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                    title="Marcar como pagada"
                                  >
                                    <IoCashOutline className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCancel(c.id)}
                                    className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
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
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Año</label>
                <input
                  type="number"
                  value={settlementPeriod.year}
                  onChange={(e) => setSettlementPeriod({ ...settlementPeriod, year: e.target.value })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm w-24 focus:outline-none"
                  min="2020" max="2099"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mes</label>
                <select
                  value={settlementPeriod.month}
                  onChange={(e) => setSettlementPeriod({ ...settlementPeriod, month: e.target.value })}
                  className="bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
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
                <IoStatsChartOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hay datos para el período seleccionado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settlement.map(({ agent, operationsCount, totalTransactionAmount, totalInmobiliariaCommission, totalAgentCommission, byStatus }) => (
                  <div key={agent.adminId} className="bg-white/5 rounded-xl border border-white/10 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{agent.fullName || agent.username}</h3>
                        <p className="text-slate-400 text-sm">@{agent.username} · {operationsCount} operaciones</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalAgentCommission)}</p>
                        <p className="text-slate-400 text-xs">comisión total</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-400">Vol. operaciones</p>
                        <p className="font-semibold">{formatCurrency(totalTransactionAmount)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-slate-400">Com. inmobiliaria</p>
                        <p className="font-semibold text-blue-400">{formatCurrency(totalInmobiliariaCommission)}</p>
                      </div>
                      {byStatus.map((s) => (
                        <div key={s.status} className={`rounded-lg p-3 ${STATUS_BADGE[s.status] || 'bg-white/5'}`}>
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
      </div>

      {/* Modal crear / editar comisión */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-xl border border-white/20 w-full max-w-lg shadow-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IoCashOutline className="w-5 h-5 text-emerald-400" />
                {editingId ? 'Editar comisión' : 'Nueva comisión'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  <IoAlertCircleOutline className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Agente *</label>
                  <select
                    value={form.agentId}
                    onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">Seleccionar agente</option>
                    {agents.map((a) => (
                      <option key={a.adminId} value={a.adminId}>
                        {a.fullName || a.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tipo de operación *</label>
                  <select
                    value={form.transactionType}
                    onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {TRANSACTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">ID Propiedad *</label>
                  <input
                    type="number"
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    placeholder="ID"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Importe de la operación *</label>
                  <input
                    type="number"
                    value={form.transactionAmount}
                    onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required min="0" step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">ID cliente (opcional)</label>
                  <input
                    type="number"
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    placeholder="ID cliente"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">% com. inmobiliaria</label>
                  <input
                    type="number"
                    value={form.inmobiliariaCommissionPercent}
                    onChange={(e) => setForm({ ...form, inmobiliariaCommissionPercent: e.target.value })}
                    placeholder="ej: 3"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    min="0" max="100" step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">% com. agente</label>
                  <input
                    type="number"
                    value={form.agentCommissionPercent}
                    onChange={(e) => setForm({ ...form, agentCommissionPercent: e.target.value })}
                    placeholder="ej: 50"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    min="0" max="100" step="0.01"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-slate-300 mb-1">Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Detalles adicionales..."
                    rows={3}
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Preview de montos */}
              {form.transactionAmount && (form.inmobiliariaCommissionPercent || form.agentCommissionPercent) && (
                <div className="bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Vista previa</p>
                  {form.inmobiliariaCommissionPercent && (
                    <p className="text-blue-300">
                      Com. inmobiliaria: {formatCurrency((parseFloat(form.transactionAmount) * parseFloat(form.inmobiliariaCommissionPercent)) / 100)}
                    </p>
                  )}
                  {form.agentCommissionPercent && (
                    <p className="text-emerald-300 font-medium">
                      Com. agente: {formatCurrency((parseFloat(form.transactionAmount) * parseFloat(form.agentCommissionPercent)) / 100)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
    </div>
  );
}
