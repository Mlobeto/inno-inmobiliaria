import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  IoArrowBackOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoBedOutline,
  IoWaterOutline,
  IoCarOutline,
  IoExpandOutline,
  IoLogoWhatsapp,
  IoCallOutline,
  IoMailOutline,
  IoHomeOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';

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
          `${import.meta.env.VITE_API_BASE_URL}/public/${subdomain}/property/${propertyId}`
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
💰 ${formatPrice(property.price, property.currency)}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoHomeOutline className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Propiedad no encontrada</h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <Link
            to={`/landing/${subdomain}`}
            className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const { property, tenant } = data;
  const hasImages = property.images && property.images.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/landing/${subdomain}`}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span>Volver al listado</span>
            </Link>

            {tenant.logo && (
              <img 
                src={tenant.logo} 
                alt={tenant.name} 
                className="h-10 w-10 rounded-full object-cover border-2 border-blue-500/30"
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
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              {hasImages ? (
                <div className="relative aspect-video bg-slate-800">
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
                  <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold text-white ${
                    property.type === 'venta' ? 'bg-purple-500' : 'bg-green-500'
                  }`}>
                    {property.type === 'venta' ? 'EN VENTA' : 'EN ALQUILER'}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-slate-800 flex items-center justify-center">
                  <IoHomeOutline className="w-24 h-24 text-slate-600" />
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
                          ? 'border-blue-500' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-4">{property.title}</h1>
              
              {/* Location */}
              <div className="flex items-start gap-3 mb-6 text-slate-300">
                <IoLocationOutline className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-lg">{property.location.address}</p>
                  {property.location.neighborhood && (
                    <p className="text-slate-400">{property.location.neighborhood}, {property.location.city}</p>
                  )}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.features.bedrooms > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <IoBedOutline className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{property.features.bedrooms}</p>
                    <p className="text-sm text-slate-400">Dormitorios</p>
                  </div>
                )}
                {property.features.bathrooms > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <IoWaterOutline className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{property.features.bathrooms}</p>
                    <p className="text-sm text-slate-400">Baños</p>
                  </div>
                )}
                {property.features.garages > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <IoCarOutline className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{property.features.garages}</p>
                    <p className="text-sm text-slate-400">Cocheras</p>
                  </div>
                )}
                {property.features.surface > 0 && (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <IoExpandOutline className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{property.features.surface}</p>
                    <p className="text-sm text-slate-400">m² totales</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-xl font-bold text-white mb-3">Descripción</h2>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-xl font-bold text-white mb-3">Comodidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de Contacto */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <IoPricetagOutline className="w-5 h-5" />
                  <span className="text-sm font-medium">Precio</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {formatPrice(property.price, property.currency)}
                </p>
                {property.type === 'alquiler' && (
                  <p className="text-sm text-emerald-300">Por mes</p>
                )}
              </div>

              {/* Contact Card */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Contacto</h3>
                
                {tenant.contact.whatsapp && (
                  <a
                    href={`https://wa.me/${tenant.contact.whatsapp.replace(/\D/g, '')}?text=${generateWhatsAppMessage(property, tenant)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium mb-3"
                  >
                    <IoLogoWhatsapp className="w-5 h-5" />
                    Consultar por WhatsApp
                  </a>
                )}

                <div className="space-y-3">
                  {tenant.contact.phone && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <IoCallOutline className="w-5 h-5 text-blue-400" />
                      <a href={`tel:${tenant.contact.phone}`} className="hover:text-white transition">
                        {tenant.contact.phone}
                      </a>
                    </div>
                  )}
                  {tenant.contact.email && (
                    <div className="flex items-center gap-3 text-slate-300">
                      <IoMailOutline className="w-5 h-5 text-blue-400" />
                      <a href={`mailto:${tenant.contact.email}`} className="hover:text-white transition">
                        {tenant.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenant Info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  {tenant.logo && (
                    <img 
                      src={tenant.logo} 
                      alt={tenant.name} 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-white">{tenant.name}</h4>
                    <p className="text-sm text-slate-400">Inmobiliaria</p>
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
