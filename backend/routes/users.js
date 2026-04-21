const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Plan = require('../models/Plan');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para subida de avatares
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
  }
});

// Middleware para manejar errores de multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'La imagen debe ser menor a 5MB.' });
    }
    return res.status(400).json({ message: 'Error al procesar el archivo.' });
  } else if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
};

// GET /api/users/me - Obtener información del usuario autenticado
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('_id name email role isSuperAdmin phone address company position currentPlan subscription ownedCompanies employeeOf unlockedFeatures avatar createdAt lastLogin')
      .populate('currentPlan');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Asegurar que isSuperAdmin esté incluido
    const userResponse = user.toObject();
    if (userResponse.isSuperAdmin === undefined) {
      userResponse.isSuperAdmin = false;
    }
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error en /api/users/me:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/company-users', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin ve todos los usuarios
      const users = await User.find({}).select('-password -refreshToken');
      return res.json(users);
    }
    
    // Para usuarios normales, solo mostrar su propio perfil
    // (hasta que se configuren empresas correctamente)
    const ownUser = await User.findById(req.user.userId).select('-password -refreshToken');
    return res.json([ownUser]);
    
  } catch (error) {
    console.error('Error al obtener usuarios de la empresa:', error);
    res.status(500).json({ message: 'Error al obtener usuarios de la empresa.' });
  }
});

// Actualizar perfil del usuario actual
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, address, company, position } = req.body;
    
    // Validar que el email no esté en uso por otro usuario
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso por otro usuario.' });
      }
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (company !== undefined) updateFields.company = company;
    if (position !== undefined) updateFields.position = position;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({
      message: 'Perfil actualizado correctamente.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil.' });
  }
});

// Cambiar contraseña del usuario actual
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son obligatorias.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    // Obtener el usuario con la contraseña actual
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña.' });
  }
});

// Obtener información de la cuenta
router.get('/account-info', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error al obtener información de cuenta:', error);
    res.status(500).json({ message: 'Error al obtener la información de la cuenta.' });
  }
});

// Subir avatar del usuario
router.post('/avatar', requireAuth, upload.single('avatar'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha seleccionado ningún archivo.' });
    }

    // Validar tipo de archivo
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Solo se permiten archivos de imagen.' });
    }

    // Validar tamaño (máximo 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'La imagen debe ser menor a 5MB.' });
    }

    // Si ya hay un avatar, eliminar el archivo anterior
    const user = await User.findById(req.user.userId);
    if (user.avatar) {
      const prevPath = path.join(__dirname, '../uploads/avatars', user.avatar);
      if (fs.existsSync(prevPath)) {
        fs.unlinkSync(prevPath);
      }
    }

    // Guardar el nombre del archivo en la base de datos
    user.avatar = req.file.filename;
    await user.save();

    res.json({
      message: 'Avatar subido correctamente.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.status(500).json({ message: 'Error al subir el avatar.' });
  }
});

// Obtener avatar del usuario (sin autenticación para permitir carga de imágenes)
router.get('/avatar/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validar que el nombre del archivo tenga el formato correcto
    if (!filename.toLowerCase().startsWith('avatar-')) {
      return res.status(400).json({ message: 'Nombre de archivo inválido.' });
    }
    
    const filePath = path.join(__dirname, '../uploads/avatars', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Avatar no encontrado.' });
    }
    
    // Establecer headers para evitar cache y permitir carga de imágenes
    res.setHeader('Content-Type', 'image/*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error al obtener avatar:', error);
    res.status(500).json({ message: 'Error al obtener el avatar.' });
  }
});

// Eliminar avatar del usuario
router.delete('/avatar', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (!user.avatar) {
      return res.status(400).json({ message: 'El usuario no tiene avatar personalizado.' });
    }

    // Eliminar el archivo físico
    const filePath = path.join(__dirname, '../uploads/avatars', user.avatar);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar la referencia en la base de datos
    user.avatar = undefined;
    await user.save();

    res.json({
      message: 'Avatar eliminado correctamente.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    res.status(500).json({ message: 'Error al eliminar el avatar.' });
  }
});

// POST /api/users/subscribe - Asignar plan al usuario
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    console.log('🔍 POST /subscribe - planId recibido:', planId);

    if (!planId) {
      return res.status(400).json({ message: 'ID del plan requerido' });
    }

    // Verificar que el plan existe
    const plan = await Plan.findById(planId);
    console.log('🔍 Plan encontrado:', plan?.name || 'NO ENCONTRADO');
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // Actualizar usuario con el plan seleccionado
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { currentPlan: planId },
      { new: true }
    ).select('-password');

    console.log('🔍 Usuario actualizado - currentPlan:', user?.currentPlan);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Plan asignado correctamente',
      user
    });
  } catch (error) {
    console.error('Error al asignar plan:', error);
    res.status(500).json({ message: 'Error al asignar el plan' });
  }
});

module.exports = router;