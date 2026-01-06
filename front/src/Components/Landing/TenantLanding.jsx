import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  IoLocationOutline, 
  IoPricetagOutline, 
  IoHomeOutline,
  IoBedOutline,
  IoWaterOutline,
  IoCarOutline,
  IoExpandOutline,
  IoArrowBackOutline,
  IoLogoWhatsapp
} from 'react-icons/io5';

const TenantLanding = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, venta, alquiler

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/public/${subdomain}`
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

  const filteredProperties = data?.properties.filter(prop => {
    if (filter === 'all') return true;
    return prop.type === filter;
  }) || [];

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

  const { tenant, properties, pagination } = data;

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

            {/* Contacto */}
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

        {/* Filtros */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('venta')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'venta'
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            En Venta
          </button>
          <button
            onClick={() => setFilter('alquiler')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === 'alquiler'
                ? 'bg-green-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            En Alquiler
          </button>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16">
            <IoHomeOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No hay propiedades disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Link
                key={property.id}
                to={`/landing/${subdomain}/property/${property.id}`}
                className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
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
                  {/* Badge de tipo */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white ${
                    property.type === 'venta' ? 'bg-purple-500' : 'bg-green-500'
                  }`}>
                    {property.type === 'venta' ? 'VENTA' : 'ALQUILER'}
                  </div>
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
                    {property.features.bedrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <IoBedOutline className="w-4 h-4" />
                        <span>{property.features.bedrooms}</span>
                      </div>
                    )}
                    {property.features.bathrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <IoWaterOutline className="w-4 h-4" />
                        <span>{property.features.bathrooms}</span>
                      </div>
                    )}
                    {property.features.surface > 0 && (
                      <div className="flex items-center gap-1">
                        <IoExpandOutline className="w-4 h-4" />
                        <span>{property.features.surface}m²</span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatPrice(property.price, property.currency)}
                      </span>
                      <span className="text-blue-400 group-hover:translate-x-1 transition-transform">
                        Ver más →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/5 border-t border-white/10 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
            <p>© 2026 {tenant.name}. Todos los derechos reservados.</p>
            {tenant.contact.address && (
              <p className="flex items-center gap-2">
                <IoLocationOutline className="w-4 h-4" />
                {tenant.contact.address}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TenantLanding;
