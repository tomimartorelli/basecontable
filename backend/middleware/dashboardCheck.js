const User = require('../models/User');
const Plan = require('../models/Plan');

// Middleware para verificar permisos del dashboard
const checkDashboardPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Si es admin, tiene acceso a todo
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene un plan activo
      if (!req.user.currentPlan) {
        return res.status(403).json({ 
          message: 'Debes tener un plan activo para acceder al dashboard',
          requiredFeature: 'dashboard',
          upgradeRequired: true
        });
      }

      // Obtener el plan del usuario
      const plan = await Plan.findById(req.user.currentPlan);
      if (!plan) {
        return res.status(403).json({ 
          message: 'Plan no válido',
          requiredFeature: 'dashboard',
          upgradeRequired: true
        });
      }

      // Verificar si puede acceder al dashboard
      if (!plan.dashboardPermissions?.canViewDashboard) {
        return res.status(403).json({ 
          message: 'El dashboard no está disponible en tu plan actual',
          requiredFeature: 'dashboard',
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      // Si se especifica un permiso específico, verificarlo
      if (permissionName && !plan.dashboardPermissions[permissionName]) {
        const featureNames = {
          'canViewAnalytics': 'Analytics Avanzados',
          'canViewCharts': 'Gráficos y Visualizaciones',
          'canViewAdvancedStats': 'Estadísticas Avanzadas',
          'canExportData': 'Exportación de Datos',
          'canViewRealTimeData': 'Datos en Tiempo Real'
        };
        
        const featureDisplayName = featureNames[permissionName] || permissionName;
        
        return res.status(403).json({ 
          message: `${featureDisplayName} no está disponible en tu plan actual`,
          requiredFeature: permissionName,
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('Error en dashboardCheck:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar permisos del panel de administrador
const checkAdminPanelPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Si es admin, tiene acceso a todo
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene un plan activo
      if (!req.user.currentPlan) {
        return res.status(403).json({ 
          message: 'Debes tener un plan activo para acceder al panel de administración',
          requiredFeature: 'adminPanel',
          upgradeRequired: true
        });
      }

      // Obtener el plan del usuario
      const plan = await Plan.findById(req.user.currentPlan);
      if (!plan) {
        return res.status(403).json({ 
          message: 'Plan no válido',
          requiredFeature: 'adminPanel',
          upgradeRequired: true
        });
      }

      // Verificar si puede acceder al panel de administrador
      if (!plan.adminPanelPermissions?.canAccessAdminPanel) {
        return res.status(403).json({ 
          message: 'El panel de administración no está disponible en tu plan actual',
          requiredFeature: 'adminPanel',
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      // Si se especifica un permiso específico, verificarlo
      if (permissionName && !plan.adminPanelPermissions[permissionName]) {
        const featureNames = {
          'canManageUsers': 'Gestión de Usuarios',
          'canManageCompanies': 'Gestión de Empresas',
          'canManagePlans': 'Gestión de Planes',
          'canManageSystem': 'Gestión del Sistema',
          'canViewSystemStats': 'Estadísticas del Sistema',
          'canManageBilling': 'Gestión de Facturación',
          'canViewAuditLogs': 'Logs de Auditoría'
        };
        
        const featureDisplayName = featureNames[permissionName] || permissionName;
        
        return res.status(403).json({ 
          message: `${featureDisplayName} no está disponible en tu plan actual`,
          requiredFeature: permissionName,
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('Error en adminPanelCheck:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar nivel de acceso al panel de administrador
const checkAdminAccessLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      // Si es admin, tiene acceso a todo
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene un plan activo
      if (!req.user.currentPlan) {
        return res.status(403).json({ 
          message: 'Debes tener un plan activo para acceder al panel de administración',
          requiredFeature: 'adminPanel',
          upgradeRequired: true
        });
      }

      // Obtener el plan del usuario
      const plan = await Plan.findById(req.user.currentPlan);
      if (!plan) {
        return res.status(403).json({ 
          message: 'Plan no válido',
          requiredFeature: 'adminPanel',
          upgradeRequired: true
        });
      }

      // Verificar si puede acceder al panel de administrador
      if (!plan.adminPanelPermissions?.canAccessAdminPanel) {
        return res.status(403).json({ 
          message: 'El panel de administración no está disponible en tu plan actual',
          requiredFeature: 'adminPanel',
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      // Verificar el nivel de acceso requerido
      const userAccessLevel = plan.adminPanelPermissions.adminAccessLevel;
      const accessLevels = {
        'none': 0,
        'company': 1,
        'full': 2
      };

      if (accessLevels[userAccessLevel] < accessLevels[requiredLevel]) {
        return res.status(403).json({ 
          message: `Se requiere nivel de acceso ${requiredLevel} para esta funcionalidad`,
          requiredLevel,
          currentLevel: userAccessLevel,
          currentPlan: plan.name,
          upgradeRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('Error en adminAccessLevelCheck:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

module.exports = {
  checkDashboardPermission,
  checkAdminPanelPermission,
  checkAdminAccessLevel
};
