const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Plan = require('../models/Plan');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createSuperAdmin() {
  try {
    console.log('🔧 Creando Super Administrador...\n');
    
    // Verificar si ya existe un super admin
    const existingSuperAdmin = await User.findOne({ 
      role: 'admin', 
      isSuperAdmin: true 
    });
    
    if (existingSuperAdmin) {
      console.log('⚠️ Ya existe un Super Administrador:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Nombre: ${existingSuperAdmin.name}`);
      console.log(`   Role: ${existingSuperAdmin.role}`);
      console.log(`   isSuperAdmin: ${existingSuperAdmin.isSuperAdmin}`);
      console.log('\n¿Quieres crear otro? (S/N)');
      return;
    }
    
    // Buscar el plan Enterprise
    const enterprisePlan = await Plan.findOne({ 
      $or: [
        { name: 'Enterprise' },
        { slug: 'enterprise' },
        { price: 199 }
      ]
    });
    
    if (!enterprisePlan) {
      console.log('❌ No se encontró el plan Enterprise');
      console.log('Creando plan Enterprise por defecto...');
      
      const newEnterprisePlan = new Plan({
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
          multiCompany: true,
          advancedAnalytics: true,
          prioritySupport: true
        },
        maxEmployees: 100,
        maxCompanies: 10,
        maxTemplates: 100,
        isActive: true,
        isPopular: false,
        description: 'Plan para grandes empresas con necesidades avanzadas'
      });
      
      await newEnterprisePlan.save();
      console.log('✅ Plan Enterprise creado');
    }
    
    // Datos del super admin
    const superAdminData = {
      name: 'Super Administrador',
      email: 'admin@contasuite.com',
      password: 'admin123456',
      role: 'admin',
      isSuperAdmin: true,
      currentPlan: enterprisePlan?._id || null,
      unlockedFeatures: enterprisePlan?.features || {
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
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        autoRenew: false
      }
    };
    
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: superAdminData.email });
    if (existingUser) {
      console.log('⚠️ Ya existe un usuario con ese email:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Nombre: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   isSuperAdmin: ${existingUser.isSuperAdmin}`);
      
      // Preguntar si quiere actualizar el usuario existente
      console.log('\n¿Quieres actualizar este usuario a Super Admin? (S/N)');
      return;
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superAdminData.password, salt);
    
    // Crear el super admin
    const newSuperAdmin = new User({
      name: superAdminData.name,
      email: superAdminData.email,
      password: hashedPassword,
      role: superAdminData.role,
      isSuperAdmin: superAdminData.isSuperAdmin,
      currentPlan: superAdminData.currentPlan,
      unlockedFeatures: superAdminData.unlockedFeatures,
      subscription: superAdminData.subscription
    });
    
    await newSuperAdmin.save();
    
    console.log('✅ Super Administrador creado exitosamente!');
    console.log('\n📋 Detalles del Super Admin:');
    console.log(`   Nombre: ${newSuperAdmin.name}`);
    console.log(`   Email: ${newSuperAdmin.email}`);
    console.log(`   Contraseña: ${superAdminData.password}`);
    console.log(`   Role: ${newSuperAdmin.role}`);
    console.log(`   isSuperAdmin: ${newSuperAdmin.isSuperAdmin}`);
    console.log(`   Plan: ${enterprisePlan?.name || 'Enterprise (por defecto)'}`);
    
    console.log('\n🔐 Credenciales de acceso:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Contraseña: ${superAdminData.password}`);
    
    console.log('\n⚠️ IMPORTANTE: Cambia la contraseña después del primer login!');
    
  } catch (error) {
    console.error('❌ Error al crear Super Administrador:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar el script
createSuperAdmin();
