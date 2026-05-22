import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoLogoBuffer,
  IoCheckmarkCircleOutline,
  IoSyncOutline,
  IoLinkOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoChatbubbleOutline,
  IoHomeOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoArrowForwardOutline,
  IoPersonOutline,
  IoCartOutline,
  IoOpenOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function TenantMlGuide({ connected }) {
  if (connected) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">
          Tu cuenta ya está vinculada. Seguí estos pasos para publicar y atender consultas:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>
            Andá a <strong>Propiedades</strong> y usá <strong>Publicar en ML</strong> en cada inmueble (fotos, precio
            y dirección obligatorios).
          </li>
          <li>
            Si Mercado Libre te pide avisos disponibles, contratá un <strong>paquete de publicación</strong> en tu
            cuenta ML (Clásico o Destacado).
          </li>
          <li>
            Las consultas de interesados llegan a <strong>CRM → Leads</strong>; respondelas desde ahí.
          </li>
          <li>
            Al editar una propiedad ya publicada, los cambios se sincronizan solos con Mercado Libre.
          </li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-gray-700">
        Cada inmobiliaria usa <strong>su propia cuenta</strong> de Mercado Libre. GestProp no crea esa cuenta por vos:
        tenés que tenerla (o crearla) antes de conectar.
      </p>

      <section className="rounded-lg border border-yellow-200 bg-yellow-50/60 p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-white text-xs font-bold">
            1
          </span>
          En Mercado Libre (tu inmobiliaria)
        </h4>
        <ul className="space-y-2 text-sm text-gray-700 ml-8 list-disc">
          <li>
            Creá o usá una cuenta en{' '}
            <a
              href="https://www.mercadolibre.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-800 underline inline-flex items-center gap-1"
            >
              mercadolibre.com.ar
              <IoOpenOutline className="w-3.5 h-3.5" />
            </a>{' '}
            (Argentina).
          </li>
          <li>
            Completá el perfil como <strong>vendedor</strong>: teléfono verificado y datos de la inmobiliaria. No
            alcanza una cuenta que solo compra.
          </li>
          <li>
            Cuando quieras publicar, contratá <strong>paquetes de avisos de inmuebles</strong> en ML (como si
            publicaras a mano). Sin avisos disponibles, la publicación desde GestProp puede fallar.
          </li>
          <li>
            Opcional: publicá un inmueble de prueba directo en ML para confirmar que tu cuenta puede vender
            inmuebles.
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
            2
          </span>
          En GestProp
        </h4>
        <ul className="space-y-2 text-sm text-gray-700 ml-8 list-disc">
          <li>
            Pulsá <strong>Conectar cuenta</strong> abajo e iniciá sesión con el <strong>usuario de tu inmobiliaria</strong>{' '}
            en Mercado Libre (el que publica los avisos).
          </li>
          <li>
            Andá a <strong>Propiedades</strong> y usá <strong>Publicar en ML</strong> en cada propiedad.
          </li>
          <li>
            Respondé consultas en <strong>CRM → Leads</strong>.
          </li>
        </ul>
      </section>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-3">
          <IoPersonOutline className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Cuenta correcta</p>
            <p className="text-gray-600 mt-0.5">Usuario vendedor de la inmobiliaria en ML Argentina.</p>
          </div>
        </div>
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-3">
          <IoCartOutline className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Paquetes en ML</p>
            <p className="text-gray-600 mt-0.5">Los contratás en Mercado Libre; GestProp no incluye avisos gratis.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="font-medium text-gray-800 mb-1">¿Problemas al conectar?</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Usá la cuenta de la inmobiliaria, no una cuenta personal sin permiso de vendedor.</li>
          <li>Si ves un error en Mercado Libre al autorizar, contactá a soporte de GestProp.</li>
          <li>No hace falta crear aplicaciones en developers: eso lo gestiona GestProp.</li>
        </ul>
      </div>
    </div>
  );
}

TenantMlGuide.propTypes = {
  connected: PropTypes.bool,
};

const MercadoLibreIntegration = ({ direct = false }) => {
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
    const tab = searchParams.get('tab');
    if (tab === 'mercadolibre' || tab === 'integrations') {
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
    return <MlLoadingScreen direct={direct} />;
  }

  const featureBlocked = connectionStatus?.featureBlocked;
  const connected = connectionStatus?.connected;
  const listingsCount = connectionStatus?.listingsCount ?? 0;
  const shellClass = direct
    ? 'space-y-6'
    : 'bg-white rounded-lg shadow-lg p-8 space-y-6';

  return (
    <div className={shellClass}>
      {!direct && (
        <header className="flex items-start gap-4">
          <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center shrink-0">
            <IoLogoBuffer className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mercado Libre Inmuebles</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Vinculá la cuenta de vendedor de tu inmobiliaria, publicá inmuebles y recibí consultas en el CRM.
            </p>
          </div>
        </header>
      )}

      {featureBlocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium">Tu plan no incluye integración con Mercado Libre.</p>
          <p className="mt-1 text-amber-800">
            {connectionStatus?.error || 'Actualizá el plan para habilitar esta función.'}
          </p>
        </div>
      )}

      {/* Estado y acción principal — lo primero que ve el usuario */}
      {!featureBlocked && (
        <div
          className={`rounded-xl p-6 ${
            connected
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
              : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className={`rounded-full p-3 shrink-0 ${
                  connected ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                {connected ? (
                  <IoCheckmarkCircleOutline className="w-8 h-8 text-green-600" />
                ) : (
                  <IoLinkOutline className="w-8 h-8 text-yellow-700" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {connected ? 'Cuenta conectada' : 'Conectá tu cuenta de Mercado Libre'}
                </h3>
                <p className="text-sm text-gray-700 mt-1 max-w-xl">
                  {connected
                    ? 'Ya podés publicar inmuebles desde Propiedades y responder consultas en CRM → Leads.'
                    : 'Usá el usuario vendedor de tu inmobiliaria en mercadolibre.com.ar. Necesitás paquetes de avisos en ML para publicar.'}
                </p>
                {connected && listingsCount > 0 && (
                  <p className="text-sm font-medium text-green-800 mt-2">
                    {listingsCount} aviso{listingsCount === 1 ? '' : 's'} activo{listingsCount === 1 ? '' : 's'} en Mercado Libre
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {connected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2 text-sm text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg font-medium"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`w-full sm:w-auto px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md ${
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
          </div>
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

      {!featureBlocked && !connected && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-bold">
              1
            </span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">Cuenta ML</p>
            <p className="text-xs text-gray-600 mt-1">Usuario vendedor en mercadolibre.com.ar</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-bold">
              2
            </span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">Conectar acá</p>
            <p className="text-xs text-gray-600 mt-1">Pulsá «Conectar cuenta» e iniciá sesión en ML</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-bold">
              3
            </span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">Publicar</p>
            <p className="text-xs text-gray-600 mt-1">Desde Propiedades → Publicar en ML</p>
          </div>
        </div>
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
              {connected ? 'Guía rápida' : 'Más detalle: qué necesitás en Mercado Libre'}
            </span>
            {guideOpen ? (
              <IoChevronUpOutline className="w-5 h-5 text-gray-500" />
            ) : (
              <IoChevronDownOutline className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {guideOpen && (
            <div className="px-4 py-4 border-t border-gray-200 text-sm">
              <TenantMlGuide connected={connected} />
              <div className="flex items-start gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <IoWarningOutline className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs">
                  Los avisos en Mercado Libre pueden tener costo (Clásico / Destacado). Si ML rechaza un cambio, podés
                  tener que pausar el aviso y volver a publicar desde Propiedades.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

MercadoLibreIntegration.propTypes = {
  direct: PropTypes.bool,
};

function MlLoadingScreen({ direct = false }) {
  const shellClass = direct
    ? 'py-12'
    : 'bg-white rounded-lg shadow-lg p-8';
  return (
    <div className={shellClass}>
      <div className="flex items-center justify-center py-12">
        <IoSyncOutline className="w-8 h-8 text-blue-500 animate-spin mr-3" />
        <span className="text-gray-600">Verificando conexión...</span>
      </div>
    </div>
  );
}

MlLoadingScreen.propTypes = {
  direct: PropTypes.bool,
};

export default MercadoLibreIntegration;
