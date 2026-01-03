import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '@shared/redux';

const ResetPassword = () => {
  const { token } = useParams(); // Token desde la URL /reset-password/:token
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Validaciones locales
    if (newPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      await resetPassword({ token, newPassword }).unwrap();
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Error al resetear contraseña:', err);
    }
  };

  if (success) {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                ¡Contraseña Actualizada!
              </h2>
              
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Serás redirigido al login en unos segundos...
                </p>
              </div>
              
              <Link
                to="/login"
                className="block w-full py-2 px-4 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded transition-colors"
              >
                Ir al Login
              </Link>
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
            Restablecer Contraseña
          </h2>
          
          <p className="text-gray-600 text-center mb-6 text-sm">
            Ingresa tu nueva contraseña
          </p>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {localError || error?.data?.message || 'El enlace es inválido o ha expirado. Solicita uno nuevo.'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {newPassword.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        newPassword.length < 6 ? 'bg-red-500 w-1/3' :
                        newPassword.length < 8 ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    newPassword.length < 6 ? 'text-red-600' :
                    newPassword.length < 8 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {newPassword.length < 6 ? 'Débil' :
                     newPassword.length < 8 ? 'Media' :
                     'Fuerte'}
                  </span>
                </div>
              </div>
            )}

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
                  Actualizando...
                </span>
              ) : (
                'Actualizar Contraseña'
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

export default ResetPassword;
