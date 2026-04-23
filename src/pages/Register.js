import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUserPlus, FiCheckCircle, FiHome, FiArrowLeft, FiStar, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { sanitizeText, sanitizeEmail, validators } from '../utils/sanitize';

const Register = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('individual'); // 'individual' o 'company'
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Campos básicos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  
  // Campos de empresa
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cuit, setCuit] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Estados del formulario
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const navigate = useNavigate();

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-gray-900 focus:border-gray-900';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';
  const btnPrimary = modoOscuro ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-900 hover:bg-black text-white';

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      console.log('🔄 Cargando planes...');
      
      const response = await fetch(`${API_BASE_URL}/api/plans`);
      console.log('📡 Respuesta de la API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Planes recibidos:', data);
        setPlans(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error al cargar planes:', response.status, errorData);
        setError('Error al cargar los planes. Por favor, recarga la página.');
      }
    } catch (error) {
      console.error('❌ Error de red al cargar planes:', error);
      setError('Error de conexión. Verifica tu conexión a internet.');
    } finally {
      setLoadingPlans(false);
    }
  };

  

  const getFeatureName = (feature) => {
    const featureNames = {
      basicInvoicing: 'Registro de ventas básico',
      basicTemplates: 'Plantillas básicas',
      customTemplates: 'Plantillas personalizadas',
      logoUpload: 'Subida de logo',
      companyBranding: 'Marca de empresa',
      employeeAccounts: 'Cuentas de empleados',
      multiCompany: 'Múltiples empresas',
      advancedAnalytics: 'Analíticas avanzadas',
      prioritySupport: 'Soporte prioritario'
    };
    return featureNames[feature] || feature;
  };

  const validateStep1 = () => {
    // Sanitizar inputs antes de validar
    const sanitizedName = sanitizeText(name);
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedName.trim()) return 'El nombre es requerido';
    
    if (!sanitizedEmail) return 'El email es requerido';
    const emailValidation = validators.email(sanitizedEmail);
    if (!emailValidation.valid) return emailValidation.error;
    
    if (!password) return 'La contraseña es requerida';
    const passwordValidation = validators.password(password);
    if (!passwordValidation.valid) return passwordValidation.error;
    
    if (password !== repeatPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateStep2 = () => {
    if (userType === 'company') {
      // Sanitizar inputs
      const sanitizedCompanyName = sanitizeText(companyName);
      const sanitizedLegalName = sanitizeText(legalName);
      const sanitizedCuit = sanitizeText(cuit);
      
      if (!sanitizedCompanyName.trim()) return 'El nombre de la empresa es requerido';
      if (!sanitizedLegalName.trim()) return 'La razón social es requerida';
      if (!sanitizedCuit.trim()) return 'El CUIT es requerido';
      if (sanitizedCuit.length < 10) return 'El CUIT debe tener al menos 10 caracteres';
    }
    return null;
  };

  const validateStep3 = () => {
    if (!selectedPlan) return 'Debes seleccionar un plan';
    return null;
  };

  const nextStep = () => {
    const error = step === 1 ? validateStep1() : validateStep2();
    if (error) {
      setError(error);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep3();
    if (error) {
      setError(error);
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Plan seleccionado:', selectedPlan);
      console.log('Plan ID:', selectedPlan._id);
      
      // Sanitizar todos los datos antes de enviar
      const sanitizedUserData = {
        name: sanitizeText(name),
        email: sanitizeEmail(email),
        password: password, // No sanitizar password para no modificarla
        userType: userType === 'company' ? 'company' : 'individual', // Solo valores permitidos
        selectedPlan: selectedPlan._id
      };
      
      console.log('Datos enviados:', sanitizedUserData);

      if (userType === 'company') {
        sanitizedUserData.company = {
          name: sanitizeText(companyName),
          legalName: sanitizeText(legalName),
          taxId: sanitizeText(cuit),
          phone: sanitizeText(phone),
          address: {
            street: sanitizeText(address),
            city: sanitizeText(city),
            state: sanitizeText(state),
            postalCode: sanitizeText(postalCode),
            country: 'Argentina'
          }
        };
      }

      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedUserData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar');

      setSuccess('Usuario registrado correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(sanitizeText(err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
            step >= stepNumber
              ? 'bg-[#1F80FF] text-white shadow-lg'
              : modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
          }`}>
            {step > stepNumber ? <FiCheckCircle className="w-5 h-5" /> : stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
              step > stepNumber ? 'bg-[#1F80FF]' : modoOscuro ? 'bg-gray-700' : 'bg-gray-200'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold mb-1 ${textPri}`}>Información personal</h3>
        <p className={`text-xs ${textSec}`}>Datos básicos para crear tu cuenta.</p>
      </div>

      {/* Campo Nombre */}
      <div className="space-y-1.5">
        <label className={`block text-xs font-medium ${textSec}`}>
          Nombre completo
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiUser className={`h-4 w-4 ${textMuted}`} />
          </div>
          <input
            type="text"
            className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Tu nombre completo"
            autoFocus
          />
        </div>
      </div>

      {/* Campo Email */}
      <div className="space-y-1.5">
        <label className={`block text-xs font-medium ${textSec}`}>
          Correo electrónico
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className={`h-4 w-4 ${textMuted}`} />
          </div>
          <input
            type="email"
            className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
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
            <FiLock className={`h-4 w-4 ${textMuted}`} />
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
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${textMuted} hover:opacity-80`}
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Campo Repetir Contraseña */}
      <div className="space-y-1.5">
        <label className={`block text-xs font-medium ${textSec}`}>
          Confirmar contraseña
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className={`h-4 w-4 ${textMuted}`} />
          </div>
          <input
            type={showRepeatPassword ? "text" : "password"}
            className={`w-full pl-9 pr-9 py-2.5 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            required
            placeholder="Repite tu contraseña"
          />
          <button
            type="button"
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${textMuted} hover:opacity-80`}
            onClick={() => setShowRepeatPassword(v => !v)}
            tabIndex={-1}
            aria-label={showRepeatPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showRepeatPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={nextStep}
        className={`w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${btnPrimary}`}
      >
        Continuar
        <FiArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold mb-1 ${textPri}`}>Tipo de usuario</h3>
        <p className={`text-xs ${textSec}`}>Individual o empresa.</p>
      </div>

      {/* Selección de tipo de usuario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setUserType('individual')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            userType === 'individual'
              ? modoOscuro ? 'border-gray-500 bg-gray-800' : 'border-gray-900 bg-white'
              : modoOscuro ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userType === 'individual' ? 'bg-purple-500 text-white' : modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}>
              <FiUser className="w-5 h-5" />
            </div>
            <span className={`font-semibold ${textPri}`}>Usuario Individual</span>
          </div>
          <p className={`text-xs ${textSec}`}>
            Perfecto para freelancers y profesionales independientes
          </p>
        </button>

        <button
          type="button"
          onClick={() => setUserType('company')}
          className={`p-4 rounded-xl border transition-colors text-left ${
            userType === 'company'
              ? modoOscuro ? 'border-gray-500 bg-gray-800' : 'border-gray-900 bg-white'
              : modoOscuro ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userType === 'company' ? 'bg-purple-500 text-white' : modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}>
              <FiHome className="w-5 h-5" />
            </div>
            <span className={`font-semibold ${textPri}`}>Empresa</span>
          </div>
          <p className={`text-sm ${textSec}`}>
            Ideal para empresas que necesitan gestionar múltiples usuarios
          </p>
        </button>
      </div>

      {/* Campos específicos para empresa */}
      {userType === 'company' && (
        <div className={`space-y-4 p-4 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-semibold mb-2 flex items-center gap-2 ${textPri}`}>
            <FiHome className={`w-4 h-4 ${textSec}`} />
            Información de la empresa
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Nombre de la empresa
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Nombre comercial"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Razón social
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                placeholder="Razón social legal"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                CUIT
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={cuit}
                onChange={e => setCuit(e.target.value)}
                placeholder="XX-XXXXXXXX-X"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Teléfono
              </label>
              <input
                type="tel"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 11 XXXX-XXXX"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-medium ${textSec}`}>
                Dirección
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Calle y número"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Ciudad
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ciudad"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Provincia
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="Provincia"
              />
            </div>

            <div className="space-y-1.5">
              <label className={`block text-xs font-medium ${textSec}`}>
                Código postal
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-1 ${inputClass}`}
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="CP"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm border transition-colors flex items-center justify-center gap-2 ${btnOut}`}
        >
          <FiArrowLeft className="w-5 h-5" />
          Anterior
        </button>
        <button
          type="button"
          onClick={nextStep}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${btnPrimary}`}
        >
          Continuar
          <FiArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold mb-1 ${textPri}`}>Seleccioná tu plan</h3>
        <p className={`text-xs ${textSec}`}>Elegí el que mejor se adapte a tu negocio.</p>
      </div>

      {loadingPlans ? (
        <div className="text-center py-10">
          <div className={`animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-3 ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`}></div>
          <p className={`text-sm ${textSec}`}>Cargando planes...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-10">
          <div className={`mb-3 ${textSec}`}>
            <FiAlertCircle className="w-8 h-8 mx-auto" />
          </div>
          <p className={`text-sm mb-3 ${textSec}`}>No se pudieron cargar los planes.</p>
          <button 
            onClick={loadPlans}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${btnPrimary}`}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative p-4 rounded-xl border transition-colors cursor-pointer ${
                selectedPlan?._id === plan._id
                  ? modoOscuro ? 'border-gray-500 bg-gray-800' : 'border-gray-900 bg-white'
                  : modoOscuro ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.isPopular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className={`px-3 py-0.5 rounded-full text-[11px] font-medium ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}`}>
                    <FiStar className="w-3 h-3 inline mr-1" />
                    Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-3">
                <h4 className={`text-sm font-semibold mb-1 ${textPri}`}>{plan.name}</h4>
                <p className={`text-xs mb-2 line-clamp-2 ${textSec}`}>{plan.description}</p>
                <div className={`text-lg font-semibold ${textPri}`}>
                  ${plan.price}
                  <span className={`text-xs font-normal ${textMuted}`}>
                    /{plan.billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`${textSec}`}>Empleados máx.</span>
                  <span className={`font-semibold ${textPri}`}>{plan.maxEmployees}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${textSec}`}>Empresas máx.</span>
                  <span className={`font-semibold ${textPri}`}>{plan.maxCompanies}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${textSec}`}>Plantillas máx.</span>
                  <span className={`font-semibold ${textPri}`}>{plan.maxTemplates}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className={`font-semibold text-xs ${textPri}`}>Funcionalidades principales</h5>
                {Object.entries(plan.features).slice(0, 3).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center gap-2 text-[11px]">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modoOscuro ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
                      {enabled ? <FiCheck className="w-3 h-3" /> : <span className="text-xs">–</span>}
                    </div>
                    <span className={`${textSec}`}>
                      {getFeatureName(feature)}
                    </span>
                  </div>
                ))}
                {Object.keys(plan.features).length > 3 && (
                  <p className={`text-[11px] text-center mt-1.5 ${textMuted}`}>
                    +{Object.keys(plan.features).length - 3} más...
                  </p>
                )}
              </div>

              {selectedPlan?._id === plan._id && (
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <FiCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={prevStep}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm border transition-colors flex items-center justify-center gap-2 ${btnOut}`}
        >
          <FiArrowLeft className="w-5 h-5" />
          Anterior
        </button>
        <button
          type="submit"
          disabled={loading || !selectedPlan}
          className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${btnPrimary}`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creando cuenta...
            </>
          ) : (
            <>
              Crear cuenta
              <FiArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 ${modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]'}`}>
      {/* Contenedor principal */}
      <div className="w-full max-w-4xl">
        <div className={`${box} border rounded-2xl px-5 py-6`}>
          {/* Header */}
          <div className="text-center mb-5">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mx-auto mb-3 ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
              <FiUserPlus className={`text-lg ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
            </div>
            <h2 className={`text-lg font-semibold ${textPri}`}>
              Crear cuenta
            </h2>
            <p className={`mt-1 text-xs ${textSec}`}>
              Unite a la plataforma en 3 pasos.
            </p>
          </div>

          {/* Indicador de pasos */}
          {renderStepIndicator()}

          {/* Formulario por pasos */}
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </form>

          {/* Mensajes de estado */}
          {error && (
            <div className={`mt-4 border rounded-lg px-3 py-2 text-xs ${modoOscuro ? 'border-red-700 bg-red-900/30 text-red-200' : 'border-gray-200 text-gray-800'}`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`mt-4 border rounded-lg px-3 py-2 text-xs ${modoOscuro ? 'border-green-700 bg-green-900/30 text-green-200' : 'border-gray-200 text-gray-800'}`}>
              {success}
            </div>
          )}

          {/* Enlaces adicionales */}
          <div className={`mt-6 pt-4 border-t ${modoOscuro ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`text-center text-xs ${textSec}`}>
              ¿Ya tienes cuenta?{' '}
              <Link 
                to="/login" 
                className={`font-medium hover:underline transition-colors ${textPri}`}
              >
                Inicia sesión aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 