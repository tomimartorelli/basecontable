import React from 'react';
import { FiLock, FiTrendingUp, FiStar } from 'react-icons/fi';

const FeatureLockedModal = ({ 
  isOpen, 
  onClose, 
  featureName, 
  currentPlan, 
  suggestedPlan, 
  onUpgrade 
}) => {
  if (!isOpen) return null;

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

  const getFeatureDescription = (feature) => {
    const descriptions = {
      customTemplates: 'Crea plantillas personalizadas con tu logo, colores y estilo de marca.',
      logoUpload: 'Sube tu logo personalizado para que aparezca en todos tus registros PDF.',
      companyBranding: 'Personaliza completamente la apariencia de tus documentos internos con tu marca.',
      employeeAccounts: 'Invita empleados a tu empresa para que gestionen la contabilidad.',
      multiCompany: 'Gestiona múltiples empresas desde una sola cuenta.',
      advancedAnalytics: 'Obtén reportes detallados y análisis avanzados de tu negocio.',
      prioritySupport: 'Acceso prioritario a nuestro equipo de soporte técnico.'
    };
    return descriptions[feature] || 'Esta funcionalidad no está disponible en tu plan actual.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Header */}
          <div className="w-20 h-20 bg-[#004AAD] rounded-full flex items-center justify-center mx-auto mb-6">
            <FiLock className="w-10 h-10 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Funcionalidad Bloqueada
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            <strong className="text-red-600">{getFeatureDisplayName(featureName)}</strong> no está 
            disponible en tu plan actual <strong>{currentPlan?.name || 'Gratuito'}</strong>.
          </p>

          {/* Descripción de la funcionalidad */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-gray-700 text-sm leading-relaxed">
              {getFeatureDescription(featureName)}
            </p>
          </div>

          {/* Plan sugerido */}
          {suggestedPlan && (
            <div className="bg-white rounded-xl p-6 mb-6 border-2 border-blue-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <FiStar className="w-5 h-5 text-yellow-500" />
                <h4 className="font-bold text-gray-900">Plan Recomendado</h4>
              </div>
              
              <div className="text-center mb-4">
                <h5 className="text-xl font-bold text-gray-900 mb-2">
                  {suggestedPlan.name}
                </h5>
                <p className="text-gray-600 text-sm mb-3">
                  {suggestedPlan.description}
                </p>
                <div className="text-2xl font-bold text-blue-600">
                  ${suggestedPlan.price}
                  <span className="text-sm text-gray-500 font-normal">
                    /{suggestedPlan.billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onUpgrade(suggestedPlan)}
                className="w-full bg-[#1F80FF] text-white py-3 px-6 rounded-xl font-bold hover:bg-[#004AAD] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FiTrendingUp className="w-4 h-4 inline mr-2" />
                Actualizar a {suggestedPlan.name}
              </button>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              Cerrar
            </button>
            
            {!suggestedPlan && (
              <button
                onClick={() => window.location.href = '/planes'}
                className="flex-1 py-3 px-6 bg-[#1F80FF] text-white rounded-xl font-semibold hover:bg-[#004AAD] transition-all duration-300"
              >
                Ver Planes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureLockedModal;
