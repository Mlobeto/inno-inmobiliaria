import  {  useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  updateLeaseRentAmount
} from "../../redux/Actions/actions";
import { useGetAllLeasesQuery } from "@shared/redux";
import { toast } from "react-toastify";
import { formatDateSafe, parseSafeDate, formatDateForInput } from "../../utils/dateUtils";
import {
  downloadRentUpdatePdf,
  getNextUpdateDateFromLease,
  leaseNeedsUpdateSoon,
} from "../../utils/rentUpdatePdf";
import { useRentUpdatePdfAssets } from "../../hooks/useRentUpdatePdfAssets";
import { 
  IoArrowBackOutline,
  IoHomeOutline,
  IoCalculatorOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoLinkOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
  IoCloseOutline,
} from 'react-icons/io5';

const ActualizarAlquileres = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: leases = [], isLoading: loading, refetch } = useGetAllLeasesQuery();
  const { companySettings, customTemplateJson } = useRentUpdatePdfAssets();
  const [actualizaciones, setActualizaciones] = useState({});
  const [processing, setProcessing] = useState({});
  const [confirmData, setConfirmData] = useState(null);

  const calcularProximaActualizacion = (lease) => getNextUpdateDateFromLease(lease);

  const necesitaActualizacion = (lease) => leaseNeedsUpdateSoon(lease, 20);

  // Filtrar contratos que necesitan actualización
  const contratosParaActualizar = (leases || []).filter(lease => 
    lease.status === 'active' && necesitaActualizacion(lease)
  );

  // Todos los contratos activos ordenados por fecha de próxima actualización
  const todosContratosOrdenados = (leases || [])
    .filter(lease => lease.status === 'active')
    .map(lease => ({
      ...lease,
      proximaActualizacion: calcularProximaActualizacion(lease),
      necesitaActualizacion: necesitaActualizacion(lease)
    }))
    .sort((a, b) => new Date(a.proximaActualizacion) - new Date(b.proximaActualizacion));

  // Manejar cambio en inputs de actualización
  const handleActualizacionChange = (leaseId, field, value) => {
    setActualizaciones(prev => ({
      ...prev,
      [leaseId]: {
        ...prev[leaseId],
        [field]: value,
        // Auto-calcular nuevo monto si se ingresa porcentaje
        ...(field === 'porcentaje' && value && {
          nuevoMonto: Math.round(getLeaseById(leaseId).rentAmount * (1 + parseFloat(value) / 100))
        }),
        // Auto-calcular porcentaje si se ingresa monto
        ...(field === 'nuevoMonto' && value && {
          porcentaje: (((parseFloat(value) - getLeaseById(leaseId).rentAmount) / getLeaseById(leaseId).rentAmount) * 100).toFixed(2)
        })
      }
    }));
  };

  const getLeaseById = (id) => leases.find(l => l.id === id);

  const formatearFecha = (date) => formatDateSafe(date);

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const generarPdfActualizacion = (lease, nuevoMonto, ipcIndex, fechaActualizacion) => {
    const fechaUpdate = fechaActualizacion || calcularProximaActualizacion(lease);
    downloadRentUpdatePdf(
      {
        lease,
        newRentAmount: nuevoMonto,
        updateDate: fechaUpdate,
        ipcIndex,
        companySettings,
      },
      customTemplateJson,
    );
  };

  const openConfirmActualizacion = (lease) => {
    const actualizacion = actualizaciones[lease.id];

    if (!actualizacion?.nuevoMonto) {
      toast.error('Ingresá el nuevo monto o el porcentaje de actualización');
      return;
    }

    const nuevoMonto = parseFloat(actualizacion.nuevoMonto);
    const porcentaje = actualizacion.porcentaje
      || (((nuevoMonto - lease.rentAmount) / lease.rentAmount) * 100).toFixed(2);

    setConfirmData({ lease, actualizacion, nuevoMonto, porcentaje });
  };

  const executeActualizacion = async () => {
    if (!confirmData) return;

    const { lease, actualizacion, nuevoMonto } = confirmData;
    setConfirmData(null);

    try {
      setProcessing((prev) => ({ ...prev, [lease.id]: true }));

      await toast.promise(
        (async () => {
          const fechaIngresada = actualizacion?.fechaActualizacion;
          const fechaActualizacion = fechaIngresada
            ? parseSafeDate(fechaIngresada)
            : calcularProximaActualizacion(lease);

          await dispatch(updateLeaseRentAmount(
            lease.id,
            nuevoMonto,
            fechaActualizacion.toISOString(),
          ));

          generarPdfActualizacion(
            { ...lease, rentAmount: nuevoMonto },
            nuevoMonto,
            actualizacion.ipcIndex,
            fechaActualizacion,
          );

          setActualizaciones((prev) => {
            const newState = { ...prev };
            delete newState[lease.id];
            return newState;
          });

          await refetch();
        })(),
        {
          pending: 'Actualizando contrato y generando PDF...',
          success: 'Alquiler actualizado y PDF generado correctamente',
          error: {
            render: ({ data: err }) =>
              err?.response?.data?.error
              || err?.response?.data?.message
              || 'No se pudo actualizar el contrato',
          },
        },
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [lease.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Barra de navegación */}
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
            
            <nav className="flex items-center space-x-2 text-slate-300">
              <button onClick={() => navigate('/panel')} className="hover:text-white transition-colors">
                <IoHomeOutline className="w-4 h-4" />
              </button>
              <span>/</span>
              <button onClick={() => navigate('/panelContratos')} className="hover:text-white transition-colors">
                Contratos
              </button>
              <span>/</span>
              <span className="text-white font-medium">Actualizar Alquileres</span>
            </nav>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white rounded-lg transition-colors"
          >
            <IoRefreshOutline className="w-5 h-5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoCalculatorOutline className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Actualización de Alquileres
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Gestiona las actualizaciones de alquiler según IPC y genera PDFs automáticamente
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Link a arquiler.com */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 p-3 bg-blue-500/20 rounded-lg">
              <IoLinkOutline className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Consultar Índice IPC</h3>
              <p className="text-slate-300 text-sm mb-3">
                Visita el sitio oficial para consultar el índice actualizado antes de procesar las actualizaciones
              </p>
              <a
                href="https://arquiler.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                <span>Ir a Arquiler.com</span>
                <IoLinkOutline className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Contratos activos</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {(leases || []).filter(l => l.status === 'active').length}
                </p>
              </div>
              <IoDocumentTextOutline className="w-12 h-12 text-blue-400/50" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pendientes actualización</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {contratosParaActualizar.length}
                </p>
              </div>
              <IoAlertCircleOutline className="w-12 h-12 text-amber-400/50" />
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Al día</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {(leases || []).filter(l => l.status === 'active' && !necesitaActualizacion(l)).length}
                </p>
              </div>
              <IoCheckmarkCircleOutline className="w-12 h-12 text-green-400/50" />
            </div>
          </div>
        </div>

        {/* Lista de contratos pendientes */}
        {contratosParaActualizar.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <IoTimeOutline className="w-6 h-6 mr-2 text-amber-400" />
              Contratos Pendientes de Actualización ({contratosParaActualizar.length})
            </h3>
            
            {contratosParaActualizar.map((lease) => (
              <div
                key={lease.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del contrato */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                      {lease.Property?.address || 'Propiedad sin dirección'}
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inquilino:</span>
                        <span className="text-white font-medium">{lease.Tenant?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Propietario:</span>
                        <span className="text-white font-medium">{lease.Landlord?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Monto actual:</span>
                        <span className="text-white font-bold text-lg">{formatearMonto(lease.rentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Frecuencia:</span>
                        <span className="text-white capitalize">{lease.updateFrequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Próxima actualización:</span>
                        <span className="text-amber-400 font-medium">
                          {formatearFecha(calcularProximaActualizacion(lease))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de actualización */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h5 className="text-white font-semibold mb-3">Calcular Actualización</h5>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-400 text-sm mb-1">
                          Fecha de actualización <span className="text-blue-400">(vigencia del nuevo monto)</span>
                        </label>
                        <input
                          type="date"
                          value={
                            actualizaciones[lease.id]?.fechaActualizacion ||
                            formatDateForInput(calcularProximaActualizacion(lease))
                          }
                          onChange={(e) => handleActualizacionChange(lease.id, 'fechaActualizacion', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-sm mb-1">IPC % (opcional)</label>
                        <input
                          type="text"
                          placeholder="Ej: 25.5"
                          value={actualizaciones[lease.id]?.ipcIndex || ''}
                          onChange={(e) => handleActualizacionChange(lease.id, 'ipcIndex', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-sm mb-1">Porcentaje de Aumento %</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ej: 25.5"
                          value={actualizaciones[lease.id]?.porcentaje || ''}
                          onChange={(e) => handleActualizacionChange(lease.id, 'porcentaje', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="text-center text-slate-400">o</div>

                      <div>
                        <label className="block text-slate-400 text-sm mb-1">Nuevo Monto Directo</label>
                        <input
                          type="number"
                          placeholder="Ingrese el nuevo monto"
                          value={actualizaciones[lease.id]?.nuevoMonto || ''}
                          onChange={(e) => handleActualizacionChange(lease.id, 'nuevoMonto', e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {actualizaciones[lease.id]?.nuevoMonto && (
                        <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                          <p className="text-sm text-slate-300">Nuevo monto calculado:</p>
                          <p className="text-2xl font-bold text-green-400">
                            {formatearMonto(actualizaciones[lease.id].nuevoMonto)}
                          </p>
                          {actualizaciones[lease.id]?.porcentaje && (
                            <p className="text-sm text-blue-400 mt-1">
                              Aumento: {actualizaciones[lease.id].porcentaje}%
                            </p>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => openConfirmActualizacion(lease)}
                        disabled={!actualizaciones[lease.id]?.nuevoMonto || processing[lease.id]}
                        className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                          actualizaciones[lease.id]?.nuevoMonto && !processing[lease.id]
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {processing[lease.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <IoDocumentTextOutline className="w-5 h-5" />
                            <span>Actualizar y Generar PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Listado completo de contratos ordenados por fecha */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <IoDocumentTextOutline className="w-6 h-6 mr-2 text-blue-400" />
            Todos los Contratos Activos ({todosContratosOrdenados.length})
            <span className="ml-3 text-sm text-slate-400 font-normal">
              Ordenados por próxima fecha de actualización
            </span>
          </h3>

          {todosContratosOrdenados.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <IoDocumentTextOutline className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No hay contratos activos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Propiedad</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Inquilino</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Monto Actual</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Frecuencia</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Próxima Actualización</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {todosContratosOrdenados.map((lease, index) => (
                    <tr 
                      key={lease.id}
                      className={`border-t border-white/10 hover:bg-white/5 transition-colors ${
                        lease.necesitaActualizacion ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-white">
                        {lease.Property?.address || 'Propiedad sin dirección'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {lease.Tenant?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">
                        {formatearMonto(lease.rentAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 capitalize">
                        {lease.updateFrequency}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={lease.necesitaActualizacion ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                          {formatearFecha(lease.proximaActualizacion)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lease.necesitaActualizacion ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <IoAlertCircleOutline className="w-4 h-4 mr-1" />
                            Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            <IoCheckmarkCircleOutline className="w-4 h-4 mr-1" />
                            Al día
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-update-title"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 id="confirm-update-title" className="text-lg font-semibold text-white">
                Confirmar actualización
              </h3>
              <button
                type="button"
                onClick={() => setConfirmData(null)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-slate-300">
                <span className="text-slate-400">Propiedad:</span>{' '}
                {confirmData.lease.Property?.address || 'N/A'}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Inquilino:</span>{' '}
                {confirmData.lease.Tenant?.name || 'N/A'}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Monto actual:</span>{' '}
                <span className="text-red-400 font-medium">{formatearMonto(confirmData.lease.rentAmount)}</span>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Nuevo monto:</span>{' '}
                <span className="text-green-400 font-bold text-lg">{formatearMonto(confirmData.nuevoMonto)}</span>
              </p>
              <p className="text-slate-300">
                <span className="text-slate-400">Aumento:</span>{' '}
                <span className="text-blue-400 font-semibold">{confirmData.porcentaje}%</span>
              </p>
              {confirmData.actualizacion.ipcIndex && (
                <p className="text-slate-300">
                  <span className="text-slate-400">IPC aplicado:</span>{' '}
                  {confirmData.actualizacion.ipcIndex}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmData(null)}
                className="flex-1 py-2.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeActualizacion}
                className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                Actualizar y generar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActualizarAlquileres;  