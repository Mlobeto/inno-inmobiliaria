import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { useSaveLoteoPlanMutation } from '@shared/redux';
import LoteoPlanMap, { isLoteOnPlan } from '../Loteos/LoteoPlanMap';
import { getLotePlanMarkerStyle } from '../../utils/lotePlanUtils';
import {
  IoCloseOutline,
  IoSaveOutline,
  IoImagesOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { btnPrimary, btnSecondary, modalBox, modalHeader, modalOverlay } from '../Admin/adminPanelTheme';

export default function LoteoPlanEditor({ loteo, open, onClose }) {
  const [savePlan, { isLoading: saving }] = useSaveLoteoPlanMutation();

  const [planImageUrl, setPlanImageUrl] = useState('');
  const [localPositions, setLocalPositions] = useState({});

  useEffect(() => {
    if (!open || !loteo) return;
    setPlanImageUrl(loteo.planImageUrl || loteo.photos?.[0] || '');
    const initial = {};
    (loteo.lotes || []).forEach((l) => {
      if (isLoteOnPlan(l)) {
        initial[l.id] = { planX: l.planX, planY: l.planY };
      }
    });
    setLocalPositions(initial);
  }, [open, loteo]);

  const lotes = loteo?.lotes || [];
  const photos = loteo?.photos || [];

  const getEffectivePos = (l) => {
    if (Object.prototype.hasOwnProperty.call(localPositions, l.id)) {
      return localPositions[l.id];
    }
    return { planX: l.planX, planY: l.planY };
  };

  const lotesForMap = useMemo(
    () =>
      lotes.map((l) => {
        const p = getEffectivePos(l);
        return { ...l, planX: p.planX, planY: p.planY };
      }),
    [lotes, localPositions],
  );

  const unplaced = lotes.filter((l) => {
    const p = getEffectivePos(l);
    return p.planX == null || p.planY == null;
  });

  const placed = lotes.filter((l) => {
    const p = getEffectivePos(l);
    return p.planX != null && p.planY != null;
  });

  const handlePositionChange = ({ loteId, planX, planY }) => {
    setLocalPositions((prev) => ({
      ...prev,
      [loteId]: { planX, planY },
    }));
  };

  const removeFromPlan = (loteId) => {
    setLocalPositions((prev) => ({
      ...prev,
      [loteId]: { planX: null, planY: null },
    }));
  };

  const handleSave = async () => {
    if (!planImageUrl) {
      toast.warn('Seleccioná una imagen como plano');
      return;
    }
    try {
      const positions = lotes.map((l) => {
        const p = getEffectivePos(l);
        return {
          loteId: l.id,
          planX: p.planX ?? null,
          planY: p.planY ?? null,
        };
      });

      await savePlan({
        loteoId: loteo.id,
        planImageUrl,
        positions,
      }).unwrap();

      toast.success('Plano guardado');
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar el plano');
    }
  };

  const handleDragStart = (e, loteId) => {
    e.dataTransfer.setData('loteId', String(loteId));
    e.dataTransfer.effectAllowed = 'move';
  };

  if (!open || !loteo) return null;

  return (
    <div className={`${modalOverlay} z-50 p-4`}>
      <div className={`${modalBox} max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col rounded-2xl`}>
        <div className={`${modalHeader} px-5 py-4 shrink-0`}>
          <div>
            <h2 className="text-textPrimary font-bold text-lg">Editor de plano — {loteo.name}</h2>
            <p className="text-textMuted text-sm">Ubicá cada lote sobre el plano. El color cambia según el estado.</p>
          </div>
          <button type="button" onClick={onClose} className="text-textMuted hover:text-textPrimary p-1">
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Sidebar lotes */}
          <div className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-borderBase p-4 overflow-y-auto max-h-48 lg:max-h-none">
            <p className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-2">Imagen del plano</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {photos.length === 0 ? (
                <p className="text-textMuted text-xs">Subí fotos al loteo primero</p>
              ) : (
                photos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPlanImageUrl(url)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                      planImageUrl === url ? 'border-brand ring-2 ring-brand/40' : 'border-borderBase opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))
              )}
            </div>

            <p className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-2">
              Sin ubicar ({unplaced.length})
            </p>
            <div className="space-y-1.5 mb-4">
              {unplaced.length === 0 ? (
                <p className="text-textMuted text-xs">Todos los lotes están en el plano</p>
              ) : (
                unplaced.map((l) => {
                  const st = getLotePlanMarkerStyle(l.status);
                  return (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, l.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-bgElevated border border-borderBase cursor-grab active:cursor-grabbing text-sm text-textPrimary"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                      Lote {l.number}
                    </div>
                  );
                })
              )}
            </div>

            {placed.length > 0 && (
              <>
                <p className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-2">En el plano</p>
                <div className="space-y-1">
                  {placed.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs text-textSecondary">
                      <span>Lote {l.number}</span>
                      <button
                        type="button"
                        onClick={() => removeFromPlan(l.id)}
                        className="p-1 text-customRed hover:bg-customRedMuted rounded"
                        title="Quitar del plano"
                      >
                        <IoTrashOutline className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            {!planImageUrl && photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-textMuted gap-2 py-16">
                <IoImagesOutline className="w-12 h-12" />
                <p className="text-sm text-center">Agregá fotos al loteo y elegí una como plano</p>
              </div>
            ) : (
              <LoteoPlanMap
                planImageUrl={planImageUrl}
                lotes={lotesForMap}
                mode="edit"
                onPositionsChange={handlePositionChange}
                positionsOverride={localPositions}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-borderBase shrink-0">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !planImageUrl}
            className={`${btnPrimary} flex-1 justify-center disabled:opacity-50`}
          >
            <IoSaveOutline className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar plano'}
          </button>
        </div>
      </div>
    </div>
  );
}

LoteoPlanEditor.propTypes = {
  loteo: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
