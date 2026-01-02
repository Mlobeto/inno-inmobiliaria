/* eslint-disable react/prop-types */
/**
 * Tenant Actions - Ejemplo de uso de mutaciones RTK Query
 * 
 * Demuestra cómo usar mutaciones para actualizar, suspender y activar tenants
 */

import  { useState } from 'react';
import {
  useUpdateTenantMutation,
  useSuspendTenantMutation,
  useActivateTenantMutation,
} from '../../../shared/redux';

const TenantActions = ({ tenant, onSuccess }) => {
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  
  // Mutaciones RTK Query
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();
  const [suspendTenant, { isLoading: isSuspending }] = useSuspendTenantMutation();
  const [activateTenant, { isLoading: isActivating }] = useActivateTenantMutation();
  
  // Handler para suspender
  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Debes proporcionar una razón para la suspensión');
      return;
    }
    
    try {
      await suspendTenant({
        tenantId: tenant.tenantId,
        reason: suspendReason,
      }).unwrap(); // unwrap() lanza error si falla
      
      // Éxito
      alert('✅ Tenant suspendido exitosamente');
      setShowSuspendModal(false);
      setSuspendReason('');
      onSuccess?.();
      
    } catch (error) {
      alert(`❌ Error al suspender: ${error.data?.message || error.message}`);
    }
  };
  
  // Handler para activar
  const handleActivate = async () => {
    if (!confirm('¿Estás seguro de reactivar este tenant?')) {
      return;
    }
    
    try {
      await activateTenant(tenant.tenantId).unwrap();
      alert('✅ Tenant reactivado exitosamente');
      onSuccess?.();
    } catch (error) {
      alert(`❌ Error al activar: ${error.data?.message || error.message}`);
    }
  };
  
  // Handler para actualizar
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTenant({
        tenantId: tenant.tenantId,
        status: newStatus,
      }).unwrap();
      
      alert('✅ Estado actualizado');
      onSuccess?.();
    } catch (error) {
      alert(`❌ Error: ${error.data?.message || error.message}`);
    }
  };
  
  return (
    <div className="flex gap-2">
      {tenant.status === 'active' ? (
        <button
          onClick={() => setShowSuspendModal(true)}
          disabled={isSuspending}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isSuspending ? 'Suspendiendo...' : '⏸️ Suspender'}
        </button>
      ) : (
        <button
          onClick={handleActivate}
          disabled={isActivating}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isActivating ? 'Activando...' : '▶️ Activar'}
        </button>
      )}
      
      {/* Modal de suspensión */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Suspender Tenant</h3>
            <p className="text-gray-600 mb-4">
              Tenant: <strong>{tenant.businessName}</strong>
            </p>
            
            <label className="block mb-2">
              <span className="text-gray-700">Razón de suspensión *</span>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
                placeholder="Ej: Falta de pago, Violación de términos, etc."
              />
            </label>
            
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspend}
                disabled={isSuspending || !suspendReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isSuspending ? 'Suspendiendo...' : 'Confirmar Suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantActions;
