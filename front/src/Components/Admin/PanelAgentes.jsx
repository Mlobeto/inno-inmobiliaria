import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetAgentsQuery,
  useCreateAgentMutation,
  useUpdateAgentMutation,
  useDeactivateAgentMutation,
  useReactivateAgentMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoPencilOutline,
  IoPersonOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoRefreshOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoCashOutline,
} from 'react-icons/io5';

const EMPTY_FORM = { username: '', password: '', fullName: '', email: '' };

const formatCurrency = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

export default function PanelAgentes() {
  const { data: agents = [], isLoading, refetch } = useGetAgentsQuery();
  const [createAgent, { isLoading: isCreating }] = useCreateAgentMutation();
  const [updateAgent, { isLoading: isUpdating }] = useUpdateAgentMutation();
  const [deactivateAgent] = useDeactivateAgentMutation();
  const [reactivateAgent] = useReactivateAgentMutation();

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
    setForm({ username: agent.username, password: '', fullName: agent.fullName || '', email: agent.email || '' });
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
        const payload = { agentId: editingAgent.adminId, fullName: form.fullName, email: form.email };
        if (form.password) payload.password = form.password;
        await updateAgent(payload).unwrap();
        setSuccess('Agente actualizado correctamente');
      } else {
        if (!form.username.trim() || !form.password.trim()) {
          setError('Usuario y contraseña son obligatorios');
          return;
        }
        await createAgent(form).unwrap();
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

  const handleReactivate = async (agentId) => {
    try {
      await reactivateAgent(agentId).unwrap();
      setSuccess('Agente reactivado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.data?.message || 'Error al reactivar');
    }
  };

  const totalCommission = agents.reduce((sum, a) => sum + (a.totalCommissions || 0), 0);
  const totalPending = agents.reduce((sum, a) => sum + (a.pendingCommissions || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/panel"
              className="flex items-center text-slate-300 hover:text-white transition-colors"
            >
              <IoArrowBack className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Panel</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <IoPeopleOutline className="w-7 h-7 text-indigo-400" />
                Gestión de Agentes
              </h1>
              <p className="text-slate-400 text-sm mt-1">Administrá los usuarios de tu equipo</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          >
            <IoAdd className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Agente</span>
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

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <IoPeopleOutline className="w-8 h-8 text-indigo-400" />
              <div>
                <p className="text-slate-400 text-sm">Agentes activos</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <IoCashOutline className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-slate-400 text-sm">Total comisiones pagadas</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalCommission)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <IoStatsChartOutline className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-slate-400 text-sm">Comisiones pendientes</p>
                <p className="text-xl font-bold text-amber-400">{totalPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de agentes */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16">
            <IoPeopleOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Aún no tenés agentes</p>
            <p className="text-slate-500 text-sm mt-2">Creá el primer agente para tu equipo</p>
            <button
              onClick={openCreate}
              className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Crear primer agente
            </button>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 text-slate-300 font-medium text-sm">Agente</th>
                  <th className="text-left px-4 py-3 text-slate-300 font-medium text-sm hidden md:table-cell">Email</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm hidden sm:table-cell">Comisiones</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm hidden sm:table-cell">Pendientes</th>
                  <th className="text-right px-4 py-3 text-slate-300 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.adminId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/30">
                          <IoPersonOutline className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.fullName || agent.username}</p>
                          <p className="text-slate-400 text-xs">@{agent.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300 text-sm hidden md:table-cell">
                      {agent.email || <span className="text-slate-500 italic">Sin email</span>}
                    </td>
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      <span className="text-emerald-400 font-medium text-sm">
                        {formatCurrency(agent.totalCommissions)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right hidden sm:table-cell">
                      {agent.pendingCommissions > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
                          {agent.pendingCommissions}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(agent)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <IoPencilOutline className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(agent.adminId)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Desactivar"
                        >
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
      </div>

      {/* Modal crear / editar agente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-white/20 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <IoPersonOutline className="w-5 h-5 text-indigo-400" />
                {editingAgent ? 'Editar Agente' : 'Nuevo Agente'}
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

              {!editingAgent && (
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Usuario *</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="ej: juan.perez"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  {editingAgent ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Contraseña segura"
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:border-indigo-500"
                    required={!editingAgent}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Juan Pérez"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@inmobiliaria.com"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

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
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {(isCreating || isUpdating) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IoCheckmarkCircleOutline className="w-5 h-5" />
                  )}
                  {editingAgent ? 'Guardar cambios' : 'Crear agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
