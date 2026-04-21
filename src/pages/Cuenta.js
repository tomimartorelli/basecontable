import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEye, FiEyeOff, FiSave, FiEdit3, FiCheck, FiX, FiCamera, FiShield, FiCalendar, FiAward } from 'react-icons/fi';

// Función helper para obtener la URL correcta del avatar
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  // Si es una URL externa (Google, etc), usarla directamente
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  // Si es un archivo local, usar la API
  return `/api/users/avatar/${avatar}`;
};

const Cuenta = () => {
  const { user, login } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    company: user?.company || '',
    position: user?.position || ''
  });

  // Datos para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        company: user.company || '',
        position: user.position || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el perfil');
      }

      login(data.user, localStorage.getItem('token'), localStorage.getItem('refreshToken'));
      
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      setEditMode(false);
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      company: user?.company || '',
      position: user?.position || ''
    });
    setEditMode(false);
    setMessage({ type: '', text: '' });
  };

  // Funciones para manejar el avatar
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen válido' });
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen debe ser menor a 5MB' });
        return;
      }

      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Por favor selecciona una imagen primero' });
      return;
    }

    setAvatarLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al subir el avatar');
      }

      // Actualizar el usuario en el contexto
      login(data.user, localStorage.getItem('token'), localStorage.getItem('refreshToken'));
      
      setMessage({ type: 'success', text: 'Avatar actualizado correctamente' });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el avatar');
      }

      // Actualizar el usuario en el contexto
      login(data.user, localStorage.getItem('token'), localStorage.getItem('refreshToken'));
      
      setMessage({ type: 'success', text: 'Avatar eliminado correctamente' });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={modoOscuro ? 'flex items-center justify-center min-h-screen bg-black text-white' : 'flex items-center justify-center min-h-screen bg-[#f5f5f7] text-gray-900'}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-3 ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`}></div>
          <p className={modoOscuro ? 'text-sm text-gray-300' : 'text-sm text-gray-700'}>Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  const avatar = user?.name?.charAt(0).toUpperCase() || 'U';

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'border-gray-300 bg-white focus:ring-gray-900 focus:border-gray-900';
  const inputDisabled = modoOscuro ? 'border-gray-700 bg-gray-800/50 text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-500';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border overflow-hidden flex-shrink-0 ${modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}>
              {user?.avatar ? (
                <img 
                  src={`${getAvatarUrl(user.avatar)}?t=${Date.now()}`} 
                  alt="Avatar del usuario" 
                  className="w-full h-full object-cover"
                  key={user.avatar}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                  <span className="text-xl sm:text-2xl font-bold text-white">{avatar}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-xl sm:text-2xl font-semibold mb-1 ${textPri}`}>
                Mi Cuenta
              </h1>
              <p className={`text-sm leading-relaxed ${textSec}`}>
                Administra tu información personal, seguridad y detalles de la cuenta.
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes de estado */}
        {message.text && (
          <div className="mb-4">
            <div className={`border rounded-xl px-3 py-2 flex items-center gap-2 text-sm ${box} ${message.type === 'success' ? (modoOscuro ? 'text-green-200' : 'text-gray-800') : (modoOscuro ? 'text-red-200' : 'text-gray-800')}`}>
              {message.type === 'success' ? (
                <FiCheck className={`w-4 h-4 ${modoOscuro ? 'text-green-400' : 'text-gray-700'}`} />
              ) : (
                <FiX className={`w-4 h-4 ${modoOscuro ? 'text-red-400' : 'text-gray-700'}`} />
              )}
              <span className="truncate">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs de navegación */}
        <div className="mb-5">
          <div className={`${box} rounded-2xl p-1 border w-full overflow-x-auto`}>
            <div className="flex min-w-max space-x-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  activeTab === 'profile'
                    ? modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                    : modoOscuro ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Perfil</span>
                <span className="sm:hidden">Perfil</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  activeTab === 'security'
                    ? modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                    : modoOscuro ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiShield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Seguridad</span>
                <span className="sm:hidden">Seg</span>
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  activeTab === 'info'
                    ? modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
                    : modoOscuro ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FiAward className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Información</span>
                <span className="sm:hidden">Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido de las tabs */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full">
          {activeTab === 'profile' && (
            <>
              {/* Información del perfil */}
              <div className={`${box} rounded-2xl border overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                        <FiUser className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                      </div>
                      <div className="min-w-0">
                        <h2 className={`text-sm font-semibold ${textPri}`}>Información personal</h2>
                        <p className={`text-xs ${textMuted}`}>Datos básicos de tu perfil.</p>
                      </div>
                    </div>
                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${modoOscuro ? 'border-gray-400 text-white hover:bg-gray-700' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'}`}
                      >
                        <FiEdit3 className="text-sm" />
                        <span>Editar</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEdit}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors ${btnOut}`}
                        >
                          <FiX className="text-sm" />
                          <span>Cancelar</span>
                        </button>
                        <button
                          onClick={handleProfileUpdate}
                          disabled={loading}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'}`}
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <FiSave className="text-sm" />
                          )}
                          <span className="hidden sm:inline">Guardar</span>
                          <span className="sm:hidden">Guardar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-medium ${textSec}`}>
                        Nombre completo
                      </label>
                      <div className="relative">
                        <FiUser className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${textMuted}`} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${editMode ? inputClass : inputDisabled}`}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-medium ${textSec}`}>
                        Email
                      </label>
                      <div className="relative">
                        <FiMail className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${textMuted}`} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${editMode ? inputClass : inputDisabled}`}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-medium ${textSec}`}>
                        Teléfono
                      </label>
                      <div className="relative">
                        <FiPhone className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${textMuted}`} />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${editMode ? inputClass : inputDisabled}`}
                          placeholder="+54 11 1234-5678"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-medium ${textSec}`}>
                        Empresa
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${editMode ? inputClass : inputDisabled}`}
                        placeholder="Nombre de la empresa"
                      />
                    </div>

                    {user?.currentPlan?.slug === 'empresarial' && (
                      <div className="space-y-2">
                        <label className={`block text-xs font-medium ${textSec}`}>
                          Cargo
                        </label>
                        <div className={`w-full px-3 py-2.5 border rounded-lg text-sm ${inputDisabled} flex items-center`}>
                          <span className={textMuted}>{user?.position || 'Sin cargo asignado'}</span>
                        </div>
                        <p className={`text-xs ${textMuted}`}>El cargo es asignado por el administrador de la empresa</p>
                      </div>
                    )}

                    <div className="sm:col-span-2 space-y-2">
                      <label className={`block text-xs font-medium ${textSec}`}>
                        Dirección
                      </label>
                      <div className="relative">
                        <FiMapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${editMode ? inputClass : inputDisabled}`}
                          placeholder="Tu dirección completa"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Avatar */}
              <div className={`${box} rounded-2xl border overflow-hidden`}>
                <div className={`px-4 py-3 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                      <FiCamera className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                    </div>
                    <div className="min-w-0">
                      <h2 className={`text-sm font-semibold ${textPri}`}>Avatar</h2>
                      <p className={`text-xs ${textMuted}`}>Imagen de tu perfil.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-center">
                    {/* Avatar actual */}
                    <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center mx-auto mb-4 border overflow-hidden ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                      {user?.avatar ? (
                        <img 
                          src={`${getAvatarUrl(user.avatar)}?t=${Date.now()}`} 
                          alt="Avatar del usuario" 
                          className="w-full h-full object-cover"
                          key={user.avatar}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                          <span className="text-2xl sm:text-3xl font-bold text-white">{avatar}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Preview de nueva imagen */}
                    {previewUrl && (
                      <div className="mb-4">
                        <p className={`text-xs sm:text-sm mb-2 ${textSec}`}>Vista previa:</p>
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto overflow-hidden border-2 ${modoOscuro ? 'border-blue-600' : 'border-blue-300'}`}>
                          <img 
                            src={previewUrl} 
                            alt="Vista previa" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <p className={`text-xs sm:text-sm mb-4 ${textSec}`}>
                      {user?.avatar ? 'Avatar personalizado' : 'Avatar generado automáticamente'}
                    </p>

                    {/* Input de archivo oculto */}
                    <input
                      type="file"
                      id="avatar-input"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Botones de acción */}
                    <div className="space-y-2">
                      <label 
                        htmlFor="avatar-input"
                        className={`block w-full px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer text-sm ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'}`}
                      >
                        {selectedFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                      </label>

                      {selectedFile && (
                        <button
                          onClick={handleAvatarUpload}
                          disabled={avatarLoading}
                          className={`w-full px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 text-sm ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'}`}
                        >
                          {avatarLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span className="hidden sm:inline">Subiendo...</span>
                              <span className="sm:hidden">Subiendo...</span>
                            </div>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Subir avatar</span>
                              <span className="sm:hidden">Subir</span>
                            </>
                          )}
                        </button>
                      )}

                      {user?.avatar && (
                        <button
                          onClick={removeAvatar}
                          disabled={avatarLoading}
                          className={`w-full px-4 py-2 border rounded-lg text-sm transition-colors disabled:opacity-50 ${btnOut}`}
                        >
                          {avatarLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              <span className="hidden sm:inline">Eliminando...</span>
                              <span className="sm:hidden">Eliminando...</span>
                            </div>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Eliminar avatar</span>
                              <span className="sm:hidden">Eliminar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className={`lg:col-span-2 ${box} rounded-2xl border overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    <FiShield className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${textPri}`}>Seguridad</h2>
                    <p className={`text-xs ${textMuted}`}>Cambio de contraseña.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordUpdate} className="p-4 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMuted}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                        placeholder="Tu contraseña actual"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textMuted} hover:opacity-80`}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMuted}`} />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                        placeholder="Nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textMuted} hover:opacity-80`}
                      >
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMuted}`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                        placeholder="Confirma la nueva contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textMuted} hover:opacity-80`}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${modoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-900 hover:bg-black'}`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <FiCheck className="text-lg" />
                  )}
                  Cambiar contraseña
                </button>
              </form>
            </div>
          )}

          {activeTab === 'info' && (
            <div className={`lg:col-span-2 ${box} rounded-2xl border overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${modoOscuro ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    <FiAward className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${textPri}`}>Información de la cuenta</h2>
                    <p className={`text-xs ${textMuted}`}>Rol, estado y actividad.</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiAward className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                        <h3 className={`text-sm font-medium ${textPri}`}>Rol de usuario</h3>
                      </div>
                      <p className={`text-base font-semibold ${textPri}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiShield className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                        <h3 className={`text-sm font-medium ${textPri}`}>Estado</h3>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        Activo
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiCalendar className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                        <h3 className={`text-sm font-medium ${textPri}`}>Miembro desde</h3>
                      </div>
                      <p className={`text-sm font-medium ${textSec}`}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FiCalendar className={`text-base ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                        <h3 className={`text-sm font-medium ${textPri}`}>Última actividad</h3>
                      </div>
                      <p className={`text-sm font-medium ${textSec}`}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cuenta; 