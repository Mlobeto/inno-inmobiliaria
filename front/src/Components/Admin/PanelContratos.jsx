import { Link } from 'react-router-dom';
import {
  IoDocumentTextOutline,
  IoListOutline,
  IoKeyOutline,
  IoBusinessOutline,
  IoWarningOutline,
  IoCalculatorOutline,
} from 'react-icons/io5';
import { AdminPanelLayout, PanelActionCard, PanelWideLinkCard } from './AdminPanelLayout';

const PanelContratos = () => (
  <AdminPanelLayout
    title="Panel de Contratos"
    subtitle="Alquileres, compraventa, alertas y actualizaciones de renta"
    icon={IoDocumentTextOutline}
  >
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <PanelActionCard to="/leaseList" icon={IoListOutline} title="Listado" description="Ver y gestionar contratos" />
      <PanelActionCard
        to="/contratoAlquiler"
        icon={IoKeyOutline}
        title="Contrato de Alquiler"
        description="Crear nuevos contratos"
        iconBg="bg-brand-subtle"
        iconColor="text-brand"
      />
      <PanelActionCard
        to="/sale"
        icon={IoBusinessOutline}
        title="Compra Venta"
        description="Autorizaciones y ventas"
        iconBg="bg-customBlueMuted"
        iconColor="text-customBlue"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <PanelWideLinkCard
        to="/alertas"
        icon={IoWarningOutline}
        title="Centro de Alertas"
        description="Vencimientos, pagos pendientes y notificaciones"
        accent="yellow"
      />
      <PanelWideLinkCard
        to="/actualizarAlquileres"
        icon={IoCalculatorOutline}
        title="Actualizar Alquileres"
        description="Ajustes por IPC y PDFs de actualización"
      />
    </div>
  </AdminPanelLayout>
);

export default PanelContratos;
