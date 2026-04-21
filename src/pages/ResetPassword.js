import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

const ResetPassword = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!token || !email) {
      setError('El enlace para restablecer la contraseña no es válido. Volvé a pedir uno nuevo.');
    }
  }, [token, email]);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-900 focus:border-gray-900';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !email) {
      setError('El enlace para restablecer la contraseña no es válido. Volvé a pedir uno nuevo.');
      return;
    }
    if (!password || !repeatPassword) {
      setError('Completá ambos campos de contraseña.');
      return;
    }
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.message || 'No pudimos actualizar tu contraseña. Probá de nuevo en unos minutos.'
        );
      }
      setSuccess(
        data.message || 'Tu contraseña se actualizó correctamente. Ahora podés iniciar sesión.'
      );
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Error de conexión. Verificá tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 ${
        modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]'
      }`}
    >
      <div className="w-full max-w-sm">
        <div className={`${box} border rounded-2xl px-5 py-6`}>
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
                }`}
              >
                <FiLock className={`text-lg ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${textPri}`}>Elegí una nueva contraseña</h2>
                <p className={`text-xs ${textMuted}`}>
                  Por seguridad, vas a cerrar sesión en los dispositivos anteriores.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div
              className={`mb-3 border rounded-lg py-2 px-3 text-xs ${
                modoOscuro
                  ? 'border-red-700 bg-red-900/30 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className={`mb-3 border rounded-lg py-2 px-3 text-xs ${
                modoOscuro
                  ? 'border-green-700 bg-green-900/30 text-green-200'
                  : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>Nueva contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock
                    className={`h-4 w-4 transition-colors ${
                      modoOscuro
                        ? 'text-gray-400 group-focus-within:text-gray-300'
                        : 'text-gray-400 group-focus-within:text-gray-900'
                    }`}
                  />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${textMuted} hover:opacity-80`}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Repetir nueva contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock
                    className={`h-4 w-4 transition-colors ${
                      modoOscuro
                        ? 'text-gray-400 group-focus-within:text-gray-300'
                        : 'text-gray-400 group-focus-within:text-gray-900'
                    }`}
                  />
                </div>
                <input
                  type={showRepeatPassword ? 'text' : 'password'}
                  className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  required
                  placeholder="Repetí la contraseña"
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${textMuted} hover:opacity-80`}
                  onClick={() => setShowRepeatPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showRepeatPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showRepeatPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'
              }`}
              disabled={loading || !token || !email}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                'Guardar nueva contraseña'
              )}
            </button>
          </form>

          <div
            className={`mt-5 pt-4 border-t ${
              modoOscuro ? 'border-gray-700' : 'border-gray-100'
            }`}
          >
            <div className={`flex justify-between items-center text-xs ${textSec}`}>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 hover:underline"
              >
                <FiArrowLeft className="w-3 h-3" />
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

