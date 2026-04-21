import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { FiHome, FiPhone, FiMapPin, FiBriefcase, FiArrowRight, FiCheck } from 'react-icons/fi';

const CompletarPerfil = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company: user?.company || '',
    phone: user?.phone || '',
    address: user?.address || '',
    position: user?.position || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await secureFetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await refreshUser();
        setSuccess(true);
        setTimeout(() => {
          navigate('/inicio');
        }, 1000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      setError('Error de conexión. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/inicio');
  };

  const bg = modoOscuro ? 'bg-gray-900' : 'bg-white';
  const text = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const inputBg = modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const inputText = modoOscuro ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4`}>
      <div className={`max-w-md w-full ${bg} rounded-2xl shadow-lg p-8`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiHome className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${text}`}>
            Completá tu perfil
          </h1>
          <p className={`mt-2 ${textSec}`}>
            Agregá los datos de tu empresa para continuar
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm flex items-center justify-center">
            <FiCheck className="mr-2" />
            Perfil actualizado correctamente
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textSec} mb-1`}>
              Nombre de la empresa *
            </label>
            <div className="relative">
              <FiHome className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                placeholder="Ej: Mi Empresa S.A."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textSec} mb-1`}>
              Teléfono
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: 11 1234-5678"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textSec} mb-1`}>
              Dirección
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Av. Corrientes 1234, CABA"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textSec} mb-1`}>
              Cargo / Puesto
            </label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Ej: Gerente de Ventas"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${inputBg} ${inputText} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continuar al inicio
                  <FiArrowRight className="ml-2" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className={`w-full py-3 px-4 rounded-lg border ${modoOscuro ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} transition-colors`}
            >
              Completar después
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompletarPerfil;
