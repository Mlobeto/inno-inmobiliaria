import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Guard que verifica si el perfil de la empresa está completo
 * Redirige a /admin/company-settings si faltan datos obligatorios
 */
const ProfileCompletionGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    checkProfileCompletion();
  }, [location.pathname]);

  const checkProfileCompletion = async () => {
    try {
      // Si ya está en company-settings o subscription, permitir acceso
      if (location.pathname.includes('company-settings') || location.pathname.includes('subscription')) {
        setIsComplete(true);
        setIsChecking(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setIsChecking(false);
        navigate('/login', { replace: true });
        return;
      }

      // Verificar configuración de la empresa
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // La respuesta puede venir en response.data.data o response.data
      const settings = response.data?.data || response.data || {};

      // Si no hay settings, considerarlo incompleto
      if (!settings || Object.keys(settings).length === 0) {
        setIsComplete(false);
        navigate('/admin/company-settings?incomplete=true', { replace: true });
        return;
      }

      // Validar campos obligatorios
      const requiredFields = [
        'company_name',
        'company_cuit',
        'company_address',
        'company_phone',
        'company_email'
      ];

      const isProfileComplete = requiredFields.every(field => 
        settings[field] && settings[field].trim() !== ''
      );

      setIsComplete(isProfileComplete);

      // Si el perfil no está completo, redirigir y NO permitir renderizar
      if (!isProfileComplete) {
        navigate('/admin/company-settings?incomplete=true', { replace: true });
        return; // IMPORTANTE: No continuar
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error verificando perfil:', error);
      setIsChecking(false);
      // En caso de error, redirigir a settings por seguridad
      navigate('/admin/company-settings?incomplete=true', { replace: true });
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  // Solo renderizar children si el perfil está completo
  if (!isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProfileCompletionGuard;
