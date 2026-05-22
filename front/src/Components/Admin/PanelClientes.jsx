import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGetAllClientsQuery } from '@shared/redux';
import * as XLSX from 'xlsx';
import {
  IoListOutline,
  IoPersonAddOutline,
  IoPeopleOutline,
  IoDownloadOutline,
} from 'react-icons/io5';
import { AdminPanelLayout, PanelActionCard, PanelStatsGrid } from './AdminPanelLayout';
import { btnSecondary } from './adminPanelTheme';

const PanelClientes = () => {
  const { data: clients = [], isLoading } = useGetAllClientsQuery();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return {
      totalClientes: clients.length,
      nuevosDelMes: clients.filter((client) => {
        if (!client.createdAt) return false;
        const createdDate = new Date(client.createdAt);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length,
      activos: clients.filter((client) => client.properties && client.properties.length > 0).length,
      conContratos: clients.filter((client) => client.leases && client.leases.length > 0).length,
    };
  }, [clients]);

  const handleExportExcel = () => {
    if (clients.length === 0) {
      alert('No hay clientes para exportar');
      return;
    }

    const excelData = clients.map((client) => ({
      CUIL: client.cuil || '',
      Nombre: client.name || '',
      Email: client.email || '',
      Teléfono: client.mobilePhone || '',
      Dirección: client.direccion || '',
      Ciudad: client.ciudad || '',
      Provincia: client.provincia || '',
      Propiedades: client.properties?.length || 0,
      Contratos: client.leases?.length || 0,
      'Fecha Creación': client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, `Clientes_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`);
  };

  return (
    <AdminPanelLayout
      title="Gestión de Clientes"
      subtitle="Dueños, inquilinos, compradores y garantes — el rol se asigna en contratos o propiedades"
      icon={IoPeopleOutline}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <PanelActionCard
          to="/listadoClientes"
          icon={IoListOutline}
          title="Listado de Clientes"
          description="Ver todos los clientes registrados"
        />
        <PanelActionCard
          to="/cliente"
          icon={IoPersonAddOutline}
          title="Nuevo Cliente"
          description="Registrar una persona nueva"
          iconBg="bg-brand-subtle"
        />
      </div>

      <div className="rounded-xl border border-borderBase bg-bgSurface p-4 sm:p-5">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h2 className="text-sm font-semibold text-textPrimary">Estadísticas</h2>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isLoading || clients.length === 0}
            className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <IoDownloadOutline className="w-4 h-4 text-brand-light" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
        </div>
        <PanelStatsGrid
          loading={isLoading}
          loadingLabel="Cargando estadísticas..."
          stats={[
            { label: 'Total clientes', value: stats.totalClientes, iconColor: 'text-brand-light' },
            { label: 'Nuevos (mes)', value: stats.nuevosDelMes, valueColor: 'text-brand-light' },
            { label: 'Con propiedades', value: stats.activos, valueColor: 'text-customYellow' },
            { label: 'Con contratos', value: stats.conContratos, valueColor: 'text-customBlue' },
          ]}
        />
      </div>
    </AdminPanelLayout>
  );
};

export default PanelClientes;
