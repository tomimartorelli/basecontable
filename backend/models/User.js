const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // No requerido si es usuario de Google
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'company_owner', 'employee'],
    default: 'user'
  },
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  // Nuevos campos para el sistema de planes
  currentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  // Relación con empresas
  ownedCompanies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  employeeOf: [{
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'viewer'],
      default: 'employee'
    },
    permissions: {
      canCreateInvoices: { type: Boolean, default: false },
      canEditInvoices: { type: Boolean, default: false },
      canDeleteInvoices: { type: Boolean, default: false },
      canManageClients: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canManageTemplates: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Funcionalidades desbloqueadas según el plan
  unlockedFeatures: {
    basicInvoicing: { type: Boolean, default: true },
    basicTemplates: { type: Boolean, default: true },
    customTemplates: { type: Boolean, default: false },
    logoUpload: { type: Boolean, default: false },
    companyBranding: { type: Boolean, default: false },
    employeeAccounts: { type: Boolean, default: false },
    multiCompany: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false }
  },
  refreshToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 