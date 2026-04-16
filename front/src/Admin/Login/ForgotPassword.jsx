import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '@shared/redux';

/** Logo AdminProp — 3 barras de distinta altura + arco inferior */
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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
    } catch (err) {
      console.error('Error al solicitar recuperación:', err);
    }
  };

  const Navbar = () => (
    <div className="w-full bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-4 flex justify-between items-center z-10">
      <Link to="/" className="flex items-center gap-2 text-slate-200 text-lg font-semibold hover:text-white transition-colors">
        <AppLogo />
        <span>AdminProp</span>
      </Link>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-indigo-700 opacity-20 pointer-events-none" />
        <Navbar />

        <div className="flex flex-1 justify-center items-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center">

              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-5">
                <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-100 mb-3">¡Email Enviado!</h2>

              <p className="text-slate-400 text-sm mb-6">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>

              <div className="bg-indigo-950/50 border border-indigo-800 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-indigo-300 font-semibold">📧 Revisa tu bandeja de entrada</p>
                <ul className="mt-2 text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>El enlace expirará en 1 hora</li>
                  <li>Revisá también la carpeta de spam</li>
                  <li>Si no lo recibís, intentá de nuevo</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/30 text-sm"
                >
                  Volver al Login
                </Link>
                <button
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  className="block w-full py-3 px-4 border border-slate-600 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm"
                >
                  Enviar otro email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">
      <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-indigo-700 opacity-20 pointer-events-none" />
      <Navbar />

      <div className="flex flex-1 justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <AppLogo />
            <h1 className="text-3xl font-extrabold text-slate-100 mt-4 tracking-tight">AdminProp</h1>
            <p className="text-sm text-slate-400 mt-1 tracking-wide">Gestión Inmobiliaria</p>
          </div>

          {/* Card */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-200 mb-1">¿Olvidaste tu contraseña?</h2>
            <p className="text-sm text-slate-400 mb-6">
              Ingresá tu email y te enviaremos un enlace para restablecerla.
            </p>

            {error && (
              <div className="mb-5 p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-sm">
                ❌ {error?.data?.message || 'Error al enviar email. Intentá nuevamente.'}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest" htmlFor="email">
                  Email / Usuario
                </label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-email@ejemplo.com"
                  className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Ingresá el email o usuario con el que te registraste
                </p>
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
                    Enviando...
                  </span>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
              >
                ← Volver al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
