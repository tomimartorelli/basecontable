const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  legalName: {
    type: String,
    trim: true
  },
  taxId: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  logo: {
    path: String,
    filename: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
    invitedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    defaultCurrency: {
      type: String,
      default: 'USD'
    },
    defaultLanguage: {
      type: String,
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'America/Argentina/Buenos_Aires'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar updatedAt
companySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Company', companySchema);
