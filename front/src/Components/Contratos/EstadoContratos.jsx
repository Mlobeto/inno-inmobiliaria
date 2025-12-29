import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';
import { getAllLeases, updateLease } from "../../redux/Actions/actions";
import CreateLeaseForm from "./CreateLeaseForm";
import CompraVenta from "./CompraVenta";
import ContratoAlquiler from "../PdfTemplates/ContratoAlquiler";
import ContratoEditor from "./ContratoEditor";
import Swal from 'sweetalert2';
import {
  IoArrowBackOutline,
  IoHomeOutline,
  IoDocumentTextOutline,
  IoPencilOutline,
  IoSaveOutline,
  IoPersonOutline,
  IoBusinessOutline,
  IoCalendarOutline,
  IoCashOutline,
  IoTimeOutline,
  IoClipboardOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAddOutline,
  IoKeyOutline,
  IoDownloadOutline,
  IoCreateOutline
} from 'react-icons/io5';const EstadoContratos = ({ onLeaseSelect }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  // Selectores optimizados
  const leases = useSelector((state) => state.leases);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);
  const [editingLeaseId, setEditingLeaseId] = useState(null);
  const [editedLease, setEditedLease] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [pdfLease, setPdfLease] = useState(null);
  const [editorLease, setEditorLease] = useState(null);

  // Detectar el contexto basado en la URL
  const isLeaseContext = location.pathname === '/contratoAlquiler';
  const isSaleContext = location.pathname === '/sale';

  useEffect(() => {
    console.log("Leases en componente:", leases);
  }, [leases]);

  useEffect(() => {
    dispatch(getAllLeases());
  }, [dispatch]);

  const handleEditClick = (lease) => {
    setEditingLeaseId(lease.leaseId || lease.id);
    setEditedLease(lease);
  };

  const handleEditContract = (lease) => {
    setEditorLease(lease);
  };

  const handleCloseEditor = () => {
    setEditorLease(null);
    // Recargar los leases para obtener el contenido actualizado
    dispatch(getAllLeases());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLease((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async (leaseId) => {
    try {
      console.log("Guardando contrato", leaseId, editedLease);
      
      await dispatch(updateLease(leaseId, editedLease));
      
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Contrato actualizado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      setEditingLeaseId(null);
      setEditedLease({});
    } catch (error) {
      console.error('Error al guardar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo actualizar el contrato'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingLeaseId(null);
    setEditedLease({});
  };

  const handleDownloadPdf = (lease) => {
    console.log("Generando PDF para contrato:", lease);
    setPdfLease(lease);
  };

  const handleClosePdf = () => {
    setPdfLease(null);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center max-w-md">
          <IoCloseCircleOutline className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-lg font-medium">Error al cargar contratos</p>
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
              <span className="text-white font-medium">Listado de Contratos</span>
            </nav>
          </div>
          
          {/* Botón para crear nuevo contrato según el contexto */}
          {(isLeaseContext || isSaleContext) && (
            <button
              onClick={() => {
                if (isLeaseContext) setShowCreateModal(true);
                if (isSaleContext) setShowSaleModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <IoAddOutline className="w-5 h-5" />
              <span className="hidden sm:inline">
                {isLeaseContext ? 'Nuevo Contrato' : 'Nueva Compraventa'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Header principal */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-b border-white/10">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <IoDocumentTextOutline className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Estado de Contratos
              </h1>
            </div>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Gestiona y edita la información de todos los contratos de alquiler
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!leases || leases.length === 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-12 text-center">
            <IoClipboardOutline className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <p className="text-amber-400 text-xl font-medium mb-2">No hay contratos registrados</p>
            <p className="text-slate-400">Comienza creando tu primer contrato de alquiler</p>
          </div>
        ) : (
          /* Grid de contratos modernizado */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                Contratos encontrados: {leases.length}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {leases.map((lease) => {
                const isEditing = editingLeaseId === (lease.leaseId || lease.id);
                const displayLease = isEditing ? editedLease : lease;
                
                return (
                  <div
                    key={lease.leaseId || lease.id}
                    className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
                  >
                    {/* Header del contrato */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <IoDocumentTextOutline className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">
                            Contrato #{lease.leaseId || lease.id}
                          </h4>
                          <p className="text-slate-400 text-sm">ID: {lease.leaseId || lease.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveClick(lease.leaseId || lease.id)}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors duration-200"
                              title="Guardar"
                            >
                              <IoSaveOutline className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
                              title="Cancelar"
                            >
                              <IoCloseCircleOutline className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(lease)}
                              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors duration-200"
                              title="Editar Datos"
                            >
                              <IoPencilOutline className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditContract(lease)}
                              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors duration-200"
                              title="Editar Contrato"
                            >
                              <IoCreateOutline className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(lease)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
                              title="Descargar PDF"
                            >
                              <IoDownloadOutline className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Información del contrato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Inquilino */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-blue-400" />
                          Inquilino
                        </label>
                        <div className="text-white font-medium">
                          {lease.Tenant ? lease.Tenant.name : lease.tenantId}
                        </div>
                      </div>

                      {/* Propiedad */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoBusinessOutline className="w-4 h-4 mr-2 text-green-400" />
                          Propiedad
                        </label>
                        {isEditing ? (
                          <input
                            name="propertyId"
                            value={displayLease.propertyId || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        ) : (
                          <div className="text-white">
                            {lease.Property ? lease.Property.address : lease.propertyId}
                          </div>
                        )}
                      </div>

                      {/* Propietario */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoPersonOutline className="w-4 h-4 mr-2 text-purple-400" />
                          Propietario
                        </label>
                        {isEditing ? (
                          <input
                            name="landlordId"
                            value={displayLease.landlordId || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        ) : (
                          <div className="text-white">
                            {lease.Landlord && lease.Landlord.name ? lease.Landlord.name : lease.landlordId}
                          </div>
                        )}
                      </div>

                      {/* Fecha de inicio */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCalendarOutline className="w-4 h-4 mr-2 text-orange-400" />
                          Fecha de Inicio
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="startDate"
                            value={
                              displayLease.startDate
                                ? new Date(displayLease.startDate).toISOString().substring(0, 10)
                                : ""
                            }
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        ) : (
                          <div className="text-white">
                            {new Date(lease.startDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Monto */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCashOutline className="w-4 h-4 mr-2 text-green-400" />
                          Monto
                        </label>
                        {isEditing ? (
                          <input
                            name="rentAmount"
                            value={displayLease.rentAmount || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        ) : (
                          <div className="text-green-400 font-bold">
                            ${lease.rentAmount?.toLocaleString() || 'N/A'}
                          </div>
                        )}
                      </div>

                      {/* Frecuencia */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoTimeOutline className="w-4 h-4 mr-2 text-yellow-400" />
                          Frecuencia
                        </label>
                        {isEditing ? (
                          <select
                            name="updateFrequency"
                            value={displayLease.updateFrequency || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value="" className="bg-slate-800">Seleccionar</option>
                            <option value="semestral" className="bg-slate-800">Semestral</option>
                            <option value="cuatrimestral" className="bg-slate-800">Cuatrimestral</option>
                            <option value="anual" className="bg-slate-800">Anual</option>
                          </select>
                        ) : (
                          <div className="text-white capitalize">
                            {lease.updateFrequency || 'N/A'}
                          </div>
                        )}
                      </div>

                      {/* Meses totales */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoCalendarOutline className="w-4 h-4 mr-2 text-blue-400" />
                          Duración (meses)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            name="totalMonths"
                            value={displayLease.totalMonths || ''}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        ) : (
                          <div className="text-white">
                            {lease.totalMonths} meses
                          </div>
                        )}
                      </div>

                      {/* Inventario */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center text-sm font-medium text-slate-300">
                          <IoClipboardOutline className="w-4 h-4 mr-2 text-indigo-400" />
                          Inventario
                        </label>
                        {isEditing ? (
                          <textarea
                            name="inventory"
                            value={displayLease.inventory || ''}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                          />
                        ) : (
                          <div className="text-slate-300 text-sm bg-white/5 rounded-lg p-3 min-h-[60px]">
                            {lease.inventory || 'Sin inventario registrado'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón para seleccionar contrato para pagos */}
                    {onLeaseSelect && (
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <button
                          onClick={() => onLeaseSelect(lease)}
                          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-[1.02]"
                        >
                          <IoCheckmarkCircleOutline className="w-5 h-5 mr-2" />
                          Seleccionar para Pago
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear contrato de alquiler */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <IoKeyOutline className="w-6 h-6 mr-2 text-blue-400" />
                Crear Contrato de Alquiler
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseCircleOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <CreateLeaseForm 
                isModal={true}
                onClose={() => {
                  setShowCreateModal(false);
                  dispatch(getAllLeases()); // Refrescar la lista
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para compraventa */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <IoBusinessOutline className="w-6 h-6 mr-2 text-purple-400" />
                Gestionar Compraventa
              </h3>
              <button
                onClick={() => setShowSaleModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseCircleOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <CompraVenta 
                isModal={true}
                onClose={() => {
                  setShowSaleModal(false);
                  dispatch(getAllLeases()); // Refrescar la lista
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar PDF */}
      {pdfLease && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <IoDocumentTextOutline className="w-6 h-6 mr-2 text-blue-400" />
                Contrato de Alquiler - #{pdfLease.leaseId || pdfLease.id}
              </h3>
              <button
                onClick={handleClosePdf}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <IoCloseCircleOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              <ContratoAlquiler lease={pdfLease} />
            </div>
          </div>
        </div>
      )}

      {/* Modal del Editor de Contrato */}
      {editorLease && (
        <ContratoEditor lease={editorLease} onClose={handleCloseEditor} />
      )}
    </div>
  );
};

EstadoContratos.propTypes = {
  onLeaseSelect: PropTypes.func,
};

export default EstadoContratos;