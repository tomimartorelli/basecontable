const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  razonSocial: { type: String, required: true, trim: true },
  domicilio: { type: String, trim: true },
  pais: { type: String, required: true, trim: true },
  localidad: { type: String, trim: true },
  email: { type: String, required: true, trim: true },
  telefono: { type: String, trim: true },
  
  // Campo de relación con usuario
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Campo de relación con empresa (opcional)
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company' 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema); 