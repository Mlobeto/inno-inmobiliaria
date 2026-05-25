import { useState } from 'react';
import {
  useGetAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeactivateAgentMutation,
} from '@shared/redux';
import {
  IoAdd,
  IoPencilOutline,
  IoPersonOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoCashOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from './AdminPanelLayout';
import {
  alertError,
  alertSuccess,
  btnPrimary,
  btnSecondary,
  emptyState,
  inputClass,
  labelClass,
  modalBox,
  modalHeader,
  modalOverlay,
  spinner,
  statCard,
  tableHeadRow,
  tableRow,
  tableTh,
  tableWrap,
} from './adminPanelTheme';

const EMPTY_FORM = { username: '', password: '', fullName: '' };

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

export default function PanelAgentes() {
  const { data: agents = [], isLoading } = useGetAgentsQuery();
  const [createAgent, { isLoading: isCreating }] = useCreateAgentMutation();
  const [updateAgent, { isLoading: isUpdating }] = useUpdateAgentMutation();
  const [deactivateAgent] = useDeactivateAgentMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openCreate = () => {
    setEditingAgent(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (agent) => {
    setEditingAgent(agent);
    setForm({ username: agent.username, password: '', fullName: agent.fullName || '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAgent(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingAgent) {
        const payload = { agentId: editingAgent.adminId, fullName: form.fullName };
        if (form.password) payload.password = form.password;
        await updateAgent(payload).unwrap();
        setSuccess('Agente actualizado correctamente');
      } else {
        if (!form.username.trim() || !form.password.trim()) {
          setError('Usuario y contraseña son obligatorios');
          return;
        }
        await createAgent({
          username: form.username.trim(),
          password: form.password,
          fullName: form.fullName,
        }).unwrap();
        setSuccess('Agente creado correctamente');
      }
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al guardar agente');
    }
  };

  const handleDeactivate = async (agentId) => {
    if (!window.confirm('¿Desactivar este agente? No podrá iniciar sesión.')) return;
    try {
      await deactivateAgent(agentId).unwrap();
      setSuccess('Agente desactivado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al desactivar');
    }
  };

  const totalCommission = agents.reduce((sum, a) => sum + (a.totalCommissions || 0), 0);
  const totalPending = agents.reduce((sum, a) => sum + (a.pendingCommissions || 0), 0);

  return (
    <AdminPanelLayout
      title="Gestión de Agentes"
      subtitle="Administrá los usuarios de tu equipo"
      icon={IoPeopleOutline}
      actions={
        <button type="button" onClick={openCreate} className={btnPrimary}>
          <IoAdd className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo agente</span>
        </button>
      }
    >
      {success && (
        <div className={alertSuccess}>
          <IoCheckmarkCircleOutline className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className={alertError}>
          <IoAlertCircleOutline className="w-5 h-5 shrink-0" />
          {error}
          <button type="button" onClick={() => setError('')} className="ml-auto"><IoCloseOutline /></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className={statCard}>
          <div className="flex items-center gap-3">
            <IoPeopleOutline className="w-7 h-7 text-brand-light shrink-0" />
            <div>
              <p className="text-textMuted text-xs">Agentes activos</p>
              <p className="text-xl font-bold text-textPrimary">{agents.length}</p>
            </div>
          </div>
        </div>
        <div className={statCard}>
          <div className="flex items-center gap-3">
            <IoCashOutline className="w-7 h-7 text-brand-light shrink-0" />
            <div>
              <p className="text-textMuted text-xs">Comisiones pagadas</p>
              <p className="text-lg font-bold text-brand-light">{formatCurrency(totalCommission)}</p>
            </div>
          </div>
        </div>
        <div className={statCard}>
          <div className="flex items-center gap-3">
            <IoStatsChartOutline className="w-7 h-7 text-customYellow shrink-0" />
            <div>
              <p className="text-textMuted text-xs">Pendientes</p>
              <p className="text-xl font-bold text-customYellow">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className={`w-10 h-10 ${spinner}`} />
        </div>
      ) : agents.length === 0 ? (
        <div className={emptyState}>
          <IoPeopleOutline className="w-14 h-14 text-textMuted mx-auto mb-3" />
          <p className="text-textSecondary">Aún no tenés agentes</p>
          <button type="button" onClick={openCreate} className={`${btnPrimary} mt-4`}>
            Crear primer agente
          </button>
        </div>
      ) : (
        <div className={tableWrap}>
          <table className="w-full">
            <thead>
              <tr className={tableHeadRow}>
                <th className={tableTh}>Agente</th>
                <th className={`${tableTh} hidden md:table-cell`}>Email</th>
                <th className={`${tableTh} text-right hidden sm:table-cell`}>Comisiones</th>
                <th className={`${tableTh} text-right hidden sm:table-cell`}>Pendientes</th>
                <th className={`${tableTh} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.adminId} className={tableRow}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-muted flex items-center justify-center border border-borderBase">
                        <IoPersonOutline className="w-5 h-5 text-brand-light" />
                      </div>
                      <div>
                        <p className="font-medium text-textPrimary text-sm">{agent.fullName || agent.username}</p>
                        <p className="text-textMuted text-xs">@{agent.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-textSecondary text-sm hidden md:table-cell">
                    {agent.email || agent.username}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-brand-light font-medium text-sm">{formatCurrency(agent.totalCommissions)}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {agent.pendingCommissions > 0 ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-customYellowMuted text-customYellow text-xs border border-customYellow/30">
                        {agent.pendingCommissions}
                      </span>
                    ) : (
                      <span className="text-textMuted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openEdit(agent)} className="p-1.5 rounded-lg hover:bg-brand-subtle text-textMuted hover:text-textPrimary transition-colors" title="Editar">
                        <IoPencilOutline className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDeactivate(agent.adminId)} className="p-1.5 rounded-lg hover:bg-customRedMuted text-textMuted hover:text-customRed transition-colors" title="Desactivar">
                        <IoEyeOffOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={modalOverlay}>
          <div className={`${modalBox} max-w-md`}>
            <div className={modalHeader}>
              <h2 className="text-lg font-bold flex items-center gap-2 text-textPrimary">
                <IoPersonOutline className="w-5 h-5 text-brand-light" />
                {editingAgent ? 'Editar agente' : 'Nuevo agente'}
              </h2>
              <button type="button" onClick={closeModal} className="text-textMuted hover:text-textPrimary">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className={alertError}>
                  <IoAlertCircleOutline className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {!editingAgent && (
                <div>
                  <label className={labelClass}>Email (usuario de acceso) *</label>
                  <input
                    type="email"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="agente@inmobiliaria.com"
                    className={inputClass}
                    required
                    autoComplete="username"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>{editingAgent ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña segura" className={`${inputClass} pr-10`} required={!editingAgent} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary">
                    {showPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Nombre completo</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Juan Pérez" className={inputClass} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className={`flex-1 ${btnSecondary} justify-center`}>Cancelar</button>
                <button type="submit" disabled={isCreating || isUpdating} className={`flex-1 ${btnPrimary} justify-center`}>
                  {(isCreating || isUpdating) ? <div className="w-4 h-4 border-2 border-textWhite border-t-transparent rounded-full animate-spin" /> : <IoCheckmarkCircleOutline className="w-5 h-5" />}
                  {editingAgent ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
}
