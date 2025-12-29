import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import { 
  getAllLeases, 
  updateLeaseRentAmount,
  getLeasesPendingUpdate, // 🆕 Nuevo endpoint
  quickUpdateLeaseRent, // 🆕 Actualización rápida
  getLeaseUpdateHistory // 🆕 Historial
} from "../../redux/Actions/actions";
import Swal from "sweetalert2";

const ActualizarAlquileres = () => {
  const dispatch = useDispatch();
  const { leases, loading, pendingUpdates } = useSelector((state) => state);
  const [indiceIPC, setIndiceIPC] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState({});
  const [pdfGenerado, setPdfGenerado] = useState({});
  const [useNewEndpoint, setUseNewEndpoint] = useState(false); // 🆕 Toggle entre métodos
  const [quickUpdatePercentage, setQuickUpdatePercentage] = useState({}); // 🆕 Para actualizaciones rápidas
  const [showHistory, setShowHistory] = useState({}); // 🆕 Para mostrar historial
  const [contractHistory, setContractHistory] = useState({}); // 🆕 Datos del historial

  useEffect(() => {
    if (useNewEndpoint) {
      // 🆕 Usar el nuevo endpoint
      dispatch(getLeasesPendingUpdate());
    } else {
      // Método anterior como fallback
      dispatch(getAllLeases());
    }
  }, [dispatch, useNewEndpoint]);

    const debugContracts = () => {
    console.log('=== DEBUG CONTRATOS ===');
    console.log('pendingUpdates:', pendingUpdates);
    console.log('leases:', leases);
    
    if (leases && leases.length > 0) {
      leases.forEach(lease => {
        const now = new Date();
        const start = new Date(lease.startDate);
        const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                                (now.getMonth() - start.getMonth());
        
        let freqMonths = 0;
        if (lease.updateFrequency === 'semestral') freqMonths = 6;
        else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
        else if (lease.updateFrequency === 'anual') freqMonths = 12;
        
        const shouldUpdate = monthsSinceStart >= freqMonths;
        
        console.log(`Contrato ${lease.id}:`);
        console.log(`  - Fecha inicio: ${lease.startDate}`);
        console.log(`  - Frecuencia: ${lease.updateFrequency} (${freqMonths} meses)`);
        console.log(`  - Meses transcurridos: ${monthsSinceStart}`);
        console.log(`  - Debería actualizar: ${shouldUpdate}`);
        console.log(`  - Status: ${lease.status}`);
        console.log('---');
      });
    }
  };

  // 🆕 Usar datos del nuevo endpoint o filtrar con lógica anterior
  const leasesParaActualizar = useNewEndpoint 
    ? (pendingUpdates?.pendingUpdates || [])
    : (leases || []).filter(debeActualizar);

  // 🆕 Función para actualización rápida con porcentaje
  const handleQuickUpdate = async (lease) => {
    const percentage = quickUpdatePercentage[lease.id];
    if (!percentage) {
      Swal.fire("Error", "Debe ingresar un porcentaje de aumento", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Confirmar Actualización Rápida",
      html: `
        <div style="text-align: left;">
          <p><strong>Contrato:</strong> ${lease.property}</p>
          <p><strong>Inquilino:</strong> ${lease.tenant}</p>
          <p><strong>Monto actual:</strong> $${parseInt(lease.currentRent).toLocaleString()}</p>
          <p><strong>Aumento:</strong> ${percentage}%</p>
          <p><strong>Nuevo monto:</strong> $${Math.round(lease.currentRent * (1 + percentage/100)).toLocaleString()}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
      try {
        await dispatch(quickUpdateLeaseRent(lease.id, percentage, `Ajuste por IPC ${indiceIPC || 'N/A'}`));
        // Recargar datos
        dispatch(getLeasesPendingUpdate());
        setQuickUpdatePercentage(prev => ({ ...prev, [lease.id]: "" }));
        
        Swal.fire({
          title: "¡Actualización Exitosa!",
          text: "El contrato ha sido actualizado correctamente",
          icon: "success",
          timer: 2000
        });
      } catch (error) {
        console.error("Error en actualización rápida:", error);
        Swal.fire("Error", "No se pudo actualizar el contrato", "error");
      }
    }
  };

  // 🆕 Función para mostrar/ocultar historial
  const toggleHistory = async (leaseId) => {
    if (showHistory[leaseId]) {
      setShowHistory(prev => ({ ...prev, [leaseId]: false }));
    } else {
      try {
        const history = await dispatch(getLeaseUpdateHistory(leaseId));
        setContractHistory(prev => ({ ...prev, [leaseId]: history }));
        setShowHistory(prev => ({ ...prev, [leaseId]: true }));
      } catch (error) {
        console.error("Error al obtener historial:", error);
        Swal.fire("Error", "No se pudo cargar el historial", "error");
      }
    }
  };

  // Función anterior mantenida como fallback
  function debeActualizar(lease) {
  const hoy = new Date();
  const inicio = new Date(lease.startDate);
  
  // Mapeo de frecuencias a meses
  const mesesPorFrecuencia = {
    semestral: 6,
    cuatrimestral: 4,
    anual: 12,
    trimestral: 3,
    bimestral: 2,
    mensual: 1,
  };
  
  const meses = mesesPorFrecuencia[lease.updateFrequency] || 12;
  
  // Calcular meses transcurridos desde el inicio
  const mesesTranscurridos = (hoy.getFullYear() - inicio.getFullYear()) * 12 + 
                             (hoy.getMonth() - inicio.getMonth());
  
  // Calcular cuántos períodos de actualización han pasado
  const periodosTranscurridos = Math.floor(mesesTranscurridos / meses);
  
  // Si ha pasado al menos un período completo, necesita actualización
  const necesitaActualizacion = periodosTranscurridos > 0;
  
  // Debug detallado
  console.log(`🔍 Evaluando contrato ${lease.id}:`);
  console.log(`  - Fecha inicio: ${inicio.toLocaleDateString()}`);
  console.log(`  - Frecuencia: ${lease.updateFrequency} (${meses} meses)`);
  console.log(`  - Meses transcurridos: ${mesesTranscurridos}`);
  console.log(`  - Períodos completados: ${periodosTranscurridos}`);
  console.log(`  - Necesita actualización: ${necesitaActualizacion}`);
  
  return necesitaActualizacion;
}

// 🆕 Agregar función de debug mejorada


  const handleGenerarPDF = async (lease) => {
    if (!nuevoMonto[lease.id]) {
      Swal.fire("Error", "Debe ingresar el nuevo monto antes de generar el PDF", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Confirmar Actualización",
      html: `
        <div style="text-align: left;">
          <p><strong>Propiedad:</strong> ${lease.Property?.address || lease.property}</p>
          <p><strong>Inquilino:</strong> ${lease.Tenant?.name || lease.tenant}</p>
          <p><strong>Monto actual:</strong> $${parseInt(lease.rentAmount || lease.currentRent).toLocaleString()}</p>
          <p><strong>Nuevo monto:</strong> $${parseInt(nuevoMonto[lease.id]).toLocaleString()}</p>
          <p><strong>IPC aplicado:</strong> ${indiceIPC || 'No especificado'}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Generar PDF y Actualizar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      // Mostrar loading
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espera mientras se procesa la actualización',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const fechaHoy = new Date().toLocaleDateString();
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.text("QUINTERO+LOBETO PROPIEDADES", 105, 15, { align: "center" });
      
      // Información básica
      doc.setFontSize(12);
      doc.text(`FECHA: ${fechaHoy}`, 20, 35);
      doc.text("IPC", 20, 45);
      doc.text("https://arquiler.com/", 20, 55);
      
      // Propiedad
      doc.setFontSize(14);
      doc.text(`${lease.Property?.address || lease.property || "Propiedad"}`, 20, 65);
      
      // Detalles
      doc.setFontSize(12);
      doc.text("El cálculo incluye el IPC", 20, 75);
      doc.text(
        `${(lease.updateFrequency || 'ANUAL').toUpperCase()} (${fechaHoy})`,
        20,
        85
      );
      
      // Nuevo monto destacado
      doc.setFontSize(20);
      doc.text(`$ ${parseInt(nuevoMonto[lease.id]).toLocaleString()}`, 105, 100, { align: "center" });
      
      // IPC
      doc.setFontSize(10);
      doc.text(`Aumento ${indiceIPC || 'N/A'}`, 105, 110, { align: "center" });

      // Información adicional
      doc.setFontSize(8);
      doc.text(`Inquilino: ${lease.Tenant?.name || lease.tenant || 'N/A'}`, 20, 130);
      doc.text(`Propietario: ${lease.Landlord?.name || lease.landlord || 'N/A'}`, 20, 140);
      doc.text(`Monto anterior: $${parseInt(lease.rentAmount || lease.currentRent).toLocaleString()}`, 20, 150);

      const fileName = `Actualizacion_Alquiler_${lease.id}_${fechaHoy.replace(/\//g, '-')}.pdf`;
      const pdfBase64 = doc.output("datauristring");

      // Llamar a la acción para actualizar el monto y guardar el PDF en el backend
      await dispatch(
        updateLeaseRentAmount(
          lease.id,
          nuevoMonto[lease.id],
          fechaHoy,
          pdfBase64,
          fileName
        )
      );

      setPdfGenerado((prev) => ({ ...prev, [lease.id]: true }));

      // Recargar datos
      if (useNewEndpoint) {
        dispatch(getLeasesPendingUpdate());
      } else {
        dispatch(getAllLeases());
      }

      Swal.fire({
        title: "¡Éxito!",
        text: "El contrato ha sido actualizado y el PDF generado correctamente",
        icon: "success",
        timer: 3000
      });

    } catch (error) {
      console.error("Error al generar PDF:", error);
      Swal.fire("Error", "No se pudo generar el PDF y actualizar el contrato", "error");
    }
  };

  // 🆕 Función para calcular nuevo monto basado en porcentaje
  const calculateNewAmount = (currentAmount, percentage) => {
    if (!percentage || !currentAmount) return currentAmount;
    return Math.round(currentAmount * (1 + percentage / 100));
  };

  // 🆕 Función para determinar el color de urgencia
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 border-red-400 text-red-700';
      case 'medium': return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'low': return 'bg-blue-100 border-blue-400 text-blue-700';
      default: return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  // 🆕 Función para calcular estadísticas
  const getStatistics = () => {
    if (!leasesParaActualizar.length) return null;

    const stats = leasesParaActualizar.reduce((acc, lease) => {
      if (lease.urgency === 'high') acc.high++;
      else if (lease.urgency === 'medium') acc.medium++;
      else acc.low++;
      
      acc.totalCurrentRent += parseInt(lease.rentAmount || lease.currentRent || 0);
      return acc;
    }, { high: 0, medium: 0, low: 0, totalCurrentRent: 0 });

    return stats;
  };

  const statistics = getStatistics();

  return (
  <div className="max-w-7xl mx-auto p-4">
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        🏠 Contratos a Actualizar
      </h1>
      
      {/* 🆕 Panel de debug y control mejorado */}
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-yellow-800">🔧 Panel de Control</h3>
          <div className="flex space-x-2">
            <button
              onClick={debugContracts}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              🔍 Debug Detallado
            </button>
            <button
              onClick={() => setUseNewEndpoint(!useNewEndpoint)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                useNewEndpoint 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {useNewEndpoint ? '🔄 Usar Sistema Anterior' : '🔄 Usar Sistema Nuevo'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className={`p-3 rounded ${useNewEndpoint ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <h4 className="font-semibold">Sistema Nuevo (Backend)</h4>
            <p>Contratos detectados: {pendingUpdates?.count || 0}</p>
            <p>Estado: {useNewEndpoint ? '🟢 Activo' : '🔴 Inactivo'}</p>
          </div>
          <div className={`p-3 rounded ${!useNewEndpoint ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <h4 className="font-semibold">Sistema Anterior (Frontend)</h4>
            <p>Contratos detectados: {!useNewEndpoint ? leasesParaActualizar.length : (leases || []).filter(debeActualizar).length}</p>
            <p>Estado: {!useNewEndpoint ? '🟢 Activo' : '🔴 Inactivo'}</p>
          </div>
        </div>
        
        {/* 🆕 Mostrar problemas detectados */}
        {useNewEndpoint && (pendingUpdates?.count || 0) === 0 && leases && leases.length > 0 && (
          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <div>
                <h4 className="font-semibold text-red-700">Problema Detectado</h4>
                <p className="text-red-600 text-sm">
                  El sistema nuevo no está detectando contratos vencidos. 
                  Se recomienda usar el sistema anterior temporalmente.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle entre métodos (mantenido para compatibilidad) */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useNewEndpoint}
              onChange={(e) => setUseNewEndpoint(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium">Usar nuevo sistema de detección automática</span>
          </label>
          {useNewEndpoint && (
            <span className="text-sm text-green-600 font-medium">
              ✅ Sistema optimizado activo
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-2">
          El nuevo sistema detecta automáticamente los contratos que necesitan actualización basándose en la frecuencia configurada.
        </div>
      </div>

        {/* Información del IPC */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Índice IPC consultado (ej: 13,18%):
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={indiceIPC}
              onChange={(e) => setIndiceIPC(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: 13,18%"
            />
            <div className="text-xs text-gray-600">
              Este valor se incluirá en los PDFs generados
            </div>
          </div>
        </div>

        {/* 🆕 Estadísticas del nuevo endpoint */}
        {useNewEndpoint && pendingUpdates && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-700">Total Pendientes</h3>
              <p className="text-2xl font-bold text-blue-600">{pendingUpdates.count || leasesParaActualizar.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-700">Fecha Actual</h3>
              <p className="text-sm text-gray-600">{pendingUpdates.currentDate || new Date().toLocaleDateString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-gray-700">IPC Configurado</h3>
              <p className="text-sm text-gray-600">{indiceIPC || "No configurado"}</p>
            </div>
            {statistics && (
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-700">Renta Total</h3>
                <p className="text-sm text-purple-600">${statistics.totalCurrentRent.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* 🆕 Estadísticas de urgencia */}
        {statistics && useNewEndpoint && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔴</span>
                <div>
                  <h3 className="text-lg font-semibold text-red-700">Urgencia Alta</h3>
                  <p className="text-2xl font-bold text-red-800">{statistics.high}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🟡</span>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-700">Urgencia Media</h3>
                  <p className="text-2xl font-bold text-yellow-800">{statistics.medium}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🔵</span>
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">Urgencia Baja</h3>
                  <p className="text-2xl font-bold text-blue-800">{statistics.low}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-blue-600 text-lg flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando contratos...
          </div>
        </div>
      ) : leasesParaActualizar.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="text-6xl mb-4">🎉</div>
          <div className="text-green-700 text-xl font-semibold mb-2">
            ¡Excelente! No hay contratos para actualizar este mes.
          </div>
          <div className="text-sm text-gray-600">
            Todos los contratos están al día con sus actualizaciones.
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propiedad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquilino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Actual
                  </th>
                  {useNewEndpoint && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meses Atraso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Urgencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actualización Rápida
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nuevo Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leasesParaActualizar.map((lease) => (
                  <React.Fragment key={lease.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lease.Property?.address || lease.property || 'Sin dirección'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {lease.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lease.Tenant?.name || lease.tenant || 'Sin inquilino'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lease.Landlord?.name || lease.landlord || 'Sin propietario'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {lease.updateFrequency || 'No definida'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${parseInt(lease.rentAmount || lease.currentRent || 0).toLocaleString()}
                        </div>
                      </td>
                      
                      {/* 🆕 Campos adicionales del nuevo endpoint */}
                      {useNewEndpoint && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {lease.monthsOverdue || lease.monthsSinceStart || 0} meses
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(lease.urgency)}`}>
                              {lease.urgency === 'high' ? '🔴 Alta' : 
                               lease.urgency === 'medium' ? '🟡 Media' : '🔵 Baja'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={quickUpdatePercentage[lease.id] || ""}
                                onChange={(e) =>
                                  setQuickUpdatePercentage(prev => ({
                                    ...prev,
                                    [lease.id]: e.target.value,
                                  }))
                                }
                                className="border border-gray-300 rounded px-2 py-1 w-16 text-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="%"
                                step="0.1"
                              />
                              <button
                                onClick={() => handleQuickUpdate(lease)}
                                disabled={!quickUpdatePercentage[lease.id]}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-2 py-1 rounded text-xs transition-colors"
                                title="Actualización rápida con porcentaje"
                              >
                                ⚡
                              </button>
                            </div>
                            {quickUpdatePercentage[lease.id] && (
                              <div className="text-xs text-gray-500 mt-1">
                                Nuevo: ${calculateNewAmount(lease.currentRent || lease.rentAmount, parseFloat(quickUpdatePercentage[lease.id])).toLocaleString()}
                              </div>
                            )}
                          </td>
                        </>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={nuevoMonto[lease.id] || ""}
                          onChange={(e) =>
                            setNuevoMonto((prev) => ({
                              ...prev,
                              [lease.id]: e.target.value,
                            }))
                          }
                          className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nuevo monto"
                        />
                        {nuevoMonto[lease.id] && (
                          <div className="text-xs text-gray-500 mt-1">
                            Aumento: ${(parseInt(nuevoMonto[lease.id]) - parseInt(lease.rentAmount || lease.currentRent || 0)).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                            onClick={() => handleGenerarPDF(lease)}
                            disabled={!nuevoMonto[lease.id] || pdfGenerado[lease.id]}
                          >
                            {pdfGenerado[lease.id] ? "✅ Actualizado" : "📄 Generar PDF"}
                          </button>
                          {/* 🆕 Botón de historial */}
                          <button
                            onClick={() => toggleHistory(lease.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            {showHistory[lease.id] ? "🔼 Ocultar" : "📊 Historial"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* 🆕 Fila expandible para historial */}
                    {showHistory[lease.id] && contractHistory[lease.id] && (
                      <tr>
                        <td colSpan={useNewEndpoint ? 10 : 7} className="px-6 py-4 bg-gray-50 border-l-4 border-purple-200">
                          <div className="max-w-4xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              📊 Historial de Actualizaciones - Contrato #{lease.id}
                            </h4>
                            {contractHistory[lease.id].updates?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Monto Anterior</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Monto Nuevo</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Aumento</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">%</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Observaciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {contractHistory[lease.id].updates.map((update, index) => (
                                      <tr key={update.id || index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-xs text-gray-900">
                                          {new Date(update.updateDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900">
                                          ${parseInt(update.oldAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-900">
                                          ${parseInt(update.newAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-green-600">
                                          +${parseInt(update.increaseAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-blue-600">
                                          {update.increasePercentage || 0}%
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-600">
                                          {update.notes || 'Sin observaciones'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <div className="text-4xl mb-2">📝</div>
                                <p className="text-sm text-gray-500">No hay actualizaciones registradas para este contrato.</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🆕 Información adicional */}
      {leasesParaActualizar.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Información importante:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Los contratos se ordenan por urgencia de actualización</li>
            <li>• El PDF generado incluye el índice IPC especificado</li>
            <li>• La actualización rápida usa el porcentaje ingresado sobre el monto actual</li>
            <li>• El historial muestra todas las actualizaciones previas del contrato</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActualizarAlquileres;