 const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Plan = require('../models/Plan');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middleware/auth');
const crypto = require('crypto');
const config = require('../config');
const { loginRateLimit } = require('../middleware/rateLimit');
const nodemailer = require('nodemailer');

const router = express.Router();

// Helper estándar para errores
const sendError = (res, status, code, message) => {
  return res.status(status).json({ code, message });
};

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, userType, selectedPlan, company } = req.body;
    
    if (!name || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Todos los campos son obligatorios.');
    }
    
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(
        res,
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Este email ya tiene una cuenta en Contasuite. Probá iniciar sesión o recuperar tu contraseña.'
      );
    }
    
    console.log('Plan seleccionado recibido:', selectedPlan);
    
    // Validar plan seleccionado
    let plan;
    if (selectedPlan) {
      console.log('Buscando plan con ID:', selectedPlan);
      plan = await Plan.findById(selectedPlan);
      console.log('Plan encontrado:', plan);
      if (!plan) {
        console.log('Plan no encontrado, buscando por nombre alternativo...');
        // Intentar buscar por nombre si el ID no funciona
        plan = await Plan.findOne({ 
          $or: [
            { name: 'Profesional' },
            { name: 'Professional' },
            { slug: 'profesional' },
            { slug: 'professional' }
          ]
        });
        if (plan) {
          console.log('Plan encontrado por nombre:', plan.name);
        } else {
          return sendError(res, 400, 'INVALID_PLAN', 'Plan seleccionado no válido.');
        }
      }
    } else {
      console.log('No se recibió plan, usando plan gratuito por defecto');
      // Obtener el plan gratuito por defecto
      plan = await Plan.findOne({ 
        $or: [
          { name: 'Básico' },
          { name: 'Basic' },
          { name: 'Gratuito' },
          { price: 0 }
        ]
      });
      if (!plan) {
        return sendError(res, 500, 'MISSING_DEFAULT_PLAN', 'Error: Plan gratuito no encontrado en el sistema.');
      }
    }
    
    // Validar campos de empresa si es necesario
    if (userType === 'company') {
      if (!company || !company.name || !company.legalName || !company.taxId) {
      return sendError(
        res,
        400,
        'COMPANY_FIELDS_REQUIRED',
        'Para empresas, nombre, razón social y CUIT son obligatorios.'
      );
      }
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Determinar el rol del usuario
    let userRole = 'user';
    if (userType === 'company') {
      userRole = 'company_owner';
    }
    
    console.log('Plan asignado al usuario:', plan.name, 'ID:', plan._id);
    
    // Crear usuario con plan seleccionado
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword, 
      role: userRole,
      currentPlan: plan._id,
      subscription: {
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        autoRenew: false
      },
      unlockedFeatures: plan.features,
      // Campos adicionales para empresas
      ...(company && {
        company: company.name,
        phone: company.phone,
        address: company.address?.street
      })
    });
    
    await newUser.save();
    
    // Si es empresa, crear la empresa
    if (userType === 'company' && company) {
      const Company = require('../models/Company');
      const newCompany = new Company({
        name: company.name,
        legalName: company.legalName,
        taxId: company.taxId,
        phone: company.phone,
        address: company.address,
        owner: newUser._id,
        plan: plan._id,
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: false
        }
      });
      
      await newCompany.save();
      
      // Actualizar usuario con la empresa creada
      newUser.ownedCompanies.push(newCompany._id);
      await newUser.save();
    }
    
    res.status(201).json({ 
      message: 'Usuario registrado correctamente.',
      plan: {
        name: plan.name,
        price: plan.price,
        features: plan.features
      },
      userType,
      companyCreated: userType === 'company'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error en el servidor.');
  }
});

// Login de usuario (protegido por rate limit básico)
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Email y contraseña son obligatorios.');
    }
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.');
    }
    // Empleados nunca son superadmin; evitar herencia de datos de otro rol
    const isSuperAdmin = user.role === 'employee' ? false : (user.isSuperAdmin || false);
    const token = jwt.sign(
      { 
        userId: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isSuperAdmin,
        ownedCompanies: user.role === 'employee' ? [] : (user.ownedCompanies || []),
        employeeOf: user.employeeOf || []
      },
      config.jwt.secret,
      { expiresIn: '2h' }
    );
    // Generar refreshToken único
    const refreshToken = crypto.randomBytes(64).toString('hex');
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();
    // Obtener información completa del plan del usuario
    let userPlan = null;
    if (user.currentPlan) {
      userPlan = await Plan.findById(user.currentPlan);
    }
    
    res.json({
      token,
      refreshToken,
      user: { 
        _id: user._id,
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isSuperAdmin,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        currentPlan: userPlan ? {
          id: userPlan._id,
          name: userPlan.name,
          slug: userPlan.slug,
          price: userPlan.price,
          features: userPlan.features
        } : null,
        unlockedFeatures: user.unlockedFeatures
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error en el servidor.');
  }
});

// Solicitar restablecimiento de contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'El email es obligatorio.');
    }

    const user = await User.findOne({ email });

    // Siempre respondemos 200 para no filtrar si el mail existe o no
    if (!user) {
      return res.json({
        message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/restablecer-clave?token=${token}&email=${encodeURIComponent(email)}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@basecontable.com',
      to: email,
      subject: 'Restablecer tu contraseña de Contasuite',
      text:
`Hola ${user.name || ''},

Recibimos un pedido para restablecer la contraseña de tu cuenta en Contasuite.

Para elegir una nueva contraseña, hacé clic en el siguiente enlace (válido por 1 hora):
${resetLink}

Si vos no pediste este cambio, podés ignorar este mensaje. Tu cuenta va a seguir igual.

Equipo Contasuite`
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      message: 'Si el email está registrado, te enviamos un enlace para restablecer la contraseña.'
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al procesar el pedido de restablecimiento.');
  }
});

// Confirmar restablecimiento de contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Token, email y nueva contraseña son obligatorios.');
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return sendError(
        res,
        400,
        'RESET_TOKEN_INVALID',
        'El enlace para restablecer la contraseña no es válido o ya venció. Pedí uno nuevo.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null; // invalidar sesiones previas
    await user.save();

    return res.json({
      message: 'Tu contraseña se actualizó correctamente. Ahora podés iniciar sesión.'
    });
  } catch (error) {
    console.error('Error en reset-password:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al restablecer la contraseña.');
  }
});

// Endpoint para refrescar el token de acceso
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Refresh token requerido.');
    }
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return sendError(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token inválido.');
    }
    const isSuperAdmin = user.role === 'employee' ? false : (user.isSuperAdmin || false);
    const token = jwt.sign(
      { 
        userId: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isSuperAdmin,
        ownedCompanies: user.role === 'employee' ? [] : (user.ownedCompanies || []),
        employeeOf: user.employeeOf || []
      },
      config.jwt.secret,
      { expiresIn: '2h' }
    );
    // Rotar refreshToken para evitar reutilización indefinida
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al refrescar token.');
  }
});

// Listar todos los usuarios (solo admin)
router.get('/users', require('../middleware/auth'), isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').populate('currentPlan'); // Incluir información del plan
    console.log(`📋 Admin: Usuarios encontrados: ${users.length}`);
    res.json(users);
  } catch (error) {
    console.error('❌ Admin: Error al obtener usuarios:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al obtener usuarios.');
  }
});

// Obtener todos los planes disponibles (público para registro)
router.get('/plans', async (req, res) => {
  try {
    const plans = await Plan.find({ 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al obtener planes.');
  }
});

// Obtener todos los planes disponibles (solo admin)
router.get('/admin/plans', require('../middleware/auth'), isAdmin, async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Error al obtener planes admin:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error al obtener planes.');
  }
});

module.exports = router;