import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoLogoBuffer,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoSyncOutline,
  IoLinkOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoChatbubbleOutline,
  IoSendOutline,
  IoRefreshOutline,
  IoHomeOutline,
  IoCopyOutline,
  IoPauseOutline,
  IoPlayOutline,
  IoTrashOutline,
  IoOpenOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoListOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Si el API aún no tiene BACKEND_URL en prod, mostrar la URL del front (VITE_API_URL). */
function resolveWebhookDisplayUrl(url) {
  if (!url) return url;
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/i, '');
  if (url.includes('localhost') && apiBase && !/localhost|127\.0\.0\.1/i.test(apiBase)) {
    return `${apiBase}/api/webhooks/mercadolibre`;
  }
  return url;
}

const ML_STATUS_LABELS = {
  active: 'Activa',
  paused: 'Pausada',
  closed: 'Cerrada',
  under_review: 'En revisión',
  inactive: 'Inactiva',
};

function formatCurrency(value) {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const MercadoLibreIntegration = () => {
  const [searchParams] = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [sendingId, setSendingId] = useState(null);

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingActionId, setListingActionId] = useState(null);

  const integration = connectionStatus?.integration;
  const webhookDisplayUrl = resolveWebhookDisplayUrl(integration?.webhookUrl);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnectionStatus(response.data);
      if (response.data?.connected) {
        fetchQuestions();
        fetchListings();
      } else {
        setQuestions([]);
        setListings([]);
      }
    } catch (error) {
      console.error('Error al verificar estado de MercadoLibre:', error);
      if (error.response?.status === 403) {
        setConnectionStatus({
          connected: false,
          featureBlocked: true,
          error: error.response?.data?.error,
        });
      } else if (error.response?.status === 404 || error.response?.data?.connected === false) {
        setConnectionStatus({ connected: false });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
    const tab = searchParams.get('tab');
    if (tab === 'integrations') {
      setTimeout(() => checkConnectionStatus(), 500);
    }
  }, [searchParams, checkConnectionStatus]);

  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      toast.error('No se pudieron cargar las consultas');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchListings = async () => {
    setListingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(response.data.listings || []);
    } catch (error) {
      console.error('Error al obtener publicaciones ML:', error);
      toast.error('No se pudieron cargar las publicaciones');
    } finally {
      setListingsLoading(false);
    }
  };

  const handleSendReply = async (questionId) => {
    const text = replyTexts[questionId]?.trim();
    if (!text) return;
    setSendingId(questionId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/mercadolibre/questions/${questionId}/answer`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Respuesta enviada');
      setReplyingId(null);
      setReplyTexts((prev) => ({ ...prev, [questionId]: '' }));
      setQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar la respuesta');
    } finally {
      setSendingId(null);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/auth/start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error al iniciar conexión:', error);
      const msg = error.response?.data?.error || 'Error al conectar con MercadoLibre';
      toast.error(msg);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        '¿Desconectar Mercado Libre? Las publicaciones en ML seguirán activas, pero no podrás gestionarlas desde GestProp hasta volver a conectar.'
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/mercadolibre/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cuenta de MercadoLibre desconectada');
      setConnectionStatus({ connected: false, integration });
      setQuestions([]);
      setListings([]);
    } catch {
      toast.error('Error al desconectar cuenta');
    }
  };

  const handleListingStatus = async (propertyId, status) => {
    const label = status === 'paused' ? 'pausar' : 'reactivar';
    if (!window.confirm(`¿${label} esta publicación en Mercado Libre?`)) return;

    setListingActionId(propertyId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/mercadolibre/listings/${propertyId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(status === 'paused' ? 'Publicación pausada' : 'Publicación reactivada');
      await fetchListings();
    } catch (error) {
      toast.error(error.response?.data?.message || `Error al ${label}`);
    } finally {
      setListingActionId(null);
    }
  };

  const handleListingSync = async (propertyId) => {
    setListingActionId(propertyId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/mercadolibre/listings/${propertyId}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data?.message || 'Sincronizado con Mercado Libre');
      await fetchListings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al sincronizar');
    } finally {
      setListingActionId(null);
    }
  };

  const handleListingDelete = async (propertyId) => {
    if (
      !window.confirm(
        '¿Eliminar la publicación en Mercado Libre? El aviso se cerrará en ML y dejará de mostrarse en GestProp.'
      )
    ) {
      return;
    }
    setListingActionId(propertyId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/mercadolibre/listings/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Publicación eliminada de Mercado Libre');
      await fetchListings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    } finally {
      setListingActionId(null);
    }
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center py-12">
          <IoSyncOutline className="w-8 h-8 text-blue-500 animate-spin mr-3" />
          <span className="text-gray-600">Verificando conexión...</span>
        </div>
      </div>
    );
  }

  const featureBlocked = connectionStatus?.featureBlocked;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center">
            <IoLogoBuffer className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mercado Libre Inmuebles</h2>
            <p className="text-gray-600 mt-1">
              Publicá propiedades, respondé consultas y sincronizá leads con tu CRM
            </p>
          </div>
        </div>
      </div>

      {featureBlocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <p className="text-amber-900 text-sm font-medium">
            Tu plan actual no incluye integración con Mercado Libre.
          </p>
          <p className="text-amber-800 text-sm mt-1">
            {connectionStatus?.error || 'Actualizá el plan para habilitar esta función.'}
          </p>
        </div>
      )}

      {/* Guía de integración */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <IoInformationCircleOutline className="w-5 h-5 text-blue-500" />
            Guía de integración paso a paso
          </span>
          {guideOpen ? (
            <IoChevronUpOutline className="w-5 h-5 text-gray-500" />
          ) : (
            <IoChevronDownOutline className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {guideOpen && (
          <div className="px-5 py-4 space-y-5 text-sm text-gray-700 border-t border-gray-200">
            <ol className="list-decimal list-inside space-y-3">
              <li>
                <strong>Requisitos:</strong> cuenta de vendedor en Mercado Libre{' '}
                <strong>Argentina</strong>, plan GestProp con integración ML, y datos de la inmobiliaria
                completos en &quot;Datos generales&quot;.
              </li>
              <li>
                <strong>Conectar cuenta:</strong> pulsá &quot;Conectar cuenta&quot;. Autorizá el acceso en
                Mercado Libre con el usuario de la inmobiliaria (no uses la misma cuenta que desarrolla la
                app en developers).
              </li>
              <li>
                <strong>Publicar:</strong> andá a <strong>Propiedades</strong>, elegí un inmueble con fotos,
                precio y dirección, y usá <strong>&quot;Publicar en ML&quot;</strong>.
              </li>
              <li>
                <strong>Actualizar aviso:</strong> al guardar cambios en una propiedad, GestProp sincroniza el
                aviso en ML automáticamente. También podés usar <strong>&quot;Sync ML&quot;</strong> en el listado
                o <strong>&quot;Sincronizar&quot;</strong> en la tabla de abajo.
              </li>
              <li>
                <strong>Consultas:</strong> las preguntas sin responder aparecen aquí y en{' '}
                <strong>CRM → Leads</strong> (sin duplicar).
              </li>
              <li>
                <strong>Webhooks (una sola URL para toda la app):</strong> en{' '}
                <a
                  href="https://developers.mercadolibre.com.ar/es_ar/notificaciones"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-700 underline"
                >
                  developers.mercadolibre.com.ar
                </a>
                , en <strong>tu aplicación</strong> (no por tenant), pegá la URL de producción:
              </li>
            </ol>

            {webhookDisplayUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-blue-900 text-xs uppercase tracking-wide">
                  URL de notificaciones (webhook)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border border-blue-200 break-all flex-1">
                    {webhookDisplayUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookDisplayUrl, 'URL')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <IoCopyOutline className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-blue-800">
                  Temas sugeridos: <strong>questions</strong>, <strong>items</strong>. Mercado Libre envía el{' '}
                  <strong>user_id</strong> del vendedor; GestProp asocia cada aviso a la inmobiliaria que conectó
                  esa cuenta. No hace falta una URL distinta por tenant.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  En producción debe ser{' '}
                  <code className="bg-white px-1 rounded">
                    https://inno-prod-api.../api/webhooks/mercadolibre
                  </code>
                  , no localhost.
                </p>
              </div>
            )}

            {integration?.redirectUri && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Redirect OAuth (solo referencia técnica):</span>{' '}
                <code className="bg-gray-100 px-1 rounded break-all">{integration.redirectUri}</code>
              </div>
            )}

            <div className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <IoWarningOutline className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Los avisos en ML pueden tener costo según el tipo de publicación (Clásico / Destacado).
                Algunos cambios (por ejemplo categoría o tipo de operación) pueden requerir pausar y volver a
                publicar si Mercado Libre lo rechaza.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Estado de conexión */}
      <div
        className={`rounded-lg p-6 ${
          connectionStatus?.connected
            ? 'bg-green-50 border border-green-200'
            : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start space-x-3">
            {connectionStatus?.connected ? (
              <IoCheckmarkCircleOutline className="w-6 h-6 text-green-600 mt-1" />
            ) : (
              <IoCloseCircleOutline className="w-6 h-6 text-gray-400 mt-1" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {connectionStatus?.connected ? 'Conectado' : 'No conectado'}
              </h3>
              {connectionStatus?.connected ? (
                <>
                  <p className="text-sm text-gray-700 mb-2">
                    Cuenta vinculada correctamente. Podés publicar y gestionar avisos.
                  </p>
                  {connectionStatus.mlUserId && (
                    <p className="text-xs text-gray-600">
                      Usuario ML:{' '}
                      <span className="font-mono bg-white px-2 py-1 rounded">
                        {connectionStatus.mlUserId}
                      </span>
                    </p>
                  )}
                  {connectionStatus.lastSync && (
                    <p className="text-xs text-gray-600 mt-1">
                      Última sync: {new Date(connectionStatus.lastSync).toLocaleString('es-AR')}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Conectá la cuenta de Mercado Libre de tu inmobiliaria para empezar.
                </p>
              )}
            </div>
          </div>

          {!featureBlocked && (
            <div>
              {connectionStatus?.connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition-colors font-semibold flex items-center space-x-2 ${
                    isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isConnecting ? (
                    <>
                      <IoSyncOutline className="w-5 h-5 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <IoLinkOutline className="w-5 h-5" />
                      <span>Conectar cuenta</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Publicaciones en ML */}
      {connectionStatus?.connected && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <IoListOutline className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-gray-900">Publicaciones en Mercado Libre</h3>
              {!listingsLoading && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {listings.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchListings}
              disabled={listingsLoading}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <IoRefreshOutline className={`w-4 h-4 ${listingsLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {listingsLoading ? (
            <div className="flex justify-center py-8 text-gray-500">
              <IoSyncOutline className="w-5 h-5 animate-spin mr-2" />
              Cargando publicaciones...
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <IoHomeOutline className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Sin publicaciones aún</p>
              <p className="text-gray-400 text-sm mt-1">
                Publicá desde el listado de Propiedades con el botón &quot;Publicar en ML&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Propiedad</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Precio ML</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((row) => {
                    const prop = row.Property;
                    const status = row.mlStatus || 'unknown';
                    const isActive = status === 'active';
                    const isPaused = status === 'paused';
                    const busy = listingActionId === row.propertyId;

                    return (
                      <tr key={row.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {row.mlTitle || prop?.address || `Propiedad #${row.propertyId}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[220px]">
                            {prop?.address}
                          </p>
                          {row.syncErrors && (
                            <p className="text-xs text-red-600 mt-1 truncate max-w-[220px]" title={row.syncErrors}>
                              Último error: {row.syncErrors}
                            </p>
                          )}
                          {row.lastSync && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Sync: {new Date(row.lastSync).toLocaleString('es-AR')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : isPaused
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {ML_STATUS_LABELS[status] || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          {formatCurrency(row.mlPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleListingSync(row.propertyId)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                              title="Sincronizar con GestProp"
                            >
                              <IoRefreshOutline className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                            </button>
                            {row.mlPermalink && (
                              <a
                                href={row.mlPermalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50"
                                title="Ver en ML"
                              >
                                <IoOpenOutline className="w-4 h-4" />
                              </a>
                            )}
                            {isActive && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleListingStatus(row.propertyId, 'paused')}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                                title="Pausar"
                              >
                                <IoPauseOutline className="w-4 h-4" />
                              </button>
                            )}
                            {isPaused && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleListingStatus(row.propertyId, 'active')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                                title="Reactivar"
                              >
                                <IoPlayOutline className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleListingDelete(row.propertyId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Eliminar en ML"
                            >
                              <IoTrashOutline className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Consultas */}
      {connectionStatus?.connected && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <IoChatbubbleOutline className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-gray-900">Consultas sin responder</h3>
              {!questionsLoading && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    questions.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {questions.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchQuestions}
              disabled={questionsLoading}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <IoRefreshOutline className={`w-4 h-4 ${questionsLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-3 max-w-2xl">
            También se registran en <strong>CRM → Leads</strong>. Con el webhook configurado, las nuevas
            preguntas aparecen sin recargar manualmente.
          </p>

          {questionsLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <IoSyncOutline className="w-5 h-5 animate-spin mr-2" />
              Cargando consultas...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <IoChatbubbleOutline className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Sin consultas pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.questionId}
                  className="border border-gray-200 rounded-xl p-4 hover:border-yellow-300"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <IoHomeOutline className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">
                      {q.propertyType && <span className="capitalize">{q.propertyType} — </span>}
                      {q.propertyAddress}
                    </span>
                    {q.mlPermalink && (
                      <a
                        href={q.mlPermalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-yellow-600 hover:underline"
                      >
                        Ver en ML
                      </a>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-gray-800 text-sm">{q.text}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(q.dateCreated).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {replyingId === q.questionId ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyTexts[q.questionId] || ''}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                        }
                        rows={3}
                        placeholder="Escribí tu respuesta..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400/50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingId(null)}
                          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendReply(q.questionId)}
                          disabled={!replyTexts[q.questionId]?.trim() || sendingId === q.questionId}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-yellow-400 text-white rounded-lg disabled:opacity-50"
                        >
                          {sendingId === q.questionId ? (
                            <IoSyncOutline className="w-4 h-4 animate-spin" />
                          ) : (
                            <IoSendOutline className="w-4 h-4" />
                          )}
                          Enviar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyingId(q.questionId)}
                      className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg"
                    >
                      Responder
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MercadoLibreIntegration;
