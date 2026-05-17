import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import PropTypes from 'prop-types';
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoStatsChartOutline,
  IoCashOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoAddOutline,
  IoTrashOutline,
  IoCalendarOutline,
  IoFilterOutline,
  IoReceiptOutline,
  IoCreateOutline,
  IoCloseOutline,
  IoSaveOutline,
  IoWalletOutline,
} from 'react-icons/io5';

const CATEGORIES = [
  'Sueldos / Honorarios',
  'Alquiler de oficina',
  'Servicios (luz, agua, internet)',
  'Marketing / Publicidad',
  'Mantenimiento',
  'Impuestos / Tasas',
  'Comisión de agente',
  'Otros',
];

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);

const now = new Date();
const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const defaultTo   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

// ─── Formulario de nuevo gasto ────────────────────────────────────────────────
const ExpenseForm = ({ onSaved, onCancel, initial }) => {
  ExpenseForm.propTypes = {
    onSaved:  PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    initial:  PropTypes.shape({
      id:          PropTypes.number,
      date:        PropTypes.string,
      amount:      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      category:    PropTypes.string,
      description: PropTypes.string,
    }),
  };
  const [form, setForm] = useState({
    date:        initial?.date?.split('T')[0] ?? defaultFrom,
    amount:      initial?.amount ?? '',
    category:    initial?.category ?? CATEGORIES[0],
    description: initial?.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    try {
      if (initial?.id) {
        await axios.put(`/expenses/${initial.id}`, form);
      } else {
        await axios.post('/expenses', form);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Fecha</label>
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Monto ($)</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="0.00"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Categoría</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm">
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Descripción (opcional)</label>
          <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Detalle del gasto..."
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 text-sm transition-colors">
          <IoCloseOutline className="w-4 h-4" /> Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-400/30 text-sm transition-colors disabled:opacity-50">
          <IoSaveOutline className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar gasto'}
        </button>
      </div>
    </form>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const PaymentReport = () => {
  const navigate = useNavigate();

  const [payments, setPayments]       = useState([]);
  const [expenses, setExpenses]       = useState([]);
  const [loading,  setLoading]        = useState(false);
  const [error,    setError]          = useState(null);
  const [from, setFrom]               = useState(defaultFrom);
  const [to,   setTo]                 = useState(defaultTo);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense]   = useState(null);
  const [tab, setTab]                 = useState('all'); // 'all' | 'income' | 'expenses'

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { from, to };
      const [pRes, eRes] = await Promise.all([
        axios.get('/payment', { params }),
        axios.get('/expenses', { params }),
      ]);
      setPayments(Array.isArray(pRes.data) ? pRes.data : []);
      setExpenses(Array.isArray(eRes.data) ? eRes.data : []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  // ─── Ingresos ───────────────────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    if (!from && !to) return payments;
    return payments.filter(p => {
      const d = new Date(p.paymentDate);
      if (from && d < new Date(from)) return false;
      if (to   && d > new Date(to + 'T23:59:59')) return false;
      return true;
    });
  }, [payments, from, to]);

  const totalIncome = useMemo(
    () => filteredPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    [filteredPayments]
  );
  const pendingIncome = useMemo(
    () => filteredPayments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
    [filteredPayments]
  );

  // Comisión de la inmobiliaria sobre cuotas cobradas
  const agencyCommission = useMemo(
    () => filteredPayments
      .filter(p => p.status === 'paid' && p.type === 'installment')
      .reduce((s, p) => {
        const pct = Number(p.Lease?.commission || 0);
        return s + Number(p.amount) * (pct / 100);
      }, 0),
    [filteredPayments]
  );

  // ─── Gastos ─────────────────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );

  const netBalance = totalIncome - totalExpenses;

  // ─── Eliminar gasto ─────────────────────────────────────────────────────────
  const handleDeleteExpense = async (exp) => {
    const result = await Swal.fire({
      title: '¿Eliminar gasto?',
      text: `${exp.category} — ${fmt(exp.amount)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Eliminar',
      background: '#1e293b',
      color: '#fff',
    });
    if (result.isConfirmed) {
      await axios.delete(`/expenses/${exp.id}`);
      load();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header nav */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)}
              className="text-white hover:text-blue-300 transition-colors flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30">
              <IoArrowBackOutline className="w-5 h-5" /><span className="hidden sm:inline">Volver</span>
            </button>
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <span className="text-white font-medium">Balance de Caja</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <IoWalletOutline className="w-8 h-8 text-emerald-400 mr-3" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Balance de Caja
            </h1>
          </div>
          <p className="text-slate-400">Ingresos, gastos y resultado neto del período</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Filtros */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
              <IoFilterOutline className="w-4 h-4" /> Período:
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Desde</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Hasta</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
            </div>
            {/* Accesos rápidos */}
            {[
              { label: 'Este mes', get: () => {
                const n = new Date(); const m = n.getMonth() + 1; const y = n.getFullYear();
                return [`${y}-${String(m).padStart(2,'0')}-01`, `${y}-${String(m).padStart(2,'0')}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`];
              }},
              { label: 'Mes anterior', get: () => {
                const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth() - 1, 1);
                const m = d.getMonth() + 1; const y = d.getFullYear();
                return [`${y}-${String(m).padStart(2,'0')}-01`, `${y}-${String(m).padStart(2,'0')}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`];
              }},
              { label: 'Este año', get: () => [`${new Date().getFullYear()}-01-01`, `${new Date().getFullYear()}-12-31`] },
            ].map(({ label, get }) => (
              <button key={label} onClick={() => { const [f, t] = get(); setFrom(f); setTo(t); }}
                className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-400">{error}</div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ingresos cobrados */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-emerald-400 text-sm font-medium">Ingresos cobrados</p>
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <IoTrendingUpOutline className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{fmt(totalIncome)}</p>
                {pendingIncome > 0 && (
                  <p className="text-slate-500 text-xs mt-1">+ {fmt(pendingIncome)} pendiente</p>
                )}
              </div>

              {/* Gastos */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-red-400 text-sm font-medium">Gastos</p>
                  <div className="p-2 bg-red-500/20 rounded-xl">
                    <IoTrendingDownOutline className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{fmt(totalExpenses)}</p>
                <p className="text-slate-500 text-xs mt-1">{expenses.length} registros</p>
              </div>

              {/* Resultado neto */}
              <div className={`${netBalance >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`${netBalance >= 0 ? 'text-blue-400' : 'text-orange-400'} text-sm font-medium`}>Resultado neto</p>
                  <div className={`p-2 ${netBalance >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'} rounded-xl`}>
                    <IoStatsChartOutline className={`w-5 h-5 ${netBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-white' : 'text-orange-400'}`}>{fmt(netBalance)}</p>
              </div>

              {/* Comisión inmobiliaria */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-amber-400 text-sm font-medium">Comisión inmobiliaria</p>
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <IoCashOutline className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{fmt(agencyCommission)}</p>
                <p className="text-slate-500 text-xs mt-1">% s/ cuotas cobradas</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { key: 'all',      label: 'Todo', icon: IoStatsChartOutline },
                { key: 'income',   label: `Ingresos (${filteredPayments.length})`, icon: IoReceiptOutline },
                { key: 'expenses', label: `Gastos (${expenses.length})`, icon: IoTrendingDownOutline },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    tab === key
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}

              {/* Botón agregar gasto */}
              <button onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-400/30 text-sm font-medium transition-colors">
                <IoAddOutline className="w-4 h-4" /> Cargar gasto
              </button>
            </div>

            {/* Formulario de gasto (inline) */}
            {showExpenseForm && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <IoCashOutline className="w-5 h-5 text-red-400" />
                  {editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
                </h3>
                <ExpenseForm
                  initial={editingExpense}
                  onSaved={() => { setShowExpenseForm(false); setEditingExpense(null); load(); }}
                  onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                />
              </div>
            )}

            {/* Tabla de INGRESOS */}
            {(tab === 'all' || tab === 'income') && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center gap-2">
                  <IoReceiptOutline className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">Ingresos del período</h3>
                </div>
                {filteredPayments.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Sin ingresos en el período</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Fecha</th>
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Inquilino</th>
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Período</th>
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Tipo</th>
                          <th className="text-center text-slate-400 font-medium py-3 px-4">Estado</th>
                          <th className="text-right text-slate-400 font-medium py-3 px-4">Monto</th>
                          <th className="text-right text-slate-400 font-medium py-3 px-4">Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((p, i) => {
                          const pct = Number(p.Lease?.commission || 0);
                          const comm = p.type === 'installment' ? Number(p.amount) * pct / 100 : 0;
                          return (
                            <tr key={p.id} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                              <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                                {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('es-AR') : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-white">
                                {p.Clients?.name || p.Client?.name || '—'}
                              </td>
                              <td className="py-2.5 px-4 text-slate-300">{p.period || '—'}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                  p.type === 'installment' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30'
                                  : p.type === 'commission' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                                  : 'bg-slate-500/20 text-slate-400 border-slate-400/30'
                                }`}>
                                  {p.type === 'installment' ? 'Cuota' : p.type === 'commission' ? 'Honorario' : 'Inicial'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                                  p.status === 'paid'
                                    ? 'bg-green-500/20 text-green-400 border-green-400/30'
                                    : 'bg-amber-500/20 text-amber-400 border-amber-400/30'
                                }`}>
                                  {p.status === 'paid' ? 'Cobrado' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right text-white font-semibold">{fmt(p.amount)}</td>
                              <td className="py-2.5 px-4 text-right text-amber-400">{comm > 0 ? fmt(comm) : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tabla de GASTOS */}
            {(tab === 'all' || tab === 'expenses') && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-center gap-2">
                  <IoTrendingDownOutline className="w-5 h-5 text-red-400" />
                  <h3 className="text-white font-semibold">Gastos del período</h3>
                </div>
                {expenses.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 mb-3">Sin gastos cargados en el período</p>
                    <button onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-400/30 text-sm mx-auto">
                      <IoAddOutline className="w-4 h-4" /> Cargar primer gasto
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Fecha</th>
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Categoría</th>
                          <th className="text-left text-slate-400 font-medium py-3 px-4">Descripción</th>
                          <th className="text-right text-slate-400 font-medium py-3 px-4">Monto</th>
                          <th className="text-center text-slate-400 font-medium py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((exp, i) => (
                          <tr key={exp.id} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                              {exp.date ? new Date(exp.date).toLocaleDateString('es-AR') : '—'}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-400/20">
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-400">{exp.description || '—'}</td>
                            <td className="py-2.5 px-4 text-right text-white font-semibold">{fmt(exp.amount)}</td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => { setEditingExpense(exp); setShowExpenseForm(true); }}
                                  title="Editar"
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-400/20 transition-colors">
                                  <IoCreateOutline className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteExpense(exp)}
                                  title="Eliminar"
                                  className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/20 transition-colors">
                                  <IoTrashOutline className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-white/20 bg-white/5">
                          <td colSpan={3} className="py-3 px-4 text-right text-slate-400 font-medium text-sm">Total gastos:</td>
                          <td className="py-3 px-4 text-right text-red-400 font-bold">{fmt(totalExpenses)}</td>
                          <td />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Resumen final */}
            {tab === 'all' && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <IoCalendarOutline className="w-5 h-5 text-blue-400" />
                  Resumen del período
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Ingresos cobrados</span>
                    <span className="text-emerald-400 font-semibold">{fmt(totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Ingresos pendientes</span>
                    <span className="text-amber-400 font-semibold">{fmt(pendingIncome)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gastos</span>
                    <span className="text-red-400 font-semibold">− {fmt(totalExpenses)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between text-white font-bold text-base">
                    <span>Resultado neto</span>
                    <span className={netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmt(netBalance)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentReport;
