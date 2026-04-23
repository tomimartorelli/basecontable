/**
 * Middleware de sanitización para Express
 * Sanitiza todas las entradas de usuario en el backend
 * Usa solo métodos nativos (sin dependencias externas)
 */

/**
 * Sanitiza texto plano
 * @param {string} input 
 * @returns {string}
 */
const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remover tags HTML
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Escapar caracteres especiales
  const escaped = withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remover caracteres de control y null bytes (peligrosos para MongoDB)
  return escaped.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
};

/**
 * Sanitiza email
 * @param {string} input 
 * @returns {string}
 */
const sanitizeEmail = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._%+-@]/g, '');
};

/**
 * Sanitiza MongoDB ID
 * @param {string} input 
 * @returns {string|null}
 */
const sanitizeMongoId = (input) => {
  if (typeof input !== 'string') return null;
  const sanitized = input.replace(/[^a-f0-9]/gi, '');
  return sanitized.length === 24 ? sanitized : null;
};

/**
 * Sanitiza números
 * @param {any} input 
 * @returns {number}
 */
const sanitizeNumber = (input) => {
  const num = parseFloat(input);
  return isNaN(num) ? 0 : num;
};

/**
 * Sanitiza recursivamente objetos
 * @param {any} obj 
 * @returns {any}
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeText(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitizar key también
    const cleanKey = sanitizeText(key).replace(/\./g, ''); // Prevenir NoSQL injection
    sanitized[cleanKey] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * Detecta patrones de inyección NoSQL
 * @param {any} obj 
 * @returns {boolean}
 */
const detectNoSQLInjection = (obj) => {
  const dangerous = ['$where', '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$regex', '$options', '$or', '$and'];
  
  const check = (value) => {
    if (typeof value === 'string') {
      return dangerous.some(d => value.includes(d));
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        if (dangerous.some(d => key.startsWith(d))) return true;
        if (check(value[key])) return true;
      }
    }
    return false;
  };
  
  return check(obj);
};

/**
 * Middleware principal de sanitización
 */
const sanitizeMiddleware = (req, res, next) => {
  try {
    // Detectar intentos de inyección NoSQL
    if (detectNoSQLInjection(req.body) || 
        detectNoSQLInjection(req.query) || 
        detectNoSQLInjection(req.params)) {
      console.warn('⚠️ Posible intento de NoSQL injection detectado:', {
        ip: req.ip,
        path: req.path,
        body: req.body,
        query: req.query
      });
      return res.status(400).json({ 
        message: 'Solicitud inválida',
        error: 'Caracteres no permitidos detectados'
      });
    }
    
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeText(req.query[key]);
        }
      }
    }
    
    // Sanitizar URL params
    if (req.params && typeof req.params === 'object') {
      for (const key of Object.keys(req.params)) {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeText(req.params[key]);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en sanitización:', error);
    res.status(500).json({ message: 'Error al procesar solicitud' });
  }
};

/**
 * Middleware específico para campos de email
 */
const sanitizeEmailField = (fieldName) => {
  return (req, res, next) => {
    if (req.body && req.body[fieldName]) {
      req.body[fieldName] = sanitizeEmail(req.body[fieldName]);
    }
    next();
  };
};

/**
 * Middleware específico para MongoDB IDs
 */
const sanitizeMongoIdField = (fieldName) => {
  return (req, res, next) => {
    if (req.body && req.body[fieldName]) {
      const sanitized = sanitizeMongoId(req.body[fieldName]);
      if (!sanitized) {
        return res.status(400).json({ message: `ID inválido: ${fieldName}` });
      }
      req.body[fieldName] = sanitized;
    }
    if (req.params && req.params[fieldName]) {
      const sanitized = sanitizeMongoId(req.params[fieldName]);
      if (!sanitized) {
        return res.status(400).json({ message: `ID inválido: ${fieldName}` });
      }
      req.params[fieldName] = sanitized;
    }
    next();
  };
};

module.exports = {
  sanitizeMiddleware,
  sanitizeEmailField,
  sanitizeMongoIdField,
  sanitizeText,
  sanitizeEmail,
  sanitizeMongoId,
  sanitizeNumber,
  sanitizeObject
};
