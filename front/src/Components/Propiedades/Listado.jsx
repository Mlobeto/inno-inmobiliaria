import  { useState, useMemo, useEffect } from 'react';
import { useGetAllPropertiesQuery, useUpdatePropertyMutation, useDeletePropertyMutation, useTogglePublishLandingMutation } from '@shared/redux';
import { useNavigate, Link } from "react-router-dom";
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import axios from 'axios';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import PropiedadesPDF from "../PdfTemplates/PropiedadesPdf";
import CreateLeaseForm from "../Contratos/CreateLeaseForm";
import CompraVenta from "../Contratos/CompraVenta";
import WhatsAppButton from './WhatsAppButton';
import RequisitoButton from './RequisitoButton';
import ImageManager from './ImageManager';
import EditPropertyModal from './EditPropertyModal';
import AutorizacionVentaPdf from '../PdfTemplates/AutorizacionVentaPdf';
import {
  panelShell,
  pageHeaderBar,
  breadcrumbNav,
  backLink,
  btnPrimary,
  btnSecondary,
  btnGhost,
  formCard,
  filterInput,
  filterLabel,
  propertyCard,
  tableWrap,
  tableHeadRow,
  tableTh,
  tableRow,
  spinner,
  alertError,
  emptyState,
  modalOverlay,
  modalBox,
  modalHeader,
  heroIconWrap,
  heroTitle,
  heroSubtitle,
} from './propiedadesTheme';
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
  IoLogoBuffer,
  IoHelpCircleOutline
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
  const [tenantHasMl, setTenantHasMl] = useState(false);
  
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
        setTenantHasMl(tenant?.features?.mercadoLibreIntegration === true);
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
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.details ||
        error.response?.data?.error ||
        'No se pudo publicar en Mercado Libre';
      toast.error(errorMsg, { autoClose: 8000 });
    } finally {
      setPublishingML(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Listo!',
      steps: [
        {
          element: '#tour-search',
          popover: {
            title: '🔍 Buscar Propiedades',
            description: 'Escribí parte de la dirección para filtrar el listado en tiempo real.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '.tour-edit-btn',
          popover: {
            title: '✏️ Editar Propiedad',
            description: 'Modificá los datos de la propiedad: dirección, precio, descripción, habitaciones, superficie y más.',
            side: 'left',
          },
        },
        {
          element: '.tour-delete-btn',
          popover: {
            title: '🗑️ Eliminar Propiedad',
            description: 'Elimina permanentemente la propiedad del sistema. Esta acción no se puede deshacer.',
            side: 'left',
          },
        },
        {
          element: '.tour-whatsapp-btn',
          popover: {
            title: '📲 Compartir por WhatsApp',
            description: 'Genera un mensaje listo para enviar a clientes con todos los datos de la propiedad: precio, dirección, fotos y más.',
            side: 'bottom',
          },
        },
        {
          element: '.tour-requisito-btn',
          popover: {
            title: '📋 Copiar Requisitos',
            description: 'Copia al portapapeles la lista de requisitos que debe cumplir el interesado para alquilar o comprar esta propiedad.',
            side: 'bottom',
          },
        },
        {
          element: '.tour-images-btn',
          popover: {
            title: '🖼️ Gestionar Imágenes',
            description: 'Subí, ordená y eliminá las fotos de la propiedad. Las imágenes se usan en la ficha PDF, WhatsApp y la landing page.',
            side: 'bottom',
          },
        },
        {
          element: '.tour-pdf-btn',
          popover: {
            title: '📄 Descargar Ficha PDF',
            description: 'Genera y descarga una ficha completa con fotos, datos, descripción y el logo de tu inmobiliaria. Lista para imprimir o enviar.',
            side: 'left',
          },
        },
        {
          element: '.tour-landing-toggle',
          popover: {
            title: '🌐 Publicar en Landing Page',
            description: 'Activá este interruptor para que la propiedad aparezca en tu sitio web público. Desactivalo para ocultarla sin eliminarla.',
            side: 'top',
          },
        },
      ],
    });
    driverObj.drive();
  };

  // Solo mostrar loading si no hay propiedades cargadas aún
  if (isLoading && (!allProperties || allProperties.length === 0)) {
    return (
      <div className={`${panelShell} flex items-center justify-center gap-3`}>
        <div className={`${spinner} h-12 w-12 shrink-0`} aria-hidden />
        <span className="text-textSecondary text-xl">Cargando propiedades...</span>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      typeof error === 'string'
        ? error
        : error?.message || error?.data?.message || error?.error || 'Error al cargar';
    return (
      <div className={`${panelShell} flex items-center justify-center p-4`}>
        <div className={alertError}>Error: {errorMessage}</div>
      </div>
    );
  }

  return (
    <div className={panelShell}>
      {/* Header */}
      <div className={pageHeaderBar}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button type="button" onClick={() => navigate(-1)} className={`${backLink} px-3 py-2 rounded-lg bg-bgElevated border border-borderBase hover:bg-brand-subtle`}>
              <IoArrowBackOutline className="w-5 h-5" aria-hidden />
              <span className="hidden sm:inline">Volver</span>
            </button>

            {/* Breadcrumb */}
            <nav className={breadcrumbNav} aria-label="Migas de pan">
              <button type="button" onClick={() => navigate('/panel')} className="hover:text-textPrimary transition-colors">
                <IoHomeOutline className="w-4 h-4" aria-hidden />
              </button>
              <span aria-hidden>/</span>
              <button type="button" onClick={() => navigate('/panelPropiedades')} className="hover:text-textPrimary transition-colors">
                Propiedades
              </button>
              <span aria-hidden>/</span>
              <span className="text-textPrimary font-medium">
                {mode === "lease" ? "Propiedades para Alquilar" :
                 mode === "sale" ? "Propiedades para Vender" :
                 "Listado de Propiedades"}
              </span>
            </nav>
          </div>

          {/* Botón contextual según el modo */}
          {mode !== "default" && (
            <button
              type="button"
              onClick={() => {
                if (mode === "lease") setShowCreateModal(true);
                if (mode === "sale") setShowSaleModal(true);
              }}
              className={`${btnPrimary} hover:scale-[1.02]`}
            >
              <IoAddOutline className="w-5 h-5" aria-hidden />
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
            <div className={heroIconWrap}>
              <IoBusinessOutline className="w-12 h-12 text-brand-light" aria-hidden />
            </div>
          </div>
          <h1 className={heroTitle}>
            Listado de Propiedades
          </h1>
          <p className={heroSubtitle}>
            Gestiona todas las propiedades registradas en el sistema
          </p>
        </div>

        {/* Search and Filters Section */}
        <div className={`${formCard} mb-8`}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <label htmlFor="tour-search" className={`${filterLabel} mb-2 sm:sr-only`}>
                Buscar por dirección
              </label>
              <div className="relative">
                <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted w-5 h-5 pointer-events-none" aria-hidden />
                <input
                  id="tour-search"
                  type="text"
                  placeholder="Buscar por dirección..."
                  className={`${filterInput} pl-10`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`${filterLabel} gap-2`}>
                <IoFilterOutline className="w-5 h-5 shrink-0" aria-hidden />
                <span>
                  {filteredProperties.length} de {allProperties.length} propiedades
                </span>
              </div>
              <button
                type="button"
                onClick={startTour}
                className={btnGhost}
                title="Ver tour de funciones"
              >
                <IoHelpCircleOutline className="w-4 h-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Tour</span>
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedProperties.map((property) => (
            <div
              key={property.propertyId}
              className={`${propertyCard} p-5 ${
              property.isAvailable
                ? 'border-brand/35 hover:border-brand'
                : 'border-customRed/35 hover:border-customRed/50 opacity-75'
            }`}
            >
              {/* Header con estado e ID */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-borderBase">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-muted/40 rounded-xl">
                    <IoBusinessOutline className="w-6 h-6 text-brand-light" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-textPrimary font-bold text-lg">Propiedad #{property.propertyId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        property.type === 'alquiler'
                          ? 'bg-brand-muted text-brand-light'
                          : 'bg-brand-subtle text-brand-light border border-borderBase'
                      }`}>
                        {property.type === 'alquiler' ? '🏠 Alquiler' : '💰 Venta'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        property.isAvailable
                          ? 'bg-brand-subtle text-brand-light'
                          : 'bg-customRedMuted text-customRed border border-customRed/30'
                      }`}>
                        {property.isAvailable ? '✓ Disponible' : '✗ No Disponible'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(property)}
                    className={`tour-edit-btn ${btnGhost} p-2.5 text-brand-light border-brand/30`}
                    title="Editar Propiedad"
                  >
                    <IoPencilOutline className="w-5 h-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(property.propertyId)}
                    className="tour-delete-btn p-2.5 bg-customRedMuted hover:bg-customRed/20 text-customRed rounded-lg border border-customRed/30 transition-all duration-200 hover:scale-110"
                    title="Eliminar"
                  >
                    <IoTrashOutline className="w-5 h-5" aria-hidden />
                  </button>
                </div>
              </div>

              {/* Grid de información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Columna izquierda: Ubicación */}
                <div className="space-y-3">
                  <div className="bg-brand-subtle/40 rounded-lg p-3 border border-borderBase">
                    <div className="flex items-center gap-2 mb-2">
                      <IoLocationOutline className="w-4 h-4 text-brand-light" aria-hidden />
                      <span className="text-brand-light text-xs font-semibold uppercase">Ubicación</span>
                    </div>
                    <p className="text-textPrimary font-medium text-base">{property.address}</p>
                    <p className="text-textSecondary text-sm mt-1">{property.neighborhood}</p>
                  </div>
                </div>

                {/* Columna derecha: Precio */}
                <div className="space-y-3">
                  <div className="bg-brand-muted/25 rounded-lg p-3 border border-borderStrong">
                    <div className="flex items-center gap-2 mb-2">
                      <IoPricetagOutline className="w-4 h-4 text-brand-light" aria-hidden />
                      <span className="text-brand-light text-xs font-semibold uppercase">Precio</span>
                    </div>
                    <p className="text-brand-light font-bold text-2xl">
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
                <div className="bg-brand-subtle/30 rounded-lg p-3 border border-borderBase mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IoPeopleOutline className="w-4 h-4 text-brand-light" aria-hidden />
                    <span className="text-brand-light text-xs font-semibold uppercase">Clientes Asignados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.Clients.map((client) => (
                      <div key={client.idClient} className="flex items-center gap-2 bg-bgElevated rounded-lg px-3 py-1.5 border border-borderBase">
                        <span className="text-textPrimary text-sm font-medium">{client.name}</span>
                        <span className="text-xs bg-brand-muted/50 text-brand-light px-2 py-0.5 rounded-full border border-borderBase">
                          {client.ClientProperty?.role || 'Sin rol'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer con acciones */}
              <div className="pt-4 mt-4 border-t border-borderBase">
                {/* Acciones Rápidas */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="tour-whatsapp-btn">
                    <WhatsAppButton 
                      propertyId={property.propertyId}
                      property={property}
                    />
                  </span>
                  <span className="tour-requisito-btn">
                    <RequisitoButton property={property} />
                  </span>
                  <span className="tour-images-btn">
                    <ImageManager property={property} />
                  </span>
                  
                  {/* Botón de MercadoLibre */}
                  {tenantHasMl && !mlConnection.loading && mlConnection.connected && !mlListings[property.propertyId] && (
                    <button
                      type="button"
                      onClick={() => handlePublishML(property.propertyId)}
                      disabled={publishingML[property.propertyId]}
                      className={`${btnPrimary} bg-customYellow hover:bg-customYellow/90 px-4 py-2 shadow-none`}
                      title="Publicar en MercadoLibre"
                    >
                      <IoLogoBuffer className="w-4 h-4 shrink-0" aria-hidden />
                      {publishingML[property.propertyId] ? 'Publicando...' : 'Publicar en ML'}
                    </button>
                  )}

                  {/* Publicado en ML (cambios se sincronizan al guardar la propiedad) */}
                  {tenantHasMl && mlListings[property.propertyId] && (
                    <a
                      href={mlListings[property.propertyId].mlPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-customYellowMuted border border-customYellow text-customYellow rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-customYellow/10 transition-colors"
                      title="Ver en Mercado Libre. Los cambios se actualizan al guardar la propiedad."
                    >
                      <IoLogoBuffer className="w-4 h-4 shrink-0" aria-hidden />
                      <span>Ver en ML</span>
                      <IoCheckmarkCircle className="w-4 h-4 shrink-0 text-brand-light" aria-hidden />
                    </a>
                  )}

                  {tenantHasMl && !mlConnection.loading && !mlConnection.connected && (
                    <Link
                      to="/admin/company-settings?tab=mercadolibre"
                      className={`${btnGhost} px-4 py-2 border-customYellow/40 text-customYellow hover:bg-customYellow/10`}
                    >
                      Conectar Mercado Libre
                    </Link>
                  )}
                  
                  {/* Botón de Autorización de Venta - solo para propiedades de venta */}
                  {property.type === 'venta' && property.Clients && property.Clients.length > 0 && (
                    <AutorizacionVentaPdf 
                      client={property.Clients.find(c => c.ClientProperty?.role === 'propietario' || c.ClientProperty?.role === 'vendedor') || property.Clients[0]}
                      property={property}
                    />
                  )}
                  
                  <div className="tour-pdf-btn flex-grow flex justify-end">
                    <PropiedadesPDF property={property} />
                  </div>
                </div>

                {/* Checkbox Publicar en Landing */}
                <div className={`tour-landing-toggle flex items-center justify-between p-3 rounded-lg border transition-all ${
                  property.isPublishedInLanding
                    ? 'bg-brand-subtle/60 border-brand/35'
                    : 'bg-bgElevated border-borderBase'
                }`}>
                  <div className="flex items-center gap-2">
                    <IoGlobeOutline className={`w-5 h-5 ${property.isPublishedInLanding ? 'text-brand-light' : 'text-textMuted'}`} aria-hidden />
                    <div>
                      <p className={`text-sm font-medium ${property.isPublishedInLanding ? 'text-brand-light' : 'text-textSecondary'}`}>
                        Landing Page
                      </p>
                      <p className="text-xs text-textMuted">
                        {tenantHasLanding
                          ? (property.isPublishedInLanding ? 'Visible en tu sitio' : 'Oculta del sitio')
                          : 'Plan sin landing pages'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(property.propertyId, property.isPublishedInLanding)}
                    disabled={!tenantHasLanding}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      property.isPublishedInLanding
                        ? 'bg-brand'
                        : 'bg-bgSurface border border-borderStrong'
                    } ${!tenantHasLanding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                    title={tenantHasLanding ? (property.isPublishedInLanding ? 'Despublicar' : 'Publicar') : 'Actualiza tu plan'}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-textPrimary transition-transform ${
                      property.isPublishedInLanding ? 'translate-x-8' : 'translate-x-1'
                    }`}
                    >
                      {property.isPublishedInLanding ? (
                        <IoCheckmarkCircle className="text-brand w-5 h-5" aria-hidden />
                      ) : (
                        <IoCloseCircle className="text-textMuted w-5 h-5" aria-hidden />
                      )}
                    </span>
                  </button>
                </div>

                {/* Botón contextual según el modo */}
                {mode !== "default" && (
                  <button
                    type="button"
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
                    className={`${btnPrimary} w-full mt-4 justify-center py-3 rounded-xl hover:scale-[1.02] shadow-lg`}
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
          <div className={`${tableWrap} rounded-2xl p-6 sm:p-8 shadow-brandGlow`}>
            <table className="min-w-full w-full text-sm border-collapse">
                <thead className="sr-only">
                  <tr className={tableHeadRow}>
                    <th className={`${tableTh} w-[45%]`} scope="col">
                      Resumen del listado
                    </th>
                    <th className={tableTh} scope="col">
                      Navegación de páginas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={tableRow}>
                    <td className="px-4 py-3 align-middle text-textSecondary">
                      Mostrando {((currentPage - 1) * propertiesPerPage) + 1} a{' '}
                      {Math.min(currentPage * propertiesPerPage, filteredProperties.length)} de{' '}
                      {filteredProperties.length} propiedades
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-4">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange('prev')}
                          className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <IoChevronBackOutline className="w-4 h-4 shrink-0" aria-hidden />
                          <span className="hidden sm:inline">Anterior</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  type="button"
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={
                                    currentPage === page
                                      ? `${btnPrimary} !px-0 w-10 h-10 justify-center`
                                      : `${btnGhost} !px-0 w-10 h-10 justify-center`
                                  }
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span key={page} className="text-textMuted">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange('next')}
                          className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="hidden sm:inline">Siguiente</span>
                          <IoChevronForwardOutline className="w-4 h-4 shrink-0" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
          </div>
        )}

        {/* Empty State */}
        {filteredProperties.length === 0 && (
          <div className={formCard}>
            <div className={emptyState}>
              <div className="flex justify-center mb-4">
                <div className={heroIconWrap}>
                  <IoBusinessOutline className="w-12 h-12 text-textMuted" aria-hidden />
                </div>
              </div>
              <h3 className="text-textPrimary font-medium mb-2">No se encontraron propiedades</h3>
              <p className="text-textSecondary text-sm max-w-md mx-auto">
                {searchTerm ?
                  `No hay propiedades que coincidan con "${searchTerm}"` :
                  'No hay propiedades registradas en el sistema'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear contrato de alquiler - solo si no hay callback externo */}
      {!onSelectProperty && showCreateModal && selectedProperty && (
        <div className={`${modalOverlay} backdrop-blur-sm z-50`}>
          <div className={`${modalBox} max-w-2xl w-full rounded-2xl`}>
            <div className={`${modalHeader} px-5 py-3`}>
              <h3 className="text-base font-semibold text-textPrimary flex items-center gap-2">
                <IoKeyOutline className="w-5 h-5 text-brand-light shrink-0" aria-hidden />
                Crear Contrato — {selectedProperty.address}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedProperty(null);
                }}
                className={`${btnGhost} p-2`}
                aria-label="Cerrar"
              >
                <IoCloseOutline className="w-6 h-6 text-textMuted" aria-hidden />
              </button>
            </div>
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
      )}

      {/* Modal para compraventa - solo si no hay callback externo */}
      {!onSelectProperty && showSaleModal && selectedProperty && (
        <div className={`${modalOverlay} backdrop-blur-sm z-50`}>
          <div className={`${modalBox} max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl`}>
            <div className={`${modalHeader} px-6 py-5`}>
              <h3 className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <IoBusinessOutline className="w-6 h-6 text-brand-light shrink-0" aria-hidden />
                Compraventa - {selectedProperty.address}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSaleModal(false);
                  setSelectedProperty(null);
                }}
                className={`${btnGhost} p-2`}
                aria-label="Cerrar"
              >
                <IoCloseOutline className="w-6 h-6 text-textMuted" aria-hidden />
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