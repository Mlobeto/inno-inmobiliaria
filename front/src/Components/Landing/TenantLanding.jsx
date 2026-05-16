import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  IoLocationOutline, 
  IoHomeOutline,
  IoBedOutline,
  IoWaterOutline,
  IoExpandOutline,
  IoLogoWhatsapp,
  IoMapOutline,
  IoGridOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoFunnelOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';

const TenantLanding = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, venta, alquiler, temporal
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loteos, setLoteos] = useState([]);
  const [showLoteoPopup, setShowLoteoPopup] = useState(false);
  const [, setLogoClickCount] = useState(0);
  const ITEMS_PER_PAGE = 9;

  const handleGestPropLogoClick = () => {
    setLogoClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        navigate('/login');
        return 0;
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/public/${subdomain}`
        );
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar landing:', err);
        setError(err.response?.data?.message || 'Error al cargar la inmobiliaria');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchLandingData();
    }
  }, [subdomain]);

  // Fetch loteos publicados
  useEffect(() => {
    if (!subdomain) return;
    axios
      .get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/public/${subdomain}/loteos`)
      .then(res => {
        const list = res.data?.loteos || [];
        setLoteos(list);
        // Mostrar popup si hay loteos y no se mostró en esta sesión
        if (list.length > 0 && !sessionStorage.getItem(`loteo_popup_${subdomain}`)) {
          setTimeout(() => setShowLoteoPopup(true), 3000);
        }
      })
      .catch(() => setLoteos([]));
  }, [subdomain]);

  const closeLoteoPopup = () => {
    setShowLoteoPopup(false);
    sessionStorage.setItem(`loteo_popup_${subdomain}`, '1');
  };

  const filteredProperties = (data?.properties || []).filter(prop => {
    if (filter === 'venta' && prop.type !== 'venta') return false;
    if (filter === 'alquiler' && !(prop.type === 'alquiler' && prop.rentalType !== 'TEMPORAL')) return false;
    if (filter === 'temporal' && !(prop.type === 'alquiler' && prop.rentalType === 'TEMPORAL')) return false;
    if (filterCity && prop.location?.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterType && prop.typeProperty !== filterType) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoHomeOutline className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Inmobiliaria no encontrada</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const { tenant, properties } = data;
  const cities = data?.filters?.cities || [];
  const propertyTypes = data?.filters?.propertyTypes || [];

  const formatPrice = (price, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo y nombre */}
            <div className="flex items-center gap-4">
              {tenant.logo && (
                <img 
                  src={tenant.logo} 
                  alt={tenant.name} 
                  className="h-12 w-12 rounded-full object-cover border-2 border-blue-500/30"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
                <p className="text-slate-400 text-sm">@{tenant.subdomain}</p>
              </div>
            </div>

            {/* Contacto + Logo GestProp */}
            <div className="flex items-center gap-3">
              {tenant.contact.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.contact.whatsapp.replace(/\D/g, '')}?text=Hola! Me gustaría consultar por una propiedad`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium"
                >
                  <IoLogoWhatsapp className="w-5 h-5" />
                  <span className="hidden sm:inline">Contactar</span>
                </a>
              )}

              {/* Logo GestProp — 3 clicks para ir al login */}
              <button
                onClick={handleGestPropLogoClick}
                className="opacity-30 hover:opacity-60 transition-opacity duration-200 focus:outline-none"
                title="GestProp"
                aria-label="GestProp"
              >
                <img
                  src="/LOGO.png"
                  alt="GestProp"
                  className="h-6 object-contain"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Encontrá tu próxima propiedad
          </h2>
          <p className="text-slate-300 text-lg">
            {properties.length} {properties.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'}
          </p>
        </div>

        {/* Filtros principales */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Todas ({properties.length})
          </button>
          <button
            onClick={() => handleFilterChange('venta')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'venta'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            En Venta ({properties.filter(p => p.type === 'venta').length})
          </button>
          <button
            onClick={() => handleFilterChange('alquiler')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'alquiler'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Alquiler ({properties.filter(p => p.type === 'alquiler' && p.rentalType !== 'TEMPORAL').length})
          </button>
          <button
            onClick={() => handleFilterChange('temporal')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'temporal'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Alquiler Temporal ({properties.filter(p => p.type === 'alquiler' && p.rentalType === 'TEMPORAL').length})
          </button>
        </div>

        {/* Filtros secundarios: ciudad y tipo de propiedad */}
        {(cities.length > 0 || propertyTypes.length > 0) && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <IoFunnelOutline className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm">Filtrar por:</span>
            </div>
            {cities.length > 0 && (
              <select
                value={filterCity}
                onChange={e => { setFilterCity(e.target.value); setCurrentPage(1); }}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="bg-slate-800">Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c} value={c} className="bg-slate-800">{c}</option>
                ))}
              </select>
            )}
            {propertyTypes.length > 0 && (
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="" className="bg-slate-800">Todos los tipos</option>
                {propertyTypes.map(t => (
                  <option key={t} value={t} className="bg-slate-800">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            )}
            {(filterCity || filterType) && (
              <button
                onClick={() => { setFilterCity(''); setFilterType(''); setCurrentPage(1); }}
                className="text-slate-400 hover:text-white text-sm px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 transition"
              >
                Limpiar filtros ✕
              </button>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <IoHomeOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No hay propiedades disponibles en este momento</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/${subdomain}/property/${property.id}`}
                  className={`group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:scale-[1.02] ${
                    !property.isAvailable
                      ? 'opacity-70 hover:border-slate-500/50'
                      : 'hover:border-blue-500/50'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-slate-700 overflow-hidden">
                    {property.mainImage ? (
                      <img
                        src={property.mainImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IoHomeOutline className="w-16 h-16 text-slate-500" />
                      </div>
                    )}
                    {/* Badge no disponible (superpuesto sobre el tipo) */}
                    {!property.isAvailable ? (
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        property.type === 'venta' ? 'bg-purple-900/70' : 'bg-blue-900/70'
                      }`}>
                        <span className={`px-5 py-2 rounded-full text-white font-bold text-lg tracking-widest border-2 ${
                          property.type === 'venta'
                            ? 'bg-purple-600 border-purple-400'
                            : 'bg-blue-600 border-blue-400'
                        }`}>
                          {property.type === 'venta' ? 'VENDIDO' : 'ALQUILADO'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Badge de tipo */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white ${
                          property.type === 'venta'
                            ? 'bg-purple-500'
                            : property.rentalType === 'TEMPORAL'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}>
                          {property.type === 'venta'
                            ? 'VENTA'
                            : property.rentalType === 'TEMPORAL'
                              ? 'TEMPORAL'
                              : 'ALQUILER'}
                        </div>
                        {/* Badge días mínimos para temporal */}
                        {property.rentalType === 'TEMPORAL' && property.minStayDays && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-black/60 text-amber-300">
                            Min. {property.minStayDays} {property.minStayDays === 1 ? 'día' : 'días'}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition">
                      {property.title}
                    </h3>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                      <IoLocationOutline className="w-4 h-4" />
                      <span className="line-clamp-1">{property.location.address}</span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-slate-300 text-sm mb-4">
                      {property.features.rooms > 0 && (
                        <div className="flex items-center gap-1">
                          <IoBedOutline className="w-4 h-4" />
                          <span>{property.features.rooms}</span>
                        </div>
                      )}
                      {property.features.bathrooms > 0 && (
                        <div className="flex items-center gap-1">
                          <IoWaterOutline className="w-4 h-4" />
                          <span>{property.features.bathrooms}</span>
                        </div>
                      )}
                      {property.features.superficieTotal && (
                        <div className="flex items-center gap-1">
                          <IoExpandOutline className="w-4 h-4" />
                          <span>{property.features.superficieTotal}</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-2xl font-bold ${property.isAvailable ? 'text-emerald-400' : 'text-slate-400 line-through'}`}>
                            {formatPrice(property.price, property.currency)}
                          </span>
                          {property.type === 'alquiler' && property.isAvailable && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {property.rentalType === 'TEMPORAL' ? 'por noche/estadía' : 'por mes'}
                            </p>
                          )}
                        </div>
                        {property.isAvailable && (
                          <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                            Ver más →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <IoChevronBackOutline className="w-4 h-4" />
                  Anterior
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-9 h-9 rounded-lg font-medium transition ${
                            currentPage === p
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return <span key={p} className="text-slate-500">…</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Siguiente
                  <IoChevronForwardOutline className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Sección Loteos */}
      {loteos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center space-x-3 mb-6">
            <IoMapOutline className="w-7 h-7 text-lime-400" />
            <h2 className="text-2xl font-bold text-white">Loteos en venta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loteos.map(loteo => (
              <Link
                key={loteo.id}
                to={`/${subdomain}/loteo/${loteo.id}`}
                className="group bg-white/5 border border-white/10 hover:border-lime-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative h-44 bg-slate-700 overflow-hidden">
                  {loteo.photos?.[0] ? (
                    <img
                      src={loteo.photos[0]}
                      alt={loteo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoMapOutline className="w-14 h-14 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-lime-500 rounded-full text-xs font-bold text-white">
                    LOTEO
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-lime-400 transition">{loteo.name}</h3>
                  {(loteo.city || loteo.province) && (
                    <p className="text-slate-400 text-sm flex items-center gap-1 mb-2">
                      <IoLocationOutline className="w-4 h-4" />
                      {[loteo.city, loteo.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400 text-sm">
                      <IoGridOutline className="w-4 h-4" />
                      {loteo.totalLotes || 0} lotes
                    </span>
                    <span className="text-lime-400 text-sm group-hover:translate-x-1 transition-transform">Ver lotes →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
            <p>© {new Date().getFullYear()} Innoweb. Todos los derechos reservados.</p>
            {tenant.contact.address && (
              <p className="flex items-center gap-2">
                <IoLocationOutline className="w-4 h-4" />
                {tenant.contact.address}
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-slate-500">
            Powered by{' '}
            <a
              href="https://gestprop.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              GestProp
            </a>
            {' · '}
            Desarrollado por{' '}
            <a
              href="https://innoweb.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              innoweb.com.ar
            </a>
          </div>
        </div>
      </footer>

      {/* Popup promocional de loteos */}
      {showLoteoPopup && loteos.length > 0 && (() => {
        const loteo = loteos[0];
        const lotesDisponibles = loteo.lotes?.filter(l => l.status === 'DISPONIBLE').length ?? loteo._count?.lotes ?? 0;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-lime-500/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Botón cerrar */}
              <button
                onClick={closeLoteoPopup}
                className="absolute top-3 right-3 z-10 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 transition"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>

              {/* Imagen */}
              <div className="relative h-44 bg-slate-700 overflow-hidden">
                {loteo.photos?.[0] ? (
                  <img src={loteo.photos[0]} alt={loteo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IoMapOutline className="w-16 h-16 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-lime-500 rounded-full text-xs font-bold text-white tracking-wide">
                  🏡 LOTEO EN VENTA
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-1">{loteo.name}</h3>
                {(loteo.city || loteo.province) && (
                  <p className="flex items-center gap-1 text-slate-400 text-sm mb-3">
                    <IoLocationOutline className="w-4 h-4" />
                    {[loteo.city, loteo.province].filter(Boolean).join(', ')}
                  </p>
                )}

                {loteo.description && (
                  <p className="text-slate-300 text-sm mb-3 line-clamp-2">{loteo.description}</p>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-lime-400 font-medium">
                    <IoGridOutline className="w-4 h-4" />
                    <span>{lotesDisponibles} lotes disponibles</span>
                  </div>
                  {loteo.precioBase && (
                    <div className="text-sm text-emerald-400 font-semibold">
                      Desde {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(loteo.precioBase)}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/${subdomain}/loteo/${loteo.id}`}
                    onClick={closeLoteoPopup}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-lime-500 hover:bg-lime-600 text-white rounded-lg font-medium transition text-sm"
                  >
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Ver lotes disponibles
                  </Link>
                  <button
                    onClick={closeLoteoPopup}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-sm transition"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TenantLanding;
