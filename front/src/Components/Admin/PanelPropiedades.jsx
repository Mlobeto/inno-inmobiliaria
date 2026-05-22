import { useMemo } from 'react';
import {
  IoAddOutline,
  IoListOutline,
  IoFilterOutline,
  IoBusinessOutline,
  IoHomeOutline,
  IoPricetagOutline,
  IoLocationOutline,
  IoDownloadOutline,
} from 'react-icons/io5';
import { useGetAllPropertiesQuery } from '@shared/redux';
import * as XLSX from 'xlsx';
import { AdminPanelLayout, PanelActionCard, PanelStatsGrid } from './AdminPanelLayout';
import { btnSecondary } from './adminPanelTheme';

const PanelPropiedades = () => {
  const { data: properties = [], isLoading } = useGetAllPropertiesQuery();

  const stats = useMemo(() => ({
    totalPropiedades: properties.length,
    disponibles: properties.filter((prop) => prop.isAvailable === true || prop.isAvailable === 'true').length,
    noDisponibles: properties.filter((prop) => prop.isAvailable === false || prop.isAvailable === 'false').length,
    enProceso: properties.filter((prop) => prop.clients && prop.clients.length > 0 && prop.isAvailable).length,
  }), [properties]);

  const handleExportExcel = () => {
    if (properties.length === 0) {
      alert('No hay propiedades para exportar');
      return;
    }

    const excelData = properties.map((prop) => ({
      ID: prop.propertyId || '',
      Dirección: prop.address || '',
      Barrio: prop.neighborhood || '',
      Ciudad: prop.city || '',
      'Tipo Operación': prop.type || '',
      'Tipo Propiedad': prop.tipoPropiedad || '',
      Precio: prop.price ? `$${prop.price}` : '',
      Habitaciones: prop.rooms || 0,
      Baños: prop.bathrooms || 0,
      Disponible: prop.isAvailable ? 'Sí' : 'No',
      'Clientes Asignados': prop.clients?.length || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
    XLSX.writeFile(wb, `Propiedades_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`);
  };

  return (
    <AdminPanelLayout
      title="Gestión de Propiedades"
      subtitle="Alta, listado, filtros y exportación de tu cartera"
      icon={IoBusinessOutline}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <PanelActionCard to="/cargarPropiedad" icon={IoAddOutline} title="Alta" description="Agregar propiedad" />
        <PanelActionCard
          to="/filtro"
          icon={IoFilterOutline}
          title="Filtro"
          description="Buscar propiedades"
          iconBg="bg-customYellowMuted"
          iconColor="text-customYellow"
        />
        <PanelActionCard
          to="/listadoDePropiedades"
          icon={IoListOutline}
          title="Listado"
          description="Ver todas las propiedades"
          iconBg="bg-customBlueMuted"
          iconColor="text-customBlue"
        />
      </div>

      <div className="rounded-xl border border-borderBase bg-bgSurface p-4 sm:p-5">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h2 className="text-sm font-semibold text-textPrimary">Estadísticas</h2>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isLoading || properties.length === 0}
            className={`${btnSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <IoDownloadOutline className="w-4 h-4 text-brand-light" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
        <PanelStatsGrid
          loading={isLoading}
          stats={[
            { label: 'Total', value: stats.totalPropiedades, icon: IoBusinessOutline, iconColor: 'text-brand-light' },
            { label: 'Disponibles', value: stats.disponibles, icon: IoHomeOutline, iconColor: 'text-brand-light', valueColor: 'text-brand-light' },
            { label: 'Vendidas / alquiladas', value: stats.noDisponibles, icon: IoPricetagOutline, iconColor: 'text-customYellow', valueColor: 'text-customYellow' },
            { label: 'Con clientes', value: stats.enProceso, icon: IoLocationOutline, iconColor: 'text-customBlue', valueColor: 'text-customBlue' },
          ]}
        />
      </div>
    </AdminPanelLayout>
  );
};

export default PanelPropiedades;
