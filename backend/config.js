// Configuración del backend
module.exports = {
  // Configuración de MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable',
    options: {
      // Opciones modernas de MongoDB (las anteriores están deprecadas)
    }
  },
  
  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_jwt_basecontable_2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secreto_jwt_2024',
    expiresIn: '7d'
  },

  // Configuración Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },

  // Configuración del servidor
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Configuración de archivos
  uploads: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  }
};
