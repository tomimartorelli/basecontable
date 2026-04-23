import { API_BASE_URL } from '../config';

/**
 * Servicio para obtener configuración pública del backend
 * Esto permite mantener API keys seguras en el backend
 */
class ConfigService {
  constructor() {
    this.config = null;
    this.promise = null;
  }

  /**
   * Obtener configuración pública del backend
   * @returns {Promise<Object>} Configuración pública
   */
  async getPublicConfig() {
    // Si ya tenemos la configuración, devolverla
    if (this.config) {
      return this.config;
    }

    // Si ya hay una petición en curso, esperarla
    if (this.promise) {
      return this.promise;
    }

    // Crear nueva petición
    this.promise = fetch(`${API_BASE_URL}/api/config/public`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al obtener configuración');
        }
        return res.json();
      })
      .then(data => {
        this.config = data;
        return data;
      })
      .catch(err => {
        console.error('❌ ConfigService: Error al obtener configuración:', err);
        // Fallback: usar valores por defecto o variables de entorno
        this.config = {
          google: {
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || ''
          },
          server: {
            env: process.env.NODE_ENV || 'development'
          }
        };
        return this.config;
      });

    return this.promise;
  }

  /**
   * Obtener Google Client ID
   * @returns {Promise<string>} Google Client ID
   */
  async getGoogleClientId() {
    const config = await this.getPublicConfig();
    return config?.google?.clientId || process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }

  /**
   * Limpiar configuración cacheada (útil para testing)
   */
  clearCache() {
    this.config = null;
    this.promise = null;
  }
}

// Exportar singleton
export const configService = new ConfigService();
export default configService;
