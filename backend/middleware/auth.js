const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  console.log('===== MIDDLEWARE DE AUTENTICACIÓN =====');
  console.log('Ruta solicitada:', req.originalUrl);
  console.log('Método HTTP:', req.method);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('Headers de autorización:', authHeader ? 'Presente' : 'Ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token no proporcionado o formato incorrecto');
      return res.status(401).json({ message: 'Acceso no autorizado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extraído:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, config.jwt.secret);
    console.log('Token verificado correctamente', decoded);

    // Obtener información actualizada del usuario de la base de datos
    const user = await User.findById(decoded.userId).populate('currentPlan');
    
    if (!user) {
      console.log('Usuario no encontrado en la base de datos');
      return res.status(401).json({ message: 'Usuario no encontrado.' });
    }

    // Configurar req.user con la información del token
    req.user = {
      userId: decoded.userId,
      _id: decoded.userId, // Para compatibilidad
      email: decoded.email || user.email,
      role: decoded.role || user.role,
      isSuperAdmin: decoded.isSuperAdmin || user.isSuperAdmin || false,
      name: decoded.name || user.name,
      ownedCompanies: decoded.ownedCompanies || user.ownedCompanies || [],
      employeeOf: decoded.employeeOf || user.employeeOf || [],
      currentPlan: user.currentPlan,
      subscription: user.subscription,
      unlockedFeatures: user.unlockedFeatures || {}
    };

    console.log('Usuario configurado en req.user:', {
      userId: req.user.userId,
      role: req.user.role,
      isSuperAdmin: req.user.isSuperAdmin,
      ownedCompanies: req.user.ownedCompanies?.length || 0
    });
    console.log('===== AUTENTICACIÓN EXITOSA =====');
    next();
  } catch (error) {
    console.error('Error en autenticación:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    return res.status(500).json({ message: 'Error en la autenticación.' });
  }
};

const isAdmin = function (req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso solo para administradores.' });
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.isAdmin = isAdmin;