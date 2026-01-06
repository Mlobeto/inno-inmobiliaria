import  { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  IoBusinessOutline, 
  IoLocationOutline, 
  IoCallOutline, 
  IoMailOutline,
  IoDocumentTextOutline,
  IoSaveOutline,
  IoImageOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoCloudUploadOutline,
  IoTrashOutline
} from 'react-icons/io5';
import {
  loadCloudinaryScript,
  openCloudinaryWidgetForLogo,
} from '../../cloudinaryConfig';
import PdfTemplateManager from './PdfTemplateManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CompanySettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general'); // 'general' o 'templates'
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_registration: '',
    company_cuit: '',
    company_logo_url: '',
    contract_footer_text: '',
    whatsapp_template: '',
    requisitos_template: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [tenantInfo, setTenantInfo] = useState({
    subdomain: '',
    plan: 'basic',
    status: 'TRIAL'
  });

  // Función para validar CUIT
  const validateCUIT = (cuit) => {
    const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
    return cuitRegex.test(cuit);
  };

  // Cargar configuración actual
  useEffect(() => {
    loadSettings();
    // Verificar si viene del registro
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
    }
  }, [searchParams]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Cargar configuración de la empresa
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSettings(response.data);

      // Cargar información del tenant (subdomain, plan, status)
      try {
        const tenantResponse = await axios.get(`${API_URL}/tenant/info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTenantInfo({
          subdomain: tenantResponse.data.subdomain || '',
          plan: tenantResponse.data.plan || 'basic',
          status: tenantResponse.data.status || 'TRIAL'
        });
      } catch (tenantError) {
        console.error('Error al cargar info del tenant:', tenantError);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };

    if (name === 'company_cuit' && value && !validateCUIT(value)) {
      errors.company_cuit = 'El CUIT debe tener el formato XX-XXXXXXXX-X';
    } else if (name === 'company_cuit') {
      delete errors.company_cuit;
    }

    if (name === 'company_email' && value && !/\S+@\S+\.\S+/.test(value)) {
      errors.company_email = 'Ingrese un email válido';
    } else if (name === 'company_email') {
      delete errors.company_email;
    }

    if (name === 'company_phone' && value && !/^\+?\d{10,15}$/.test(value.replace(/[\s-]/g, ''))) {
      errors.company_phone = 'Ingrese un teléfono válido';
    } else if (name === 'company_phone') {
      delete errors.company_phone;
    }

    setValidationErrors(errors);
  };

  const handleLogoWidget = async () => {
    try {
      await loadCloudinaryScript();
      
      // Obtener información del tenant del usuario actual
      // eslint-disable-next-line no-unused-vars
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const tenantId = user.tenantId || 'default';
      
      // Usar la función específica para logos con carpeta separada por tenant
      openCloudinaryWidgetForLogo((uploadedImageUrl) => {
        setSettings((prevSettings) => ({
          ...prevSettings,
          company_logo_url: uploadedImageUrl,
        }));
        toast.success('Logo subido exitosamente');
      }, `tenant-${tenantId}`);
    } catch (error) {
      console.error("Error al cargar el widget de Cloudinary:", error);
      toast.error('Error al cargar el widget de imágenes');
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      company_logo_url: '',
    }));
    toast.info('Logo eliminado');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!settings.company_name) {
      toast.error('El nombre de la inmobiliaria es obligatorio');
      return;
    }

    // Verificar si hay errores de validación
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Por favor, corrige los errores antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Configuración guardada exitosamente');
      
      // Si es un nuevo usuario (viene del registro), redirigir a SubscriptionDashboard
      if (searchParams.get('welcome') === 'true') {
        setTimeout(() => {
          navigate('/subscription');
        }, 1500);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Onboarding Welcome Banner */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <IoCloseOutline className="w-6 h-6" />
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <IoCheckmarkCircleOutline className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3">
                  ¡Bienvenido a InnoInmobiliaria! 🎉
                </h2>
                <p className="text-blue-50 mb-4 text-lg">
                  Tu cuenta ha sido creada exitosamente con un período de prueba de <strong>7 días</strong>.
                </p>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoInformationCircleOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">¿Por qué es importante completar estos datos?</p>
                      <p className="text-sm text-blue-50">
                        La información que proporciones se utilizará automáticamente en todos los documentos generados por el sistema:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>Contratos de alquiler y venta</strong> - Datos legales de tu inmobiliaria</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>Autorizaciones de venta</strong> - Información de contacto y matrícula profesional</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>PDF de propiedades</strong> - Logo, teléfono y datos de contacto</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>Recibos de pago</strong> - Datos fiscales y de facturación</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoDocumentTextOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">Plantillas PDF Personalizables</p>
                      <p className="text-sm text-blue-50 mb-2">
                        En la pestaña <strong>"Plantillas PDF"</strong> podrás personalizar todos los documentos:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span>Editar el HTML de cada tipo de documento</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span>Personalizar estilos CSS, encabezados y pies de página</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span>Crear múltiples plantillas por tipo (estándar, premium, etc.)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span>Usar variables dinámicas como {`{{tenant.name}}`} o {`{{property.address}}`}</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoMailOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">Mensajes Personalizables</p>
                      <p className="text-sm text-blue-50 mb-2">
                        En la pestaña <strong>"Mensajes"</strong> podrás personalizar los textos que usas con clientes:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>WhatsApp:</strong> Mensaje que se copia al compartir propiedades</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span><strong>Requisitos:</strong> Lista de documentos necesarios para alquilar</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      <span>Usa variables como {`{precio}`} o {`{direccion}`} para datos dinámicos</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2 text-yellow-200 text-sm">
                  <IoInformationCircleOutline className="w-4 h-4" />
                  <span>Asegúrate de completar especialmente el <strong>nombre, CUIT y matrícula</strong> para cumplir con requisitos legales.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={() => navigate('/panel')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <IoArrowBackOutline className="w-5 h-5 mr-2" />
            Volver al Panel
          </button>
          <div className="flex items-center space-x-3">
            <IoBusinessOutline className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Configuración de la Inmobiliaria</h1>
              <p className="text-gray-600 mt-1">Completa los datos de tu empresa</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <IoBusinessOutline className="w-5 h-5" />
                  <span>Datos Generales</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'messages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <IoMailOutline className="w-5 h-5" />
                  <span>Mensajes</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <IoDocumentTextOutline className="w-5 h-5" />
                  <span>Plantillas PDF</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido según tab activo */}
        {activeTab === 'general' ? (
          // Formulario de datos generales
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          
          {/* Datos básicos */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoBusinessOutline className="mr-2" />
                Nombre de la Inmobiliaria *
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ej: Inmobiliaria Del Centro"
              />
            </div>

            {/* CUIT */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoDocumentTextOutline className="mr-2" />
                CUIT
              </label>
              <input
                type="text"
                name="company_cuit"
                value={settings.company_cuit}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.company_cuit 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="XX-XXXXXXXX-X"
              />
              {validationErrors.company_cuit && (
                <div className="flex items-center space-x-1 mt-2 text-red-600 text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_cuit}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoLocationOutline className="mr-2" />
              Dirección
            </label>
            <input
              type="text"
              name="company_address"
              value={settings.company_address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Calle 123, Ciudad, Provincia"
            />
          </div>

          {/* Subdominio */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoBusinessOutline className="mr-2" />
              Subdominio
              {tenantInfo.plan === 'basic' && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Requiere Plan Professional
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                name="subdomain"
                value={tenantInfo.subdomain}
                disabled={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="mi-inmobiliaria"
              />
              <div className="absolute right-3 top-3 text-gray-400 text-sm">
                .innoinmobiliaria.com
              </div>
            </div>
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Dominio personalizado:</strong> Con el Plan Professional o superior, podrás personalizar tu subdominio para publicar tus propiedades en una URL única como <strong>{tenantInfo.subdomain || 'tu-nombre'}.innoinmobiliaria.com</strong>
              </p>
              {tenantInfo.plan === 'basic' && (
                <p className="text-xs text-blue-700 mt-2">
                  💡 Actualiza a Plan Professional para desbloquear esta función y obtener un dominio personalizado para tu inmobiliaria.
                </p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teléfono */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoCallOutline className="mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                name="company_phone"
                value={settings.company_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.company_phone 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="+54 9 XXX XXX-XXXX"
              />
              {validationErrors.company_phone && (
                <div className="flex items-center space-x-1 mt-2 text-red-600 text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_phone}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <IoMailOutline className="mr-2" />
                Email
              </label>
              <input
                type="email"
                name="company_email"
                value={settings.company_email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  validationErrors.company_email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="contacto@inmobiliaria.com"
              />
              {validationErrors.company_email && (
                <div className="flex items-center space-x-1 mt-2 text-red-600 text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Matrícula */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoDocumentTextOutline className="mr-2" />
              Matrícula o Número de Registro
            </label>
            <input
              type="text"
              name="company_registration"
              value={settings.company_registration}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Matrícula profesional"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoImageOutline className="mr-2" />
              Logo de la Inmobiliaria
            </label>
            
            <div className="space-y-4">
              {/* Botón para subir logo */}
              <button
                type="button"
                onClick={handleLogoWidget}
                className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <IoCloudUploadOutline className="w-5 h-5" />
                <span>Subir Logo desde Cloudinary</span>
              </button>
              
              <p className="text-sm text-gray-500">
                El logo aparecerá en PDFs de propiedades, contratos y documentos oficiales
              </p>

              {/* Vista previa del logo */}
              {settings.company_logo_url && (
                <div className="relative inline-block">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <img 
                      src={settings.company_logo_url} 
                      alt="Logo preview" 
                      className="h-24 object-contain"
                    />
                  </div>
                  
                  {/* Botón para eliminar logo */}
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
                    title="Eliminar logo"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Texto adicional para contratos */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <IoDocumentTextOutline className="mr-2" />
              Slogan de tu Inmobiliaria (Opcional)
            </label>
            <textarea
              name="contract_footer_text"
              value={settings.contract_footer_text}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Texto personalizado para tus publicaciones"
            />
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4 border-t">
            {/* Mostrar errores de validación antes del botón */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="flex-1 mr-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>Por favor, corrige los errores antes de guardar</span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg text-white font-semibold
                transition-all duration-200 transform
                ${isSaving || Object.keys(validationErrors).length > 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg'
                }
              `}
            >
              <IoSaveOutline className="w-5 h-5" />
              <span>
                {isSaving 
                  ? 'Guardando...' 
                  : Object.keys(validationErrors).length > 0 
                    ? 'Corrige los errores'
                    : 'Guardar Configuración'
                }
              </span>
            </button>
          </div>
        </form>
        ) : activeTab === 'messages' ? (
          // Pestaña de Mensajes
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Plantillas de Mensajes
              </h2>
              <p className="text-gray-600">
                Personaliza los mensajes que se envían a clientes para WhatsApp y requisitos de alquiler.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* WhatsApp Template */}
              <div className="border-b border-gray-200 pb-8">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Mensaje de WhatsApp para Propiedades
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Este mensaje se copia al portapapeles cuando compartes una propiedad por WhatsApp.
                  Usa las siguientes variables:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-mono text-blue-900">
                    <span className="font-semibold">Variables disponibles:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm font-mono text-blue-800">
                    <span>{"{precio}"}</span>
                    <span>{"{direccion}"}</span>
                    <span>{"{ciudad}"}</span>
                    <span>{"{barrio}"}</span>
                    <span>{"{tipo}"}</span>
                    <span>{"{habitaciones}"}</span>
                    <span>{"{baños}"}</span>
                    <span>{"{superficieTotal}"}</span>
                    <span>{"{descripcion}"}</span>
                  </div>
                </div>
                <textarea
                  name="whatsapp_template"
                  value={settings.whatsapp_template}
                  onChange={handleChange}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Escribe tu plantilla de mensaje aquí..."
                />
              </div>

              {/* Requisitos Template */}
              <div className="pb-8">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  Mensaje de Requisitos de Alquiler
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Este mensaje se copia al portapapeles cuando solicitas requisitos para una propiedad.
                  Usa las siguientes variables:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-mono text-blue-900">
                    <span className="font-semibold">Variables disponibles:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm font-mono text-blue-800">
                    <span>{"{address}"}</span>
                    <span>{"{price}"}</span>
                  </div>
                </div>
                <textarea
                  name="requisitos_template"
                  value={settings.requisitos_template}
                  onChange={handleChange}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Escribe tu plantilla de requisitos aquí..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'templates' ? (
          // Pestaña de Plantillas PDF
          <div>
            <PdfTemplateManager embedded={true} />
          </div>
        ) : null}

        {/* Ayuda - Solo mostrar en tab general */}
        {activeTab === 'general' && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <IoInformationCircleOutline className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>💡 Importante:</strong> Esta información se usará en todos los documentos generados por el sistema.
                </p>
                <ul className="text-sm text-blue-700 space-y-1 ml-4">
                  <li>• Los campos marcados con * son obligatorios</li>
                  <li>• El CUIT y la matrícula son necesarios para cumplir con requisitos legales</li>
                  <li>• El logo aparecerá en PDFs de propiedades y documentos oficiales</li>
                  <li>• Puedes actualizar esta información en cualquier momento</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettings;
