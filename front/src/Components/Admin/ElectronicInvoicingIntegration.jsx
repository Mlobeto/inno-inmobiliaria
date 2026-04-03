import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoSyncOutline,
  IoWarningOutline,
  IoDocumentTextOutline,
  IoShieldCheckmarkOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoLockClosedOutline,
  IoCloudUploadOutline,
  IoRefreshOutline,
  IoHelpCircleOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Estados del onboarding en orden
const ONBOARDING_STEPS = [
  {
    key: 'draft',
    label: 'Datos fiscales',
    description: 'CUIT, razón social, condición IVA y punto de venta',
  },
  {
    key: 'certificate_uploaded',
    label: 'Certificado AFIP',
    description: 'Certificado digital y clave privada en formato PEM',
  },
  {
    key: 'wsaa_verified',
    label: 'Conexión WSAA',
    description: 'Autenticación contra el servicio WSAA de AFIP/ARCA',
  },
  {
    key: 'ready',
    label: 'Listo para facturar',
    description: 'Perfil habilitado para emitir comprobantes electrónicos',
  },
];

const ONBOARDING_ORDER = ['draft', 'csr_generated', 'certificate_uploaded', 'service_linked', 'wsaa_verified', 'ready'];

function getStepStatus(profileStatus, stepKey) {
  if (!profileStatus) return 'pending';
  const profileIdx = ONBOARDING_ORDER.indexOf(profileStatus);
  const stepIdx = ONBOARDING_ORDER.indexOf(stepKey);
  if (stepIdx < profileIdx) return 'done';
  if (stepIdx === profileIdx) return 'current';
  return 'pending';
}

const ElectronicInvoicingIntegration = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showFaq, setShowFaq] = useState(null);

  const [profileForm, setProfileForm] = useState({
    cuit: '',
    businessName: '',
    ivaCondition: 'Responsable Inscripto',
    grossIncomeCondition: '',
    pointOfSale: '',
    environment: 'homologacion',
  });

  const [certForm, setCertForm] = useState({
    certificatePem: '',
    privateKeyPem: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/electronic-invoicing/fiscal/profile`, authHeaders());
      setProfile(res.data.profile);
      setFeatureEnabled(true);
    } catch (err) {
      if (err.response?.status === 403) {
        // Feature no habilitado para este plan
        setFeatureEnabled(false);
      } else if (err.response?.status === 404) {
        // Feature habilitado pero sin perfil aún
        setFeatureEnabled(true);
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (profile) {
        const res = await axios.patch(
          `${API_URL}/electronic-invoicing/fiscal/profile`,
          { ...profileForm, pointOfSale: Number(profileForm.pointOfSale) },
          authHeaders()
        );
        setProfile(res.data.profile);
        toast.success('Perfil fiscal actualizado');
      } else {
        const res = await axios.post(
          `${API_URL}/electronic-invoicing/fiscal/profile`,
          { ...profileForm, pointOfSale: Number(profileForm.pointOfSale) },
          authHeaders()
        );
        setProfile(res.data.profile);
        toast.success('Perfil fiscal creado correctamente');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar perfil fiscal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.post(
        `${API_URL}/electronic-invoicing/fiscal/profile/certificate`,
        certForm,
        authHeaders()
      );
      setProfile(res.data.profile);
      toast.success('Certificado cargado correctamente');
      setShowCertForm(false);
      setCertForm({ certificatePem: '', privateKeyPem: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cargar el certificado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await axios.post(
        `${API_URL}/electronic-invoicing/fiscal/profile/test-connection`,
        {},
        authHeaders()
      );
      if (res.data.success) {
        toast.success('Conexión con AFIP/ARCA exitosa. Tu perfil está listo para facturar.');
        setProfile(res.data.profile);
      } else {
        toast.error(`Error de conexión: ${res.data.message}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al probar la conexión con AFIP');
    } finally {
      setIsTesting(false);
    }
  };

  const openEditForm = () => {
    if (profile) {
      setProfileForm({
        cuit: profile.cuit || '',
        businessName: profile.businessName || '',
        ivaCondition: profile.ivaCondition || 'Responsable Inscripto',
        grossIncomeCondition: profile.grossIncomeCondition || '',
        pointOfSale: String(profile.pointOfSale || ''),
        environment: profile.environment || 'homologacion',
      });
    }
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <IoSyncOutline className="w-8 h-8 text-blue-500 animate-spin mr-3" />
          <span className="text-gray-600">Verificando estado de facturación electrónica...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Card principal ── */}
      <div className="bg-white rounded-lg shadow-lg p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <IoDocumentTextOutline className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
              <p className="text-gray-600 mt-1">
                Emití facturas electrónicas con AFIP/ARCA directamente desde el sistema
              </p>
            </div>
          </div>
          {profile?.isReadyToInvoice && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
              <IoCheckmarkCircleOutline className="w-4 h-4" />
              Activo
            </span>
          )}
        </div>

        {/* Feature no habilitado */}
        {!featureEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-3">
            <IoWarningOutline className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Funcionalidad no disponible en tu plan actual</p>
              <p className="text-sm text-yellow-700 mt-1">
                La facturación electrónica requiere que el feature <code className="bg-yellow-100 px-1 rounded">electronic_invoicing</code> esté habilitado.
                Contactá a soporte para activarlo en tu cuenta.
              </p>
            </div>
          </div>
        )}

        {/* Estado actual del onboarding */}
        {featureEnabled && (
          <>
            {/* Barra de estado */}
            <div className={`rounded-lg p-6 mb-6 ${
              profile?.isReadyToInvoice
                ? 'bg-green-50 border border-green-200'
                : profile
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  {profile?.isReadyToInvoice ? (
                    <IoCheckmarkCircleOutline className="w-6 h-6 text-green-600 mt-0.5" />
                  ) : profile ? (
                    <IoSyncOutline className="w-6 h-6 text-blue-500 mt-0.5" />
                  ) : (
                    <IoCloseCircleOutline className="w-6 h-6 text-gray-400 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile?.isReadyToInvoice
                        ? 'Perfil fiscal configurado y verificado'
                        : profile
                          ? 'Configuración en progreso'
                          : 'Sin perfil fiscal configurado'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {profile?.isReadyToInvoice
                        ? `CUIT: ${profile.cuit} · Ambiente: ${profile.environment === 'produccion' ? 'Producción' : 'Homologación'} · PV: ${profile.pointOfSale}`
                        : profile
                          ? `Estado actual: ${profile.onboardingStatus}`
                          : 'Completá los pasos a continuación para habilitar la facturación electrónica'}
                    </p>
                    {profile?.certificateExpiresAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Certificado vence: {new Date(profile.certificateExpiresAt).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {profile && (
                    <button
                      type="button"
                      onClick={openEditForm}
                      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      Editar perfil
                    </button>
                  )}
                  {!profile && (
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Comenzar configuración
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Pasos del onboarding */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Pasos de configuración
              </h3>
              <div className="space-y-3">
                {ONBOARDING_STEPS.map((step, idx) => {
                  const status = getStepStatus(profile?.onboardingStatus, step.key);
                  return (
                    <div
                      key={step.key}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        status === 'done'
                          ? 'bg-green-50 border-green-200'
                          : status === 'current'
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {/* Número / check */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        status === 'done'
                          ? 'bg-green-500 text-white'
                          : status === 'current'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {status === 'done' ? '✓' : idx + 1}
                      </div>
                      {/* Descripción */}
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          status === 'done' ? 'text-green-800' : status === 'current' ? 'text-blue-800' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                      </div>
                      {/* Acción inline */}
                      {status === 'current' && step.key === 'draft' && (
                        <button
                          type="button"
                          onClick={() => setShowForm(true)}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Completar
                        </button>
                      )}
                      {status === 'current' && step.key === 'certificate_uploaded' && (
                        <button
                          type="button"
                          onClick={() => setShowCertForm(true)}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Cargar certificado
                        </button>
                      )}
                      {profile?.onboardingStatus === 'certificate_uploaded' && step.key === 'wsaa_verified' && (
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={isTesting}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-60 flex items-center gap-1"
                        >
                          {isTesting ? <IoSyncOutline className="animate-spin w-3 h-3" /> : null}
                          Probar conexión
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Acciones extra si el perfil ya tiene cert */}
            {profile?.onboardingStatus && profile.onboardingStatus !== 'draft' && (
              <div className="flex gap-3 flex-wrap">
                {profile.onboardingStatus !== 'ready' && (
                  <button
                    type="button"
                    onClick={() => setShowCertForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <IoCloudUploadOutline className="w-4 h-4" />
                    Actualizar certificado
                  </button>
                )}
                {profile.onboardingStatus === 'certificate_uploaded' && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {isTesting
                      ? <IoSyncOutline className="animate-spin w-4 h-4" />
                      : <IoRefreshOutline className="w-4 h-4" />}
                    Probar conexión WSAA
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Formulario: Datos fiscales ── */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <IoDocumentTextOutline className="w-5 h-5 text-blue-600" />
            {profile ? 'Editar datos fiscales' : 'Paso 1 — Datos fiscales del tenant'}
          </h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="XX-XXXXXXXX-X"
                  value={profileForm.cuit}
                  onChange={e => setProfileForm(p => ({ ...p, cuit: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Formato: 20-12345678-9</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Inmobiliaria Ejemplo S.A."
                  value={profileForm.businessName}
                  onChange={e => setProfileForm(p => ({ ...p, businessName: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condición IVA <span className="text-red-500">*</span>
                </label>
                <select
                  value={profileForm.ivaCondition}
                  onChange={e => setProfileForm(p => ({ ...p, ivaCondition: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option>Responsable Inscripto</option>
                  <option>Monotributo</option>
                  <option>Exento</option>
                  <option>No Responsable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingresos Brutos
                </label>
                <input
                  type="text"
                  placeholder="Número o condición"
                  value={profileForm.grossIncomeCondition}
                  onChange={e => setProfileForm(p => ({ ...p, grossIncomeCondition: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto de Venta <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="99999"
                  placeholder="1"
                  value={profileForm.pointOfSale}
                  onChange={e => setProfileForm(p => ({ ...p, pointOfSale: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Debe estar habilitado en AFIP para servicios web</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ambiente <span className="text-red-500">*</span>
                </label>
                <select
                  value={profileForm.environment}
                  onChange={e => setProfileForm(p => ({ ...p, environment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="homologacion">Homologación (pruebas)</option>
                  <option value="produccion">Producción</option>
                </select>
                <p className="text-xs text-orange-500 mt-1">
                  {profileForm.environment === 'produccion'
                    ? '⚠️ Las facturas emitidas serán oficiales ante AFIP'
                    : 'Recomendado para comenzar. Las facturas no tienen validez fiscal.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving && <IoSyncOutline className="animate-spin w-4 h-4" />}
                {profile ? 'Guardar cambios' : 'Guardar y continuar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Formulario: Certificado ── */}
      {showCertForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <IoLockClosedOutline className="w-5 h-5 text-blue-600" />
            Paso 2 — Certificado digital y clave privada
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Los datos se cifran con AES-256-GCM antes de guardarse. Nunca se exponen en las respuestas de la API.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-sm font-medium text-blue-800 mb-2">¿Cómo obtener el certificado?</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal ml-4">
              <li>Ingresá al servicio WSASS de AFIP con tu CUIT y clave fiscal</li>
              <li>Creá una solicitud de certificado (CSR) con tu alias de negocio</li>
              <li>Descargá el certificado emitido en formato PEM (.crt o .pem)</li>
              <li>Para <strong>homologación</strong>: usá el portal WSASS-homo en afip.gob.ar</li>
            </ol>
          </div>

          <form onSubmit={handleUploadCertificate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certificado PEM <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDxTCCAq2gAwIBAgIJ...&#10;-----END CERTIFICATE-----"
                value={certForm.certificatePem}
                onChange={e => setCertForm(c => ({ ...c, certificatePem: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clave privada PEM <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvgIBADANBgkqhkiG9w0B...&#10;-----END PRIVATE KEY-----"
                value={certForm.privateKeyPem}
                onChange={e => setCertForm(c => ({ ...c, privateKeyPem: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              />
              <div className="flex items-start gap-1.5 mt-1.5">
                <IoShieldCheckmarkOutline className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  La clave se cifra inmediatamente y no es recuperable desde la API.
                  Guardá una copia segura de forma externa.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCertForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving && <IoSyncOutline className="animate-spin w-4 h-4" />}
                Cifrar y guardar certificado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Preguntas frecuentes ── */}
      {featureEnabled && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <IoHelpCircleOutline className="w-4 h-4" />
            Preguntas frecuentes
          </h3>
          <div className="space-y-2">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowFaq(showFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {showFaq === idx
                    ? <IoChevronUpOutline className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <IoChevronDownOutline className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {showFaq === idx && (
                  <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3 bg-gray-50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQS = [
  {
    q: '¿Qué es AFIP/ARCA y qué es WSAA?',
    a: 'ARCA (ex-AFIP) es el organismo recaudador de Argentina. WSAA es su servicio de autenticación para web services — genera un "token" temporal (12 hs) que se usa para emitir facturas electrónicas via el servicio wsfev1.',
  },
  {
    q: '¿Cuál es la diferencia entre homologación y producción?',
    a: 'El ambiente de homologación (homos.afip.gob.ar) es para pruebas: las facturas emitidas no tienen validez fiscal y usás un CUIT de test. Producción emite comprobantes reales registrados ante AFIP. Se recomienda always empezar en homologación.',
  },
  {
    q: '¿Qué tipos de comprobante puedo emitir?',
    a: 'Depende de tu condición IVA: Responsable Inscripto → Factura A y B. Monotributo → Factura C. También podés emitir Notas de Crédito A, B y C para reversar facturas.',
  },
  {
    q: '¿Qué es el punto de venta y cómo lo creo?',
    a: 'El punto de venta (PV) es un número de 1 a 99999 que identifica el origen del comprobante. Debe estar dado de alta en AFIP como "WebServices" (no como caja o factura manual). Se crea desde afip.gob.ar → Mis Aplicaciones Web → ABM Puntos de Ventas.',
  },
  {
    q: '¿Cómo obtengo el certificado digital?',
    a: 'Ingresá a afip.gob.ar con tu CUIT y clave fiscal → buscá el servicio "WSASS" → creá una solicitud indicando tu alias → descargá el .crt emitido. Para homologación usá homo.afip.gob.ar.',
  },
  {
    q: '¿La clave privada queda guardada en el servidor?',
    a: 'Sí, pero cifrada con AES-256-GCM (el mismo mecanismo de tokens de MercadoLibre). Nunca se devuelve por la API ni aparece en los logs. Igual recomendamos guardar una copia offline en un lugar seguro.',
  },
  {
    q: '¿Cada inmobiliaria factura con su propio CUIT?',
    a: 'Sí. El sistema es totalmente multi-tenant: cada inmobiliaria tiene su propio perfil fiscal aislado. No existe ninguna posibilidad de mezclar datos fiscales entre cuentas.',
  },
];

export default ElectronicInvoicingIntegration;
