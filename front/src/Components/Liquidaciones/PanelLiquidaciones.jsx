import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoDownloadOutline,
  IoCheckboxOutline,
  IoSquareOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoPersonOutline,
  IoHomeOutline,
} from 'react-icons/io5';
import { AdminPanelLayout } from '../Admin/AdminPanelLayout';
import {
  alertSuccess,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  emptyState,
  inputClass,
  selectClass,
  spinner,
  statCard,
  tableHeadRow,
  tableRow,
  tableTh,
  tableWrap,
} from '../Admin/adminPanelTheme';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(n ?? 0));

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('es-AR') : '—');

function StatusBadge({ status }) {
  return status === 'pending' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-customYellowMuted text-customYellow border border-customYellow/30 text-xs font-medium">
      <IoTimeOutline className="w-3 h-3" /> Pendiente
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-muted text-brand-light border border-borderStrong text-xs font-medium">
      <IoCheckmarkCircleOutline className="w-3 h-3" /> Liquidado
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

function SummaryCard({ label, value, sub, icon }) {
  return (
    <div className={statCard}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-textMuted leading-tight">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-textPrimary">{value}</p>
      <p className="text-xs text-textMuted mt-0.5">{sub}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sub: PropTypes.string,
  icon: PropTypes.node,
};

export default function PanelLiquidaciones() {
  const token = useSelector((s) => s.token);

  const headers = { Authorization: `Bearer ${token}` };

  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState({ pending: null, liquidated: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;

  const [statusFilter, setStatusFilter] = useState('pending');
  const [landlordFilter, setLandlordFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [landlords, setLandlords] = useState([]);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter) params.set('status', statusFilter);
      if (landlordFilter) params.set('landlordId', landlordFilter);
      if (periodFilter) params.set('period', periodFilter);

      const [listRes, summaryRes] = await Promise.all([
        axios.get(`${API}/owner-settlements?${params}`, { headers }),
        axios.get(`${API}/owner-settlements/summary`, { headers }),
      ]);

      setSettlements(listRes.data.settlements);
      setTotal(listRes.data.total);
      setPage(p);
      setSummary(summaryRes.data.summary);
      setSelected(new Set());

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

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const toggleAll = () => {
    const pendingIds = settlements.filter((s) => s.status === 'pending').map((s) => s.id);
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  };

  const visible = searchTerm
    ? settlements.filter((s) =>
        s.landlordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.period.toLowerCase().includes(searchTerm.toLowerCase()))
    : settlements;

  const handleLiquidate = async () => {
    if (selected.size === 0) return;
    const { isConfirmed, value } = await Swal.fire({
      title: `Liquidar ${selected.size} elemento${selected.size > 1 ? 's' : ''}`,
      input: 'textarea',
      inputPlaceholder: 'Nota opcional (ej: Transferencia banco Galicia 14/05)',
      showCancelButton: true,
      confirmButtonText: 'Marcar como liquidado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#5A8C72',
    });
    if (!isConfirmed) return;
    try {
      await axios.patch(
        `${API}/owner-settlements/liquidate`,
        { ids: [...selected], liquidationNote: value || null },
        { headers },
      );
      Swal.fire({
        icon: 'success',
        title: 'Liquidado',
        text: 'Las liquidaciones fueron marcadas correctamente.',
        timer: 2000,
        showConfirmButton: false,
      });
      load(page);
    } catch {
      Swal.fire('Error', 'No se pudo liquidar', 'error');
    }
  };

  const handlePdf = async (landlordId, landlordName) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (periodFilter) params.set('period', periodFilter);
    const qs = params.toString();
    const pdfUrl = `${API}/owner-settlements/pdf/${landlordId}${qs ? `?${qs}` : ''}`;

    try {
      const res = await axios.get(pdfUrl, { headers, responseType: 'arraybuffer' });
      const raw = res.data;
      const buf = raw instanceof ArrayBuffer
        ? new Uint8Array(raw)
        : new Uint8Array(raw.buffer, raw.byteOffset ?? 0, raw.byteLength);
      const head = String.fromCharCode(buf[0] || 0, buf[1] || 0, buf[2] || 0, buf[3] || 0);

      if (res.status !== 200 || head !== '%PDF') {
        let msg = 'No se pudo generar el PDF';
        try {
          const txt = new TextDecoder().decode(buf);
          const j = JSON.parse(txt);
          if (j.message) msg = j.message;
        } catch {
          /* cuerpo no JSON */
        }
        Swal.fire('Error', msg, 'error');
        return;
      }

      const blob = new Blob([buf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liquidacion-${String(landlordName || '').replace(/\s+/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = 'No se pudo generar el PDF';
      try {
        const d = err.response?.data;
        if (d instanceof ArrayBuffer) {
          const txt = new TextDecoder().decode(new Uint8Array(d));
          const j = JSON.parse(txt);
          if (j.message) msg = j.message;
        }
      } catch {
        /* ignore */
      }
      Swal.fire('Error', msg, 'error');
    }
  };

  const selectedItems = settlements.filter((s) => selected.has(s.id));
  const selectedTotals = selectedItems.reduce(
    (a, s) => ({
      gross: a.gross + Number(s.grossAmount),
      comm: a.comm + Number(s.commissionAmt),
      net: a.net + Number(s.netAmount),
    }),
    { gross: 0, comm: 0, net: 0 },
  );

  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminPanelLayout
      wide
      backTo="/panel"
      title="Liquidaciones al Propietario"
      subtitle="Cobros de alquiler y transferencias a propietarios"
      icon={IoReceiptOutline}
      actions={
        <button type="button" onClick={() => load(page)} className={btnGhost}>
          <IoRefreshOutline className="w-4 h-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Pendientes de liquidar"
            value={summary.pending?.count ?? 0}
            sub={summary.pending ? fmt(summary.pending.netAmount) : '—'}
            icon={<IoTimeOutline className="w-5 h-5 text-customYellow" />}
          />
          <SummaryCard
            label="Total bruto pendiente"
            value={summary.pending ? fmt(summary.pending.grossAmount) : '—'}
            sub="alquileres cobrados"
            icon={<IoReceiptOutline className="w-5 h-5 text-customBlue" />}
          />
          <SummaryCard
            label="Honorarios pendientes"
            value={summary.pending ? fmt(summary.pending.commissionAmt) : '—'}
            sub="comisión inmobiliaria"
            icon={<IoHomeOutline className="w-5 h-5 text-brand-light" />}
          />
          <SummaryCard
            label="Liquidado este período"
            value={summary.liquidated?.count ?? 0}
            sub={summary.liquidated ? fmt(summary.liquidated.netAmount) : '—'}
            icon={<IoCheckmarkCircleOutline className="w-5 h-5 text-brand-light" />}
          />
        </div>

        <div className={`${card} p-4`}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar propietario, propiedad…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className={selectClass}
            >
              <option value="pending">Pendientes</option>
              <option value="liquidated">Liquidados</option>
              <option value="">Todos</option>
            </select>

            <select
              value={landlordFilter}
              onChange={(e) => { setLandlordFilter(e.target.value); setPage(1); }}
              className={`${selectClass} max-w-[200px]`}
            >
              <option value="">Todos los propietarios</option>
              {landlords.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>

            <input
              type="text"
              placeholder="Período (ej: mayo)"
              value={periodFilter}
              onChange={(e) => { setPeriodFilter(e.target.value); setPage(1); }}
              className={`${inputClass} w-40`}
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className={`${alertSuccess} flex-wrap gap-3`}>
            <span className="text-sm font-medium">{selected.size} seleccionados</span>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Bruto: <strong>{fmt(selectedTotals.gross)}</strong></span>
              <span>Honorarios: <strong>({fmt(selectedTotals.comm)})</strong></span>
              <span>Neto: <strong className="text-brand-light">{fmt(selectedTotals.net)}</strong></span>
            </div>
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={handleLiquidate} className={btnPrimary}>
                <IoCheckmarkCircleOutline className="w-4 h-4" />
                Marcar como liquidado
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={btnSecondary}
                aria-label="Limpiar selección"
              >
                <IoCloseOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className={tableWrap}>
          {loading ? (
            <div className={`${emptyState} flex items-center justify-center h-64 gap-3`}>
              <div className={`w-8 h-8 ${spinner}`} />
              Cargando…
            </div>
          ) : visible.length === 0 ? (
            <div className={`${emptyState} flex flex-col items-center justify-center h-64`}>
              <IoDocumentTextOutline className="w-12 h-12 mb-3 text-textMuted" />
              <p className="text-base font-medium text-textSecondary">No hay liquidaciones</p>
              <p className="text-sm text-textMuted">Los registros aparecerán automáticamente al cobrar cuotas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={tableHeadRow}>
                  <tr>
                    {statusFilter === 'pending' && (
                      <th className="w-10 px-4 py-3">
                        <button type="button" onClick={toggleAll}>
                          {pendingCount > 0 && pendingCount === selected.size
                            ? <IoCheckboxOutline className="w-5 h-5 text-brand-light" />
                            : <IoSquareOutline className="w-5 h-5 text-textMuted" />}
                        </button>
                      </th>
                    )}
                    <th className={tableTh}>Propietario</th>
                    <th className={tableTh}>Propiedad</th>
                    <th className={tableTh}>Período</th>
                    <th className={`${tableTh} text-right`}>Bruto</th>
                    <th className={`${tableTh} text-right`}>Comisión</th>
                    <th className={`${tableTh} text-right text-brand-light`}>Neto</th>
                    <th className={`${tableTh} text-center`}>Estado</th>
                    <th className={`${tableTh} text-center`}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr
                      key={s.id}
                      className={`${tableRow} ${selected.has(s.id) ? 'bg-brand-subtle/40' : ''}`}
                    >
                      {statusFilter === 'pending' && (
                        <td className="px-4 py-3">
                          {s.status === 'pending' && (
                            <button type="button" onClick={() => toggle(s.id)}>
                              {selected.has(s.id)
                                ? <IoCheckboxOutline className="w-5 h-5 text-brand-light" />
                                : <IoSquareOutline className="w-5 h-5 text-textMuted" />}
                            </button>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-muted flex items-center justify-center flex-shrink-0">
                            <IoPersonOutline className="w-3.5 h-3.5 text-brand-light" />
                          </div>
                          <span className="font-medium text-textPrimary">{s.landlordName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-textSecondary max-w-[200px] truncate">{s.propertyAddress}</td>
                      <td className="px-4 py-3 text-textSecondary">{s.period}</td>
                      <td className="px-4 py-3 text-right text-textPrimary">{fmt(s.grossAmount)}</td>
                      <td className="px-4 py-3 text-right text-customRed">
                        ({s.commissionPct}%) {fmt(s.commissionAmt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-brand-light">{fmt(s.netAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={s.status} />
                        {s.status === 'liquidated' && s.liquidatedAt && (
                          <div className="text-xs text-textMuted mt-0.5">{fmtDate(s.liquidatedAt)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handlePdf(s.landlordId, s.landlordName)}
                          title="Descargar liquidación PDF"
                          className="p-1.5 text-brand-light hover:bg-brand-subtle rounded-lg transition-colors"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-borderBase">
              <span className="text-sm text-textMuted">
                Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => load(page - 1)}
                  disabled={page === 1}
                  className={`${btnGhost} p-2 disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <IoChevronBackOutline className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-textSecondary">{page} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => load(page + 1)}
                  disabled={page === totalPages}
                  className={`${btnGhost} p-2 disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <IoChevronForwardOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`${card} p-4 text-sm text-textSecondary`}>
          <strong className="text-textPrimary">¿Cómo funciona?</strong>{' '}
          Cada vez que registrás el cobro de una cuota de alquiler, se genera automáticamente una liquidación pendiente para el propietario. Seleccioná las que ya transferiste y marcalas como liquidadas. El PDF agrupa todas las propiedades del mismo propietario.
        </div>
      </div>
    </AdminPanelLayout>
  );
}
