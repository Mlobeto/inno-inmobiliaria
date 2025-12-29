import  { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { getAllProperties, updateProperty, deleteProperty } from "../../redux/Actions/actions";
import PropiedadesPDF from "../PdfTemplates/PropiedadesPdf";
import CreateLeaseForm from "../Contratos/CreateLeaseForm";
import CompraVenta from "../Contratos/CompraVenta";
import WhatsAppButton from './WhatsAppButton';
import ImageManager from './ImageManager';
import { 
  IoArrowBackOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoSearchOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoPeopleOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoSaveOutline,
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoFilterOutline,
  IoKeyOutline,
  IoAddOutline
} from 'react-icons/io5';

const Listado = ({ mode = "default", onSelectProperty }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Selectores optimizados
  const allProperties = useSelector((state) => state.allProperties);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);

  // Función para formatear precio como moneda
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const propertiesPerPage = 5;

  // Filtrar solo propiedades disponibles para alquiler/venta según el modo
  // Función optimizada para obtener propiedades disponibles
  const availableProperties = useMemo(() => {
    if (mode === "lease") {
      return allProperties.filter(property => property.type === "alquiler" && property.isAvailable === true);
    }
    if (mode === "sale") {
      return allProperties.filter(property => property.type === "venta" && property.isAvailable === true);
    }
    return allProperties;
  }, [allProperties, mode]);

  useEffect(() => {
    // Solo cargar propiedades la primera vez que se monta el componente
    dispatch(getAllProperties());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar propiedades por dirección y disponibilidad (optimizado)
  const filteredProperties = useMemo(() => 
    availableProperties.filter((property) =>
      property.address.toLowerCase().includes(searchTerm.toLowerCase())
    ), [availableProperties, searchTerm]
  );

  // Paginación optimizada
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    const paginatedProperties = filteredProperties.slice(
      (currentPage - 1) * propertiesPerPage,
      currentPage * propertiesPerPage
    );
    return { totalPages, paginatedProperties };
  }, [filteredProperties, currentPage, propertiesPerPage]);

  const { totalPages, paginatedProperties } = paginationData;

  const handlePageChange = (direction) => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Validar campos
  const validateField = (field, value) => {
    let error = "";
    if (field === "address" && (!value || value.length < 5)) {
      error = "La dirección debe tener al menos 5 caracteres.";
    }
    if (field === "neighborhood" && (!value || value.length < 3)) {
      error = "El barrio debe tener al menos 3 caracteres.";
    }
    if (field === "price" && (!value || isNaN(Number(value)) || Number(value) <= 0)) {
      error = "El precio debe ser un número mayor a 0.";
    }
    return error;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleEdit = (property) => {
    setEditingId(property.propertyId);
    setFormData({ ...property });
  };

  const handleSave = () => {
    const validationErrors = Object.keys(formData).reduce((acc, field) => {
      const error = validateField(field, formData[field]);
      if (error) acc[field] = error;
      return acc;
    }, {});
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Corregir: pasar propertyId y propertyData como parámetros separados
    const { propertyId, ...propertyData } = formData;
    dispatch(updateProperty(propertyId, propertyData)).then(() => {
      // Recargar propiedades después de actualizar
      dispatch(getAllProperties());
    });
    setEditingId(null);
  };

  const handleDelete = (propertyId) => {
    dispatch(deleteProperty(propertyId)).then(() => {
      // Recargar propiedades después de eliminar
      dispatch(getAllProperties());
    });
  };

  // Solo mostrar loading si no hay propiedades cargadas aún
  if (loading && (!allProperties || allProperties.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando propiedades...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

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
              <span className="text-white font-medium">
                {mode === "lease" ? "Propiedades para Alquilar" : 
                 mode === "sale" ? "Propiedades para Vender" : 
                 "Listado de Propiedades"}
              </span>
            </nav>
          </div>
          
          {/* Botón contextual según el modo */}
          {mode !== "default" && (
            <button
              onClick={() => {
                if (mode === "lease") setShowCreateModal(true);
                if (mode === "sale") setShowSaleModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <IoAddOutline className="w-5 h-5" />
              <span className="hidden sm:inline">
                {mode === "lease" ? "Crear Contrato" : "Nueva Compraventa"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-500/20 rounded-full">
              <IoBusinessOutline className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Listado de Propiedades
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Gestiona todas las propiedades registradas en el sistema
          </p>
        </div>

        {/* Search and Filters Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por dirección..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-300">
                <IoFilterOutline className="w-5 h-5" />
                <span className="text-sm">
                  {filteredProperties.length} de {allProperties.length} propiedades
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedProperties.map((property) => (
            <div key={property.propertyId} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
              {/* Property Header */}
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                    <IoBusinessOutline className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-semibold truncate">Propiedad #{property.propertyId}</h3>
                    <p className="text-slate-400 text-sm truncate">{property.type || 'Sin especificar'}</p>
                  </div>
                </div>
                
                {/* Action Buttons - Ahora con wrap para múltiples filas */}
                <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                  {editingId === property.propertyId ? (
                    <>
                      <button 
                        onClick={handleSave}
                        className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors duration-200"
                        title="Guardar"
                      >
                        <IoSaveOutline className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                        title="Cancelar"
                      >
                        <IoCloseOutline className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEdit(property)}
                        className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors duration-200"
                        title="Editar"
                      >
                        <IoPencilOutline className="w-4 h-4" />
                      </button>
                      <WhatsAppButton 
                        propertyId={property.propertyId}
                        property={property}
                      />
                      <ImageManager property={property} />
                      <button 
                        onClick={() => handleDelete(property.propertyId)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                        title="Eliminar"
                      >
                        <IoTrashOutline className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start space-x-3">
                  <IoLocationOutline className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-slate-400 text-sm">Dirección</label>
                    {editingId === property.propertyId ? (
                      <div>
                        <input
                          className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                          value={formData.address || ""}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Ingrese la dirección"
                        />
                        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                      </div>
                    ) : (
                      <p className="text-white font-medium mt-1">{property.address}</p>
                    )}
                  </div>
                </div>

                {/* Neighborhood */}
                <div className="flex items-start space-x-3">
                  <IoLocationOutline className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-slate-400 text-sm">Barrio</label>
                    {editingId === property.propertyId ? (
                      <div>
                        <input
                          className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                          value={formData.neighborhood || ""}
                          onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                          placeholder="Ingrese el barrio"
                        />
                        {errors.neighborhood && <p className="text-red-400 text-xs mt-1">{errors.neighborhood}</p>}
                      </div>
                    ) : (
                      <p className="text-white font-medium mt-1">{property.neighborhood}</p>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start space-x-3">
                  <IoPricetagOutline className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-slate-400 text-sm">Precio</label>
                    {editingId === property.propertyId ? (
                      <div>
                        <input
                          className="w-full mt-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                          value={formData.price || ""}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="Ingrese el precio"
                          type="number"
                        />
                        {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
                      </div>
                    ) : (
                      <p className="text-emerald-400 font-bold text-lg mt-1">{formatCurrency(property.price)}</p>
                    )}
                  </div>
                </div>

                {/* Clients */}
                <div className="flex items-start space-x-3">
                  <IoPeopleOutline className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-slate-400 text-sm">Clientes Asignados</label>
                    <div className="mt-1">
                      {property.Clients?.length > 0 ? (
                        <div className="space-y-1">
                          {property.Clients.map((client) => (
                            <div key={client.idClient} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                              <span className="text-white text-sm">{client.name}</span>
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                {client.ClientProperty?.role || 'Sin rol'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm italic">Sin clientes asignados</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón contextual y PDF */}
              {editingId !== property.propertyId && (
                <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                  {/* Botón contextual según el modo */}
                  {mode !== "default" && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          console.log("=== Click en botón de selección ===");
                          console.log("onSelectProperty definido:", !!onSelectProperty);
                          console.log("Property:", property);
                          
                          // Si hay callback de selección, usarlo (cuando viene de CreateLeaseForm)
                          if (onSelectProperty) {
                            console.log("Llamando a onSelectProperty...");
                            onSelectProperty(property);
                          } else {
                            console.log("Abriendo modal interno...");
                            // Si no, usar el modal interno
                            setSelectedProperty(property);
                            if (mode === "lease") setShowCreateModal(true);
                            if (mode === "sale") setShowSaleModal(true);
                          }
                        }}
                        className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] ${
                          mode === "lease" 
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                            : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                        }`}
                      >
                        {mode === "lease" ? (
                          <>
                            <IoKeyOutline className="w-5 h-5 mr-2" />
                            {onSelectProperty ? "Seleccionar Propiedad" : "Crear Contrato de Alquiler"}
                          </>
                        ) : (
                          <>
                            <IoBusinessOutline className="w-5 h-5 mr-2" />
                            {onSelectProperty ? "Seleccionar Propiedad" : "Gestionar Compraventa"}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* PDF Button */}
                  <div className="flex justify-center">
                    <PropiedadesPDF property={property} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-slate-300 text-sm">
                Mostrando {((currentPage - 1) * propertiesPerPage) + 1} a {Math.min(currentPage * propertiesPerPage, filteredProperties.length)} de {filteredProperties.length} propiedades
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange("prev")}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <IoChevronBackOutline className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-blue-500 text-white border border-blue-400'
                              : 'bg-white/10 text-slate-300 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange("next")}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <IoChevronForwardOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-12 border border-white/10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-slate-500/20 rounded-full">
                <IoBusinessOutline className="w-12 h-12 text-slate-400" />
              </div>
            </div>
            <h3 className="text-white font-medium mb-2">No se encontraron propiedades</h3>
            <p className="text-slate-400 text-sm">
              {searchTerm ? 
                `No hay propiedades que coincidan con "${searchTerm}"` : 
                'No hay propiedades registradas en el sistema'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal para crear contrato de alquiler - solo si no hay callback externo */}
      {!onSelectProperty && showCreateModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <IoKeyOutline className="w-6 h-6 mr-2 text-blue-400" />
                Crear Contrato - {selectedProperty.address}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedProperty(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <CreateLeaseForm 
                isModal={true}
                preselectedProperty={selectedProperty}
                onClose={() => {
                  setShowCreateModal(false);
                  setSelectedProperty(null);
                  dispatch(getAllProperties()); // Refrescar la lista
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para compraventa - solo si no hay callback externo */}
      {!onSelectProperty && showSaleModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <IoBusinessOutline className="w-6 h-6 mr-2 text-purple-400" />
                Compraventa - {selectedProperty.address}
              </h3>
              <button
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedProperty(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <CompraVenta 
                isModal={true}
                preselectedProperty={selectedProperty}
                onClose={() => {
                  setShowSaleModal(false);
                  setSelectedProperty(null);
                  dispatch(getAllProperties()); // Refrescar la lista
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Listado.propTypes = {
  mode: PropTypes.oneOf(['default', 'lease', 'sale']),
  onSelectProperty: PropTypes.func,
};

export default Listado;