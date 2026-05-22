import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  IoArrowBackOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoBedOutline,
  IoWaterOutline,
  IoExpandOutline,
  IoLogoWhatsapp,
  IoCallOutline,
  IoMailOutline,
  IoHomeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';
import {
  landingShell,
  landingHeader,
  landingCardGlass,
  landingSpinner,
  landingBtnPrimary,
  landingBtnWa,
  landingErrorBox,
  propertyTypeBadge,
} from './landingTheme';

const PropertyDetail = () => {
  const { subdomain, propertyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPropertyDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/public/${subdomain}/property/${propertyId}`
        );
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar propiedad:', err);
        setError(err.response?.data?.message || 'Error al cargar la propiedad');
      } finally {
        setLoading(false);
      }
    };

    if (subdomain && propertyId) {
      fetchPropertyDetail();
    }
  }, [subdomain, propertyId]);

  const formatPrice = (price, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const generateWhatsAppMessage = (property, tenant) => {
    const message = `Hola! Vi esta propiedad en ${tenant.name}:

📍 ${property.location.address}
💰 ${formatPrice(property.price)}
🏠 ${property.title}

Me gustaría tener más información.`;
    
    return encodeURIComponent(message);
  };

  const nextImage = () => {
    if (data?.property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === data.property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (data?.property.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? data.property.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className={`${landingShell} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 ${landingSpinner}`} />
          <p className="text-textSecondary text-lg">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${landingShell} flex items-center justify-center p-4`}>
        <div className={landingErrorBox}>
          <div className="w-16 h-16 bg-customRedMuted rounded-full flex items-center justify-center mx-auto mb-4">
            <IoHomeOutline className="w-8 h-8 text-customRed" />
          </div>
          <h2 className="text-2xl font-bold text-textPrimary mb-2">Propiedad no encontrada</h2>
          <p className="text-textSecondary mb-4">{error}</p>
          <Link to={`/${subdomain}`} className={landingBtnPrimary}>
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const { property, tenant } = data;
  const hasImages = property.images && property.images.length > 0;

  return (
    <div className={landingShell}>
      <header className={landingHeader}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/${subdomain}`}
              className="flex items-center gap-2 text-textSecondary hover:text-brand-light transition"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span>Volver al listado</span>
            </Link>

            {tenant.logo && (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-10 w-10 rounded-full object-cover border-2 border-borderStrong"
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className={`${landingCardGlass} overflow-hidden`}>
              {hasImages ? (
                <div className="relative aspect-video bg-bgElevated">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Imagen ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition text-white"
                      >
                        <IoChevronBackOutline className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition text-white"
                      >
                        <IoChevronForwardOutline className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 rounded-full text-white text-sm">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>

                  {/* Type Badge */}
                  <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold ${propertyTypeBadge(property.type, property.rentalType)}`}>
                    {property.type === 'venta'
                      ? 'EN VENTA'
                      : property.rentalType === 'TEMPORAL'
                        ? 'ALQUILER TEMPORAL'
                        : 'EN ALQUILER'}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-bgElevated flex items-center justify-center">
                  <IoHomeOutline className="w-24 h-24 text-textMuted" />
                </div>
              )}

              {/* Thumbnails */}
              {hasImages && property.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        idx === currentImageIndex
                          ? 'border-brand'
                          : 'border-borderBase hover:border-borderStrong'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className={`${landingCardGlass} p-6`}>
              <h1 className="text-3xl font-bold text-textPrimary mb-4">{property.title}</h1>

              <div className="flex items-start gap-3 mb-6 text-textSecondary">
                <IoLocationOutline className="w-6 h-6 text-brand-light flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg text-textPrimary">{property.location.address}</p>
                  {property.location.neighborhood && (
                    <p className="text-textMuted">{property.location.neighborhood}, {property.location.city}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.features.rooms > 0 && (
                  <div className="bg-bgElevated rounded-lg p-4 text-center">
                    <IoBedOutline className="w-8 h-8 text-brand-light mx-auto mb-2" />
                    <p className="text-2xl font-bold text-textPrimary">{property.features.rooms}</p>
                    <p className="text-sm text-textMuted">Ambientes</p>
                  </div>
                )}
                {property.features.bathrooms > 0 && (
                  <div className="bg-bgElevated rounded-lg p-4 text-center">
                    <IoWaterOutline className="w-8 h-8 text-brand-light mx-auto mb-2" />
                    <p className="text-2xl font-bold text-textPrimary">{property.features.bathrooms}</p>
                    <p className="text-sm text-textMuted">Baños</p>
                  </div>
                )}
                {property.features.superficieCubierta && (
                  <div className="bg-bgElevated rounded-lg p-4 text-center">
                    <IoExpandOutline className="w-8 h-8 text-brand-light mx-auto mb-2" />
                    <p className="text-xl font-bold text-textPrimary">{property.features.superficieCubierta}</p>
                    <p className="text-sm text-textMuted">Sup. Cubierta</p>
                  </div>
                )}
                {property.features.superficieTotal && (
                  <div className="bg-bgElevated rounded-lg p-4 text-center">
                    <IoExpandOutline className="w-8 h-8 text-brand-light mx-auto mb-2" />
                    <p className="text-xl font-bold text-textPrimary">{property.features.superficieTotal}</p>
                    <p className="text-sm text-textMuted">Sup. Total</p>
                  </div>
                )}
              </div>

              {property.rentalType === 'TEMPORAL' && property.minStayDays && (
                <div className="mb-6 p-4 bg-customYellowMuted border border-customYellow/30 rounded-lg">
                  <p className="text-customYellow text-sm font-medium">
                    ⏱ Estadía mínima: {property.minStayDays} {property.minStayDays === 1 ? 'día' : 'días'}
                  </p>
                </div>
              )}

              {property.description && (
                <div className="pt-6 border-t border-borderBase">
                  <h2 className="text-xl font-bold text-textPrimary mb-3">Descripción</h2>
                  <p className="text-textSecondary leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {property.highlights && (
                <div className="pt-6 border-t border-borderBase">
                  <h2 className="text-xl font-bold text-textPrimary mb-3">Puntos Destacados</h2>
                  <p className="text-textSecondary leading-relaxed">{property.highlights}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de Contacto */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card */}
              <div className={`${landingCardGlass} p-6 border-brand/30 bg-brand-subtle/20`}>
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <IoPricetagOutline className="w-5 h-5" />
                  <span className="text-sm font-medium">Precio</span>
                </div>
                <p className="text-4xl font-bold text-textPrimary mb-1">
                  {formatPrice(property.price)}
                </p>
                {property.type === 'alquiler' && (
                  <p className="text-sm text-textSecondary">
                    {property.rentalType === 'TEMPORAL' ? 'por noche/estadía' : 'por mes'}
                  </p>
                )}
              </div>

              <div className={`${landingCardGlass} p-6`}>
                <h3 className="text-lg font-bold text-textPrimary mb-4">Contacto</h3>

                {tenant.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${tenant.contact.whatsapp.replace(/\D/g, '')}?text=${generateWhatsAppMessage(property, tenant)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${landingBtnWa} justify-center w-full mb-3`}
                  >
                    <IoLogoWhatsapp className="w-5 h-5" />
                    Consultar por WhatsApp
                  </a>
                )}

                <div className="space-y-3">
                  {tenant.contact.phone && (
                    <div className="flex items-center gap-3 text-textSecondary">
                      <IoCallOutline className="w-5 h-5 text-brand-light" />
                      <a href={`tel:${tenant.contact.phone}`} className="hover:text-textPrimary transition">
                        {tenant.contact.phone}
                      </a>
                    </div>
                  )}
                  {tenant.contact.email && (
                    <div className="flex items-center gap-3 text-textSecondary">
                      <IoMailOutline className="w-5 h-5 text-brand-light" />
                      <a href={`mailto:${tenant.contact.email}`} className="hover:text-textPrimary transition">
                        {tenant.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${landingCardGlass} p-6`}>
                <div className="flex items-center gap-3 mb-3">
                  {tenant.logo && (
                    <img
                      src={tenant.logo}
                      alt={tenant.name}
                      className="h-12 w-12 rounded-full object-cover border border-borderBase"
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-textPrimary">{tenant.name}</h4>
                    <p className="text-sm text-textMuted">Inmobiliaria</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
