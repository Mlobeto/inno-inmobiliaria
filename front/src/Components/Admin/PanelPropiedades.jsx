import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProperties } from '../../redux/Actions/actions';
import * as XLSX from 'xlsx';
import { 
  IoLogOutOutline, 
  IoHomeOutline, 
  IoAddOutline, 
  IoListOutline, 
  IoFilterOutline,
  IoArrowBackOutline,
  IoBusinessOutline,
  IoStatsChartOutline,
  IoLocationOutline,
  IoPricetagOutline,
  IoDownloadOutline
} from 'react-icons/io5';

const PanelPropiedades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Obtener propiedades desde Redux
  const { properties = [], loading } = useSelector((state) => ({
    properties: state.allProperties || [],
    loading: state.loading
  }));

  // Cargar propiedades al montar el componente
  useEffect(() => {
    dispatch(getAllProperties());
  }, [dispatch]);

  
  const stats = useMemo(() => {
    const totalPropiedades = properties.length;
    
  
    const disponibles = properties.filter(prop => 
      prop.isAvailable === true || prop.isAvailable === "true"
    ).length;

    // Propiedades no disponibles (vendidas/alquiladas)
    const noDisponibles = properties.filter(prop => 
      prop.isAvailable === false || prop.isAvailable === "false"
    ).length;

    // Propiedades por tipo (ejemplo: en proceso - podrías ajustar según tu lógica)
    const enProceso = properties.filter(prop => 
      prop.clients && prop.clients.length > 0 && prop.isAvailable
    ).length;

    return {
      totalPropiedades,
      disponibles,
      noDisponibles,
      enProceso
    };
  }, [properties]);

  // Función para exportar a Excel
  const handleExportExcel = () => {
    if (properties.length === 0) {
      alert('No hay propiedades para exportar');
      return;
    }

    // Preparar datos para Excel
    const excelData = properties.map(prop => ({
      'ID': prop.propertyId || '',
      'Dirección': prop.address || '',
      'Barrio': prop.neighborhood || '',
      'Ciudad': prop.city || '',
      'Tipo Operación': prop.type || '',
      'Tipo Propiedad': prop.tipoPropiedad || '',
      'Precio': prop.price ? `$${prop.price}` : '',
      'Habitaciones': prop.rooms || 0,
      'Baños': prop.bathrooms || 0,
      'Superficie Total': prop.superficieTotal || '',
      'Superficie Cubierta': prop.superficieCubierta || '',
      'Disponible': prop.isAvailable ? 'Sí' : 'No',
      'Escritura': prop.escritura || '',
      'Comisión': prop.comision ? `${prop.comision}%` : '',
      'Clientes Asignados': prop.clients?.length || 0,
      'Imágenes': prop.images?.length || 0,
      'Link Maps': prop.linkMaps || '',
      'Link Instagram': prop.linkInstagram || '',
      'Fecha Creación': prop.createdAt ? new Date(prop.createdAt).toLocaleDateString('es-AR') : ''
    }));

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 8 },  // ID
      { wch: 40 }, // Dirección
      { wch: 20 }, // Barrio
      { wch: 20 }, // Ciudad
      { wch: 15 }, // Tipo Operación
      { wch: 20 }, // Tipo Propiedad
      { wch: 15 }, // Precio
      { wch: 13 }, // Habitaciones
      { wch: 10 }, // Baños
      { wch: 18 }, // Superficie Total
      { wch: 18 }, // Superficie Cubierta
      { wch: 12 }, // Disponible
      { wch: 25 }, // Escritura
      { wch: 12 }, // Comisión
      { wch: 18 }, // Clientes Asignados
      { wch: 10 }, // Imágenes
      { wch: 50 }, // Link Maps
      { wch: 50 }, // Link Instagram
      { wch: 15 }  // Fecha Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const filename = `Propiedades_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, filename);
  };

  const handleLogout = () => {
    navigate('/panel');
  };

  const propertyActions = [
    {
      title: 'Alta Propiedades',
      path: '/cargarPropiedad',
      icon: IoAddOutline,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 to-emerald-700',
      description: 'Agregar nueva propiedad'
    },
    {
      title: 'Filtro',
      path: '/filtro',
      icon: IoFilterOutline,
      gradient: 'from-amber-500 to-orange-500',
      hoverGradient: 'from-amber-600 to-orange-600',
      description: 'Filtrar propiedades'
    },
    {
      title: 'Listado',
      path: '/listadoDePropiedades',
      icon: IoListOutline,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      description: 'Ver todas las propiedades'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link 
              to="/panel" 
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver al Panel</span>
            </Link>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <Link to="/panel" className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </Link>
              <span>/</span>
              <span className="text-white font-medium">Propiedades</span>
            </nav>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-white flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all duration-300"
          >
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
            <IoLogOutOutline className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-full">
              <IoBusinessOutline className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Gestión de Propiedades
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Administra tu cartera inmobiliaria de manera eficiente
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {propertyActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className={`group relative bg-gradient-to-br ${action.gradient} hover:${action.hoverGradient} p-8 sm:p-12 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10`}
              >
                <div className="flex flex-col items-center space-y-6 text-white">
                  <div className="p-6 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{action.title}</h3>
                    <p className="text-white/80 text-sm sm:text-base">{action.description}</p>
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <IoStatsChartOutline className="w-6 h-6 mr-2 text-emerald-400" />
              Estadísticas de Propiedades
            </h2>
            
            {/* Botón de descarga Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading || properties.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Descargar lista completa en Excel"
            >
              <IoDownloadOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
              <p className="text-slate-300 mt-4">Cargando estadísticas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Propiedades', value: stats.totalPropiedades, icon: IoBusinessOutline, color: 'text-emerald-400' },
                { label: 'Disponibles', value: stats.disponibles, icon: IoHomeOutline, color: 'text-blue-400' },
                { label: 'Vendidas/Alquiladas', value: stats.noDisponibles, icon: IoPricetagOutline, color: 'text-amber-400' },
                { label: 'Con Clientes', value: stats.enProceso, icon: IoLocationOutline, color: 'text-purple-400' }
              ].map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
                    <div className="flex justify-center mb-2">
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default PanelPropiedades;