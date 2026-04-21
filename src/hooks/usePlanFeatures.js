import { useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

const usePlanFeatures = () => {
  const { user } = useContext(AuthContext);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const createDefaultPlan = useCallback(() => {
    // Plan gratuito por defecto
    const defaultPlan = {
      name: 'Gratuito',
      slug: 'free',
      price: 0,
      features: {
        basicInvoicing: true,
        basicTemplates: true,
        customTemplates: false,
        logoUpload: false,
        companyBranding: false,
        employeeAccounts: false,
        multiCompany: false,
        advancedAnalytics: false,
        prioritySupport: false
      },
      maxTemplates: 1,
      maxEmployees: 1,
      maxCompanies: 1,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    };
    setUserPlan(defaultPlan);
    setLoading(false);
  }, []);

  const createPlanFromFeatures = useCallback((unlockedFeatures) => {
    // Determinar el plan basado en las funcionalidades desbloqueadas
    let planName = 'Gratuito';
    let planSlug = 'free';
    let maxTemplates = 1;
    let maxEmployees = 1;
    let maxCompanies = 1;
    
    // Verificar si es Enterprise (todas las funcionalidades avanzadas)
    if (unlockedFeatures.advancedAnalytics && 
        unlockedFeatures.prioritySupport && 
        unlockedFeatures.employeeAccounts && 
        unlockedFeatures.multiCompany &&
        unlockedFeatures.customTemplates &&
        unlockedFeatures.logoUpload &&
        unlockedFeatures.companyBranding) {
      planName = 'Enterprise';
      planSlug = 'enterprise';
      maxTemplates = 100;
      maxEmployees = 100;
      maxCompanies = 10;
    } else if (unlockedFeatures.employeeAccounts && unlockedFeatures.multiCompany) {
      planName = 'Empresarial';
      planSlug = 'business';
      maxTemplates = 25;
      maxEmployees = 20;
      maxCompanies = 5;
    } else if (unlockedFeatures.customTemplates && unlockedFeatures.logoUpload) {
      planName = 'Profesional';
      planSlug = 'professional';
      maxTemplates = 10;
      maxEmployees = 5;
      maxCompanies = 2;
    } else if (unlockedFeatures.basicInvoicing && unlockedFeatures.basicTemplates) {
      planName = 'Básico';
      planSlug = 'basic';
      maxTemplates = 3;
      maxEmployees = 1;
      maxCompanies = 1;
    }
    
    return {
      name: planName,
      slug: planSlug,
      price: 0, // No tenemos precio en este contexto
      features: unlockedFeatures,
      maxTemplates,
      maxEmployees,
      maxCompanies,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    };
  }, []);

  const loadUserPlan = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 usePlanFeatures: Usuario recibido:', user);
      console.log('🔍 usePlanFeatures: Plan del usuario:', user?.currentPlan);
      console.log('🔍 usePlanFeatures: Tipo de currentPlan:', typeof user?.currentPlan);
      console.log('🔍 usePlanFeatures: currentPlan._id existe:', !!user?.currentPlan?._id);
      console.log('🔍 usePlanFeatures: unlockedFeatures:', user?.unlockedFeatures);
      
      // Si el usuario tiene un plan asignado, usarlo directamente
      if (user?.currentPlan && user.currentPlan._id) {
        console.log('✅ usePlanFeatures: Usando plan del usuario:', user.currentPlan.name);
        console.log('✅ usePlanFeatures: Plan completo:', user.currentPlan);
        setUserPlan(user.currentPlan);
      } else if (user?.unlockedFeatures) {
        // Si no tiene currentPlan pero sí unlockedFeatures, crear plan basado en eso
        console.log('⚠️ usePlanFeatures: No hay currentPlan, usando unlockedFeatures');
        const planFromFeatures = createPlanFromFeatures(user.unlockedFeatures);
        setUserPlan(planFromFeatures);
      } else {
        // Si no tiene plan, crear uno gratuito por defecto
        console.log('❌ usePlanFeatures: No hay plan, creando plan gratuito por defecto');
        createDefaultPlan();
      }
    } catch (error) {
      console.error('❌ usePlanFeatures: Error al cargar plan del usuario:', error);
      createDefaultPlan();
    } finally {
      setLoading(false);
    }
  }, [user, createDefaultPlan, createPlanFromFeatures]);

  // Verificar si una funcionalidad está disponible
  const isFeatureAvailable = (featureName) => {
    if (!userPlan) return false;
    return userPlan.features[featureName] || false;
  };

  // Verificar si el usuario puede acceder a una funcionalidad
  const canAccessFeature = (featureName) => {
    if (!userPlan) return false;
    return userPlan.features[featureName] || false;
  };

  // Obtener el estado del plan del usuario
  const getUserPlanStatus = () => {
    if (!userPlan) return 'free';
    if (userPlan.slug === 'basic') return 'basic';
    if (userPlan.slug === 'professional') return 'professional';
    if (userPlan.slug === 'business') return 'business';
    if (userPlan.slug === 'enterprise') return 'enterprise';
    return 'free';
  };

  // Verificar si un plan es mejor que el actual
  const isPlanUpgrade = (plan) => {
    const currentStatus = getUserPlanStatus();
    const planStatus = plan.slug;
    
    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'professional': 2,
      'business': 3,
      'enterprise': 4
    };
    
    return planHierarchy[planStatus] > planHierarchy[currentStatus];
  };

  // Obtener el color del plan actual
  const getCurrentPlanColor = () => {
    const status = getUserPlanStatus();
    const colors = {
      'free': 'text-gray-500',
      'basic': 'text-blue-500',
      'professional': 'text-purple-500',
      'business': 'text-indigo-500',
      'enterprise': 'text-green-500'
    };
    return colors[status] || 'text-gray-500';
  };

  // Verificar límites del plan
  const checkPlanLimits = (limitType, currentCount) => {
    if (!userPlan) return { canProceed: false, message: 'Sin plan activo' };
    
    const limits = {
      'templates': userPlan.maxTemplates,
      'employees': userPlan.maxEmployees,
      'companies': userPlan.maxCompanies
    };
    
    const limit = limits[limitType];
    if (currentCount >= limit) {
      return {
        canProceed: false,
        message: `Has alcanzado el límite de ${limitType} para tu plan (${limit})`,
        upgradeRequired: true
      };
    }
    
    return { canProceed: true, remaining: limit - currentCount };
  };

  // Obtener funcionalidades disponibles
  const getAvailableFeatures = () => {
    if (!userPlan) return [];
    
    return Object.entries(userPlan.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature);
  };

  // Obtener funcionalidades bloqueadas
  const getBlockedFeatures = () => {
    if (!userPlan) return [];
    
    return Object.entries(userPlan.features)
      .filter(([_, enabled]) => !enabled)
      .map(([feature, _]) => feature);
  };

  return {
    userPlan,
    loading,
    isFeatureAvailable,
    canAccessFeature,
    getUserPlanStatus,
    isPlanUpgrade,
    getCurrentPlanColor,
    checkPlanLimits,
    getAvailableFeatures,
    getBlockedFeatures,
    reloadPlan: loadUserPlan
  };
};

export default usePlanFeatures;
