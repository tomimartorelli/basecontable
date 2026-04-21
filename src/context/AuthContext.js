import React, { createContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener usuario actualizado del backend
  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ AuthContext: Usuario actualizado del backend:', userData);
        console.log('✅ AuthContext: currentPlan del backend:', userData.currentPlan);
        console.log('✅ AuthContext: unlockedFeatures del backend:', userData.unlockedFeatures);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } else {
        console.error('❌ AuthContext: Error al obtener usuario:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ AuthContext: Error en fetchCurrentUser:', error);
      return null;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      if (storedRefreshToken) setRefreshToken(storedRefreshToken);
      
      // Obtener usuario actualizado del backend
      fetchCurrentUser(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, token, refreshTokenValue) => {
    console.log('🔐 AuthContext: Login con datos:', userData);
    console.log('🔐 AuthContext: Plan del usuario:', userData.currentPlan);
    console.log('🔐 AuthContext: Funcionalidades desbloqueadas:', userData.unlockedFeatures);
    
    setUser(userData);
    setToken(token);
    setRefreshToken(refreshTokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshTokenValue);
    
    // Obtener usuario actualizado del backend
    fetchCurrentUser(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const register = (userData, token, refreshTokenValue) => {
    login(userData, token, refreshTokenValue);
  };

  // Función para actualizar usuario manualmente
  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      refreshToken, 
      login, 
      logout, 
      register, 
      loading,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 