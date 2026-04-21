import React, { useState } from 'react';
import { FiLock, FiTrendingUp } from 'react-icons/fi';
import useDashboardPermissions from '../hooks/useDashboardPermissions';
import FeatureLockedModal from './FeatureLockedModal';

const DashboardRestriction = ({ 
  feature, 
  children, 
  fallback = null,
  showUpgradeButton = true,
  className = '',
  onUpgradeClick 
}) => {
  const { isDashboardFeatureAvailable, userPlan, getFeatureRestrictionMessage } = useDashboardPermissions();
  const [showModal, setShowModal] = useState(false);

  // Si la funcionalidad está disponible, mostrar el contenido
  if (isDashboardFeatureAvailable(feature)) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, mostrarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Función para manejar el click de upgrade
  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowModal(true);
    }
  };

  // Fallback por defecto
  const defaultFallback = (
    <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ${className}`}>
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiLock className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Funcionalidad Bloqueada
      </h3>
      
      <p className="text-gray-600 mb-4 text-sm">
        {getFeatureRestrictionMessage(feature)}
      </p>

      {showUpgradeButton && (
        <button
          onClick={handleUpgradeClick}
          className="bg-[#1F80FF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#004AAD] transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <FiTrendingUp className="w-4 h-4 inline mr-2" />
          Actualizar Plan
        </button>
      )}
    </div>
  );

  return (
    <>
      {defaultFallback}
      
      {/* Modal de funcionalidad bloqueada */}
      <FeatureLockedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureName={feature}
        currentPlan={userPlan}
        onUpgrade={(plan) => {
          setShowModal(false);
          // Redirigir a la página de planes
          window.location.href = '/planes';
        }}
      />
    </>
  );
};

// Componente de restricción con mensaje personalizado
export const DashboardRestrictionWithMessage = ({ 
  feature, 
  children, 
  message = "Esta funcionalidad del dashboard requiere un plan superior",
  showUpgradeButton = true,
  className = ''
}) => {
  const { isDashboardFeatureAvailable } = useDashboardPermissions();

  if (isDashboardFeatureAvailable(feature)) {
    return <>{children}</>;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <FiLock className="w-4 h-4 text-yellow-600" />
        </div>
        
        <div className="flex-1">
          <p className="text-yellow-800 text-sm">{message}</p>
          
          {showUpgradeButton && (
            <button
              onClick={() => window.location.href = '/planes'}
              className="mt-2 text-yellow-700 hover:text-yellow-800 font-medium text-sm underline"
            >
              Ver planes disponibles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de restricción con límite específico
export const DashboardRestrictionWithLimit = ({ 
  feature, 
  children, 
  currentCount = 0,
  limit = 0,
  message = "Has alcanzado el límite de tu plan para esta funcionalidad del dashboard",
  showUpgradeButton = true,
  className = ''
}) => {
  const { isDashboardFeatureAvailable } = useDashboardPermissions();

  // Si la funcionalidad no está disponible o se ha alcanzado el límite
  if (!isDashboardFeatureAvailable(feature) || currentCount >= limit) {
    return (
      <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FiLock className="w-4 h-4 text-orange-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-orange-800 text-sm">
              {!isDashboardFeatureAvailable(feature) ? "Funcionalidad del dashboard no disponible" : message}
            </p>
            
            {currentCount > 0 && limit > 0 && (
              <p className="text-orange-700 text-xs mt-1">
                Uso actual: {currentCount}/{limit}
              </p>
            )}
            
            {showUpgradeButton && (
              <button
                onClick={() => window.location.href = '/planes'}
                className="mt-2 text-orange-700 hover:text-orange-800 font-medium text-sm underline"
              >
                Actualizar plan
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DashboardRestriction;
