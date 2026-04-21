import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export const useApi = () => {
  const { token, refreshToken, login, logout, user } = useContext(AuthContext);

  // Helper para refrescar el token
  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!res.ok) throw new Error('No se pudo refrescar el token');
      const data = await res.json();
      if (data.token) {
        // Solo actualiza si el token es diferente
        if (data.token !== token) {
          login(user, data.token, refreshToken);
        }
        return data.token;
      }
      throw new Error('No se pudo refrescar el token');
    } catch (err) {
      // Solo hacer logout una vez y mostrar mensaje
      if (typeof window !== 'undefined') {
        window.alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      logout();
      throw err;
    }
  }, [token, refreshToken, login, logout, user]);

  // fetch seguro con refresco automático (sin cola offline)
  const secureFetch = useCallback(
    async (url, options = {}, retry = true) => {
      if (!url) {
        console.error('URL es undefined en secureFetch');
        throw new Error('URL no puede ser undefined');
      }

      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

      const headers = options.headers ? { ...options.headers } : {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        console.log(`🌐 useApi: Llamando a ${fullUrl}`);
        const res = await fetch(fullUrl, { ...options, headers });

        if (res.status === 401 && retry && refreshToken) {
          const newToken = await refreshAccessToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          return await fetch(fullUrl, { ...options, headers });
        }

        return res;
      } catch (err) {
        console.error('❌ useApi: Error en fetch:', err);
        throw err;
      }
    },
    [token, refreshToken, refreshAccessToken]
  );

  return { secureFetch };
}; 