const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const config = require('../config');

const client = new OAuth2Client(config.google.clientId);

// POST /api/auth/google - Verificar token de Google y autenticar/crear usuario
router.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    // Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email no disponible en cuenta de Google' });
    }

    // Buscar usuario por email o googleId
    let user = await User.findOne({
      $or: [{ email }, { googleId }]
    });

    let isNewUser = false;

    if (user) {
      // Usuario existe - actualizar googleId si no lo tiene
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Crear nuevo usuario (sin plan asignado)
      isNewUser = true;
      
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: picture || null,
        role: 'user',
        currentPlan: null, // Sin plan asignado - deberá seleccionar uno
        isActive: true,
        // Generar contraseña aleatoria (no se usará)
        password: require('crypto').randomBytes(32).toString('hex')
      });

      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Cuenta desactivada. Contacte al administrador.' });
    }

    // Generar tokens JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      config.jwt.refreshSecret,
      { expiresIn: '7d' }
    );

    // Guardar refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Responder con datos del usuario
    res.json({
      message: 'Inicio de sesión con Google exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        company: user.company,
        position: user.position,
        plan: user.plan,
        currentPlan: user.plan ? { id: user.plan } : null
      },
      token,
      refreshToken,
      isNewUser
    });

  } catch (error) {
    console.error('Error en autenticación Google:', error);
    res.status(500).json({ message: 'Error al autenticar con Google' });
  }
});

module.exports = router;
