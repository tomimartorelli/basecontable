import React, { useState, useEffect, useContext } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiInfo, FiShield, FiTrendingUp, FiLock } from 'react-icons/fi';
import usePlanFeatures from '../hooks/usePlanFeatures';
import { ThemeContext } from '../context/ThemeContext';

const PlanIndicator = ({ 
  showFeatures = false, 
  className = '', 
  onUpgradeClick 
}) => {
  const { modoOscuro } = useContext(ThemeContext);
  const { 
    userPlan, 
    loading, 
    getCurrentPlanColor, 
    getAvailableFeatures,
    getBlockedFeatures 
  } = usePlanFeatures();
  
  const [showFeatureDetails, setShowFeatureDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-100';
  const notifBg = modoOscuro ? 'bg-gray-800/50' : 'bg-gray-50';
  const notifWarning = modoOscuro ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700' : 'bg-yellow-50 text-yellow-800 border-yellow-200';
  const notifInfo = modoOscuro ? 'bg-blue-900/30 text-blue-200 border-blue-700' : 'bg-blue-50 text-blue-800 border-blue-200';

  useEffect(() => {
    if (userPlan) {
      checkPlanLimits(userPlan);
    }
  }, [userPlan]);

  const checkPlanLimits = (plan) => {
    const newNotifications = [];
    
    // Verificar límites de plantillas
    if (plan.maxTemplates === 1) {
      newNotifications.push({
        type: 'warning',
        message: 'Plan gratuito: Solo puedes crear 1 plantilla',
        action: 'upgrade'
      });
    }
    
    // Verificar límites de empleados
    if (plan.maxEmployees === 1) {
      newNotifications.push({
        type: 'info',
        message: 'Plan gratuito: No puedes invitar empleados',
        action: 'upgrade'
      });
    }
    
    // Verificar límites de empresas
    if (plan.maxCompanies === 1) {
      newNotifications.push({
        type: 'info',
        message: 'Plan gratuito: Solo puedes crear 1 empresa',
        action: 'upgrade'
      });
    }
    
    setNotifications(newNotifications);
  };

  if (loading) {
    return (
      <div className={`rounded-lg p-3 ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'} ${className}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full ${modoOscuro ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          <div className={`h-4 rounded w-24 ${modoOscuro ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    );
  }

  if (!userPlan) {
    return (
      <div className={`rounded-lg p-3 border-2 ${box} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiShield className={`w-5 h-5 ${textMuted}`} />
            <div>
              <p className={`text-sm font-semibold ${textSec}`}>Plan Gratuito</p>
              <p className={`text-xs ${textMuted}`}>Funcionalidades limitadas</p>
            </div>
          </div>
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <FiTrendingUp className="w-3 h-3 inline mr-1" />
              Actualizar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Estado del plan no utilizado directamente
  const planColor = getCurrentPlanColor();
  const availableFeatures = getAvailableFeatures();
  const blockedFeatures = getBlockedFeatures();

  return (
    <div className={`rounded-lg shadow-sm border-2 ${box} ${className}`}>
      {/* Header del plan */}
      <div className={`p-4 border-b ${divide}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${planColor.replace('text-', 'bg-')} bg-opacity-20`}>
              <FiShield className={`w-4 h-4 ${planColor}`} />
            </div>
            <div>
              <p className={`font-semibold ${textPri}`}>{userPlan.name}</p>
              <p className={`text-xs ${textMuted}`}>{userPlan.description}</p>
            </div>
          </div>
          
          {onUpgradeClick && blockedFeatures.length > 0 && (
            <button
              onClick={onUpgradeClick}
              className="bg-[#1F80FF] text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-[#004AAD] transition-all duration-300"
            >
              <FiTrendingUp className="w-3 h-3 inline mr-1" />
              Mejorar
            </button>
          )}
        </div>
      </div>

      {/* Notificaciones de límites */}
      {notifications.length > 0 && (
        <div className={`p-4 border-b ${divide} ${notifBg}`}>
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <div key={index} className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                notification.type === 'warning' ? notifWarning : notifInfo
              }`}>
                {notification.type === 'warning' ? (
                  <FiAlertTriangle className={`w-3 h-3 ${modoOscuro ? 'text-yellow-400' : 'text-yellow-600'}`} />
                ) : (
                  <FiInfo className={`w-3 h-3 ${modoOscuro ? 'text-blue-400' : 'text-blue-600'}`} />
                )}
                <span className="flex-1">{notification.message}</span>
                {notification.action === 'upgrade' && onUpgradeClick && (
                  <button
                    onClick={onUpgradeClick}
                    className="text-xs font-medium hover:underline"
                  >
                    Ver planes
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funcionalidades si están habilitadas */}
      {showFeatures && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-semibold ${textSec}`}>Funcionalidades</h4>
            <button
              onClick={() => setShowFeatureDetails(!showFeatureDetails)}
              className={`text-xs transition-colors ${modoOscuro ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              {showFeatureDetails ? 'Ocultar' : 'Ver detalles'}
            </button>
          </div>

          {showFeatureDetails && (
            <div className="space-y-2">
              {/* Funcionalidades disponibles */}
              {availableFeatures.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-green-800/50 text-green-300' : 'bg-green-100 text-green-600'}`}>
                    <FiCheck className="w-2 h-2" />
                  </div>
                  <span className={textSec}>{getFeatureDisplayName(feature)}</span>
                </div>
              ))}
              
              {/* Funcionalidades bloqueadas */}
              {blockedFeatures.map(feature => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
                    <FiX className="w-2 h-2" />
                  </div>
                  <span className={textMuted}>{getFeatureDisplayName(feature)}</span>
                  <FiLock className={`w-3 h-3 ${textMuted}`} />
                </div>
              ))}
            </div>
          )}

          {/* Resumen de funcionalidades */}
          <div className={`flex items-center justify-between text-xs mt-3 pt-3 border-t ${divide} ${textMuted}`}>
            <span>{availableFeatures.length} funcionalidades disponibles</span>
            {blockedFeatures.length > 0 && (
              <span className={modoOscuro ? 'text-orange-400' : 'text-orange-600'}>
                {blockedFeatures.length} bloqueadas
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Función auxiliar para obtener nombres legibles de funcionalidades
const getFeatureDisplayName = (feature) => {
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

export default PlanIndicator;
