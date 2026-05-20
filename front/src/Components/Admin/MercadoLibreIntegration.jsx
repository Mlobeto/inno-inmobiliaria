import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  IoHomeOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoArrowForwardOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MercadoLibreIntegration = () => {
  const [searchParams] = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnectionStatus(response.data);
      setGuideOpen(!response.data?.connected);
    } catch (error) {
      console.error('Error al verificar estado de MercadoLibre:', error);
      if (error.response?.status === 403) {
        setConnectionStatus({
          connected: false,
          featureBlocked: true,
          error: error.response?.data?.error,
        });
      } else {
        setConnectionStatus({ connected: false });
      }
      setGuideOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnectionStatus();
    if (searchParams.get('tab') === 'integrations') {
      setTimeout(() => checkConnectionStatus(), 500);
    }
  }, [searchParams, checkConnectionStatus]);

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
      const msg = error.response?.data?.error || 'Error al conectar con Mercado Libre';
      toast.error(msg);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        '¿Desconectar Mercado Libre? Los avisos en ML seguirán activos, pero no podrás publicar ni gestionarlos desde GestProp hasta volver a conectar.'
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
      toast.success('Cuenta desconectada');
      setConnectionStatus({ connected: false });
      setGuideOpen(true);
    } catch {
      toast.error('Error al desconectar');
    }
  };

  if (isLoading) {
    return <MlLoadingScreen />;
  }

  const featureBlocked = connectionStatus?.featureBlocked;
  const connected = connectionStatus?.connected;
  const listingsCount = connectionStatus?.listingsCount ?? 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
      <header className="flex items-start gap-4">
        <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center shrink-0">
          <IoLogoBuffer className="w-9 h-9 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mercado Libre Inmuebles</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Vinculá tu cuenta, publicá desde Propiedades y respondé consultas en el CRM.
          </p>
        </div>
      </header>

      {featureBlocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium">Tu plan no incluye integración con Mercado Libre.</p>
          <p className="mt-1 text-amber-800">
            {connectionStatus?.error || 'Actualizá el plan para habilitar esta función.'}
          </p>
        </div>
      )}

      {!featureBlocked && connected && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              to="/listadoDePropiedades"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <IoHomeOutline className="w-6 h-6 text-yellow-700" />
                <div>
                  <p className="font-semibold text-gray-900">Publicar propiedades</p>
                  <p className="text-xs text-gray-600">
                    {listingsCount > 0
                      ? `${listingsCount} aviso${listingsCount === 1 ? '' : 's'} en ML`
                      : 'Usá «Publicar en ML» en cada propiedad'}
                  </p>
                </div>
              </div>
              <IoArrowForwardOutline className="w-5 h-5 text-yellow-700 shrink-0" />
            </Link>
            <Link
              to="/panelLeads"
              className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <IoChatbubbleOutline className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Consultas de ML</p>
                  <p className="text-xs text-gray-600">Respondé desde CRM → Leads</p>
                </div>
              </div>
              <IoArrowForwardOutline className="w-5 h-5 text-gray-500 shrink-0" />
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Al editar una propiedad publicada, los cambios se envían a Mercado Libre automáticamente.
          </p>
        </>
      )}

      {!featureBlocked && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setGuideOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
          >
            <span className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <IoInformationCircleOutline className="w-5 h-5 text-blue-500" />
              {connected ? '¿Cómo funciona?' : 'Primeros pasos'}
            </span>
            {guideOpen ? (
              <IoChevronUpOutline className="w-5 h-5 text-gray-500" />
            ) : (
              <IoChevronDownOutline className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {guideOpen && (
            <div className="px-4 py-4 border-t border-gray-200 text-sm text-gray-700 space-y-3">
              {connected ? (
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    Andá a <strong>Propiedades</strong> y usá <strong>Publicar en ML</strong> (necesitás fotos,
                    precio y dirección).
                  </li>
                  <li>
                    Las consultas llegan a <strong>CRM → Leads</strong>; respondelas desde ahí.
                  </li>
                  <li>
                    Necesitás avisos disponibles en tu cuenta de Mercado Libre (paquetes Clásico o Destacado).
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    Tené una cuenta de <strong>vendedor</strong> en Mercado Libre Argentina.
                  </li>
                  <li>
                    Pulsá <strong>Conectar cuenta</strong> y autorizá con el usuario de tu inmobiliaria.
                  </li>
                  <li>
                    Publicá desde <strong>Propiedades</strong> con el botón <strong>Publicar en ML</strong>.
                  </li>
                </ol>
              )}
              <div className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <IoWarningOutline className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs">
                  Los avisos en ML pueden tener costo según el tipo de publicación. Si Mercado Libre rechaza un
                  cambio, puede ser necesario pausar y volver a publicar desde Propiedades.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`rounded-lg p-5 ${
          connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            {connected ? (
              <IoCheckmarkCircleOutline className="w-6 h-6 text-green-600 mt-0.5" />
            ) : (
              <IoCloseCircleOutline className="w-6 h-6 text-gray-400 mt-0.5" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {connected ? 'Cuenta conectada' : 'Sin conectar'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {connected
                  ? 'Podés publicar y gestionar avisos desde Propiedades.'
                  : 'Conectá la cuenta de Mercado Libre de tu inmobiliaria para empezar.'}
              </p>
            </div>
          </div>
          {!featureBlocked && (
            <div>
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-semibold flex items-center gap-2 ${
                    isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isConnecting ? (
                    <>
                      <IoSyncOutline className="w-5 h-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <IoLinkOutline className="w-5 h-5" />
                      Conectar cuenta
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function MlLoadingScreen() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-center py-12">
        <IoSyncOutline className="w-8 h-8 text-blue-500 animate-spin mr-3" />
        <span className="text-gray-600">Verificando conexión...</span>
      </div>
    </div>
  );
}

export default MercadoLibreIntegration;
