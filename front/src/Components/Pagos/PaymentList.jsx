import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllPayments } from '../../redux/Actions/actions';
import ReciboPdf from '../PdfTemplates/ReciboPdf';
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoReceiptOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoDownloadOutline,
  IoTimeOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';

const PaymentList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const payments = useSelector(state => state.allPayments) || [];
  const loading = useSelector(state => state.loading);
  const error = useSelector(state => state.error);

  // Estados para filtros y búsqueda
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [downloadingPayment, setDownloadingPayment] = useState(null);

  useEffect(() => {
    // Obtener todos los pagos
    dispatch(getAllPayments());
  }, [dispatch]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleDownloadReceipt = (payment) => {
    setDownloadingPayment(payment);
    // El componente ReciboPdf se renderizará con autoGenerate y se auto-destruirá
    setTimeout(() => setDownloadingPayment(null), 1000);
  };

  // Filtrar pagos según los criterios
  const filteredPayments = payments.filter(payment => {
    const matchesText = payment.leaseId.toString().includes(filter) ||
      (payment.Client && payment.Client.name.toLowerCase().includes(filter.toLowerCase())) ||
      (payment.period && payment.period.toLowerCase().includes(filter.toLowerCase()));

    const matchesType = typeFilter === 'all' || payment.type === typeFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      switch (dateFilter) {
        case 'thisMonth':
          return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
        case 'lastMonth': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return paymentDate.getMonth() === lastMonth.getMonth() && paymentDate.getFullYear() === lastMonth.getFullYear();
        }
        case 'thisYear':
          return paymentDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    return matchesText && matchesType && matchesDate;
  });

  // Calcular estadísticas
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const avgAmount = filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'installment':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'initial':
        return 'bg-amber-500/20 text-amber-400 border-amber-400/30';
      case 'commission':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  const getPaymentTypeName = (type) => {
    switch (type) {
      case 'installment':
        return 'Cuota';
      case 'initial':
        return 'Pago Inicial';
      case 'commission':
        return 'Comisión';
      default:
        return 'Otro';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)} 
              className="text-white hover:text-blue-300 transition-colors duration-300 flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <span className="text-white font-medium">Listado de Pagos</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoReceiptOutline className="w-8 h-8 text-emerald-400 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Listado de Pagos
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Administra y consulta todos los pagos registrados en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <IoReceiptOutline className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Pagos</p>
                <p className="text-white text-2xl font-bold">{filteredPayments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <IoCashOutline className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Monto Total</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <IoStatsChartOutline className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Promedio</p>
                <p className="text-white text-2xl font-bold">{formatCurrency(avgAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <IoTimeOutline className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Este Mes</p>
                <p className="text-white text-2xl font-bold">
                  {payments.filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <IoFilterOutline className="w-6 h-6 mr-2 text-blue-400" />
            Filtros de Búsqueda
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda general */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-300">
                <IoSearchOutline className="w-4 h-4 mr-2 text-blue-400" />
                Buscar
              </label>
              <input
                type="text"
                value={filter}
                onChange={handleFilterChange}
                placeholder="Contrato, cliente o período..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-300">
                <IoReceiptOutline className="w-4 h-4 mr-2 text-emerald-400" />
                Tipo de Pago
              </label>
              <select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="all" className="bg-slate-800">Todos los tipos</option>
                <option value="installment" className="bg-slate-800">Cuotas</option>
                <option value="initial" className="bg-slate-800">Pagos Iniciales</option>
                <option value="commission" className="bg-slate-800">Comisiones</option>
              </select>
            </div>

            {/* Filtro por fecha */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-300">
                <IoCalendarOutline className="w-4 h-4 mr-2 text-amber-400" />
                Período
              </label>
              <select
                value={dateFilter}
                onChange={handleDateFilterChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="all" className="bg-slate-800">Todos los períodos</option>
                <option value="thisMonth" className="bg-slate-800">Este mes</option>
                <option value="lastMonth" className="bg-slate-800">Mes anterior</option>
                <option value="thisYear" className="bg-slate-800">Este año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de pagos */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Pagos encontrados: {filteredPayments.length}
            </h3>
            
            {filteredPayments.length > 0 && (
              <button className="flex items-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-400/30">
                <IoDownloadOutline className="w-4 h-4 mr-2" />
                Exportar
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-slate-400">Cargando pagos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Error al cargar los pagos</p>
              <p className="text-slate-400">{error}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <IoReceiptOutline className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No se encontraron pagos</p>
              <p className="text-slate-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
                >
                  {/* Header del pago */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <IoReceiptOutline className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">
                          Pago #{payment.id}
                        </h4>
                        <p className="text-slate-400 text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentTypeColor(payment.type)}`}>
                      {getPaymentTypeName(payment.type)}
                    </div>
                  </div>

                  {/* Información del pago */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Monto */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IoCashOutline className="w-5 h-5 text-emerald-400" />
                          <span className="text-slate-300 font-medium">Monto</span>
                        </div>
                        <span className="text-white text-xl font-bold">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Cliente y Contrato */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-blue-400" />
                          Cliente
                        </label>
                        <div className="text-white font-medium">
                          {payment.Client ? payment.Client.name : 'N/A'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoDocumentTextOutline className="w-4 h-4 mr-2 text-purple-400" />
                          Contrato
                        </label>
                        <div className="text-white font-medium">
                          #{payment.leaseId}
                        </div>
                      </div>
                    </div>

                    {/* Período */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-slate-300">
                        <IoTimeOutline className="w-4 h-4 mr-2 text-amber-400" />
                        Período
                      </label>
                      <div className="text-white">
                        {payment.period || 'No especificado'}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleDownloadReceipt(payment)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors border border-blue-400/30"
                    >
                      <IoDownloadOutline className="w-4 h-4 mr-2" />
                      Descargar Recibo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Componente oculto para generar PDF */}
      {downloadingPayment && downloadingPayment.Lease && (
        <div style={{ position: 'absolute', left: '-9999px' }}>
          <ReciboPdf 
            payment={downloadingPayment} 
            lease={downloadingPayment.Lease}
            autoGenerate={true}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentList;