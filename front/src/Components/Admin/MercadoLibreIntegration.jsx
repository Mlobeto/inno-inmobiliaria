import { useState, useEffect } from 'react';
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
  IoWarningOutline
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MercadoLibreIntegration = () => {
  const [searchParams] = useSearchParams();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
    
    // Si viene con parámetro tab=integrations, verificar estado nuevamente
    // (puede venir del callback de OAuth)
    const tab = searchParams.get('tab');
    if (tab === 'integrations') {
      setTimeout(() => {
        checkConnectionStatus();
      }, 500);
    }
  }, [searchParams]);

  const checkConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Error al verificar estado de MercadoLibre:', error);
      if (error.response?.status === 404 || error.response?.data?.connected === false) {
        setConnectionStatus({ connected: false });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mercadolibre/auth/start`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.authUrl) {
        // Redirigir a MercadoLibre para autorización
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error al iniciar conexión:', error);
      toast.error('Error al conectar con MercadoLibre');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Estás seguro de desconectar tu cuenta de MercadoLibre? Tus publicaciones actuales no se eliminarán, pero no podrás gestionarlas desde aquí.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/mercadolibre/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Cuenta de MercadoLibre desconectada');
      setConnectionStatus({ connected: false });
    } catch (error) {
      console.error('Error al desconectar:', error);
      toast.error('Error al desconectar cuenta');
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-lg flex items-center justify-center">
            <IoLogoBuffer className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MercadoLibre</h2>
            <p className="text-gray-600 mt-1">Publica tus propiedades en el marketplace más grande de Latinoamérica</p>
          </div>
        </div>
      </div>

      {/* Estado de Conexión */}
      <div className={`rounded-lg p-6 mb-6 ${
        connectionStatus?.connected 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
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
                    Tu cuenta de MercadoLibre está vinculada correctamente
                  </p>
                  {connectionStatus.mlUserId && (
                    <p className="text-xs text-gray-600">
                      Usuario ML: <span className="font-mono bg-white px-2 py-1 rounded">{connectionStatus.mlUserId}</span>
                    </p>
                  )}
                  {connectionStatus.lastSync && (
                    <p className="text-xs text-gray-600 mt-1">
                      Última sincronización: {new Date(connectionStatus.lastSync).toLocaleString('es-AR')}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Conecta tu cuenta para comenzar a publicar propiedades en MercadoLibre
                </p>
              )}
            </div>
          </div>

          {/* Botón de acción */}
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
                    <span>Conectar Cuenta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Información y características */}
      <div className="space-y-4">
        <div className="flex items-start space-x-3 text-sm text-gray-700">
          <IoInformationCircleOutline className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">¿Qué puedes hacer?</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Publicar propiedades directamente en MercadoLibre</li>
              <li>Gestionar tus publicaciones (pausar, reactivar, eliminar)</li>
              <li>Ver estadísticas de visualizaciones</li>
              <li>Recibir y responder preguntas de compradores</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start space-x-3 text-sm text-gray-700">
          <IoWarningOutline className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">Requisitos</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
              <li>Tener una cuenta activa en MercadoLibre Argentina</li>
              <li>Completar los datos de tu inmobiliaria en "Datos Generales"</li>
              <li>Las publicaciones pueden tener costos según el tipo de aviso</li>
            </ul>
          </div>
        </div>

        {/* Link a configuración de app si no está conectado */}
        {!connectionStatus?.connected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Al hacer clic en "Conectar Cuenta", serás redirigido a MercadoLibre 
              para autorizar el acceso. Una vez autorizado, podrás publicar tus propiedades.
            </p>
          </div>
        )}
      </div>

      {/* Guía rápida si está conectado */}
      {connectionStatus?.connected && (
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mr-2" />
            ¡Todo listo! Próximos pasos
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Ve a tu listado de <strong>Propiedades</strong></li>
            <li>Selecciona la propiedad que deseas publicar</li>
            <li>Haz clic en el botón <strong>"Publicar en ML"</strong></li>
            <li>La propiedad se publicará automáticamente en tu cuenta de MercadoLibre</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default MercadoLibreIntegration;
