import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
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
import { AdminPanelLayout } from './AdminPanelLayout';
import { alertError, btnGhost, btnPrimary, btnSecondary, inputClass, labelClass, modalBox, modalHeader, modalOverlay, selectClass } from './adminPanelTheme';

const COLUMNS = [
  { key: 'NUEVO', label: 'Nuevo', color: 'blue' },
  { key: 'CONTACTADO', label: 'Contactado', color: 'yellow' },
  { key: 'EN_SEGUIMIENTO', label: 'En Seguimiento', color: 'purple' },
  { key: 'CERRADO_GANADO', label: 'Ganado', color: 'emerald' },
  { key: 'CERRADO_PERDIDO', label: 'Perdido', color: 'red' },
];

const COLUMN_KEYS = new Set(COLUMNS.map((c) => c.key));

const normalizeLeadStatus = (status) => {
  if (!status) return 'NUEVO';
  const raw = String(status).trim();
  if (COLUMN_KEYS.has(raw)) return raw;
  const upper = raw.toUpperCase().replace(/\s+/g, '_');
  return COLUMN_KEYS.has(upper) ? upper : raw;
};

const COLUMN_STYLES = {
  blue: 'border-customBlue/30 bg-customBlueMuted/40',
  yellow: 'border-customYellow/30 bg-customYellowMuted/40',
  purple: 'border-brand/30 bg-brand-subtle/60',
  emerald: 'border-borderStrong bg-brand-muted/50',
  red: 'border-customRed/30 bg-customRedMuted/40',
};

const BADGE_STYLES = {
  blue: 'bg-customBlueMuted text-customBlue border border-customBlue/30',
  yellow: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
  purple: 'bg-brand-muted text-brand-light border border-borderStrong',
  emerald: 'bg-brand-muted text-brand-light border border-borderStrong',
  red: 'bg-customRedMuted text-customRed border border-customRed/30',
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

  const { data, isLoading, isFetching } = useGetAllLeadsQuery();
  const { data: agentsRaw = [] } = useGetAgentsQuery(undefined, { skip: !isSuperAdmin });
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [assignLeadAgent] = useAssignLeadAgentMutation();
  const [unassignLeadAgent] = useUnassignLeadAgentMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = useMemo(
    () => (data?.leads || []).map((l) => ({ ...l, status: normalizeLeadStatus(l.status) })),
    [data?.leads],
  );
  const agents = Array.isArray(agentsRaw) ? agentsRaw : [];
  const orphanLeads = useMemo(
    () => leads.filter((l) => !COLUMN_KEYS.has(l.status)),
    [leads],
  );

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
      status: normalizeLeadStatus(lead.status),
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
    } catch (err) {
      const msg = err?.data?.message || 'No se pudo mover el lead. Intentá de nuevo.';
      alert(msg);
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
    <AdminPanelLayout
      wide
      backTo={isAgent ? '/panelComisiones' : '/panel'}
      backLabel={isAgent ? 'Mis comisiones' : 'Panel'}
      title="CRM / Leads"
      subtitle={subtitle}
      icon={IoChatbubblesOutline}
      actions={
        <>
          <button type="button" onClick={openCreate} className={btnPrimary}>
            <IoAdd className="w-5 h-5" />
            Nuevo Lead
          </button>
          {isAgent && (
            <>
              <Link to="/soporte" className={btnGhost}>
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
              >
                Salir
              </button>
            </>
          )}
        </>
      }
    >
      <div>
        {isLoading && !data ? (
          <div className="text-center text-textMuted py-16">Cargando leads...</div>
        ) : (
          <>
            {isFetching && (
              <p className="text-xs text-textMuted mb-3">Actualizando tablero...</p>
            )}
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex gap-4 min-w-max">
                {COLUMNS.map((col) => {
                  const colLeads = getLeadsByStatus(col.key);
                  return (
                    <div
                      key={col.key}
                      className={`w-[min(100%,280px)] sm:w-[280px] shrink-0 rounded-xl border p-3 flex flex-col gap-3 min-h-[120px] ${COLUMN_STYLES[col.color]}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${BADGE_STYLES[col.color]}`}>
                          {col.label}
                        </span>
                        <span className="text-textMuted text-xs font-bold">{colLeads.length}</span>
                      </div>

                      {colLeads.length === 0 && (
                        <p className="text-textMuted text-xs text-center py-4">Sin leads</p>
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
            </div>

            {orphanLeads.length > 0 && (
              <div className="mt-4 rounded-xl border border-customYellow/30 bg-customYellowMuted/40 p-3">
                <p className="text-xs font-semibold text-customYellow mb-2">
                  Leads con estado desconocido ({orphanLeads.length})
                </p>
                <div className="flex flex-col gap-2">
                  {orphanLeads.map((lead) => (
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
              </div>
            )}
          </>
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
    </AdminPanelLayout>
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
    <div className="relative bg-bgSurface border border-borderBase rounded-lg p-3 flex flex-col gap-2 hover:border-borderStrong transition-colors">
        <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <p className="text-textPrimary text-sm font-semibold leading-tight break-words">{lead.name}</p>
          {lead.mercadolibreQuestionId && (
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-500/35"
              title="Origen: pregunta en publicación Mercado Libre"
            >
              ML · #{lead.mercadolibreQuestionId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {showQuickAssign && (
            <button
              type="button"
              onClick={() => setShowAddAgent((v) => !v)}
              className={`text-textMuted hover:text-brand-light transition-colors rounded p-0.5 ${showAddAgent ? 'text-brand-light' : ''}`}
              title="Asignar agente"
              aria-expanded={showAddAgent}
              aria-haspopup="listbox"
            >
              <IoPersonAddOutline className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={onEdit} className="text-textMuted hover:text-textPrimary transition-colors" title="Editar">
            <IoPencilOutline className="w-4 h-4" />
          </button>
          {canDelete && (
            <button type="button" onClick={onDelete} className="text-textMuted hover:text-customRed transition-colors" title="Eliminar">
              <IoTrashOutline className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showQuickAssign && showAddAgent && (
        <div className="absolute right-2 top-9 z-[15] bg-bgSurface border border-borderStrong rounded-lg shadow-xl py-1 min-w-[180px] max-h-40 overflow-y-auto">
          {availableToAdd.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-textMuted">Todos ya asignados</p>
          ) : (
            availableToAdd.map((a) => (
              <button
                key={a.adminId}
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs text-textSecondary hover:bg-brand-subtle truncate"
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
              className="inline-flex items-center gap-1 text-[10px] pl-2 pr-1 py-0.5 rounded-full bg-brand-muted text-brand-light border border-borderStrong max-w-full"
            >
              <span className="truncate">{a.fullName || a.username || `Agente #${a.adminId}`}</span>
              {showQuickAssign && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUnassign(a.adminId);
                  }}
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-customRedMuted text-brand-light hover:text-customRed"
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
        <div className="flex items-center gap-1 text-xs text-textMuted">
          <IoCallOutline className="w-3 h-3 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
      )}
      {lead.email && (
        <div className="flex items-center gap-1 text-xs text-textMuted truncate">
          <IoMailOutline className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}
      {lead.zone && (
        <div className="flex items-center gap-1 text-xs text-textMuted">
          <IoLocationOutline className="w-3 h-3 flex-shrink-0" />
          <span>{lead.zone}</span>
        </div>
      )}
      {(lead.budget || lead.operationType) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {lead.operationType && (
            <span className="text-xs bg-bgElevated text-textSecondary px-2 py-0.5 rounded-full">
              {lead.operationType}
            </span>
          )}
          {lead.budget && (
            <span className="text-xs bg-bgElevated text-textSecondary px-2 py-0.5 rounded-full">
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
          className="text-xs text-textMuted hover:text-textSecondary transition-colors w-full text-left"
        >
          Mover →
        </button>
        {showMove && (
          <div className="absolute bottom-full left-0 mb-1 bg-bgElevated border border-borderBase rounded-lg shadow-xl z-10 py-1 min-w-max">
            {columns
              .filter((c) => c.key !== lead.status)
              .map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => { onStatusChange(c.key); setShowMove(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-textSecondary hover:bg-brand-subtle transition-colors"
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

LeadCard.propTypes = {
  lead: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    zone: PropTypes.string,
    budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    operationType: PropTypes.string,
    status: PropTypes.string,
    mercadolibreQuestionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    assignedAgents: PropTypes.arrayOf(
      PropTypes.shape({
        adminId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        fullName: PropTypes.string,
        username: PropTypes.string,
      }),
    ),
  }).isRequired,
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      adminId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fullName: PropTypes.string,
      username: PropTypes.string,
    }),
  ),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      color: PropTypes.string,
    }),
  ).isRequired,
  canDelete: PropTypes.bool,
  showQuickAssign: PropTypes.bool,
  onQuickAssign: PropTypes.func,
  onQuickUnassign: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onStatusChange: PropTypes.func.isRequired,
};

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
    <div className={modalOverlay}>
      <div className={`${modalBox} max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className={modalHeader}>
          <h2 className="text-lg font-bold flex items-center gap-2 text-textPrimary">
            <IoPersonOutline className="w-5 h-5 text-brand-light" />
            {editing ? 'Editar Lead' : 'Nuevo Lead'}
          </h2>
          <button type="button" onClick={onClose} className="text-textMuted hover:text-textPrimary">
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div>
            <label className={labelClass}>
              Nombre <span className="text-customRed">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Nombre del lead"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+54 9 ..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="email@ejemplo.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Operación</label>
              <select
                name="operationType"
                value={form.operationType}
                onChange={onChange}
                className={selectClass + ' w-full'}
              >
                <option value="">Sin especificar</option>
                <option value="Alquiler">Alquiler</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler o Venta">Alquiler o Venta</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Zona / Barrio</label>
              <input
                name="zone"
                value={form.zone}
                onChange={onChange}
                placeholder="Ej: Centro, Palermo..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Presupuesto</label>
              <input
                name="budget"
                type="number"
                value={form.budget}
                onChange={onChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Moneda</label>
              <select
                name="currency"
                value={form.currency}
                onChange={onChange}
                className={selectClass + ' w-full'}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className={selectClass + ' w-full'}
            >
              <option value="NUEVO">Nuevo</option>
              <option value="CONTACTADO">Contactado</option>
              <option value="EN_SEGUIMIENTO">En Seguimiento</option>
              <option value="CERRADO_GANADO">Cerrado - Ganado</option>
              <option value="CERRADO_PERDIDO">Cerrado - Perdido</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={3}
              placeholder="Información adicional sobre el lead..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {showAssignments && (
            <div>
              <label className={labelClass}>
                Agentes asignados <span className="text-textMuted font-normal">(opcional, varios)</span>
              </label>
              {agents.length === 0 ? (
                <p className="text-textMuted text-xs">No hay agentes cargados.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-borderBase bg-bgElevated p-2 space-y-1.5">
                  {agents.map((a) => (
                    <label
                      key={a.adminId}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-brand-subtle cursor-pointer text-sm text-textSecondary"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-borderStrong text-brand focus:ring-brand"
                        checked={form.agentIds?.includes?.(a.adminId) ?? false}
                        onChange={() => onToggleAgent(a.adminId)}
                      />
                      <span>{a.fullName || a.username}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-textMuted text-xs mt-1">
                Los nuevos leads creados por un agente se asignan siempre al agente automáticamente.
              </p>
            </div>
          )}

          {error && (
            <div className={alertError}>{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-4 pb-4">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancelar
          </button>
          <button type="button" onClick={onSave} disabled={saving} className={btnPrimary}>
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

LeadModal.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    operationType: PropTypes.string,
    zone: PropTypes.string,
    budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
    agentIds: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ),
  }).isRequired,
  editing: PropTypes.bool,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      adminId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fullName: PropTypes.string,
      username: PropTypes.string,
    }),
  ),
  showAssignments: PropTypes.bool,
  onToggleAgent: PropTypes.func,
};
