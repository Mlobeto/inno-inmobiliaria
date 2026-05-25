import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';
import { isTenantProfileComplete } from '../../constants/onboardingFields';
import { panelShell, spinner } from '../Admin/adminPanelTheme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function parseStoredUserRole() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) return null;
    return JSON.parse(raw)?.role ?? null;
  } catch {
    return null;
  }
}

function LoadingScreen({ message }) {
  return (
    <div className={`${panelShell} flex items-center justify-center`}>
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-4 ${spinner}`} />
        <p className="text-textSecondary">{message}</p>
      </div>
    </div>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired,
};

/**
 * Guard que verifica si el perfil de la empresa está completo
 * Redirige a /admin/company-settings si faltan datos obligatorios
 */
const ProfileCompletionGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const storeUser = useSelector(selectCurrentUser);
  const [isChecking, setIsChecking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    checkProfileCompletion();
  }, [location.pathname, storeUser?.role]);

  const checkProfileCompletion = async () => {
    try {
      const lsRole = parseStoredUserRole();
      const isAgent =
        storeUser?.role === 'AGENT' ||
        lsRole === 'AGENT';

      if (isAgent) {
        setIsComplete(true);
        setIsChecking(false);
        if (location.pathname.includes('company-settings')) {
          navigate('/panelLeads', { replace: true });
        }
        return;
      }

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

      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const settings = response.data?.data || response.data || {};

      if (!settings || Object.keys(settings).length === 0) {
        setIsComplete(false);
        navigate('/admin/company-settings?incomplete=true', { replace: true });
        return;
      }

      const isProfileComplete = isTenantProfileComplete(settings);

      setIsComplete(isProfileComplete);

      if (!isProfileComplete) {
        navigate('/admin/company-settings?incomplete=true', { replace: true });
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error verificando perfil:', error);
      const status = error.response?.status;
      const code = error.response?.data?.code;
      const lsRole = parseStoredUserRole();
      const fallbackAgent =
        storeUser?.role === 'AGENT' ||
        lsRole === 'AGENT' ||
        (status === 403 && code === 'AGENT_RESTRICTED');

      if (fallbackAgent) {
        setIsComplete(true);
        setIsChecking(false);
        navigate('/panelLeads', { replace: true });
        return;
      }

      setIsChecking(false);
      navigate('/admin/company-settings?incomplete=true', { replace: true });
    }
  };

  if (isChecking) {
    return <LoadingScreen message="Verificando configuración..." />;
  }

  if (!isComplete) {
    return <LoadingScreen message="Redirigiendo..." />;
  }

  return children;
};

ProfileCompletionGuard.propTypes = {
  children: PropTypes.node,
};

export default ProfileCompletionGuard;
