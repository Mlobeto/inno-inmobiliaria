import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from "react-redux";
import { useGetAllClientsQuery, useCreateClientMutation } from "@shared/redux";
import { PROVINCIAS_ARGENTINA, getCiudadesByProvincia } from '@shared/constants/argentinLocations';
import {
  createLease,
  getPropertiesById,
  addPropertyToClientWithRole,
  createGarantorsForLease,
  getLeaseById,
} from "../../redux/Actions/actions";
import Listado from "../Propiedades/Listado";
import Swal from "sweetalert2";
import ContratoEditor from "./ContratoEditor";
import {
  IoDocumentTextOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoPersonAddOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoTimeOutline,
  IoClipboardOutline,
  IoShieldCheckmarkOutline,
  IoSaveOutline,
  IoCloseOutline,
} from "react-icons/io5";

const CreateLeaseForm = ({ preselectedProperty, isModal, onClose } = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const propertyFromRoute = location?.state?.property;
  // eslint-disable-next-line no-unused-vars
  const property = useSelector((state) => state.property);
  const [isLoading, setIsLoading] = useState(false);
  
  // Usar RTK Query para obtener y crear clientes
  const { data: clients = [], refetch: refetchClients } = useGetAllClientsQuery();
  const [createClient, { isLoading: isCreatingClient }] = useCreateClientMutation();

  // Estado del combobox de inquilino
  const [renterSearch, setRenterSearch] = useState('');
  const [showRenterDropdown, setShowRenterDropdown] = useState(false);

  // Modal nuevo cliente
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', cuil: '', email: '', mobilePhone: '', provincia: '', ciudad: '', codigoPostal: '', direccion: '' });
  const [newClientErrors, setNewClientErrors] = useState({});
  const [newClientCities, setNewClientCities] = useState([]);

  useEffect(() => {
    if (newClientData.provincia) {
      const prov = PROVINCIAS_ARGENTINA.find(p => p.name === newClientData.provincia);
      if (prov) setNewClientCities(getCiudadesByProvincia(prov.id));
    } else {
      setNewClientCities([]);
    }
  }, [newClientData.provincia]);

  const [leaseCreated, setLeaseCreated] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pdfData, setPdfData] = useState(null);
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);
  const [templateWarning, setTemplateWarning] = useState(null); // null | { hasTemplates, type, typeName }

  const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    propertyId: "",
    landlordId: "",
    locador: "",
    locatario: "",
    locatarioId: "",
    startDate: "",
    rentAmount: "",
    updateFrequency: "",
    commission: "",
    totalMonths: "",
    inventory: "",
    garantiaType: "",
    seguroCaucionCompania: "",
    seguroCaucionPoliza: "",
    seguroCaucionVigencia: "",
    seguroCaucionNotas: "",
    guarantor1Name: "",
    guarantor1Cuil: "",
    guarantor1Direccion: "",
    guarantor1Email: "",
    guarantor1MobilePhone: "",
    guarantor1Description: "",
    guarantor1CertificationEntity: "",
    guarantor2Name: "",
    guarantor2Cuil: "",
    guarantor2Direccion: "",
    guarantor2Email: "",
    guarantor2MobilePhone: "",
    guarantor2Description: "",
    guarantor2CertificationEntity: "",
  });


  const filteredActiveLeases = (leases) => {
    return leases.filter((lease) => {
      const endDate = new Date(lease.startDate);
      endDate.setMonth(endDate.getMonth() + lease.totalMonths);
      return endDate > new Date();
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRenterSelect = (client) => {
    setFormData((prev) => ({ ...prev, locatario: client.name, locatarioId: client.idClient }));
    setSelectedClient(client);
    setRenterSearch('');
    setShowRenterDropdown(false);
  };

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
    if (!newClientData.mobilePhone.trim()) errors.mobilePhone = 'El teléfono es requerido';
    if (Object.keys(errors).length > 0) { setNewClientErrors(errors); return; }
    try {
      const result = await createClient(newClientData).unwrap();
      const newId = result?.data?.idClient ?? result?.idClient;
      await refetchClients();
      if (newId) {
        setFormData((prev) => ({ ...prev, locatario: newClientData.name, locatarioId: String(newId) }));
      }
      setShowNewClientModal(false);
      setNewClientData({ name: '', cuil: '', email: '', mobilePhone: '', provincia: '', ciudad: '', codigoPostal: '', direccion: '' });
      setNewClientErrors({});
    } catch (err) {
      const msg = err?.data?.error || err?.data?.details || 'Error al crear el cliente';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar que la propiedad no tenga contratos activos
      const propertyData = await dispatch(getPropertiesById(formData.propertyId));
      if (propertyData && propertyData.Leases) {
        const activeLeases = filteredActiveLeases(propertyData.Leases);
        if (activeLeases.length > 0) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Esta propiedad ya tiene un contrato de alquiler activo.",
          });
          setIsLoading(false);
          return;
        }
      }

      // Crear el contrato de alquiler
      const seguroDatos = formData.garantiaType === 'seguro_caucion'
        ? JSON.stringify({
            poliza: formData.seguroCaucionPoliza,
            vigencia: formData.seguroCaucionVigencia,
            notas: formData.seguroCaucionNotas,
          })
        : null;

      const leaseData = {
        propertyId: formData.propertyId,
        landlordId: formData.landlordId,
        renterId: formData.locatarioId,
        startDate: formData.startDate,
        rentAmount: parseFloat(formData.rentAmount),
        updateFrequency: formData.updateFrequency,
        commission: parseFloat(formData.commission),
        totalMonths: parseInt(formData.totalMonths),
        inventory: formData.inventory,
        garantiaType: formData.garantiaType || null,
        seguroCaucionCompania: formData.seguroCaucionCompania || null,
        seguroCaucionDatos: seguroDatos,
      };

      console.log("Intentando crear contrato con datos:", leaseData);
      const result = await dispatch(createLease(leaseData));
      console.log("Resultado de createLease:", result);

      // Verificar si la creación fue exitosa
      if (!result || !result.success) {
        throw new Error(result?.fullError || result?.error || "Error desconocido al crear el contrato");
      }

      const createdLease = result.data;

      if (createdLease && createdLease.leaseId) {
        // Crear garantes si están presentes
        const guarantorsData = [];

        if (formData.guarantor1Name) {
          guarantorsData.push({
            name: formData.guarantor1Name,
            cuil: formData.guarantor1Cuil,
            address: formData.guarantor1Direccion,
            email: formData.guarantor1Email,
            mobilePhone: formData.guarantor1MobilePhone,
            description: formData.guarantor1Description,
            certificationEntity: formData.guarantor1CertificationEntity || null,
          });
        }

        if (formData.guarantor2Name) {
          guarantorsData.push({
            name: formData.guarantor2Name,
            cuil: formData.guarantor2Cuil,
            address: formData.guarantor2Direccion,
            email: formData.guarantor2Email,
            mobilePhone: formData.guarantor2MobilePhone,
            description: formData.guarantor2Description,
            certificationEntity: formData.guarantor2CertificationEntity || null,
          });
        }

        if (formData.garantiaType === 'garantes' && guarantorsData.length > 0) {
          console.log("Creando garantes:", guarantorsData);
          await dispatch(createGarantorsForLease(createdLease.leaseId, guarantorsData));
        }

        // Agregar cliente a la propiedad como inquilino
        console.log("Asignando rol de inquilino al cliente");
        await dispatch(
          addPropertyToClientWithRole({
            propertyId: formData.propertyId,
            idClient: formData.locatarioId,
            role: "inquilino",
          })
        );

        // Cargar el lease completo con todas las relaciones (Property, Tenant, Landlord, Garantors)
        console.log("Cargando lease completo con ID:", createdLease.leaseId);
        const leaseCompleto = await dispatch(getLeaseById(createdLease.leaseId));
        console.log("Lease completo cargado:", leaseCompleto);

        setLeaseCreated(leaseCompleto);
        setPdfData(leaseCompleto);

        await Swal.fire({
          icon: "success",
          title: "¡Contrato creado!",
          text: "El contrato de alquiler fue creado exitosamente.",
          confirmButtonText: "Ver contratos",
          confirmButtonColor: "#10b981",
        });

        // Resetear formulario y navegar al listado
        setFormData({
          propertyId: "", landlordId: "", locador: "", locatario: "", locatarioId: "",
          startDate: "", rentAmount: "", updateFrequency: "", commission: "",
          totalMonths: "", inventory: "", garantiaType: "", seguroCaucionCompania: "",
          seguroCaucionPoliza: "", seguroCaucionVigencia: "", seguroCaucionNotas: "",
          guarantor1Name: "", guarantor1Cuil: "", guarantor1Direccion: "",
          guarantor1Email: "", guarantor1MobilePhone: "", guarantor1Description: "",
          guarantor1CertificationEntity: "", guarantor2Name: "", guarantor2Cuil: "",
          guarantor2Direccion: "", guarantor2Email: "", guarantor2MobilePhone: "",
          guarantor2Description: "", guarantor2CertificationEntity: "",
        });
        setLeaseCreated(null);
        setPdfData(null);
        setRenterSearch('');
        setSelectedPropertyType(null);
        navigate('/contratoAlquiler');
      } else {
        throw new Error("No se recibió el leaseId del contrato creado");
      }
    } catch (error) {
      console.error("Error completo al crear el contrato:", error);
      
      let errorMessage = "Hubo un error al crear el contrato de alquiler.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        footer: 'Revisa la consola del navegador para más detalles'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySelect = async (property) => {
    console.log("=== handlePropertySelect llamado ===");
    console.log("Propiedad recibida:", property);
    
    if (!property || !property.propertyId) {
      console.error("Propiedad inválida seleccionada:", property);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo seleccionar la propiedad. Intente de nuevo.",
      });
      return;
    }

    try {
      // Obtener la propiedad completa con los clientes desde el backend
      console.log("Obteniendo datos completos de la propiedad...");
      const fullProperty = await dispatch(getPropertiesById(property.propertyId));
      
      console.log("Propiedad completa recibida:", fullProperty);
      console.log("fullProperty.Clients:", fullProperty.Clients);
      console.log("Número de clientes:", fullProperty.Clients?.length);

      const landlord = fullProperty.Clients?.find(
        (client) => client.ClientProperty.role === "propietario"
      );
      
      console.log("Propietario encontrado:", landlord);
      console.log("landlord.idClient:", landlord?.idClient);

      if (!landlord || !landlord.idClient) {
        Swal.fire({
          icon: "warning",
          title: "Advertencia",
          text: "Esta propiedad no tiene un propietario asignado. Por favor, asigne un propietario primero.",
        });
        return;
      }
      
      setFormData((prevData) => ({
        ...prevData,
        propertyId: fullProperty.propertyId,
        landlordId: landlord.idClient,
        locador: landlord.name || "",
        rentAmount: fullProperty.price,
        commission: fullProperty.comision,
        inventory: fullProperty.inventory,
      }));
      setSelectedPropertyType(fullProperty.typeProperty || null);
      console.log("FormData actualizado exitosamente");
    } catch (error) {
      console.error("Error al obtener datos de la propiedad:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos completos de la propiedad.",
      });
    }
  };

  // Verificar plantillas disponibles cuando cambia el tipo/duración del contrato
  useEffect(() => {
    if (!formData.propertyId) return;

    const months = parseInt(formData.totalMonths, 10);
    const isTemporary = !isNaN(months) && months <= 3;
    const templateType = isTemporary ? 'CONTRATO_ALQUILER_TEMPORARIO' : 'CONTRATO_ALQUILER';

    const commercialTypes = ['oficina', 'local', 'galpon', 'deposito', 'finca', 'cochera'];
    const terrenoTypes = ['lote', 'terreno'];
    const isCommercial = commercialTypes.includes(selectedPropertyType?.toLowerCase());

    let typeLabel = 'Contrato de Alquiler';
    if (isTemporary) typeLabel = 'Contrato Temporario';
    else if (isCommercial) typeLabel = 'Contrato de Alquiler Comercial';

    // Calcular propertyPurpose para pasar al endpoint de verificación
    let propertyPurpose = '';
    if (commercialTypes.includes(selectedPropertyType?.toLowerCase())) propertyPurpose = 'COMERCIAL';
    else if (terrenoTypes.includes(selectedPropertyType?.toLowerCase())) propertyPurpose = 'TERRENO';
    else if (selectedPropertyType) propertyPurpose = 'VIVIENDA';

    const purposeParam = propertyPurpose ? `&propertyPurpose=${propertyPurpose}` : '';

    fetch(`${apiUrl}/pdf-templates/check?templateType=${templateType}${purposeParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTemplateWarning({
            hasTemplates: data.hasTemplates,
            type: templateType,
            typeName: typeLabel,
            isCommercial,
          });
        }
      })
      .catch(() => {});
  }, [formData.propertyId, formData.totalMonths, selectedPropertyType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Preseleccionar propiedad cuando viene desde el listado externo o navegación directa
  useEffect(() => {
    const propToLoad = preselectedProperty || propertyFromRoute;
    if (propToLoad) {
      handlePropertySelect(propToLoad);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (propertyFromRoute) {
      navigate('/contratoAlquiler');
    } else {
      setFormData(prev => ({ ...prev, propertyId: "" }));
      setLeaseCreated(null);
    }
  };

  return (
    <div className={isModal ? "" : "min-h-screen"}>      
      {/* Mostrar spinner o Listado interno si no hay propiedad seleccionada */}
      {!formData.propertyId ? (
        (isModal || propertyFromRoute) ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
            <span className="text-white">Cargando propiedad...</span>
          </div>
        ) : (
          <Listado mode="lease" onSelectProperty={handlePropertySelect} />
        )
      ) : (
        // Modal overlay con formulario
        formData.propertyId && (
        <div className={isModal ? "" : "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"}>
          <div className={isModal ? "" : "bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"}>
            {/* Header del modal - solo en modo standalone */}
            {!isModal && <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  Crear Contrato de Alquiler
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>}

            {/* Contenido del modal */}
            <div className="p-6">
              {!leaseCreated ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Información de la propiedad seleccionada */}
                  <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
                      <IoBusinessOutline className="w-5 h-5 mr-2" />
                      Propiedad Seleccionada
                    </h3>
                    <p className="text-white">ID: {formData.propertyId}</p>
                    <p className="text-slate-300">Propietario: {formData.locador}</p>
                  </div>

                  {/* Aviso de plantillas de contrato */}
                  {templateWarning && !templateWarning.hasTemplates && (
                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 mb-2">
                      <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <div>
                        <p className="text-amber-300 font-medium text-sm">
                          No tenés plantillas de {templateWarning.typeName} configuradas
                        </p>
                        <p className="text-amber-200/70 text-xs mt-1">
                          El contrato se generará con el diseño por defecto del sistema.{' '}
                          <a
                            href="/admin/plantillas"
                            className="underline hover:text-amber-100 transition-colors"
                            onClick={e => { e.preventDefault(); navigate('/admin/plantillas'); }}
                          >
                            Configurar plantillas
                          </a>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Información básica del contrato */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
                      Información del Contrato
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inquilino */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-purple-400" />
                          Inquilino *
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              autoComplete="off"
                              value={
                                !showRenterDropdown && formData.locatarioId
                                  ? (clients.find(c => String(c.idClient) === String(formData.locatarioId))?.name || renterSearch)
                                  : renterSearch
                              }
                              onChange={(e) => {
                                setRenterSearch(e.target.value);
                                setShowRenterDropdown(true);
                                if (!e.target.value) setFormData((prev) => ({ ...prev, locatario: '', locatarioId: '' }));
                              }}
                              onFocus={() => { setRenterSearch(''); setShowRenterDropdown(true); }}
                              onBlur={() => setTimeout(() => setShowRenterDropdown(false), 150)}
                              placeholder="Buscar inquilino..."
                              required={!formData.locatarioId}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                            />
                            {showRenterDropdown && (
                              <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                                {(clients || [])
                                  .filter(c => c.name.toLowerCase().includes(renterSearch.toLowerCase()))
                                  .map(client => (
                                    <li
                                      key={client.idClient}
                                      onMouseDown={() => handleRenterSelect(client)}
                                      className="px-4 py-2.5 text-white hover:bg-white/10 cursor-pointer text-sm transition-colors border-b border-white/5 last:border-b-0"
                                    >
                                      <p className="font-medium">{client.name}</p>
                                      {client.email && <p className="text-slate-400 text-xs">{client.email}</p>}
                                    </li>
                                  ))}
                                {(clients || []).filter(c => c.name.toLowerCase().includes(renterSearch.toLowerCase())).length === 0 && (
                                  <li
                                    onMouseDown={() => {
                                      setShowRenterDropdown(false);
                                      setNewClientData(prev => ({ ...prev, name: renterSearch }));
                                      setShowNewClientModal(true);
                                    }}
                                    className="px-4 py-2.5 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer text-sm flex items-center gap-2 transition-colors"
                                  >
                                    <IoPersonAddOutline className="w-4 h-4 flex-shrink-0" />
                                    Crear &quot;{renterSearch}&quot; como nuevo cliente
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNewClientModal(true)}
                            title="Crear nuevo cliente"
                            className="flex items-center justify-center px-3 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/30 text-emerald-400 rounded-xl transition-all duration-200"
                          >
                            <IoPersonAddOutline className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Fecha de inicio */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCalendarOutline className="w-4 h-4 mr-2 text-amber-400" />
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          required
                        />
                      </div>

                      {/* Monto de alquiler */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-emerald-400" />
                          Monto de Alquiler
                        </label>
                        <input
                          type="number"
                          name="rentAmount"
                          value={formData.rentAmount}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Monto mensual..."
                          required
                        />
                      </div>

                      {/* Frecuencia de actualización */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoTimeOutline className="w-4 h-4 mr-2 text-yellow-400" />
                          Frecuencia de Actualización
                        </label>
                        <select
                          name="updateFrequency"
                          value={formData.updateFrequency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          required
                        >
                          <option value="" className="bg-slate-800">Seleccionar frecuencia</option>
                          <option value="semestral" className="bg-slate-800">Semestral</option>
                          <option value="cuatrimestral" className="bg-slate-800">Cuatrimestral</option>
                          <option value="anual" className="bg-slate-800">Anual</option>
                        </select>
                      </div>

                      {/* Comisión */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-orange-400" />
                          Comisión
                        </label>
                        <input
                          type="number"
                          name="commission"
                          value={formData.commission}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Comisión..."
                        />
                      </div>

                      {/* Duración en meses */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCalendarOutline className="w-4 h-4 mr-2 text-indigo-400" />
                          Duración (meses)
                        </label>
                        <input
                          type="number"
                          name="totalMonths"
                          value={formData.totalMonths}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Meses totales..."
                          required
                        />
                      </div>
                    </div>

                    {/* Inventario */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-slate-300">
                        <IoClipboardOutline className="w-4 h-4 mr-2 text-cyan-400" />
                        Inventario
                      </label>
                      <textarea
                        name="inventory"
                        value={formData.inventory}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
                        placeholder="Detalle del inventario de la propiedad..."
                      />
                    </div>
                  </div>

                  {/* Tipo de garantía */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3 flex items-center">
                      <IoShieldCheckmarkOutline className="w-6 h-6 mr-2 text-green-400" />
                      Tipo de Garantía
                    </h3>

                    {/* Selector */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, garantiaType: 'garantes' }))}
                        className={`py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200 flex flex-col items-center gap-2 ${
                          formData.garantiaType === 'garantes'
                            ? 'border-green-400 bg-green-500/20 text-green-300'
                            : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                        }`}
                      >
                        <IoShieldCheckmarkOutline className="w-7 h-7" />
                        <span>Garantes</span>
                        <span className="text-xs font-normal opacity-70">Personas que avalan el contrato</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, garantiaType: 'seguro_caucion' }))}
                        className={`py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200 flex flex-col items-center gap-2 ${
                          formData.garantiaType === 'seguro_caucion'
                            ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                            : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                        }`}
                      >
                        <IoDocumentTextOutline className="w-7 h-7" />
                        <span>Seguro de Caución</span>
                        <span className="text-xs font-normal opacity-70">Póliza de seguro como garantía</span>
                      </button>
                    </div>

                    {/* Formulario Seguro de Caución */}
                    {formData.garantiaType === 'seguro_caucion' && (
                      <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-6 space-y-4">
                        <h4 className="text-lg font-medium text-blue-300">Datos del Seguro de Caución</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Compañía aseguradora *</label>
                            <input
                              type="text"
                              name="seguroCaucionCompania"
                              value={formData.seguroCaucionCompania}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="Ej: Sancor Seguros, Zurich..."
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Número de póliza</label>
                            <input
                              type="text"
                              name="seguroCaucionPoliza"
                              value={formData.seguroCaucionPoliza}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="Número de póliza"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Vigencia hasta</label>
                            <input
                              type="date"
                              name="seguroCaucionVigencia"
                              value={formData.seguroCaucionVigencia}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300">Observaciones</label>
                            <textarea
                              name="seguroCaucionNotas"
                              value={formData.seguroCaucionNotas}
                              onChange={handleInputChange}
                              rows={3}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                              placeholder="Datos adicionales del seguro, condiciones, etc."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulario Garantes */}
                    {formData.garantiaType === 'garantes' && (
                      <>
                        {/* Garante 1 */}
                    <div className="bg-white/5 rounded-xl p-6 space-y-4">
                      <h4 className="text-lg font-medium text-white">Garante 1</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="guarantor1Name"
                          value={formData.guarantor1Name}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Nombre completo del garante"
                        />
                        <input
                          type="text"
                          name="guarantor1Cuil"
                          value={formData.guarantor1Cuil}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="CUIL del garante"
                        />
                        <input
                          type="text"
                          name="guarantor1Direccion"
                          value={formData.guarantor1Direccion}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Dirección"
                        />
                        <input
                          type="email"
                          name="guarantor1Email"
                          value={formData.guarantor1Email}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          name="guarantor1MobilePhone"
                          value={formData.guarantor1MobilePhone}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Teléfono (10 dígitos)"
                          maxLength="10"
                        />
                        <select
                          name="guarantor1Description"
                          value={formData.guarantor1Description}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="" className="bg-slate-800">Tipo de documentación</option>
                          <option value="recibos" className="bg-slate-800">Recibos de sueldo</option>
                          <option value="certificacion" className="bg-slate-800">Certificación de ingresos</option>
                          <option value="escritura" className="bg-slate-800">Escritura de propiedad</option>
                        </select>
                        {formData.guarantor1Description === "certificacion" && (
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              name="guarantor1CertificationEntity"
                              value={formData.guarantor1CertificationEntity}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="Entidad certificadora"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Garante 2 */}
                    <div className="bg-white/5 rounded-xl p-6 space-y-4">
                      <h4 className="text-lg font-medium text-white">Garante 2 (Opcional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="guarantor2Name"
                          value={formData.guarantor2Name}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Nombre completo del garante"
                        />
                        <input
                          type="text"
                          name="guarantor2Cuil"
                          value={formData.guarantor2Cuil}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="CUIL del garante"
                        />
                        <input
                          type="text"
                          name="guarantor2Direccion"
                          value={formData.guarantor2Direccion}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Dirección"
                        />
                        <input
                          type="email"
                          name="guarantor2Email"
                          value={formData.guarantor2Email}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          name="guarantor2MobilePhone"
                          value={formData.guarantor2MobilePhone}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Teléfono (10 dígitos)"
                          maxLength="10"
                        />
                        <select
                          name="guarantor2Description"
                          value={formData.guarantor2Description}
                          onChange={handleInputChange}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="" className="bg-slate-800">Tipo de documentación</option>
                          <option value="recibos" className="bg-slate-800">Recibos de sueldo</option>
                          <option value="certificacion" className="bg-slate-800">Certificación de ingresos</option>
                          <option value="escritura" className="bg-slate-800">Escritura de propiedad</option>
                        </select>
                        {formData.guarantor2Description === "certificacion" && (
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              name="guarantor2CertificationEntity"
                              value={formData.guarantor2CertificationEntity}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder="Entidad certificadora"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                      </>
                    )}
                  </div>

                  {/* Botón de envío */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-xl ${
                        isLoading 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:from-green-600 hover:to-emerald-700 hover:scale-[1.02]'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creando contrato...</span>
                        </>
                      ) : (
                        <>
                          <IoSaveOutline className="w-5 h-5 mr-2" />
                          <span>Crear Contrato de Alquiler</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Vista del contrato creado: abrir editor directamente */
                <ContratoEditor
                  lease={leaseCreated}
                  onClose={() => navigate('/contratoAlquiler')}
                />
              )}
            </div>
          </div>
        </div>
        )
      )}
      {/* Modal: Crear nuevo cliente (inquilino) */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <IoPersonAddOutline className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Nuevo Cliente</h3>
                  <p className="text-xs text-emerald-400">Se asignará automáticamente como Inquilino</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowNewClientModal(false); setNewClientErrors({}); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo scrolleable */}
            <form onSubmit={handleNewClientSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={newClientData.name}
                    onChange={handleNewClientChange}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${newClientErrors.name ? 'border-red-500/60 focus:ring-red-500/30' : 'border-white/20 focus:ring-emerald-500/30 focus:border-emerald-500/50'}`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {newClientErrors.name && <p className="mt-1 text-red-400 text-xs">{newClientErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">CUIL / DNI</label>
                  <input
                    type="text"
                    name="cuil"
                    value={newClientData.cuil}
                    onChange={handleNewClientChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newClientData.email}
                    onChange={handleNewClientChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Teléfono *</label>
                  <input
                    type="text"
                    name="mobilePhone"
                    value={newClientData.mobilePhone}
                    onChange={handleNewClientChange}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${newClientErrors.mobilePhone ? 'border-red-500/60 focus:ring-red-500/30' : 'border-white/20 focus:ring-emerald-500/30 focus:border-emerald-500/50'}`}
                    placeholder="Ej: 3835503166"
                  />
                  {newClientErrors.mobilePhone && <p className="mt-1 text-red-400 text-xs">{newClientErrors.mobilePhone}</p>}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Domicilio</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">Provincia</label>
                      <select
                        name="provincia"
                        value={newClientData.provincia}
                        onChange={handleNewClientChange}
                        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                      >
                        <option value="" className="bg-slate-800">Seleccionar</option>
                        {PROVINCIAS_ARGENTINA.map((prov) => (
                          <option key={prov.id} value={prov.name} className="bg-slate-800">{prov.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">Ciudad</label>
                      <select
                        name="ciudad"
                        value={newClientData.ciudad}
                        onChange={handleNewClientChange}
                        disabled={!newClientData.provincia}
                        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-slate-800">
                          {newClientData.provincia ? 'Seleccione' : 'Primero provincia'}
                        </option>
                        {newClientCities.map((ciudad, i) => (
                          <option key={i} value={ciudad} className="bg-slate-800">{ciudad}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">Código Postal</label>
                      <input
                        type="text"
                        name="codigoPostal"
                        value={newClientData.codigoPostal}
                        onChange={handleNewClientChange}
                        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                        placeholder="Ej: 4700"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">Dirección</label>
                      <input
                        type="text"
                        name="direccion"
                        value={newClientData.direccion}
                        onChange={handleNewClientChange}
                        className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm"
                        placeholder="Calle, número..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-4 border-t border-white/10 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowNewClientModal(false); setNewClientErrors({}); }}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  {isCreatingClient ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <IoPersonAddOutline className="w-4 h-4" />
                      <span>Crear e Inquilino</span>
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

CreateLeaseForm.propTypes = {
  preselectedProperty: PropTypes.object,
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};

export default CreateLeaseForm;