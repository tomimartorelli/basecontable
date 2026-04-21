// Utilidades para manejar planes y funcionalidades
export const getFeatureIcon = (feature) => {
  const iconMap = {
    basicInvoicing: 'FiCreditCard',
    basicTemplates: 'FiImage',
    customTemplates: 'FiImage',
    logoUpload: 'FiImage',
    companyBranding: 'FiHome',
    employeeAccounts: 'FiUsers',
    multiCompany: 'FiBriefcase',
    advancedAnalytics: 'FiTrendingUp',
    prioritySupport: 'FiHeadphones'
  };
  return iconMap[feature] || 'FiCheckCircle';
};

export const getFeatureName = (feature) => {
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

export const getFeatureDescription = (feature) => {
  const featureDescriptions = {
    basicInvoicing: 'Crear y gestionar registros de venta básicos con plantillas predefinidas',
    basicTemplates: 'Acceso a plantillas de registro estándar',
    customTemplates: 'Diseñar y personalizar plantillas únicas para tu marca',
    logoUpload: 'Subir y usar tu logo personalizado en todos tus registros PDF',
    companyBranding: 'Personalizar colores, fuentes y estilos de tu empresa',
    employeeAccounts: 'Crear cuentas para empleados con permisos específicos',
    multiCompany: 'Gestionar múltiples empresas desde una sola cuenta',
    advancedAnalytics: 'Reportes detallados y métricas de ventas',
    prioritySupport: 'Soporte técnico prioritario con respuesta garantizada'
  };
  return featureDescriptions[feature] || 'Funcionalidad disponible en este plan';
};

export const getPlanRecommendation = (userType, needs) => {
  if (userType === 'individual') {
    if (needs.includes('basic')) return 'Básico';
    if (needs.includes('professional')) return 'Profesional';
    return 'Básico';
  } else if (userType === 'company') {
    if (needs.includes('enterprise')) return 'Enterprise';
    if (needs.includes('business')) return 'Empresarial';
    if (needs.includes('professional')) return 'Profesional';
    return 'Profesional';
  }
  return 'Básico';
};

export const validatePlanSelection = (plan, userType) => {
  const errors = [];
  
  if (userType === 'company') {
    if (plan.maxEmployees < 2) {
      errors.push('Este plan no permite múltiples empleados');
    }
    if (!plan.features.companyBranding) {
      errors.push('Este plan no incluye personalización de marca');
    }
  }
  
  if (userType === 'individual' && plan.maxEmployees > 1) {
    errors.push('Este plan incluye funcionalidades que no necesitas como usuario individual');
  }
  
  return errors;
};

export const getPlanComparison = (plans) => {
  return plans.map(plan => ({
    ...plan,
    featureCount: Object.values(plan.features).filter(Boolean).length,
    isRecommended: plan.isPopular,
    pricePerFeature: plan.price / Object.values(plan.features).filter(Boolean).length
  }));
};

export const formatPrice = (price, billingCycle) => {
  const monthlyPrice = billingCycle === 'yearly' ? price / 12 : price;
  const yearlyPrice = billingCycle === 'monthly' ? price * 12 : price;
  
  return {
    monthly: monthlyPrice.toFixed(2),
    yearly: yearlyPrice.toFixed(2),
    savings: billingCycle === 'yearly' ? ((price * 12 - price) / (price * 12) * 100).toFixed(0) : 0
  };
};

export const getPlanLimits = (plan) => {
  return {
    invoices: plan.maxInvoices || 'Ilimitado',
    clients: plan.maxClients || 'Ilimitado',
    employees: plan.maxEmployees || 'Ilimitado',
    companies: plan.maxCompanies || 'Ilimitado',
    templates: plan.maxTemplates || 'Ilimitado',
    storage: plan.maxStorage || '5GB'
  };
};

export const isPlanUpgrade = (currentPlan, newPlan) => {
  const planHierarchy = {
    'basico': 1,
    'profesional': 2,
    'empresarial': 3,
    'enterprise': 4
  };
  
  const currentLevel = planHierarchy[currentPlan?.slug] || 0;
  const newLevel = planHierarchy[newPlan?.slug] || 0;
  
  return newLevel > currentLevel;
};

export const getUpgradeBenefits = (currentPlan, newPlan) => {
  const benefits = [];
  
  if (!currentPlan) return ['Acceso completo a todas las funcionalidades'];
  
  Object.entries(newPlan.features).forEach(([feature, enabled]) => {
    if (enabled && !currentPlan.features[feature]) {
      benefits.push(getFeatureName(feature));
    }
  });
  
  return benefits;
};
