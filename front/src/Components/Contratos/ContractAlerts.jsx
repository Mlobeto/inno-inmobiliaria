import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllLeases } from "../../redux/Actions/actions";
import { 
  IoArrowBackOutline,
  IoHomeOutline,
  IoWarningOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoCashOutline,
} from 'react-icons/io5';

const FREQ_MONTHS = { semestral: 6, cuatrimestral: 4, anual: 12, trimestral: 3 };

/**
 * Fecha en que DEBIÓ ocurrir la última actualización (puede ser pasada).
 * Devuelve null si aún no llegó el primer período.
 */
const getLastDueUpdateDate = (lease) => {
  const { startDate, updateFrequency } = lease;
  const freqMonths = FREQ_MONTHS[updateFrequency];
  if (!freqMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const monthsSinceStart =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
  if (periodsElapsed === 0) return null;
  const due = new Date(start);
  due.setMonth(due.getMonth() + periodsElapsed * freqMonths);
  return due;
};

/**
 * Próxima fecha de actualización.
 * Si el período actual está vencido y sin registrar, devuelve la fecha debida
 * para que la alerta muestre correctamente cuánto tiempo lleva sin actualizarse.
 */
const getUpdateAlert = (lease) => {
  const { startDate, updateFrequency } = lease;
  const freqMonths = FREQ_MONTHS[updateFrequency];
  if (!freqMonths) return null;

  const due = getLastDueUpdateDate(lease);
  if (due) {
    const alreadyUpdated = (lease.RentUpdates || []).some(
      (u) => new Date(u.updateDate) >= due
    );
    if (!alreadyUpdated) return due; // Vencido sin registrar: mostrar fecha debida
  }

  // Período al día: calcular próxima fecha futura
  const start = new Date(startDate);
  const now = new Date();
  const monthsSinceStart =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
  const nextUpdate = new Date(start);
  nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);
  return nextUpdate;
};

const getEndAlert = (lease) => {
  const { startDate, totalMonths } = lease;
  const start = new Date(startDate);
  // La fecha de culminación se obtiene sumando totalMonths a la fecha de inicio.
  return new Date(start.setMonth(start.getMonth() + totalMonths));
};

const getContractDetails = (lease) => {
  const nextUpdate = getUpdateAlert(lease);
  const terminationDate = getEndAlert(lease);
  return {
    leaseId: lease.id || lease.leaseId,
    startDate: new Date(lease.startDate),
    nextUpdate,
    terminationDate,
    // Agrega el nombre del tenant, o en su defecto su Id
    tenant: lease.Tenant ? lease.Tenant.name : lease.tenantId,
  };
};

const EstadoAlertasContratos = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const leases = useSelector((state) => state.leases);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);

  useEffect(() => {
    dispatch(getAllLeases());
  }, [dispatch]);

  const contractDetails = (leases || []).map((lease) =>
    getContractDetails(lease)
  );

  /**
   * Cuotas impagas: contratos activos que no tienen ningún recibo
   * registrado en el mes calendario actual.
   */
  const cuotasImpagas = useMemo(() => {
    if (!leases?.length) return [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (leases).filter((lease) => {
      if (lease.status !== 'active') return false;
      const receipts = lease.PaymentReceipts || [];
      const pagadoEsteMes = receipts.some((r) => {
        const d = new Date(r.paymentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      return !pagadoEsteMes;
    });
  }, [leases]);

  // Ordenar por 'nextUpdate' y luego por 'terminationDate'
  const sortedContractDetails = [...contractDetails].sort((a, b) => {
    const diffNext = a.nextUpdate.getTime() - b.nextUpdate.getTime();
    return diffNext !== 0
      ? diffNext
      : a.terminationDate.getTime() - b.terminationDate.getTime();
  });

  const formatDate = (date) => date.toLocaleDateString();

  /**
   * Determina el tipo de alerta según:
   * - daysToUpdate < 0  → actualización vencida y sin registrar (overdue)
   * - daysToUpdate 0-20 → aviso anticipado (próximos días)
   * - daysToTermination ≤ 30 → contrato próximo a vencer (crítico)
   * - daysToTermination ≤ 90 → informativo
   */
  const getAlertType = (nextUpdate, terminationDate) => {
    if (!nextUpdate) return { type: 'success', label: 'Al Día', color: 'green' };
    const now = new Date();
    const daysToUpdate = Math.ceil((nextUpdate - now) / (1000 * 60 * 60 * 24));
    const daysToTermination = Math.ceil((terminationDate - now) / (1000 * 60 * 60 * 24));

    if (daysToTermination <= 30) return { type: 'critical', label: 'Vence Pronto', color: 'red' };
    if (daysToUpdate < 0) return { type: 'critical', label: 'Actualización Vencida', color: 'red' };
    if (daysToUpdate <= 20) return { type: 'warning', label: 'Actualizar Importe', color: 'amber' };
    if (daysToTermination <= 90) return { type: 'info', label: 'Próximo a Vencer', color: 'blue' };
    return { type: 'success', label: 'Al Día', color: 'green' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400">Cargando alertas de contratos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md">
          <IoAlertCircleOutline className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-lg font-medium">Error al cargar alertas</p>
          <p className="text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

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
              <button onClick={() => navigate('/panelContratos')} className="hover:text-white transition-colors">
                Contratos
              </button>
              <span>/</span>
              <span className="text-white font-medium">Alertas de Contratos</span>
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
              <IoWarningOutline className="w-8 h-8 text-amber-400 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Alertas de Contratos
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Monitorea vencimientos y actualizaciones pendientes de contratos
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Cuotas impagas del mes actual */}
        {cuotasImpagas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <IoCashOutline className="w-6 h-6 mr-2 text-red-400" />
              Cuotas sin registrar este mes ({cuotasImpagas.length})
            </h3>
            <div className="space-y-3">
              {cuotasImpagas.map((lease) => (
                <div
                  key={lease.id || lease.leaseId}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <IoCashOutline className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {lease.Property?.address || `Contrato #${lease.id || lease.leaseId}`}
                      </p>
                      <p className="text-slate-400 text-sm">
                        Inquilino: {lease.Tenant?.name || 'N/A'} · Monto: ${Number(lease.rentAmount || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <span className="text-red-400 text-sm font-medium whitespace-nowrap">
                    Sin pago registrado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sortedContractDetails.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-12 text-center">
            <IoCheckmarkCircleOutline className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-green-400 text-xl font-medium mb-2">No hay alertas pendientes</p>
            <p className="text-slate-400">Todos los contratos están al día</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen de alertas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {['critical', 'warning', 'info', 'success'].map((type) => {
                const count = sortedContractDetails.filter(contract => {
                  const alertType = getAlertType(contract.nextUpdate, contract.terminationDate);
                  return alertType.type === type;
                }).length;
                
                const config = {
                  critical: { label: 'Críticas', color: 'red', icon: IoAlertCircleOutline },
                  warning: { label: 'Advertencias', color: 'amber', icon: IoWarningOutline },
                  info: { label: 'Informativas', color: 'blue', icon: IoTimeOutline },
                  success: { label: 'Al Día', color: 'green', icon: IoCheckmarkCircleOutline }
                }[type];
                
                const IconComponent = config.icon;
                
                return (
                  <div key={type} className={`bg-${config.color}-500/10 border border-${config.color}-500/20 rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-${config.color}-400 text-sm font-medium`}>{config.label}</p>
                        <p className={`text-${config.color}-400 text-2xl font-bold`}>{count}</p>
                      </div>
                      <IconComponent className={`w-8 h-8 text-${config.color}-400`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista de contratos con alertas */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                Contratos con Alertas: {sortedContractDetails.length}
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {sortedContractDetails.map((contract) => {
                  const alertType = getAlertType(contract.nextUpdate, contract.terminationDate);
                  const now = new Date();
                  const daysToUpdate = Math.ceil((contract.nextUpdate - now) / (1000 * 60 * 60 * 24));
                  const daysToTermination = Math.ceil((contract.terminationDate - now) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={contract.leaseId}
                      className={`bg-white/5 backdrop-blur-xl rounded-xl border border-${alertType.color}-500/30 p-6 hover:border-${alertType.color}-500/50 transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 bg-${alertType.color}-500/20 rounded-lg`}>
                              <IoDocumentTextOutline className={`w-5 h-5 text-${alertType.color}-400`} />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                Contrato #{contract.leaseId}
                              </h4>
                              <div className={`inline-flex items-center px-2 py-1 bg-${alertType.color}-500/20 text-${alertType.color}-400 rounded-full text-xs font-medium`}>
                                {alertType.label}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                              <IoPersonOutline className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-slate-400 text-xs">Inquilino</p>
                                <p className="text-white text-sm font-medium">{contract.tenant}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <IoCalendarOutline className="w-4 h-4 text-green-400" />
                              <div>
                                <p className="text-slate-400 text-xs">Fecha de Inicio</p>
                                <p className="text-white text-sm">{formatDate(contract.startDate)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <IoTimeOutline className="w-4 h-4 text-amber-400" />
                              <div>
                                <p className="text-slate-400 text-xs">Próxima Actualización</p>
                                <p className={`text-sm font-medium ${daysToUpdate <= 7 ? 'text-amber-400' : 'text-white'}`}>
                                  {formatDate(contract.nextUpdate)}
                                  <span className="text-xs ml-1">({daysToUpdate} días)</span>
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <IoAlertCircleOutline className="w-4 h-4 text-red-400" />
                              <div>
                                <p className="text-slate-400 text-xs">Fecha de Culminación</p>
                                <p className={`text-sm font-medium ${daysToTermination <= 30 ? 'text-red-400' : 'text-white'}`}>
                                  {formatDate(contract.terminationDate)}
                                  <span className="text-xs ml-1">({daysToTermination} días)</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadoAlertasContratos;