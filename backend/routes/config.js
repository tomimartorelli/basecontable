const express = require('express');
const router = express.Router();
const config = require('../config');

/**
 * GET /api/config/public
 * Endpoint para obtener configuración pública del backend
 * Esto permite mantener API keys seguras en el backend
 */
router.get('/config/public', (req, res) => {
  try {
    // Solo exponer configuración pública (no secretos)
    const publicConfig = {
      google: {
        clientId: config.google.clientId
      },
      server: {
        env: config.server.env
      }
    };

    res.json(publicConfig);
  } catch (error) {
    console.error('Error al obtener configuración pública:', error);
    res.status(500).json({ message: 'Error al obtener configuración' });
  }
});

module.exports = router;
