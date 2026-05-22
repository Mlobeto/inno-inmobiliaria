import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation, setCredentials } from '@shared/redux';
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoArrowForwardOutline,
  IoStarOutline,
} from 'react-icons/io5';

const FEATURES = [
  'Contratos de alquiler y venta con PDF automático',
  'Gestión de propiedades, clientes y cobros',
  'Alertas de vencimientos y actualizaciones',
  'Captación de leads con tablero Kanban integrado',
  'Publicación automática en Mercado Libre Inmuebles',
  'Landing page propia para publicar propiedades',
  'Facturación electrónica (AFIP/ARCA)',
];

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials({ token: result.token, admin: result.admin }));
      if (result.isPlatformAdmin) {
        navigate('/platform-admin/dashboard');
      } else if (result.admin?.role === 'AGENT') {
        navigate('/panelLeads');
      } else {
        navigate('/panel');
      }
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bgBase via-bgSurface to-brand-muted flex flex-col font-Montserrat">

      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-borderBase">
        <Link to="/" className="flex items-center gap-2">
          <img src="/LOGO.png" alt="GestProp" className="h-7 object-contain brightness-0 invert" />
        </Link>
        <Link to="/registro" className="text-sm text-textSecondary hover:text-textPrimary transition-colors">
          ¿No tenés cuenta?{' '}
          <span className="text-brand-light font-medium">Empezá gratis</span>
        </Link>
      </nav>

      {/* Contenido */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Panel izquierdo — marketing (solo desktop) */}
          <div className="hidden lg:flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold text-textPrimary mb-3 leading-tight">
                La plataforma completa para tu inmobiliaria
              </h1>
              <p className="text-textSecondary text-lg">
                Gestioná propiedades, contratos y cobros desde un solo lugar. Empezá gratis, sin tarjeta de crédito.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-textSecondary">
                  <IoCheckmarkCircleOutline className="w-5 h-5 text-brand-light flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3 bg-bgSurface border border-borderBase rounded-xl px-4 py-3 shadow-brand">
                <IoStarOutline className="w-6 h-6 text-brand-light flex-shrink-0" />
                <div>
                  <p className="text-textPrimary font-semibold text-sm">Prueba gratuita 7 días</p>
                  <p className="text-textMuted text-xs">Sin tarjeta · Cancelá cuando quieras</p>
                </div>
              </div>
              <Link
                to="/registro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-textWhite font-semibold rounded-xl transition-colors shadow-brandGlow"
              >
                Crear cuenta gratis
                <IoArrowForwardOutline className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Panel derecho — formulario */}
          <div className="w-full">
            <div className="bg-bgSurface backdrop-blur-sm border border-borderBase rounded-2xl p-8 shadow-brandGlow">

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-textPrimary mb-1">Iniciá sesión</h2>
                <p className="text-textSecondary text-sm">Ingresá con tu email y contraseña</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-customRedMuted border border-customRed/30 rounded-lg text-customRed text-sm">
                  {error?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    className="w-full bg-bgElevated border border-borderStrong rounded-xl px-4 py-3 text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-textSecondary text-xs font-semibold uppercase tracking-wider">
                      Contraseña
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-brand-light hover:text-brand transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                      className="w-full bg-bgElevated border border-borderStrong rounded-xl px-4 py-3 pr-11 text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-textMuted hover:text-textPrimary transition-colors focus:outline-none disabled:opacity-50"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword
                        ? <IoEyeOffOutline className="w-5 h-5" />
                        : <IoEyeOutline className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200
                    bg-brand hover:bg-brand-dark text-textWhite shadow-brandGlow
                    disabled:bg-brand-muted disabled:text-textMuted disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </button>
              </form>

              {/* Link mobile */}
              <div className="lg:hidden mt-6 pt-6 border-t border-borderBase text-center">
                <p className="text-textSecondary text-sm">
                  ¿No tenés cuenta?{' '}
                  <Link to="/registro" className="text-brand-light font-medium hover:text-brand transition-colors">
                    Empezá gratis →
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-textMuted">
        © {new Date().getFullYear()} GestProp ·{' '}
        <a href="https://innoweb.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-textSecondary transition-colors">
          innoweb.com.ar
        </a>
      </div>

    </div>
  );
};

export default LoginAdmin;
