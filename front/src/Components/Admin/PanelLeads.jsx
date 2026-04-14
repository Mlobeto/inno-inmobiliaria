import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAllLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoTrashOutline,
  IoPencilOutline,
  IoPersonOutline,
  IoCallOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCloseOutline,
  IoCheckmarkOutline,
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
};

export default function PanelLeads() {
  const { data, isLoading } = useGetAllLeadsQuery();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();

  const leads = data?.leads || [];

  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const getLeadsByStatus = (status) => leads.filter((l) => l.status === status);

  const openCreate = () => {
    setEditingLead(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
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
    });
    setError('');
    setShowModal(true);
  };

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
      if (editingLead) {
        await updateLead({ id: editingLead.id, ...form }).unwrap();
      } else {
        await createLead(form).unwrap();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              to="/panel"
              className="text-white flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <IoArrowBack className="w-5 h-5" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
            <h1 className="text-white text-xl font-bold">CRM / Leads</h1>
            <span className="text-slate-400 text-sm hidden sm:inline">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} en total
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <IoAdd className="w-5 h-5" />
            Nuevo Lead
          </button>
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
                      columns={COLUMNS}
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
        />
      )}
    </div>
  );
}

function LeadCard({ lead, columns, onEdit, onDelete, onStatusChange }) {
  const [showMove, setShowMove] = useState(false);

  return (
    <div className="bg-slate-800/80 border border-white/10 rounded-lg p-3 flex flex-col gap-2 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-sm font-semibold leading-tight break-words">{lead.name}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="text-slate-400 hover:text-white transition-colors" title="Editar">
            <IoPencilOutline className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar">
            <IoTrashOutline className="w-4 h-4" />
          </button>
        </div>
      </div>

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

function LeadModal({ form, editing, saving, error, onChange, onSave, onClose }) {
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
