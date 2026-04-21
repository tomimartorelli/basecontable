const mongoose = require('mongoose');

const companyDataSchema = new mongoose.Schema({
  // Usuario propietario de estos datos
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Datos de la empresa
  company: {
    name: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    logo: { type: String } // Base64 del logo
  },
  
  // Datos bancarios
  bank: {
    cbu: { type: String }
  },
  
  // Metadatos
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
companyDataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('CompanyData', companyDataSchema);
