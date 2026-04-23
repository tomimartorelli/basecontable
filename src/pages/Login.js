import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiTrendingUp, FiPieChart, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { sanitizeEmail, sanitizeText, validators } from '../utils/sanitize';

const Login = () => {
  const { login } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-900 focus:border-gray-900';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Sanitizar inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizeText(password);
      
      // Validar email
      const emailValidation = validators.email(sanitizedEmail);
      if (!emailValidation.valid) {
        setError(emailValidation.error);
        setLoading(false);
        return;
      }
      
      // Validar que password no esté vacío
      if (!sanitizedPassword) {
        setError('La contraseña es requerida');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: sanitizedEmail, 
          password: sanitizedPassword 
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Respuesta no JSON del servidor de login:', text);
        throw new Error('Respuesta no válida del servidor de autenticación.');
      }

      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión');
      login(data.user, data.token, data.refreshToken);
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const contentType = res.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Respuesta no JSON del servidor:', text);
        throw new Error('Respuesta no válida del servidor.');
      }

      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión con Google');
      login(data.user, data.token, data.refreshToken);
      // Si es usuario nuevo, redirigir a seleccionar plan
      if (data.isNewUser) {
        navigate('/planes');
      } else {
        navigate('/inicio');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google. Intentá de nuevo.');
  };

  return (
    <div className={`min-h-screen flex ${modoOscuro ? 'bg-black' : 'bg-white'}`}>
      {/* Panel izquierdo - Ilustración (oculto en mobile) */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 ${modoOscuro ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'} text-white relative overflow-hidden`}>
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold">BaseContable</span>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
            Gestión financiera<br />
            <span className="text-blue-400">simplificada</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Controlá tus ventas, gastos y flujo de caja en un solo lugar. 
            La herramienta que tu negocio necesita.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FiPieChart className="w-6 h-6 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold">+30%</p>
              <p className="text-xs text-gray-400">Productividad</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FiDollarSign className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-gray-400">Seguro</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FiBarChart2 className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-gray-400">Disponible</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-sm text-gray-400">
          © 2026 BaseContable. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className={`w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 sm:p-8 ${modoOscuro ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modoOscuro ? 'bg-gray-800' : 'bg-gray-900'}`}>
              <FiTrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-semibold ${textPri}`}>BaseContable</span>
          </div>

          <div className={`${box} rounded-2xl p-8 shadow-sm`}>
            {/* Header */}
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${textPri} mb-2`}>
                Bienvenido de vuelta
              </h2>
              <p className={`${textMuted} text-sm`}>
                Ingresá tus credenciales para acceder a tu cuenta
              </p>
            </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className={`h-4 w-4 transition-colors ${modoOscuro ? 'text-gray-400 group-focus-within:text-gray-300' : 'text-gray-400 group-focus-within:text-gray-900'}`} />
                </div>
                <input
                  type="email"
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-4 w-4 transition-colors ${modoOscuro ? 'text-gray-400 group-focus-within:text-gray-300' : 'text-gray-400 group-focus-within:text-gray-900'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${textMuted} hover:opacity-80`}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className={`border rounded-lg py-2 px-3 text-xs ${modoOscuro ? 'border-red-700 bg-red-900/30 text-red-200' : 'border-gray-200 bg-gray-50 text-gray-800'}`}>
                {sanitizeText(error)}
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              className={`w-full text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Entrar
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className={`px-2 ${modoOscuro ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>o</span>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme={modoOscuro ? 'filled_black' : 'outline'}
              size="large"
              text="signin_with"
              shape="rectangular"
              locale="es"
            />
          </div>

          {/* Enlaces adicionales */}
          <div className={`mt-5 pt-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex flex-col gap-2 text-xs">
              <div className={`text-center ${textSec}`}>
                <Link
                  to="/forgot-password"
                  className={`hover:underline ${textPri}`}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className={`text-center ${textSec}`}>
                ¿No tenés cuenta?{' '}
                <Link 
                  to="/register" 
                  className={`font-medium hover:underline ${textPri}`}
                >
                  Registrate acá
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Login; 