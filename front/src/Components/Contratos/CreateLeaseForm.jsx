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
import {
  modalOverlay,
  modalBox,
  modalHeader,
  btnPrimary,
  btnSecondary,
  btnGhost,
  inputClass,
  selectClass,
  labelClass,
  formSectionAccent,
  formSectionAccentTitle,
  alertSuccess,
  spinner,
} from '../Propiedades/propiedadesTheme';
import { useFormTour } from '../../hooks/useFormTour';
import { getContratosFormTourSteps } from '../../constants/formTourSteps';

const fieldClass = `${inputClass} py-1.5 text-sm rounded-lg`;
const fieldSelect = `${selectClass} py-1.5 text-sm rounded-lg w-full`;
const sectionTitle = 'text-sm font-semibold text-textPrimary border-b border-borderBase pb-2';

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

  const [step, setStep] = useState(1);
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
    agencyCommissionType: "months",
    agencyCommissionValue: "1",
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

  useFormTour('contratos', getContratosFormTourSteps, [formData.propertyId, step], {
    enabled: Boolean(formData.propertyId) && step === 1 && !leaseCreated,
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
    setRenterSearch('');
    setShowRenterDropdown(false);
  };

  const canGoToStep2 = () =>
    formData.locatarioId &&
    formData.startDate &&
    formData.rentAmount &&
    formData.updateFrequency &&
    formData.totalMonths;

  const handleNextStep = () => {
    if (!canGoToStep2()) {
      Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Completá inquilino, fechas, montos y duración.' });
      return;
    }
    setStep(2);
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
        agencyCommissionType:  formData.agencyCommissionType  || null,
        agencyCommissionValue: formData.agencyCommissionValue ? parseFloat(formData.agencyCommissionValue) : null,
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
          agencyCommissionType: "months", agencyCommissionValue: "1",
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
    <div className={isModal ? '' : 'min-h-screen'}>
      {!formData.propertyId ? (
        (isModal || propertyFromRoute) ? (
          <div className="flex items-center justify-center p-8">
            <div className={`w-8 h-8 ${spinner} border-2 mr-3`} />
            <span className="text-textSecondary text-sm">Cargando propiedad...</span>
          </div>
        ) : (
          <Listado mode="lease" onSelectProperty={handlePropertySelect} />
        )
      ) : (
        formData.propertyId && (
        <div className={isModal ? '' : `${modalOverlay} p-4`}>
          <div className={isModal ? '' : `${modalBox} max-w-3xl w-full`}>
            {!isModal && (
              <div className={`${modalHeader} bg-brand-subtle/30`}>
                <div className="flex items-center gap-2">
                  <IoDocumentTextOutline className="w-5 h-5 text-brand-light" />
                  <h2 className="text-lg font-bold text-textPrimary">Crear Contrato de Alquiler</h2>
                </div>
                <button type="button" onClick={handleClose} className={btnGhost}>
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className={isModal ? 'p-4' : 'p-4'}>
              {!leaseCreated ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Propiedad + pasos */}
                  <div id="tour-contrato-propiedad" className={`${formSectionAccent} py-2 px-3 flex flex-wrap items-center justify-between gap-2 text-sm`}>
                    <div className="flex items-center gap-2 text-textSecondary">
                      <IoBusinessOutline className="w-4 h-4 text-brand-light shrink-0" />
                      <span className="text-textPrimary font-medium">#{formData.propertyId}</span>
                      <span className="text-textMuted">· {formData.locador || 'Sin propietario'}</span>
                    </div>
                    <div id="tour-contrato-pasos" className="flex gap-1">
                      {['Datos', 'Garantía'].map((label, i) => {
                        const n = i + 1;
                        const active = step === n;
                        return (
                          <span
                            key={label}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              active ? 'bg-brand text-textWhite' : 'bg-bgElevated text-textMuted border border-borderBase'
                            }`}
                          >
                            {n}. {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {templateWarning && !templateWarning.hasTemplates && (
                    <div className={`${alertSuccess} py-2 px-3 text-xs`}>
                      Sin plantilla de {templateWarning.typeName}.{' '}
                      <button
                        type="button"
                        className="underline text-brand-light hover:text-textPrimary"
                        onClick={() => navigate('/admin/plantillas')}
                      >
                        Configurar
                      </button>
                    </div>
                  )}

                  {step === 1 && (
                  <div className="space-y-3">
                    <h3 className={sectionTitle}>Información del contrato</h3>
                    <div id="tour-contrato-condiciones" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Inquilino */}
                      <div id="tour-contrato-inquilino" className="space-y-1 sm:col-span-2">
                        <input
                          type="hidden"
                          id="tour-contrato-locatarioId"
                          value={formData.locatarioId || ''}
                          readOnly
                          aria-hidden
                        />
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoPersonOutline className="w-3.5 h-3.5 text-brand-light" />
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
                              className={fieldClass}
                            />
                            {showRenterDropdown && (
                              <ul className="absolute z-50 w-full mt-1 bg-bgElevated border border-borderStrong rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                {(clients || [])
                                  .filter(c => c.name.toLowerCase().includes(renterSearch.toLowerCase()))
                                  .map(client => (
                                    <li
                                      key={client.idClient}
                                      onMouseDown={() => handleRenterSelect(client)}
                                      className="px-3 py-2 text-textPrimary hover:bg-brand-subtle cursor-pointer text-sm border-b border-borderBase last:border-b-0"
                                    >
                                      <p className="font-medium">{client.name}</p>
                                      {client.email && <p className="text-textMuted text-xs">{client.email}</p>}
                                    </li>
                                  ))}
                                {(clients || []).filter(c => c.name.toLowerCase().includes(renterSearch.toLowerCase())).length === 0 && (
                                  <li
                                    onMouseDown={() => {
                                      setShowRenterDropdown(false);
                                      setNewClientData(prev => ({ ...prev, name: renterSearch }));
                                      setShowNewClientModal(true);
                                    }}
                                    className="px-3 py-2 text-brand-light hover:bg-brand-subtle cursor-pointer text-sm flex items-center gap-2"
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
                            className={`${btnSecondary} px-2.5 py-1.5 shrink-0`}
                          >
                            <IoPersonAddOutline className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Fecha de inicio */}
                      <div className="space-y-1">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoCalendarOutline className="w-3.5 h-3.5 text-brand-light" />
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className={fieldClass}
                          required
                        />
                      </div>

                      {/* Monto de alquiler */}
                      <div className="space-y-1">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoCashOutline className="w-3.5 h-3.5 text-brand-light" />
                          Monto de Alquiler
                        </label>
                        <input
                          type="number"
                          name="rentAmount"
                          value={formData.rentAmount}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Monto mensual..."
                          required
                        />
                      </div>

                      {/* Frecuencia de actualización */}
                      <div className="space-y-1">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoTimeOutline className="w-3.5 h-3.5 text-brand-light" />
                          Frecuencia de Actualización
                        </label>
                        <select
                          name="updateFrequency"
                          value={formData.updateFrequency}
                          onChange={handleInputChange}
                          className={fieldClass}
                          required
                        >
                          <option value="" className="bg-bgElevated">Seleccionar frecuencia</option>
                          <option value="semestral" className="bg-bgElevated">Semestral</option>
                          <option value="cuatrimestral" className="bg-bgElevated">Cuatrimestral</option>
                          <option value="anual" className="bg-bgElevated">Anual</option>
                        </select>
                      </div>

                      {/* Comisión mensual al propietario (%) */}
                      <div className="space-y-1">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoCashOutline className="w-3.5 h-3.5 text-brand-light" />
                          Comisión mensual al propietario (%)
                        </label>
                        <input
                          type="number"
                          name="commission"
                          value={formData.commission}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Ej: 10 (% sobre cada cuota)"
                        />
                      </div>

                      {/* Honorarios de la inmobiliaria por contrato */}
                      <div className="space-y-2 md:col-span-2">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoCashOutline className="w-3.5 h-3.5 text-brand-light" />
                          Honorarios inmobiliaria
                        </label>
                        <div className="flex gap-3">
                          <select
                            name="agencyCommissionType"
                            value={formData.agencyCommissionType}
                            onChange={handleInputChange}
                            className={`${fieldSelect} flex-shrink-0`}
                          >
                            <option value="months" className="bg-bgElevated">Meses de alquiler</option>
                            <option value="amount" className="bg-bgElevated">Monto fijo ($)</option>
                          </select>
                          <input
                            type="number"
                            name="agencyCommissionValue"
                            value={formData.agencyCommissionValue}
                            onChange={handleInputChange}
                            min="0"
                            step={formData.agencyCommissionType === 'months' ? '0.5' : '1'}
                            className={`${fieldClass} flex-1`}
                            placeholder={formData.agencyCommissionType === 'months' ? 'Ej: 1 o 2' : 'Monto en $'}
                          />
                        </div>
                        {/* Preview del monto */}
                        {formData.rentAmount && formData.agencyCommissionValue && (
                          <p className="text-xs text-customYellow font-medium">
                            {formData.agencyCommissionType === 'months'
                              ? `= $ ${(parseFloat(formData.rentAmount) * parseFloat(formData.agencyCommissionValue)).toLocaleString('es-AR')} (${formData.agencyCommissionValue} mes${parseFloat(formData.agencyCommissionValue) !== 1 ? 'es' : ''} de alquiler)`
                              : `= $ ${parseFloat(formData.agencyCommissionValue).toLocaleString('es-AR')}`
                            }
                          </p>
                        )}
                        <p className="text-xs text-textMuted">Se registrará como pago pendiente al propietario.</p>
                      </div>

                      {/* Duración en meses */}
                      <div className="space-y-1">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoCalendarOutline className="w-3.5 h-3.5 text-brand-light" />
                          Duración (meses)
                        </label>
                        <input
                          type="number"
                          name="totalMonths"
                          value={formData.totalMonths}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Meses totales..."
                          required
                        />
                      </div>
                    </div>

                    {/* Inventario */}
                    <div className="space-y-2">
                        <label className={`${labelClass} flex items-center gap-1.5`}>
                          <IoClipboardOutline className="w-3.5 h-3.5 text-brand-light" />
                        Inventario
                      </label>
                      <textarea
                        name="inventory"
                        value={formData.inventory}
                        onChange={handleInputChange}
                        rows={2}
                        className={`${fieldClass} resize-none`}
                        placeholder="Inventario (opcional)..."
                      />
                    </div>
                    <button id="tour-contrato-siguiente" type="button" onClick={handleNextStep} className={`${btnPrimary} w-full py-2 text-sm`}>
                      Siguiente: Garantía →
                    </button>
                  </div>
                  )}

                  {step === 2 && (
                  <div className="space-y-3">
                    <h3 className={`${sectionTitle} flex items-center gap-2`}>
                      <IoShieldCheckmarkOutline className="w-4 h-4 text-brand-light" />
                      Tipo de garantía
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, garantiaType: 'garantes' }))}
                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                          formData.garantiaType === 'garantes'
                            ? 'border-brand bg-brand-muted text-brand-light'
                            : 'border-borderBase bg-bgElevated text-textSecondary hover:border-borderStrong'
                        }`}
                      >
                        <IoShieldCheckmarkOutline className="w-5 h-5" />
                        Garantes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, garantiaType: 'seguro_caucion' }))}
                        className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                          formData.garantiaType === 'seguro_caucion'
                            ? 'border-brand bg-brand-muted text-brand-light'
                            : 'border-borderBase bg-bgElevated text-textSecondary hover:border-borderStrong'
                        }`}
                      >
                        <IoDocumentTextOutline className="w-5 h-5" />
                        Seguro de caución
                      </button>
                    </div>

                    {formData.garantiaType === 'seguro_caucion' && (
                      <div className={`${formSectionAccent} p-3 space-y-2`}>
                        <h4 className={formSectionAccentTitle}>Datos del seguro</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className={labelClass}>Compañía aseguradora *</label>
                            <input
                              type="text"
                              name="seguroCaucionCompania"
                              value={formData.seguroCaucionCompania}
                              onChange={handleInputChange}
                              className={fieldClass}
                              placeholder="Ej: Sancor Seguros, Zurich..."
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className={labelClass}>Número de póliza</label>
                            <input
                              type="text"
                              name="seguroCaucionPoliza"
                              value={formData.seguroCaucionPoliza}
                              onChange={handleInputChange}
                              className={fieldClass}
                              placeholder="Número de póliza"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className={labelClass}>Vigencia hasta</label>
                            <input
                              type="date"
                              name="seguroCaucionVigencia"
                              value={formData.seguroCaucionVigencia}
                              onChange={handleInputChange}
                              className={fieldClass}
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className={labelClass}>Observaciones</label>
                            <textarea
                              name="seguroCaucionNotas"
                              value={formData.seguroCaucionNotas}
                              onChange={handleInputChange}
                              rows={2}
                              className={`${fieldClass} resize-none sm:col-span-2`}
                              placeholder="Datos adicionales del seguro, condiciones, etc."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.garantiaType === 'garantes' && (
                      <>
                    <div className="rounded-lg border border-borderBase bg-bgElevated p-3 space-y-2">
                      <h4 className="text-sm font-medium text-textPrimary">Garante 1</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          name="guarantor1Name"
                          value={formData.guarantor1Name}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Nombre completo del garante"
                        />
                        <input
                          type="text"
                          name="guarantor1Cuil"
                          value={formData.guarantor1Cuil}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="CUIL del garante"
                        />
                        <input
                          type="text"
                          name="guarantor1Direccion"
                          value={formData.guarantor1Direccion}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Dirección"
                        />
                        <input
                          type="email"
                          name="guarantor1Email"
                          value={formData.guarantor1Email}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          name="guarantor1MobilePhone"
                          value={formData.guarantor1MobilePhone}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Teléfono (10 dígitos)"
                          maxLength="10"
                        />
                        <select
                          name="guarantor1Description"
                          value={formData.guarantor1Description}
                          onChange={handleInputChange}
                          className={fieldSelect}
                        >
                          <option value="" className="bg-bgElevated">Tipo de documentación</option>
                          <option value="recibos" className="bg-bgElevated">Recibos de sueldo</option>
                          <option value="certificacion" className="bg-bgElevated">Certificación de ingresos</option>
                          <option value="escritura" className="bg-bgElevated">Escritura de propiedad</option>
                        </select>
                        {formData.guarantor1Description === "certificacion" && (
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              name="guarantor1CertificationEntity"
                              value={formData.guarantor1CertificationEntity}
                              onChange={handleInputChange}
                              className={fieldClass}
                              placeholder="Entidad certificadora"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-borderBase bg-bgElevated p-3 space-y-2">
                      <h4 className="text-sm font-medium text-textPrimary">Garante 2 (opcional)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          name="guarantor2Name"
                          value={formData.guarantor2Name}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Nombre completo del garante"
                        />
                        <input
                          type="text"
                          name="guarantor2Cuil"
                          value={formData.guarantor2Cuil}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="CUIL del garante"
                        />
                        <input
                          type="text"
                          name="guarantor2Direccion"
                          value={formData.guarantor2Direccion}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Dirección"
                        />
                        <input
                          type="email"
                          name="guarantor2Email"
                          value={formData.guarantor2Email}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          name="guarantor2MobilePhone"
                          value={formData.guarantor2MobilePhone}
                          onChange={handleInputChange}
                          className={fieldClass}
                          placeholder="Teléfono (10 dígitos)"
                          maxLength="10"
                        />
                        <select
                          name="guarantor2Description"
                          value={formData.guarantor2Description}
                          onChange={handleInputChange}
                          className={fieldSelect}
                        >
                          <option value="" className="bg-bgElevated">Tipo de documentación</option>
                          <option value="recibos" className="bg-bgElevated">Recibos de sueldo</option>
                          <option value="certificacion" className="bg-bgElevated">Certificación de ingresos</option>
                          <option value="escritura" className="bg-bgElevated">Escritura de propiedad</option>
                        </select>
                        {formData.guarantor2Description === "certificacion" && (
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              name="guarantor2CertificationEntity"
                              value={formData.guarantor2CertificationEntity}
                              onChange={handleInputChange}
                              className={fieldClass}
                              placeholder="Entidad certificadora"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setStep(1)} className={`${btnSecondary} flex-1 py-2 text-sm`}>
                        ← Anterior
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !formData.garantiaType}
                        className={`${btnPrimary} flex-1 py-2 text-sm disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className={`w-4 h-4 ${spinner} border-2`} />
                            Creando...
                          </span>
                        ) : (
                          <>
                            <IoSaveOutline className="w-4 h-4 inline mr-1" />
                            Crear contrato
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  )}
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
        <div className={`${modalOverlay} z-[60]`}>
          <div className={`${modalBox} max-w-md w-full`}>
            <div className={modalHeader}>
              <div className="flex items-center gap-2">
                <IoPersonAddOutline className="w-5 h-5 text-brand-light" />
                <div>
                  <h3 className="text-sm font-bold text-textPrimary">Nuevo Cliente</h3>
                  <p className="text-xs text-textMuted">Se asignará como inquilino</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowNewClientModal(false); setNewClientErrors({}); }}
                className={btnGhost}
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNewClientSubmit}>
              <div className="p-4 space-y-3">
                <div>
                  <label className={labelClass}>Nombre completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={newClientData.name}
                    onChange={handleNewClientChange}
                    className={`${fieldClass} ${newClientErrors.name ? 'border-customRed/60' : ''}`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {newClientErrors.name && <p className="mt-1 text-customRed text-xs">{newClientErrors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>CUIL / DNI</label>
                  <input type="text" name="cuil" value={newClientData.cuil} onChange={handleNewClientChange} className={fieldClass} placeholder="XX-XXXXXXXX-X" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={newClientData.email} onChange={handleNewClientChange} className={fieldClass} placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input
                    type="text"
                    name="mobilePhone"
                    value={newClientData.mobilePhone}
                    onChange={handleNewClientChange}
                    className={`${fieldClass} ${newClientErrors.mobilePhone ? 'border-customRed/60' : ''}`}
                    placeholder="Ej: 3835503166"
                  />
                  {newClientErrors.mobilePhone && <p className="mt-1 text-customRed text-xs">{newClientErrors.mobilePhone}</p>}
                </div>
                <div className="border-t border-borderBase pt-3">
                  <p className="text-textMuted text-xs font-semibold uppercase mb-2">Domicilio</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Provincia</label>
                      <select name="provincia" value={newClientData.provincia} onChange={handleNewClientChange} className={fieldSelect}>
                        <option value="">Seleccionar</option>
                        {PROVINCIAS_ARGENTINA.map((prov) => (
                          <option key={prov.id} value={prov.name}>{prov.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Ciudad</label>
                      <select name="ciudad" value={newClientData.ciudad} onChange={handleNewClientChange} disabled={!newClientData.provincia} className={fieldSelect}>
                        <option value="">{newClientData.provincia ? 'Seleccione' : 'Primero provincia'}</option>
                        {newClientCities.map((ciudad, i) => (
                          <option key={i} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>C.P.</label>
                      <input type="text" name="codigoPostal" value={newClientData.codigoPostal} onChange={handleNewClientChange} className={fieldClass} placeholder="4700" />
                    </div>
                    <div>
                      <label className={labelClass}>Dirección</label>
                      <input type="text" name="direccion" value={newClientData.direccion} onChange={handleNewClientChange} className={fieldClass} placeholder="Calle, número" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-4 border-t border-borderBase">
                <button type="button" onClick={() => { setShowNewClientModal(false); setNewClientErrors({}); }} className={`${btnSecondary} flex-1 text-sm`}>
                  Cancelar
                </button>
                <button type="submit" disabled={isCreatingClient} className={`${btnPrimary} flex-1 text-sm`}>
                  {isCreatingClient ? 'Creando...' : 'Crear inquilino'}
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