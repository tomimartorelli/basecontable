import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { configService } from '../services/configService';

/**
 * Google OAuth Provider asíncrono
 * Obtiene el Client ID desde el backend en lugar de usar variables de entorno
 * Esto mejora la seguridad al no exponer el Client ID en el build del frontend
 */
const AsyncGoogleOAuthProvider = ({ children }) => {
  const [clientId, setClientId] = useState(process.env.REACT_APP_GOOGLE_CLIENT_ID || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Intentar obtener el Client ID desde el backend
        const backendClientId = await configService.getGoogleClientId();
        if (backendClientId) {
          setClientId(backendClientId);
          console.log('✅ AsyncGoogleOAuthProvider: Client ID cargado desde backend');
        } else {
          console.warn('⚠️ AsyncGoogleOAuthProvider: No se pudo obtener Client ID del backend, usando fallback');
        }
      } catch (err) {
        console.error('❌ AsyncGoogleOAuthProvider: Error al cargar configuración:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Mientras carga, usar el Client ID de fallback (variable de entorno)
  if (loading && !clientId) {
    return <div>Cargando...</div>;
  }

  if (!clientId) {
    console.error('❌ AsyncGoogleOAuthProvider: No hay Google Client ID disponible');
    // Renderizar sin Google OAuth (la app funcionará pero sin login de Google)
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default AsyncGoogleOAuthProvider;
