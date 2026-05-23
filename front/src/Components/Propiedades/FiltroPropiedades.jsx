import { useState } from "react";
import { useGetAllPropertiesQuery } from "@shared/redux";
import { useNavigate } from "react-router-dom";
import { IoSearchOutline, IoFilterOutline, IoGridOutline, IoLocationOutline, IoPricetagOutline, IoHomeOutline, IoDocumentTextOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoArrowBackOutline } from "react-icons/io5";
import {
  panelShell,
  pageHeaderBar,
  breadcrumbNav,
  backLink,
  btnGhost,
  formCard,
  filterInput,
  filterLabel,
  propertyCard,
  spinner,
  alertError,
  emptyState,
} from './propiedadesTheme';

const Filtro = () => {
  const navigate = useNavigate();
  
  // RTK Query hook
  const { data: allProperties = [], isLoading: loading, error } = useGetAllPropertiesQuery();
  
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
    <div className={panelShell}>
      <div className={pageHeaderBar}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className={backLink}>
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <nav className={breadcrumbNav}>
              <button onClick={() => navigate('/panel')} className="hover:text-textPrimary transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <button onClick={() => navigate('/panelPropiedades')} className="hover:text-textPrimary transition-colors">
                Propiedades
              </button>
              <span>/</span>
              <span className="text-textPrimary font-medium">Catálogo de Propiedades</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="border-b border-borderBase bg-bgSurface/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoGridOutline className="w-8 h-8 text-brand-light mr-3" />
              <h1 className="text-3xl font-bold text-textPrimary">Catálogo de Propiedades</h1>
            </div>
            <p className="text-textSecondary text-lg max-w-2xl mx-auto">
              Explora nuestro portafolio completo de propiedades disponibles
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Panel de filtros moderno */}
        <div className="mb-8">
          <div className={formCard}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <IoFilterOutline className="w-6 h-6 text-brand-light mr-3" />
                <h2 className="text-xl font-semibold text-textPrimary">Filtros de Búsqueda</h2>
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-3 px-3 py-1 bg-brand-muted text-brand-light rounded-full text-sm border border-borderStrong">
                    {getActiveFiltersCount()} activos
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={clearFilters} className="px-4 py-2 bg-customRedMuted hover:bg-customRed/20 text-customRed rounded-lg transition-colors text-sm border border-customRed/30">
                  Limpiar filtros
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`${btnGhost} text-sm lg:hidden`}
                >
                  {showFilters ? 'Ocultar' : 'Mostrar'} filtros
                </button>
              </div>
            </div>

            {/* Grid de filtros */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ${showFilters || 'max-lg:hidden'}`}>
              {/* Ciudad */}
              <div className="space-y-2">
                <label className={`${filterLabel}`}>
                  <IoLocationOutline className="w-4 h-4 mr-2 text-brand-light" />
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="Buscar por ciudad..."
                  value={filters.city}
                  onChange={handleFilterChange}
                  className={filterInput}
                />
              </div>

              {/* Tipo de operación */}
              <div className="space-y-2">
                <label className={filterLabel}>
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-brand-light" />
                  Tipo de Operación
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className={filterInput}
                >
                  <option value="" className="bg-bgElevated">Todos los tipos</option>
                  <option value="venta" className="bg-bgElevated">Venta</option>
                  <option value="alquiler" className="bg-bgElevated">Alquiler</option>
                </select>
              </div>

              {/* Tipo de propiedad */}
              <div className="space-y-2">
                <label className={filterLabel}>
                  <IoHomeOutline className="w-4 h-4 mr-2 text-brand-light" />
                  Tipo de Propiedad
                </label>
                <select
                  name="typeProperty"
                  value={filters.typeProperty}
                  onChange={handleFilterChange}
                  className={filterInput}
                >
                  <option value="" className="bg-bgElevated">Todas las propiedades</option>
                  <option value="casa" className="bg-bgElevated">Casa</option>
                  <option value="departamento" className="bg-bgElevated">Departamento</option>
                  <option value="terreno" className="bg-bgElevated">Terreno</option>
                </select>
              </div>

              {/* Disponibilidad */}
              <div className="space-y-2">
                <label className={filterLabel}>
                  <IoCheckmarkCircleOutline className="w-4 h-4 mr-2 text-brand-light" />
                  Disponibilidad
                </label>
                <select
                  name="isAvailable"
                  value={filters.isAvailable}
                  onChange={handleFilterChange}
                  className={filterInput}
                >
                  <option value="" className="bg-bgElevated">Todas</option>
                  <option value="true" className="bg-bgElevated">Disponible</option>
                  <option value="false" className="bg-bgElevated">No Disponible</option>
                </select>
              </div>

              {/* Precio mínimo */}
              <div className="space-y-2">
                <label className={filterLabel}>
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-brand-light" />
                  Precio Mínimo
                </label>
                <input
                  type="number"
                  name="priceMin"
                  placeholder="Desde $..."
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                  className={filterInput}
                />
              </div>

              {/* Precio máximo */}
              <div className="space-y-2">
                <label className={filterLabel}>
                  <IoPricetagOutline className="w-4 h-4 mr-2 text-customRed" />
                  Precio Máximo
                </label>
                <input
                  type="number"
                  name="priceMax"
                  placeholder="Hasta $..."
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                  className={filterInput}
                />
              </div>

              {/* Escritura */}
              <div className="space-y-2 md:col-span-2">
                <label className={filterLabel}>
                  <IoDocumentTextOutline className="w-4 h-4 mr-2 text-customYellow" />
                  Estado de Escritura
                </label>
                <select
                  name="escritura"
                  value={filters.escritura}
                  onChange={handleFilterChange}
                  className={filterInput}
                >
                  <option value="" className="bg-bgElevated">Todos los estados</option>
                  <option value="prescripcion en tramite" className="bg-bgElevated">Prescripción en trámite</option>
                  <option value="escritura" className="bg-bgElevated">Escritura</option>
                  <option value="prescripcion adjudicada" className="bg-bgElevated">Prescripción adjudicada</option>
                  <option value="posesion" className="bg-bgElevated">Posesión</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados modernos */}
        <div className="space-y-6">
          {/* Header de resultados */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-textPrimary">
              Propiedades encontradas: {filteredProperties.length}
            </h3>
            <div className="text-sm text-textMuted">
              {getActiveFiltersCount() > 0 ? 'Filtros aplicados' : 'Sin filtros'}
            </div>
          </div>

          {/* Estados de carga y error */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-12 h-12 ${spinner}`} />
                <p className="text-textMuted">Cargando propiedades...</p>
              </div>
            </div>
          ) : error ? (
            <div className={`${alertError} text-center`}>
              <IoCloseCircleOutline className="w-12 h-12 mx-auto mb-3" />
              <p className="text-lg font-medium">Error al cargar las propiedades</p>
              <p className="text-sm mt-2 opacity-90">{error?.data?.message || error?.error || 'Error desconocido'}</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className={`${emptyState} border border-borderBase rounded-xl p-12`}>
              <IoSearchOutline className="w-16 h-16 text-customYellow mx-auto mb-4" />
              <p className="text-customYellow text-xl font-medium mb-2">No se encontraron propiedades</p>
              <p className="text-textSecondary">Intenta ajustar los filtros para encontrar más resultados</p>
            </div>
          ) : (
            /* Grid de propiedades */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <div
                  key={property.propertyId}
                  className={`${propertyCard} ${
                    property.isAvailable
                      ? 'border-brand/30 hover:border-brand/50'
                      : 'border-customRed/30 hover:border-customRed/50'
                  }`}
                >
                  {/* Badge de disponibilidad */}
                  <div className="absolute top-4 right-4 z-10">
                    {property.isAvailable ? (
                      <div className="flex items-center px-3 py-1 bg-brand-muted border border-borderStrong rounded-full">
                        <IoCheckmarkCircleOutline className="w-4 h-4 text-brand-light mr-1" />
                        <span className="text-brand-light text-xs font-medium">Disponible</span>
                      </div>
                    ) : (
                      <div className="flex items-center px-3 py-1 bg-customRedMuted border border-customRed/30 rounded-full">
                        <IoCloseCircleOutline className="w-4 h-4 text-customRed mr-1" />
                        <span className="text-customRed text-xs font-medium">No disponible</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Encabezado */}
                    <div className="mb-4">
                      <h4 className="text-xl font-bold text-textPrimary mb-2 group-hover:text-brand-light transition-colors">
                        {property.address}
                      </h4>
                      <div className="flex items-center text-textSecondary">
                        <IoLocationOutline className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.city}, {property.neighborhood}</span>
                      </div>
                    </div>

                    {/* Información principal */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-textMuted text-sm">Precio</span>
                        <span className="text-brand-light font-bold text-lg">
                          ${property.price?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-textMuted text-sm">Operación</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          property.type === 'venta'
                            ? 'bg-brand-muted text-brand-light border border-borderStrong'
                            : 'bg-customYellowMuted text-customYellow border border-customYellow/30'
                        }`}>
                          {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-textMuted text-sm">Tipo</span>
                        <span className="text-textPrimary font-medium">
                          {property.typeProperty?.charAt(0).toUpperCase() + property.typeProperty?.slice(1) || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-textMuted text-sm">Escritura</span>
                        <span className="text-customYellow text-sm">
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