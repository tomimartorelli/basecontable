import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  FiX,
  FiHome,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiTrendingDown,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiZap,
  FiAward,
  FiMail,
  FiLogOut
} from 'react-icons/fi';
import useDashboardPermissions from '../hooks/useDashboardPermissions';
import { ThemeContext } from '../context/ThemeContext';

const MenuMobile = ({ open, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);

  const { canAccessDashboard } = useDashboardPermissions();
  const navigate = useNavigate();

  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      // pequeño delay para que el estado inicial (fuera de pantalla) se pinte antes de animar
      setTimeout(() => {
        requestAnimationFrame(() => setVisible(true));
      }, 50);
    } else if (rendered) {
      setVisible(false);
      const timeout = setTimeout(() => setRendered(false), 700); // debe coincidir con la duración de la animación
      return () => clearTimeout(timeout);
    }
  }, [open, rendered]);

  useEffect(() => {
    if (rendered && visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [rendered, visible]);

  useEffect(() => {
    if (!rendered) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [rendered, onClose]);

  if (!rendered) return null;

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const avatar = user ? user.name?.charAt(0).toUpperCase() : '';

  const bgPanel = modoOscuro ? 'bg-[#050714] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-100';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const itemText = modoOscuro ? 'text-gray-100' : 'text-gray-800';
  const itemIconBg = modoOscuro ? 'bg-white/5' : 'bg-gray-100';
  const itemHover =
    modoOscuro ? 'hover:bg-white/5 hover:text-[#4EA8FF]' : 'hover:bg-[#1f80ff]/5 hover:text-[#1f80ff]';

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex transition-colors duration-700 ${
        visible ? 'bg-black/50' : 'bg-black/0 pointer-events-none'
      }`}
    >
      <div
        className={`
          ml-auto flex flex-col w-full h-full border-l border-gray-800/60 rounded-l-3xl
          shadow-2xl shadow-black/40
          transition-transform duration-700 ease-in-out will-change-transform
          ${bgPanel}
          ${visible ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/40">
          <div className="flex items-center gap-3 min-w-0">
            {user ? (
              <>
                <div className="w-11 h-11 rounded-2xl bg-[#1F80FF] text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {avatar}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate">{user.name}</span>
                  <span className={`text-xs ${textMuted}`}>Usuario activo</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-2xl bg-gray-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  <FiUser className="text-lg" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm">Invitado</span>
                  <span className={`text-xs ${textMuted}`}>Acceso limitado</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1f80ff] focus:ring-opacity-50 ${
                modoOscuro
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 py-5 px-4 space-y-2 overflow-y-auto">
          {user ? (
            <>
              <Link
                to="/inicio"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiHome className="w-5 h-5" />
                </div>
                <span>Inicio</span>
              </Link>

              <Link
                to="/facturas"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiFileText className="w-5 h-5" />
                </div>
                <span>Registro de ventas</span>
              </Link>

              <Link
                to="/cobranzas"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <span>Cobranzas</span>
              </Link>

              <Link
                to="/egresos"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiTrendingDown className="w-5 h-5" />
                </div>
                <span>Egresos</span>
              </Link>

              <Link
                to="/reportes"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiBarChart2 className="w-5 h-5" />
                </div>
                <span>Reportes</span>
              </Link>

              <Link
                to="/clientes"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiUsers className="w-5 h-5" />
                </div>
                <span>Clientes</span>
              </Link>

              {user && ((user?.role === 'admin' && user?.isSuperAdmin === true) || canAccessDashboard) && (
                <>
                  {user?.role === 'admin' && user?.isSuperAdmin === true && (
                    <Link
                      to="/admin/users"
                      onClick={onClose}
                      className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
                    >
                      <div
                        className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}
                      >
                        <FiUser className="w-5 h-5" />
                      </div>
                      <span>Admin usuarios</span>
                    </Link>
                  )}

                  {canAccessDashboard && (
                    <Link
                      to="/dashboard"
                      onClick={onClose}
                      className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
                    >
                      <div
                        className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}
                      >
                        <FiHome className="w-5 h-5" />
                      </div>
                      <span>Dashboard</span>
                    </Link>
                  )}
                </>
              )}

              <Link
                to="/cuenta"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiSettings className="w-5 h-5" />
                </div>
                <span>Mi Cuenta</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiHome className="w-5 h-5" />
                </div>
                <span>Inicio</span>
              </Link>

              <Link
                to="/funcionalidades"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiZap className="w-5 h-5" />
                </div>
                <span>Funcionalidades</span>
              </Link>

              <Link
                to="/planes"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiAward className="w-5 h-5" />
                </div>
                <span>Planes</span>
              </Link>

              <Link
                to="/quienes-somos"
                onClick={onClose}
                className={`flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiUsers className="w-5 h-5" />
                </div>
                <span>Quiénes Somos</span>
              </Link>

              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('openContactModal'));
                }}
                className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl ${itemHover} ${itemText} font-medium transition-all duration-200 group text-left`}
              >
                <div className={`p-2 rounded-lg ${itemIconBg} group-hover:bg-[#1f80ff]/10 transition-all duration-200`}>
                  <FiMail className="w-5 h-5" />
                </div>
                <span>Contacto</span>
              </button>
            </>
          )}
        </div>

        <div className="border-t border-gray-800/40 mx-6" />
        
        {/* Botón de cerrar sesión cuando el usuario está logueado */}
        {user && (
          <div className="p-6">
            <button
              onClick={() => {
                handleLogout();
                onClose();
              }}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold text-base border-2 transition-all duration-200 ${
                modoOscuro
                  ? 'border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500'
                  : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500'
              }`}
            >
              <FiLogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
        
        {!user && (
          <div className="p-6 space-y-3">
            <Link
              to="/login"
              onClick={onClose}
              className={`w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${
                modoOscuro ? 'bg-[#1F80FF] text-white hover:bg-[#4EA8FF]' : 'bg-[#1F80FF] text-white hover:bg-[#004AAD]'
              }`}
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className={`w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center text-base border-2 transition-all duration-200 ${
                modoOscuro
                  ? 'bg-transparent text-gray-200 border-gray-700 hover:border-[#1f80ff] hover:text-[#1f80ff]'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-[#1f80ff] hover:text-[#1f80ff]'
              }`}
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default MenuMobile;
