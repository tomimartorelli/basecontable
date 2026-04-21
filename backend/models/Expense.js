const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  fecha: { type: String, required: true },
  concepto: { type: String, required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, enum: ['ARS', 'USD', 'EUR'], default: 'ARS' },
  categoria: { type: String, default: '' },
  proveedor: { type: String, default: '' },
  notas: { type: String, default: '' },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

expenseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
