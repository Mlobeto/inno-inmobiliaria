import { Routes, Route } from "react-router-dom";
import Landing from "./Components/Landing";
import Panel from "./Components/Admin/Panel";
import Clientes from "./Components/Clientes/Clientes";
import Propiedades from "./Components/Propiedades/Propiedades";
import EstadoContratos from "./Components/Contratos/EstadoContratos";
import PanelClientes from "./Components/Admin/PanelClientes";
import PanelContratos from "./Components/Admin/PanelContratos";
import PanelPropiedades from "./Components/Admin/PanelPropiedades";
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

import SubscriptionSuccess from "./Components/SubscriptionSuccess";
// 🆕 NUEVO - Landing Pages Públicas
import TenantLanding from "./Components/Landing/TenantLanding";
import PropertyDetail from "./Components/Landing/PropertyDetail";
// eslint-disable-next-line no-unused-vars
import ProtectedRoutes from "./utils/ProtectedRoutes";
import PaymentForm from "./Components/Pagos/PaymentForm";

import CreateLeaseForm from "./Components/Contratos/CreateLeaseForm";
import PaymentList from "./Components/Pagos/PaymentList";
import PaymentReport from "./Components/Pagos/PaymentReport";
import PanelInformes from "./Components/Admin/PanelInformes";
import ContractAlerts from "./Components/Contratos/ContractAlerts";
import ActualizarAlquileres from "./Components/Contratos/ActualizarAlquileres";
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

function App() {
  useTokenExpiry();
  return (
    <>
      <InstallPWA />
      <Routes>
      <Route path="/" element={<Landing />} />
      
      {/* 🌐 Rutas Públicas - Landing Pages (sin autenticación) */}
      <Route path="/landing/:subdomain" element={<TenantLanding />} />
      <Route path="/landing/:subdomain/property/:propertyId" element={<PropertyDetail />} />
      
      {/* Ruta protegida: solo los administradores pueden ver el Panel */}
      <Route path="/panel" element={<ProtectedRoute><Panel /></ProtectedRoute>} />
      <Route path="/panelClientes" element={<ProtectedRoute><PanelClientes /></ProtectedRoute>} />
      <Route path="/listadoClientes" element={<ProtectedRoute><ListadoDeClientes /></ProtectedRoute>} />
      <Route path="/panelContratos" element={<ProtectedRoute><PanelContratos /></ProtectedRoute>} />

      <Route path="/panelPropiedades" element={<ProtectedRoute><PanelPropiedades /></ProtectedRoute>} />

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

      <Route path="/reportes" element={<ProtectedRoute><PaymentReport /></ProtectedRoute>} />

      <Route path="/alertas" element={<ProtectedRoute><ContractAlerts /></ProtectedRoute>} />

      <Route path="/actualizarAlquileres" element={<ProtectedRoute><ActualizarAlquileres /></ProtectedRoute>} />

      <Route path="/preview-recibo" element={<ProtectedRoute><ReciboPreview /></ProtectedRoute>} />

      <Route path="/preview-contrato" element={<ProtectedRoute><ContratoPreview /></ProtectedRoute>} />

      <Route path="/signature-manager" element={<ProtectedRoute><SignatureManager /></ProtectedRoute>} />

      {/* 🆕 NUEVA RUTA - Configuración de la inmobiliaria */}
      <Route 
        path="/company-settings" 
        element={<CompanySettings />} 
      />
      <Route 
        path="/admin/company-settings" 
        element={<CompanySettings />} 
      />

      {/* 🆕 NUEVA RUTA - Gestión de suscripción */}
      <Route 
        path="/subscription" 
        element={<SubscriptionManager />} 
      />
      <Route 
        path="/admin/subscription" 
        element={<SubscriptionManager />} 
      />

      {/* 🆕 NUEVA RUTA - Gestión de plantillas PDF */}
      <Route 
        path="/pdf-templates" 
        element={<PdfTemplateManager />} 
      />
      <Route 
        path="/admin/pdf-templates" 
        element={<PdfTemplateManager />} 
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
    </Routes>
    </>
  );
}

export default App;
