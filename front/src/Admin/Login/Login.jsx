import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

// Usar Redux desde shared
import { useLoginMutation, setCredentials } from '@shared/redux';

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // RTK Query mutation hook
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Ejecutar login mutation
      const result = await login({ username, password }).unwrap();
      
      console.log('🔐 Login exitoso - Respuesta completa:', result);
      console.log('🔐 Admin data:', result.admin);
      console.log('🔐 Token:', result.token);
      console.log('🔐 isPlatformAdmin:', result.isPlatformAdmin);

      // Guardar credenciales en Redux
      dispatch(setCredentials({
        token: result.token,
        admin: result.admin
      }));
      
      // Redirigir según tipo de usuario
      if (result.isPlatformAdmin) {
        // PLATFORM_ADMIN → Panel de administrador de plataforma
        navigate('/platform-admin/dashboard');
      } else {
        // Tenant admin/agent → Panel de inmobiliaria
        navigate('/panel');
      }
      
    } catch (err) {
      console.error('Error en login:', err);
      // El error se muestra automáticamente en el UI
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navbar */}
      <div className="w-full bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-semibold hover:underline">
          Inicio
        </Link>
      </div>

      {/* Contenedor centrado */}
      <div className="flex flex-1 justify-center items-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center uppercase">
            Iniciar sesión
          </h2>
          
          {/* Mostrar error si existe */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoading}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={isLoading}
                required
              />
            </div>

            {/* Link de recuperación de contraseña */}
            <div className="mb-4 text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="flex items-center justify-between">
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
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
