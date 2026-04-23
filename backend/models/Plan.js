const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  features: {
    // Funcionalidades básicas
    basicInvoicing: {
      type: Boolean,
      default: true
    },
    basicTemplates: {
      type: Boolean,
      default: true
    },
    // Funcionalidades intermedias
    customTemplates: {
      type: Boolean,
      default: false
    },
    logoUpload: {
      type: Boolean,
      default: false
    },
    companyBranding: {
      type: Boolean,
      default: false
    },
    // Funcionalidades avanzadas
    employeeAccounts: {
      type: Boolean,
      default: false
    },
    multiCompany: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    multimoneda: {
      type: Boolean,
      default: false
    },
    presupuestos: {
      type: Boolean,
      default: false
    },
    flujoDeCaja: {
      type: Boolean,
      default: false
    },
    reportesAutomatizados: {
      type: Boolean,
      default: false
    }
  },
  // Permisos específicos del dashboard
  dashboardPermissions: {
    canViewDashboard: {
      type: Boolean,
      default: true
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canViewCharts: {
      type: Boolean,
      default: false
    },
    canViewAdvancedStats: {
      type: Boolean,
      default: false
    },
    canExportData: {
      type: Boolean,
      default: false
    },
    canViewRealTimeData: {
      type: Boolean,
      default: false
    }
  },
  // Permisos específicos del panel de administrador
  adminPanelPermissions: {
    canAccessAdminPanel: {
      type: Boolean,
      default: false
    },
    // Nivel de acceso al panel admin
    adminAccessLevel: {
      type: String,
      enum: ['none', 'company', 'full'],
      default: 'none'
    },
    // Permisos específicos por funcionalidad
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageCompanies: {
      type: Boolean,
      default: false
    },
    canManagePlans: {
      type: Boolean,
      default: false
    },
    canManageSystem: {
      type: Boolean,
      default: false
    },
    canViewSystemStats: {
      type: Boolean,
      default: false
    },
    canManageBilling: {
      type: Boolean,
      default: false
    },
    canViewAuditLogs: {
      type: Boolean,
      default: false
    }
  },
  maxEmployees: {
    type: Number,
    default: 1
  },
  maxCompanies: {
    type: Number,
    default: 1
  },
  maxTemplates: {
    type: Number,
    default: 1
  },
  maxDocumentsPerMonth: {
    type: Number,
    default: 200
  },
  maxClients: {
    type: Number,
    default: 50
  },
  maxStorageMB: {
    type: Number,
    default: 100
  },
  dataHistoryMonths: {
    type: Number,
    default: 6
  },
  hasTrial: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Plan', planSchema);
