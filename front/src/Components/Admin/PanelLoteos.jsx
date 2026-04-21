import { useState } from 'react';
import PropTypes from 'prop-types';
import LoteoVentaPdf from '../PdfTemplates/LoteoVentaPdf';
import { useDolarRate } from '../hooks/useDolarRate';
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
  useGetVentaLoteQuery,
  useCreateVentaLoteMutation,
  useDeleteVentaLoteMutation,
  usePagarCuotaMutation,
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
  IoReceiptOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCashOutline,
  IoAlertCircleOutline,
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
  totalLotes: '',
};

const EMPTY_VENTA = {
  clienteNombre: '',
  clienteCuil: '',
  clienteTelefono: '',
  fechaVenta: new Date().toISOString().split('T')[0],
  precioTotal: '',
  currency: 'ARS',
  anticipo: '',
  cantidadCuotas: '12',
  interes: '',
  periodicidad: 'MENSUAL',
  notas: '',
};

const PERIODICIDAD_OPTS = [
  { value: 'MENSUAL',    label: 'Mensual' },
  { value: 'BIMESTRAL', label: 'Bimestral' },
  { value: 'TRIMESTRAL',label: 'Trimestral' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'ANUAL',     label: 'Anual' },
];

const EMPTY_LOTE = {
  number: '',
  parcela: '',
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

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

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
  const [createVentaLote]    = useCreateVentaLoteMutation();
  const [deleteVentaLote]    = useDeleteVentaLoteMutation();
  const [pagarCuota]         = usePagarCuotaMutation();

  const loteos = loteosData?.loteos || [];
  const { dolar, loading: dolarLoading } = useDolarRate();

  const formatCurrency = (value, currency = 'ARS') =>
    value != null
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value)
      : '—';

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

  // Modal venta / plan de financiación
  const [showVentaModal, setShowVentaModal]   = useState(false);
  const [selectedLoteForVenta, setSelectedLoteForVenta] = useState(null);
  const [ventaForm, setVentaForm]             = useState(EMPTY_VENTA);
  const [savingVenta, setSavingVenta]         = useState(false);
  const [ventaError, setVentaError]           = useState('');

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // Detalle del loteo seleccionado
  const { data: loteoDetailData, isLoading: loadingDetail } = useGetLoteoByIdQuery(
    selectedLoteoId,
    { skip: !selectedLoteoId }
  );
  const loteoDetail = loteoDetailData?.loteo || null;

  // Venta del lote seleccionado para el modal
  const { data: ventaData, isLoading: loadingVenta } = useGetVentaLoteQuery(
    { loteoId: selectedLoteoId, loteId: selectedLoteForVenta?.id },
    { skip: !showVentaModal || !selectedLoteForVenta }
  );
  const venta = ventaData?.venta || null;

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
      totalLotes:  String(loteo.totalLotes || ''),
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
      const payload = {
        ...loteoForm,
        totalLotes: loteoForm.totalLotes !== '' ? Number(loteoForm.totalLotes) : undefined,
      };
      if (editingLoteo) {
        await updateLoteo({ loteoId: editingLoteo.id, ...payload }).unwrap();
      } else {
        await createLoteo(payload).unwrap();
      }
      setShowLoteoModal(false);
    } catch (err) {
      setError(err?.data?.message || 'Error al guardar el loteo');
    } finally {
      setSaving(false);
    }
  };

  // ── Modal Venta / Financiación ─────────────────────────────────────────────

  const openVentaModal = (lote) => {
    setSelectedLoteForVenta(lote);
    setVentaForm({
      ...EMPTY_VENTA,
      precioTotal: lote.price ? String(lote.price) : '',
      currency:    lote.currency || 'ARS',
    });
    setVentaError('');
    setShowVentaModal(true);
  };

  const closeVentaModal = () => {
    setShowVentaModal(false);
    setSelectedLoteForVenta(null);
  };

  const saveVenta = async () => {
    if (!ventaForm.clienteNombre.trim()) { setVentaError('El nombre del comprador es obligatorio'); return; }
    if (!ventaForm.precioTotal || Number(ventaForm.precioTotal) <= 0) { setVentaError('El precio total es obligatorio'); return; }
    if (!ventaForm.cantidadCuotas || Number(ventaForm.cantidadCuotas) <= 0) { setVentaError('La cantidad de cuotas es obligatoria'); return; }
    setSavingVenta(true);
    setVentaError('');
    try {
      await createVentaLote({
        loteoId: selectedLoteoId,
        loteId:  selectedLoteForVenta.id,
        ...ventaForm,
        precioTotal:     parseFloat(ventaForm.precioTotal),
        anticipo:        parseFloat(ventaForm.anticipo || 0),
        cantidadCuotas:  parseInt(ventaForm.cantidadCuotas, 10),
        interes:         ventaForm.interes ? parseFloat(ventaForm.interes) : null,
      }).unwrap();
    } catch (err) {
      setVentaError(err?.data?.message || 'Error al registrar la venta');
    } finally {
      setSavingVenta(false);
    }
  };

  const handlePagarCuota = async (cuotaId, pagado) => {
    try {
      await pagarCuota({
        loteoId: selectedLoteoId,
        loteId:  selectedLoteForVenta.id,
        cuotaId,
        pagado,
      }).unwrap();
    } catch {
      alert('Error al registrar el pago');
    }
  };

  const handleDeleteVenta = async () => {
    if (!window.confirm('¿Anular la venta y volver el lote a DISPONIBLE?')) return;
    try {
      await deleteVentaLote({ loteoId: selectedLoteoId, loteId: selectedLoteForVenta.id }).unwrap();
      closeVentaModal();
    } catch {
      alert('Error al anular la venta');
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
      parcela:     lote.parcela || '',
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
        loteoId:     selectedLoteoId,
        number:      parseInt(loteForm.number, 10),
        parcela:     loteForm.parcela.trim() || null,
        surface:     loteForm.surface ? parseFloat(loteForm.surface) : null,
        price:       loteForm.price ? parseFloat(loteForm.price) : null,
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
                            onClick={() => openVentaModal(lote)}
                            className="flex-1 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-xs transition-colors"
                            title="Plan de venta / financiación"
                          >
                            <IoReceiptOutline className="w-3.5 h-3.5 mx-auto" />
                          </button>
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

              {/* Cantidad de lotes y precio base */}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Cantidad de lotes</label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  value={loteoForm.totalLotes}
                  onChange={e => setLoteoForm(f => ({ ...f, totalLotes: e.target.value }))}
                  placeholder="Ej: 80 (cantidad total de lotes del proyecto)"
                />
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
                  <label className="block text-slate-300 text-sm mb-1">Parcela</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    value={loteForm.parcela}
                    onChange={e => setLoteForm(f => ({ ...f, parcela: e.target.value }))}
                    placeholder="Ej: Parcela 1 / Manzana A"
                  />
                </div>
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

              {/* Widget cotización dólar */}
              {loteForm.currency === 'USD' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  {dolarLoading ? (
                    <p className="text-amber-400 text-xs">Obteniendo cotización...</p>
                  ) : dolar ? (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Dólar Oficial venta:</span>
                        <span className="text-white font-semibold">{formatCurrency(dolar.oficial?.venta, 'ARS')}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Dólar Blue venta:</span>
                        <span className="text-white font-semibold">{formatCurrency(dolar.blue?.venta, 'ARS')}</span>
                      </div>
                      {loteForm.price && (
                        <div className="border-t border-amber-500/20 pt-1 mt-1">
                          <div className="flex justify-between">
                            <span className="text-amber-300">Equiv. Oficial:</span>
                            <span className="text-amber-300 font-semibold">
                              {formatCurrency(parseFloat(loteForm.price) * (dolar.oficial?.venta || 0), 'ARS')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300">Equiv. Blue:</span>
                            <span className="text-blue-300 font-semibold">
                              {formatCurrency(parseFloat(loteForm.price) * (dolar.blue?.venta || 0), 'ARS')}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-slate-500 text-[10px] mt-1">Actualizado: {dolar.lastUpdate ? new Date(dolar.lastUpdate).toLocaleString('es-AR') : '—'}</p>
                    </div>
                  ) : (
                    <p className="text-red-400 text-xs">No se pudo obtener la cotización</p>
                  )}
                </div>
              )}

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

      {/* ── Modal: Plan de Venta / Financiación ── */}
      {showVentaModal && selectedLoteForVenta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <IoReceiptOutline className="w-6 h-6 text-emerald-400" />
                <div>
                  <h2 className="text-white font-bold text-lg">Plan de Venta</h2>
                  <p className="text-slate-400 text-sm">Lote {selectedLoteForVenta.number}</p>
                </div>
              </div>
              <button onClick={closeVentaModal} className="text-slate-400 hover:text-white">
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

            {/* Loading state */}
            {loadingVenta ? (
              <div className="p-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
              </div>

            /* Venta existente: mostrar plan y cuotas */
            ) : venta ? (
              <div className="p-5 space-y-5">

                {/* Info de la venta */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">Comprador</p>
                    <p className="text-white font-semibold">{venta.clienteNombre}</p>
                    {venta.clienteCuil && <p className="text-slate-400 text-xs">{venta.clienteCuil}</p>}
                    {venta.clienteTelefono && <p className="text-slate-400 text-xs">{venta.clienteTelefono}</p>}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fecha:</span>
                      <span className="text-white">{new Date(venta.fechaVenta).toLocaleDateString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Precio total:</span>
                      <span className="text-white font-semibold">{formatCurrency(venta.precioTotal, venta.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anticipo:</span>
                      <span className="text-white">{formatCurrency(venta.anticipo, venta.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Saldo:</span>
                      <span className="text-emerald-300 font-semibold">{formatCurrency(venta.saldo, venta.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuotas:</span>
                      <span className="text-white">{venta.cantidadCuotas} × {formatCurrency(venta.montoCuota, venta.currency)}</span>
                    </div>
                    {venta.interes > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Interés:</span>
                        <span className="text-amber-300">{venta.interes}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Periodicidad:</span>
                      <span className="text-white">{venta.periodicidad}</span>
                    </div>
                  </div>
                </div>

                {/* Cuotas */}
                <div>
                  <h3 className="text-slate-300 font-semibold mb-2 flex items-center gap-2">
                    <IoCashOutline className="w-4 h-4" /> Cuotas
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5 text-slate-400 text-xs">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Vencimiento</th>
                          <th className="px-3 py-2 text-right">Monto</th>
                          <th className="px-3 py-2 text-center">Estado</th>
                          <th className="px-3 py-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(venta.cuotas || []).map(c => (
                          <tr key={c.id} className={`border-t border-white/5 ${c.pagado ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-2 text-slate-300">{c.numeroCuota}</td>
                            <td className="px-3 py-2 text-slate-300">
                              {new Date(c.fechaVencimiento).toLocaleDateString('es-AR')}
                            </td>
                            <td className="px-3 py-2 text-right text-white font-medium">
                              {formatCurrency(c.monto, venta.currency)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {c.pagado ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                  <IoCheckmarkCircleOutline className="w-4 h-4" /> Pagada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                                  <IoTimeOutline className="w-4 h-4" /> Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handlePagarCuota(c.id, !c.pagado)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  c.pagado
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                                }`}
                              >
                                {c.pagado ? 'Desmarcar' : 'Pagar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {venta.notas && (
                  <p className="text-slate-400 text-sm bg-white/5 rounded-lg p-3">{venta.notas}</p>
                )}

                {/* Anular venta */}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <LoteoVentaPdf
                    venta={venta}
                    lote={selectedLoteForVenta}
                    loteo={loteoDetail}
                  />
                  <div className="flex items-center gap-3">
                    <p className="text-slate-500 text-xs">Anular devuelve el lote a DISPONIBLE</p>
                    <button
                      onClick={handleDeleteVenta}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      <IoAlertCircleOutline className="w-4 h-4" />
                      Anular venta
                    </button>
                  </div>
                </div>
              </div>

            /* Sin venta: formulario para crear */
            ) : (
              <div className="p-5 space-y-5">
                {ventaError && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">{ventaError}</p>
                )}

                {/* Sección: Datos del comprador */}
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Datos del comprador</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-300 text-sm mb-1">Nombre completo *</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        value={ventaForm.clienteNombre}
                        onChange={e => setVentaForm(f => ({ ...f, clienteNombre: e.target.value }))}
                        placeholder="Apellido, Nombre"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">CUIL / DNI</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.clienteCuil}
                          onChange={e => setVentaForm(f => ({ ...f, clienteCuil: e.target.value }))}
                          placeholder="20-12345678-5"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Teléfono</label>
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.clienteTelefono}
                          onChange={e => setVentaForm(f => ({ ...f, clienteTelefono: e.target.value }))}
                          placeholder="+54 9 ..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Condiciones de venta */}
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Condiciones de venta</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-slate-300 text-sm mb-1">Precio total *</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.precioTotal}
                          onChange={e => setVentaForm(f => ({ ...f, precioTotal: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Moneda</label>
                        <select
                          className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                          value={ventaForm.currency}
                          onChange={e => setVentaForm(f => ({ ...f, currency: e.target.value }))}
                        >
                          <option value="ARS">ARS $</option>
                          <option value="USD">USD U$S</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Anticipo / Seña</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.anticipo}
                          onChange={e => setVentaForm(f => ({ ...f, anticipo: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Fecha de venta</label>
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                          value={ventaForm.fechaVenta}
                          onChange={e => setVentaForm(f => ({ ...f, fechaVenta: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Plan de financiación */}
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Plan de financiación</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Cant. cuotas *</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.cantidadCuotas}
                          onChange={e => setVentaForm(f => ({ ...f, cantidadCuotas: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Interés (%)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          value={ventaForm.interes}
                          onChange={e => setVentaForm(f => ({ ...f, interes: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm mb-1">Periodicidad</label>
                        <select
                          className="w-full bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                          value={ventaForm.periodicidad}
                          onChange={e => setVentaForm(f => ({ ...f, periodicidad: e.target.value }))}
                        >
                          {PERIODICIDAD_OPTS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preview en tiempo real */}
                    {ventaForm.precioTotal && ventaForm.cantidadCuotas && (() => {
                      const precio    = parseFloat(ventaForm.precioTotal) || 0;
                      const anticipo  = parseFloat(ventaForm.anticipo) || 0;
                      const interes   = parseFloat(ventaForm.interes) || 0;
                      const cuotas    = parseInt(ventaForm.cantidadCuotas, 10) || 1;
                      const saldo     = precio - anticipo;
                      const total     = saldo * (1 + interes / 100);
                      const cuotaMonto = total / cuotas;
                      return (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1 text-sm">
                          <div className="flex justify-between text-slate-300">
                            <span>Saldo a financiar:</span>
                            <span className="text-white font-semibold">{formatCurrency(saldo, ventaForm.currency)}</span>
                          </div>
                          {interes > 0 && (
                            <div className="flex justify-between text-slate-300">
                              <span>Total con interés ({interes}%):</span>
                              <span className="text-amber-300 font-semibold">{formatCurrency(total, ventaForm.currency)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-300 border-t border-emerald-500/20 pt-1 mt-1">
                            <span>Valor de cada cuota:</span>
                            <span className="text-emerald-300 font-bold text-base">{formatCurrency(cuotaMonto, ventaForm.currency)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Notas</label>
                  <textarea
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    value={ventaForm.notas}
                    onChange={e => setVentaForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Condiciones especiales, observaciones..."
                  />
                </div>

                {/* Botones */}
                <div className="flex space-x-3 pt-2 border-t border-white/10">
                  <button
                    onClick={closeVentaModal}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveVenta}
                    disabled={savingVenta}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <IoReceiptOutline className="w-5 h-5" />
                    <span>{savingVenta ? 'Guardando...' : 'Registrar venta'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
