import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const useAdminPermissions = () => {
  const { user } = useContext(AuthContext);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Log inmediato para verificar que el hook se ejecuta (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 useAdminPermissions: Hook ejecutándose con usuario:', user ? {
      email: user.email,
      role: user.role,
      currentPlan: user.currentPlan,
      unlockedFeatures: user.unlockedFeatures
    } : 'No user');
  }
  
  // Usar useRef para evitar re-renders
  const userRef = useRef(user);
  const userPlanRef = useRef(userPlan);
  
  // Actualizar refs cuando cambien los valores
  useEffect(() => {
    userRef.current = user;
    userPlanRef.current = userPlan;
  }, [user, userPlan]);

  // Verificar si puede acceder al panel de administrador
  const canAccessAdminPanel = useCallback(() => {
    const currentUser = userRef.current;
    const currentPlan = userPlanRef.current;
    
    // Logs de debugging solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 canAccessAdminPanel DEBUG:', {
        user: currentUser ? {
          role: currentUser.role,
          isSuperAdmin: currentUser.isSuperAdmin,
          email: currentUser.email
        } : 'No user',
        plan: currentPlan ? {
          name: currentPlan.name,
          slug: currentPlan.slug,
          adminPanelPermissions: currentPlan.adminPanelPermissions
        } : 'No plan'
      });
    }
    
    if (!currentUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 canAccessAdminPanel: No hay usuario autenticado');
      }
      return false;
    }
    
    // Verificar que el usuario tenga un role válido
    if (!currentUser.role || typeof currentUser.role !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 canAccessAdminPanel: Role inválido:', currentUser.role);
      }
      return false;
    }
    
    // Super Admin siempre tiene acceso
    if (currentUser.role === 'admin' && currentUser.isSuperAdmin === true) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 canAccessAdminPanel: Super Admin detectado, acceso total');
      }
      return true;
    }
    
    // Si no es superadmin, necesita plan
    if (!currentPlan) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 canAccessAdminPanel: No es superadmin y no tiene plan');
      }
      return false;
    }

    const planSlug = (currentPlan.slug || '').toLowerCase();

    // Regla de negocio fuerte:
    // - Plan Empresarial / Enterprise SIEMPRE ven el panel de administración (nivel empresa)
    // - Otros planes no tienen panel admin
    const hasAccess =
      ['empresarial', 'enterprise'].includes(planSlug);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 canAccessAdminPanel: Evaluado por slug:', { planSlug, hasAccess });
    }
    return hasAccess;
  }, []); // Dependencias vacías para que solo se cree una vez

  // Verificar si puede acceder al ABM (mantener compatibilidad)
  const canAccessABM = useCallback(() => {
    return canAccessAdminPanel();
  }, [canAccessAdminPanel]);

  const getABMAccessLevel = useCallback(() => {
    const currentUser = userRef.current;
    const currentPlan = userPlanRef.current;
    
    if (!currentUser) {
      return 'none';
    }
    
    // Verificar que el usuario tenga un role válido
    if (!currentUser.role || typeof currentUser.role !== 'string') {
      return 'none';
    }
    
    // Super Admin siempre tiene acceso completo
    if (currentUser.role === 'admin' && currentUser.isSuperAdmin === true) {
      return 'full';
    }
    
    // Si no es superadmin, necesita plan
    if (!currentPlan) {
      return 'none';
    }
    
    // Si el plan no tiene adminPanelPermissions configurado, usar lógica de fallback
    if (!currentPlan.adminPanelPermissions) {
      console.log('⚠️ getABMAccessLevel: Plan no tiene adminPanelPermissions configurado, usando fallback');
      
      // Lógica de fallback basada en el slug del plan
      const planSlug = currentPlan.slug;
      if (planSlug === 'enterprise') {
        return 'full';
      } else if (planSlug === 'empresarial') {
        return 'company';
      } else {
        return 'none';
      }
    }
    
    // Verificar permisos específicos del panel de administrador
    const adminPermissions = currentPlan.adminPanelPermissions;
    
    // Retornar el nivel de acceso configurado en el plan
    return adminPermissions.adminAccessLevel || 'none';
  }, []); // Dependencias vacías para que solo se cree una vez

  // ===== PERMISOS POR FUNCIONALIDAD =====

  // Gestión de usuarios
  const canManageUsers = useCallback(() => {
    if (!canAccessABM()) return false;
    
    const accessLevel = getABMAccessLevel();
    if (accessLevel === 'full') return true;
    if (accessLevel === 'company') {
      const plan = userPlanRef.current;
      if (!plan) return false;

      // Si no hay permisos configurados en el plan, usar fallback por slug:
      // para planes empresariales (empresarial / enterprise) permitimos gestión básica de usuarios
      if (!plan.adminPanelPermissions) {
        const slug = (plan.slug || '').toLowerCase();
        return ['empresarial', 'enterprise'].includes(slug);
      }

      return plan.adminPanelPermissions.canManageUsers || false;
    }
    
    return false;
  }, [canAccessABM, getABMAccessLevel]);

  // Gestión de empresas
  const canManageCompanies = useCallback(() => {
    if (!canAccessABM()) return false;
    
    const accessLevel = getABMAccessLevel();
    if (accessLevel === 'full') return true;
    if (accessLevel === 'company') return userPlanRef.current?.adminPanelPermissions?.canManageCompanies || false;
    
    return false;
  }, [canAccessABM, getABMAccessLevel]);

  // Gestión de planes
  const canManagePlans = useCallback(() => {
    if (!canAccessABM()) return false;
    
    const accessLevel = getABMAccessLevel();
    if (accessLevel === 'full') return true;
    return userPlanRef.current?.adminPanelPermissions?.canManagePlans || false;
  }, [canAccessABM, getABMAccessLevel]);

  // Gestión del sistema
  const canManageSystem = useCallback(() => {
    if (!canAccessABM()) return false;
    
    const accessLevel = getABMAccessLevel();
    if (accessLevel === 'full') return true;
    return userPlanRef.current?.adminPanelPermissions?.canManageSystem || false;
  }, [canAccessABM, getABMAccessLevel]);

  // ===== LÍMITES DEL PLAN =====

  // Obtener límite de usuarios
  const getUserLimit = useCallback(() => {
    if (!userPlanRef.current) return 1;
    return userPlanRef.current.maxEmployees || 1;
  }, []);

  // Obtener límite de empresas
  const getCompanyLimit = useCallback(() => {
    if (!userPlanRef.current) return 1;
    return userPlanRef.current.maxCompanies || 1;
  }, []);

  // Obtener límite de plantillas
  const getTemplateLimit = useCallback(() => {
    if (!userPlanRef.current) return 1;
    return userPlanRef.current.maxTemplates || 1;
  }, []);

  // ===== VERIFICACIONES DE LÍMITES =====

  // Verificar si puede agregar más usuarios
  const canAddMoreUsers = useCallback((currentCount) => {
    if (!canManageUsers()) return false;
    return currentCount < getUserLimit();
  }, [canManageUsers, getUserLimit]);

  // Verificar si puede agregar más empresas
  const canAddMoreCompanies = useCallback((currentCount) => {
    if (!canManageCompanies()) return false;
    return currentCount < getCompanyLimit();
  }, [canManageCompanies, getCompanyLimit]);

  // Verificar si puede agregar más plantillas
  const canAddMoreTemplates = useCallback((currentCount) => {
    return currentCount < getTemplateLimit();
  }, [getTemplateLimit]);

  // ===== INFORMACIÓN DEL PLAN =====

  // Obtener nombre del plan
  const getPlanName = useCallback(() => {
    if (!userPlanRef.current) return 'Gratuito';
    return userPlanRef.current.name;
  }, []);

  // Obtener slug del plan
  const getPlanSlug = useCallback(() => {
    if (!userPlanRef.current) return 'gratuito';
    return userPlanRef.current.slug;
  }, []);

  // Verificar si es plan gratuito
  const isFreePlan = useCallback(() => {
    return getPlanSlug() === 'gratuito';
  }, [getPlanSlug]);

  // Verificar si es plan de pago
  const isPaidPlan = useCallback(() => {
    return !isFreePlan();
  }, [isFreePlan]);

  // ===== FUNCIONALIDADES DESBLOQUEADAS =====

  // Verificar si una funcionalidad está disponible
  const isFeatureAvailable = useCallback((featureName) => {
    if (!userPlanRef.current) return false;
    return userPlanRef.current.features[featureName] || false;
  }, []);

  // Obtener todas las funcionalidades disponibles
  const getAvailableFeatures = useCallback(() => {
    if (!userPlanRef.current) return [];

    return Object.entries(userPlanRef.current.features)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([feature, _]) => feature);
  }, []);

  // ===== VERIFICACIONES DE ADMINISTRACIÓN =====

  // Verificar si es super admin del sistema
  const isSuperAdmin = useCallback(() => {
    const currentUser = userRef.current;
    return currentUser?.role === 'admin' && currentUser?.isSuperAdmin === true;
  }, []);

  // Verificar si es admin regular (con plan superior)
  const isRegularAdmin = useCallback(() => {
    const currentUser = userRef.current;
    const currentPlan = userPlanRef.current;
    
    if (currentUser?.role !== 'admin') return false;
    if (currentUser?.isSuperAdmin === true) return false;
    
    const planSlug = currentPlan?.slug;
    return ['empresarial', 'enterprise'].includes(planSlug);
  }, []);

  // Verificar si es usuario empresarial
  const isBusinessUser = useCallback(() => {
    const currentUser = userRef.current;
    const currentPlan = userPlanRef.current;
    
    if (currentUser?.role === 'admin') return false;
    
    const planSlug = currentPlan?.slug;
    return ['empresarial', 'enterprise'].includes(planSlug);
  }, []);

  // ===== ESTADOS DEL SISTEMA =====

  // Verificar si está cargando
  const isLoading = useCallback(() => loading, [loading]);

  // ===== UTILIDADES =====

  // Obtener color del plan para UI
  const getPlanColor = useCallback(() => {
    const planSlug = getPlanSlug();
    const colors = {
      'gratuito': 'text-gray-500',
      'profesional': 'text-blue-500',
      'empresarial': 'text-purple-500',
      'enterprise': 'text-green-500'
    };
    return colors[planSlug] || 'text-gray-500';
  }, [getPlanSlug]);

  // Obtener badge del plan para UI
  const getPlanBadge = useCallback(() => {
    const planSlug = getPlanSlug();
    const badges = {
      'gratuito': { text: 'Gratuito', color: 'bg-gray-100 text-gray-800' },
      'profesional': { text: 'Profesional', color: 'bg-blue-100 text-blue-800' },
      'empresarial': { text: 'Empresarial', color: 'bg-purple-100 text-purple-800' },
      'enterprise': { text: 'Enterprise', color: 'bg-green-100 text-green-800' }
    };
    return badges[planSlug] || badges['gratuito'];
  }, [getPlanSlug]);

  // ===== FUNCIONES DE CARGA =====

  const createPlanFromFeatures = useCallback((unlockedFeatures) => {
    // Determinar el plan basado en las funcionalidades desbloqueadas
    let planName = 'Gratuito';
    let planSlug = 'gratuito';
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
      planSlug = 'empresarial';
      maxTemplates = 25;
      maxEmployees = 20;
      maxCompanies = 5;
    } else if (unlockedFeatures.customTemplates && unlockedFeatures.logoUpload) {
      planName = 'Profesional';
      planSlug = 'profesional';
      maxTemplates = 10;
      maxEmployees = 5;
      maxCompanies = 2;
    } else if (unlockedFeatures.basicInvoicing && unlockedFeatures.basicTemplates) {
      planName = 'Básico';
      planSlug = 'basico';
      maxTemplates = 3;
      maxEmployees = 1;
      maxCompanies = 1;
    }
    
    // Determinar dashboardPermissions según el slug
    let dashboardPermissions = {
      canViewDashboard: true,
      canViewAnalytics: false,
      canViewCharts: false,
      canViewAdvancedStats: false,
      canExportData: false,
      canViewRealTimeData: false
    };
    
    if (planSlug === 'enterprise') {
      dashboardPermissions = {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: true,
        canExportData: true,
        canViewRealTimeData: true
      };
    } else if (planSlug === 'empresarial') {
      dashboardPermissions = {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: true,
        canExportData: true,
        canViewRealTimeData: false
      };
    } else if (planSlug === 'profesional') {
      dashboardPermissions = {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      };
    }
    
    return {
      name: planName,
      slug: planSlug,
      price: 0,
      features: unlockedFeatures,
      maxEmployees,
      maxCompanies,
      maxTemplates,
      dashboardPermissions
    };
  }, []);

  const createDefaultPlan = useCallback(() => {
    const defaultPlan = {
      name: 'Gratuito',
      slug: 'gratuito',
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
      dashboardPermissions: {
        canViewDashboard: true,
        canViewAnalytics: false,
        canViewCharts: false,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      }
    };
    setUserPlan(defaultPlan);
  }, []);

  const loadUserPlan = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useAdminPermissions DEBUG - loadUserPlan:', {
        user: user ? {
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          email: user.email,
          currentPlan: user.currentPlan,
          unlockedFeatures: user.unlockedFeatures
        } : 'No user'
      });
      
      // Si el usuario tiene un plan asignado, usarlo directamente o cargarlo por ID
      if (user?.currentPlan) {
        // Caso 1: currentPlan ya viene populado como objeto
        if (user.currentPlan._id) {
          console.log('✅ useAdminPermissions: Usando plan del usuario (populado):', user.currentPlan.name);
          setUserPlan(user.currentPlan);
          return;
        }

        // Caso 2: currentPlan es un ID (string u objeto con id)
        const planId =
          typeof user.currentPlan === 'string'
            ? user.currentPlan
            : user.currentPlan.id || user.currentPlan._id;

        if (planId) {
          console.log('🔍 useAdminPermissions: Cargando plan por ID desde backend:', planId);
          try {
            const response = await fetch(`${API_BASE_URL}/api/plans/${planId}`);
            if (response.ok) {
              const planData = await response.json();
              console.log('✅ useAdminPermissions: Plan cargado desde backend:', planData);
              setUserPlan(planData);
              return;
            } else {
              console.error('❌ useAdminPermissions: Error HTTP al cargar plan:', response.status);
            }
          } catch (fetchError) {
            console.error('❌ useAdminPermissions: Error de red al cargar plan:', fetchError);
          }
        }
      }
      
      // Si no tiene currentPlan pero sí unlockedFeatures, crear plan basado en eso
      if (user?.unlockedFeatures) {
        console.log('⚠️ useAdminPermissions: No hay currentPlan, usando unlockedFeatures');
        const planFromFeatures = createPlanFromFeatures(user.unlockedFeatures);
        console.log('🔍 useAdminPermissions: Plan creado desde features:', planFromFeatures);
        setUserPlan(planFromFeatures);
        return;
      }
      
      // Para super admins, crear plan Enterprise por defecto
      if (user?.isSuperAdmin === true) {
        console.log('👑 useAdminPermissions: Super admin detectado, creando plan Enterprise');
        const enterprisePlan = {
          name: 'Enterprise',
          slug: 'enterprise',
          price: 199,
          features: {
            basicInvoicing: true,
            basicTemplates: true,
            customTemplates: true,
            logoUpload: true,
            companyBranding: true,
            employeeAccounts: true,
            multiCompany: true,
            advancedAnalytics: true,
            prioritySupport: true
          },
          maxEmployees: 100,
          maxCompanies: 10,
          maxTemplates: 100,
          dashboardPermissions: {
            canViewDashboard: true,
            canViewAnalytics: true,
            canViewCharts: true,
            canViewAdvancedStats: true,
            canExportData: true,
            canViewRealTimeData: true
          }
        };
        setUserPlan(enterprisePlan);
        return;
      }
      
      // Para otros usuarios, usar plan gratuito por defecto
      console.log('❌ useAdminPermissions: No hay plan, creando plan gratuito por defecto');
      createDefaultPlan();
      
    } catch (error) {
      console.error('❌ useAdminPermissions: Error al cargar plan del usuario:', error);
      createDefaultPlan();
    } finally {
      setLoading(false);
    }
  }, [user, createDefaultPlan, createPlanFromFeatures]); // userPlan no se lee, solo se escribe

  // Cargar el plan cuando cambie el usuario
  useEffect(() => {
    // Solo cargar si hay usuario y no hay plan cargado
    if (user && !userPlan) {
      loadUserPlan();
    }
  }, [user, userPlan, loadUserPlan]); // Dependencias correctas

  // Función para recargar el plan manualmente
  const reloadUserPlan = useCallback(() => {
    if (user) {
      setUserPlan(null); // Resetear para forzar recarga
      loadUserPlan();
    }
  }, [user, loadUserPlan]);

  return {
    // Estados
    loading: isLoading(),
    
    // Plan del usuario
    userPlan,
    getPlanName,
    getPlanSlug,
    isFreePlan,
    isPaidPlan,
    getPlanColor,
    getPlanBadge,
    
    // Permisos del panel de administrador
    canAccessAdminPanel,
    canAccessABM, // Mantener compatibilidad
    getABMAccessLevel,
    canManageUsers,
    canManageCompanies,
    canManagePlans,
    canManageSystem,
    
    // Nuevos permisos específicos
    canViewSystemStats: useCallback(() => {
      if (!canAccessABM()) return false;
      const accessLevel = getABMAccessLevel();
      if (accessLevel === 'full') return true;
      return userPlanRef.current?.adminPanelPermissions?.canViewSystemStats || false;
    }, [canAccessABM, getABMAccessLevel]),
    
    canManageBilling: useCallback(() => {
      if (!canAccessABM()) return false;
      const accessLevel = getABMAccessLevel();
      if (accessLevel === 'full') return true;
      return userPlanRef.current?.adminPanelPermissions?.canManageBilling || false;
    }, [canAccessABM, getABMAccessLevel]),
    
    canViewAuditLogs: useCallback(() => {
      if (!canAccessABM()) return false;
      const accessLevel = getABMAccessLevel();
      if (accessLevel === 'full') return true;
      return userPlanRef.current?.adminPanelPermissions?.canViewAuditLogs || false;
    }, [canAccessABM, getABMAccessLevel]),
    
    // Límites del plan
    getUserLimit,
    getCompanyLimit,
    getTemplateLimit,
    canAddMoreUsers,
    canAddMoreCompanies,
    canAddMoreTemplates,
    
    // Funcionalidades
    isFeatureAvailable,
    getAvailableFeatures,
    isSuperAdmin,
    isRegularAdmin,
    isBusinessUser,
    
    // Utilidades
    loadUserPlan,
    reloadUserPlan
  };
};

export default useAdminPermissions;
