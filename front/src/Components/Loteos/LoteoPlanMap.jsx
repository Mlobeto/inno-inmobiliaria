import { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  getLotePlanMarkerStyle,
  isLoteOnPlan,
  pointerToPlanCoords,
  LOTE_PLAN_LEGEND,
} from '../../utils/lotePlanUtils';

/**
 * Plano interactivo con marcadores por lote.
 * - view: landing pública (clic → detalle)
 * - edit: panel admin (arrastrar marcadores, soltar lotes)
 */
export default function LoteoPlanMap({
  planImageUrl,
  lotes = [],
  mode = 'view',
  selectedLoteId = null,
  onLoteSelect,
  onPositionsChange,
  positionsOverride = null,
  showLegend = true,
  className = '',
}) {
  const canvasRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const getPosition = useCallback(
    (lote) => {
      if (positionsOverride && Object.prototype.hasOwnProperty.call(positionsOverride, lote.id)) {
        return positionsOverride[lote.id];
      }
      return { planX: lote.planX, planY: lote.planY };
    },
    [positionsOverride],
  );

  const placedLotes = lotes.filter((l) => {
    const p = getPosition(l);
    return p.planX != null && p.planY != null;
  });

  const emitPosition = (loteId, planX, planY) => {
    onPositionsChange?.({ loteId, planX, planY });
  };

  const handleCanvasDrop = (e) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    const loteId = Number(e.dataTransfer.getData('loteId'));
    if (!loteId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { planX, planY } = pointerToPlanCoords(e.clientX, e.clientY, rect);
    emitPosition(loteId, planX, planY);
    setDraggingId(null);
  };

  const handleMarkerPointerDown = (e, lote) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(lote.id);
    e.currentTarget.setPointerCapture(e.pointerId);

    const onMove = (ev) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const { planX, planY } = pointerToPlanCoords(ev.clientX, ev.clientY, rect);
      emitPosition(lote.id, planX, planY);
    };

    const onUp = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleMarkerClick = (e, lote) => {
    if (mode === 'edit' && draggingId) return;
    e.stopPropagation();
    if (lote.status === 'VENDIDO' && mode === 'view') return;
    onLoteSelect?.(lote);
  };

  if (!planImageUrl) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-borderBase bg-bgElevated p-12 text-textMuted text-sm ${className}`}>
        Seleccioná una imagen como plano del loteo
      </div>
    );
  }

  return (
    <div className={className}>
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-textSecondary">
          {LOTE_PLAN_LEGEND.map((item) => (
            <span key={item.status} className="inline-flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${item.color}`} aria-hidden />
              {item.label}
            </span>
          ))}
          {mode === 'edit' && (
            <span className="text-textMuted ml-auto">Arrastrá lotes desde la lista o mové los marcadores</span>
          )}
        </div>
      )}

      <div
        ref={canvasRef}
        className={`relative w-full rounded-xl overflow-hidden border border-borderBase bg-bgElevated select-none ${
          mode === 'edit' ? 'cursor-crosshair' : ''
        }`}
        onDragOver={(e) => mode === 'edit' && e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <img
          src={planImageUrl}
          alt="Plano del loteo"
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />

        {placedLotes.map((lote) => {
          const { planX, planY } = getPosition(lote);
          const style = getLotePlanMarkerStyle(lote.status);
          const isSelected = selectedLoteId === lote.id;
          const sold = lote.status === 'VENDIDO';

          return (
            <button
              key={lote.id}
              type="button"
              title={`Lote ${lote.number} — ${style.label}`}
              onClick={(e) => handleMarkerClick(e, lote)}
              onPointerDown={(e) => handleMarkerPointerDown(e, lote)}
              disabled={mode === 'view' && sold}
              className={`absolute z-10 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white text-xs font-bold border-2 shadow-lg transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${style.dot} ${style.border} ${
                isSelected ? `ring-4 ${style.ring} scale-110 z-20` : 'hover:scale-110'
              } ${mode === 'edit' ? 'cursor-grab active:cursor-grabbing' : sold ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                left: `${planX * 100}%`,
                top: `${planY * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {lote.number}
            </button>
          );
        })}
      </div>
    </div>
  );
}

LoteoPlanMap.propTypes = {
  planImageUrl: PropTypes.string,
  lotes: PropTypes.arrayOf(PropTypes.object),
  mode: PropTypes.oneOf(['view', 'edit']),
  selectedLoteId: PropTypes.number,
  onLoteSelect: PropTypes.func,
  onPositionsChange: PropTypes.func,
  positionsOverride: PropTypes.object,
  showLegend: PropTypes.bool,
  className: PropTypes.string,
};

export { isLoteOnPlan };
