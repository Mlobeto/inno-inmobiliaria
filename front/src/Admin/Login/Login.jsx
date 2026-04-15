import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

// Usar Redux desde shared
import { useLoginMutation, setCredentials } from '@shared/redux';

/** Logo SentaProp — 3 barras de distinta altura + arco inferior */
const AppLogo = () => (
  <div className="flex flex-col items-center justify-end w-16 h-14">
    <div className="flex items-end gap-1.5 mb-1">
      <div className="w-3 h-[22px] rounded bg-indigo-300" />
      <div className="w-3 h-[38px] rounded bg-indigo-300" />
      <div className="w-3 h-[14px] rounded bg-indigo-300" />
    </div>
    <div
      className="w-14 h-3.5 border-2 border-t-0 border-indigo-400"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
    />
  </div>
);

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await login({ username, password }).unwrap();

      dispatch(setCredentials({
        token: result.token,
        admin: result.admin
      }));
      
      if (result.isPlatformAdmin) {
        navigate('/platform-admin/dashboard');
      } else {
        navigate('/panel');
      }
      
    } catch (err) {
      console.error('Error en login:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Blob decorativo */}
      <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-indigo-700 opacity-20 pointer-events-none" />

      {/* Navbar */}
      <div className="w-full bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex justify-between items-center z-10">
        <Link to="/" className="flex items-center gap-2 text-slate-200 text-lg font-semibold hover:text-white transition-colors">
          <AppLogo />
          <span>SentaProp</span>
        </Link>
      </div>

      {/* Contenedor centrado */}
      <div className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <AppLogo />
            <h1 className="text-3xl font-extrabold text-slate-100 mt-4 tracking-tight">SentaProp</h1>
            <p className="text-sm text-slate-400 mt-1 tracking-wide">Gestión Inmobiliaria</p>
          </div>

          {/* Card */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-200 mb-6">Iniciá sesión</h2>

            {error && (
              <div className="mb-5 p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-sm">
                ❌ {error?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest" htmlFor="username">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresá tu usuario"
                  className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest" htmlFor="password">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu contraseña"
                  className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all focus:outline-none ${
                  isLoading
                    ? 'bg-slate-600 cursor-not-allowed text-slate-400'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
