import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPayments } from '../../redux/Actions/actions';
import { 
  IoCalendarOutline, 
  IoStatsChartOutline, 
  IoDocumentTextOutline,
  IoFilterOutline,
  IoCheckmarkCircleOutline,
  IoCashOutline
} from 'react-icons/io5';

const PaymentReport = () => {
  const dispatch = useDispatch();
  
  // Selectores optimizados
  const payments = useSelector(state => state.allPayments) || [];
  const loading = useSelector(state => state.loading);
  const error = useSelector(state => state.error);

  // Filtros por fecha
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(getAllPayments());
  }, [dispatch]);

  // Filtrar por rango de fecha y tipo (optimizado con useMemo)
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      
      // Filtro por fecha
      if (fromDate && paymentDate < fromDate) return false;
      if (toDate && paymentDate > toDate) return false;
      
      // Filtro por tipo
      if (activeFilter === 'commission' && payment.type !== 'commission') return false;
      if (activeFilter === 'installment' && payment.type !== 'installment') return false;
      
      return true;
    });
  }, [payments, dateFrom, dateTo, activeFilter]);

  // Calcular estadísticas (optimizado con useMemo)
  const stats = useMemo(() => {
    const salesCommission = filteredPayments
      .filter(p => p.type === 'commission')
      .reduce((sum, p) => sum + Number(p.amount), 0);
      
    const rentalCommission = filteredPayments
      .filter(p => p.type === 'installment')
      .reduce((sum, p) => {
        const commissionRate = Number(p.Lease?.commission || 0);
        const commissionAmount = Number(p.amount) * (commissionRate / 100);
        return sum + commissionAmount;
      }, 0);
      
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    return {
      salesCommission,
      rentalCommission,
      totalAmount,
      totalPayments: filteredPayments.length
    };
  }, [filteredPayments]);

  // Calcular paginación (optimizado con useMemo)
  const paginationData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    return { currentPayments, totalPages };
  }, [filteredPayments, currentPage, itemsPerPage]);

  const { currentPayments, totalPages } = paginationData;

  // Manejo del cambio de página
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const formatMoney = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  });

  // Función para cambiar filtro
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset a primera página
  };

  // Renderizado de botones de paginación con glassmorphism
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`mx-1 px-4 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
            currentPage === i 
              ? 'bg-blue-500/80 text-white border-blue-400 shadow-lg' 
              : 'bg-white/20 text-gray-700 border-white/30 hover:bg-white/30 hover:border-white/50'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <IoStatsChartOutline className="text-indigo-600" />
            Reporte de Pagos
          </h1>
          <p className="text-gray-600">Análisis detallado de comisiones y pagos</p>
        </div>

        {/* Filtros */}
        <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <IoFilterOutline className="text-indigo-600 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtros de fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <IoCalendarOutline className="text-indigo-500" />
                Fecha Desde:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/50 border border-white/30 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <IoCalendarOutline className="text-indigo-500" />
                Fecha Hasta:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/50 border border-white/30 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all duration-300"
              />
            </div>

            {/* Filtros por tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pago:</label>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'Todos', icon: IoDocumentTextOutline },
                  { key: 'commission', label: 'Ventas', icon: IoCashOutline },
                  { key: 'installment', label: 'Alquileres', icon: IoCheckmarkCircleOutline }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange(key)}
                    className={`px-3 py-2 rounded-lg backdrop-blur-md border transition-all duration-300 flex items-center gap-1 text-sm ${
                      activeFilter === key
                        ? 'bg-indigo-500/80 text-white border-indigo-400'
                        : 'bg-white/30 text-gray-700 border-white/30 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        ) : error ? (
          <div className="backdrop-blur-md bg-red-50/50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="backdrop-blur-md bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl border border-green-300/30 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Comisión de Ventas</h3>
                    <p className="text-2xl font-bold text-green-700">
                      {formatMoney.format(stats.salesCommission)}
                    </p>
                  </div>
                  <IoCashOutline className="text-3xl text-green-600" />
                </div>
              </div>

              <div className="backdrop-blur-md bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl border border-blue-300/30 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Comisión de Alquileres</h3>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatMoney.format(stats.rentalCommission)}
                    </p>
                  </div>
                  <IoCheckmarkCircleOutline className="text-3xl text-blue-600" />
                </div>
              </div>

              <div className="backdrop-blur-md bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-2xl border border-purple-300/30 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Monto Total</h3>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatMoney.format(stats.totalAmount)}
                    </p>
                  </div>
                  <IoStatsChartOutline className="text-3xl text-purple-600" />
                </div>
              </div>

              <div className="backdrop-blur-md bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl border border-amber-300/30 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">Total Pagos</h3>
                    <p className="text-2xl font-bold text-amber-700">
                      {stats.totalPayments}
                    </p>
                  </div>
                  <IoDocumentTextOutline className="text-3xl text-amber-600" />
                </div>
              </div>
            </div>

            {/* Tabla de pagos */}
            <div className="backdrop-blur-md bg-white/30 rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/20">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <IoDocumentTextOutline className="text-indigo-600" />
                  Detalle de Pagos ({filteredPayments.length} registros)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b border-white/20">Fecha</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b border-white/20">Monto</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b border-white/20">Periodo</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b border-white/20">Tipo</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b border-white/20">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.map((payment, index) => {
                      const commissionRate = Number(payment.Lease?.commission || 0);
                      const commissionAmount = Number(payment.amount) * (commissionRate / 100);
                      return (
                        <tr key={payment.id} className={`transition-colors duration-200 hover:bg-white/20 ${
                          index % 2 === 0 ? 'bg-white/10' : 'bg-transparent'
                        }`}>
                          <td className="py-4 px-6 text-gray-700 border-b border-white/10">
                            {new Date(payment.paymentDate).toLocaleDateString('es-AR')}
                          </td>
                          <td className="py-4 px-6 text-gray-700 border-b border-white/10 font-semibold">
                            {formatMoney.format(Number(payment.amount))}
                          </td>
                          <td className="py-4 px-6 text-gray-700 border-b border-white/10">
                            {payment.period || 'N/A'}
                          </td>
                          <td className="py-4 px-6 border-b border-white/10">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payment.type === 'commission'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {payment.type === 'commission' ? 'Comisión de Venta' : 'Comisión de Alquiler'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-700 border-b border-white/10 font-semibold">
                            {payment.type === 'installment'
                              ? formatMoney.format(commissionAmount)
                              : formatMoney.format(Number(payment.amount))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-white/20 flex justify-center">
                  <div className="flex items-center gap-2">
                    {renderPagination()}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentReport;