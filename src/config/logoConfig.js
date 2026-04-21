// Configuración para el manejo de logos
export const LOGO_CONFIG = {
  // Límites de tamaño
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB - archivo original
  MAX_BASE64_SIZE: 50 * 1024 * 1024, // 50MB - base64 comprimido
  COMPRESSION_THRESHOLD: 2 * 1024 * 1024, // 2MB - umbral para comprimir
  
  // Configuración de compresión
  COMPRESSION: {
    MAX_WIDTH: 800, // Ancho máximo en píxeles
    QUALITY: 0.7, // Calidad JPEG (0.1 - 1.0)
    FORMAT: 'image/jpeg' // Formato de salida
  },
  
  // Tipos de archivo permitidos
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ],
  
  // Mensajes de error
  MESSAGES: {
    FILE_TOO_LARGE: 'El archivo es demasiado grande. El tamaño máximo es 10MB.',
    INVALID_TYPE: 'Por favor selecciona solo archivos de imagen (JPG, PNG, GIF, etc.).',
    COMPRESSION_ERROR: 'Error al comprimir la imagen. Por favor intenta con otro archivo.',
    UPLOAD_ERROR: 'Error al procesar el archivo. Por favor intenta nuevamente.'
  }
};

// Función para validar tipo de archivo
export const isValidImageType = (fileType) => {
  return LOGO_CONFIG.ALLOWED_TYPES.includes(fileType);
};

// Función para validar tamaño de archivo
export const isValidFileSize = (fileSize) => {
  return fileSize <= LOGO_CONFIG.MAX_FILE_SIZE;
};

// Función para validar tamaño base64
export const isValidBase64Size = (base64Length) => {
  return base64Length <= LOGO_CONFIG.MAX_BASE64_SIZE;
};

// Función para formatear tamaño en MB
export const formatSizeInMB = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2);
};
