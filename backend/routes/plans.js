const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

// GET /api/plans - Obtener todos los planes activos
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Planes: Buscando planes...');
    
    // Buscar todos los planes, incluyendo los que no tienen isActive definido
    const plans = await Plan.find({ 
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    }).sort({ price: 1 });
    
    console.log(`📋 Planes: Encontrados ${plans.length} planes`);
    
    if (plans.length === 0) {
      console.log('⚠️ No se encontraron planes, creando planes por defecto...');
      // Aquí podrías crear planes por defecto si no hay ninguno
    }
    
    res.json(plans);
  } catch (error) {
    console.error('❌ Error al obtener planes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/plans/:id - Obtener un plan específico por ID
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Error al obtener plan:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/plans - Crear un nuevo plan (solo admin)
router.post('/', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un plan con ese slug' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/plans/:id - Actualizar un plan (solo admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error al actualizar plan:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/plans/:id - Eliminar un plan (solo admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    res.json({ message: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/plans/:id/activate - Activar/desactivar un plan (solo admin)
router.post('/:id/activate', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: !req.body.deactivate },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error al cambiar estado del plan:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
