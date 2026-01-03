/* eslint-disable react/prop-types */
/**
 * Formulario para Crear Tenant Manual
 * Permite al Platform Admin crear tenants sin pasar por MercadoPago
 * Útil para demos, pilotos, clientes especiales, etc.
 */

import { useState, useEffect } from 'react';
import { useCreateManualTenantMutation, useCheckSubdomainAvailabilityQuery } from '@shared/redux';

const CreateManualTenantForm = ({ onSuccess, onCancel }) => {
  const [createTenant, { isLoading, isError, error }] = useCreateManualTenantMutation();
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    subdomain: '',
    cuit: '',
    phone: '',
    address: '',
    plan: 'free',
    durationDays: 30,
    maxAgents: 5,
    maxProperties: 100,
    adminUsername: '',
    adminPassword: '',
    adminFullName: '',
    adminEmail: '',
    notes: '',
  });
  
  const [createdTenant, setCreatedTenant] = useState(null);
  const [subdomainToCheck, setSubdomainToCheck] = useState('');
  
  // Validación de subdomain en tiempo real (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.subdomain && formData.subdomain.length >= 3) {
        setSubdomainToCheck(formData.subdomain);
      } else {
        setSubdomainToCheck('');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.subdomain]);
  
  // Query para verificar disponibilidad
  const { data: subdomainCheck, isFetching: checkingSubdomain } = useCheckSubdomainAvailabilityQuery(
    subdomainToCheck,
    { skip: !subdomainToCheck }
  );
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es subdomain, convertir a minúsculas y quitar caracteres inválidos
    if (name === 'subdomain') {
      const cleanValue = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, ''); // No permitir guiones al inicio/fin
      
      setFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.businessName || !formData.email || !formData.subdomain) {
      alert('Nombre de negocio, email y subdomain son requeridos');
      return;
    }
    
    // Validar que el subdomain esté disponible
    if (subdomainCheck && !subdomainCheck.available) {
      alert('El subdomain no está disponible. Por favor elige otro.');
      return;
    }
    
    if (formData.adminUsername && !formData.adminPassword) {
      alert('Si especificas un username, debes proporcionar una contraseña');
      return;
    }
    
    try {
      const result = await createTenant(formData).unwrap();
      
      // Mostrar resultado con credenciales
      setCreatedTenant(result.data);
      
      // Notificar éxito
      alert('✅ Tenant creado exitosamente!');
      
    } catch (err) {
      console.error('Error creando tenant:', err);
      alert(`❌ Error: ${err.data?.message || err.message}`);
    }
  };
  
  // Si ya se creó el tenant, mostrar resultado
  if (createdTenant) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-4xl">✅</span>
            <h2 className="text-2xl font-bold text-green-600">Tenant Creado Exitosamente</h2>
          </div>
          
          {/* Información del Tenant */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-2">Información del Tenant</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Nombre:</p>
                <p className="font-semibold">{createdTenant.tenant.businessName}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold">{createdTenant.tenant.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Subdomain:</p>
                <p className="font-semibold">{createdTenant.tenant.subdomain}</p>
              </div>
              <div>
                <p className="text-gray-600">Plan:</p>
                <p className="font-semibold uppercase">{createdTenant.tenant.plan}</p>
              </div>
            </div>
          </div>
          
          {/* Credenciales de Admin */}
          {createdTenant.admin && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-lg mb-2 text-yellow-800">
                🔑 Credenciales de Acceso
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                ⚠️ Guarda estas credenciales, no se volverán a mostrar
              </p>
              <div className="bg-white rounded p-3 font-mono text-sm">
                <p><strong>Username:</strong> {createdTenant.admin.username}</p>
                <p><strong>Password:</strong> {createdTenant.admin.temporaryPassword}</p>
                <p><strong>Email:</strong> {createdTenant.admin.email}</p>
              </div>
              <p className="text-sm text-yellow-700 mt-3">
                📧 Envía estas credenciales al cliente de forma segura
              </p>
            </div>
          )}
          
          {/* URL de Login */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-2">URL de Acceso</h3>
            <a 
              href={createdTenant.loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {createdTenant.loginUrl}
            </a>
          </div>
          
          {/* Fecha de expiración */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              ⏰ <strong>Expira el:</strong> {new Date(createdTenant.expiresAt).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              setCreatedTenant(null);
              setFormData({
                businessName: '',
                email: '',
                subdomain: '',
                cuit: '',
                phone: '',
                address: '',
                plan: 'free',
                durationDays: 30,
                maxAgents: 5,
                maxProperties: 100,
                adminUsername: '',
                adminPassword: '',
                adminFullName: '',
                adminEmail: '',
                notes: '',
              });
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Crear Otro Tenant
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  
  // Formulario
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Crear Tenant Manual</h2>
      <p className="text-gray-600 mb-6">
        Crea un tenant sin pasar por MercadoPago. Ideal para demos, pilotos o clientes especiales.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Negocio */}
        <div className="border-b pb-4">
          <h3 className="font-bold text-lg mb-3">Información del Negocio</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Inmobiliaria San Martín"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contacto@inmobiliaria.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT * <span className="text-xs text-gray-500">(formato: XX-XXXXXXXX-X)</span>
              </label>
              <input
                type="text"
                name="cuit"
                value={formData.cuit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="20-12345678-9"
                pattern="\d{2}-\d{8}-\d"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain * <span className="text-xs text-gray-500">(será parte de la URL)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formData.subdomain && subdomainCheck
                      ? subdomainCheck.available
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="inmobiliaria-sm"
                  minLength="3"
                  maxLength="30"
                />
                {checkingSubdomain && (
                  <span className="absolute right-3 top-3 text-gray-400">
                    Verificando...
                  </span>
                )}
                {formData.subdomain && subdomainCheck && !checkingSubdomain && (
                  <span className={`absolute right-3 top-3 ${
                    subdomainCheck.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {subdomainCheck.available ? '✓ Disponible' : '✗ No disponible'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
              </p>
              {formData.subdomain && subdomainCheck && !subdomainCheck.available && (
                <p className="text-xs text-red-600 mt-1">
                  {subdomainCheck.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle 123, Ciudad"
              />
            </div>
          </div>
        </div>
        
        {/* Configuración de Suscripción */}
        <div className="border-b pb-4">
          <h3 className="font-bold text-lg mb-3">Configuración de Suscripción</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (días)
              </label>
              <input
                type="number"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleChange}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Agentes
              </label>
              <input
                type="number"
                name="maxAgents"
                value={formData.maxAgents}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo de Propiedades
              </label>
              <input
                type="number"
                name="maxProperties"
                value={formData.maxProperties}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Credenciales de Admin Inicial */}
        <div className="border-b pb-4">
          <h3 className="font-bold text-lg mb-3">Admin Inicial (opcional)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Si no completas estos campos, el cliente deberá crear su admin manualmente
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="adminUsername"
                value={formData.adminUsername}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin_inmobiliaria"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="text"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="TempPass123!"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                name="adminFullName"
                value={formData.adminFullName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Juan Pérez"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Admin
              </label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin@inmobiliaria.com"
              />
            </div>
          </div>
        </div>
        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Internas
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Notas sobre este tenant (motivo, contacto, acuerdos especiales, etc.)"
          />
        </div>
        
        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            ❌ {error?.data?.message || 'Error al crear tenant'}
          </div>
        )}
        
        {/* Botones */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || checkingSubdomain || (formData.subdomain && subdomainCheck && !subdomainCheck.available)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando...' : '✨ Crear Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateManualTenantForm;
