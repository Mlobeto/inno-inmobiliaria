import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  IoHomeOutline,
  IoPersonOutline,
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoCheckboxOutline,
  IoSquareOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(n ?? 0));

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

const StatusBadge = ({ status }) =>
  status === 'pending' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
      <IoTimeOutline className="w-3 h-3" /> Pendiente
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
      <IoCheckmarkCircleOutline className="w-3 h-3" /> Liquidado
    </span>
  );

export default function PanelLiquidaciones() {
  const token = useSelector((s) => s.token);

  const headers = { Authorization: `Bearer ${token}` };

  // ── estado ──────────────────────────────────────────────────────────────────
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary]         = useState({ pending: null, liquidated: null });
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(new Set());
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);
  const LIMIT = 50;

  // filtros
  const [statusFilter, setStatusFilter]   = useState('pending');
  const [landlordFilter, setLandlordFilter] = useState('');
  const [periodFilter, setPeriodFilter]   = useState('');
  const [searchTerm, setSearchTerm]       = useState('');

  // propietarios únicos (para el filtro)
  const [landlords, setLandlords] = useState([]);

  // ── carga ────────────────────────────────────────────────────────────────────
  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter)   params.set('status',     statusFilter);
      if (landlordFilter) params.set('landlordId', landlordFilter);
      if (periodFilter)   params.set('period',     periodFilter);

      const [listRes, summaryRes] = await Promise.all([
        axios.get(`${API}/owner-settlements?${params}`, { headers }),
        axios.get(`${API}/owner-settlements/summary`,    { headers }),
      ]);

      setSettlements(listRes.data.settlements);
      setTotal(listRes.data.total);
      setPage(p);
      setSummary(summaryRes.data.summary);
      setSelected(new Set());

      // Armar lista de propietarios únicos para el filtro
      const seen = new Map();
      for (const s of listRes.data.settlements) {
        if (!seen.has(s.landlordId)) seen.set(s.landlordId, s.landlordName);
      }
      if (seen.size > 0) setLandlords([...seen.entries()].map(([id, name]) => ({ id, name })));
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las liquidaciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, landlordFilter, periodFilter, token]);

  useEffect(() => { load(1); }, [load]);

  // ── selección ────────────────────────────────────────────────────────────────
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    const pendingIds = settlements.filter(s => s.status === 'pending').map(s => s.id);
    if (pendingIds.every(id => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  };

  // ── filtro local (búsqueda por texto) ─────────────────────────────────────
  const visible = searchTerm
    ? settlements.filter(s =>
        s.landlordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.period.toLowerCase().includes(searchTerm.toLowerCase()))
    : settlements;

  // ── liquidar ─────────────────────────────────────────────────────────────────
  const handleLiquidate = async () => {
    if (selected.size === 0) return;
    const { isConfirmed, value } = await Swal.fire({
      title: `Liquidar ${selected.size} elemento${selected.size > 1 ? 's' : ''}`,
      input: 'textarea',
      inputPlaceholder: 'Nota opcional (ej: Transferencia banco Galicia 14/05)',
      showCancelButton: true,
      confirmButtonText: 'Marcar como liquidado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });
    if (!isConfirmed) return;
    try {
      await axios.patch(`${API}/owner-settlements/liquidate`,
        { ids: [...selected], liquidationNote: value || null },
        { headers });
      Swal.fire({ icon: 'success', title: 'Liquidado', text: 'Las liquidaciones fueron marcadas correctamente.', timer: 2000, showConfirmButton: false });
      load(page);
    } catch {
      Swal.fire('Error', 'No se pudo liquidar', 'error');
    }
  };

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const handlePdf = async (landlordId, landlordName) => {
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (periodFilter) params.set('period', periodFilter);
      const res = await axios.get(
        `${API}/owner-settlements/pdf/${landlordId}?${params}`,
        { headers, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url;
      a.download = `liquidacion-${landlordName.replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  // ── Calcular totales de seleccionados ────────────────────────────────────────
  const selectedItems  = settlements.filter(s => selected.has(s.id));
  const selectedTotals = selectedItems.reduce((a, s) => ({
    gross: a.gross + Number(s.grossAmount),
    comm:  a.comm  + Number(s.commissionAmt),
    net:   a.net   + Number(s.netAmount),
  }), { gross: 0, comm: 0, net: 0 });

  const pendingCount = settlements.filter(s => s.status === 'pending').length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <IoReceiptOutline className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Liquidaciones al Propietario</h1>
                <p className="text-sm text-gray-500">Seguimiento de honorarios y neto a liquidar</p>
              </div>
            </div>
            <button onClick={() => load(page)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <IoRefreshOutline className="w-4 h-4" /> Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Pendientes de liquidar"
            value={summary.pending?.count ?? 0}
            sub={summary.pending ? fmt(summary.pending.netAmount) : '—'}
            icon={<IoTimeOutline className="w-5 h-5 text-amber-600" />}
            color="amber"
          />
          <SummaryCard
            label="Total bruto pendiente"
            value={summary.pending ? fmt(summary.pending.grossAmount) : '—'}
            sub="alquileres cobrados"
            icon={<IoReceiptOutline className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
          <SummaryCard
            label="Honorarios pendientes"
            value={summary.pending ? fmt(summary.pending.commissionAmt) : '—'}
            sub="comisión inmobiliaria"
            icon={<IoHomeOutline className="w-5 h-5 text-violet-600" />}
            color="violet"
          />
          <SummaryCard
            label="Liquidado este período"
            value={summary.liquidated?.count ?? 0}
            sub={summary.liquidated ? fmt(summary.liquidated.netAmount) : '—'}
            icon={<IoCheckmarkCircleOutline className="w-5 h-5 text-green-600" />}
            color="green"
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar propietario, propiedad…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estado */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pendientes</option>
              <option value="liquidated">Liquidados</option>
              <option value="">Todos</option>
            </select>

            {/* Propietario */}
            <select
              value={landlordFilter}
              onChange={e => { setLandlordFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px]"
            >
              <option value="">Todos los propietarios</option>
              {landlords.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            {/* Período */}
            <input
              type="text"
              placeholder="Período (ej: mayo)"
              value={periodFilter}
              onChange={e => { setPeriodFilter(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
          </div>
        </div>

        {/* Barra de acciones */}
        {selected.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-blue-800">{selected.size} seleccionados</span>
            <div className="flex gap-4 text-sm text-blue-700">
              <span>Bruto: <strong>{fmt(selectedTotals.gross)}</strong></span>
              <span>Honorarios: <strong>({fmt(selectedTotals.comm)})</strong></span>
              <span>Neto: <strong className="text-green-700">{fmt(selectedTotals.net)}</strong></span>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleLiquidate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <IoCheckmarkCircleOutline className="w-4 h-4" />
                Marcar como liquidado
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <IoRefreshOutline className="w-8 h-8 animate-spin mr-3" /> Cargando…
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <IoDocumentTextOutline className="w-12 h-12 mb-3" />
              <p className="text-base font-medium">No hay liquidaciones</p>
              <p className="text-sm">Los registros aparecerán automáticamente al cobrar cuotas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {statusFilter === 'pending' && (
                      <th className="w-10 px-4 py-3">
                        <button onClick={toggleAll}>
                          {pendingCount > 0 && pendingCount === selected.size
                            ? <IoCheckboxOutline className="w-5 h-5 text-blue-600" />
                            : <IoSquareOutline   className="w-5 h-5 text-gray-400" />}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Propietario</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Propiedad</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Período</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Bruto</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Comisión</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 text-green-700">Neto</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map(s => (
                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${selected.has(s.id) ? 'bg-blue-50' : ''}`}>
                      {statusFilter === 'pending' && (
                        <td className="px-4 py-3">
                          {s.status === 'pending' && (
                            <button onClick={() => toggle(s.id)}>
                              {selected.has(s.id)
                                ? <IoCheckboxOutline className="w-5 h-5 text-blue-600" />
                                : <IoSquareOutline   className="w-5 h-5 text-gray-300" />}
                            </button>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <IoPersonOutline className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-800">{s.landlordName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{s.propertyAddress}</td>
                      <td className="px-4 py-3 text-gray-600">{s.period}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(s.grossAmount)}</td>
                      <td className="px-4 py-3 text-right text-red-600">({s.commissionPct}%) {fmt(s.commissionAmt)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(s.netAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={s.status} />
                        {s.status === 'liquidated' && s.liquidatedAt && (
                          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(s.liquidatedAt)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePdf(s.landlordId, s.landlordName)}
                          title="Descargar liquidación PDF"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <IoDownloadOutline className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => load(page - 1)} disabled={page === 1}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <IoChevronBackOutline className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">{page} / {totalPages}</span>
                <button onClick={() => load(page + 1)} disabled={page === totalPages}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <IoChevronForwardOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <strong>¿Cómo funciona?</strong> Cada vez que registrás el cobro de una cuota de alquiler, se genera automáticamente una liquidación pendiente para el propietario. Seleccioná las que ya transferiste y marcalas como liquidadas. El PDF agrupa todas las propiedades del mismo propietario.
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color }) {
  const colors = {
    amber:  'bg-amber-50  border-amber-100',
    blue:   'bg-blue-50   border-blue-100',
    violet: 'bg-violet-50 border-violet-100',
    green:  'bg-green-50  border-green-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 leading-tight">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}
