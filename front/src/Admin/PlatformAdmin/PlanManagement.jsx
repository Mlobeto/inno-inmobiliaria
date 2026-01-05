/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { IoAdd, IoTrash, IoCreate, IoPower, IoCheckmark, IoClose } from 'react-icons/io5';
import {
  useListPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useTogglePlanStatusMutation,
} from '@shared/redux';

function PlanManagement() {
  // RTK Query hooks
  const { data: plansData, isLoading: isLoadingPlans, error: plansError } = useListPlansQuery();
  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();
  const [toggleStatus] = useTogglePlanStatusMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState(null);

  // Obtener planes del response
  const plans = plansData?.plans || [];

  // Debug: ver qué llega
  useEffect(() => {
    console.log('📋 Plans Data:', plansData);
    console.log('📋 Plans Array:', plans);
  }, [plansData, plans]);

  // Mostrar error de RTK Query si existe
  useEffect(() => {
    if (plansError) {
      setError(plansError?.data?.message || plansError?.message || 'Error al cargar planes');
      console.error('❌ Plans Error:', plansError);
    }
  }, [plansError]);

  // Formulario para crear/editar plan
  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    description: '',
    priceMonthly: '',
    priceYearly: '',
    currency: 'ARS',
    features: {
      maxProperties: '',
      maxClients: '',
      maxUsers: '',
      maxStorageGB: '',
      pdfPropiedades: true,
      editorContratos: true,
      whatsappTemplates: true,
      seguimientoPagos: true,
      actualizacionAlquileres: true,
      autorizacionVentas: true,
      estadisticas: false,
      exportData: false,
      mercadoLibreIntegration: false,
      soportePrioritario: false
    },
    trialDays: 0,
    isActive: true,
    isPopular: false,
    sortOrder: 1
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Convertir campos numéricos
      const payload = {
        ...formData,
        priceMonthly: parseFloat(formData.priceMonthly),
        priceYearly: parseFloat(formData.priceYearly),
        trialDays: parseInt(formData.trialDays),
        sortOrder: parseInt(formData.sortOrder),
        features: {
          ...formData.features,
          maxProperties: parseInt(formData.features.maxProperties),
          maxClients: parseInt(formData.features.maxClients),
          maxUsers: parseInt(formData.features.maxUsers),
          maxStorageGB: parseInt(formData.features.maxStorageGB)
        }
      };
      
      await createPlan(payload).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al crear plan');
      console.error('Error creating plan:', err);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // Preparar payload (sin planId, ya que no se puede cambiar)
      const { planId, ...updateData } = formData;
      const payload = {
        planId, // se pasa como parámetro separado
        ...updateData,
        priceMonthly: parseFloat(updateData.priceMonthly),
        priceYearly: parseFloat(updateData.priceYearly),
        trialDays: parseInt(updateData.trialDays),
        sortOrder: parseInt(updateData.sortOrder),
        features: {
          ...updateData.features,
          maxProperties: parseInt(updateData.features.maxProperties),
          maxClients: parseInt(updateData.features.maxClients),
          maxUsers: parseInt(updateData.features.maxUsers),
          maxStorageGB: parseInt(updateData.features.maxStorageGB)
        }
      };
      
      await updatePlan(payload).unwrap();
      setShowEditModal(false);
      setSelectedPlan(null);
      resetForm();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al actualizar plan');
      console.error('Error updating plan:', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm(`¿Estás seguro de eliminar el plan "${planId}"? Si tiene suscripciones activas, solo se desactivará.`)) {
      return;
    }
    
    setError(null);
    
    try {
      const result = await deletePlan(planId).unwrap();
      alert(result.message);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al eliminar plan');
      console.error('Error deleting plan:', err);
    }
  };

  const handleToggleStatus = async (planId) => {
    setError(null);
    
    try {
      await toggleStatus(planId).unwrap();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al cambiar estado');
      console.error('Error toggling status:', err);
    }
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      planId: plan.planId,
      name: plan.name,
      description: plan.description || '',
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
      trialDays: plan.trialDays || 0,
      isActive: plan.isActive,
      isPopular: plan.isPopular || false,
      sortOrder: plan.sortOrder || 1
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      planId: '',
      name: '',
      description: '',
      priceMonthly: '',
      priceYearly: '',
      currency: 'ARS',
      features: {
        maxProperties: '',
        maxClients: '',
        maxUsers: '',
        maxStorageGB: '',
        pdfTemplates: false,
        customTemplates: false,
        whatsappIntegration: false,
        estadisticas: false,
        exportData: false,
        apiAccess: false,
        customDomain: false,
        prioritySupport: false
      },
      trialDays: 0,
      isActive: true,
      isPopular: false,
      sortOrder: 1
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Planes</h2>
          <p className="text-gray-600 mt-1">Administra los planes de suscripción</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <IoAdd size={20} />
          Crear Plan
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoadingPlans && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando planes...</p>
        </div>
      )}

      {/* Plans Table */}
      {!isLoadingPlans && plans.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Límites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.planId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                          {plan.isPopular && (
                            <span className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{plan.planId}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-400 mt-1">{plan.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatPrice(plan.priceMonthly)}/mes
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(plan.priceYearly)}/año
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {plan.features.maxProperties} propiedades
                    </div>
                    <div className="text-sm text-gray-500">
                      {plan.features.maxClients} clientes
                    </div>
                    <div className="text-sm text-gray-500">
                      {plan.features.maxUsers} usuarios
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(plan.planId)}
                        className={`p-2 rounded hover:bg-gray-100 ${
                          plan.isActive ? 'text-orange-600' : 'text-green-600'
                        }`}
                        title={plan.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <IoPower size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(plan)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Editar"
                      >
                        <IoCreate size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.planId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <IoTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingPlans && plans.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No hay planes creados</p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Crear primer plan
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {showCreateModal ? 'Crear Nuevo Plan' : 'Editar Plan'}
              </h3>

              <form onSubmit={showCreateModal ? handleCreatePlan : handleUpdatePlan}>
                {/* Información Básica */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-700">Información Básica</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ID del Plan *
                      </label>
                      <input
                        type="text"
                        name="planId"
                        value={formData.planId}
                        onChange={handleInputChange}
                        disabled={showEditModal}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        placeholder="free, professional, enterprise"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Plan Gratis"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Descripción del plan"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Mensual (ARS) *
                      </label>
                      <input
                        type="number"
                        name="priceMonthly"
                        value={formData.priceMonthly}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Anual (ARS) *
                      </label>
                      <input
                        type="number"
                        name="priceYearly"
                        value={formData.priceYearly}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días de Prueba
                      </label>
                      <input
                        type="number"
                        name="trialDays"
                        value={formData.trialDays}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Límites de Recursos */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-700">Límites de Recursos</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de Propiedades
                      </label>
                      <input
                        type="number"
                        name="features.maxProperties"
                        value={formData.features.maxProperties}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de Clientes
                      </label>
                      <input
                        type="number"
                        name="features.maxClients"
                        value={formData.features.maxClients}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Máximo de Usuarios
                      </label>
                      <input
                        type="number"
                        name="features.maxUsers"
                        value={formData.features.maxUsers}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Almacenamiento (GB)
                      </label>
                      <input
                        type="number"
                        name="features.maxStorageGB"
                        value={formData.features.maxStorageGB}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-700">Características</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'pdfPropiedades', label: 'Generación PDF Propiedades' },
                      { name: 'editorContratos', label: 'Editor de Contratos Personalizado' },
                      { name: 'whatsappTemplates', label: 'Plantillas WhatsApp' },
                      { name: 'seguimientoPagos', label: 'Seguimiento de Pagos' },
                      { name: 'actualizacionAlquileres', label: 'Actualización de Alquileres' },
                      { name: 'autorizacionVentas', label: 'Autorización de Ventas' },
                      { name: 'estadisticas', label: 'Estadísticas Avanzadas' },
                      { name: 'exportData', label: 'Exportación Excel/CSV' },
                      { name: 'mercadoLibreIntegration', label: 'Integración Mercado Libre' },
                      { name: 'soportePrioritario', label: 'Soporte Prioritario' }
                    ].map(({ name, label }) => (
                      <label key={name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`features.${name}`}
                          checked={formData.features[name]}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Configuración */}
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-gray-700">Configuración</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Orden
                      </label>
                      <input
                        type="number"
                        name="sortOrder"
                        value={formData.sortOrder}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Activo</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isPopular"
                        checked={formData.isPopular}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Popular</span>
                    </label>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedPlan(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <IoClose className="inline mr-1" />
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <IoCheckmark className="inline mr-1" />
                    {isCreating || isUpdating ? 'Guardando...' : (showCreateModal ? 'Crear Plan' : 'Actualizar Plan')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanManagement;
