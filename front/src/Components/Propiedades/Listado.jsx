import  { useState, useMemo, useEffect } from 'react';
import { useGetAllPropertiesQuery, useUpdatePropertyMutation, useDeletePropertyMutation, useTogglePublishLandingMutation } from '@shared/redux';
import { useNavigate } from "react-router-dom";
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import axios from 'axios';
import PropiedadesPDF from "../PdfTemplates/PropiedadesPdf";
import CreateLeaseForm from "../Contratos/CreateLeaseForm";
import CompraVenta from "../Contratos/CompraVenta";
import WhatsAppButton from './WhatsAppButton';
import RequisitoButton from './RequisitoButton';
import ImageManager from './ImageManager';
import EditPropertyModal from './EditPropertyModal';
import AutorizacionVentaPdf from '../PdfTemplates/AutorizacionVentaPdf';
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
 
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoFilterOutline,
  IoKeyOutline,
  IoAddOutline,
  IoGlobeOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoLogoBuffer
} from 'react-icons/io5';

const Listado = ({ mode = "default", onSelectProperty }) => {
  const navigate = useNavigate();
  
  // RTK Query hooks
  const { data: allProperties = [], isLoading, error } = useGetAllPropertiesQuery();
  const [updateProperty] = useUpdatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();
  const [togglePublishLanding] = useTogglePublishLandingMutation();
  
  // Estado para tenant info
  const [tenantHasLanding, setTenantHasLanding] = useState(false);
  
  // Estado para MercadoLibre
  const [mlConnection, setMlConnection] = useState({ connected: false, loading: true });
  const [mlListings, setMlListings] = useState({});
  const [publishingML, setPublishingML] = useState({});

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

  // eslint-disable-next-line no-unused-vars
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);
  const propertiesPerPage = 5;

  // Cargar info del tenant al montar
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/tenant`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tenant = response.data?.data || response.data;
        setTenantHasLanding(tenant?.features?.landingPage === true);
      } catch (error) {
        console.error('Error al obtener tenant:', error);
        setTenantHasLanding(false);
      }
    };
    fetchTenantInfo();
  }, []);

  // Cargar estado de MercadoLibre
  useEffect(() => {
    const checkMLConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/mercadolibre/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMlConnection({ connected: response.data.connected, loading: false });
        
        // Si está conectado, cargar listings
        if (response.data.connected) {
          const listingsResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/mercadolibre/listings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const listingsMap = {};
          listingsResponse.data.listings?.forEach(listing => {
            listingsMap[listing.propertyId] = listing;
          });
          setMlListings(listingsMap);
        }
      } catch (error) {
        console.error('Error al verificar ML:', error);
        setMlConnection({ connected: false, loading: false });
      }
    };
    checkMLConnection();
  }, []);

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

  // Filtrar y ordenar propiedades (optimizado)
  const filteredProperties = useMemo(() => {
    return availableProperties
      .filter((property) =>
        property.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Primero ordenar por disponibilidad (disponibles primero)
        if (a.isAvailable !== b.isAvailable) {
          return b.isAvailable ? 1 : -1;
        }
        // Luego ordenar por fecha de creación (más recientes primero)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [availableProperties, searchTerm]);

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

  // eslint-disable-next-line no-unused-vars
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    const error = validateField(field, value);
    setErrors({ ...errors, [field]: error });
  };

  const handleEdit = (property) => {
    setPropertyToEdit(property);
    setShowEditModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const handleSave = async () => {
    const validationErrors = Object.keys(formData).reduce((acc, field) => {
      const error = validateField(field, formData[field]);
      if (error) acc[field] = error;
      return acc;
    }, {});
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { propertyId, ...propertyData } = formData;
      await updateProperty({ propertyId, ...propertyData }).unwrap();
      toast.success('Propiedad actualizada correctamente');
      setEditingId(null);
    } catch (error) {
      console.error('Error al actualizar propiedad:', error);
      toast.error(error?.data?.details || 'Error al actualizar la propiedad');
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
      return;
    }
    
    try {
      await deleteProperty(propertyId).unwrap();
      toast.success('Propiedad eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      toast.error(error?.data?.details || 'Error al eliminar la propiedad');
    }
  };

  const handleTogglePublish = async (propertyId, currentStatus) => {
    if (!tenantHasLanding) {
      toast.warning('Tu plan actual no incluye landing pages. Actualiza a Plan Profesional o Empresarial.');
      return;
    }

    try {
      await togglePublishLanding({ 
        propertyId, 
        isPublishedInLanding: !currentStatus 
      }).unwrap();
      
      toast.success(
        !currentStatus 
          ? '✅ Propiedad publicada en landing' 
          : '🚫 Propiedad oculta de landing'
      );
    } catch (error) {
      console.error('Error al cambiar publicación:', error);
      toast.error(error?.data?.message || 'Error al cambiar publicación');
    }
  };

  const handlePublishML = async (propertyId) => {
    if (!mlConnection.connected) {
      toast.warning('Conecta tu cuenta de MercadoLibre en Configuración → Integraciones');
      return;
    }

    setPublishingML(prev => ({ ...prev, [propertyId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/mercadolibre/publish/${propertyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('¡Propiedad publicada en MercadoLibre!');
      
      // Actualizar listing local
      setMlListings(prev => ({
        ...prev,
        [propertyId]: {
          mlListingId: response.data.mlListingId,
          mlPermalink: response.data.mlPermalink,
          mlStatus: 'active',
          mlTitle: response.data.mlTitle
        }
      }));
      
      // Abrir en nueva pestaña
      if (response.data.mlPermalink) {
        window.open(response.data.mlPermalink, '_blank');
      }
    } catch (error) {
      console.error('Error al publicar en ML:', error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Error al publicar en MercadoLibre';
      toast.error(errorMsg);
    } finally {
      setPublishingML(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  // Solo mostrar loading si no hay propiedades cargadas aún
  if (isLoading && (!allProperties || allProperties.length === 0)) {
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
            <div key={property.propertyId} className={`bg-white/5 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 group hover:shadow-xl ${
              property.isAvailable 
                ? 'border-green-500/30 hover:border-green-500/50' 
                : 'border-red-500/30 hover:border-red-500/50 opacity-75'
            }`}>
              {/* Header con estado e ID */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                    <IoBusinessOutline className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Propiedad #{property.propertyId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        property.type === 'alquiler' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {property.type === 'alquiler' ? '🏠 Alquiler' : '💰 Venta'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        property.isAvailable 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {property.isAvailable ? '✓ Disponible' : '✗ No Disponible'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(property)}
                    className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Editar Propiedad"
                  >
                    <IoPencilOutline className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(property.propertyId)}
                    className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Eliminar"
                  >
                    <IoTrashOutline className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid de información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Columna izquierda: Ubicación */}
                <div className="space-y-3">
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <IoLocationOutline className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 text-xs font-semibold uppercase">Ubicación</span>
                    </div>
                    <p className="text-white font-medium text-base">{property.address}</p>
                    <p className="text-slate-300 text-sm mt-1">{property.neighborhood}</p>
                  </div>
                </div>

                {/* Columna derecha: Precio */}
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <IoPricetagOutline className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 text-xs font-semibold uppercase">Precio</span>
                    </div>
                    <p className="text-emerald-400 font-bold text-2xl">
                      {property.currency === 'USD'
                        ? `USD ${Number(property.price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                        : formatCurrency(property.price)
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Clientes asignados */}
              {property.Clients && property.Clients.length > 0 && (
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IoPeopleOutline className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-xs font-semibold uppercase">Clientes Asignados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.Clients.map((client) => (
                      <div key={client.idClient} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                        <span className="text-white text-sm font-medium">{client.name}</span>
                        <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                          {client.ClientProperty?.role || 'Sin rol'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer con acciones */}
              <div className="pt-4 mt-4 border-t border-white/10">
                {/* Acciones Rápidas */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <WhatsAppButton 
                    propertyId={property.propertyId}
                    property={property}
                  />
                  <RequisitoButton property={property} />
                  <ImageManager property={property} />
                  
                  {/* Botón de MercadoLibre */}
                  {!mlConnection.loading && mlConnection.connected && !mlListings[property.propertyId] && (
                    <button
                      onClick={() => handlePublishML(property.propertyId)}
                      disabled={publishingML[property.propertyId]}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Publicar en MercadoLibre"
                    >
                      <IoLogoBuffer className="w-4 h-4" />
                      {publishingML[property.propertyId] ? 'Publicando...' : 'Publicar en ML'}
                    </button>
                  )}
                  
                  {/* Badge si ya está publicado en ML */}
                  {mlListings[property.propertyId] && (
                    <a
                      href={mlListings[property.propertyId].mlPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-yellow-500/30 transition-colors"
                      title="Ver en MercadoLibre"
                    >
                      <IoLogoBuffer className="w-4 h-4" />
                      <span>Publicado en ML</span>
                      <IoCheckmarkCircle className="w-4 h-4" />
                    </a>
                  )}
                  
                  {/* Botón de Autorización de Venta - solo para propiedades de venta */}
                  {property.type === 'venta' && property.Clients && property.Clients.length > 0 && (
                    <AutorizacionVentaPdf 
                      client={property.Clients.find(c => c.ClientProperty?.role === 'propietario' || c.ClientProperty?.role === 'vendedor') || property.Clients[0]}
                      property={property}
                    />
                  )}
                  
                  <div className="flex-grow flex justify-end">
                    <PropiedadesPDF property={property} />
                  </div>
                </div>

                {/* Checkbox Publicar en Landing */}
                <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  property.isPublishedInLanding 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-slate-500/10 border-slate-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <IoGlobeOutline className={`w-5 h-5 ${property.isPublishedInLanding ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-sm font-medium ${property.isPublishedInLanding ? 'text-emerald-300' : 'text-slate-300'}`}>
                        Landing Page
                      </p>
                      <p className="text-xs text-slate-400">
                        {tenantHasLanding 
                          ? (property.isPublishedInLanding ? 'Visible en tu sitio' : 'Oculta del sitio') 
                          : 'Plan sin landing pages'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePublish(property.propertyId, property.isPublishedInLanding)}
                    disabled={!tenantHasLanding}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      property.isPublishedInLanding 
                        ? 'bg-emerald-500' 
                        : 'bg-slate-600'
                    } ${!tenantHasLanding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    title={tenantHasLanding ? (property.isPublishedInLanding ? 'Despublicar' : 'Publicar') : 'Actualiza tu plan'}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      property.isPublishedInLanding ? 'translate-x-8' : 'translate-x-1'
                    }`}>
                      {property.isPublishedInLanding ? (
                        <IoCheckmarkCircle className="text-emerald-500 w-5 h-5" />
                      ) : (
                        <IoCloseCircle className="text-slate-400 w-5 h-5" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Botón contextual según el modo */}
                {mode !== "default" && (
                  <button
                    onClick={() => {
                      console.log("=== Click en botón de selección ===");
                      console.log("onSelectProperty definido:", !!onSelectProperty);
                      console.log("Property:", property);
                      
                      // Si hay callback de selección, usarlo (cuando viene de CreateLeaseForm)
                      if (onSelectProperty) {
                        console.log("Llamando a onSelectProperty...");
                        onSelectProperty(property);
                      } else if (mode === "lease") {
                        console.log("Navegando a /crearContrato...");
                        navigate('/crearContrato', { state: { property } });
                      } else {
                        console.log("Abriendo modal interno...");
                        // Para venta, usar el modal interno
                        setSelectedProperty(property);
                        setShowSaleModal(true);
                      }
                    }}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] shadow-lg ${
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
                )}
              </div>
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
                  // RTK Query se actualiza automáticamente
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
                  // RTK Query se actualiza automáticamente
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición Completo */}
      {showEditModal && (
        <EditPropertyModal
          property={propertyToEdit}
          onClose={() => {
            setShowEditModal(false);
            setPropertyToEdit(null);
          }}
        />
      )}
    </div>
  );
};

Listado.propTypes = {
  mode: PropTypes.oneOf(['default', 'lease', 'sale']),
  onSelectProperty: PropTypes.func,
};

export default Listado;