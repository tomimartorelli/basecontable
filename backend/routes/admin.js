const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const Company = require('../models/Company');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const mongoose = require('mongoose');
const config = require('../config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// DEBUG: Log all requests to admin routes
router.use((req, res, next) => {
  console.log(`🔍 DEBUG ADMIN ROUTE - Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);
  next();
});

// Middleware para verificar que sea admin
router.use(auth);
router.use(isAdmin);

// Helper estándar para errores en rutas de administración
const sendError = (res, status, code, message) => {
  return res.status(status).json({ code, message });
};

// GET /api/admin/dashboard/stats - Estadísticas globales del sistema para el dashboard
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalInvoices,
      paidAgg,
      pendingInvoices,
      activeSubscriptions
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Invoice.countDocuments(),
      Invoice.aggregate([
        { $match: { estadoPago: 'pagada' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.countDocuments({ estadoPago: 'impaga' }),
      Company.countDocuments({ 'subscription.status': 'active' })
    ]);

    // Determinar salud del sistema a partir del estado de conexión a MongoDB
    const mongoState = mongoose.connection.readyState;
    let systemHealth = 'healthy';
    if (mongoState !== 1) {
      systemHealth = mongoState === 2 ? 'warning' : 'critical';
    }

    const totalRevenue = paidAgg.length > 0 ? paidAgg[0].total : 0;

    const stats = {
      totalUsers,
      totalCompanies,
      totalInvoices,
      totalRevenue,
      activeSubscriptions,
      pendingInvoices,
      systemHealth,
      lastBackup: null // Si en el futuro tienes backups, actualiza este campo
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Admin: Error al obtener estadísticas del dashboard:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al obtener estadísticas del dashboard.');
  }
});

// GET /api/admin/dashboard/activities - Actividad reciente del sistema para el dashboard
router.get('/dashboard/activities', async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email');

    const mapped = activities.map((activity) => ({
      action: activity.action,
      details: activity.details,
      user: activity.user ? (activity.user.name || activity.user.email) : 'Usuario',
      createdAt: activity.createdAt
    }));

    res.json(mapped);
  } catch (error) {
    console.error('❌ Admin: Error al obtener actividad del dashboard:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al obtener actividad del dashboard.');
  }
});

// GET /api/admin/users - Obtener todos los usuarios con información de planes
router.get('/users', async (req, res) => {
  try {
    console.log('🔍 Admin: Obteniendo usuarios...');
    const users = await User.find({}, '-password').populate('currentPlan');
    console.log(`📋 Admin: Usuarios encontrados: ${users.length}`);
    res.json(users);
  } catch (error) {
    console.error('❌ Admin: Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios.' });
  }
});

// POST /api/admin/users - Crear un nuevo usuario desde el panel de administración
router.post('/users', async (req, res) => {
  try {
    console.log('🔍 Admin: Creando nuevo usuario desde panel...');
    const { name, email, role, company, phone, status, currentPlan, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre, email y contraseña son obligatorios.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe un usuario con ese email.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let plan = null;
    if (currentPlan) {
      plan = await Plan.findById(currentPlan);
      if (!plan) {
        return sendError(res, 400, 'INVALID_PLAN', 'Plan seleccionado no es válido.');
      }
    }

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      company: company || '',
      phone: phone || '',
      // Estado de suscripción básico; el campo "status" del formulario se mapea aquí si viene
      subscription: {
        status: status || 'active',
        startDate: new Date(),
        autoRenew: false
      }
    };

    if (plan) {
      userData.currentPlan = plan._id;
      userData.unlockedFeatures = plan.features || {};
    }

    const newUser = new User(userData);
    await newUser.save();

    console.log(`✅ Admin: Usuario ${email} creado correctamente desde panel`);

    const userResponse = await User.findById(newUser._id).populate('currentPlan').select('-password -refreshToken');

    // Devolvemos solo los datos del usuario creado
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('❌ Admin: Error al crear usuario desde panel:', error);
    res.status(500).json({ message: 'Error al crear usuario.' });
  }
});

// GET /api/admin/plans - Obtener todos los planes disponibles
router.get('/plans', async (req, res) => {
  try {
    console.log('🔍 Admin: Obteniendo planes...');
    const plans = await Plan.find().sort({ price: 1 });
    console.log(`📋 Admin: Planes encontrados: ${plans.length}`);
    res.json(plans);
  } catch (error) {
    console.error('❌ Admin: Error al obtener planes:', error);
    res.status(500).json({ message: 'Error al obtener planes.' });
  }
});

// POST /api/admin/plans - Crear un nuevo plan
router.post('/plans', async (req, res) => {
  try {
    console.log('🔍 Admin: Creando nuevo plan...');
    const { name, slug, price, currency, billingCycle, features, maxEmployees, maxCompanies, maxTemplates, isActive, isPopular, description } = req.body;
    
    // Verificar si ya existe un plan con el mismo slug
    const existingPlan = await Plan.findOne({ slug });
    if (existingPlan) {
      return res.status(400).json({ message: 'Ya existe un plan con ese slug.' });
    }
    
    const planData = {
      name,
      slug,
      price: parseFloat(price),
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      features: features || {},
      maxEmployees: parseInt(maxEmployees) || 1,
      maxCompanies: parseInt(maxCompanies) || 1,
      maxTemplates: parseInt(maxTemplates) || 1,
      isActive: isActive !== undefined ? isActive : true,
      isPopular: isPopular || false,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const plan = new Plan(planData);
    await plan.save();
    
    console.log(`✅ Admin: Plan ${name} creado correctamente`);
    res.status(201).json(plan);
  } catch (error) {
    console.error('❌ Admin: Error al crear plan:', error);
    res.status(500).json({ message: 'Error al crear el plan.' });
  }
});

// PUT /api/admin/plans/:id - Actualizar plan
router.put('/plans/:id', async (req, res) => {
  try {
    console.log(`🔍 Admin: Actualizando plan ${req.params.id}...`);
    const { name, slug, price, currency, billingCycle, features, maxEmployees, maxCompanies, maxTemplates, isActive, isPopular, description } = req.body;
    
    // Verificar si ya existe otro plan con el mismo slug (excluyendo el actual)
    const existingPlan = await Plan.findOne({ slug, _id: { $ne: req.params.id } });
    if (existingPlan) {
      return res.status(400).json({ message: 'Ya existe otro plan con ese slug.' });
    }
    
    const updateFields = {
      name,
      slug,
      price: parseFloat(price),
      currency: currency || 'USD',
      billingCycle: billingCycle || 'monthly',
      features: features || {},
      maxEmployees: parseInt(maxEmployees) || 1,
      maxCompanies: parseInt(maxCompanies) || 1,
      maxTemplates: parseInt(maxTemplates) || 1,
      isActive: isActive !== undefined ? isActive : true,
      isPopular: isPopular || false,
      description: description || '',
      updatedAt: new Date()
    };
    
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado.' });
    }
    
    console.log(`✅ Admin: Plan ${plan.name} actualizado correctamente`);
    res.json(plan);
  } catch (error) {
    console.error('❌ Admin: Error al actualizar plan:', error);
    res.status(500).json({ message: 'Error al actualizar el plan.' });
  }
});

// DELETE /api/admin/plans/:id - Eliminar plan
router.delete('/plans/:id', async (req, res) => {
  try {
    console.log(`🔍 Admin: Eliminando plan ${req.params.id}...`);
    
    // Verificar si hay usuarios usando este plan
    const usersWithPlan = await User.find({ currentPlan: req.params.id });
    if (usersWithPlan.length > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el plan porque ${usersWithPlan.length} usuario(s) lo están usando.` 
      });
    }
    
    // Verificar si hay empresas usando este plan
    const Company = require('../models/Company');
    const companiesWithPlan = await Company.find({ plan: req.params.id });
    if (companiesWithPlan.length > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el plan porque ${companiesWithPlan.length} empresa(s) lo están usando.` 
      });
    }
    
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado.' });
    }
    
    console.log(`🗑️ Admin: Plan ${plan.name} eliminado correctamente`);
    res.json({ message: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('❌ Admin: Error al eliminar plan:', error);
    res.status(500).json({ message: 'Error al eliminar el plan.' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario (incluyendo plan)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, password, currentPlan } = req.body;
    const updateFields = {};
    
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }
    
    // Si se está actualizando el plan, validar que exista y actualizar funcionalidades
    if (currentPlan) {
      const plan = await Plan.findById(currentPlan);
      if (!plan) {
        return res.status(400).json({ message: 'Plan no válido.' });
      }
      
      updateFields.currentPlan = currentPlan;
      updateFields.unlockedFeatures = plan.features;
      
      console.log(`🔄 Admin: Actualizando plan del usuario ${req.params.id} a ${plan.name}`);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true, context: 'query' }
    ).populate('currentPlan').select('-password');
    
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    
    console.log(`✅ Admin: Usuario ${user.email} actualizado correctamente`);
    res.json(user);
  } catch (error) {
    console.error('❌ Admin: Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario.' });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    console.log(`🗑️ Admin: Usuario ${user.email} eliminado correctamente`);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('❌ Admin: Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario.' });
  }
});

// GET /api/admin/companies - Obtener todas las empresas del sistema
router.get('/companies', async (req, res) => {
  try {
    console.log('🔍 Admin: Obteniendo empresas...');
    const Company = require('../models/Company');
    const companies = await Company.find()
      .populate('owner', 'name email')
      .populate('plan', 'name price')
      .sort({ createdAt: -1 });
    
    console.log(`📋 Admin: Empresas encontradas: ${companies.length}`);
    res.json(companies);
  } catch (error) {
    console.error('❌ Admin: Error al obtener empresas:', error);
    res.status(500).json({ message: 'Error al obtener empresas.' });
  }
});

// POST /api/admin/companies - Crear una nueva empresa
router.post('/companies', async (req, res) => {
  try {
    console.log('🔍 Admin: Creando nueva empresa...');
    const Company = require('../models/Company');
    const Plan = require('../models/Plan');
    
    const { name, legalName, taxId, address, city, country, phone, email, website, status, industry, employees } = req.body;
    
    // Buscar un plan por defecto (puedes ajustar esto según tu lógica)
    const defaultPlan = await Plan.findOne({ isActive: true }).sort({ price: 1 });
    if (!defaultPlan) {
      return res.status(400).json({ message: 'No hay planes disponibles para crear empresas.' });
    }
    
    const companyData = {
      name,
      legalName,
      taxId,
      address: { street: address, city, country },
      contact: { phone, email, website },
      owner: req.user._id, // El admin que crea la empresa
      plan: defaultPlan._id,
      subscription: { status: status || 'active' },
      isActive: status === 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const company = new Company(companyData);
    await company.save();
    
    console.log(`✅ Admin: Empresa ${name} creada correctamente`);
    res.status(201).json(company);
  } catch (error) {
    console.error('❌ Admin: Error al crear empresa:', error);
    res.status(500).json({ message: 'Error al crear empresa.' });
  }
});

// PUT /api/admin/companies/:id - Actualizar empresa
router.put('/companies/:id', async (req, res) => {
  try {
    console.log(`🔍 Admin: Actualizando empresa ${req.params.id}...`);
    const Company = require('../models/Company');
    
    const { name, legalName, taxId, address, city, country, phone, email, website, status, industry, employees } = req.body;
    
    const updateFields = {
      name,
      legalName,
      taxId,
      address: { street: address, city, country },
      contact: { phone, email, website },
      isActive: status === 'active',
      updatedAt: new Date()
    };
    
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('owner', 'name email').populate('plan', 'name price');
    
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada.' });
    }
    
    console.log(`✅ Admin: Empresa ${company.name} actualizada correctamente`);
    res.json(company);
  } catch (error) {
    console.error('❌ Admin: Error al actualizar empresa:', error);
    res.status(500).json({ message: 'Error al actualizar empresa.' });
  }
});

// DELETE /api/admin/companies/:id - Eliminar empresa
router.delete('/companies/:id', async (req, res) => {
  try {
    console.log(`🔍 Admin: Eliminando empresa ${req.params.id}...`);
    const Company = require('../models/Company');
    
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada.' });
    }
    
    console.log(`🗑️ Admin: Empresa ${company.name} eliminada correctamente`);
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    console.error('❌ Admin: Error al eliminar empresa:', error);
    res.status(500).json({ message: 'Error al eliminar empresa.' });
  }
});

module.exports = router;
