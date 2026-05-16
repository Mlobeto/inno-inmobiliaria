import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  IoArrowBackOutline,
  IoLocationOutline,
  IoLogoWhatsapp,
  IoMapOutline,
  IoGridOutline,
  IoExpandOutline,

  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

const LOTE_STATUS_STYLES = {
  DISPONIBLE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  RESERVADO:  'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  VENDIDO:    'bg-red-500/20 text-red-300 border border-red-500/30',
};

const LOTE_STATUS_LABELS = {
  DISPONIBLE: 'Disponible',
  RESERVADO:  'Reservado',
  VENDIDO:    'Vendido',
};

const LoteoDetail = () => {
  const { subdomain, loteoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedLote, setSelectedLote] = useState(null);

  useEffect(() => {
    if (!subdomain || !loteoId) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/public/${subdomain}/loteos/${loteoId}`
        );
        setData(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar el loteo');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [subdomain, loteoId]);

  const formatPrice = (price, currency = 'ARS') =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const generateWhatsApp = (lote) => {
    const { tenant, loteo } = data;
    const phone = (tenant.contact.whatsapp || '').replace(/\D/g, '');
    const msg = `Hola! Vi el Lote ${lote.number} del Loteo "${loteo.name}" en ${tenant.name}${lote.surface ? ` (${lote.surface} m²)` : ''}${lote.price ? ` - ${formatPrice(lote.price, lote.currency)}` : ''}. ¿Está disponible?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-lime-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Cargando loteo...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <IoMapOutline className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loteo no encontrado</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => navigate(`/${subdomain}`)}
            className="px-6 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition"
          >
            Volver a la inmobiliaria
          </button>
        </div>
      </div>
    );
  }

  const { tenant, loteo } = data;
  const photos = loteo.photos || [];
  const prevImage = () => setCurrentImageIndex(i => (i - 1 + photos.length) % photos.length);
  const nextImage = () => setCurrentImageIndex(i => (i + 1) % photos.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/${subdomain}`}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <IoArrowBackOutline className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              {tenant.logo && (
                <img src={tenant.logo} alt={tenant.name} className="h-9 w-9 rounded-full object-cover border border-white/10" />
              )}
              <span className="text-white font-semibold">{tenant.name}</span>
            </div>
          </div>
          {tenant.contact?.whatsapp && (
            <a
              href={`https://wa.me/${tenant.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Vi el loteo "${loteo.name}" y me gustaría consultar.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium text-sm"
            >
              <IoLogoWhatsapp className="w-5 h-5" />
              <span className="hidden sm:inline">Contactar</span>
            </a>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Galería de fotos generales */}
        {photos.length > 0 && (
          <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8 bg-slate-800">
            <img
              src={photos[currentImageIndex]}
              alt={loteo.name}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                >
                  <IoChevronBackOutline className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                >
                  <IoChevronForwardOutline className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition ${i === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Título e info */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IoMapOutline className="w-6 h-6 text-lime-400" />
                <h1 className="text-3xl font-bold text-white">{loteo.name}</h1>
              </div>
              {(loteo.city || loteo.province) && (
                <p className="text-slate-400 flex items-center gap-1 mt-1">
                  <IoLocationOutline className="w-4 h-4" />
                  {[loteo.address, loteo.city, loteo.province].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-400 text-sm">
                <IoGridOutline className="w-4 h-4" />
                {loteo.totalLotes || 0} lotes en total
              </span>
            </div>
          </div>
          {loteo.description && (
            <p className="text-slate-300 mt-4 leading-relaxed">{loteo.description}</p>
          )}
        </div>

        {/* Grid de lotes */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-1">Lotes disponibles</h2>
          <p className="text-slate-400 text-sm mb-5">
            {loteo.lotes?.filter(l => l.status === 'DISPONIBLE').length || 0} disponibles ·{' '}
            {loteo.lotes?.filter(l => l.status === 'RESERVADO').length || 0} reservados ·{' '}
            {loteo.lotes?.filter(l => l.status === 'VENDIDO').length || 0} vendidos
          </p>

          {loteo.lotes?.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay lotes cargados aún.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {loteo.lotes.map((lote) => (
                <button
                  key={lote.id}
                  onClick={() => setSelectedLote(lote.id === selectedLote?.id ? null : lote)}
                  disabled={lote.status === 'VENDIDO'}
                  className={`text-left bg-white/5 border rounded-xl p-3 transition-all duration-200 ${
                    lote.status === 'VENDIDO'
                      ? 'opacity-50 cursor-not-allowed border-white/5'
                      : selectedLote?.id === lote.id
                        ? 'border-lime-500 bg-lime-500/10 scale-[1.02]'
                        : 'border-white/10 hover:border-white/30 hover:bg-white/8'
                  }`}
                >
                  {lote.photos?.[0] && (
                    <img src={lote.photos[0]} alt={`Lote ${lote.number}`} className="w-full h-20 object-cover rounded-lg mb-2" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-sm">Lote {lote.number}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${LOTE_STATUS_STYLES[lote.status]}`}>
                      {LOTE_STATUS_LABELS[lote.status]}
                    </span>
                  </div>
                  {lote.surface && (
                    <p className="text-slate-400 text-xs flex items-center gap-0.5">
                      <IoExpandOutline className="w-3 h-3" /> {lote.surface} m²
                    </p>
                  )}
                  {lote.price && (
                    <p className="text-emerald-400 text-xs font-semibold mt-0.5">
                      {formatPrice(lote.price, lote.currency)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel detalle del lote seleccionado */}
        {selectedLote && (
          <div className="mt-6 bg-white/5 border border-lime-500/30 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Fotos del lote */}
              {selectedLote.photos?.length > 0 && (
                <div className="sm:w-56 flex-shrink-0">
                  <img
                    src={selectedLote.photos[0]}
                    alt={`Lote ${selectedLote.number}`}
                    className="w-full h-36 object-cover rounded-xl"
                  />
                  {selectedLote.photos.length > 1 && (
                    <div className="flex gap-1 mt-1 overflow-x-auto">
                      {selectedLote.photos.slice(1).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-white text-xl font-bold mb-2">Lote {selectedLote.number}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {selectedLote.surface && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-slate-400 text-xs">Superficie</p>
                      <p className="text-white font-semibold">{selectedLote.surface} m²</p>
                    </div>
                  )}
                  {selectedLote.price && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <p className="text-slate-400 text-xs">Precio</p>
                      <p className="text-emerald-400 font-bold">{formatPrice(selectedLote.price, selectedLote.currency)}</p>
                    </div>
                  )}
                </div>
                {selectedLote.description && (
                  <p className="text-slate-300 text-sm mb-4">{selectedLote.description}</p>
                )}
                {tenant.contact?.whatsapp && selectedLote.status === 'DISPONIBLE' && (
                  <a
                    href={generateWhatsApp(selectedLote)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition"
                  >
                    <IoLogoWhatsapp className="w-5 h-5" />
                    Consultar por este lote
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Innoweb. Todos los derechos reservados.</p>
          {tenant.contact?.address && (
            <p className="flex items-center gap-2">
              <IoLocationOutline className="w-4 h-4" />
              {tenant.contact.address}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default LoteoDetail;
