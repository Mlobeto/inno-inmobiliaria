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
import {
  landingShell,
  landingHeader,
  landingCardHover,
  landingSpinner,
  landingBtnPrimary,
  landingBtnWa,
  landingBtnGhost,
  landingErrorBox,
  landingFilterActive,
  landingFilterInactive,
  propertyTypeBadge,
  propertyTypeLabel,
} from './landingTheme';

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
      <div className={`${landingShell} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 ${landingSpinner}`} />
          <p className="text-textSecondary text-lg">Cargando propiedades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${landingShell} flex items-center justify-center p-4`}>
        <div className={landingErrorBox}>
          <div className="w-16 h-16 bg-customRedMuted rounded-full flex items-center justify-center mx-auto mb-4">
            <IoHomeOutline className="w-8 h-8 text-customRed" />
          </div>
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Inmobiliaria no encontrada</h2>
          <p className="text-textSecondary mb-4">{error}</p>
          <button onClick={() => navigate('/')} className={landingBtnPrimary}>
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
    <div className={landingShell}>
      <header className={landingHeader}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {tenant.logo && (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-borderStrong"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-textPrimary">{tenant.name}</h1>
                <p className="text-textMuted text-sm">@{tenant.subdomain}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tenant.contact.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.contact.whatsapp.replace(/\D/g, '')}?text=Hola! Me gustaría consultar por una propiedad`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${landingBtnWa} font-medium`}
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
          <h2 className="text-4xl md:text-5xl font-bold text-textPrimary mb-4">
            Encontrá tu próxima propiedad
          </h2>
          <p className="text-textSecondary text-lg">
            {properties.length} {properties.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? landingFilterActive : landingFilterInactive
            }`}
          >
            Todas ({properties.length})
          </button>
          <button
            onClick={() => handleFilterChange('venta')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'venta' ? landingFilterActive : landingFilterInactive
            }`}
          >
            En Venta ({properties.filter(p => p.type === 'venta').length})
          </button>
          <button
            onClick={() => handleFilterChange('alquiler')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'alquiler' ? landingFilterActive : landingFilterInactive
            }`}
          >
            Alquiler ({properties.filter(p => p.type === 'alquiler' && p.rentalType !== 'TEMPORAL').length})
          </button>
          <button
            onClick={() => handleFilterChange('temporal')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'temporal' ? landingFilterActive : landingFilterInactive
            }`}
          >
            Alquiler Temporal ({properties.filter(p => p.type === 'alquiler' && p.rentalType === 'TEMPORAL').length})
          </button>
        </div>

        {/* Filtros secundarios: ciudad y tipo de propiedad */}
        {(cities.length > 0 || propertyTypes.length > 0) && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 bg-bgSurface border border-borderBase rounded-lg px-3 py-1.5">
              <IoFunnelOutline className="w-4 h-4 text-textMuted" />
              <span className="text-textMuted text-sm">Filtrar por:</span>
            </div>
            {cities.length > 0 && (
              <select
                value={filterCity}
                onChange={e => { setFilterCity(e.target.value); setCurrentPage(1); }}
                className="bg-bgSurface border border-borderBase text-textPrimary rounded-lg px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
              >
                <option value="" className="bg-bgElevated">Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c} value={c} className="bg-bgElevated">{c}</option>
                ))}
              </select>
            )}
            {propertyTypes.length > 0 && (
              <select
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="bg-bgSurface border border-borderBase text-textPrimary rounded-lg px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
              >
                <option value="" className="bg-bgElevated">Todos los tipos</option>
                {propertyTypes.map(t => (
                  <option key={t} value={t} className="bg-bgElevated">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            )}
            {(filterCity || filterType) && (
              <button
                onClick={() => { setFilterCity(''); setFilterType(''); setCurrentPage(1); }}
                className="text-textMuted hover:text-textPrimary text-sm px-3 py-1.5 bg-bgSurface rounded-lg border border-borderBase transition"
              >
                Limpiar filtros ✕
              </button>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <IoHomeOutline className="w-16 h-16 text-textMuted mx-auto mb-4" />
            <p className="text-textSecondary text-lg">No hay propiedades disponibles en este momento</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProperties.map((property) => (
                <Link
                  key={property.id}
                  to={`/${subdomain}/property/${property.id}`}
                  className={`group ${landingCardHover} overflow-hidden hover:scale-[1.02] ${
                    !property.isAvailable ? 'opacity-70 hover:border-borderStrong' : ''
                  }`}
                >
                  <div className="relative h-48 bg-bgElevated overflow-hidden">
                    {property.mainImage ? (
                      <img
                        src={property.mainImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IoHomeOutline className="w-16 h-16 text-textMuted" />
                      </div>
                    )}
                    {!property.isAvailable ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-bgBase/70">
                        <span className="px-5 py-2 rounded-full text-textPrimary font-bold text-lg tracking-widest border-2 bg-customRedMuted border-customRed/40">
                          {property.type === 'venta' ? 'VENDIDO' : 'ALQUILADO'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${propertyTypeBadge(property.type, property.rentalType)}`}>
                          {propertyTypeLabel(property.type, property.rentalType)}
                        </div>
                        {property.rentalType === 'TEMPORAL' && property.minStayDays && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-bgBase/80 text-customYellow border border-customYellow/30">
                            Min. {property.minStayDays} {property.minStayDays === 1 ? 'día' : 'días'}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-textPrimary mb-2 line-clamp-2 group-hover:text-brand-light transition">
                      {property.title}
                    </h3>

                    <div className="flex items-center gap-2 text-textMuted text-sm mb-3">
                      <IoLocationOutline className="w-4 h-4" />
                      <span className="line-clamp-1">{property.location.address}</span>
                    </div>

                    <div className="flex items-center gap-4 text-textSecondary text-sm mb-4">
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

                    <div className="pt-3 border-t border-borderBase">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-2xl font-bold ${property.isAvailable ? 'text-brand-light' : 'text-textMuted line-through'}`}>
                            {formatPrice(property.price, property.currency)}
                          </span>
                          {property.type === 'alquiler' && property.isAvailable && (
                            <p className="text-xs text-textMuted mt-0.5">
                              {property.rentalType === 'TEMPORAL' ? 'por noche/estadía' : 'por mes'}
                            </p>
                          )}
                        </div>
                        {property.isAvailable && (
                          <span className="text-brand-light group-hover:translate-x-1 transition-transform">
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
                  className={`flex items-center gap-2 px-4 py-2 ${landingBtnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
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
                            currentPage === p ? landingFilterActive : landingFilterInactive
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === currentPage - 2 || p === currentPage + 2) {
                      return <span key={p} className="text-textMuted">…</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-4 py-2 ${landingBtnGhost} disabled:opacity-40 disabled:cursor-not-allowed`}
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
            <IoMapOutline className="w-7 h-7 text-brand-light" />
            <h2 className="text-2xl font-bold text-textPrimary">Loteos en venta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loteos.map(loteo => (
              <Link
                key={loteo.id}
                to={`/${subdomain}/loteo/${loteo.id}`}
                className={`group ${landingCardHover} overflow-hidden hover:scale-[1.02]`}
              >
                <div className="relative h-44 bg-bgElevated overflow-hidden">
                  {loteo.photos?.[0] ? (
                    <img
                      src={loteo.photos[0]}
                      alt={loteo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoMapOutline className="w-14 h-14 text-textMuted" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-brand rounded-full text-xs font-bold text-textWhite">
                    LOTEO
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-textPrimary font-bold text-lg mb-1 group-hover:text-brand-light transition">{loteo.name}</h3>
                  {(loteo.city || loteo.province) && (
                    <p className="text-textMuted text-sm flex items-center gap-1 mb-2">
                      <IoLocationOutline className="w-4 h-4" />
                      {[loteo.city, loteo.province].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-textMuted text-sm">
                      <IoGridOutline className="w-4 h-4" />
                      {loteo.totalLotes || 0} lotes
                    </span>
                    <span className="text-brand-light text-sm group-hover:translate-x-1 transition-transform">Ver lotes →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-bgSurface border-t border-borderBase mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-textMuted text-sm">
            <p>© {new Date().getFullYear()} Innoweb. Todos los derechos reservados.</p>
            {tenant.contact.address && (
              <p className="flex items-center gap-2">
                <IoLocationOutline className="w-4 h-4" />
                {tenant.contact.address}
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-borderBase text-center text-xs text-textMuted">
            Powered by{' '}
            <a
              href="https://gestprop.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textSecondary hover:text-textPrimary transition-colors"
            >
              GestProp
            </a>
            {' · '}
            Desarrollado por{' '}
            <a
              href="https://innoweb.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textSecondary hover:text-textPrimary transition-colors"
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
            <div className="relative bg-bgElevated border border-brand/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <button
                onClick={closeLoteoPopup}
                className="absolute top-3 right-3 z-10 p-1.5 bg-bgSurface hover:bg-brand-subtle rounded-full text-textSecondary transition"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>

              <div className="relative h-44 bg-bgSurface overflow-hidden">
                {loteo.photos?.[0] ? (
                  <img src={loteo.photos[0]} alt={loteo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IoMapOutline className="w-16 h-16 text-textMuted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bgBase/90 to-transparent" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-brand rounded-full text-xs font-bold text-textWhite tracking-wide">
                  🏡 LOTEO EN VENTA
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-textPrimary mb-1">{loteo.name}</h3>
                {(loteo.city || loteo.province) && (
                  <p className="flex items-center gap-1 text-textMuted text-sm mb-3">
                    <IoLocationOutline className="w-4 h-4" />
                    {[loteo.city, loteo.province].filter(Boolean).join(', ')}
                  </p>
                )}

                {loteo.description && (
                  <p className="text-textSecondary text-sm mb-3 line-clamp-2">{loteo.description}</p>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-brand-light font-medium">
                    <IoGridOutline className="w-4 h-4" />
                    <span>{lotesDisponibles} lotes disponibles</span>
                  </div>
                  {loteo.precioBase && (
                    <div className="text-sm text-brand-light font-semibold">
                      Desde {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(loteo.precioBase)}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/${subdomain}/loteo/${loteo.id}`}
                    onClick={closeLoteoPopup}
                    className={`flex-1 justify-center ${landingBtnPrimary} py-2.5 text-sm`}
                  >
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Ver lotes disponibles
                  </Link>
                  <button
                    onClick={closeLoteoPopup}
                    className={`px-4 py-2.5 text-sm ${landingBtnGhost}`}
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
