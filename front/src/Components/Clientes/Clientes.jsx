import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createClient, resetCreateClientState } from "../../redux/Actions/actions";
import { useNavigate } from 'react-router-dom';
import { 
  IoArrowBackOutline, 
  IoPersonAddOutline, 
  IoPersonOutline,
  IoMailOutline,
  IoLocationOutline,
  IoPhonePortraitOutline,
  IoCardOutline,
  IoHomeOutline,
  IoSaveOutline,
  IoWarningOutline
} from 'react-icons/io5';

const initialState = {
  cuil: "",
  name: "",
  email: "",
  direccion: "",
  ciudad: "",
  provincia: "Catamarca",
  mobilePhone: "",
};

const CreateClientForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialState);

  const { loading, error, success } = useSelector((state) => state.clientCreate);

  // Limpiar el estado cuando el componente se monta
  useEffect(() => {
    dispatch(resetCreateClientState());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(createClient(formData));
      // El formulario se limpiará después de que el efecto detecte success
    } catch (error) {
      console.error("Error al crear el cliente:", error);
      // El error se manejará automáticamente por Redux
    }
  };

  // Efecto para manejar redirección exitosa
  useEffect(() => {
    if (success) {
      // Limpiar formulario
      setFormData(initialState);
      setValidationErrors({});
      
      // Redirigir después de 2 segundos
      const timer = setTimeout(() => {
        dispatch(resetCreateClientState()); // Limpiar estado antes de redirigir
        navigate('/panelClientes');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate, dispatch]);

  // Función para validar CUIL
  const validateCUIL = (cuil) => {
    const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuilRegex.test(cuil);
  };

  // Estado para errores de validación del cliente
  const [validationErrors, setValidationErrors] = useState({});

  // Validar campos en tiempo real
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };

    if (name === 'cuil' && value && !validateCUIL(value)) {
      errors.cuil = 'El CUIL debe tener el formato XX-XXXXXXXX-X';
    } else if (name === 'cuil') {
      delete errors.cuil;
    }

    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      errors.email = 'Ingrese un email válido';
    } else if (name === 'email') {
      delete errors.email;
    }

    if (name === 'mobilePhone' && value && !/^\d{10}$/.test(value)) {
      errors.mobilePhone = 'El teléfono debe tener exactamente 10 dígitos';
    } else if (name === 'mobilePhone') {
      delete errors.mobilePhone;
    }

    setValidationErrors(errors);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header moderno */}
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
              <button onClick={() => navigate('/panelClientes')} className="hover:text-white transition-colors">
                Clientes
              </button>
              <span>/</span>
              <span className="text-white font-medium">Nuevo Cliente</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-full">
              <IoPersonAddOutline className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Crear Nuevo Cliente
          </h1>
          <p className="text-slate-300 text-lg">
            Completa la información del cliente
          </p>
        </div>

        {/* Mensajes de estado */}
        <div className="mb-6">
          {loading && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-blue-400">Creando cliente...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-emerald-400 mb-2">¡Cliente creado con éxito!</p>
              <p className="text-emerald-300 text-sm">Redirigiendo al panel de clientes en unos segundos...</p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo CUIL */}
              <div>
                <label htmlFor="cuil" className="flex items-center space-x-2 text-slate-300 font-medium mb-3">
                  <IoCardOutline className="w-4 h-4" />
                  <span>CUIL</span>
                </label>
                <input
                  type="text"
                  id="cuil"
                  name="cuil"
                  value={formData.cuil}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 backdrop-blur-sm transition-colors ${
                    validationErrors.cuil 
                      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                      : 'border-white/20 focus:ring-blue-500/50 focus:border-blue-500/50'
                  }`}
                  placeholder="XX-XXXXXXXX-X"
                  required
                />
                {validationErrors.cuil && (
                  <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>{validationErrors.cuil}</span>
                  </div>
                )}
              </div>

              {/* Campo Nombre */}
              <div>
                <label htmlFor="name" className="flex items-center space-x-2 text-slate-300 font-medium mb-3">
                  <IoPersonOutline className="w-4 h-4" />
                  <span>Nombre Completo</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="flex items-center space-x-2 text-slate-300 font-medium mb-3">
                  <IoMailOutline className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 backdrop-blur-sm transition-colors ${
                    validationErrors.email 
                      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                      : 'border-white/20 focus:ring-blue-500/50 focus:border-blue-500/50'
                  }`}
                  placeholder="email@ejemplo.com"
                />
                {validationErrors.email && (
                  <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>{validationErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Campo Teléfono */}
              <div>
                <label htmlFor="mobilePhone" className="flex items-center space-x-2 text-slate-300 font-medium mb-3">
                  <IoPhonePortraitOutline className="w-4 h-4" />
                  <span>Teléfono Móvil</span>
                </label>
                <input
                  type="text"
                  id="mobilePhone"
                  name="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 backdrop-blur-sm transition-colors ${
                    validationErrors.mobilePhone 
                      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                      : 'border-white/20 focus:ring-blue-500/50 focus:border-blue-500/50'
                  }`}
                  placeholder="10 dígitos (sin 0 ni 15)"
                  required
                />
                {validationErrors.mobilePhone && (
                  <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>{validationErrors.mobilePhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campos de dirección */}
            <div className="space-y-6">
              <h3 className="flex items-center space-x-2 text-lg font-semibold text-white">
                <IoLocationOutline className="w-5 h-5" />
                <span>Información de Domicilio</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Campo Dirección */}
                <div className="md:col-span-2">
                  <label htmlFor="direccion" className="block text-slate-300 font-medium mb-3">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                    placeholder="Calle y número"
                    required
                  />
                </div>

                {/* Campo Ciudad */}
                <div>
                  <label htmlFor="ciudad" className="block text-slate-300 font-medium mb-3">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                    placeholder="Ciudad"
                    required
                  />
                </div>
              </div>

              {/* Campo Provincia */}
              <div className="md:w-1/3">
                <label htmlFor="provincia" className="block text-slate-300 font-medium mb-3">
                  Provincia
                </label>
                <input
                  type="text"
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-6">
              {/* Mostrar errores de validación antes del botón */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>Por favor, corrige los errores antes de continuar</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  loading || Object.keys(validationErrors).length > 0
                    ? "bg-slate-600 cursor-not-allowed text-slate-400"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                }`}
                disabled={loading || Object.keys(validationErrors).length > 0}
              >
                <IoSaveOutline className="w-5 h-5" />
                <span>
                  {loading 
                    ? "Creando..." 
                    : Object.keys(validationErrors).length > 0 
                      ? "Corrige los errores"
                      : "Crear Cliente"
                  }
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateClientForm;