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
import LoginAdmin from "./Components/Admin/Login/Login";
// eslint-disable-next-line no-unused-vars
import ProtectedRoutes from "./utils/ProtectedRoutes";
import PaymentForm from "./Components/Pagos/PaymentForm";

import PaymentList from "./Components/Pagos/PaymentList";
import PaymentReport from "./Components/Pagos/PaymentReport";
import PanelInformes from "./Components/Admin/PanelInformes";
import ContractAlerts from "./Components/Contratos/ContractAlerts";
import ActualizarAlquileres from "./Components/Contratos/ActualizarAlquileres";
import ContratoAlquiler from "./Components/PdfTemplates/ContratoAlquiler";
import ReciboPreview from "./Components/PdfTemplates/ReciboPreview";
import ContratoPreview from "./Components/PdfTemplates/ContratoPreview";
import SignatureManager from "./Components/Admin/SignatureManager";
import InstallPWA from "./Components/InstallPWA";

function App() {
  return (
    <>
      <InstallPWA />
      <Routes>
      <Route path="/" element={<Landing />} />
      {/* Ruta protegida: solo los administradores pueden ver el Panel */}
      <Route
        path="/panel"
        element={
          //  <ProtectedRoutes>
          <Panel />
          //  </ProtectedRoutes>
        }
      />
       <Route
        path="/panelClientes"
        element={
          //  <ProtectedRoutes>
          <PanelClientes />
          //  </ProtectedRoutes>
        }
      />
      <Route
        path="/listadoClientes"
        element={
          //  <ProtectedRoutes>
          <ListadoDeClientes />
          //  </ProtectedRoutes>
        }
      />
      <Route
        path="/panelContratos"
        element={
          //  <ProtectedRoutes>
          <PanelContratos />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/panelPropiedades"
        element={
          //  <ProtectedRoutes>
          <PanelPropiedades />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/PanelInformes"
        element={
          //  <ProtectedRoutes>
          <PanelInformes />
          //  </ProtectedRoutes>
        }
      />


<Route
        path="/listadoDePropiedades"
        element={
          //  <ProtectedRoutes>
          <Listado />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/filtro"
        element={
          //  <ProtectedRoutes>
          <FiltroPropiedades />
          //  </ProtectedRoutes>
        }
      />


      <Route
        path="/cliente"
        element={
          //  <ProtectedRoutes>
          <Clientes />
          //  </ProtectedRoutes>
        }
      />
      <Route
        path="/contratoAlquiler"
        element={
          //  <ProtectedRoutes>
          <Listado mode="lease" />
          //  </ProtectedRoutes>
        }
      />
      
      <Route
        path="/sale"
        element={
          //  <ProtectedRoutes>
          <Listado mode="sale" />
          //  </ProtectedRoutes>
        }
      />

      <Route
        path="/cargarPropiedad"
        element={
          //  <ProtectedRoutes>
          <Propiedades />
          //  </ProtectedRoutes>
        }
      />
      <Route
        path="/create-payment"
        element={
          //  <ProtectedRoutes>
          <PaymentForm />
          //  </ProtectedRoutes>
        }
      />
      
<Route
        path="/leaseList"
        element={
          //  <ProtectedRoutes>
          <EstadoContratos />
          //  </ProtectedRoutes>
        }
      />
      <Route
        path="/pdf"
        element={
          //  <ProtectedRoutes>
          <ContratoAlquiler />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/paymentList"
        element={
          //  <ProtectedRoutes>
          <PaymentList />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/reportes"
        element={
          //  <ProtectedRoutes>
          <PaymentReport />
          //  </ProtectedRoutes>
        }
      />

<Route
        path="/alertas"
        element={
          //  <ProtectedRoutes>
          <ContractAlerts />
          //  </ProtectedRoutes>
        }
      />

      <Route
        path="/actualizarAlquileres"
        element={
          //  <ProtectedRoutes>
          <ActualizarAlquileres />
          //  </ProtectedRoutes>
        }
      />

      <Route 
        path="/preview-recibo" 
        element={<ReciboPreview />} 
      />

      <Route 
        path="/preview-contrato" 
        element={<ContratoPreview />} 
      />

      <Route 
        path="/signature-manager" 
        element={<SignatureManager />} 
      />

      <Route path="/login" element={<LoginAdmin />} />
    </Routes>
    </>
  );
}

export default App;
