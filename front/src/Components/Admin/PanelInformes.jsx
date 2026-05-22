import {
  IoStatsChartOutline,
  IoDocumentTextOutline,
  IoCashOutline,
} from 'react-icons/io5';
import { AdminPanelLayout, PanelActionCard } from './AdminPanelLayout';

const PanelInformes = () => (
  <AdminPanelLayout
    title="Informes y Reportes"
    subtitle="Reportes del negocio y pagos por contrato"
    icon={IoStatsChartOutline}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <PanelActionCard
        to="/reportes"
        icon={IoDocumentTextOutline}
        title="Informes"
        description="Generar informes y reportes"
      />
      <PanelActionCard
        to="/paymentList"
        icon={IoCashOutline}
        title="Pagos por Contrato"
        description="Gestionar pagos de contratos"
        iconBg="bg-brand-subtle"
        iconColor="text-brand"
      />
    </div>
  </AdminPanelLayout>
);

export default PanelInformes;
