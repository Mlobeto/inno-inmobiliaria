import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  useGetCobranzasLoteosQuery,
  useGetLoteosQuery,
  usePagarCuotaMutation,
} from '@shared/redux';
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoReceiptOutline,
  IoSearchOutline,
  IoTimeOutline,
  IoCashOutline,
  IoGridOutline,
} from 'react-icons/io5';
import LoteoCuotaReciboPdf from '../PdfTemplates/LoteoCuotaReciboPdf';
import {
  btnGhost,
  btnPrimary,
  emptyState,
  inputClass,
  selectClass,
  spinner,
  statCard,
  tabActive,
  tabInactive,
  tableHeadRow,
  tableRow,
  tableTh,
  tableWrap,
} from './adminPanelTheme';

const FILTERS = [
  { id: 'vencida', label: 'Vencidas' },
  { id: 'pendiente', label: 'A pagar' },
  { id: 'pagada', label: 'Pagadas' },
  { id: 'todas', label: 'Todas' },
];

const ESTADO_BADGE = {
  vencida: 'bg-customRedMuted text-customRed border border-customRed/30',
  pendiente: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
  pagada: 'bg-brand-muted text-brand-light border border-borderStrong',
};

const formatCurrency = (value, currency = 'ARS') =>
  value != null
    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
    : '—';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('es-AR') : '—');

export default function LoteosCobranzasPanel({ onOpenPlan }) {
  const [filter, setFilter] = useState('vencida');
  const [loteoId, setLoteoId] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  const { data: loteosData } = useGetLoteosQuery();
  const loteos = loteosData?.loteos || [];

  const { data, isLoading, isFetching } = useGetCobranzasLoteosQuery({
    filter,
    loteoId: loteoId || undefined,
    search: searchDebounced || undefined,
  });

  const [pagarCuota, { isLoading: paying }] = usePagarCuotaMutation();

  const stats = data?.stats;
  const cuotas = data?.cuotas || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchDebounced(search);
  };

  const handleTogglePago = async (item) => {
    try {
      await pagarCuota({
        loteoId: item.loteoId,
        loteId: item.loteId,
        cuotaId: item.cuotaId,
        pagado: !item.pagado,
      }).unwrap();
    } catch {
      alert('Error al registrar el pago');
    }
  };

  const filterCounts = useMemo(
    () => ({
      vencida: stats?.vencidasCount ?? 0,
      pendiente: stats?.pendientesCount ?? 0,
    }),
    [stats],
  );

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={statCard}>
          <p className="text-textMuted text-xs">Ventas activas</p>
          <p className="text-xl font-bold text-textPrimary">{stats?.ventasActivas ?? '—'}</p>
        </div>
        <div className={statCard}>
          <div className="flex items-center gap-2 mb-1">
            <IoAlertCircleOutline className="w-4 h-4 text-customRed" />
            <p className="text-textMuted text-xs">Cuotas vencidas</p>
          </div>
          <p className="text-lg font-bold text-customRed">{stats?.vencidasCount ?? '—'}</p>
          <p className="text-xs text-textMuted">{formatCurrency(stats?.vencidasMonto)}</p>
        </div>
        <div className={statCard}>
          <div className="flex items-center gap-2 mb-1">
            <IoTimeOutline className="w-4 h-4 text-customYellow" />
            <p className="text-textMuted text-xs">Por cobrar</p>
          </div>
          <p className="text-lg font-bold text-customYellow">{stats?.pendientesCount ?? '—'}</p>
          <p className="text-xs text-textMuted">{formatCurrency(stats?.pendientesMonto)}</p>
        </div>
        <div className={statCard}>
          <div className="flex items-center gap-2 mb-1">
            <IoCheckmarkCircleOutline className="w-4 h-4 text-brand-light" />
            <p className="text-textMuted text-xs">Pagadas este mes</p>
          </div>
          <p className="text-xl font-bold text-brand-light">{stats?.pagadasMes ?? '—'}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-bgElevated border border-borderBase">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.id ? tabActive : tabInactive
              }`}
            >
              {f.label}
              {(f.id === 'vencida' || f.id === 'pendiente') && filterCounts[f.id] > 0 && (
                <span className="ml-1.5 opacity-80">({filterCounts[f.id]})</span>
              )}
            </button>
          ))}
        </div>

        <select
          value={loteoId}
          onChange={(e) => setLoteoId(e.target.value)}
          className={`${selectClass} py-2 text-sm min-w-[160px]`}
        >
          <option value="">Todos los loteos</option>
          {loteos.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar comprador..."
              className={`${inputClass} pl-9 py-2`}
            />
          </div>
          <button type="submit" className={btnGhost}>
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className={`w-10 h-10 ${spinner}`} />
        </div>
      ) : cuotas.length === 0 ? (
        <div className={emptyState}>
          <IoCashOutline className="w-14 h-14 text-textMuted mx-auto mb-3" />
          <p className="text-textSecondary">No hay cuotas en este filtro</p>
          {filter === 'vencida' && (
            <p className="text-textMuted text-sm mt-1">¡Buen trabajo, no tenés cuotas vencidas!</p>
          )}
        </div>
      ) : (
        <div className={`${tableWrap} ${isFetching ? 'opacity-70' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={tableHeadRow}>
                <th className={tableTh}>Comprador</th>
                <th className={tableTh}>Loteo / Lote</th>
                <th className={tableTh}>Cuota</th>
                <th className={`${tableTh} hidden md:table-cell`}>Vencimiento</th>
                <th className={`${tableTh} text-right`}>Monto</th>
                <th className={tableTh}>Estado</th>
                <th className={`${tableTh} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((item) => (
                <tr key={item.cuotaId} className={tableRow}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-textPrimary">{item.clienteNombre}</p>
                    {item.clienteTelefono && (
                      <p className="text-textMuted text-xs">{item.clienteTelefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-textSecondary">{item.loteoNombre}</p>
                    <p className="text-textMuted text-xs">
                      Lote {item.loteNumber}
                      {item.loteParcela ? ` · ${item.loteParcela}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">
                    {item.numeroCuota === 0
                      ? 'Anticipo'
                      : `${item.numeroCuota} / ${item.cantidadCuotas}`}
                  </td>
                  <td className="px-4 py-3 text-textSecondary hidden md:table-cell">
                    {formatDate(item.fechaVencimiento)}
                    {item.pagado && item.fechaPago && (
                      <p className="text-brand-light text-xs">Pagada {formatDate(item.fechaPago)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-textPrimary">
                    {formatCurrency(item.monto, item.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[item.estado]}`}>
                      {item.estado === 'vencida' ? 'Vencida' : item.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenPlan(item)}
                        className={`${btnGhost} text-xs py-1 px-2`}
                        title="Ver plan completo"
                      >
                        <IoReceiptOutline className="w-4 h-4" />
                      </button>
                      {item.pagado && (
                        <LoteoCuotaReciboPdf
                          cuota={{
                            id: item.cuotaId,
                            numeroCuota: item.numeroCuota,
                            monto: item.monto,
                            fechaPago: item.fechaPago,
                            fechaVencimiento: item.fechaVencimiento,
                          }}
                          venta={{
                            id: item.ventaId,
                            clienteNombre: item.clienteNombre,
                            clienteTelefono: item.clienteTelefono,
                            cantidadCuotas: item.cantidadCuotas,
                          }}
                          lote={{ number: item.loteNumber }}
                          loteo={{ name: item.loteoNombre }}
                          iconOnly
                        />
                      )}
                      <button
                        type="button"
                        disabled={paying}
                        onClick={() => handleTogglePago(item)}
                        className={`text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                          item.pagado
                            ? 'bg-bgElevated text-textMuted hover:text-customRed border border-borderBase'
                            : `${btnPrimary} py-1 px-2 text-xs`
                        }`}
                      >
                        {item.pagado ? 'Desmarcar' : 'Cobrar'}
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
  );
}

LoteosCobranzasPanel.propTypes = {
  onOpenPlan: PropTypes.func.isRequired,
};
