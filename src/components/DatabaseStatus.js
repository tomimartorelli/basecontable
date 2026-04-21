import React, { useState, useEffect, useContext } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../context/ThemeContext';

const DatabaseStatus = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        if (window.electronAPI) {
          const status = await window.electronAPI.getDatabaseStatus();
          setDbStatus(status);
        }
      } catch (error) {
        console.error('Error al verificar estado de la base de datos:', error);
        setDbStatus({ isConnected: false, error: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkDatabaseStatus();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-600'}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Verificando base de datos...</span>
      </div>
    );
  }

  if (!window.electronAPI) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
        <InformationCircleIcon className="h-4 w-4" />
        <span>Modo web (base de datos externa)</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${modoOscuro ? 'text-gray-300' : ''}`}>
      {dbStatus?.isConnected ? (
        <>
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span className={modoOscuro ? 'text-green-400' : 'text-green-600'}>Base de datos local conectada</span>
        </>
      ) : (
        <>
          <XCircleIcon className="h-4 w-4 text-red-500" />
          <span className={modoOscuro ? 'text-red-400' : 'text-red-600'}>
            {dbStatus?.error || 'Base de datos no conectada'}
          </span>
        </>
      )}
    </div>
  );
};

export default DatabaseStatus; 