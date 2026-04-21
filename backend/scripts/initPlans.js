const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

const plans = [
  {
    name: 'Básico',
    slug: 'basico',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
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
    maxEmployees: 1,
    maxCompanies: 1,
    maxTemplates: 1,
    isActive: true,
    isPopular: false,
    description: 'Plan gratuito para registro de ventas básico'
  },
  {
    name: 'Profesional',
    slug: 'profesional',
    price: 29,
    currency: 'USD',
    billingCycle: 'monthly',
    features: {
      basicInvoicing: true,
      basicTemplates: true,
      customTemplates: true,
      logoUpload: true,
      companyBranding: true,
      employeeAccounts: false,
      multiCompany: false,
      advancedAnalytics: false,
      prioritySupport: false
    },
    maxEmployees: 1,
    maxCompanies: 1,
    maxTemplates: 5,
    isActive: true,
    isPopular: true,
    description: 'Plan ideal para profesionales independientes'
  },
  {
    name: 'Empresarial',
    slug: 'empresarial',
    price: 79,
    currency: 'USD',
    billingCycle: 'monthly',
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
    maxEmployees: 10,
    maxCompanies: 3,
    maxTemplates: 20,
    isActive: true,
    isPopular: false,
    description: 'Plan completo para empresas con múltiples empleados'
  },
];

async function initPlans() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Conectado a MongoDB');
    
    // Limpiar planes existentes
    await Plan.deleteMany({});
    console.log('Planes existentes eliminados');
    
    // Crear nuevos planes
    const createdPlans = await Plan.insertMany(plans);
    console.log(`${createdPlans.length} planes creados exitosamente`);
    
    // Mostrar planes creados
    createdPlans.forEach(plan => {
      console.log(`- ${plan.name}: $${plan.price}/${plan.billingCycle}`);
    });
    
    console.log('\n✅ Inicialización de planes completada');
    
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initPlans();
}

module.exports = { initPlans };
