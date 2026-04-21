import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiUsers, 
  FiBriefcase, 
  FiCreditCard, 
  FiSettings, 
  FiBarChart,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { ThemeContext } from '../context/ThemeContext';

const AdminSidebar = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    canAccessABM,
    canManageUsers,
    canManageCompanies,
    canManagePlans,
    canManageSystem,
    getPlanName,
    getPlanBadge,
    getABMAccessLevel
  } = useAdminPermissions();

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const planBox = modoOscuro ? 'bg-purple-900/30 border-purple-700' : 'bg-white border-purple-200';
  const planBoxYellow = modoOscuro ? 'bg-yellow-900/30 border-yellow-700' : 'bg-white border-yellow-200';
  const footerBox = modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const navInactive = modoOscuro ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-700 hover:bg-blue-50 hover:text-[#1F80FF]';
  const navBadge = modoOscuro ? 'bg-purple-800/50 text-purple-200' : 'bg-purple-100 text-purple-800';
  const navDesc = modoOscuro ? 'text-gray-400 group-hover:text-purple-300' : 'text-gray-500 group-hover:text-purple-600';

  // Si no puede acceder al ABM, mostrar mensaje de acceso restringido
  if (!canAccessABM()) {
    return (
      <div className={`w-64 border-r h-full flex flex-col ${box}`}>
        <div className={`p-6 border-b ${divide}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#1F80FF] rounded-xl flex items-center justify-center">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${textPri}`}>Administración</h2>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanBadge().color}`}>
                  {getPlanBadge().text}
                </span>
                <span className={`text-xs ${textMuted}`}>Acceso Restringido</span>
              </div>
            </div>
          </div>
          <div className={`rounded-lg p-3 border ${planBoxYellow}`}>
            <div className={`text-sm font-medium mb-1 ${modoOscuro ? 'text-yellow-200' : 'text-yellow-900'}`}>
              Plan Actual: {getPlanName()}
            </div>
            <div className={`text-xs ${modoOscuro ? 'text-yellow-300' : 'text-yellow-700'}`}>
              Tu plan actual no incluye acceso a las funciones de administración
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modoOscuro ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
              <svg className={`w-8 h-8 ${modoOscuro ? 'text-yellow-300' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textPri}`}>Acceso Restringido</h3>
            <p className={`mb-4 ${textSec}`}>
              Para acceder al panel de administración necesitas un plan superior.
            </p>
            <div className={`rounded-lg p-3 border ${planBox}`}>
              <p className={`text-sm font-medium mb-2 ${modoOscuro ? 'text-purple-200' : 'text-purple-800'}`}>Planes que incluyen ABM:</p>
              <ul className={`text-xs space-y-1 ${modoOscuro ? 'text-purple-300' : 'text-purple-700'}`}>
                <li>• Plan Empresarial</li>
                <li>• Plan Enterprise</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.href = '/planes'} 
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ver Planes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const accessLevel = getABMAccessLevel();
  const planBadge = getPlanBadge();

  const menuItems = [
    // Gestión de Usuarios
    {
      id: 'usuarios',
      label: 'Gestión de Usuarios',
      icon: <FiUsers className="w-5 h-5" />,
      path: '/admin/users',
      visible: canManageUsers(),
      description: 'Administrar usuarios y empleados',
      badge: accessLevel === 'company' ? 'Empresa' : 'Sistema'
    },
    
    // Gestión de Empresas
    {
      id: 'empresas',
      label: 'Gestión de Empresas',
      icon: <FiBriefcase className="w-5 h-5" />,
      path: '/admin/companies',
      visible: canManageCompanies(),
      description: 'Administrar empresas y sucursales',
      badge: accessLevel === 'company' ? 'Limitado' : 'Completo'
    },
    
    // Gestión de Planes
    {
      id: 'planes',
      label: 'Gestión de Planes',
      icon: <FiCreditCard className="w-5 h-5" />,
      path: '/admin/plans',
      visible: canManagePlans(),
      description: 'Administrar planes y suscripciones',
      badge: 'Solo Admin'
    },
    
    // Configuración del Sistema
    {
      id: 'sistema',
      label: 'Configuración del Sistema',
      icon: <FiSettings className="w-5 h-5" />,
      path: '/admin/system',
      visible: canManageSystem(),
      description: 'Configuración global del sistema',
      badge: 'Solo Admin'
    },
    
    // Dashboard del Sistema
    {
      id: 'dashboard',
      label: 'Dashboard del Sistema',
              icon: <FiBarChart className="w-5 h-5" />,
      path: '/admin/dashboard',
      visible: canAccessABM(),
      description: 'Vista general del sistema',
      badge: accessLevel === 'full' ? 'Completo' : 'Limitado'
    }
  ].filter(item => item.visible);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`w-64 border-r h-full flex flex-col ${box}`}>
      <div className={`p-6 border-b ${divide}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#1F80FF] rounded-xl flex items-center justify-center">
            <FiShield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${textPri}`}>Administración</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planBadge.color}`}>
                {planBadge.text}
              </span>
              <span className={`text-xs ${textMuted}`}>
                {accessLevel === 'full' ? 'Acceso Completo' : 'Acceso Limitado'}
              </span>
            </div>
          </div>
        </div>
        <div className={`rounded-lg p-3 border ${planBox}`}>
          <div className={`text-sm font-medium mb-1 ${modoOscuro ? 'text-purple-200' : 'text-purple-900'}`}>
            Plan Actual: {getPlanName()}
          </div>
          <div className={`text-xs ${modoOscuro ? 'text-purple-300' : 'text-purple-700'}`}>
            {accessLevel === 'full' 
              ? 'Tienes acceso completo al sistema' 
              : 'Tienes acceso limitado a tu empresa'
            }
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
              isActiveRoute(item.path)
                ? 'bg-[#1F80FF] text-white shadow-lg'
                : navInactive
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={isActiveRoute(item.path) ? 'text-white' : modoOscuro ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-purple-600'}>
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isActiveRoute(item.path) ? 'bg-white/20 text-white' : navBadge
                  }`}>
                    {item.badge}
                  </span>
                </div>
                <div className={`text-xs mt-1 ${isActiveRoute(item.path) ? (modoOscuro ? 'text-blue-100' : 'text-purple-100') : navDesc}`}>
                  {item.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${divide}`}>
        <div className={`rounded-lg p-3 border ${footerBox}`}>
          <div className={`flex items-center gap-2 text-sm mb-2 ${textSec}`}>
            <FiLock className="w-4 h-4" />
            <span className="font-medium">Permisos del Plan</span>
          </div>
          <div className="space-y-2">
            {canManageUsers() && (
              <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                <FiCheckCircle className="w-3 h-3 text-green-500" />
                <span>Gestión de Usuarios</span>
              </div>
            )}
            {canManageCompanies() && (
              <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                <FiCheckCircle className="w-3 h-3 text-green-500" />
                <span>Gestión de Empresas</span>
              </div>
            )}
            {canManagePlans() && (
              <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                <FiCheckCircle className="w-3 h-3 text-green-500" />
                <span>Gestión de Planes</span>
              </div>
            )}
            {canManageSystem() && (
              <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                <FiCheckCircle className="w-3 h-3 text-green-500" />
                <span>Configuración del Sistema</span>
              </div>
            )}
          </div>
          {!canManageUsers() && !canManageCompanies() && !canManagePlans() && !canManageSystem() && (
            <div className={`flex items-center gap-2 text-xs mt-2 ${textMuted}`}>
              <FiAlertCircle className="w-3 h-3" />
              <span>Sin permisos de administración</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
