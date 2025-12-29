import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllClients } from '../../redux/Actions/actions';
import * as XLSX from 'xlsx';
import { 
  IoLogOutOutline, 
  IoListOutline, 
  IoPersonAddOutline, 
  IoArrowBackOutline,
  IoPeopleOutline,
  IoHomeOutline,
  IoDownloadOutline,
  IoStatsChartOutline
} from 'react-icons/io5';

const PanelClientes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Obtener clientes desde Redux
  const { clients = [], loading } = useSelector((state) => ({
    clients: state.clients || [],
    loading: state.loading
  }));

  // Cargar clientes al montar el componente
  useEffect(() => {
    dispatch(getAllClients());
  }, [dispatch]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalClientes = clients.length;
    
    // Clientes nuevos del mes actual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const nuevosDelMes = clients.filter(client => {
      if (!client.createdAt) return false;
      const createdDate = new Date(client.createdAt);
      return createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    }).length;

    // Clientes con propiedades (activos)
    const activos = clients.filter(client => 
      client.properties && client.properties.length > 0
    ).length;

    // Clientes con contratos
    const conContratos = clients.filter(client => 
      client.leases && client.leases.length > 0
    ).length;

    return {
      totalClientes,
      nuevosDelMes,
      activos,
      conContratos
    };
  }, [clients]);

  // Función para exportar a Excel
  const handleExportExcel = () => {
    if (clients.length === 0) {
      alert('No hay clientes para exportar');
      return;
    }

    // Preparar datos para Excel
    const excelData = clients.map(client => ({
      'CUIL': client.cuil || '',
      'Nombre': client.name || '',
      'Email': client.email || '',
      'Teléfono': client.mobilePhone || '',
      'Dirección': client.direccion || '',
      'Ciudad': client.ciudad || '',
      'Provincia': client.provincia || '',
      'Propiedades': client.properties?.length || 0,
      'Contratos': client.leases?.length || 0,
      'Fecha Creación': client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : ''
    }));

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // CUIL
      { wch: 30 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 40 }, // Dirección
      { wch: 20 }, // Ciudad
      { wch: 15 }, // Provincia
      { wch: 12 }, // Propiedades
      { wch: 12 }, // Contratos
      { wch: 15 }  // Fecha Creación
    ];
    ws['!cols'] = colWidths;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');
    const filename = `Clientes_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, filename);
  };

  const handleLogout = () => {
    // Aquí agregarías tu lógica de logout
    navigate('/panel');
  };

  const clientActions = [
    {
      title: 'Listado de Clientes',
      path: '/listadoClientes',
      icon: IoListOutline,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
      description: 'Ver todos los clientes registrados'
    },
    {
      title: 'Nuevo Cliente',
      path: '/cliente',
      icon: IoPersonAddOutline,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-600 to-emerald-700',
      description: 'Registrar un nuevo cliente'
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
              <span className="text-white font-medium">Clientes</span>
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
            <div className="p-4 bg-blue-500/20 rounded-full">
              <IoPeopleOutline className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Gestión de Clientes
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Administra toda la información de tus clientes de manera eficiente
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          {clientActions.map((action) => {
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
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <IoStatsChartOutline className="w-6 h-6 mr-2 text-blue-400" />
              Estadísticas de Clientes
            </h2>
            
            {/* Botón de descarga Excel */}
            <button
              onClick={handleExportExcel}
              disabled={loading || clients.length === 0}
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-slate-300 mt-4">Cargando estadísticas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Clientes', value: stats.totalClientes, color: 'text-blue-400' },
                { label: 'Nuevos (Mes)', value: stats.nuevosDelMes, color: 'text-emerald-400' },
                { label: 'Con Propiedades', value: stats.activos, color: 'text-amber-400' },
                { label: 'Con Contratos', value: stats.conContratos, color: 'text-purple-400' }
              ].map((stat, index) => (
                <div key={index} className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors duration-300">
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PanelClientes;