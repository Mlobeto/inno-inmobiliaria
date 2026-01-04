import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createProperty,
  getAllClients,
  addPropertyToClientWithRole,
} from "../../redux/Actions/actions";
import {
  loadCloudinaryScript,
  openCloudinaryWidget,
} from "../../cloudinaryConfig";
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
  IoLayersOutline
} from 'react-icons/io5';

import AutorizacionVentaPdf from "../PdfTemplates/AutorizacionVentaPdf";

const CreateProperty = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    address: "",
    neighborhood: "",
    city: "",
    type: "",
    typeProperty: "",
    price: "",
    precioReferencia: "",
    rooms: "",
    bathrooms: "",
    comision: "",
    isAvailable: true,
    description: "",
    escritura: "",
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
  });
  const [showPdfButton, setShowPdfButton] = useState(false);

  const {
    error: propertyError,
    success,
    loading: isSubmitting,
  } = useSelector((state) => state.propertyCreate);

  // Estado de los clientes - selectores optimizados
  const clients = useSelector((state) => state.clients);
  const clientsLoading = useSelector((state) => state.loading);
  const clientsError = useSelector((state) => state.error);

  useEffect(() => {
    dispatch(getAllClients()); // Cargar clientes cuando el componente se monte
  }, [dispatch]);

  const handleWidget = async () => {
    try {
      await loadCloudinaryScript();
      openCloudinaryWidget((uploadedImageUrl) => {
        setFormData((prevFormData) => ({
          ...prevFormData,
          images: [...prevFormData.images, uploadedImageUrl],
        }));
      });
    } catch (error) {
      console.error("Error al cargar el script de Cloudinary:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === "comision" ? Number(value) : value;
    
    // Si cambia el tipo a "alquiler" y el campo requisito está vacío, cargar la plantilla
    if (name === "type" && value === "alquiler" && !formData.requisito) {
      const plantillaRequisito = `REQUISITOS PARA ALQUILAR

1. Fotocopia D.N.I./ CUIL/CUIT, solicitante/s y garante/s, domicilio y teléfono de los mismos, sino es del dominio del documento electrónico.

2. Fotocopia de los últimos tres recibos de sueldo, y certificado de trabajo, si es autónomo justificación de ingresos, esta puede hacer por un Contador y debe pasar por el Colegio Profesional de Ciencias Económicas, para ser certificada.

3. Tipos de garantía: Cantidad: 1 - con recibos de sueldo o certificación de ingresos.
   • Recibo de sueldo no inferior al tercio del monto del alquiler Garante:

DNI:
Domicilio:
Correo electrónico:

4. Los garantes firman el contrato ante escribano para que les certifique la firma, y cuando firme ante escribano deberá ser legalizado por el colegio de Escribanos.

5. Monto del alquiler mensual: 1º Cuatrimestre $$$$$$$$$$ Para los cuatrimestres siguientes de locación el precio será actualizado conforme el índice de precio al consumidor (IPC) que confecciona y publica el Instituto Nacional de Estadísticas y Censos (INDEC).

6. Honorarios de contratos ante escribano y favor de firma inmobiliaria: Igual al monto del alquiler

7. Período de locación: 2 años

8. Certificado de firma ante escribano público.

9. Sellado en rentas provincial

10. No se pide mes de depósito.

11. Reserva con seña 50% del monto del alquiler, validez 7 días hábiles.`;
      
      setFormData({
        ...formData,
        [name]: processedValue,
        requisito: plantillaRequisito
      });
    } else {
      setFormData({
        ...formData,
        [name]: processedValue,
      });
    }
  };

  const handleClientSelect = (e) => {
    const selectedClient = clients?.find(
      (client) => client.idClient === Number(e.target.value)
    );
    console.log("Cliente seleccionado:", selectedClient);
    setFormData((prevData) => ({
      ...prevData,
      idClient: selectedClient ? selectedClient.idClient : "", // Establece el id del cliente
      role: selectedClient ? selectedClient.role : "", // Establece el rol del cliente
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos enviados:", formData);

    // 1. Crear la propiedad con la acción createProperty
    dispatch(createProperty(formData))
      .then((propertyCreated) => {
        console.log("propertyCreated:", propertyCreated);

        if (!propertyCreated || !propertyCreated.propertyId) {
          throw new Error("propertyId no está presente en la respuesta");
        }

        // Crear objeto con la estructura correcta para asignar rol
        const roleData = {
          idClient: parseInt(formData.idClient),
          propertyId: parseInt(propertyCreated.propertyId),
          role: formData.role
        };

        console.log("Enviando datos de rol:", roleData);

        // 2. Asignar el rol al cliente
        return dispatch(addPropertyToClientWithRole(roleData));
      })
      .then((roleResponse) => {
        console.log("Rol asignado exitosamente:", roleResponse);
        // Aquí puedes agregar un mensaje de éxito
      })
      .catch((error) => {
        console.error("Error en el proceso:", error);
        // Aquí puedes mostrar un mensaje de error
      });
};
  useEffect(() => {
    if (success) {
      setFormData({
        address: "",
        neighborhood: "",
        city: "",
        type: "",
        typeProperty: "",
        price: "",
        rooms: "",
        bathrooms: "",
        comision: "",
        isAvailable: true,
        description: "",
        escritura: "",
        images: [],
        plantQuantity: "",
        highlights: "",
        socio: "",
        Inventory: "",
        superficieTotal: "",
        superficieCubierta: "",
      });
    }
  }, [success]);

  useEffect(() => {
    if (formData.type === "venta") {
      setShowPdfButton(true); // Muestra el botón si es una propiedad de venta
    } else {
      setShowPdfButton(false); // No muestra el botón si no es de venta
    }
  }, [formData.type]);

  if (clientsLoading) {
    return <div>Cargando clientes...</div>;
  }

  if (clientsError) {
    return <div>Error al cargar clientes: {clientsError}</div>;
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
              <span className="text-white font-medium">Crear Propiedad</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-full">
              <IoBusinessOutline className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Crear Nueva Propiedad
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Complete los datos de la propiedad para agregarla al sistema
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 text-center backdrop-blur-sm">
            ¡Propiedad creada con éxito!
          </div>
        )}
        {propertyError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-center backdrop-blur-sm">
            Error: {propertyError}
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección Cliente y Propietario */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoPersonOutline className="w-6 h-6 mr-2 text-blue-400" />
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="client" className="block text-slate-300 font-medium mb-2">
                    Cliente *
                  </label>
                  <select
                    id="client"
                    name="client"
                    onChange={handleClientSelect}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione un cliente</option>
                    {clients?.map((client) => (
                      <option key={client.idClient} value={client.idClient} className="bg-slate-800">
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="role" className="block text-slate-300 font-medium mb-2">
                    Rol del Cliente *
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione un rol</option>
                    <option value="propietario" className="bg-slate-800">Propietario (Para Alquiler)</option>
                    <option value="vendedor" className="bg-slate-800">Vendedor (Para venta)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="socio" className="block text-slate-300 font-medium mb-2">
                    Socio
                  </label>
                  <input
                    type="text"
                    id="socio"
                    name="socio"
                    value={formData.socio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Nombre - CUIL - Domicilio"
                  />
                </div>
              </div>
            </div>

            {/* Sección Ubicación */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoLocationOutline className="w-6 h-6 mr-2 text-emerald-400" />
                Ubicación de la Propiedad
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="address" className="block text-slate-300 font-medium mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Ingrese la dirección"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="neighborhood" className="block text-slate-300 font-medium mb-2">
                    Barrio *
                  </label>
                  <input
                    type="text"
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Ingrese el barrio"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-slate-300 font-medium mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Ingrese la ciudad"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección Tipo de Propiedad */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoLayersOutline className="w-6 h-6 mr-2 text-purple-400" />
                Tipo y Características
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="type" className="block text-slate-300 font-medium mb-2">
                    Tipo de Transacción *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione</option>
                    <option value="alquiler" className="bg-slate-800">Alquiler</option>
                    <option value="venta" className="bg-slate-800">Venta</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="typeProperty" className="block text-slate-300 font-medium mb-2">
                    Tipo de Propiedad *
                  </label>
                  <select
                    id="typeProperty"
                    name="typeProperty"
                    value={formData.typeProperty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione</option>
                    <option value="casa" className="bg-slate-800">Casa</option>
                    <option value="departamento" className="bg-slate-800">Departamento</option>
                    <option value="duplex" className="bg-slate-800">Duplex</option>
                    <option value="finca" className="bg-slate-800">Finca</option>
                    <option value="local" className="bg-slate-800">Local Comercial</option>
                    <option value="lote" className="bg-slate-800">Lote</option>
                    <option value="oficina" className="bg-slate-800">Oficina</option>
                    <option value="terreno" className="bg-slate-800">Terreno</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rooms" className="block text-slate-300 font-medium mb-2">
                    Ambientes
                  </label>
                  <select
                    id="rooms"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione</option>
                    <option value="1" className="bg-slate-800">Monoambiente</option>
                    <option value="2" className="bg-slate-800">2 Ambientes</option>
                    <option value="3" className="bg-slate-800">3 Ambientes</option>
                    <option value="4" className="bg-slate-800">4 Ambientes</option>
                    <option value="5" className="bg-slate-800">Más de 4 Ambientes</option>
                  </select>
                </div>
              </div>

              {/* Campos adicionales para finca */}
              {formData.typeProperty === "finca" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-4 bg-amber-500/10 rounded-lg border border-amber-400/20">
                  <div>
                    <label htmlFor="plantType" className="block text-slate-300 font-medium mb-2">
                      Tipo de Planta
                    </label>
                    <input
                      type="text"
                      id="plantType"
                      name="plantType"
                      value={formData.plantType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Ej: Vid, Olivo, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="plantQuantity" className="block text-slate-300 font-medium mb-2">
                      Cantidad de Plantas
                    </label>
                    <input
                      type="number"
                      id="plantQuantity"
                      name="plantQuantity"
                      value={formData.plantQuantity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Número de plantas"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sección Detalles y Precios */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoPricetagOutline className="w-6 h-6 mr-2 text-amber-400" />
                Detalles y Precios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Baños - Ocultar para lotes y terrenos */}
                {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                  <div>
                    <label htmlFor="bathrooms" className="block text-slate-300 font-medium mb-2">
                      Cuartos de Baño
                    </label>
                    <select
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    >
                      <option value="" className="bg-slate-800">Seleccione</option>
                      <option value="1" className="bg-slate-800">1 Baño</option>
                      <option value="2" className="bg-slate-800">2 Baños</option>
                      <option value="3" className="bg-slate-800">3 Baños</option>
                      <option value="4" className="bg-slate-800">4 Baños</option>
                      <option value="5" className="bg-slate-800">Más de 4 Baños</option>
                    </select>
                  </div>
                )}

                {/* Campos específicos para lotes y terrenos */}
                {(formData.typeProperty === "lote" || formData.typeProperty === "terreno") && (
                  <>
                    <div>
                      <label htmlFor="frente" className="block text-slate-300 font-medium mb-2">
                        Frente *
                      </label>
                      <input
                        type="text"
                        id="frente"
                        name="frente"
                        value={formData.frente}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Ej: 15 metros"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="profundidad" className="block text-slate-300 font-medium mb-2">
                        Profundidad *
                      </label>
                      <input
                        type="text"
                        id="profundidad"
                        name="profundidad"
                        value={formData.profundidad}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Ej: 30 metros"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="price" className="block text-slate-300 font-medium mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Ingrese el precio"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="precioReferencia" className="block text-slate-300 font-medium mb-2">
                    Precio de Referencia
                    <span className="text-slate-400 text-sm ml-2">(Opcional - Solo para consulta interna)</span>
                  </label>
                  <input
                    type="number"
                    id="precioReferencia"
                    name="precioReferencia"
                    value={formData.precioReferencia}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Precio de referencia (interno)"
                  />
                </div>

                <div>
                  <label htmlFor="comision" className="block text-slate-300 font-medium mb-2">
                    Comisión *
                  </label>
                  <input
                    type="number"
                    id="comision"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Porcentaje de comisión"
                    required
                  />
                </div>

                {/* Superficie Cubierta - Ocultar para lotes y terrenos */}
                {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                  <div>
                    <label htmlFor="superficieCubierta" className="block text-slate-300 font-medium mb-2">
                      Superficie Cubierta *
                    </label>
                    <input
                      type="text"
                      id="superficieCubierta"
                      name="superficieCubierta"
                      value={formData.superficieCubierta}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Ej: 120 m²"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="superficieTotal" className="block text-slate-300 font-medium mb-2">
                    {formData.typeProperty === "lote" || formData.typeProperty === "terreno" ? "Superficie *" : "Superficie Total *"}
                  </label>
                  <input
                    type="text"
                    id="superficieTotal"
                    name="superficieTotal"
                    value={formData.superficieTotal}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                    placeholder={formData.typeProperty === "lote" || formData.typeProperty === "terreno" ? "Ej: 450 m²" : "Ej: 180 m²"}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="escritura" className="block text-slate-300 font-medium mb-2">
                    Estado de Escritura
                  </label>
                  <select
                    id="escritura"
                    name="escritura"
                    value={formData.escritura}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <option value="" className="bg-slate-800">Seleccione</option>
                    <option value="prescripcion en tramite" className="bg-slate-800">Prescripción en Trámite</option>
                    <option value="escritura" className="bg-slate-800">Escritura</option>
                    <option value="prescripcion adjudicada" className="bg-slate-800">Prescripción Adjudicada</option>
                    <option value="posesion" className="bg-slate-800">Posesión</option>
                    <option value="sesión de derechos posesorios" className="bg-slate-800">Sesión de Derechos Posesorios</option>
                  </select>
                </div>

                {/* Campo Matrícula o Padrón */}
                <div>
                  <label htmlFor="matriculaOPadron" className="block text-slate-300 font-medium mb-2">
                    Matrícula o Padrón
                  </label>
                  <input
                    type="text"
                    id="matriculaOPadron"
                    name="matriculaOPadron"
                    value={formData.matriculaOPadron}
                    onChange={handleChange}
                    placeholder="Ej: 123456789 o Padrón 12345"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sección Información Adicional */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoDocumentTextOutline className="w-6 h-6 mr-2 text-indigo-400" />
                Información Adicional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="description" className="block text-slate-300 font-medium mb-2">
                    Descripción *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm resize-none"
                    placeholder="Describa las características principales de la propiedad..."
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="highlights" className="block text-slate-300 font-medium mb-2">
                      Puntos Destacados
                    </label>
                    <input
                      type="text"
                      id="highlights"
                      name="highlights"
                      value={formData.highlights}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="Ej: Cerca del centro, excelente estado..."
                    />
                  </div>

                  {/* Inventario - Ocultar para lotes y terrenos */}
                  {formData.typeProperty !== "lote" && formData.typeProperty !== "terreno" && (
                    <div>
                      <label htmlFor="inventory" className="block text-slate-300 font-medium mb-2">
                        Inventario
                      </label>
                      <input
                        type="text"
                        id="inventory"
                        name="inventory"
                        value={formData.inventory}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Detalle del inventario incluido"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="linkInstagram" className="block text-slate-300 font-medium mb-2">
                      Link de Instagram
                    </label>
                    <input
                      type="url"
                      id="linkInstagram"
                      name="linkInstagram"
                      value={formData.linkInstagram}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="https://instagram.com/p/..."
                    />
                  </div>

                  <div>
                    <label htmlFor="linkMaps" className="block text-slate-300 font-medium mb-2">
                      Link de Google Maps
                    </label>
                    <input
                      type="url"
                      id="linkMaps"
                      name="linkMaps"
                      value={formData.linkMaps}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>

                  {/* Campo Requisito - Solo para propiedades en alquiler */}
                  {formData.type === "alquiler" && (
                    <div>
                      <label htmlFor="requisito" className="block text-slate-300 font-medium mb-2">
                        Requisitos de Alquiler
                      </label>
                      <textarea
                        id="requisito"
                        name="requisito"
                        value={formData.requisito}
                        onChange={handleChange}
                        rows="10"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 backdrop-blur-sm font-mono text-sm"
                        placeholder="Requisitos específicos para esta propiedad..."
                      />
                      <p className="text-slate-400 text-xs mt-1">
                        Deja en blanco para usar la plantilla por defecto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Imágenes */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <IoCloudUploadOutline className="w-6 h-6 mr-2 text-cyan-400" />
                Imágenes de la Propiedad
              </h3>
              
              {/* Botón de subir imágenes */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleWidget}
                  className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <IoCloudUploadOutline className="w-6 h-6" />
                  <span>Subir Imágenes desde Cloudinary</span>
                </button>
                <p className="text-slate-400 text-sm mt-2">
                  Sube múltiples imágenes para mostrar la propiedad desde diferentes ángulos
                </p>
              </div>

              {/* Grid de imágenes */}
              {formData.images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      Imágenes subidas ({formData.images.length})
                    </h4>
                    <div className="text-sm text-slate-300 bg-white/10 px-3 py-1 rounded-full">
                      {formData.images.length} imagen{formData.images.length !== 1 ? 'es' : ''}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-white/10 rounded-lg overflow-hidden border border-white/20 hover:border-cyan-400/50 transition-all duration-300">
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
                              className="flex items-center space-x-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 transform hover:scale-105"
                            >
                              <IoTrashOutline className="w-4 h-4" />
                              <span className="text-sm">Eliminar</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Número de imagen */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Información adicional */}
                  <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <IoCloudUploadOutline className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-medium mb-1">Gestión de Imágenes</h5>
                        <p className="text-cyan-200 text-sm">
                          Puedes eliminar cualquier imagen haciendo hover sobre ella y haciendo clic en &quot;Eliminar&quot;. 
                          Las imágenes se mostrarán en el orden que las subiste.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estado vacío */}
              {formData.images.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-cyan-500/20 rounded-full">
                      <IoCloudUploadOutline className="w-12 h-12 text-cyan-400" />
                    </div>
                  </div>
                  <h4 className="text-white font-medium mb-2">No hay imágenes subidas</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Sube imágenes de alta calidad para mostrar las mejores características de la propiedad
                  </p>
                </div>
              )}
            </div>

            {/* PDF de Autorización */}
            {showPdfButton && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <IoDocumentTextOutline className="w-6 h-6 mr-2 text-amber-400" />
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

            {/* Botón de envío */}
            <div className="flex justify-center pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg ${
                  isSubmitting 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:from-emerald-600 hover:to-green-600 transform hover:scale-105 hover:shadow-xl'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
    </div>
  );
};

export default CreateProperty;