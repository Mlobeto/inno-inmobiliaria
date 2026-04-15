import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetLoteosQuery,
  useGetLoteoByIdQuery,
  useCreateLoteoMutation,
  useUpdateLoteoMutation,
  useDeleteLoteoMutation,
  useTogglePublishLoteoMutation,
  useCreateLoteMutation,
  useUpdateLoteMutation,
  useDeleteLoteMutation,
} from '@shared/redux';
import {
  IoArrowBack,
  IoAdd,
  IoTrashOutline,
  IoPencilOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoCloseOutline,
  IoCheckmarkOutline,
  IoMapOutline,
  IoChevronBackOutline,
  IoImagesOutline,
  IoGridOutline,
} from 'react-icons/io5';
import { uploadMultipleFiles } from '../../utils/azureUpload';

// ── Constantes ──────────────────────────────────────────────────────────────

const LOTEO_STATUS = [
  { value: 'ACTIVO',   label: 'Activo',   color: 'emerald' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'gray' },
  { value: 'VENDIDO',  label: 'Vendido',  color: 'red' },
];

const LOTE_STATUS = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'emerald' },
  { value: 'RESERVADO',  label: 'Reservado',  color: 'yellow' },
  { value: 'VENDIDO',    label: 'Vendido',    color: 'red' },
];

const STATUS_BADGE = {
  ACTIVO:     'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  INACTIVO:   'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  VENDIDO:    'bg-red-500/20 text-red-300 border border-red-500/30',
  DISPONIBLE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  RESERVADO:  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
};

const EMPTY_LOTEO = {
  name: '',
  description: '',
  address: '',
  city: '',
  province: '',
  photos: [],
};

const EMPTY_LOTE = {
  number: '',
  surface: '',
  price: '',
  currency: 'ARS',
  status: 'DISPONIBLE',
  description: '',
  photos: [],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[status] || STATUS_BADGE.INACTIVO}`}>
    {[...LOTEO_STATUS, ...LOTE_STATUS].find(s => s.value === status)?.label || status}
  </span>
);

// ── Componente principal ──────────────────────────────────────────────────────

export default function PanelLoteos() {
  const { data: loteosData, isLoading } = useGetLoteosQuery();
  const [createLoteo]        = useCreateLoteoMutation();
  const [updateLoteo]        = useUpdateLoteoMutation();
  const [deleteLoteo]        = useDeleteLoteoMutation();
  const [togglePublishLoteo] = useTogglePublishLoteoMutation();
  const [createLote]         = useCreateLoteMutation();
  const [updateLote]         = useUpdateLoteMutation();
  const [deleteLote]         = useDeleteLoteMutation();

  const loteos = loteosData?.loteos || [];

  // Vista principal: null = lista, string = id del loteo seleccionado
  const [selectedLoteoId, setSelectedLoteoId] = useState(null);

  // Modal loteo
  const [showLoteoModal, setShowLoteoModal]   = useState(false);
  const [editingLoteo, setEditingLoteo]       = useState(null);
  const [loteoForm, setLoteoForm]             = useState(EMPTY_LOTEO);
  const [uploadingLoteo, setUploadingLoteo]   = useState(false);

  // Modal lote
  const [showLoteModal, setShowLoteModal]     = useState(false);
  const [editingLote, setEditingLote]         = useState(null);
  const [loteForm, setLoteForm]               = useState(EMPTY_LOTE);
  const [uploadingLote, setUploadingLote]     = useState(false);

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Detalle del loteo seleccionado
  const { data: loteoDetailData, isLoading: loadingDetail } = useGetLoteoByIdQuery(
    selectedLoteoId,
    { skip: !selectedLoteoId }
  );
  const loteoDetail = loteoDetailData?.loteo || null;

  // ── Modal Loteo ────────────────────────────────────────────────────────────

  const openCreateLoteo = () => {
    setEditingLoteo(null);
    setLoteoForm(EMPTY_LOTEO);
    setError('');
    setShowLoteoModal(true);
  };

  const openEditLoteo = (loteo) => {
    setEditingLoteo(loteo);
    setLoteoForm({
      name:        loteo.name || '',
      description: loteo.description || '',
      address:     loteo.address || '',
      city:        loteo.city || '',
      province:    loteo.province || '',
      photos:      loteo.photos || [],
    });
    setError('');
    setShowLoteoModal(true);
  };

  const handleLoteoPhotos = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingLoteo(true);
    try {
      const urls = await uploadMultipleFiles(files, 'properties');
      setLoteoForm(f => ({ ...f, photos: [...f.photos, ...urls] }));
    } catch {
      setError('Error al subir fotos del loteo');
    } finally {
      setUploadingLoteo(false);
    }
  };

  const removeLoteoPhoto = (idx) =>
    setLoteoForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const saveLoteo = async () => {
    if (!loteoForm.name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingLoteo) {
        await updateLoteo({ loteoId: editingLoteo.id, ...loteoForm }).unwrap();
      } else {
        await createLoteo(loteoForm).unwrap();
      }
      setShowLoteoModal(false);
    } catch (err) {
      setError(err?.data?.message || 'Error al guardar el loteo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLoteo = async (loteoId) => {
    if (!window.confirm('¿Eliminar este loteo y todos sus lotes?')) return;
    try {
      await deleteLoteo(loteoId).unwrap();
      if (selectedLoteoId === loteoId) setSelectedLoteoId(null);
    } catch {
      alert('Error al eliminar el loteo');
    }
  };

  const handleTogglePublish = async (loteoId) => {
    try {
      await togglePublishLoteo(loteoId).unwrap();
    } catch {
      alert('Error al cambiar el estado de publicación');
    }
  };

  // ── Modal Lote ─────────────────────────────────────────────────────────────

  const openCreateLote = () => {
    setEditingLote(null);
    setLoteForm(EMPTY_LOTE);
    setError('');
    setShowLoteModal(true);
  };

  const openEditLote = (lote) => {
    setEditingLote(lote);
    setLoteForm({
      number:      String(lote.number || ''),
      surface:     String(lote.surface || ''),
      price:       String(lote.price || ''),
      currency:    lote.currency || 'ARS',
      status:      lote.status || 'DISPONIBLE',
      description: lote.description || '',
      photos:      lote.photos || [],
    });
    setError('');
    setShowLoteModal(true);
  };

  const handleLotePhotos = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingLote(true);
    try {
      const urls = await uploadMultipleFiles(files, 'properties');
      setLoteForm(f => ({ ...f, photos: [...f.photos, ...urls] }));
    } catch {
      setError('Error al subir fotos del lote');
    } finally {
      setUploadingLote(false);
    }
  };

  const removeLotePhoto = (idx) =>
    setLoteForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

  const saveLote = async () => {
    if (!loteForm.number) { setError('El número de lote es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        loteoId: selectedLoteoId,
        number:  parseInt(loteForm.number, 10),
        surface: loteForm.surface ? parseFloat(loteForm.surface) : null,
        price:   loteForm.price ? parseFloat(loteForm.price) : null,
        currency:    loteForm.currency,
        status:      loteForm.status,
        description: loteForm.description,
        photos:      loteForm.photos,
      };
      if (editingLote) {
        await updateLote({ loteoId: selectedLoteoId, loteId: editingLote.id, ...payload }).unwrap();
      } else {
        await createLote(payload).unwrap();
      }
      setShowLoteModal(false);
    } catch (err) {
      setError(err?.data?.message || 'Error al guardar el lote');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLote = async (loteId) => {
    if (!window.confirm('¿Eliminar este lote?')) return;
    try {
      await deleteLote({ loteoId: selectedLoteoId, loteId }).unwrap();
    } catch {
      alert('Error al eliminar el lote');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {selectedLoteoId ? (
            <button
              onClick={() => setSelectedLoteoId(null)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <IoChevronBackOutline className="w-6 h-6" />
            </button>
          ) : (
            <Link to="/panel" className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <IoArrowBack className="w-6 h-6" />
            </Link>
          )}
          <div className="flex items-center space-x-2 text-white">
            <IoMapOutline className="w-7 h-7" />
            <h1 className="text-2xl font-bold">
              {selectedLoteoId
                ? loadingDetail ? 'Cargando...' : loteoDetail?.name || 'Loteo'
                : 'Loteos'}
            </h1>
          </div>
        </div>

        <button
          onClick={selectedLoteoId ? openCreateLote : openCreateLoteo}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
        >
          <IoAdd className="w-5 h-5" />
          <span>{selectedLoteoId ? 'Nuevo Lote' : 'Nuevo Loteo'}</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">

        {/* ── Vista: Lista de Loteos ── */}
        {!selectedLoteoId && (
          <>
            {isLoading ? (
              <div className="text-white text-center py-12">Cargando loteos...</div>
            ) : loteos.length === 0 ? (
              <div className="text-center py-16">
                <IoMapOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No hay loteos creados todavía.</p>
                <button
                  onClick={openCreateLoteo}
                  className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Crear primer loteo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loteos.map((loteo) => (
                  <div
                    key={loteo.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col space-y-3 hover:bg-white/8 transition-colors"
                  >
                    {/* Foto principal */}
                    {loteo.photos?.[0] ? (
                      <img
                        src={loteo.photos[0]}
                        alt={loteo.name}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-40 bg-white/5 rounded-xl flex items-center justify-center">
                        <IoImagesOutline className="w-10 h-10 text-slate-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-bold text-lg leading-tight">{loteo.name}</h3>
                        {(loteo.city || loteo.province) && (
                          <p className="text-slate-400 text-sm">{[loteo.city, loteo.province].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                      <StatusBadge status={loteo.status} />
                    </div>

                    {/* Contador lotes */}
                    <div className="flex items-center space-x-2 text-slate-400 text-sm">
                      <IoGridOutline className="w-4 h-4" />
                      <span>{loteo.totalLotes || 0} lote{loteo.totalLotes !== 1 ? 's' : ''}</span>
                      {loteo.isPublished && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Publicado
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={() => setSelectedLoteoId(loteo.id)}
                        className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Ver Lotes
                      </button>
                      <button
                        onClick={() => handleTogglePublish(loteo.id)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                        title={loteo.isPublished ? 'Despublicar' : 'Publicar en landing'}
                      >
                        {loteo.isPublished ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditLoteo(loteo)}
                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
                      >
                        <IoPencilOutline className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLoteo(loteo.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      >
                        <IoTrashOutline className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Vista: Detalle de un Loteo (grid de lotes) ── */}
        {selectedLoteoId && (
          <>
            {loadingDetail ? (
              <div className="text-white text-center py-12">Cargando lotes...</div>
            ) : !loteoDetail ? (
              <div className="text-white text-center py-12">No se encontró el loteo.</div>
            ) : (
              <>
                {/* Info del loteo */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {loteoDetail.description && (
                        <p className="text-slate-400 text-sm mt-1">{loteoDetail.description}</p>
                      )}
                      {loteoDetail.address && (
                        <p className="text-slate-400 text-sm">{loteoDetail.address}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={loteoDetail.status} />
                      {loteoDetail.isPublished && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Publicado
                        </span>
                      )}
                      <button
                        onClick={() => openEditLoteo(loteoDetail)}
                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
                      >
                        <IoPencilOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fotos generales del loteo */}
                  {loteoDetail.photos?.length > 0 && (
                    <div className="mt-4 flex space-x-2 overflow-x-auto pb-1">
                      {loteoDetail.photos.map((url, i) => (
                        <img key={i} src={url} alt="" className="h-20 w-32 object-cover rounded-lg flex-shrink-0" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid de lotes */}
                {loteoDetail.lotes?.length === 0 ? (
                  <div className="text-center py-12">
                    <IoGridOutline className="w-14 h-14 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400">No hay lotes en este loteo todavía.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {loteoDetail.lotes?.map((lote) => (
                      <div
                        key={lote.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col space-y-2"
                      >
                        {lote.photos?.[0] ? (
                          <img src={lote.photos[0]} alt={`Lote ${lote.number}`} className="w-full h-24 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-24 bg-white/5 rounded-lg flex items-center justify-center">
                            <IoImagesOutline className="w-7 h-7 text-slate-500" />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold text-sm">Lote {lote.number}</span>
                          <StatusBadge status={lote.status} />
                        </div>

                        {lote.surface && (
                          <p className="text-slate-400 text-xs">{lote.surface} m²</p>
                        )}
                        {lote.price && (
                          <p className="text-slate-300 text-xs font-semibold">
                            {lote.currency} {Number(lote.price).toLocaleString('es-AR')}
                          </p>
                        )}
                        {lote.description && (
                          <p className="text-slate-500 text-xs line-clamp-2">{lote.description}</p>
                        )}

                        <div className="flex space-x-1 pt-1">
                          <button
                            onClick={() => openEditLote(lote)}
                            className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs transition-colors"
                          >
                            <IoPencilOutline className="w-3.5 h-3.5 mx-auto" />
                          </button>
                          <button
                            onClick={() => handleDeleteLote(lote.id)}
                            className="flex-1 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
                          >
                            <IoTrashOutline className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Crear/Editar Loteo ── */}
      {showLoteoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">
                {editingLoteo ? 'Editar Loteo' : 'Nuevo Loteo'}
              </h2>
              <button onClick={() => setShowLoteoModal(false)} className="text-slate-400 hover:text-white">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>
              )}

              <div>
                <label className="block text-slate-300 text-sm mb-1">Nombre *</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  value={loteoForm.name}
                  onChange={e => setLoteoForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Loteo Los Álamos"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Descripción</label>
                <textarea
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  value={loteoForm.description}
                  onChange={e => setLoteoForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del proyecto..."
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Dirección</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  value={loteoForm.address}
                  onChange={e => setLoteoForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle y número"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Ciudad</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteoForm.city}
                    onChange={e => setLoteoForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Provincia</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteoForm.province}
                    onChange={e => setLoteoForm(f => ({ ...f, province: e.target.value }))}
                    placeholder="Provincia"
                  />
                </div>
              </div>

              {/* Fotos generales */}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Fotos generales del loteo</label>
                <label className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <IoImagesOutline className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400 text-sm">
                    {uploadingLoteo ? 'Subiendo...' : 'Seleccionar fotos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingLoteo}
                    onChange={handleLoteoPhotos}
                  />
                </label>
                {loteoForm.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {loteoForm.photos.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        <button
                          onClick={() => removeLoteoPhoto(i)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <IoCloseOutline className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowLoteoModal(false)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveLoteo}
                disabled={saving || uploadingLoteo}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <IoCheckmarkOutline className="w-5 h-5" />
                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Crear/Editar Lote ── */}
      {showLoteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-white font-bold text-lg">
                {editingLote ? `Editar Lote ${editingLote.number}` : 'Nuevo Lote'}
              </h2>
              <button onClick={() => setShowLoteModal(false)} className="text-slate-400 hover:text-white">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Número de lote *</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteForm.number}
                    onChange={e => setLoteForm(f => ({ ...f, number: e.target.value }))}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Superficie (m²)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteForm.surface}
                    onChange={e => setLoteForm(f => ({ ...f, surface: e.target.value }))}
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Precio</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteForm.price}
                    onChange={e => setLoteForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Moneda</label>
                  <select
                    className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    value={loteForm.currency}
                    onChange={e => setLoteForm(f => ({ ...f, currency: e.target.value }))}
                  >
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$S</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Estado</label>
                <select
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  value={loteForm.status}
                  onChange={e => setLoteForm(f => ({ ...f, status: e.target.value }))}
                >
                  {LOTE_STATUS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Descripción</label>
                <textarea
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  value={loteForm.description}
                  onChange={e => setLoteForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Observaciones del lote..."
                />
              </div>

              {/* Fotos del lote */}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Fotos del lote</label>
                <label className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                  <IoImagesOutline className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-400 text-sm">
                    {uploadingLote ? 'Subiendo...' : 'Seleccionar fotos'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingLote}
                    onChange={handleLotePhotos}
                  />
                </label>
                {loteForm.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {loteForm.photos.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                        <button
                          onClick={() => removeLotePhoto(i)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <IoCloseOutline className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowLoteModal(false)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveLote}
                disabled={saving || uploadingLote}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <IoCheckmarkOutline className="w-5 h-5" />
                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
