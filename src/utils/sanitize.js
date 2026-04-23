/**
 * Utilidades de sanitización para prevenir XSS y ataques de inyección
 * Sanitiza inputs de usuario en el frontend
 * Usa solo métodos nativos (sin dependencias externas)
 */

import { useState, useCallback } from 'react';

/**
 * Sanitiza texto plano - remueve tags HTML y caracteres peligrosos
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export const sanitizeText = (input) => {
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
  
  // Remover caracteres de control y null bytes (eslint-disable-next-line por uso intencional)
  // eslint-disable-next-line no-control-regex
  return escaped.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
};

/**
 * Sanitiza HTML permitiendo solo tags seguros
 * @param {string} input - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  // Permitir solo tags básicos de formato
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];
  
  // Remover todos los tags excepto los permitidos
  let sanitized = input.replace(/<\/?([^>]+)>/g, (match, tag) => {
    const tagName = tag.toLowerCase().split(' ')[0];
    return allowedTags.includes(tagName) ? match : '';
  });
  
  // Remover atributos de los tags permitidos (mantener solo el tag)
  sanitized = sanitized.replace(/<([a-z]+)[^>]*>/gi, '<$1>');
  
  // Escapar caracteres especiales restantes
  return sanitizeText(sanitized);
};

/**
 * Sanitiza email - valida formato y remueve caracteres peligrosos
 * @param {string} input - Email a sanitizar
 * @returns {string} Email sanitizado
 */
export const sanitizeEmail = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remover espacios y caracteres no permitidos en email
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._%+-@]/g, '');
};

/**
 * Sanitiza números - asegura que sea un número válido
 * @param {any} input - Valor a sanitizar
 * @returns {number} Número sanitizado
 */
export const sanitizeNumber = (input) => {
  const num = parseFloat(input);
  return isNaN(num) ? 0 : num;
};

/**
 * Sanitiza IDs de MongoDB (24 caracteres hex)
 * @param {string} input - ID a sanitizar
 * @returns {string|null} ID sanitizado o null si es inválido
 */
export const sanitizeMongoId = (input) => {
  if (typeof input !== 'string') return null;
  
  const sanitized = input.replace(/[^a-f0-9]/gi, '');
  return sanitized.length === 24 ? sanitized : null;
};

/**
 * Sanitiza nombres de archivos
 * @param {string} input - Nombre de archivo
 * @returns {string} Nombre sanitizado
 */
export const sanitizeFilename = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[<>'"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.\./g, '.')
    .substring(0, 255);
};

/**
 * Sanitiza objetos completos recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeText(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitizar la key también
    const cleanKey = sanitizeText(key);
    sanitized[cleanKey] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * Hook personalizado para inputs sanitizados
 * @param {string} initialValue - Valor inicial
 * @param {Function} sanitizer - Función de sanitización
 * @returns {Object} { value, onChange, setValue }
 */
export const useSanitizedInput = (initialValue = '', sanitizer = sanitizeText) => {
  const [value, setValue] = useState(initialValue);
  
  const onChange = useCallback((e) => {
    const rawValue = e.target?.value ?? e;
    setValue(sanitizer(rawValue));
  }, [sanitizer]);
  
  return { value, onChange, setValue };
};

/**
 * Validador de inputs comunes
 */
export const validators = {
  email: (value) => {
    const email = sanitizeEmail(value);
    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return regex.test(email) ? { valid: true, value: email } : { valid: false, error: 'Email inválido' };
  },
  
  password: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Contraseña requerida' };
    if (value.length < 8) return { valid: false, error: 'Mínimo 8 caracteres' };
    if (!/[A-Z]/.test(value)) return { valid: false, error: 'Debe contener mayúscula' };
    if (!/[a-z]/.test(value)) return { valid: false, error: 'Debe contener minúscula' };
    if (!/[0-9]/.test(value)) return { valid: false, error: 'Debe contener número' };
    return { valid: true, value };
  },
  
  phone: (value) => {
    const cleaned = value.replace(/[^0-9+\s()-]/g, '');
    return cleaned.length >= 8 
      ? { valid: true, value: cleaned }
      : { valid: false, error: 'Teléfono inválido' };
  },
  
  required: (value) => {
    const str = typeof value === 'string' ? value.trim() : String(value);
    return str.length > 0
      ? { valid: true, value: str }
      : { valid: false, error: 'Campo requerido' };
  }
};

const sanitizeUtils = {
  sanitizeText,
  sanitizeHtml,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeMongoId,
  sanitizeFilename,
  sanitizeObject,
  useSanitizedInput,
  validators
};

export default sanitizeUtils;
