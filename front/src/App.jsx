import { Routes, Route, useLocation } from "react-router-dom";
import Landing from "./Components/Landing";
import Panel from "./Components/Admin/Panel";
import Clientes from "./Components/Clientes/Clientes";
import Propiedades from "./Components/Propiedades/Propiedades";
import EstadoContratos from "./Components/Contratos/EstadoContratos";
import PanelClientes from "./Components/Admin/PanelClientes";
import PanelContratos from "./Components/Admin/PanelContratos";
import PanelPropiedades from "./Components/Admin/PanelPropiedades";
import PanelLeads from "./Components/Admin/PanelLeads";
import SoporteTickets from "./Components/Admin/SoporteTickets";
import ListadoDeClientes from "./Components/Clientes/ListadoDeClientes";
import Listado from "./Components/Propiedades/Listado";
import FiltroPropiedades from "./Components/Propiedades/FiltroPropiedades"
import LoginAdmin from "./Admin/Login/Login"; // 🔄 ACTUALIZADO: Nueva ruta
import ForgotPassword from "./Admin/Login/ForgotPassword"; // 🆕 NUEVO
import ResetPassword from "./Admin/Login/ResetPassword"; // 🆕 NUEVO
import Register from "./Components/Register"; // 🆕 NUEVO - Registro con plan
import PlatformAdminDashboard from "./Admin/PlatformAdmin/Dashboard"; // 🆕 NUEVO
import TenantList from "./Admin/PlatformAdmin/TenantList"; // 🆕 NUEVO
import TenantDetail from "./Admin/PlatformAdmin/TenantDetail"; // 🆕 NUEVO
// 🆕 NUEVO - Componentes de Suscripción
import PlanSelector from "./Components/PlanSelector";
// Páginas públicas
import ContactForm from "./Components/ContactForm";
import TermsOfService from "./Components/TermsOfService";
import PrivacyPolicy from "./Components/PrivacyPolicy";

import SubscriptionSuccess from "./Components/SubscriptionSuccess";
// 🆕 NUEVO - Landing Pages Públicas
import TenantLanding from "./Components/Landing/TenantLanding";
import PropertyDetail from "./Components/Landing/PropertyDetail";
import LoteoDetail from "./Components/Landing/LoteoDetail";
import PanelLoteos from "./Components/Admin/PanelLoteos";
import PanelAgentes from "./Components/Admin/PanelAgentes";
import PanelComisiones from "./Components/Admin/PanelComisiones";
// eslint-disable-next-line no-unused-vars
import ProtectedRoutes from "./utils/ProtectedRoutes";
import PaymentForm from "./Components/Pagos/PaymentForm";

import CreateLeaseForm from "./Components/Contratos/CreateLeaseForm";
import PaymentList from "./Components/Pagos/PaymentList";
import PaymentReport from "./Components/Pagos/PaymentReport";
import PanelInformes from "./Components/Admin/PanelInformes";
import ContractAlerts from "./Components/Contratos/ContractAlerts";
import ActualizarAlquileres from "./Components/Contratos/ActualizarAlquileres";
import PanelLiquidaciones from "./Components/Liquidaciones/PanelLiquidaciones";
import ContratoAlquiler from "./Components/PdfTemplates/ContratoAlquiler";
import ReciboPreview from "./Components/PdfTemplates/ReciboPreview";
import ContratoPreview from "./Components/PdfTemplates/ContratoPreview";
import SignatureManager from "./Components/Admin/SignatureManager";
import CompanySettings from "./Components/Admin/CompanySettings"; // 🆕 NUEVO
import SubscriptionManager from "./Components/Admin/SubscriptionManager"; // 🆕 NUEVO - Gestión de suscripción
import PdfTemplateManager from "./Components/Admin/PdfTemplateManager"; // 🆕 NUEVO - Gestión de plantillas PDF
import InstallPWA from "./Components/InstallPWA";
import ProtectedRoute from "./Components/Guards/ProtectedRoute"; // 🆕 Guard combinado
import { useTokenExpiry } from "./hooks/useTokenExpiry";
import { useSelector } from "react-redux";
import { selectIsImpersonating, selectImpersonatedTenant } from "@shared/redux";

function App() {
  useTokenExpiry();
  const isImpersonating = useSelector(selectIsImpersonating);
  const impersonatedTenant = useSelector(selectImpersonatedTenant);
  const location = useLocation();

  // Rutas de app (admin + auth + públicas no-landing) — en estas SÍ se muestra el botón PWA
  const ADMIN_PREFIXES = [
    '/panel', '/login', '/admin', '/clientes', '/listadoClientes',
    '/propiedades', '/contratos', '/configuracion', '/suscripcion',
    '/loteos', '/soporte', '/panelContratos', '/panelPropiedades',
    '/panelLeads', '/panelClientes', '/panelLoteos', '/firmas', '/leads',
    '/plans', '/register', '/registro', '/subscription', '/company-settings',
    '/platform-admin', '/contacto', '/terminos', '/privacidad',
    '/forgot-password', '/reset-password', '/pdf-templates',
  ];
  // Ocultar PWA en rutas públicas: '/', tenant landings (/:subdomain), y páginas no-admin
  const isAdminRoute = ADMIN_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
  const showPWA = isAdminRoute;

  return (
    <>
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white text-sm py-2 px-4 flex items-center justify-between shadow-lg">
          <span>
            🎭 <strong>Modo Impersonación</strong> — Estás viendo la app como{' '}
            <strong>{impersonatedTenant?.businessName || 'un tenant'}</strong>
          </span>
          <button
            onClick={() => window.close()}
            className="ml-4 px-3 py-1 bg-white text-orange-600 rounded text-xs font-bold hover:bg-orange-100"
          >
            Cerrar pestaña
          </button>
        </div>
      )}
      <div className={isImpersonating ? 'pt-10' : ''}>
        {showPWA && <InstallPWA />}
        <Routes>
      <Route path="/" element={<Landing />} />

      {/* Misma pantalla que /register — debe ir ANTES de /:subdomain o “registro” se toma como landing de tenant */}
      <Route path="/registro" element={<Register />} />

      {/* 🌐 Rutas Públicas - Landing Pages (sin autenticación) */}
      <Route path="/:subdomain" element={<TenantLanding />} />
      <Route path="/:subdomain/property/:propertyId" element={<PropertyDetail />} />
      <Route path="/:subdomain/loteo/:loteoId" element={<LoteoDetail />} />
      
      {/* Ruta protegida: solo los administradores pueden ver el Panel */}
      <Route path="/panel" element={<ProtectedRoute><Panel /></ProtectedRoute>} />
      <Route path="/panelClientes" element={<ProtectedRoute><PanelClientes /></ProtectedRoute>} />
      <Route path="/listadoClientes" element={<ProtectedRoute><ListadoDeClientes /></ProtectedRoute>} />
      <Route path="/panelContratos" element={<ProtectedRoute><PanelContratos /></ProtectedRoute>} />

      <Route path="/panelPropiedades" element={<ProtectedRoute><PanelPropiedades /></ProtectedRoute>} />

      <Route path="/panelLeads" element={<ProtectedRoute><PanelLeads /></ProtectedRoute>} />
      <Route path="/soporte" element={<ProtectedRoute><SoporteTickets /></ProtectedRoute>} />
      <Route path="/panelLoteos" element={<ProtectedRoute><PanelLoteos /></ProtectedRoute>} />
      <Route path="/panelAgentes" element={<ProtectedRoute><PanelAgentes /></ProtectedRoute>} />
      <Route path="/panelComisiones" element={<ProtectedRoute><PanelComisiones /></ProtectedRoute>} />

      <Route path="/PanelInformes" element={<ProtectedRoute><PanelInformes /></ProtectedRoute>} />


      <Route path="/listadoDePropiedades" element={<ProtectedRoute><Listado /></ProtectedRoute>} />

      <Route path="/filtro" element={<ProtectedRoute><FiltroPropiedades /></ProtectedRoute>} />


      <Route path="/cliente" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/contratoAlquiler" element={<ProtectedRoute><Listado mode="lease" /></ProtectedRoute>} />
      <Route path="/crearContrato" element={<ProtectedRoute><CreateLeaseForm /></ProtectedRoute>} />
      
      <Route path="/sale" element={<ProtectedRoute><Listado mode="sale" /></ProtectedRoute>} />

      <Route path="/cargarPropiedad" element={<ProtectedRoute><Propiedades /></ProtectedRoute>} />
      <Route path="/create-payment" element={<ProtectedRoute><PaymentForm /></ProtectedRoute>} />
      
      <Route path="/leaseList" element={<ProtectedRoute><EstadoContratos /></ProtectedRoute>} />
      <Route path="/pdf" element={<ProtectedRoute><ContratoAlquiler /></ProtectedRoute>} />

      <Route path="/paymentList" element={<ProtectedRoute><PaymentList /></ProtectedRoute>} />
      <Route path="/liquidaciones" element={<ProtectedRoute><PanelLiquidaciones /></ProtectedRoute>} />

      <Route path="/reportes" element={<ProtectedRoute><PaymentReport /></ProtectedRoute>} />

      <Route path="/alertas" element={<ProtectedRoute><ContractAlerts /></ProtectedRoute>} />

      <Route path="/actualizarAlquileres" element={<ProtectedRoute><ActualizarAlquileres /></ProtectedRoute>} />

      <Route path="/preview-recibo" element={<ProtectedRoute><ReciboPreview /></ProtectedRoute>} />

      <Route path="/preview-contrato" element={<ProtectedRoute><ContratoPreview /></ProtectedRoute>} />

      <Route path="/signature-manager" element={<ProtectedRoute><SignatureManager /></ProtectedRoute>} />

      {/* 🆕 NUEVA RUTA - Configuración de la inmobiliaria */}
      <Route 
        path="/company-settings" 
        element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} 
      />
      <Route 
        path="/admin/company-settings" 
        element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} 
      />

      {/* 🆕 NUEVA RUTA - Gestión de suscripción */}
      <Route 
        path="/subscription" 
        element={<ProtectedRoute><SubscriptionManager /></ProtectedRoute>} 
      />
      <Route 
        path="/admin/subscription" 
        element={<ProtectedRoute><SubscriptionManager /></ProtectedRoute>} 
      />

      {/* 🆕 NUEVA RUTA - Gestión de plantillas PDF */}
      <Route 
        path="/pdf-templates" 
        element={<ProtectedRoute><PdfTemplateManager /></ProtectedRoute>} 
      />
      <Route 
        path="/admin/pdf-templates" 
        element={<ProtectedRoute><PdfTemplateManager /></ProtectedRoute>} 
      />

      {/* Autenticación */}
      <Route path="/login" element={<LoginAdmin />} />
      <Route path="/register" element={<Register />} /> {/* 🆕 NUEVO - Registro con plan */}
      <Route path="/forgot-password" element={<ForgotPassword />} /> {/* 🆕 NUEVO */}
      <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* 🆕 NUEVO */}
      
      {/* Platform Admin */}
      <Route path="/platform-admin/dashboard" element={<PlatformAdminDashboard />} /> {/* 🆕 NUEVO */}
      <Route path="/platform-admin/tenants" element={<TenantList />} /> {/* 🆕 NUEVO */}
      <Route path="/platform-admin/tenants/:tenantId" element={<TenantDetail />} /> {/* 🆕 NUEVO */}

      {/* 🆕 NUEVO - Suscripciones y Planes */}
      <Route path="/plans" element={<PlanSelector />} /> {/* Selector de planes (público/autenticado) */}
      <Route path="/subscription/success" element={<SubscriptionSuccess />} /> {/* Callback de MercadoPago */}

      {/* Páginas públicas */}
      <Route path="/contacto" element={<ContactForm />} />
      <Route path="/terminos" element={<TermsOfService />} />
      <Route path="/privacidad" element={<PrivacyPolicy />} />
    </Routes>
      </div>
    </>
  );
}

export default App;
