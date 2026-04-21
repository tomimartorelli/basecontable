import React, { useContext } from 'react';
import AdminSidebar from './AdminSidebar';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { ThemeContext } from '../context/ThemeContext';

const AdminLayout = ({ children, requiredPermission = null }) => {
  const { modoOscuro } = useContext(ThemeContext);
  const {
    canAccessABM,
    canManageUsers,
    canManageCompanies,
    canManagePlans,
    canManageSystem,
    getPlanName,
    // eslint-disable-next-line no-unused-vars
    getPlanBadge,
    getABMAccessLevel,
    loading,
    error
  } = useAdminPermissions();

  const rootBg = modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gray-50 text-gray-900';
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const cardError = modoOscuro ? 'bg-red-900/30' : 'bg-red-100';
  const cardWarning = modoOscuro ? 'bg-yellow-900/30' : 'bg-yellow-100';
  const cardOrange = modoOscuro ? 'bg-orange-900/30' : 'bg-orange-100';
  const cardPurple = modoOscuro ? 'bg-purple-900/30 border-purple-700' : 'bg-white border-purple-200';
  const textPurple = modoOscuro ? 'text-purple-200' : 'text-purple-800';

  // eslint-disable-next-line no-unused-vars
  const accessLevel = getABMAccessLevel();

  // Si está cargando, mostrar loading
  if (loading) {
    return (
      <div className={`${rootBg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${textSec}`}>Verificando permisos...</p>
          <p className={`text-sm ${textMuted}`}>Cargando información del plan</p>
        </div>
      </div>
    );
  }

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <div className={`${rootBg} flex items-center justify-center`}>
        <div className={`rounded-2xl shadow-xl p-8 max-w-md mx-4 border ${box}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cardError}`}>
              <svg className={`w-8 h-8 ${modoOscuro ? 'text-red-300' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textPri}`}>Error al cargar permisos</h3>
            <p className={`mb-4 ${textSec}`}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si no puede acceder al ABM, redirigir
  if (!canAccessABM()) {
    return (
      <div className={`${rootBg} flex items-center justify-center`}>
        <div className={`rounded-2xl shadow-xl p-8 max-w-md mx-4 border ${box}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cardWarning}`}>
              <svg className={`w-8 h-8 ${modoOscuro ? 'text-yellow-300' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textPri}`}>Acceso Restringido</h3>
            <p className={`mb-4 ${textSec}`}>
              Tu plan actual ({getPlanName()}) no incluye acceso a las funciones de administración.
            </p>
            <div className={`rounded-lg p-4 border ${cardPurple}`}>
              <p className={`text-sm font-medium mb-2 ${textPurple}`}>Para acceder al ABM necesitas:</p>
              <ul className={`text-xs space-y-1 ${modoOscuro ? 'text-purple-200' : 'text-purple-700'}`}>
                <li>• Plan Empresarial o superior</li>
                <li>• Funcionalidad de empleados habilitada</li>
                <li>• Funcionalidad de multi-empresa habilitada</li>
              </ul>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => window.history.back()} 
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2"
              >
                Volver
              </button>
              <button 
                onClick={() => window.location.href = '/planes'} 
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si requiere un permiso específico, verificarlo
  if (requiredPermission && !requiredPermission()) {
    return (
      <div className={`${rootBg} flex items-center justify-center`}>
        <div className={`rounded-2xl shadow-xl p-8 max-w-md mx-4 border ${box}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${cardOrange}`}>
              <svg className={`w-8 h-8 ${modoOscuro ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textPri}`}>Permiso Insuficiente</h3>
            <p className={`mb-4 ${textSec}`}>
              No tienes permisos para acceder a esta funcionalidad específica.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Layout responsive: sidebar solo en desktop, contenido full-width en mobile
  return (
    <div className={`min-h-screen flex ${modoOscuro ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar fijo solo en pantallas grandes; en mobile se navega con el menú principal */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1F80FF] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${textPri}`}>Panel de Administración</h1>
              <p className={`mt-1 text-xs sm:text-sm ${textMuted}`}>
                Plan actual: <span className="font-medium">{getPlanName()}</span>
              </p>
            </div>
          </div>
        </div>
        {/* Navegación compacta para mobile (tabs horizontales de secciones del panel) */}
        <div className="px-4 sm:px-6 pb-2 lg:hidden">
          <div className={`inline-flex w-full overflow-x-auto no-scrollbar rounded-full p-1 ${modoOscuro ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            {canManageUsers() && (
              <a
                href="/admin/users"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap flex-1"
              >
                Usuarios
              </a>
            )}
            {canManageCompanies() && (
              <a
                href="/admin/companies"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap flex-1"
              >
                Empresas
              </a>
            )}
            {canManagePlans() && (
              <a
                href="/admin/plans"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap flex-1"
              >
                Planes
              </a>
            )}
            {canManageSystem() && (
              <a
                href="/admin/system"
                className="px-3 py-1.5 rounded-full text-[11px] font-medium text-center whitespace-nowrap flex-1"
              >
                Sistema
              </a>
            )}
          </div>
        </div>
        <main className="flex-1 px-4 sm:px-6 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
