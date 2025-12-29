import { useState, useEffect } from 'react';
import { IoDownloadOutline, IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir el mini-infobar de Chrome
      e.preventDefault();
      // Guardar el evento para usarlo después
      setDeferredPrompt(e);
      // Mostrar el botón de instalación
      setShowInstallPrompt(true);
    };

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      console.log('✅ PWA instalada exitosamente');
      setShowInstallPrompt(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó instalar la PWA');
    } else {
      console.log('❌ Usuario rechazó instalar la PWA');
    }

    // Limpiar el prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Guardar en localStorage para no mostrar de nuevo por un tiempo
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // No mostrar si ya está instalada
  if (isInstalled) {
    return null;
  }

  // No mostrar si no hay prompt disponible o si fue cerrado
  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-2xl p-4 max-w-sm border border-blue-400/30 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <IoDownloadOutline className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Instalar Aplicación</h3>
              <p className="text-sm text-blue-100">Acceso rápido desde tu escritorio</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <ul className="space-y-2 mb-4 text-sm">
          <li className="flex items-center space-x-2">
            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-300" />
            <span>Funciona sin conexión</span>
          </li>
          <li className="flex items-center space-x-2">
            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-300" />
            <span>Acceso directo en escritorio</span>
          </li>
          <li className="flex items-center space-x-2">
            <IoCheckmarkCircleOutline className="w-4 h-4 text-green-300" />
            <span>Experiencia como app nativa</span>
          </li>
        </ul>

        <div className="flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <IoDownloadOutline className="w-5 h-5" />
            <span>Instalar Ahora</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-white/90 hover:text-white transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
