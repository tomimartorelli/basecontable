const mongoose = require('mongoose');
const Plan = require('../models/Plan');
require('dotenv').config();

const plans = [
  {
    name: 'Básico',
    slug: 'basico',
    price: 5,
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
      prioritySupport: false,
      multimoneda: false,
      presupuestos: false,
      flujoDeCaja: false,
      reportesAutomatizados: false
    },
    maxEmployees: 1,
    maxCompanies: 1,
    maxTemplates: 1,
    maxClients: 20,
    maxDocumentsPerMonth: 50,
    maxStorageMB: 100,
    dataHistoryMonths: 6,
    hasTrial: true,
    isActive: true,
    isPopular: false,
    description: 'Para emprendedores y negocios que operan solo en pesos argentinos. Primeros 30 días gratis.'
  },
  {
    name: 'Profesional',
    slug: 'profesional',
    price: 10,
    currency: 'USD',
    billingCycle: 'monthly',
    features: {
      basicInvoicing: true,
      basicTemplates: true,
      customTemplates: true,
      logoUpload: false,
      companyBranding: true,
      employeeAccounts: false,
      multiCompany: false,
      advancedAnalytics: true,
      prioritySupport: false,
      multimoneda: true,
      presupuestos: false,
      flujoDeCaja: true,
      reportesAutomatizados: true
    },
    maxEmployees: 2,
    maxCompanies: 1,
    maxTemplates: 5,
    maxClients: 100,
    maxDocumentsPerMonth: 300,
    maxStorageMB: 500,
    dataHistoryMonths: 24,
    hasTrial: false,
    isActive: true,
    isPopular: true,
    description: 'Para negocios con movimiento en pesos y dólares. Multimoneda + reportes + flujo de caja proyectado.'
  },
  {
    name: 'Empresarial',
    slug: 'empresarial',
    price: 20,
    currency: 'USD',
    billingCycle: 'monthly',
    features: {
      basicInvoicing: true,
      basicTemplates: true,
      customTemplates: true,
      logoUpload: false,
      companyBranding: true,
      employeeAccounts: true,
      multiCompany: true,
      advancedAnalytics: true,
      prioritySupport: true,
      multimoneda: true,
      presupuestos: true,
      flujoDeCaja: true,
      reportesAutomatizados: true
    },
    maxEmployees: 10,
    maxCompanies: 5,
    maxTemplates: 20,
    maxClients: 0,
    maxDocumentsPerMonth: 0,
    maxStorageMB: 5120,
    dataHistoryMonths: 0,
    hasTrial: false,
    isActive: true,
    isPopular: false,
    description: 'Para estudios contables y negocios con equipo. Multi-usuario, auditoría, presupuestos con alertas.'
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
