/* eslint-disable react/no-unescaped-entities */
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
  IoTrashOutline,
  IoHomeOutline,
  IoCardOutline,
  IoLogOutOutline,
  IoLogoWhatsapp,
  IoExtensionPuzzleOutline,
  IoLogoBuffer,
  IoChevronForwardOutline,
} from 'react-icons/io5';
import { uploadFile } from '../../utils/azureUpload';
import { validateCUIT, formatCUIT } from '../../utils/cuitValidator';
import PdfTemplateManager from './PdfTemplateManager';
import MercadoLibreIntegration from './MercadoLibreIntegration';
import ElectronicInvoicingIntegration from './ElectronicInvoicingIntegration';
import PaymentMethodsManager from './PaymentMethodsManager';
import {
  alertError,
  alertSuccess,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  inputClass,
  panelShell,
  spinner,
} from './adminPanelTheme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const csLabel = 'flex items-center text-sm font-semibold text-textSecondary mb-2';
const csInput = `${inputClass} py-3`;
const csInputErr = 'w-full bg-bgElevated border border-customRed/50 rounded-lg px-4 py-3 text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-customRed focus:border-transparent transition-colors';
const csCard = `${card}`;
const csCardPad = `${card} p-6`;

const VALID_TABS = ['general', 'messages', 'templates', 'mercadolibre', 'integrations', 'payments'];

const CONFIG_SECTIONS = [
  {
    id: 'general',
    label: 'Datos Generales',
    description: 'Nombre, CUIT, logo y contacto de la inmobiliaria',
    icon: IoBusinessOutline,
    accent: 'blue',
  },
  {
    id: 'messages',
    label: 'Mensajes',
    description: 'Plantillas de WhatsApp y textos para clientes',
    icon: IoMailOutline,
    accent: 'indigo',
  },
  {
    id: 'templates',
    label: 'Plantillas PDF',
    description: 'Contratos, recibos y documentos personalizados',
    icon: IoDocumentTextOutline,
    accent: 'purple',
  },
  {
    id: 'mercadolibre',
    label: 'Mercado Libre',
    description: 'Conectar cuenta, publicar inmuebles y consultas',
    icon: IoLogoBuffer,
    accent: 'yellow',
  },
  {
    id: 'integrations',
    label: 'Facturación electrónica',
    description: 'Integración con AFIP y comprobantes fiscales',
    icon: IoExtensionPuzzleOutline,
    accent: 'emerald',
  },
  {
    id: 'payments',
    label: 'Métodos de Pago',
    description: 'Cuentas bancarias y formas de cobro',
    icon: IoCardOutline,
    accent: 'rose',
  },
];

const SECTION_ACCENT = {
  blue: {
    icon: 'bg-brand-muted text-brand-light',
    active: 'border-brand bg-brand-subtle/60 ring-1 ring-borderStrong',
    title: 'text-brand-light',
  },
  indigo: {
    icon: 'bg-customBlueMuted text-customBlue',
    active: 'border-customBlue bg-customBlueMuted/40 ring-1 ring-customBlue/30',
    title: 'text-customBlue',
  },
  purple: {
    icon: 'bg-brand-subtle text-brand',
    active: 'border-brand bg-brand-subtle/60 ring-1 ring-borderStrong',
    title: 'text-brand-light',
  },
  yellow: {
    icon: 'bg-customYellowMuted text-customYellow',
    active: 'border-customYellow bg-customYellowMuted/40 ring-1 ring-customYellow/30',
    title: 'text-customYellow',
  },
  emerald: {
    icon: 'bg-brand-muted text-brand-light',
    active: 'border-brand bg-brand-subtle/60 ring-1 ring-borderStrong',
    title: 'text-brand-light',
  },
  rose: {
    icon: 'bg-customRedMuted text-customRed',
    active: 'border-customRed bg-customRedMuted/40 ring-1 ring-customRed/30',
    title: 'text-customRed',
  },
};

const DEFAULT_WHATSAPP_TEMPLATE = `Hola! 👋 Gracias por tu consulta.

📌 *PROPIEDAD EN {tipoOperacion}*
🏠 {tipo} — {direccion}
📍 {barrio}, {ciudad}

💰 *Precio: {precio}*
📐 {habitaciones} amb. | 🚿 {baños} baños | 📏 {superficieTotal} m²

📝 {descripcion}

¿Te gustaría agendar una visita o recibir más información? ¡Estamos a tu disposición!`;

const CompanySettings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const isIncomplete = searchParams.get('incomplete') === 'true';
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    company_city: '',
    company_province: '',
    company_phone: '',
    company_email: '',
    company_whatsapp: '',
    company_registration: '',
    company_cuit: '',
    company_ingresos_brutos: '',
    company_condicion_iva: 'RESPONSABLE MONOTRIBUTO',
    company_inicio_actividad: '',
    professional_title: '',
    company_logo_url: '',
    receipt_prefix: 'X',
    receipt_footer_text: '',
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
    status: 'TRIAL',
    hasLanding: false
  });
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [dragOverField, setDragOverField] = useState(null);

  const handleCuitChange = (e) => {
    const formatted = formatCUIT(e.target.value);
    setSettings(prev => ({ ...prev, company_cuit: formatted }));
    if (validationErrors.company_cuit) {
      setValidationErrors(prev => ({ ...prev, company_cuit: undefined }));
    }
  };

  const handleIibbChange = (e) => {
    const formatted = formatCUIT(e.target.value);
    setSettings(prev => ({ ...prev, company_ingresos_brutos: formatted }));
  };

  // Drag & drop de variables sobre textareas
  const handleVarDragStart = (e, variable) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', variable);
  };

  const handleTextareaDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleTextareaDrop = (e, fieldName) => {
    e.preventDefault();
    setDragOverField(null);
    const variable = e.dataTransfer.getData('text/plain');
    if (!variable) return;
    const textarea = e.target;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const current = settings[fieldName] || '';
    const newValue = current.substring(0, start) + variable + current.substring(end);
    setSettings(prev => ({ ...prev, [fieldName]: newValue }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + variable.length;
      textarea.selectionEnd = start + variable.length;
    });
  };

  // Auto-formato para fecha: DD-MM-YYYY
  const handleDateChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    setSettings(prev => ({ ...prev, company_inicio_actividad: formatted }));
  };

  // Cargar configuración actual
  useEffect(() => {
    loadSettings();
    
    // Verificar si viene del registro
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
    }
    
    // Verificar tab en URL (integrations + ml_* → pestaña Mercado Libre)
    const tabParam = searchParams.get('tab');
    const hasMlCallback = searchParams.get('ml_success') || searchParams.get('ml_error');
    if (hasMlCallback) {
      setActiveTab('mercadolibre');
    } else if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    // Verificar mensajes de MercadoLibre
    if (searchParams.get('ml_success') === 'true') {
      toast.success('¡Cuenta de MercadoLibre conectada exitosamente!');
      // Limpiar parámetros de la URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ml_success');
      newParams.set('tab', 'mercadolibre');
      navigate(`/admin/company-settings?${newParams.toString()}`, { replace: true });
    }
    
    if (searchParams.get('ml_error')) {
      const mlErr = searchParams.get('ml_error');
      const mlErrorMessages = {
        invalid_state: 'La conexión expiró. Volvé a pulsar Conectar cuenta.',
        no_code: 'No se completó la autorización en Mercado Libre.',
        callback_failed:
          'No pudimos guardar la conexión. Revisá que ML_CLIENT_SECRET en GitHub/Azure sea el de la app InnoInmobiliaria - Publicaciones (6081765459956502).',
        invalid_client:
          'Client ID o Secret incorrectos en el servidor. Actualizá ML_CLIENT_SECRET en GitHub Secrets (app InnoInmobiliaria - Publicaciones) y redeploy del backend.',
        invalid_grant:
          'El código de autorización expiró o la redirect URI no coincide. Verificá en developers que la URL de callback sea exactamente la de Azure con /api/mercadolibre/callback e intentá de nuevo.',
        unauthorized_client: 'La app de Mercado Libre no está autorizada para este flujo. Revisá permisos y VIS en developers.',
        forbidden: 'Mercado Libre rechazó la conexión para esta cuenta. Usá un usuario de prueba si la app no está certificada.',
        access_denied: 'No autorizaste el acceso o cancelaste en Mercado Libre.',
      };
      toast.error(
        mlErrorMessages[mlErr] ||
          'Error al conectar con Mercado Libre. Usá la cuenta de vendedor de tu inmobiliaria (no la de developers).',
        { autoClose: 10000 }
      );
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ml_error');
      newParams.set('tab', 'mercadolibre');
      navigate(`/admin/company-settings?${newParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Cargar configuración de la empresa
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const loadedSettings = response.data;
      // Si el template de WhatsApp está vacío, usar el por defecto
      if (!loadedSettings.whatsapp_template) {
        loadedSettings.whatsapp_template = DEFAULT_WHATSAPP_TEMPLATE;
      }
      setSettings(loadedSettings);

      // Cargar información del tenant (subdomain, plan, status)
      try {
        const tenantResponse = await axios.get(`${API_URL}/tenant/info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // El backend devuelve response.data.data
        const tenantData = tenantResponse.data.data || tenantResponse.data;
        
        setTenantInfo({
          subdomain: tenantData.subdomain || '',
          plan: tenantData.plan || 'basic',
          status: tenantData.status || 'TRIAL',
          hasLanding: tenantData.features?.hasLanding || false
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
    
    if (name === 'subdomain') {
      // Sanitizar subdomain: convertir a minúsculas y remover caracteres no válidos
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setTenantInfo(prev => ({ ...prev, subdomain: sanitized }));
      setSubdomainAvailable(null); // Reset validation
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    navigate(`/admin/company-settings?${newParams.toString()}`, { replace: true });
  };

  const activeSection = CONFIG_SECTIONS.find((section) => section.id === activeTab) || CONFIG_SECTIONS[0];
  const ActiveSectionIcon = activeSection.icon;
  const activeAccent = SECTION_ACCENT[activeSection.accent];

  const checkSubdomainAvailability = async (subdomain) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setCheckingSubdomain(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/tenant/check-subdomain`,
        { subdomain },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubdomainAvailable(response.data.available);
    } catch (error) {
      console.error('Error al verificar subdominio:', error);
      setSubdomainAvailable(false);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubdomainBlur = () => {
    if (tenantInfo.hasLanding && tenantInfo.subdomain) {
      checkSubdomainAvailability(tenantInfo.subdomain);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };

    if (name === 'company_cuit' && value) {
      const { valid, message } = validateCUIT(value);
      if (!valid) errors.company_cuit = message;
      else delete errors.company_cuit;
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

  const handleLogoWidget = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'logos');
      setSettings((prev) => ({ ...prev, company_logo_url: url }));
      toast.success('Logo subido exitosamente');
    } catch (error) {
      console.error('Error al subir el logo:', error);
      toast.error('Error al subir el logo');
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

    // Validar subdominio si está habilitado
    if (tenantInfo.hasLanding && tenantInfo.subdomain) {
      if (subdomainAvailable === false) {
        toast.error('El subdominio no está disponible');
        return;
      }
      if (tenantInfo.subdomain.length < 3) {
        toast.error('El subdominio debe tener al menos 3 caracteres');
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Guardar configuración de empresa
      await axios.put(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Si el tenant tiene landing y cambió el subdominio, actualizarlo
      if (tenantInfo.hasLanding && tenantInfo.subdomain) {
        try {
          await axios.put(
            `${API_URL}/tenant/subdomain`,
            { subdomain: tenantInfo.subdomain },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (subdomainError) {
          console.error('Error al actualizar subdominio:', subdomainError);
          toast.error('Configuración guardada, pero hubo un error al actualizar el subdominio');
          setIsSaving(false);
          return;
        }
      }
      
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
      <div className={`${panelShell} flex justify-center items-center`}>
        <div className={`w-12 h-12 ${spinner}`} />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={panelShell}>
      {/* Navbar */}
      <nav className="bg-bgSurface shadow-brandGlow border-b border-borderBase sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm sm:text-xl font-bold text-textPrimary truncate">
                {settings.company_name || 'GestProp'}
              </h1>
              {isIncomplete && (
                <span className="hidden xs:inline-flex px-2 py-0.5 bg-customYellowMuted text-customYellow border border-customYellow/30 text-xs font-medium rounded-full whitespace-nowrap">
                  Configuración incompleta
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {!isIncomplete && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/panel')}
                    className={`${btnPrimary} text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4`}
                  >
                    <IoHomeOutline className="text-base sm:text-lg flex-shrink-0" />
                    <span className="hidden sm:inline">Panel Principal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription')}
                    className={`${btnSecondary} text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4`}
                  >
                    <IoCardOutline className="text-base sm:text-lg flex-shrink-0" />
                    <span className="hidden sm:inline">Mi Plan</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className={`${btnGhost} text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4`}
              >
                <IoLogOutOutline className="text-base sm:text-lg flex-shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        
        {/* Aviso de configuración pendiente */}
        {isIncomplete && (
          <div className={`${alertSuccess} mb-6`}>
            <div className="flex items-start gap-4">
              <div className="bg-brand-muted rounded-full p-3 flex-shrink-0">
                <IoInformationCircleOutline className="text-brand-light text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-brand-light mb-1">
                  ¡Casi listo! Completá los datos de tu inmobiliaria
                </h3>
                <p className="text-textSecondary text-sm mb-3">
                  Para empezar a usar el panel necesitás completar los <strong>Datos Generales</strong>. Solo te llevará unos minutos.
                </p>
                <div className={`${card} p-3`}>
                  <p className="text-xs text-brand-light font-medium mb-2">📋 Campos requeridos:</p>
                  <ul className="text-xs text-textSecondary grid grid-cols-2 gap-x-4 gap-y-1">
                    <li>• Nombre de la inmobiliaria</li>
                    <li>• CUIT</li>
                    <li>• Matrícula profesional</li>
                    <li>• Dirección</li>
                    <li>• Teléfono</li>
                    <li>• Email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Onboarding Welcome Banner */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-brand-dark to-brand rounded-xl shadow-brandGlow p-8 mb-6 text-textWhite relative overflow-hidden border border-borderStrong">
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 text-textWhite/80 hover:text-textWhite transition-colors"
            >
              <IoCloseOutline className="w-6 h-6" />
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-brand-muted/50 backdrop-blur-sm rounded-full p-3">
                  <IoCheckmarkCircleOutline className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3">
                  ¡Bienvenido a GestProp! 🎉
                </h2>
                <p className="text-textWhite/80 mb-4 text-lg">
                  Tu cuenta ha sido creada exitosamente con un período de prueba de <strong>7 días</strong>.
                </p>
                
                <div className="bg-bgSurface/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoInformationCircleOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">¿Por qué es importante completar estos datos?</p>
                      <p className="text-sm text-textWhite/80">
                        La información que proporciones se utilizará automáticamente en todos los documentos generados por el sistema:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>Contratos de alquiler y venta</strong> - Datos legales de tu inmobiliaria</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>Autorizaciones de venta</strong> - Información de contacto y matrícula profesional</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>PDF de propiedades</strong> - Logo, teléfono y datos de contacto</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>Recibos de pago</strong> - Datos fiscales y de facturación</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-bgSurface/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoDocumentTextOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">Plantillas PDF Personalizables</p>
                      <p className="text-sm text-textWhite/80 mb-2">
                        En la pestaña <strong>"Plantillas PDF"</strong> podrás personalizar todos los documentos:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span>Editar el HTML de cada tipo de documento</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span>Personalizar estilos CSS, encabezados y pies de página</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span>Crear múltiples plantillas por tipo (estándar, premium, etc.)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span>Usar variables dinámicas como {`{{tenant.name}}`} o {`{{property.address}}`}</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-bgSurface/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <IoMailOutline className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-2">Mensajes Personalizables</p>
                      <p className="text-sm text-textWhite/80 mb-2">
                        En la pestaña <strong>"Mensajes"</strong> podrás personalizar los textos que usas con clientes:
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-7 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>WhatsApp:</strong> Mensaje que se copia al compartir propiedades</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span><strong>Requisitos:</strong> Lista de documentos necesarios para alquilar</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-brand-light rounded-full"></span>
                      <span>Usa variables como {`{precio}`} o {`{direccion}`} para datos dinámicos</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center space-x-2 text-customYellow text-sm">
                  <IoInformationCircleOutline className="w-4 h-4" />
                  <span>Asegúrate de completar especialmente el <strong>nombre, CUIT y matrícula</strong> para cumplir con requisitos legales.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={`${csCardPad} mb-6`}>
          <button
            type="button"
            onClick={() => navigate('/panel')}
            className="flex items-center text-brand-light hover:text-textPrimary mb-4 transition-colors"
          >
            <IoArrowBackOutline className="w-5 h-5 mr-2" />
            Volver al Panel
          </button>
          <div className="flex items-center space-x-3">
            <IoBusinessOutline className="w-8 h-8 text-brand-light" />
            <div>
              <h1 className="text-3xl font-bold text-textPrimary">Configuración de la Inmobiliaria</h1>
              <p className="text-textSecondary mt-1">
                Elegí una sección del menú para configurar datos, mensajes, Mercado Libre y más
              </p>
            </div>
          </div>
        </div>

        {/* Navegación por secciones */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <aside className="lg:w-80 shrink-0">
            <div className={`${csCard} p-3`}>
              <p className="px-3 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-textMuted">
                ¿Qué querés configurar?
              </p>
              <nav className="space-y-2" aria-label="Secciones de configuración">
                {CONFIG_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const accent = SECTION_ACCENT[section.accent];
                  const isActive = activeTab === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleTabChange(section.id)}
                      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                        isActive
                          ? accent.active
                          : 'border-transparent bg-bgElevated hover:bg-brand-subtle/50 hover:border-borderBase'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2.5 shrink-0 ${accent.icon}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-semibold text-sm ${isActive ? accent.title : 'text-textPrimary'}`}>
                              {section.label}
                            </span>
                            {isActive && <IoChevronForwardOutline className="w-4 h-4 text-textMuted shrink-0" />}
                          </div>
                          <p className="text-xs text-textMuted mt-0.5 leading-snug">{section.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className={`${csCard} p-5 mb-6`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-3 shrink-0 ${activeAccent.icon}`}>
                  <ActiveSectionIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${activeAccent.title}`}>{activeSection.label}</h2>
                  <p className="text-sm text-textSecondary mt-1">{activeSection.description}</p>
                </div>
              </div>
            </div>

        {/* Contenido según tab activo */}
        {activeTab === 'general' ? (
          // Formulario de datos generales
          <form onSubmit={handleSubmit} className={`${csCardPad} space-y-6`}>
          
          {/* Datos básicos */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className={csLabel}>
                <IoBusinessOutline className="mr-2" />
                Nombre de la Inmobiliaria *
              </label>
              <input
                type="text"
                name="company_name"
                value={settings.company_name}
                onChange={handleChange}
                required
                className={csInput}
                placeholder="Ej: Inmobiliaria Del Centro"
              />
            </div>

            {/* CUIT */}
            <div>
              <label className={csLabel}>
                <IoDocumentTextOutline className="mr-2" />
                CUIT
              </label>
              <input
                type="text"
                name="company_cuit"
                value={settings.company_cuit}
                onChange={handleCuitChange}
                onBlur={handleBlur}
                className={validationErrors.company_cuit ? csInputErr : csInput}
                placeholder="20-12345678-9"
                inputMode="numeric"
              />
              {validationErrors.company_cuit && (
                <div className="flex items-center space-x-1 mt-2 text-customRed text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_cuit}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className={csLabel}>
              <IoLocationOutline className="mr-2" />
              Dirección
            </label>
            <input
              type="text"
              name="company_address"
              value={settings.company_address}
              onChange={handleChange}
              className={csInput}
              placeholder="Av. Principal 123"
            />
          </div>

          {/* Ciudad y Provincia */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Ciudad */}
            <div>
              <label className={csLabel}>
                <IoLocationOutline className="mr-2" />
                Ciudad
              </label>
              <input
                type="text"
                name="company_city"
                value={settings.company_city}
                onChange={handleChange}
                className={csInput}
                placeholder="Ej: Buenos Aires"
              />
            </div>

            {/* Provincia */}
            <div>
              <label className={csLabel}>
                <IoLocationOutline className="mr-2" />
                Provincia
              </label>
              <input
                type="text"
                name="company_province"
                value={settings.company_province}
                onChange={handleChange}
                className={csInput}
                placeholder="Ej: Buenos Aires"
              />
            </div>
          </div>

          {/* Subdominio */}
          <div>
            <label className={csLabel}>
              <IoBusinessOutline className="mr-2" />
              Subdominio
              {!tenantInfo.hasLanding && (
                <span className="ml-2 text-xs bg-customYellowMuted text-customYellow border border-customYellow/30 px-2 py-0.5 rounded-full">
                  Requiere Plan con Landing
                </span>
              )}
              {checkingSubdomain && (
                <span className="ml-2 text-xs text-textMuted">Verificando...</span>
              )}
              {subdomainAvailable === true && (
                <span className="ml-2 text-xs text-brand-light">✓ Disponible</span>
              )}
              {subdomainAvailable === false && (
                <span className="ml-2 text-xs text-customRed">✗ No disponible</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                name="subdomain"
                value={tenantInfo.subdomain}
                onChange={handleChange}
                onBlur={handleSubdomainBlur}
                disabled={!tenantInfo.hasLanding}
                className={`${csInput} ${!tenantInfo.hasLanding ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder="mi-inmobiliaria"
              />
            </div>
            <div className={`mt-2 border rounded-lg p-3 ${
              tenantInfo.hasLanding
                ? 'bg-brand-muted border-borderStrong'
                : 'bg-customBlueMuted border-customBlue/30'
            }`}>
              {tenantInfo.hasLanding ? (
                <>
                  <p className="text-sm text-brand-light">
                    <strong>✓ Landing activado:</strong> Tu página estará disponible en{' '}
                    <strong>gestprop.com.ar/{tenantInfo.subdomain || 'tu-nombre'}</strong>
                  </p>
                  <p className="text-xs text-textSecondary mt-2">
                    💡 Cambia el nombre aquí y guardá para actualizar tu URL personalizada.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-customBlue">
                    <strong>ℹ️ URL personalizada:</strong> Con un plan que incluya Landing, podrás publicar tus propiedades en <strong>gestprop.com.ar/tu-nombre</strong>.
                  </p>
                  <p className="text-xs text-textSecondary mt-2">
                    💡 Actualizá tu plan desde "Mi Plan" en el menú para desbloquear esta función.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Teléfono */}
            <div>
              <label className={csLabel}>
                <IoCallOutline className="mr-2" />
                Teléfono
              </label>
              <input
                type="tel"
                name="company_phone"
                value={settings.company_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={validationErrors.company_phone ? csInputErr : csInput}
                placeholder="+54 9 XXX XXX-XXXX"
              />
              {validationErrors.company_phone && (
                <div className="flex items-center space-x-1 mt-2 text-customRed text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_phone}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={csLabel}>
                <IoMailOutline className="mr-2" />
                Email
              </label>
              <input
                type="email"
                name="company_email"
                value={settings.company_email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={validationErrors.company_email ? csInputErr : csInput}
                placeholder="contacto@inmobiliaria.com"
              />
              {validationErrors.company_email && (
                <div className="flex items-center space-x-1 mt-2 text-customRed text-sm">
                  <IoWarningOutline className="w-4 h-4" />
                  <span>{validationErrors.company_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp para Landing Page */}
          <div>
            <label className={csLabel}>
              <IoLogoWhatsapp className="mr-2 text-brand-light" />
              WhatsApp de Contacto
              {tenantInfo.hasLanding && (
                <span className="ml-2 text-xs bg-brand-muted text-brand-light border border-borderStrong px-2 py-0.5 rounded-full">
                  Se mostrará en tu Landing
                </span>
              )}
            </label>
            <input
              type="text"
              name="company_whatsapp"
              value={settings.company_whatsapp}
              onChange={handleChange}
              className={csInput}
              placeholder="+5491112345678 (con código de país)"
            />
            <p className="text-xs text-textMuted mt-1">
              💡 Los visitantes de tu landing podrán contactarte por WhatsApp. Incluye código de país (ej: +549).
            </p>
          </div>

          {/* Matrícula y Título Profesional */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Matrícula */}
            <div>
              <label className={csLabel}>
                <IoDocumentTextOutline className="mr-2" />
                Matrícula o Número de Registro
              </label>
              <input
                type="text"
                name="company_registration"
                value={settings.company_registration}
                onChange={handleChange}
                className={csInput}
                placeholder="Ej: M.P. Nº 275"
              />
            </div>

            {/* Título Profesional */}
            <div>
              <label className={csLabel}>
                <IoDocumentTextOutline className="mr-2" />
                Título Profesional
              </label>
              <input
                type="text"
                name="professional_title"
                value={settings.professional_title}
                onChange={handleChange}
                className={csInput}
                placeholder="Ej: ARQUITECTA, MARTILLERO PÚBLICO"
              />
            </div>
          </div>

          {/* Datos Impositivos */}
          <div className={`${card} p-4`}>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Datos Impositivos</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              {/* Ingresos Brutos */}
              <div>
                <label className={csLabel}>
                  <IoDocumentTextOutline className="mr-2" />
                  Ingresos Brutos
                </label>
                <input
                  type="text"
                  name="company_ingresos_brutos"
                  value={settings.company_ingresos_brutos}
                  onChange={handleIibbChange}
                  className={csInput}
                  placeholder="20-12345678-9"
                  inputMode="numeric"
                />
              </div>

              {/* Inicio de Actividad */}
              <div>
                <label className={csLabel}>
                  <IoDocumentTextOutline className="mr-2" />
                  Inicio de Actividad
                </label>
                <input
                  type="text"
                  name="company_inicio_actividad"
                  value={settings.company_inicio_actividad}
                  onChange={handleDateChange}
                  className={csInput}
                  placeholder="DD-MM-AAAA"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Condición IVA */}
            <div>
              <label className={csLabel}>
                <IoDocumentTextOutline className="mr-2" />
                Condición ante IVA
              </label>
              <select
                name="company_condicion_iva"
                value={settings.company_condicion_iva}
                onChange={handleChange}
                className={csInput}
              >
                <option value="RESPONSABLE MONOTRIBUTO">RESPONSABLE MONOTRIBUTO</option>
                <option value="RESPONSABLE INSCRIPTO">RESPONSABLE INSCRIPTO</option>
                <option value="IVA EXENTO">IVA EXENTO</option>
                <option value="CONSUMIDOR FINAL">CONSUMIDOR FINAL</option>
              </select>
            </div>
          </div>

          {/* Configuración de Recibos */}
          <div className={`${card} p-4 border-borderStrong bg-brand-subtle/30`}>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Configuración de Recibos</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              {/* Prefijo de Recibo */}
              <div>
                <label className={csLabel}>
                  <IoDocumentTextOutline className="mr-2" />
                  Tipo de Comprobante
                </label>
                <select
                  name="receipt_prefix"
                  value={settings.receipt_prefix}
                  onChange={handleChange}
                  className={csInput}
                >
                  <option value="X">X - No válido como factura</option>
                  <option value="A">A - Responsable Inscripto</option>
                  <option value="B">B - Consumidor Final</option>
                  <option value="C">C - IVA Exento</option>
                </select>
                <p className="text-xs text-textSecondary mt-1">
                  Esta letra aparecerá en tus recibos de pago
                </p>
              </div>
            </div>

            {/* Texto de pie de recibo */}
            <div>
              <label className={csLabel}>
                <IoDocumentTextOutline className="mr-2" />
                Texto de Pie de Recibo (Opcional)
              </label>
              <textarea
                name="receipt_footer_text"
                value={settings.receipt_footer_text}
                onChange={handleChange}
                rows="2"
                className={csInput}
                placeholder="Ej: Gracias por su pago"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className={csLabel}>
              <IoImageOutline className="mr-2" />
              Logo de la Inmobiliaria
            </label>
            
            <div className="space-y-4">
              {/* Botón para subir logo */}
              <label className={`${btnPrimary} cursor-pointer inline-flex`}>
                <IoCloudUploadOutline className="w-5 h-5" />
                <span>Subir Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoWidget}
                />
              </label>
              
              <p className="text-sm text-textMuted">
                El logo aparecerá en PDFs de propiedades, contratos y documentos oficiales
              </p>

              {/* Vista previa del logo */}
              {settings.company_logo_url && (
                <div className="relative inline-block">
                  <div className={`${card} p-4`}>
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
                    className="absolute -top-2 -right-2 bg-customRed hover:bg-customRedDark text-textWhite rounded-full p-2 shadow-lg transition-colors duration-200"
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
            <label className={csLabel}>
              <IoDocumentTextOutline className="mr-2" />
              Slogan de tu Inmobiliaria (Opcional)
            </label>
            <textarea
              name="contract_footer_text"
              value={settings.contract_footer_text}
              onChange={handleChange}
              rows={3}
              className={csInput}
              placeholder="Texto personalizado para tus publicaciones"
            />
          </div>

          {/* Botón Guardar */}
          <div className="flex justify-end pt-4 border-t border-borderBase">
            {Object.keys(validationErrors).length > 0 && (
              <div className="flex-1 mr-4">
                <div className={alertError}>
                  <div className="flex items-center space-x-2 text-sm">
                    <IoWarningOutline className="w-4 h-4" />
                    <span>Por favor, corrige los errores antes de guardar</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className={`${btnPrimary} px-8 py-3 ${isSaving || Object.keys(validationErrors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className={`${csCardPad} p-8`}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-textPrimary mb-2">
                Plantillas de Mensajes
              </h2>
              <p className="text-textSecondary">
                Personaliza los mensajes que se envían a clientes para WhatsApp y requisitos de alquiler.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* WhatsApp Template */}
              <div className="border-b border-borderBase pb-8">
                <div className="flex items-start justify-between mb-3">
                  <label className="block text-lg font-semibold text-textPrimary">
                    Mensaje de WhatsApp para Consultas
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, whatsapp_template: DEFAULT_WHATSAPP_TEMPLATE }))}
                    className="text-xs text-brand-light hover:text-textPrimary underline flex-shrink-0 ml-4"
                  >
                    Restaurar por defecto
                  </button>
                </div>
                <p className="text-sm text-textSecondary mb-4">
                  Este mensaje se usa cuando un cliente consulta por una propiedad (panel admin y landing).
                  Las variables se reemplazan automáticamente con los datos reales de la propiedad.
                </p>
                <div className={`${card} p-4 mb-4 bg-brand-subtle/30`}>
                  <p className="text-sm font-semibold text-brand-light mb-2">Variables disponibles — arrastrá al editor:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { v: '{tipoOperacion}', desc: 'alquiler / venta' },
                      { v: '{tipo}',          desc: 'casa / depto / etc.' },
                      { v: '{precio}',        desc: 'precio formateado' },
                      { v: '{direccion}',     desc: 'dirección' },
                      { v: '{ciudad}',        desc: 'ciudad' },
                      { v: '{barrio}',        desc: 'barrio' },
                      { v: '{habitaciones}',  desc: 'ambientes' },
                      { v: '{baños}',         desc: 'baños' },
                      { v: '{superficieTotal}', desc: 'm² totales' },
                      { v: '{descripcion}',   desc: 'descripción' },
                      { v: '{empresa}',       desc: 'nombre inmobiliaria' },
                    ].map(({ v, desc }) => (
                      <span
                        key={v}
                        draggable
                        onDragStart={(e) => handleVarDragStart(e, v)}
                        className="cursor-grab active:cursor-grabbing select-none px-2 py-1 text-xs font-mono text-brand-light bg-brand-muted hover:bg-brand-subtle rounded border border-borderStrong transition-colors flex flex-col"
                        title={desc}
                      >
                        <span>{v}</span>
                        <span className="text-textMuted font-sans font-normal">{desc}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  name="whatsapp_template"
                  value={settings.whatsapp_template}
                  onChange={handleChange}
                  onDragOver={handleTextareaDragOver}
                  onDragEnter={() => setDragOverField('whatsapp_template')}
                  onDragLeave={() => setDragOverField(null)}
                  onDrop={(e) => handleTextareaDrop(e, 'whatsapp_template')}
                  rows={10}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent font-mono text-sm transition-colors ${csInput} ${
                    dragOverField === 'whatsapp_template'
                      ? 'border-brand bg-brand-subtle/50 ring-2 ring-brand'
                      : ''
                  }`}
                  placeholder="Escribe tu plantilla de mensaje aquí... o arrastrá variables desde arriba."
                />
              </div>

              {/* Requisitos Template */}
              <div className="pb-8">
                <label className="block text-lg font-semibold text-textPrimary mb-3">
                  Mensaje de Requisitos de Alquiler
                </label>
                <p className="text-sm text-textSecondary mb-4">
                  Este mensaje se copia al portapapeles cuando solicitas requisitos para una propiedad.
                  Usa las siguientes variables:
                </p>
                <div className={`${card} p-4 mb-4 bg-brand-subtle/30`}>
                  <p className="text-sm font-mono text-brand-light">
                    <span className="font-semibold">Variables disponibles:</span>
                  </p>
                  <p className="text-xs text-textMuted mt-2 mb-1">↓ Arrastrá una variable al editor de abajo</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["{address}","{price}"].map(v => (
                      <span
                        key={v}
                        draggable
                        onDragStart={(e) => handleVarDragStart(e, v)}
                        className="cursor-grab active:cursor-grabbing select-none px-2 py-1 text-sm font-mono text-brand-light bg-brand-muted hover:bg-brand-subtle rounded border border-borderStrong transition-colors"
                        title="Arrastrá al editor"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  name="requisitos_template"
                  value={settings.requisitos_template}
                  onChange={handleChange}
                  onDragOver={handleTextareaDragOver}
                  onDragEnter={() => setDragOverField('requisitos_template')}
                  onDragLeave={() => setDragOverField(null)}
                  onDrop={(e) => handleTextareaDrop(e, 'requisitos_template')}
                  rows={15}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent font-mono text-sm transition-colors ${csInput} ${
                    dragOverField === 'requisitos_template'
                      ? 'border-brand bg-brand-subtle/50 ring-2 ring-brand'
                      : ''
                  }`}
                  placeholder="Escribe tu plantilla de requisitos aquí... o arrastrá variables desde arriba."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-borderBase">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${btnPrimary} ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        ) : activeTab === 'mercadolibre' ? (
          <MercadoLibreIntegration direct />
        ) : activeTab === 'integrations' ? (
          <div className="space-y-6">
            <ElectronicInvoicingIntegration />
          </div>
        ) : activeTab === 'payments' ? (
          // Pestaña de Métodos de Pago
          <PaymentMethodsManager />
        ) : null}

        {/* Ayuda - Solo mostrar en tab general */}
        {activeTab === 'general' && (
          <div className={`mt-6 ${alertSuccess}`}>
            <div className="flex items-start space-x-3">
              <IoInformationCircleOutline className="w-5 h-5 text-brand-light mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-textSecondary mb-2">
                  <strong className="text-textPrimary">💡 Importante:</strong> Esta información se usará en todos los documentos generados por el sistema.
                </p>
                <ul className="text-sm text-textMuted space-y-1 ml-4">
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
      </div>
    </div>
  );
};

export default CompanySettings;

