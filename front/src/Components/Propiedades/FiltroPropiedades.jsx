import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllProperties } from "../../redux/Actions/actions";
import { useNavigate } from "react-router-dom";
import { IoSearchOutline, IoFilterOutline, IoGridOutline, IoLocationOutline, IoPricetagOutline, IoHomeOutline, IoDocumentTextOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoArrowBackOutline } from "react-icons/io5";

const Filtro = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Selectores optimizados
  const allProperties = useSelector((state) => state.allProperties);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: "",
    type: "",
    typeProperty: "",
    priceMin: "",
    priceMax: "",
    escritura: "",
    isAvailable: "", // Puede ser: "" (todos), "true" o "false"
  });

  useEffect(() => {
    dispatch(getAllProperties());
  }, [dispatch]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      city: "",
      type: "",
      typeProperty: "",
      priceMin: "",
      priceMax: "",
      escritura: "",
      isAvailable: "",
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  let filteredProperties = allProperties.filter((property) => {
    const {
      city,
      type,
      typeProperty,
      priceMin,
      priceMax,
      escritura,
      isAvailable,
    } = filters;
    let matches = true;

    if (city) {
      matches = matches && property.city.toLowerCase().includes(city.toLowerCase());
    }
    if (type) {
      matches = matches && property.type === type;
    }
    if (typeProperty) {
      matches = matches && property.typeProperty === typeProperty;
    }
    if (priceMin) {
      matches = matches && property.price >= parseFloat(priceMin);
    }
    if (priceMax) {
      matches = matches && property.price <= parseFloat(priceMax);
    }
    if (escritura) {
      matches = matches && property.escritura && property.escritura.toLowerCase().includes(escritura.toLowerCase());
    }
    if (isAvailable) {
      matches = matches && (property.isAvailable === (isAvailable === "true"));
    }
    return matches;
  });

  // Ordenamos para que primero aparezcan las propiedades disponibles
  filteredProperties = filteredProperties.sort((a, b) => {
    // Convertir booleanos a números para que true (1) aparezca antes que false (0)
    return Number(b.isAvailable) - Number(a.isAvailable);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)} 
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <button onClick={() => navigate('/panelPropiedades')} className="hover:text-white transition-colors">
                Propiedades
              </button>
              <span>/</span>
              <span className="text-white font-medium">Catálogo de Propiedades</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Header moderno mejorado */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoGridOutline className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Catálogo de Propiedades
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Explora nuestro portafolio completo de propiedades disponibles
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Panel de filtros moderno */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            {/* Header del filtro */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <IoFilterOutline className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Filtros de Búsqueda</h2>
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {getActiveFiltersCount()} activos
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200 text-sm"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200 text-sm lg:hidden"
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'} filtros
                </button>
              </div>
            </div>

            {/* Grid de filtros */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${showFilters || 'max-lg:hidden'}`}>
              {/* Ciudad */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoLocationOutline className="w-4 h-4 mr-2 text-green-400" />
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Buscar por ciudad..."
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Tipo de operación */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-purple-400" />
                  Tipo de Operación
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">Todos los tipos</option>
                  <option value="venta" className="bg-slate-800">Venta</option>
                  <option value="alquiler" className="bg-slate-800">Alquiler</option>
                </select>
              </div>

              {/* Tipo de propiedad */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoHomeOutline className="w-4 h-4 mr-2 text-orange-400" />
                  Tipo de Propiedad
                </label>
                <select
                  name="typeProperty"
                  value={filters.typeProperty}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">Todas las propiedades</option>
                  <option value="casa" className="bg-slate-800">Casa</option>
                  <option value="departamento" className="bg-slate-800">Departamento</option>
                  <option value="terreno" className="bg-slate-800">Terreno</option>
                </select>
              </div>

              {/* Disponibilidad */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoCheckmarkCircleOutline className="w-4 h-4 mr-2 text-emerald-400" />
                  Disponibilidad
                </label>
                <select
                  name="isAvailable"
                  value={filters.isAvailable}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">Todas</option>
                  <option value="true" className="bg-slate-800">Disponible</option>
                  <option value="false" className="bg-slate-800">No Disponible</option>
                </select>
              </div>

              {/* Precio mínimo */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-green-400" />
                  Precio Mínimo
                </label>
                <input
                  type="number"
                  name="priceMin"
                  placeholder="Desde $..."
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Precio máximo */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-red-400" />
                  Precio Máximo
                </label>
                <input
                  type="number"
                  name="priceMax"
                  placeholder="Hasta $..."
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Escritura */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center text-sm font-medium text-slate-300">
                  <IoDocumentTextOutline className="w-4 h-4 mr-2 text-yellow-400" />
                  Estado de Escritura
                </label>
                <select
                  name="escritura"
                  value={filters.escritura}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">Todos los estados</option>
                  <option value="prescripcion en tramite" className="bg-slate-800">Prescripción en trámite</option>
                  <option value="escritura" className="bg-slate-800">Escritura</option>
                  <option value="prescripcion adjudicada" className="bg-slate-800">Prescripción adjudicada</option>
                  <option value="posesion" className="bg-slate-800">Posesión</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados modernos */}
        <div className="space-y-6">
          {/* Header de resultados */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">
              Propiedades encontradas: {filteredProperties.length}
            </h3>
            <div className="text-sm text-slate-400">
              {getActiveFiltersCount() > 0 ? 'Filtros aplicados' : 'Sin filtros'}
            </div>
          </div>

          {/* Estados de carga y error */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-slate-400">Cargando propiedades...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <IoCloseCircleOutline className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-lg font-medium">Error al cargar las propiedades</p>
              <p className="text-red-300 text-sm mt-2">{error}</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-12 text-center">
              <IoSearchOutline className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <p className="text-amber-400 text-xl font-medium mb-2">No se encontraron propiedades</p>
              <p className="text-slate-400">Intenta ajustar los filtros para encontrar más resultados</p>
            </div>
          ) : (
            /* Grid de propiedades */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.propertyId}
                  className={`group relative bg-white/5 backdrop-blur-xl rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                    property.isAvailable 
                      ? "border-emerald-500/30 hover:border-emerald-500/50" 
                      : "border-red-500/30 hover:border-red-500/50"
                  }`}
                >
                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 right-4 z-10">
                    {property.isAvailable ? (
                      <div className="flex items-center px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                        <IoCheckmarkCircleOutline className="w-4 h-4 text-emerald-400 mr-1" />
                        <span className="text-emerald-400 text-xs font-medium">Disponible</span>
                      </div>
                    ) : (
                      <div className="flex items-center px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                        <IoCloseCircleOutline className="w-4 h-4 text-red-400 mr-1" />
                        <span className="text-red-400 text-xs font-medium">No disponible</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Encabezado */}
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                        {property.address}
                      </h4>
                      <div className="flex items-center text-slate-300">
                        <IoLocationOutline className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.city}, {property.neighborhood}</span>
                      </div>
                    </div>

                    {/* Información principal */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Precio</span>
                        <span className="text-green-400 font-bold text-lg">
                          ${property.price?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Operación</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          property.type === 'venta' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Tipo</span>
                        <span className="text-white font-medium">
                          {property.typeProperty?.charAt(0).toUpperCase() + property.typeProperty?.slice(1) || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Escritura</span>
                        <span className="text-yellow-400 text-sm">
                          {property.escritura || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filtro;