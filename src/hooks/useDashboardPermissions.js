import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import useAdminPermissions from './useAdminPermissions';

const useDashboardPermissions = () => {
  const { user } = useContext(AuthContext);
  const { userPlan, loading: planLoading, error: planError } = useAdminPermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log detallado del estado actual - Solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 useDashboardPermissions DEBUG - Estado actual:', {
        user: user ? {
          email: user.email,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          hasCurrentPlan: !!user.currentPlan,
          currentPlanId: user.currentPlan?._id,
          currentPlanName: user.currentPlan?.name,
          currentPlanSlug: user.currentPlan?.slug
        } : 'No user',
        userPlan: userPlan ? {
          name: userPlan.name,
          slug: userPlan.slug,
          hasDashboardPermissions: !!userPlan.dashboardPermissions,
          dashboardPermissionsKeys: userPlan.dashboardPermissions ? Object.keys(userPlan.dashboardPermissions) : [],
          hasAdminPanelPermissions: !!userPlan.adminPanelPermissions,
          adminPanelPermissionsKeys: userPlan.adminPanelPermissions ? Object.keys(userPlan.adminPanelPermissions) : []
        } : 'No userPlan',
        planLoading,
        planError
      });
    }
  }, [user, userPlan, planLoading, planError]);

  // Verificar si puede acceder al dashboard
  const canAccessDashboard = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 canAccessDashboard: Ejecutándose...');
    }
    
    if (!user || !userPlan) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 canAccessDashboard: No hay usuario o plan:', { user: !!user, userPlan: !!userPlan });
      }
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 canAccessDashboard DEBUG:', {
        user: {
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          email: user.email
        },
        userPlan: {
          name: userPlan.name,
          slug: userPlan.slug,
          hasDashboardPermissions: !!userPlan.dashboardPermissions,
          dashboardPermissionsContent: userPlan.dashboardPermissions
        }
      });
    }
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ canAccessDashboard: Super Admin detectado, acceso total');
      }
      return true;
    }
    
    // Regla de negocio fuerte basada SOLO en el slug del plan:
    // - Gratuito/Básico: sin acceso
    // - Profesional / Empresarial / Enterprise: acceso al dashboard
    const planSlug = (userPlan.slug || '').toLowerCase();
    const hasAccess = ['profesional', 'empresarial', 'enterprise'].includes(planSlug);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 canAccessDashboard por slug:', { planSlug, hasAccess });
    }

    return hasAccess;
  }, [user, userPlan]);

  // Verificar si puede ver analytics
  const canViewAnalytics = useCallback(() => {
    if (!user || !userPlan) return false;
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      return true;
    }
    
    // Si el plan no tiene dashboardPermissions configurado, usar lógica de fallback
    if (!userPlan.dashboardPermissions) {
      console.log('⚠️ canViewAnalytics: Plan no tiene dashboardPermissions configurado, usando fallback');
      
      // Lógica de fallback basada en el slug del plan
      const planSlug = userPlan.slug;
      return ['profesional', 'empresarial', 'enterprise'].includes(planSlug);
    }
    
    // Verificar permisos del plan
    return userPlan.dashboardPermissions.canViewAnalytics || false;
  }, [user, userPlan]);

  // Verificar si puede ver gráficos
  const canViewCharts = useCallback(() => {
    console.log('🔍 canViewCharts: Ejecutándose...');
    
    if (!user || !userPlan) {
      console.log('🔍 canViewCharts: No hay usuario o plan:', { user: !!user, userPlan: !!userPlan });
      return false;
    }
    
    console.log('🔍 canViewCharts DEBUG:', {
      user: {
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        email: user.email
      },
      userPlan: {
        name: userPlan.name,
        slug: userPlan.slug,
        hasDashboardPermissions: !!userPlan.dashboardPermissions,
        dashboardPermissionsContent: userPlan.dashboardPermissions
      }
    });
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      console.log('✅ canViewCharts: Super Admin detectado, acceso total');
      return true;
    }
    
    // Si el plan no tiene dashboardPermissions configurado, usar lógica de fallback
    if (!userPlan.dashboardPermissions) {
      console.log('⚠️ canViewCharts: Plan no tiene dashboardPermissions configurado, usando fallback');
      
      // Lógica de fallback basada en el slug del plan
      const planSlug = userPlan.slug;
      const hasAccess = ['profesional', 'empresarial', 'enterprise'].includes(planSlug);
      console.log('🔍 canViewCharts: Fallback - Plan', planSlug, '- Acceso:', hasAccess);
      return hasAccess;
    }
    
    // Verificar permisos del plan
    const hasAccess = userPlan.dashboardPermissions.canViewCharts || false;
    console.log('🔍 canViewCharts: Permisos del plan:', {
      canViewCharts: userPlan.dashboardPermissions.canViewCharts,
      result: hasAccess
    });
    
    return hasAccess;
  }, [user, userPlan]);

  // Verificar si puede ver estadísticas avanzadas
  const canViewAdvancedStats = useCallback(() => {
    if (!user || !userPlan) return false;
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      return true;
    }
    
    // Verificar permisos del plan
    return userPlan.dashboardPermissions?.canViewAdvancedStats || false;
  }, [user, userPlan]);

  // Verificar si puede exportar datos
  const canExportData = useCallback(() => {
    console.log('🔍 canExportData: Ejecutándose...');
    
    if (!user || !userPlan) {
      console.log('🔍 canExportData: No hay usuario o plan:', { user: !!user, userPlan: !!userPlan });
      return false;
    }
    
    console.log('🔍 canExportData DEBUG:', {
      user: {
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        email: user.email
      },
      userPlan: {
        name: userPlan.name,
        slug: userPlan.slug,
        hasDashboardPermissions: !!userPlan.dashboardPermissions,
        dashboardPermissionsContent: userPlan.dashboardPermissions
      }
    });
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      console.log('✅ canExportData: Super Admin detectado, acceso total');
      return true;
    }
    
    // Si el plan no tiene dashboardPermissions configurado, usar lógica de fallback
    if (!userPlan.dashboardPermissions) {
      console.log('⚠️ canExportData: Plan no tiene dashboardPermissions configurado, usando fallback');
      
      // Lógica de fallback basada en el slug del plan
      const planSlug = userPlan.slug;
      const hasAccess = ['empresarial', 'enterprise'].includes(planSlug);
      console.log('🔍 canExportData: Fallback - Plan', planSlug, '- Acceso:', hasAccess);
      return hasAccess;
    }
    
    // Verificar permisos del plan
    const hasAccess = userPlan.dashboardPermissions.canExportData || false;
    console.log('🔍 canExportData: Permisos del plan:', {
      canExportData: userPlan.dashboardPermissions.canExportData,
      result: hasAccess
    });
    
    return hasAccess;
  }, [user, userPlan]);

  // Verificar si puede ver datos en tiempo real
  const canViewRealTimeData = useCallback(() => {
    if (!user || !userPlan) return false;
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      return true;
    }
    
    // Verificar permisos del plan
    return userPlan.dashboardPermissions?.canViewRealTimeData || false;
  }, [user, userPlan]);

  // Obtener nivel de acceso al dashboard
  const getDashboardAccessLevel = useCallback(() => {
    if (!user || !userPlan) return 'none';
    
    // Super admin tiene acceso completo
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      return 'full';
    }
    
    // Verificar permisos del plan
    const permissions = userPlan.dashboardPermissions;
    if (!permissions) return 'none';
    
    // Determinar nivel basado en permisos
    if (permissions.canViewRealTimeData && permissions.canExportData && permissions.canViewAdvancedStats) {
      return 'premium';
    } else if (permissions.canViewCharts && permissions.canViewAnalytics) {
      return 'standard';
    } else if (permissions.canViewDashboard) {
      return 'basic';
    }
    
    return 'none';
  }, [user, userPlan]);

  // Verificar si tiene acceso completo al dashboard
  const hasFullDashboardAccess = useCallback(() => {
    return getDashboardAccessLevel() === 'full';
  }, [getDashboardAccessLevel]);

  // Verificar si tiene acceso premium al dashboard
  const hasPremiumDashboardAccess = useCallback(() => {
    const level = getDashboardAccessLevel();
    return level === 'full' || level === 'premium';
  }, [getDashboardAccessLevel]);

  // Verificar si tiene acceso estándar al dashboard
  const hasStandardDashboardAccess = useCallback(() => {
    const level = getDashboardAccessLevel();
    return level === 'full' || level === 'premium' || level === 'standard';
  }, [getDashboardAccessLevel]);

  // Obtener funcionalidades disponibles del dashboard
  const getAvailableDashboardFeatures = useCallback(() => {
    if (!userPlan?.dashboardPermissions) return [];
    
    const permissions = userPlan.dashboardPermissions;
    const availableFeatures = [];
    
    if (permissions.canViewDashboard) availableFeatures.push('dashboard');
    if (permissions.canViewAnalytics) availableFeatures.push('analytics');
    if (permissions.canViewCharts) availableFeatures.push('charts');
    if (permissions.canViewAdvancedStats) availableFeatures.push('advancedStats');
    if (permissions.canExportData) availableFeatures.push('exportData');
    if (permissions.canViewRealTimeData) availableFeatures.push('realTimeData');
    
    return availableFeatures;
  }, [userPlan]);

  // Obtener funcionalidades bloqueadas del dashboard
  const getBlockedDashboardFeatures = useCallback(() => {
    if (!userPlan?.dashboardPermissions) return [];
    
    const permissions = userPlan.dashboardPermissions;
    const blockedFeatures = [];
    
    if (!permissions.canViewAnalytics) blockedFeatures.push('analytics');
    if (!permissions.canViewCharts) blockedFeatures.push('charts');
    if (!permissions.canViewAdvancedStats) blockedFeatures.push('advancedStats');
    if (!permissions.canExportData) blockedFeatures.push('exportData');
    if (!permissions.canViewRealTimeData) blockedFeatures.push('realTimeData');
    
    return blockedFeatures;
  }, [userPlan]);

  // Verificar si una funcionalidad específica del dashboard está disponible
  const isDashboardFeatureAvailable = useCallback((featureName) => {
    console.log('🔍 isDashboardFeatureAvailable: Ejecutándose para feature:', featureName);
    
    if (!user || !userPlan) {
      console.log('🔍 isDashboardFeatureAvailable: No hay usuario o plan:', { user: !!user, userPlan: !!userPlan });
      return false;
    }
    
    console.log('🔍 isDashboardFeatureAvailable DEBUG:', {
      featureName,
      user: {
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        email: user.email
      },
      userPlan: {
        name: userPlan.name,
        slug: userPlan.slug,
        hasDashboardPermissions: !!userPlan.dashboardPermissions,
        dashboardPermissionsContent: userPlan.dashboardPermissions
      }
    });
    
    // Super admin siempre tiene acceso
    if (user.role === 'admin' && user.isSuperAdmin === true) {
      console.log('✅ isDashboardFeatureAvailable: Super Admin detectado, acceso total');
      return true;
    }
    
    // Si el plan no tiene dashboardPermissions configurado, usar lógica de fallback
    if (!userPlan.dashboardPermissions) {
      console.log('⚠️ isDashboardFeatureAvailable: Plan no tiene dashboardPermissions configurado, usando fallback');
      
      // Lógica de fallback basada en el slug del plan y la funcionalidad
      const planSlug = userPlan.slug;
      
      switch (featureName) {
        case 'canViewAnalytics':
        case 'canViewCharts':
          const hasAccess1 = ['profesional', 'empresarial', 'enterprise'].includes(planSlug);
          console.log('🔍 isDashboardFeatureAvailable: Fallback - Plan', planSlug, 'Feature', featureName, '- Acceso:', hasAccess1);
          return hasAccess1;
        case 'canViewAdvancedStats':
        case 'canExportData':
          const hasAccess2 = ['empresarial', 'enterprise'].includes(planSlug);
          console.log('🔍 isDashboardFeatureAvailable: Fallback - Plan', planSlug, 'Feature', featureName, '- Acceso:', hasAccess2);
          return hasAccess2;
        case 'canViewRealTimeData':
          const hasAccess3 = planSlug === 'enterprise';
          console.log('🔍 isDashboardFeatureAvailable: Fallback - Plan', planSlug, 'Feature', featureName, '- Acceso:', hasAccess3);
          return hasAccess3;
        default:
          console.log('🔍 isDashboardFeatureAvailable: Fallback - Feature desconocida:', featureName);
          return false;
      }
    }
    
    // Verificar permisos del plan
    const hasAccess = userPlan.dashboardPermissions[featureName] || false;
    console.log('🔍 isDashboardFeatureAvailable: Permisos del plan:', {
      featureName,
      permission: userPlan.dashboardPermissions[featureName],
      result: hasAccess
    });
    
    return hasAccess;
  }, [user, userPlan]);

  // Obtener mensaje de restricción para una funcionalidad
  const getFeatureRestrictionMessage = useCallback((featureName) => {
    if (!userPlan) return 'Plan no disponible';
    
    const planName = userPlan.name;
    const featureNames = {
      'canViewAnalytics': 'Analytics Avanzados',
      'canViewCharts': 'Gráficos y Visualizaciones',
      'canViewAdvancedStats': 'Estadísticas Avanzadas',
      'canExportData': 'Exportación de Datos',
      'canViewRealTimeData': 'Datos en Tiempo Real'
    };
    
    const featureDisplayName = featureNames[featureName] || featureName;
    return `${featureDisplayName} no está disponible en tu plan actual (${planName}). Actualiza tu plan para acceder a esta funcionalidad.`;
  }, [userPlan]);

  // Obtener plan recomendado para una funcionalidad
  const getRecommendedPlanForFeature = useCallback((featureName) => {
    const planRecommendations = {
      'canViewAnalytics': 'Profesional',
      'canViewCharts': 'Profesional',
      'canViewAdvancedStats': 'Empresarial',
      'canExportData': 'Empresarial',
      'canViewRealTimeData': 'Enterprise'
    };
    
    return planRecommendations[featureName] || 'Empresarial';
  }, []);

  // Verificar si el usuario necesita actualizar su plan
  const needsPlanUpgrade = useCallback(() => {
    if (!userPlan) return true;
    
    const level = getDashboardAccessLevel();
    return level === 'none' || level === 'basic';
  }, [userPlan, getDashboardAccessLevel]);

  // Obtener información del plan actual para el dashboard
  const getCurrentPlanInfo = useCallback(() => {
    if (!userPlan) return null;
    
    return {
      name: userPlan.name,
      slug: userPlan.slug,
      accessLevel: getDashboardAccessLevel(),
      availableFeatures: getAvailableDashboardFeatures(),
      blockedFeatures: getBlockedDashboardFeatures(),
      needsUpgrade: needsPlanUpgrade()
    };
  }, [userPlan, getDashboardAccessLevel, getAvailableDashboardFeatures, getBlockedDashboardFeatures, needsPlanUpgrade]);

  // Efecto para manejar el estado de carga
  useEffect(() => {
    if (planLoading) {
      setLoading(true);
    } else {
      setLoading(false);
      if (planError) {
        setError(planError);
      }
    }
  }, [planLoading, planError]);

  return {
    // Estados
    loading,
    error,
    
    // Permisos básicos
    canAccessDashboard,
    canViewAnalytics,
    canViewCharts,
    canViewAdvancedStats,
    canExportData,
    canViewRealTimeData,
    
    // Niveles de acceso
    getDashboardAccessLevel,
    hasFullDashboardAccess,
    hasPremiumDashboardAccess,
    hasStandardDashboardAccess,
    
    // Funcionalidades
    getAvailableDashboardFeatures,
    getBlockedDashboardFeatures,
    isDashboardFeatureAvailable,
    
    // Información del plan
    getCurrentPlanInfo,
    getFeatureRestrictionMessage,
    getRecommendedPlanForFeature,
    needsPlanUpgrade,
    
    // Plan del usuario (del hook padre)
    userPlan
  };
};

export default useDashboardPermissions;
