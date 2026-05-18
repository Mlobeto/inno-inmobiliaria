import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';

/** Rutas SPA permitidas para rol AGENT (mismo casing que las <Route>). */
const ALLOWED = ['/panelLeads', '/panelComisiones', '/soporte'];

function stripTrailingSlash(pathname) {
  return pathname.replace(/\/$/, '') || '/';
}

export default function RestrictedAgentRoutes({ children }) {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = stripTrailingSlash(location.pathname);

  useEffect(() => {
    if (user?.role !== 'AGENT') return;
    const allowed = ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!allowed) {
      navigate('/panelLeads', { replace: true });
    }
  }, [user?.role, pathname, navigate]);

  if (user?.role === 'AGENT') {
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
