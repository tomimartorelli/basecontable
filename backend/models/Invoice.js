const mongoose = require('mongoose');

const conceptoSchema = new mongoose.Schema({
  detalle: { type: String, required: true },
  importe: { type: Number, required: true }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // Campos de la factura
  razonSocial: { type: String, required: true },
  domicilio: { type: String },
  pais: { type: String, required: true },
  localidad: { type: String },
  email: { type: String, required: true },
  telefono: { type: String },
  fecha: { type: String, required: true },
  tipo: { type: String, required: true },
  // Número de comprobante dentro de la empresa.
  // La unicidad ahora se garantiza con un índice compuesto (companyId + numero),
  // para permitir que distintas empresas usen la misma numeración.
  numero: { type: String, required: true },
  total: { type: Number, required: true },
  conceptos: [conceptoSchema],
  estadoPago: { type: String, enum: ['pagada', 'impaga'], default: 'impaga' },
  // Tipo de documento dentro de la plataforma (no fiscal)
  documentType: {
    type: String,
    enum: ['invoice', 'quote', 'receipt', 'internal'],
    default: 'invoice'
  },
  // Categoría/etiqueta para filtrar y reportes (ej: Honorarios, Asesoría mensual)
  categoria: { type: String, default: '' },

  // Campos de relación con usuario y empresa
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },
  
  // Datos de empresa y bancarios (para el PDF)
  empresa: {
    name: String,
    address: String,
    city: String,
    postalCode: String,
    phone: String,
    email: String,
    website: String,
    logo: String // base64 del logo
  },
  datosBancarios: {
    cbu: String // información bancaria completa
  },
  // Información opcional de cumplimiento fiscal para futuras integraciones
  compliance: {
    provider: String,
    externalId: String,
    fiscalNumber: String,
    payload: String,
    qr: String,
    signedAt: Date,
    status: String
  },
  
  // Campos de auditoría
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  adjunto: { type: String }
});

// Índice compuesto: el número solo debe ser único dentro de cada empresa.
// Usamos sparse para permitir registros antiguos sin companyId definido.
invoiceSchema.index({ companyId: 1, numero: 1 }, { unique: true, sparse: true });

// Middleware para actualizar updatedAt
invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema); 