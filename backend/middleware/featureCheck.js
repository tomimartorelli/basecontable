const User = require('../models/User');
const Plan = require('../models/Plan');

// Middleware para verificar si el usuario tiene acceso a una funcionalidad específica
const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      // Si es admin, tiene acceso a todo
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene un plan activo
      if (!req.user.currentPlan) {
        return res.status(403).json({ 
          message: 'Debes tener un plan activo para acceder a esta funcionalidad',
          requiredFeature: featureName
        });
      }

      // Obtener el plan del usuario
      const plan = await Plan.findById(req.user.currentPlan);
      if (!plan) {
        return res.status(403).json({ 
          message: 'Plan no válido',
          requiredFeature: featureName
        });
      }

      // Verificar si la funcionalidad está desbloqueada en features
      if (plan.features[featureName]) {
        return next();
      }

      // Verificar si la funcionalidad está desbloqueada en dashboardPermissions
      if (plan.dashboardPermissions && plan.dashboardPermissions[featureName]) {
        return next();
      }

      // Verificar si la funcionalidad está desbloqueada en adminPanelPermissions
      if (plan.adminPanelPermissions && plan.adminPanelPermissions[featureName]) {
        return next();
      }

      // Si no se encuentra en ningún lugar, la funcionalidad no está disponible
      return res.status(403).json({ 
        message: 'Esta funcionalidad no está incluida en tu plan actual',
        requiredFeature: featureName,
        currentPlan: plan.name,
        upgradeRequired: true
      });

      next();
    } catch (error) {
      console.error('Error en featureCheck:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar límites del plan
const checkPlanLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      // Si es admin, no tiene límites
      if (req.user.role === 'admin') {
        return next();
      }

      // Verificar si el usuario tiene un plan activo
      if (!req.user.currentPlan) {
        return res.status(403).json({ 
          message: 'Debes tener un plan activo para acceder a esta funcionalidad'
        });
      }

      // Obtener el plan del usuario
      const plan = await Plan.findById(req.user.currentPlan);
      if (!plan) {
        return res.status(403).json({ 
          message: 'Plan no válido'
        });
      }

      // Verificar límites según el tipo
      switch (limitType) {
        case 'templates':
          // Funcionalidad de templates no implementada aún
          // TODO: Implementar cuando se agregue funcionalidad de templates
          return res.status(403).json({ 
            message: `La funcionalidad de plantillas personalizadas no está disponible aún`,
            currentCount: 0,
            limit: plan.maxTemplates,
            upgradeRequired: false
          });

        case 'companies':
          // Contar empresas existentes
          const companiesCount = await require('../models/Company').countDocuments({ owner: req.user._id });
          if (companiesCount >= plan.maxCompanies) {
            return res.status(403).json({ 
              message: `Has alcanzado el límite de empresas para tu plan (${plan.maxCompanies})`,
              currentCount: companiesCount,
              limit: plan.maxCompanies,
              upgradeRequired: true
            });
          }
          break;

        case 'employees':
          // Para verificar límite de empleados, necesitamos el ID de la empresa
          const companyId = req.params.companyId || req.body.companyId;
          if (companyId) {
            const company = await require('../models/Company').findById(companyId);
            if (company && company.employees.length >= plan.maxEmployees) {
              return res.status(403).json({ 
                message: `Has alcanzado el límite de empleados para tu plan (${plan.maxEmployees})`,
                currentCount: company.employees.length,
                limit: plan.maxEmployees,
                upgradeRequired: true
              });
            }
          }
          break;

        case 'clients':
          // Contar clientes existentes del usuario
          const clientsCount = await require('../models/Client').countDocuments({ user: req.user._id });
          if (plan.maxClients > 0 && clientsCount >= plan.maxClients) {
            return res.status(403).json({ 
              message: `Has alcanzado el límite de clientes para tu plan (${plan.maxClients})`,
              currentCount: clientsCount,
              limit: plan.maxClients,
              upgradeRequired: true
            });
          }
          break;

        case 'documents':
          // Contar documentos del mes actual
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          const documentsCount = await require('../models/Invoice').countDocuments({
            user: req.user._id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });
          
          if (plan.maxDocumentsPerMonth > 0 && documentsCount >= plan.maxDocumentsPerMonth) {
            return res.status(403).json({ 
              message: `Has alcanzado el límite de registros mensuales para tu plan (${plan.maxDocumentsPerMonth})`,
              currentCount: documentsCount,
              limit: plan.maxDocumentsPerMonth,
              upgradeRequired: true,
              resetDate: endOfMonth
            });
          }
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Error en checkPlanLimits:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar permisos de empleado
const checkEmployeePermissions = (permission) => {
  return async (req, res, next) => {
    try {
      // Si es admin o propietario, tiene todos los permisos
      if (req.user.role === 'admin') {
        return next();
      }

      // Obtener la empresa del contexto (puede venir de diferentes lugares)
      let companyId = req.params.companyId || req.body.companyId || req.params.id;
      
      if (!companyId) {
        return res.status(400).json({ message: 'ID de empresa no proporcionado' });
      }

      // Buscar la empresa y verificar si el usuario es propietario o empleado
      const company = await require('../models/Company').findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Empresa no encontrada' });
      }

      // Si es propietario, tiene todos los permisos
      if (company.owner.toString() === req.user._id.toString()) {
        return next();
      }

      // Verificar si es empleado y tiene el permiso requerido
      const employee = company.employees.find(emp => emp.user.toString() === req.user._id.toString());
      if (!employee) {
        return res.status(403).json({ message: 'No tienes acceso a esta empresa' });
      }

      if (!employee.permissions[permission]) {
        return res.status(403).json({ 
          message: 'No tienes permisos para realizar esta acción',
          requiredPermission: permission,
          currentRole: employee.role
        });
      }

      next();
    } catch (error) {
      console.error('Error en checkEmployeePermissions:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

module.exports = {
  checkFeature,
  checkPlanLimits,
  checkEmployeePermissions
};
