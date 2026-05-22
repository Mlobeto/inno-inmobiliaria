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
  'Contratos y PDF automático',
  'Propiedades, clientes y cobros',
  'Leads y Mercado Libre',
  'Landing propia de tu inmobiliaria',
  'Alertas de vencimientos',
  'Facturación electrónica AFIP',
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
    <div className="h-screen max-h-[100dvh] bg-gradient-to-br from-bgBase via-bgSurface to-brand-muted flex flex-col font-Montserrat overflow-hidden">

      <nav className="shrink-0 w-full px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-borderBase">
        <Link to="/" className="flex items-center gap-2">
          <img src="/LOGO.png" alt="GestProp" className="h-6 object-contain brightness-0 invert" />
        </Link>
        <Link to="/registro" className="text-xs sm:text-sm text-textSecondary hover:text-textPrimary transition-colors">
          ¿No tenés cuenta?{' '}
          <span className="text-brand-light font-medium">Empezá gratis</span>
        </Link>
      </nav>

      <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-3 sm:py-4 overflow-y-auto">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-center my-auto">

          <div className="hidden lg:flex flex-col gap-4 max-h-full">
            <div>
              <h1 className="text-2xl xl:text-3xl font-bold text-textPrimary leading-snug">
                La plataforma completa para tu inmobiliaria
              </h1>
              <p className="text-textSecondary text-sm mt-2 leading-relaxed">
                Gestioná propiedades, contratos y cobros desde un solo lugar. Empezá gratis, sin tarjeta.
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-textSecondary text-xs leading-snug">
                  <IoCheckmarkCircleOutline className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 bg-bgSurface border border-borderBase rounded-lg px-3 py-2.5 shadow-brand">
              <IoStarOutline className="w-5 h-5 text-brand-light flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-textPrimary font-semibold text-xs">Prueba gratuita 7 días</p>
                <p className="text-textMuted text-[11px]">Sin tarjeta · Cancelá cuando quieras</p>
              </div>
              <Link
                to="/registro"
                className="ml-auto shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brand-dark text-textWhite text-xs font-semibold rounded-lg transition-colors"
              >
                Crear cuenta
                <IoArrowForwardOutline className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="bg-bgSurface border border-borderBase rounded-xl p-5 sm:p-6 shadow-brandGlow">

              <div className="mb-4 sm:mb-5">
                <h2 className="text-xl font-bold text-textPrimary">Iniciá sesión</h2>
                <p className="text-textSecondary text-xs sm:text-sm mt-0.5">Ingresá con tu email y contraseña</p>
              </div>

              {error && (
                <div className="mb-3 px-3 py-2 bg-customRedMuted border border-customRed/30 rounded-lg text-customRed text-xs sm:text-sm">
                  {error?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.'}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-textSecondary text-[11px] font-semibold uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-bgElevated border border-borderStrong rounded-lg px-3 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-textSecondary text-[11px] font-semibold uppercase tracking-wider">
                      Contraseña
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] text-brand-light hover:text-brand transition-colors"
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
                      className="w-full bg-bgElevated border border-borderStrong rounded-lg px-3 py-2.5 pr-10 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-textMuted hover:text-textPrimary transition-colors focus:outline-none disabled:opacity-50"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword
                        ? <IoEyeOffOutline className="w-4 h-4" />
                        : <IoEyeOutline className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200
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

              <div className="lg:hidden mt-4 pt-4 border-t border-borderBase text-center">
                <p className="text-textSecondary text-xs sm:text-sm">
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

      <div className="shrink-0 py-2 text-center text-[10px] sm:text-xs text-textMuted">
        © {new Date().getFullYear()} GestProp ·{' '}
        <a href="https://innoweb.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-textSecondary transition-colors">
          innoweb.com.ar
        </a>
      </div>

    </div>
  );
};

export default LoginAdmin;
