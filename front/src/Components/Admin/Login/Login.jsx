import  { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../../../redux/Actions/actions";
import { useNavigate, Link } from "react-router-dom";import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
const LoginAdmin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const error = useSelector((state) => state.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica en el frontend
    if (!username.trim()) {
      return;
    }
    if (!password.trim()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await dispatch(loginAdmin({ username, password }));
      if (result && result.type === "LOGIN_SUCCESS") {
        navigate("/panel");
      }
      // Los errores se manejan automáticamente por el middleware de toast
    } catch (err) {
      console.error("Error en login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navbar */}
      <div className="w-full bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <Link
          to="/"
          className="text-white text-xl font-semibold hover:underline"
        >
          Inicio
        </Link>
      </div>

      {/* Contenedor centrado */}
      <div className="flex flex-1 justify-center items-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center uppercase">
            Iniciar sesión
          </h2>
          
          {/* Solo mostrar error si no usas toast middleware */}
          {error && !isLoading && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="username"
              >
                Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                required
                disabled={isLoading}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <IoEyeOffOutline className="w-5 h-5" />
                  ) : (
                    <IoEyeOutline className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password.trim()}
                className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors ${
                  isLoading || !username.trim() || !password.trim()
                    ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                    : "bg-lime-500 hover:bg-lime-600 text-black"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : (
                  "Iniciar sesión"
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