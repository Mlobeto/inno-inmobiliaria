import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentUser,
  logout as logoutAction,
  useGetAllLeadsQuery,
  useGetAgentsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadAgentMutation,
  useUnassignLeadAgentMutation,
  useDeleteLeadMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoTrashOutline,
  IoPencilOutline,
  IoPersonOutline,
  IoPersonAddOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCloseOutline,
  IoCheckmarkOutline,
  IoChatbubblesOutline,
} from 'react-icons/io5';

const COLUMNS = [
  { key: 'NUEVO', label: 'Nuevo', color: 'blue' },
  { key: 'CONTACTADO', label: 'Contactado', color: 'yellow' },
  { key: 'EN_SEGUIMIENTO', label: 'En Seguimiento', color: 'purple' },
  { key: 'CERRADO_GANADO', label: 'Ganado', color: 'emerald' },
  { key: 'CERRADO_PERDIDO', label: 'Perdido', color: 'red' },
];

const COLUMN_STYLES = {
  blue:    'border-blue-500/40 bg-blue-500/10',
  yellow:  'border-yellow-500/40 bg-yellow-500/10',
  purple:  'border-purple-500/40 bg-purple-500/10',
  emerald: 'border-emerald-500/40 bg-emerald-500/10',
  red:     'border-red-500/40 bg-red-500/10',
};

const BADGE_STYLES = {
  blue:    'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  yellow:  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  purple:  'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  red:     'bg-red-500/20 text-red-300 border border-red-500/30',
};

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  operationType: '',
  budget: '',
  currency: 'ARS',
  zone: '',
  notes: '',
  status: 'NUEVO',
  agentIds: [],
};

export default function PanelLeads() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAgent = currentUser?.role === 'AGENT';

  const { data, isLoading } = useGetAllLeadsQuery();
  const { data: agentsRaw = [] } = useGetAgentsQuery(undefined, { skip: !isSuperAdmin });
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [assignLeadAgent] = useAssignLeadAgentMutation();
  const [unassignLeadAgent] = useUnassignLeadAgentMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = data?.leads || [];
  const agents = Array.isArray(agentsRaw) ? agentsRaw : [];

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getLeadsByStatus = (status) => leads.filter((l) => l.status === status);

  const openCreate = () => {
    setEditingLead(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    const assigned = lead.assignedAgents || [];
    setForm({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      operationType: lead.operationType || '',
      budget: lead.budget !== null && lead.budget !== undefined ? String(lead.budget) : '',
      currency: lead.currency || 'ARS',
      zone: lead.zone || '',
      notes: lead.notes || '',
      status: lead.status || 'NUEVO',
      agentIds: assigned.map((a) => a.adminId),
    });
    setError('');
    setShowModal(true);
  };

  const buildPayloadFields = () => ({
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    operationType: form.operationType || undefined,
    budget: form.budget === '' ? null : Number(form.budget),
    currency: form.currency || 'ARS',
    zone: form.zone.trim() || undefined,
    notes: form.notes.trim() || undefined,
    status: form.status,
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const base = buildPayloadFields();
      if (editingLead) {
        await updateLead({
          id: editingLead.id,
          ...base,
          ...(isSuperAdmin ? { agentIds: form.agentIds } : {}),
        }).unwrap();
      } else {
        await createLead({
          ...base,
          ...(isSuperAdmin ? { agentIds: form.agentIds } : {}),
        }).unwrap();
      }
      setShowModal(false);
    } catch {
      setError('Error al guardar el lead');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lead) => {
    if (!window.confirm(`¿Eliminar a "${lead.name}"?`)) return;
    try {
      await deleteLead(lead.id).unwrap();
    } catch {
      // silencioso
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    try {
      await updateLead({ id: lead.id, status: newStatus }).unwrap();
    } catch {
      // silencioso
    }
  };

  const subtitle = useMemo(() => {
    if (isAgent) return `${leads.length} lead${leads.length !== 1 ? 's' : ''} asignados a vos`;
    return `${leads.length} lead${leads.length !== 1 ? 's' : ''} en total`;
  }, [isAgent, leads.length]);

  const toggleAgentId = (adminId) => {
    setForm((prev) => {
      const has = prev.agentIds.includes(adminId);
      return {
        ...prev,
        agentIds: has ? prev.agentIds.filter((x) => x !== adminId) : [...prev.agentIds, adminId],
      };
    });
  };

  const handleQuickAssignAgent = async (leadId, agentId) => {
    try {
      await assignLeadAgent({ leadId, agentId }).unwrap();
    } catch {
      alert('No se pudo asignar el agente. Intentá de nuevo.');
    }
  };

  const handleQuickUnassignAgent = async (leadId, agentId) => {
    if (!window.confirm('¿Quitar a este agente del lead?')) return;
    try {
      await unassignLeadAgent({ leadId, agentId }).unwrap();
    } catch {
      alert('No se pudo quitar la asignación.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              to={isAgent ? '/panelComisiones' : '/panel'}
              className="text-white flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <IoArrowBack className="w-5 h-5" />
              <span className="hidden sm:inline">{isAgent ? 'Mis comisiones' : 'Panel'}</span>
            </Link>
            <h1 className="text-white text-xl font-bold">CRM / Leads</h1>
            <span className="text-slate-400 text-sm hidden sm:inline">
              {subtitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <IoAdd className="w-5 h-5" />
              Nuevo Lead
            </button>
            {isAgent && (
              <>
                <Link
                  to="/soporte"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                  title="Soporte GestProp"
                >
                  <IoChatbubblesOutline className="w-5 h-5" />
                  <span className="hidden sm:inline">Soporte</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(logoutAction());
                    navigate('/login');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-sm transition-colors border border-white/10"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center text-slate-400 py-20">Cargando leads...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {COLUMNS.map((col) => {
              const colLeads = getLeadsByStatus(col.key);
              return (
                <div
                  key={col.key}
                  className={`rounded-xl border p-3 flex flex-col gap-3 ${COLUMN_STYLES[col.color]}`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${BADGE_STYLES[col.color]}`}>
                      {col.label}
                    </span>
                    <span className="text-slate-400 text-xs font-bold">{colLeads.length}</span>
                  </div>

                  {/* Cards */}
                  {colLeads.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-4">Sin leads</p>
                  )}
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      agents={agents}
                      columns={COLUMNS}
                      canDelete={!isAgent}
                      showQuickAssign={isSuperAdmin && agents.length > 0}
                      onQuickAssign={(agentId) => handleQuickAssignAgent(lead.id, agentId)}
                      onQuickUnassign={(agentId) => handleQuickUnassignAgent(lead.id, agentId)}
                      onEdit={() => openEdit(lead)}
                      onDelete={() => handleDelete(lead)}
                      onStatusChange={(s) => handleStatusChange(lead, s)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <LeadModal
          form={form}
          editing={!!editingLead}
          saving={saving}
          error={error}
          onChange={handleChange}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          agents={agents}
          showAssignments={isSuperAdmin}
          onToggleAgent={toggleAgentId}
        />
      )}
    </div>
  );
}

function LeadCard({
  lead,
  agents,
  columns,
  canDelete,
  showQuickAssign,
  onQuickAssign,
  onQuickUnassign,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [showMove, setShowMove] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);

  const assigned = lead.assignedAgents || [];
  const assignedIds = new Set(assigned.map((a) => a.adminId));
  const availableToAdd = (agents || []).filter((a) => !assignedIds.has(a.adminId));

  return (
    <div className="relative bg-slate-800/80 border border-white/10 rounded-lg p-3 flex flex-col gap-2 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-sm font-semibold leading-tight break-words">{lead.name}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showQuickAssign && (
            <button
              type="button"
              onClick={() => setShowAddAgent((v) => !v)}
              className={`text-slate-400 hover:text-indigo-300 transition-colors rounded p-0.5 ${showAddAgent ? 'text-indigo-300' : ''}`}
              title="Asignar agente"
              aria-expanded={showAddAgent}
              aria-haspopup="listbox"
            >
              <IoPersonAddOutline className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onEdit} className="text-slate-400 hover:text-white transition-colors" title="Editar">
            <IoPencilOutline className="w-4 h-4" />
          </button>
          {canDelete && (
            <button type="button" onClick={onDelete} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
              <IoTrashOutline className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showQuickAssign && showAddAgent && (
        <div className="absolute right-2 top-9 z-[15] bg-slate-900 border border-indigo-500/30 rounded-lg shadow-xl py-1 min-w-[180px] max-h-40 overflow-y-auto">
          {availableToAdd.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-slate-500">Todos ya asignados</p>
          ) : (
            availableToAdd.map((a) => (
              <button
                key={a.adminId}
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-indigo-500/20 truncate"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onQuickAssign(a.adminId);
                  setShowAddAgent(false);
                }}
              >
                + {a.fullName || a.username}
              </button>
            ))
          )}
        </div>
      )}

      {assigned.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {assigned.map((a) => (
            <span
              key={a.adminId}
              title={a.email || ''}
              className="inline-flex items-center gap-1 text-[10px] pl-2 pr-1 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 max-w-full"
            >
              <span className="truncate">{a.fullName || a.username || `Agente #${a.adminId}`}</span>
              {showQuickAssign && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUnassign(a.adminId);
                  }}
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-red-500/30 text-indigo-200 hover:text-red-300"
                  title="Quitar agente"
                  aria-label="Quitar agente"
                >
                  <IoCloseOutline className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {lead.phone && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <IoCallOutline className="w-3 h-3 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
      )}
      {lead.email && (
        <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
          <IoMailOutline className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}
      {lead.zone && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <IoLocationOutline className="w-3 h-3 flex-shrink-0" />
          <span>{lead.zone}</span>
        </div>
      )}
      {(lead.budget || lead.operationType) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {lead.operationType && (
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              {lead.operationType}
            </span>
          )}
          {lead.budget && (
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
              {lead.currency} {Number(lead.budget).toLocaleString('es-AR')}
            </span>
          )}
        </div>
      )}

      {/* Mover columna */}
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => setShowMove((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full text-left"
        >
          Mover →
        </button>
        {showMove && (
          <div className="absolute bottom-full left-0 mb-1 bg-slate-700 border border-white/10 rounded-lg shadow-xl z-10 py-1 min-w-max">
            {columns
              .filter((c) => c.key !== lead.status)
              .map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => { onStatusChange(c.key); setShowMove(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                >
                  <IoCheckmarkOutline className="w-3 h-3 opacity-0 invisible" />
                  {c.label}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadModal({
  form,
  editing,
  saving,
  error,
  onChange,
  onSave,
  onClose,
  agents,
  showAssignments,
  onToggleAgent,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <IoPersonOutline className="w-5 h-5" />
            {editing ? 'Editar Lead' : 'Nuevo Lead'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 block">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Nombre del lead"
              className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Teléfono / Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 block">Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+54 9 ..."
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 block">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="email@ejemplo.com"
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Operación / Zona */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 block">Operación</label>
              <select
                name="operationType"
                value={form.operationType}
                onChange={onChange}
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">Sin especificar</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler o Venta">Alquiler o Venta</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 block">Zona / Barrio</label>
              <input
                name="zone"
                value={form.zone}
                onChange={onChange}
                placeholder="Ej: Centro, Palermo..."
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Presupuesto */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-300 text-sm font-medium mb-1 block">Presupuesto</label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={onChange}
                placeholder="0"
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium mb-1 block">Moneda</label>
              <select
                name="currency"
                value={form.currency}
                onChange={onChange}
                className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 block">Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="NUEVO">Nuevo</option>
              <option value="CONTACTADO">Contactado</option>
              <option value="EN_SEGUIMIENTO">En Seguimiento</option>
              <option value="CERRADO_GANADO">Cerrado - Ganado</option>
              <option value="CERRADO_PERDIDO">Cerrado - Perdido</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="text-slate-300 text-sm font-medium mb-1 block">Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={3}
              placeholder="Información adicional sobre el lead..."
              className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
            />
          </div>

          {/* Asignación a agentes (solo admin principal) */}
          {showAssignments && (
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                Agentes asignados <span className="text-slate-500 font-normal">(opcional, varios)</span>
              </label>
              {agents.length === 0 ? (
                <p className="text-slate-500 text-xs">No hay agentes cargados.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-2 space-y-1.5">
                  {agents.map((a) => (
                    <label
                      key={a.adminId}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer text-sm text-slate-200"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-500 text-blue-600 focus:ring-blue-500"
                        checked={form.agentIds?.includes?.(a.adminId) ?? false}
                        onChange={() => onToggleAgent(a.adminId)}
                      />
                      <span>{a.fullName || a.username}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-slate-500 text-xs mt-1">
                Los nuevos leads creados por un agente se asignan siempre al agente automáticamente.
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
