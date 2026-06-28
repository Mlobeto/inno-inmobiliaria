/* eslint-disable react/prop-types */
/**
 * Formulario para Crear Tenant Manual
 * Permite al Platform Admin crear tenants sin pasar por MercadoPago
 * Útil para demos, pilotos, clientes especiales, etc.
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useCreateManualTenantMutation, useCheckSubdomainAvailabilityQuery } from '@shared/redux';

function formatCreateTenantError(err) {
  const data = err?.data;
  if (!data) return err?.message || 'Error desconocido al crear tenant';
  if (typeof data.message === 'string' && data.message.length < 300) return data.message;
  if (typeof data.error === 'string') {
    const prismaMatch = data.error.match(
      /Argument `(\w+)`: Invalid value provided\. Expected ([^,]+), provided (\w+)/
    );
    if (prismaMatch) {
      const [, field, expected, received] = prismaMatch;
      return `Campo "${field}": se esperaba ${expected.trim()}, se recibió ${received}.`;
    }
    const lastLine = data.error.split('\n').filter(Boolean).pop();
    if (lastLine && lastLine.length < 200) return lastLine;
  }
  return data.message || 'Error al crear tenant';
}

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
  const [submitError, setSubmitError] = useState(null);
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

  // Sugerir username a partir del subdomain si el campo está vacío
  useEffect(() => {
    if (!formData.subdomain || formData.subdomain.length < 3) return;
    setFormData((prev) => {
      if (prev.adminUsername?.trim()) return prev;
      return { ...prev, adminUsername: `${formData.subdomain}_admin` };
    });
  }, [formData.subdomain]);
  
  // Query para verificar disponibilidad
  const { data: subdomainCheck, isFetching: checkingSubdomain } = useCheckSubdomainAvailabilityQuery(
    subdomainToCheck,
    { skip: !subdomainToCheck }
  );
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSubmitError(null);

    const numericFields = ['durationDays', 'maxAgents', 'maxProperties'];
    const parsedValue = numericFields.includes(name) ? parseInt(value, 10) || '' : value;
    
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
        [name]: parsedValue
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    // Validaciones básicas
    if (!formData.businessName || !formData.email || !formData.subdomain) {
      toast.error('Nombre de negocio, email y subdomain son requeridos');
      return;
    }
    
    // Validar que el subdomain esté disponible
    if (subdomainCheck && !subdomainCheck.available) {
      toast.error('El subdomain no está disponible. Elegí otro.');
      return;
    }

    const payload = {
      ...formData,
      durationDays: parseInt(formData.durationDays, 10) || 30,
      maxAgents: parseInt(formData.maxAgents, 10) || 5,
      maxProperties: parseInt(formData.maxProperties, 10) || 100,
    };
    
    try {
      const result = await createTenant(payload).unwrap();
      
      // Mostrar resultado con credenciales
      setCreatedTenant(result.data);
      toast.success('Tenant creado exitosamente');
      
    } catch (err) {
      const message = formatCreateTenantError(err);
      console.error('Error creando tenant:', { status: err?.status, message, raw: err });
      setSubmitError(message);
      toast.error(message);
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
                Credenciales de acceso
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Usá el <strong>username</strong> (no el email del negocio) para iniciar sesión.
                {createdTenant.admin.autoGenerated && (
                  <> La contraseña se generó automáticamente.</>
                )}
              </p>
              <div className="bg-white rounded p-3 font-mono text-sm space-y-1">
                <p><strong>Username:</strong> {createdTenant.admin.username}</p>
                <p><strong>Password:</strong> {createdTenant.admin.temporaryPassword}</p>
                <p><strong>Email admin:</strong> {createdTenant.admin.email}</p>
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
              ⏰ <strong>Expira el:</strong>{' '}
              {createdTenant.expiresAt
                ? new Date(createdTenant.expiresAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : '♾️ Permanente (sin vencimiento)'}
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
                <option value="base">Plan Base</option>
                <option value="lifetime">Lifetime (interno — todos los módulos)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (días)
              </label>
              {formData.plan === 'lifetime' ? (
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  ♾️ Permanente (sin vencimiento)
                </div>
              ) : (
                <input
                  type="number"
                  name="durationDays"
                  value={formData.durationDays}
                  onChange={handleChange}
                  min="1"
                  max="36500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
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
        
        {/* Admin inicial */}
        <div className="border-b pb-4">
          <h3 className="font-bold text-lg mb-3">Usuario admin del tenant</h3>
          <p className="text-sm text-gray-600 mb-3">
            Es el nombre con el que el cliente inicia sesión. Si dejás la contraseña vacía,
            se genera una automáticamente (se muestra una sola vez al crear).
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username (login) *
              </label>
              <input
                type="text"
                name="adminUsername"
                value={formData.adminUsername}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="qlpropiedades_admin"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-gray-400 font-normal">(opcional)</span>
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
        {(submitError || isError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm space-y-1">
            <p className="font-medium">No se pudo crear el tenant</p>
            <p>{submitError || formatCreateTenantError(error)}</p>
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
