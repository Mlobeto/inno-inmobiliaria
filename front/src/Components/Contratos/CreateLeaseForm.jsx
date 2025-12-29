import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createLease,
  getPropertiesById,
  addPropertyToClientWithRole,
  getAllClients,
  createGarantorsForLease,
} from "../../redux/Actions/actions";
import Listado from "../Propiedades/Listado";
import Swal from "sweetalert2";
import ContratoAlquiler from "../PdfTemplates/ContratoAlquiler";
import {
  IoDocumentTextOutline,
  IoBusinessOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoTimeOutline,
  IoClipboardOutline,
  IoShieldCheckmarkOutline,
  IoSaveOutline,
  IoCloseOutline,
} from "react-icons/io5";

const CreateLeaseForm = () => {
  const dispatch = useDispatch();
  const property = useSelector((state) => state.property);
  const [isLoading, setIsLoading] = useState(false);
  const clients = useSelector((state) => state.clients);
  const [leaseCreated, setLeaseCreated] = useState(null);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedClient, setSelectedClient] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [pdfData, setPdfData] = useState(null);

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

  useEffect(() => {
    dispatch(getAllClients());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredActiveLeases = (leases) => {
    return leases.filter((lease) => {
      const endDate = new Date(lease.startDate);
      endDate.setMonth(endDate.getMonth() + lease.totalMonths);
      return endDate > new Date();
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "locatario") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      const filtered = clients.filter((client) =>
        client.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientList(value.length > 0);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleClientSelect = (client) => {
    setFormData((prevData) => ({
      ...prevData,
      locatario: client.name,
      locatarioId: client.idClient,
    }));
    setSelectedClient(client);
    setFilteredClients([]);
    setShowClientList(false);
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
      const leaseData = {
        propertyId: formData.propertyId,
        landlordId: formData.landlordId,
        tenantId: formData.locatarioId,
        startDate: formData.startDate,
        rentAmount: parseFloat(formData.rentAmount),
        updateFrequency: formData.updateFrequency,
        commission: parseFloat(formData.commission),
        totalMonths: parseInt(formData.totalMonths),
        inventory: formData.inventory,
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

        if (guarantorsData.length > 0) {
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

        setLeaseCreated(createdLease);
        setPdfData(createdLease);

        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Contrato de alquiler creado exitosamente.",
        });
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

  return (
    <div className="min-h-screen">
      {/* Mostrar Listado si no hay propiedad seleccionada */}
      {!formData.propertyId ? (
        <Listado mode="lease" onSelectProperty={handlePropertySelect} />
      ) : (
        // Modal overlay con formulario
        formData.propertyId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <IoDocumentTextOutline className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">
                  Crear Contrato de Alquiler
                </h2>
              </div>
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, propertyId: "" }));
                  setLeaseCreated(null);
                }}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
            </div>

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

                  {/* Información básica del contrato */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3">
                      Información del Contrato
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inquilino */}
                      <div className="space-y-2 relative">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-purple-400" />
                          Inquilino
                        </label>
                        <input
                          type="text"
                          name="locatario"
                          value={formData.locatario}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                          placeholder="Buscar inquilino..."
                          required
                        />
                        {showClientList && filteredClients.length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                            {filteredClients.map(client => (
                              <div
                                key={client.idClient}
                                className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                                onClick={() => handleClientSelect(client)}
                              >
                                <p className="text-white font-medium">{client.name}</p>
                                <p className="text-slate-400 text-sm">{client.email}</p>
                              </div>
                            ))}
                          </div>
                        )}
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

                  {/* Información de garantes */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-3 flex items-center">
                      <IoShieldCheckmarkOutline className="w-6 h-6 mr-2 text-green-400" />
                      Información de Garantes
                    </h3>

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
                /* Vista del contrato creado */
                <div className="text-center space-y-6">
                  <div className="mb-6">
                    <IoDocumentTextOutline className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">¡Contrato Creado Exitosamente!</h3>
                    <p className="text-slate-400">El contrato de alquiler ha sido generado correctamente</p>
                  </div>
                  
                  <ContratoAlquiler
                    lease={leaseCreated}
                    propertyData={property}
                    guarantor1Data={{
                      name: formData.guarantor1Name,
                      cuil: formData.guarantor1Cuil,
                      direccion: formData.guarantor1Direccion,
                      description: formData.guarantor1Description,
                      certificationEntity: formData.guarantor1CertificationEntity,
                    }}
                    guarantor2Data={{
                      name: formData.guarantor2Name,
                      cuil: formData.guarantor2Cuil,
                      direccion: formData.guarantor2Direccion,
                      description: formData.guarantor2Description,
                      certificationEntity: formData.guarantor2CertificationEntity,
                    }}
                  />
                  
                  <div className="flex gap-4 justify-center pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          propertyId: "",
                          locador: "",
                          locatario: "",
                          locatarioId: "",
                          startDate: "",
                          rentAmount: "",
                          updateFrequency: "",
                          commission: "",
                          totalMonths: "",
                          inventory: "",
                          guarantor1Name: "",
                          guarantor1Cuil: "",
                          guarantor1Direccion: "",
                          guarantor1Description: "",
                          guarantor1CertificationEntity: "",
                          guarantor2Name: "",
                          guarantor2Cuil: "",
                          guarantor2Direccion: "",
                          guarantor2Description: "",
                          guarantor2CertificationEntity: "",
                        });
                        setLeaseCreated(null);
                        setPdfData(null);
                        setFilteredClients([]);
                        setShowClientList(false);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Crear Nuevo Contrato
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, propertyId: "" }));
                        setLeaseCreated(null);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-300"
                    >
                      Volver al Listado
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )
      )}
    </div>
  );
};

export default CreateLeaseForm;