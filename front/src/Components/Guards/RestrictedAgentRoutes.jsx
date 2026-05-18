import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';

/** Rutas SPA permitidas para rol AGENT (mismo casing que las <Route>). */
const ALLOWED = ['/panelLeads', '/panelComisiones', '/soporte'];

function stripTrailingSlash(pathname) {
  return pathname.replace(/\/$/, '') || '/';
}

function isAgentRoleFromStorage() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) return false;
    return JSON.parse(raw)?.role === 'AGENT';
  } catch {
    return false;
  }
}

function RestrictedAgentRoutes({ children }) {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = stripTrailingSlash(location.pathname);
  const isAgentUser = user?.role === 'AGENT' || isAgentRoleFromStorage();

  useEffect(() => {
    if (!isAgentUser) return;
    const allowed = ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!allowed) {
      navigate('/panelLeads', { replace: true });
    }
  }, [isAgentUser, pathname, navigate]);

  if (isAgentUser) {
    const allowed = ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!allowed) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
          <p className="text-slate-400">Redirigiendo…</p>
        </div>
      );
    }
  }

  return children;
}

RestrictedAgentRoutes.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RestrictedAgentRoutes;
