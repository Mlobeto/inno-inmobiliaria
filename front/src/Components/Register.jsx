import  { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRegisterTenantMutation } from '@shared/redux';
import {
  IoPersonSharp,
  IoMailSharp,
  IoLockClosedSharp,
  IoCheckmarkCircle,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';

/**
 * Componente de Registro con Plan Integrado
 * Permite crear cuenta de tenant y activar plan automáticamente
 */
const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const moduleIdsParam = searchParams.get('moduleIds');
  const moduleIds = moduleIdsParam ? moduleIdsParam.split(',').filter(Boolean) : [];

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerTenant, { isLoading }] = useRegisterTenantMutation();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Tu nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log('Datos del formulario a enviar:', formData);

    try {
      const result = await registerTenant({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        planId: planId || 'base',
        moduleIds,
      }).unwrap();

      console.log('Resultado del registro:', result);

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      navigate('/admin/company-settings?welcome=true');
    } catch (error) {
      console.error('Error en registro:', error);
      alert(error?.data?.error || 'Error al crear la cuenta');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const inputClass = (field, withToggle = false) =>
    `w-full pl-10 ${withToggle ? 'pr-11' : 'pr-4'} py-3 bg-bgElevated border rounded-xl text-textPrimary placeholder-textMuted focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition ${
      errors[field] ? 'border-customRed' : 'border-borderStrong'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bgBase via-bgSurface to-brand-muted flex flex-col font-Montserrat">
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-borderBase">
        <Link to="/" className="flex items-center gap-2">
          <img src="/LOGO.png" alt="GestProp" className="h-7 object-contain brightness-0 invert" />
        </Link>
        <Link to="/login" className="text-sm text-textSecondary hover:text-textPrimary transition-colors">
          ¿Ya tenés cuenta?{' '}
          <span className="text-brand-light font-medium">Iniciá sesión</span>
        </Link>
      </nav>

      <div className="flex flex-1 items-center justify-center p-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-textPrimary mb-2">
              Crear cuenta
            </h1>
            <p className="text-textSecondary">
              Completá tus datos para empezar la prueba gratuita
            </p>
            {planId && (
              <div className="mt-4 inline-flex items-center gap-2 bg-brand-muted text-brand-light px-4 py-2 rounded-full text-sm border border-borderBase">
                <IoCheckmarkCircle className="text-lg" />
                Plan seleccionado: <strong>{planId}</strong>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-bgSurface border border-borderBase rounded-2xl shadow-brandGlow p-8 space-y-6">

            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Tu nombre completo *
              </label>
              <div className="relative">
                <IoPersonSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  className={inputClass('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="text-customRed text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Email *
              </label>
              <div className="relative">
                <IoMailSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={inputClass('email')}
                />
              </div>
              {errors.email && (
                <p className="text-customRed text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <IoLockClosedSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={inputClass('password', true)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-textMuted hover:text-textPrimary transition-colors focus:outline-none disabled:opacity-50"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-customRed text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-textSecondary mb-2">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <IoLockClosedSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repetí tu contraseña"
                  autoComplete="new-password"
                  className={inputClass('confirmPassword', true)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-textMuted hover:text-textPrimary transition-colors focus:outline-none disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-customRed text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-dark text-textWhite py-3 rounded-xl font-semibold transition shadow-brandGlow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta y continuar'}
            </button>

            <div className="text-center text-sm text-textSecondary">
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-brand-light hover:text-brand font-semibold transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          </form>

          <div className="text-center mt-6 text-sm text-textMuted">
            Al crear una cuenta aceptás nuestros{' '}
            <a href="/terms" className="text-brand-light hover:text-brand transition-colors">
              Términos y Condiciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
