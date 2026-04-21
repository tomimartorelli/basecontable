require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middlewares
// Configurar CORS - TEMPORALMENTE PERMITIR TODOS LOS ORIGENES
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
console.log('CORS configurado: permitiendo todos los orígenes');
app.use(express.json({ limit: '50mb' })); // Aumentar límite para logos base64 grandes

// Conexión a MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
.then(async () => {
  console.log('✅ Conectado a MongoDB en:', config.mongodb.uri);
  
  // Inicializar planes automáticamente si no existen
  try {
    const plansCount = await Plan.countDocuments();
    console.log(`🔍 Planes: Verificando planes existentes... (${plansCount} encontrados)`);
    
    // Verificar si faltan planes específicos
    const basicPlan = await Plan.findOne({ slug: 'basico' });
    const professionalPlan = await Plan.findOne({ slug: 'profesional' });
    const empresarialPlan = await Plan.findOne({ slug: 'empresarial' });
    const enterprisePlan = await Plan.findOne({ slug: 'enterprise' });
    
    const missingPlans = [];
    
    if (!basicPlan) missingPlans.push('Básico');
    if (!professionalPlan) missingPlans.push('Profesional');
    if (!empresarialPlan) missingPlans.push('Empresarial');
    if (!enterprisePlan) missingPlans.push('Enterprise');
    
    if (missingPlans.length > 0) {
      console.log(`🚀 Planes: Faltan los siguientes planes: ${missingPlans.join(', ')}`);
      console.log('🚀 Planes: Inicializando planes faltantes...');
      
      const defaultPlans = [
        {
          name: 'Starter',
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
          maxDocumentsPerMonth: 100,
          isActive: true,
          isPopular: false,
          description: 'Ideal para empezar: 1 usuario, 1 estudio y hasta 100 registros de venta/mes.',
          dashboardPermissions: {
            canViewDashboard: true,
            canViewAnalytics: false,
            canViewCharts: false,
            canViewAdvancedStats: false,
            canExportData: false,
            canViewRealTimeData: false
          }
        },
        {
          name: 'Pro',
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
            employeeAccounts: true,
            multiCompany: false,
            advancedAnalytics: false,
            prioritySupport: false
          },
          maxEmployees: 3,
          maxCompanies: 1,
          maxTemplates: 5,
          maxDocumentsPerMonth: 1000,
          isActive: true,
          isPopular: true,
          description: 'Para estudios en crecimiento: hasta 3 usuarios y 1.000 registros de venta/mes.',
          dashboardPermissions: {
            canViewDashboard: true,
            canViewAnalytics: true,
            canViewCharts: true,
            canViewAdvancedStats: false,
            canExportData: false,
            canViewRealTimeData: false
          }
        },
        {
          name: 'Business',
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
            multiCompany: false,
            advancedAnalytics: true,
            prioritySupport: true
          },
          maxEmployees: 10,
          maxCompanies: 1,
          maxTemplates: 10,
          maxDocumentsPerMonth: 5000,
          isActive: true,
          isPopular: false,
          description: 'Para equipos consolidados: hasta 10 usuarios y 5.000 registros de venta/mes.',
          dashboardPermissions: {
            canViewDashboard: true,
            canViewAnalytics: true,
            canViewCharts: true,
            canViewAdvancedStats: true,
            canExportData: true,
            canViewRealTimeData: false
          }
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          price: 199,
          currency: 'USD',
          billingCycle: 'monthly',
          features: {
            basicInvoicing: true,
            basicTemplates: true,
            customTemplates: true,
            logoUpload: true,
            companyBranding: true,
            employeeAccounts: true,
            multiCompany: false,
            advancedAnalytics: true,
            prioritySupport: true
          },
          maxEmployees: 25,
          maxCompanies: 1,
          maxTemplates: 20,
          maxDocumentsPerMonth: 20000,
          isActive: true,
          isPopular: false,
          description: 'Para estudios grandes: más usuarios, más automatización y alto volumen de comprobantes.',
          dashboardPermissions: {
            canViewDashboard: true,
            canViewAnalytics: true,
            canViewCharts: true,
            canViewAdvancedStats: true,
            canExportData: true,
            canViewRealTimeData: true
          }
        }
      ];
      
      // Crear solo los planes que faltan
      const plansToCreate = [];
      
      if (!basicPlan) plansToCreate.push(defaultPlans[0]); // Básico
      if (!professionalPlan) plansToCreate.push(defaultPlans[1]); // Profesional
      if (!empresarialPlan) plansToCreate.push(defaultPlans[2]); // Empresarial
      if (!enterprisePlan) plansToCreate.push(defaultPlans[3]); // Enterprise
      
      if (plansToCreate.length > 0) {
        await Plan.insertMany(plansToCreate);
        console.log(`✅ Planes: ${plansToCreate.length} planes faltantes creados exitosamente`);
      }
    } else {
      console.log('✅ Planes: Todos los planes ya existen en la base de datos');
    }
  } catch (error) {
    console.error('❌ Error al inicializar planes:', error);
  }
})
.catch((err) => console.error('❌ Error de conexión a MongoDB:', err));

// Rutas
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');
const activityRoutes = require('./routes/activity');
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const expensesRoutes = require('./routes/expenses');
const exportRoutes = require('./routes/export');
const reportesRoutes = require('./routes/reportes');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');
const companiesRoutes = require('./routes/companies');
const companyDataRoutes = require('./routes/companyData');
const adminRoutes = require('./routes/admin');
const teamRoutes = require('./routes/team');

// Importar modelo de Plan para inicialización automática
const Plan = require('./models/Plan');

app.use('/api', authRoutes);
app.use('/api', googleAuthRoutes);
app.use('/api', activityRoutes);
app.use('/api', clientsRoutes);
app.use('/api', invoicesRoutes);
app.use('/api', expensesRoutes);
app.use('/api', exportRoutes);
app.use('/api', reportesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/company-data', companyDataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', teamRoutes);

// Puerto
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log(`Entorno: ${config.server.env}`);
});
