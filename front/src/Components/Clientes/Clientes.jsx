import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useCreateClientMutation } from '@shared/redux';
import { PROVINCIAS_ARGENTINA, getCiudadesByProvincia } from '@shared/constants/argentinLocations';
import { getCountryConfig, validateDocument } from '@shared/constants/countryConfigs';
import { toast } from 'react-toastify';
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
  provincia: "",
  codigoPostal: "",
  mobilePhone: "",
};

const CreateClientForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Estados para ciudades dinámicas (provincias están en la data)
  const [cities, setCities] = useState([]);
  
  // País del tenant (por ahora hardcodeado AR, después se obtiene del tenant en Redux)
  const [tenantCountry] = useState('AR');
  const countryConfig = getCountryConfig(tenantCountry);
  
  // RTK Query mutation
  const [createClient, { isLoading, isError, error, isSuccess }] = useCreateClientMutation();

  // Cargar ciudades cuando cambia la provincia
  useEffect(() => {
    if (formData.provincia) {
      const provinciaObj = PROVINCIAS_ARGENTINA.find(p => p.name === formData.provincia);
      if (provinciaObj) {
        const ciudades = getCiudadesByProvincia(provinciaObj.id);
        setCities(ciudades);
      }
    } else {
      setCities([]);
    }
  }, [formData.provincia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia la provincia, resetear la ciudad
    if (name === 'provincia') {
      setFormData({
        ...formData,
        provincia: value,
        ciudad: '', // Resetear ciudad
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar antes de enviar
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Por favor corrige los errores antes de continuar');
      return;
    }
    
    try {
      console.log('📤 Enviando datos del cliente:', formData);
      const result = await createClient(formData).unwrap();
      console.log('✅ Cliente creado exitosamente:', result);
      toast.success('¡Cliente creado con éxito!');
      
      // Limpiar formulario
      setFormData(initialState);
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate('/panelClientes');
      }, 1500);
    } catch (error) {
      console.error("❌ Error al crear el cliente:", error);
      const errorMsg = error?.data?.details || error?.data?.error || 'Error al crear el cliente';
      toast.error(errorMsg);
    }
  };

  // Función para validar CUIL
  const validateCUIL = (cuil) => {
    // Usar la validación genérica del countryConfig
    if (!countryConfig) return false;
    const documentCode = countryConfig.documentTypes.person.tax.type;
    return validateDocument(cuil, documentCode, tenantCountry);
  };

  // Validar campos en tiempo real
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };
    
    if (name === 'cuil' && value && !validateCUIL(value)) {
      const docType = countryConfig?.documentTypes.person.tax.type || 'CUIL';
      const docFormat = countryConfig?.documentTypes.person.tax.placeholder || 'XX-XXXXXXXX-X';
      errors.cuil = `El ${docType} debe tener el formato ${docFormat}`;
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

    if (name === 'codigoPostal' && value && !/^\d{4}$/.test(value)) {
      errors.codigoPostal = 'El código postal debe tener 4 dígitos';
    } else if (name === 'codigoPostal') {
      delete errors.codigoPostal;
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
          {isLoading && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-blue-400">Creando cliente...</p>
            </div>
          )}
          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400">{error?.data?.details || error?.data?.error || 'Error al crear el cliente'}</p>
            </div>
          )}
          {isSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-emerald-400 mb-2">¡Cliente creado con éxito!</p>
              <p className="text-emerald-300 text-sm">Redirigiendo al panel de clientes...</p>
            </div>
          )}
        </div>

        {/* Formulario */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo CUIL/Documento Fiscal Dinámico */}
              <div>
                <label htmlFor="cuil" className="flex items-center space-x-2 text-slate-300 font-medium mb-3">
                  <IoCardOutline className="w-4 h-4" />
                  <span>{countryConfig?.documentTypes.person.tax.label || 'CUIL'}</span>
                  <span className="text-slate-400 text-xs">({countryConfig?.name || 'Argentina'})</span>
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
                  placeholder={countryConfig?.documentTypes.person.tax.placeholder || 'XX-XXXXXXXX-X'}
                  required
                />
                {validationErrors.cuil && (
                  <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>{validationErrors.cuil}</span>
                  </div>
                )}
                {countryConfig?.documentTypes.person.tax.helpText && (
                  <p className="text-slate-400 text-xs mt-1">{countryConfig.documentTypes.person.tax.helpText}</p>
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
                {/* Campo Provincia */}
                <div>
                  <label htmlFor="provincia" className="block text-slate-300 font-medium mb-3">
                    Provincia
                  </label>
                  <select
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-slate-800" style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                      Seleccionar provincia
                    </option>
                    {PROVINCIAS_ARGENTINA.map((prov) => (
                      <option key={prov.id} value={prov.name} className="bg-slate-800" style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo Ciudad */}
                <div>
                  <label htmlFor="ciudad" className="block text-slate-300 font-medium mb-3">
                    Ciudad
                  </label>
                  <select
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer"
                    required
                    disabled={!formData.provincia}
                  >
                    <option value="" className="bg-slate-800" style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                      {formData.provincia ? 'Seleccionar ciudad' : 'Primero seleccione provincia'}
                    </option>
                    {cities.map((city, index) => (
                      <option key={`${city}-${index}`} value={city} className="bg-slate-800" style={{ color: '#111827', backgroundColor: '#ffffff' }}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo Código Postal */}
                <div>
                  <label htmlFor="codigoPostal" className="block text-slate-300 font-medium mb-3">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="codigoPostal"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 backdrop-blur-sm transition-colors ${
                      validationErrors.codigoPostal 
                        ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                        : 'border-white/20 focus:ring-blue-500/50 focus:border-blue-500/50'
                    }`}
                    placeholder="4700"
                    required
                  />
                  {validationErrors.codigoPostal && (
                    <div className="flex items-center space-x-1 mt-2 text-red-400 text-sm">
                      <IoWarningOutline className="w-4 h-4" />
                      <span>{validationErrors.codigoPostal}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Campo Dirección - Ahora full width debajo */}
              <div>
                <label htmlFor="direccion" className="block text-slate-300 font-medium mb-3">
                  Dirección Completa
                </label>
                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
                  placeholder="Calle, número, piso, depto"
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
                  isLoading || Object.keys(validationErrors).length > 0
                    ? "bg-slate-600 cursor-not-allowed text-slate-400"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
                }`}
                disabled={isLoading || Object.keys(validationErrors).length > 0}
              >
                <IoSaveOutline className="w-5 h-5" />
                <span>
                  {isLoading 
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