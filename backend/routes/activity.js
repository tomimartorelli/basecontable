const express = require('express');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

// Registrar actividad
router.post('/activity', auth, async (req, res) => {
  try {
    const { action, details } = req.body;
    const activity = new Activity({
      user: req.user.userId,
      action,
      details
    });
    await activity.save();
    res.status(201).json({ message: 'Actividad registrada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar actividad.' });
  }
});

// Obtener historial de actividad del usuario autenticado o de cualquier usuario (solo admin)
router.get('/activity', auth, async (req, res) => {
  try {
    let userId = req.user.userId;
    // Si es admin y se pasa userId por query, puede ver la actividad de otros
    if (req.user.role === 'admin' && req.query.userId) {
      userId = req.query.userId;
    }
    const activities = await Activity.find({ user: userId }).sort({ createdAt: -1 });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial.' });
  }
});

module.exports = router; 