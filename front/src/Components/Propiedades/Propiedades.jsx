import { useState, useEffect, useMemo } from "react";
import { useGetAllClientsQuery, useCreatePropertyMutation, useCreateClientMutation } from '@shared/redux';
import { useDolarRate } from '../hooks/useDolarRate';
import { formatCurrency, calcularComision } from '../../utils/formatCurrency';
import CurrencyInput from './CurrencyInput';
import { PROVINCIAS_ARGENTINA, getCiudadesByProvincia } from '@shared/constants/argentinLocations';
import { toast } from 'react-toastify';
import {
  getLegalStatusBadgeConfig,
  getLegalStatusOptionsByOperationType,
  isLegalStatusValidForOperationType,
} from './legalStatus';
import { uploadMultipleFiles } from "../../utils/azureUpload";
import { useNavigate } from "react-router-dom";
import { 
  IoArrowBackOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoCloudUploadOutline,
  IoSaveOutline,
  IoTrashOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoLayersOutline,
  IoPersonAddOutline,
  IoCloseOutline,
} from 'react-icons/io5';

import axios from 'axios';
import AutorizacionVentaPdf from "../PdfTemplates/AutorizacionVentaPdf";
import TemporaryRentalOptions from './TemporaryRentalOptions';
import {
  panelShell,
  pageHeaderBar,
  breadcrumbNav,
  backLink,
  btnSecondary,
  btnPrimary,
  formSection,
  formSectionTitle,
  formCard,
  inputClass,
  selectClass,
  labelClass,
  formSectionAccent,
  formSectionAccentTitle,
  heroIconWrap,
  heroTitle,
  heroSubtitle,
  spinner,
  alertSuccess,
  alertError,
} from './propiedadesTheme.js';
import { useFormTour } from '../../hooks/useFormTour';
import { getPropiedadesFormTourSteps } from '../../constants/formTourSteps';

const PLANTILLA_TRADICIONAL = `REQUISITOS PARA ALQUILAR

1. Fotocopia D.N.I./ CUIL/CUIT, solicitante/s y garante/s, domicilio y teléfono de los mismos, sino es del dominio del documento electrónico.

2. Fotocopia de los últimos tres recibos de sueldo, y certificado de trabajo, si es autónomo justificación de ingresos, esta puede hacer por un Contador y debe pasar por el Colegio Profesional de Ciencias Económicas, para ser certificada.

3. Tipos de garantía: Cantidad: 1 - con recibos de sueldo o certificación de ingresos.
   • Recibo de sueldo no inferior al tercio del monto del alquiler Garante:

DNI:
Domicilio:
Correo electrónico:

4. Los garantes firman el contrato ante escribano para que les certifique la firma, y cuando firme ante escribano deberá ser legalizado por el colegio de Escribanos.

5. Monto del alquiler mensual: 1º Cuatrimestre {price} Para los cuatrimestres siguientes de locación el precio será actualizado conforme el índice de precio al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadísticas y Censos (INDEC).

6. Honorarios de contratos ante escribano y favor de firma inmobiliaria: Igual al monto del alquiler

7. Período de locación: 2 años

8. Certificado de firma ante escribano público.

9. Sellado en rentas provincial

10. No se pide mes de depósito.

11. Reserva con seña 50% del monto del alquiler, validez 7 días hábiles.`;

const PLANTILLA_TEMPORAL = `REQUISITOS PARA ALQUILER TEMPORAL

1. Fotocopia D.N.I./ CUIL/CUIT del/los solicitante/s.

2. Estadía mínima según lo indicado en la publicación.

3. Pago anticipado: 100% del monto total al momento de la reserva.

4. Depósito de garantía: equivalente a una noche de alojamiento, reintegrable al finalizar la estadía sin daños.

5. Reserva con seña del 50% del monto total, validez 48 horas hábiles.

6. Check-in / Check-out: según horarios acordados con la inmobiliaria.

7. No se permiten mascotas salvo acuerdo previo.

8. Capacidad máxima de personas según lo indicado en la publicación.

9. Prohibido realizar eventos o fiestas en la propiedad.

10. El precio no incluye servicios (electricidad, gas, internet) salvo que se indique lo contrario.`;

const CreateProperty = () => {
  const navigate = useNavigate();
  
  // RTK Query hooks
  const { data: clients = [], isLoading: clientsLoading, error: clientsError, refetch: refetchClients } = useGetAllClientsQuery();
  const [createProperty, { isLoading: isSubmitting }] = useCreatePropertyMutation();
  const [createClient, { isLoading: isCreatingClient }] = useCreateClientMutation();
  const { dolar, loading: dolarLoading } = useDolarRate();

  useFormTour('propiedades', getPropiedadesFormTourSteps, [], {
    enabled: !clientsLoading && !clientsError,
  });
  
  const [formData, setFormData] = useState({
    address: "",
    neighborhood: "",
    pais: "AR", // País por defecto
    provincia: "",
    ciudad: "",
    codigo_postal: "",
    city: "",
    operationType: "",
    typeProperty: "",
    price: "",
    currency: "ARS",
    precioReferencia: "",
    rooms: "",
    bathrooms: "",
    comision: "",
    isAvailable: true,
    description: "",
    legalStatus: "",
    matriculaOPadron: "", // Nuevo campo para matrícula o padrón
    frente: "", // Nuevo campo para frente (solo lotes)
    profundidad: "", // Nuevo campo para profundidad (solo lotes)
    linkInstagram: "", // Nuevo campo para link de Instagram
    linkMaps: "", // Nuevo campo para link de Google Maps
    images: [], // Aquí almacenaremos las URLs de las imágenes subidas
    plantType: "", // Campo nuevo para el tipo de planta
    plantQuantity: "", // Campo nuevo para la cantidad de plantas
    highlights: "",
    idClient: "", // Nuevo campo para id del cliente
    role: "", // Nuevo campo para rol del cliente
    socio: "",
    Inventory: "",
    superficieTotal: "",
    superficieCubierta: "",
    requisito: "",
    rentalType: "TRADICIONAL",
    minStayDays: "",
    // Campos para alquileres temporales
    temporaryRentalTitle: "",
    temporaryRentalDescription: "",
    temporaryRentalPricePerNight: "",
    temporaryRentalPricePerWeek: "",
    temporaryRentalPricePerMonth: "",
    temporaryRentalCleaningFee: "",
    temporaryRentalCommissionPercentage: 15,
    temporaryRentalMinimumStay: 1,
    temporaryRentalMaximumStay: "",
    temporaryRentalCheckInTime: "15:00",
    temporaryRentalCheckOutTime: "11:00",
    temporaryRentalRules: "",
    amenities: [],
    temporaryRentalIsPublished: false,
  });
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [availableCiudades, setAvailableCiudades] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', cuil: '', email: '', mobilePhone: '', provincia: '', ciudad: '', codigoPostal: '', direccion: '' });
  const [newClientErrors, setNewClientErrors] = useState({});
  const [newClientCities, setNewClientCities] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const legalStatusOptions = useMemo(
    () => getLegalStatusOptionsByOperationType(formData.operationType),
    [formData.operationType]
  );

  const legalStatusBadge = useMemo(
    () => getLegalStatusBadgeConfig(formData.legalStatus),
    [formData.legalStatus]
  );

  // Ciudades disponibles basadas en la provincia seleccionada
  useMemo(() => {
    if (formData.provincia) {
      const ciudades = getCiudadesByProvincia(formData.provincia);
      setAvailableCiudades(ciudades);
    } else {
      setAvailableCiudades([]);
    }
  }, [formData.provincia]);

  useEffect(() => {
    if (newClientData.provincia) {
      const provinciaObj = PROVINCIAS_ARGENTINA.find(p => p.name === newClientData.provincia);
      if (provinciaObj) {
        setNewClientCities(getCiudadesByProvincia(provinciaObj.id));
      }
    } else {
      setNewClientCities([]);
    }
  }, [newClientData.provincia]);

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'provincia' ? { ciudad: '' } : {}),
    }));
    if (newClientErrors[name]) setNewClientErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNewClientSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newClientData.name.trim()) errors.name = 'El nombre es requerido';
    if (!newClientData.cuil.trim()) errors.cuil = 'El CUIL/DNI es requerido';
    if (Object.keys(errors).length > 0) { setNewClientErrors(errors); return; }
    try {
      const result = await createClient(newClientData).unwrap();
      const newId = result?.data?.idClient ?? result?.idClient;
      await refetchClients();
      if (newId) {
        setFormData((prev) => ({ ...prev, idClient: String(newId) }));
      }
      toast.success(`Cliente "${newClientData.name}" creado y seleccionado`);
      setShowNewClientModal(false);
      setNewClientData({ name: '', cuil: '', email: '', mobilePhone: '', provincia: '', ciudad: '', codigoPostal: '', direccion: '' });
    } catch (err) {
      const msg = err?.data?.error || err?.data?.details || 'Error al crear el cliente';
      toast.error(msg);
    }
  };

  const handleWidget = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    try {
      const urls = await uploadMultipleFiles(files, 'properties');
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`${urls.length} imagen${urls.length !== 1 ? 'es' : ''} subida${urls.length !== 1 ? 's' : ''} correctamente`);
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      toast.error('Error al subir las imágenes');
    } finally {
      setIsUploadingImages(false);
      e.target.value = null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "comision" ? Number(value) : value;
    
    // Manejar cambio de provincia
    if (name === "provincia") {
      setFormData({
        ...formData,
        provincia: value,
        ciudad: "", // Resetear ciudad cuando cambia provincia
        [name]: processedValue,
      });
      return;
    }
    
    // Si cambia el tipo de operación y el estado legal queda inválido, resetear legalStatus
    if (name === "operationType") {
      const shouldResetLegalStatus =
        formData.legalStatus &&
        !isLegalStatusValidForOperationType(value, formData.legalStatus);

      const nextState = {
        ...formData,
        [name]: processedValue,
      };

      // Si cambia a alquiler/rent y el campo requisito está vacío, cargar plantilla
      if (value === "rent" && !formData.requisito) {
        const plantillaRequisito = formData.rentalType === "TEMPORAL"
          ? PLANTILLA_TEMPORAL
          : PLANTILLA_TRADICIONAL;
        nextState.requisito = plantillaRequisito;
      }

      if (shouldResetLegalStatus) {
        nextState.legalStatus = "";
      }

      setFormData(nextState);
      return;
    }

    // Compatibilidad temporal por si llega el campo legacy
    if (name === "type") {
      const mappedOperationType = value === "venta" ? "sale" : value === "alquiler" ? "rent" : "";
      const shouldResetLegalStatus =
        formData.legalStatus &&
        !isLegalStatusValidForOperationType(mappedOperationType, formData.legalStatus);

      setFormData({
        ...formData,
        operationType: mappedOperationType,
        legalStatus: shouldResetLegalStatus ? "" : formData.legalStatus,
      });
      return;
    }

    // Si cambia la modalidad de alquiler, actualizar la plantilla de requisitos
    if (name === "rentalType" && formData.operationType === "rent") {
      setFormData({
        ...formData,
        rentalType: value,
        requisito: value === "TEMPORAL" ? PLANTILLA_TEMPORAL : PLANTILLA_TRADICIONAL,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleClientSelect = (e) => {
    const selectedClient = clients?.find(
      (client) => String(client.idClient) === e.target.value
    );
    console.log("Cliente seleccionado:", selectedClient);
    setFormData((prevData) => ({
      ...prevData,
      idClient: selectedClient ? String(selectedClient.idClient) : "",
      role: selectedClient ? selectedClient.role : "",
    }));
  };

  const handleAmenitiesChange = (selectedAmenities) => {
    setFormData({
      ...formData,
      amenities: selectedAmenities,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);

    try {
      // Preparar datos para el backend (mapear campos nuevos a campos legacy)
      const dataToSend = {
        ...formData,
        type: formData.operationType === 'sale' ? 'venta' : formData.operationType === 'rent' ? 'alquiler' : '',
        legalStatus: formData.legalStatus,
        city: formData.ciudad, // Mapear ciudad a city (campo legacy requerido por backend)
        neighborhood: formData.neighborhood || "Sin especificar", // Asegurar que no esté vacío
        idClient: formData.idClient ? Number(formData.idClient) : undefined,
      };
      
      console.log("Datos mapeados para backend:", dataToSend);
      
      // Crear la propiedad con RTK Query
      const result = await createProperty(dataToSend).unwrap();
      
      console.log("Propiedad creada exitosamente:", result);
      
      // Si es alquiler temporal, crear el registro de TemporaryRental
      if (formData.rentalType === "TEMPORAL" && formData.operationType === "rent") {
        try {
          const temporaryRentalData = {
            propertyId: result.propertyId,
            title: formData.temporaryRentalTitle || `Alquiler Temporal - ${result.address}`,
            description: formData.temporaryRentalDescription,
            pricePerNight: formData.temporaryRentalPricePerNight ? parseFloat(formData.temporaryRentalPricePerNight) : 0,
            pricePerWeek: formData.temporaryRentalPricePerWeek ? parseFloat(formData.temporaryRentalPricePerWeek) : null,
            pricePerMonth: formData.temporaryRentalPricePerMonth ? parseFloat(formData.temporaryRentalPricePerMonth) : null,
            minimumStay: formData.temporaryRentalMinimumStay ? parseInt(formData.temporaryRentalMinimumStay) : 1,
            maximumStay: formData.temporaryRentalMaximumStay ? parseInt(formData.temporaryRentalMaximumStay) : null,
            checkInTime: formData.temporaryRentalCheckInTime || "15:00",
            checkOutTime: formData.temporaryRentalCheckOutTime || "11:00",
            cleaningFee: formData.temporaryRentalCleaningFee ? parseFloat(formData.temporaryRentalCleaningFee) : 0,
            commissionPercentage: formData.temporaryRentalCommissionPercentage || 15,
            rules: formData.temporaryRentalRules || "",
            amenities: formData.amenities || [],
            isActive: true,
            isPublished: formData.temporaryRentalIsPublished || false,
          };

          console.log("Creando TemporaryRental:", temporaryRentalData);
          
          const tempResponse = await axios.post('/temporary-rental', temporaryRentalData, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log("TemporaryRental creado exitosamente:", tempResponse.data);
          toast.success('¡Propiedad y alquiler temporal creados correctamente!');
        } catch (tempError) {
          console.error("Error al crear TemporaryRental:", tempError);
          toast.error('Propiedad creada, pero hubo un error al configurar el alquiler temporal. Complétalo desde el panel.');
        }
      } else {
        toast.success('Propiedad creada correctamente');
      }
      
      // Resetear formulario
      setFormData({
        address: "",
        neighborhood: "",
        pais: "AR",
        provincia: "",
        ciudad: "",
        codigo_postal: "",
        city: "",
        operationType: "",
        typeProperty: "",
        price: "",
        currency: "ARS",
        precioReferencia: "",
        rooms: "",
        bathrooms: "",
        comision: "",
        isAvailable: true,
        description: "",
        legalStatus: "",
        matriculaOPadron: "",
        frente: "",
        profundidad: "",
        linkInstagram: "",
        linkMaps: "",
        images: [],
        plantType: "",
        plantQuantity: "",
        highlights: "",
        idClient: "",
        role: "",
        socio: "",
        Inventory: "",
        superficieTotal: "",
        superficieCubierta: "",
        requisito: "",
        rentalType: "TRADICIONAL",
        minStayDays: "",
        temporaryRentalTitle: "",
        temporaryRentalDescription: "",
        temporaryRentalPricePerNight: "",
        temporaryRentalPricePerWeek: "",
        temporaryRentalPricePerMonth: "",
        temporaryRentalCleaningFee: "",
        temporaryRentalCommissionPercentage: 15,
        temporaryRentalMinimumStay: 1,
        temporaryRentalMaximumStay: "",
        temporaryRentalCheckInTime: "15:00",
        temporaryRentalCheckOutTime: "11:00",
        temporaryRentalRules: "",
        amenities: [],
        temporaryRentalIsPublished: false,
      });
      
      // Navegar al panel de propiedades
      setTimeout(() => navigate('/panelPropiedades'), 1500);
      
    } catch (error) {
      console.error("Error al crear propiedad:", error);
      toast.error(error?.data?.details || 'Error al crear la propiedad');
    } finally {
      // no-op: isSubmitting se controla desde RTK Query
    }
  };
  
  useEffect(() => {
    if (formData.operationType === "sale") {
      setShowPdfButton(true); // Muestra el botón si es una propiedad de venta
    } else {
      setShowPdfButton(false); // No muestra el botón si no es de venta
    }
  }, [formData.operationType]);

  if (clientsLoading) {
    return (
      <div className={panelShell}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className={`h-10 w-10 ${spinner}`} aria-hidden />
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className={`${panelShell} p-4`}>
        <div className="mx-auto max-w-2xl pt-16">
          <div role="alert" className={alertError}>
            Error al cargar clientes: {String(clientsError)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={panelShell}>
      {/* Header */}
      <div className={`${pageHeaderBar} shadow-brandGlow`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`${btnSecondary} px-3 py-2`}
            >
              <IoArrowBackOutline className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Volver</span>
            </button>

            {/* Breadcrumb */}
            <nav className={`${breadcrumbNav} flex-wrap`}>
              <button type="button" onClick={() => navigate('/panel')} className={backLink}>
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span className="text-textMuted">/</span>
              <button type="button" onClick={() => navigate('/panelPropiedades')} className={backLink}>
                Propiedades
              </button>
              <span className="text-textMuted">/</span>
              <span className="text-textPrimary font-medium">Crear Propiedad</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={heroIconWrap}>
              <IoBusinessOutline className="w-12 h-12 text-brand-light" />
            </div>
          </div>
          <h1 className={heroTitle}>Crear Nueva Propiedad</h1>
          <p className={heroSubtitle}>
            Complete los datos de la propiedad para agregarla al sistema
          </p>
        </div>

        {/* Form Container */}
        <div className={`${formCard} shadow-brandGlow`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección Cliente y Propietario */}
            <div id="tour-prop-cliente" className={formSection}>
              <h3 className={formSectionTitle}>
                <IoPersonOutline className="w-6 h-6 text-brand-light" />
                Información del Cliente
              </h3>
              <input type="hidden" id="tour-prop-idClient" value={formData.idClient || ''} readOnly aria-hidden />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="client" className={`${labelClass} font-medium mb-2`}>
                    Cliente *
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="client"
                          type="text"
                          autoComplete="off"
                          value={
                            !showClientDropdown && formData.idClient
                              ? (clients?.find(c => String(c.idClient) === String(formData.idClient))?.name || clientSearch)
                              : clientSearch
                          }
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientDropdown(true);
                            if (!e.target.value) handleClientSelect({ target: { value: '' } });
                          }}
                          onFocus={() => {
                            setClientSearch('');
                            setShowClientDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => setShowClientDropdown(false), 150)}
                          placeholder="Buscar por nombre..."
                          className={inputClass}
                        />
                        {showClientDropdown && (
                          <ul className="absolute z-50 w-full mt-1 bg-bgElevated border border-borderBase rounded-lg shadow-brandGlow max-h-52 overflow-y-auto">
                            {(clients || [])
                              .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                              .map(client => (
                                <li
                                  key={client.idClient}
                                  onMouseDown={() => {
                                    handleClientSelect({ target: { value: String(client.idClient) } });
                                    setClientSearch('');
                                    setShowClientDropdown(false);
                                  }}
                                  className="px-4 py-2.5 text-textPrimary hover:bg-brand-subtle/40 cursor-pointer text-sm transition-colors"
                                >
                                  {client.name}
                                </li>
                              ))}
                            {(clients || []).filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                              <li
                                onMouseDown={() => {
                                  setShowClientDropdown(false);
                                  setNewClientData(prev => ({ ...prev, name: clientSearch }));
                                  setShowNewClientModal(true);
                                }}
                                className="px-4 py-2.5 text-brand-light hover:bg-brand-muted/40 cursor-pointer text-sm flex items-center gap-2 transition-colors border-t border-borderBase"
                              >
                                <IoPersonAddOutline className="w-4 h-4 flex-shrink-0" />
                                Crear cliente &quot;{clientSearch}&quot;
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewClientModal(true)}
                        title="Crear nuevo cliente"
                        className={`${btnSecondary} p-3 aspect-square`}
                      >
                        <IoPersonAddOutline className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className={`${labelClass} font-medium mb-2`}>
                    Rol del Cliente *
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-bgElevated">Seleccione un rol</option>
                    <option value="propietario" className="bg-bgElevated">Propietario (Para Alquiler)</option>
                    <option value="vendedor" className="bg-bgElevated">Vendedor (Para venta)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="socio" className={`${labelClass} font-medium mb-2`}>
                    Socio (Si en el contrato debe figurar mas de un propietario )
                  </label>
                  <input
                    type="text"
                    id="socio"
                    name="socio"
                    value={formData.socio}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nombre - CUIL - Domicilio"
                  />
                </div>
              </div>
            </div>

            <div id="tour-prop-ubicacion" className={formSection}>
              <h3 className={formSectionTitle}>
                <IoLocationOutline className="w-6 h-6 text-brand-light" />
                Ubicación de la Propiedad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="address" className={`${labelClass} font-medium mb-2`}>
                    Dirección *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ingrese la dirección"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="barrio" className={`${labelClass} font-medium mb-2`}>
                    Barrio
                  </label>
                  <input
                    type="text"
                    id="barrio"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ingrese el barrio"
                  />
                </div>

                <div>
                  <label htmlFor="provincia" className={`${labelClass} font-medium mb-2`}>
                    Provincia *
                  </label>
                  <select
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="" className="bg-bgElevated">Seleccione una provincia</option>
                    {PROVINCIAS_ARGENTINA.map((prov) => (
                      <option key={prov.id} value={String(prov.id)} className="bg-bgElevated">
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ciudad" className={`${labelClass} font-medium mb-2`}>
                    Ciudad *
                  </label>
                  <select
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    disabled={!formData.provincia}
                    className={`${selectClass} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                    required
                  >
                    <option value="" className="bg-bgElevated">
                      {formData.provincia ? 'Seleccione una ciudad' : 'Primero seleccione provincia'}
                    </option>
                    {availableCiudades.map((ciudad, index) => (
                      <option key={index} value={ciudad} className="bg-bgElevated">
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="codigo_postal" className={`${labelClass} font-medium mb-2`}>
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="codigo_postal"
                    name="codigo_postal"
                    value={formData.codigo_postal}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ej: 6070"
                  />
                </div>
              </div>
            </div>

            <div id="tour-prop-caracteristicas" className={formSection}>
              <h3 className={formSectionTitle}>
                <IoLayersOutline className="w-6 h-6 text-brand-light" />
                Tipo y Características
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="operationType" className={`${labelClass} font-medium mb-2`}>
                    Tipo de Transacción *
                  </label>
                  <select
                    id="operationType"
                    name="operationType"
                    value={formData.operationType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-bgElevated">Seleccione</option>
                    <option value="rent" className="bg-bgElevated">Alquiler</option>
                    <option value="sale" className="bg-bgElevated">Venta</option>
                  </select>
                </div>

                {/* Tipo de alquiler: solo cuando operationType es rent */}
                {formData.operationType === "rent" && (
                  <div>
                    <label htmlFor="rentalType" className={`${labelClass} font-medium mb-2`}>
                      Modalidad de Alquiler *
                    </label>
                    <select
                      id="rentalType"
                      name="rentalType"
                      value={formData.rentalType}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="TRADICIONAL" className="bg-bgElevated">Alquiler Tradicional</option>
                      <option value="TEMPORAL" className="bg-bgElevated">Alquiler Temporal (Turismo/Corto plazo)</option>
                    </select>
                  </div>
                )}

                {/* Días mínimos: solo para alquiler temporal */}
                {formData.operationType === "rent" && formData.rentalType === "TEMPORAL" && (
                  <div>
                    <label htmlFor="minStayDays" className={`${labelClass} font-medium mb-2`}>
                      Estadía Mínima (días)
                    </label>
                    <input
                      type="number"
                      id="minStayDays"
                      name="minStayDays"
                      value={formData.minStayDays}
                      onChange={handleChange}
                      min="1"
                      className={inputClass}
                      placeholder="Ej: 2"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="typeProperty" className={`${labelClass} font-medium mb-2`}>
                    Tipo de Propiedad *
                  </label>
                  <select
                    id="typeProperty"
                    name="typeProperty"
                    value={formData.typeProperty}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-bgElevated">Seleccione</option>
                    <option value="casa" className="bg-bgElevated">Casa</option>
                    <option value="departamento" className="bg-bgElevated">Departamento</option>
                    <option value="duplex" className="bg-bgElevated">Duplex</option>
                    <option value="finca" className="bg-bgElevated">Finca</option>
                    <option value="local" className="bg-bgElevated">Local Comercial</option>
                    <option value="lote" className="bg-bgElevated">Lote</option>
                    <option value="oficina" className="bg-bgElevated">Oficina</option>
                    <option value="terreno" className="bg-bgElevated">Terreno</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rooms" className={`${labelClass} font-medium mb-2`}>
                    Ambientes
                  </label>
                  <select
                    id="rooms"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-bgElevated">Seleccione</option>
                    <option value="1" className="bg-bgElevated">Monoambiente</option>
                    <option value="2" className="bg-bgElevated">2 Ambientes</option>
                    <option value="3" className="bg-bgElevated">3 Ambientes</option>
                    <option value="4" className="bg-bgElevated">4 Ambientes</option>
                    <option value="5" className="bg-bgElevated">Más de 4 Ambientes</option>
                  </select>
                </div>
              </div>

              {/* Campos adicionales para finca */}
              {formData.typeProperty === "finca" && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 rounded-lg border border-customYellow/30 border-l-4 border-l-customYellow bg-customYellowMuted p-4">
                  <div>
                    <label htmlFor="plantType" className={`${labelClass} font-medium mb-2`}>
                      Tipo de Planta
                    </label>
                    <input
                      type="text"
                      id="plantType"
                      name="plantType"
                      value={formData.plantType}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Ej: Vid, Olivo, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="plantQuantity" className={`${labelClass} font-medium mb-2`}>
                      Cantidad de Plantas
                    </label>
                    <input
                      type="number"
                      id="plantQuantity"
                      name="plantQuantity"
                      value={formData.plantQuantity}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Número de plantas"
                    />
                  </div>
                </div>
              )}
            </div>

            <div id="tour-prop-precio" className={formSection}>
              <h3 className={formSectionTitle}>
                <IoPricetagOutline className="w-6 h-6 text-brand-light" />
                Detalles y Precios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Baños - Ocultar para lotes y terrenos */}
                {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                  <div>
                    <label htmlFor="bathrooms" className={`${labelClass} font-medium mb-2`}>
                      Cuartos de Baño
                    </label>
                    <select
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="" className="bg-bgElevated">Seleccione</option>
                      <option value="1" className="bg-bgElevated">1 Baño</option>
                      <option value="2" className="bg-bgElevated">2 Baños</option>
                      <option value="3" className="bg-bgElevated">3 Baños</option>
                      <option value="4" className="bg-bgElevated">4 Baños</option>
                      <option value="5" className="bg-bgElevated">Más de 4 Baños</option>
                    </select>
                  </div>
                )}

                {/* Campos específicos para lotes y terrenos */}
                {(formData.typeProperty === "lote" || formData.typeProperty === "terreno") && (
                  <>
                    <div>
                      <label htmlFor="frente" className={`${labelClass} font-medium mb-2`}>
                        Frente *
                      </label>
                      <input
                        type="text"
                        id="frente"
                        name="frente"
                        value={formData.frente}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Ej: 15 metros"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="profundidad" className={`${labelClass} font-medium mb-2`}>
                        Profundidad *
                      </label>
                      <input
                        type="text"
                        id="profundidad"
                        name="profundidad"
                        value={formData.profundidad}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Ej: 30 metros"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Moneda + Precio */}
                <div>
                  <label className={`${labelClass} font-medium mb-2`}>
                    Moneda y Precio *
                  </label>
                  <div className="flex gap-2">
                    {/* Selector de moneda */}
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`${selectClass} min-w-[90px]`}
                    >
                      <option value="ARS" className="bg-bgElevated">$ ARS</option>
                      <option value="USD" className="bg-bgElevated">U$D USD</option>
                    </select>
                    {/* Input precio */}
                    <CurrencyInput
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      currency={formData.currency}
                      className={`flex-1 ${inputClass}`}
                      placeholder={formData.currency === 'USD' ? 'Precio en USD' : 'Precio en pesos'}
                      required
                    />
                  </div>

                  {/* Cotización del dólar + equivalente en ARS */}
                  {formData.currency === 'USD' && (
                    <div className={`${formSectionAccent} mt-2`}>
                      {dolarLoading ? (
                        <p className="text-brand-light text-xs">Obteniendo cotización...</p>
                      ) : dolar ? (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-textSecondary">
                            <span>Dólar Oficial venta:</span>
                            <span className="text-textPrimary font-semibold">
                              {formatCurrency(dolar.oficial?.venta, 'ARS')}
                            </span>
                          </div>
                          <div className="flex justify-between text-textSecondary">
                            <span>Dólar Blue venta:</span>
                            <span className="text-textPrimary font-semibold">
                              {formatCurrency(dolar.blue?.venta, 'ARS')}
                            </span>
                          </div>
                          {formData.price && (
                            <>
                              <div className="border-t border-borderStrong pt-1 mt-1">
                                <div className="flex justify-between">
                                  <span className="text-brand-light">Equiv. Oficial:</span>
                                  <span className="text-brand-light font-semibold">
                                    {formatCurrency(parseFloat(formData.price) * (dolar.oficial?.venta || 0), 'ARS')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-textSecondary">Equiv. Blue:</span>
                                  <span className="text-textPrimary font-semibold">
                                    {formatCurrency(parseFloat(formData.price) * (dolar.blue?.venta || 0), 'ARS')}
                                  </span>
                                </div>
                              </div>
                              {formData.comision && (
                                <div className="border-t border-borderStrong pt-1 mt-1">
                                  <p className="text-textMuted mb-0.5">Comisión {formData.comision}%:</p>
                                  {(() => {
                                    const { comisionOriginal, comisionARS: comArsOficial } = calcularComision(formData.price, 'USD', formData.comision, dolar.oficial?.venta);
                                    const { comisionARS: comArsBlue } = calcularComision(formData.price, 'USD', formData.comision, dolar.blue?.venta);
                                    return (
                                      <>
                                        <div className="flex justify-between">
                                          <span className="text-textSecondary">En USD:</span>
                                          <span className="text-textPrimary">USD {comisionOriginal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-brand-light">En ARS (Oficial):</span>
                                          <span className="text-brand-light">{formatCurrency(comArsOficial, 'ARS')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-textSecondary">En ARS (Blue):</span>
                                          <span className="text-textPrimary">{formatCurrency(comArsBlue, 'ARS')}</span>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                          <p className="text-textMuted text-[10px] mt-1">Actualizado: {dolar.lastUpdate ? new Date(dolar.lastUpdate).toLocaleString('es-AR') : '—'}</p>
                        </div>
                      ) : (
                        <p className="text-customRed text-xs">No se pudo obtener la cotización</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="precioReferencia" className={`${labelClass} font-medium mb-2`}>
                    Precio de Referencia
                    <span className="text-textMuted text-sm ml-2">(Opcional - Solo para consulta interna)</span>
                  </label>
                  <CurrencyInput
                    id="precioReferencia"
                    name="precioReferencia"
                    value={formData.precioReferencia}
                    onChange={handleChange}
                    currency={formData.currency}
                    className={inputClass}
                    placeholder="Precio de referencia (interno)"
                  />
                </div>

                <div>
                  <label htmlFor="comision" className={`${labelClass} font-medium mb-2`}>
                    Comisión *
                  </label>
                  <input
                    type="number"
                    id="comision"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Porcentaje de comisión"
                    required
                  />
                </div>

                {/* Superficie Cubierta - Ocultar para lotes y terrenos */}
                {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                  <div>
                    <label htmlFor="superficieCubierta" className={`${labelClass} font-medium mb-2`}>
                      Superficie Cubierta *
                    </label>
                    <input
                      type="text"
                      id="superficieCubierta"
                      name="superficieCubierta"
                      value={formData.superficieCubierta}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Ej: 120 m²"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="superficieTotal" className={`${labelClass} font-medium mb-2`}>
                    {formData.typeProperty === "lote" || formData.typeProperty === "terreno" ? "Superficie *" : "Superficie Total *"}
                  </label>
                  <input
                    type="text"
                    id="superficieTotal"
                    name="superficieTotal"
                    value={formData.superficieTotal}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder={formData.typeProperty === "lote" || formData.typeProperty === "terreno" ? "Ej: 450 m²" : "Ej: 180 m²"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="legalStatus" className={`${labelClass} font-medium mb-2`}>
                    Estado Legal *
                  </label>
                  <select
                    id="legalStatus"
                    name="legalStatus"
                    value={formData.legalStatus}
                    onChange={handleChange}
                    disabled={!formData.operationType}
                    className={inputClass}
                    required
                  >
                    <option value="" className="bg-bgElevated">
                      {formData.operationType ? 'Seleccione estado legal' : 'Primero seleccione tipo de transacción'}
                    </option>
                    {legalStatusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-bgElevated">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {legalStatusBadge && (
                    <span className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${legalStatusBadge.className}`}>
                      Riesgo: {legalStatusBadge.label}
                    </span>
                  )}
                </div>

                {/* Campo Matrícula o Padrón */}
                <div>
                  <label htmlFor="matriculaOPadron" className={`${labelClass} font-medium mb-2`}>
                    Matrícula o Padrón
                  </label>
                  <input
                    type="text"
                    id="matriculaOPadron"
                    name="matriculaOPadron"
                    value={formData.matriculaOPadron}
                    onChange={handleChange}
                    placeholder="Ej: 123456789 o Padrón 12345"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Sección Información Adicional */}
            <div className={formSection}>
              <h3 className={formSectionTitle}>
                <IoDocumentTextOutline className="w-6 h-6 text-brand-light" />
                Información Adicional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className={`${labelClass} font-medium mb-2`}>
                    Descripción *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className={`${inputClass} resize-none`}
                    placeholder="Describa las características principales de la propiedad..."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="highlights" className={`${labelClass} font-medium mb-2`}>
                      Puntos Destacados
                    </label>
                    <input
                      type="text"
                      id="highlights"
                      name="highlights"
                      value={formData.highlights}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Ej: Cerca del centro, excelente estado..."
                    />
                  </div>

                  {/* Inventario - Ocultar para lotes y terrenos */}
                  {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                    <div>
                      <label htmlFor="inventory" className={`${labelClass} font-medium mb-2`}>
                        Inventario
                      </label>
                      <input
                        type="text"
                        id="inventory"
                        name="inventory"
                        value={formData.inventory}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Detalle del inventario incluido"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="linkInstagram" className={`${labelClass} font-medium mb-2`}>
                      Link de Instagram
                    </label>
                    <input
                      type="url"
                      id="linkInstagram"
                      name="linkInstagram"
                      value={formData.linkInstagram}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="linkMaps" className={`${labelClass} font-medium mb-2`}>
                      Link de Google Maps
                    </label>
                    <input
                      type="url"
                      id="linkMaps"
                      name="linkMaps"
                      value={formData.linkMaps}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  {/* Campo Requisito - Solo para propiedades en alquiler */}
                  {formData.operationType === "rent" && (
                    <div>
                      <label htmlFor="requisito" className={`${labelClass} font-medium mb-2`}>
                        Requisitos de Alquiler
                      </label>
                      <textarea
                        id="requisito"
                        name="requisito"
                        value={formData.requisito}
                        onChange={handleChange}
                        rows="10"
                        className={`${inputClass} resize-none font-mono text-sm`}
                        placeholder="Requisitos específicos para esta propiedad..."
                      />
                      <p className="text-textMuted text-xs mt-1">
                        Si no modificas usarás la plantilla por defecto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Alquileres Temporales - Solo si se selecciona alquiler temporal */}
            {formData.operationType === "rent" && formData.rentalType === "TEMPORAL" && (
              <div className={formSection}>
                <h3 className={formSectionTitle}>
                  <IoLayersOutline className="w-6 h-6 text-brand-light" />
                  Configuración de Alquiler Temporal
                </h3>
                <TemporaryRentalOptions 
                  formData={formData} 
                  handleChange={handleChange}
                  onAmenitiesChange={handleAmenitiesChange}
                />
              </div>
            )}

            <div id="tour-prop-imagenes" className={formSection}>
              <h3 className={formSectionTitle}>
                <IoCloudUploadOutline className="w-6 h-6 text-brand-light" />
                Imágenes de la Propiedad
              </h3>
              
              {/* Botón de subir imágenes */}
              <div className="mb-6">
                <label className={`${btnPrimary} cursor-pointer rounded-xl px-6 py-4 text-base shadow-brandGlow hover:opacity-95 ${isUploadingImages ? 'opacity-70 pointer-events-none' : ''}`}>
                  {isUploadingImages ? (
                    <div className={`h-6 w-6 ${spinner}`} aria-hidden />
                  ) : (
                    <IoCloudUploadOutline className="w-6 h-6" />
                  )}
                  <span>{isUploadingImages ? 'Subiendo...' : 'Subir Imágenes'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploadingImages}
                    onChange={handleWidget}
                  />
                </label>
                <p className="text-textMuted text-sm mt-2">
                  Subí múltiples imágenes para mostrar la propiedad desde diferentes ángulos
                </p>
              </div>

              {/* Grid de imágenes */}
              {formData.images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-textPrimary">
                      Imágenes subidas ({formData.images.length})
                    </h4>
                    <div className="text-sm text-textSecondary bg-brand-subtle/40 px-3 py-1 rounded-full border border-borderBase">
                      {formData.images.length} imagen{formData.images.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-bgElevated rounded-lg overflow-hidden border border-borderBase hover:border-brand transition-colors duration-300">
                          <img
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          
                          {/* Overlay con botón eliminar */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prevData) => ({
                                  ...prevData,
                                  images: prevData.images.filter((_, idx) => idx !== index),
                                }));
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-customRed hover:bg-customRedDark text-textWhite font-medium transition-colors duration-200"
                            >
                              <IoTrashOutline className="w-4 h-4" />
                              <span className="text-sm">Eliminar</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Número de imagen */}
                        <div className="absolute top-2 left-2 bg-black/70 text-textWhite text-xs px-2 py-1 rounded-full font-medium">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Información adicional */}
                  <div role="note" className={`${alertSuccess} !mb-0 mt-4 flex-col items-stretch gap-3 sm:flex-row sm:items-start`}>
                    <div className={`${heroIconWrap} !p-2 shrink-0 mx-auto sm:mx-0`}>
                      <IoCloudUploadOutline className="w-5 h-5 text-brand-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className={formSectionAccentTitle}>Gestión de Imágenes</h5>
                      <p className="text-textSecondary text-sm">
                        Puedes eliminar cualquier imagen haciendo hover sobre ella y haciendo clic en &quot;Eliminar&quot;.
                        Las imágenes se mostrarán en el orden que las subiste.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado vacío */}
              {formData.images.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-borderBase rounded-xl bg-bgSurface/50">
                  <div className="flex justify-center mb-4">
                    <div className={heroIconWrap}>
                      <IoCloudUploadOutline className="w-12 h-12 text-brand-light" />
                    </div>
                  </div>
                  <h4 className="text-textPrimary font-medium mb-2">No hay imágenes subidas</h4>
                  <p className="text-textMuted text-sm max-w-md mx-auto">
                    Sube imágenes de alta calidad para mostrar las mejores características de la propiedad
                  </p>
                </div>
              )}
            </div>

            {/* PDF de Autorización */}
            {showPdfButton && (
              <div className={formSection}>
                <h3 className={formSectionTitle}>
                  <IoDocumentTextOutline className="w-6 h-6 text-brand-light" />
                  Autorización de Venta
                </h3>
                <AutorizacionVentaPdf
                  property={formData}
                  client={clients.find(
                    (client) => client.idClient === formData.idClient
                  )}
                />
              </div>
            )}

            <div id="tour-prop-guardar" className="flex justify-center pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${btnPrimary} px-8 py-4 text-base font-bold rounded-xl shadow-brandGlow hover:opacity-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className={`h-6 w-6 shrink-0 ${spinner}`} aria-hidden />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <IoSaveOutline className="w-6 h-6" />
                    <span>Guardar Propiedad</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Crear nuevo cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-borderStrong bg-bgSurface shadow-brandGlow">
            {/* Header fijo */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-borderBase p-4">
              <div className="flex items-center gap-3">
                <div className={`${heroIconWrap} !p-2`}>
                  <IoPersonAddOutline className="h-5 w-5 text-brand-light" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Nuevo Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewClientModal(false);
                  setNewClientErrors({});
                }}
                className="rounded-lg p-2 text-textMuted transition-colors hover:bg-brand-subtle/40 hover:text-textPrimary"
                aria-label="Cerrar"
              >
                <IoCloseOutline className="h-5 w-5" />
              </button>
            </div>

            {/* Cuerpo scrolleable */}
            <form onSubmit={handleNewClientSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <div>
                  <label className={`${labelClass} mb-1 text-sm font-medium`}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newClientData.name}
                    onChange={handleNewClientChange}
                    className={`${inputClass} py-3 ${newClientErrors.name ? 'border-customRed focus:border-customRed focus:ring-customRed' : ''}`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {newClientErrors.name && <p className="mt-1 text-xs text-customRed">{newClientErrors.name}</p>}
                </div>

                <div>
                  <label className={`${labelClass} mb-1 text-sm font-medium`}>
                    CUIL / DNI *
                  </label>
                  <input
                    type="text"
                    name="cuil"
                    value={newClientData.cuil}
                    onChange={handleNewClientChange}
                    className={`${inputClass} py-3 ${newClientErrors.cuil ? 'border-customRed focus:border-customRed focus:ring-customRed' : ''}`}
                    placeholder="XX-XXXXXXXX-X"
                  />
                  {newClientErrors.cuil && <p className="mt-1 text-xs text-customRed">{newClientErrors.cuil}</p>}
                </div>

                <div>
                  <label className={`${labelClass} mb-1 text-sm font-medium`}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newClientData.email}
                    onChange={handleNewClientChange}
                    className={`${inputClass} py-3`}
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className={`${labelClass} mb-1 text-sm font-medium`}>Teléfono</label>
                  <input
                    type="text"
                    name="mobilePhone"
                    value={newClientData.mobilePhone}
                    onChange={handleNewClientChange}
                    className={`${inputClass} py-3`}
                    placeholder="Ej: 3835503166"
                  />
                </div>

                <div className="border-t border-borderBase pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-textMuted">
                    Información de Domicilio
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`${labelClass} mb-1 text-sm font-medium`}>Provincia</label>
                      <select
                        name="provincia"
                        value={newClientData.provincia}
                        onChange={handleNewClientChange}
                        className={`${selectClass} w-full py-2.5 text-sm`}
                      >
                        <option value="" className="bg-bgElevated">
                          Seleccionar provincia
                        </option>
                        {PROVINCIAS_ARGENTINA.map((prov) => (
                          <option key={prov.id} value={prov.name} className="bg-bgElevated">
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`${labelClass} mb-1 text-sm font-medium`}>Ciudad</label>
                      <select
                        name="ciudad"
                        value={newClientData.ciudad}
                        onChange={handleNewClientChange}
                        disabled={!newClientData.provincia}
                        className={`${selectClass} w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <option value="" className="bg-bgElevated">
                          {newClientData.provincia ? 'Seleccione ciudad' : 'Primero seleccione provincia'}
                        </option>
                        {newClientCities.map((ciudad, i) => (
                          <option key={i} value={ciudad} className="bg-bgElevated">
                            {ciudad}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className={`${labelClass} mb-1 text-sm font-medium`}>Código Postal</label>
                      <input
                        type="text"
                        name="codigoPostal"
                        value={newClientData.codigoPostal}
                        onChange={handleNewClientChange}
                        className={`${inputClass} py-2.5 text-sm`}
                        placeholder="Ej: 4700"
                      />
                    </div>
                    <div>
                      <label className={`${labelClass} mb-1 text-sm font-medium`}>Dirección Completa</label>
                      <input
                        type="text"
                        name="direccion"
                        value={newClientData.direccion}
                        onChange={handleNewClientChange}
                        className={`${inputClass} py-2.5 text-sm`}
                        placeholder="Calle, número, piso, depto"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* fin scroll body */}

              {/* Footer fijo con botones */}
              <div className="flex flex-shrink-0 gap-3 border-t border-borderBase p-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientModal(false);
                    setNewClientErrors({});
                  }}
                  className={`${btnSecondary} flex-1 justify-center px-4 py-2.5`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className={`${btnPrimary} flex-1 justify-center px-4 py-2.5`}
                >
                  {isCreatingClient ? (
                    <>
                      <div className={`h-4 w-4 shrink-0 ${spinner}`} aria-hidden />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <IoPersonAddOutline className="h-4 w-4" />
                      <span>Crear y seleccionar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProperty;