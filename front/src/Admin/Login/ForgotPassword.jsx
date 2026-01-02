import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../../shared/redux';

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <div className="w-full bg-gray-800 p-4 shadow-md flex justify-between items-center">
          <Link to="/" className="text-white text-xl font-semibold hover:underline">
            Inicio
          </Link>
        </div>

        <div className="flex flex-1 justify-center items-center">
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                ¡Email Enviado!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>📧 Revisa tu bandeja de entrada</strong>
                </p>
                <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>El enlace expirará en 1 hora</li>
                  <li>Revisa también la carpeta de spam</li>
                  <li>Si no lo recibes, intenta de nuevo</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full py-2 px-4 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded transition-colors"
                >
                  Volver al Login
                </Link>
                
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                  className="block w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded transition-colors"
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="w-full bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-semibold hover:underline">
          Inicio
        </Link>
      </div>

      <div className="flex flex-1 justify-center items-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2 text-center">
            ¿Olvidaste tu contraseña?
          </h2>
          
          <p className="text-gray-600 text-center mb-6 text-sm">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error?.data?.message || 'Error al enviar email. Intenta nuevamente.'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email / Usuario
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu-email@ejemplo.com"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingresa el email o usuario con el que te registraste
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-lime-500 hover:bg-lime-600 text-black'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Volver al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
