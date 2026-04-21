import React, { useContext, useState, useLayoutEffect, useEffect } from 'react';
import { FiMoon, FiSun, FiLogOut } from "react-icons/fi";
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import MenuMobile from './MenuMobile';
import useDashboardPermissions from '../hooks/useDashboardPermissions';
import { ThemeContext } from '../context/ThemeContext';
import ContactModal from './ContactModal';

const inferPlanSlugFromFeatures = (unlockedFeatures) => {
  if (!unlockedFeatures) return null;
  if (
    unlockedFeatures.advancedAnalytics &&
    unlockedFeatures.prioritySupport &&
    unlockedFeatures.employeeAccounts &&
    unlockedFeatures.multiCompany &&
    unlockedFeatures.customTemplates &&
    unlockedFeatures.logoUpload &&
    unlockedFeatures.companyBranding
  ) {
    return 'enterprise';
  }
  if (unlockedFeatures.employeeAccounts && unlockedFeatures.multiCompany) return 'empresarial';
  if (unlockedFeatures.customTemplates && unlockedFeatures.logoUpload) return 'profesional';
  if (unlockedFeatures.basicInvoicing && unlockedFeatures.basicTemplates) return 'basico';
  return null;
};

// Enlaces para usuarios logueados
const privateLinks = [
  { key: 'inicio', label: 'Inicio', to: '/inicio' },
  { key: 'facturas', label: 'Registro de ventas', to: '/facturas' },
  { key: 'cobranzas', label: 'Cobranzas', to: '/cobranzas' },
  { key: 'egresos', label: 'Egresos', to: '/egresos' },
  { key: 'reportes', label: 'Reportes', to: '/reportes' },
  { key: 'clientes', label: 'Clientes', to: '/clientes' },
];

// Enlaces para usuarios no logueados (vistas públicas)
const publicLinks = [
  { key: 'funcionalidades', label: 'Funcionalidades', to: '/funcionalidades' },
  { key: 'planes', label: 'Planes', to: '/planes' },
  { key: 'quienes-somos', label: 'Quiénes Somos', to: '/quienes-somos' },
  { key: 'contacto', label: 'Contacto', to: '/contactos', isModal: true },
];

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { modoOscuro, setModoOscuro } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isFuncionalidadesHero, setIsFuncionalidadesHero] = useState(true);
  const [isQuienesSomosHero, setIsQuienesSomosHero] = useState(true);

  // Escuchar el evento para abrir el modal de contacto desde el menú mobile
  useEffect(() => {
    const handleOpenContactModal = () => {
      setContactModalOpen(true);
    };
    
    window.addEventListener('openContactModal', handleOpenContactModal);
    
    return () => {
      window.removeEventListener('openContactModal', handleOpenContactModal);
    };
  }, []);
  
  // Hooks de permisos
  const { canAccessDashboard } = useDashboardPermissions();

  // Detectar si estamos en la landing page, funcionalidades o quienes-somos
  const isLandingPage = location.pathname === '/';
  const isFuncionalidades = location.pathname === '/funcionalidades';
  const isQuienesSomos = location.pathname === '/quienes-somos';

  // Efecto para detectar scroll en Funcionalidades y QuienesSomos - usar useLayoutEffect para sincronización correcta
  useLayoutEffect(() => {
    // Resetear estados si no estamos en estas páginas
    if (!isFuncionalidades && !isQuienesSomos) {
      setIsFuncionalidadesHero(false);
      setIsQuienesSomosHero(false);
      return;
    }

    let handleScroll;
    let container;

    // Delay para asegurar que los demás useLayoutEffect terminen primero
    const timer = setTimeout(() => {
      container = document.getElementById('main-scroll');
      if (!container) return;

      // Verificar scroll y establecer estado inicial
      const atTop = container.scrollTop < 50;
      const funcionalidadesSection = window.__funcionalidadesActiveSection;
      const quienesSomosSection = window.__quienesSomosActiveSection;
      const isFuncionalidadesHero = atTop || (funcionalidadesSection === 0);
      const isQuienesSomosHero = atTop || (quienesSomosSection === 0);
      if (isFuncionalidades) {
        setIsFuncionalidadesHero(isFuncionalidadesHero);
      }
      if (isQuienesSomos) {
        setIsQuienesSomosHero(isQuienesSomosHero);
      }

      handleScroll = () => {
        // Usar scrollTop O la sección activa expuesta por Funcionalidades/QuienesSomos
        const atTop = container.scrollTop < 50;
        const funcionalidadesSection = window.__funcionalidadesActiveSection;
        const quienesSomosSection = window.__quienesSomosActiveSection;
        const isFuncionalidadesHero = atTop || (funcionalidadesSection === 0);
        const isQuienesSomosHero = atTop || (quienesSomosSection === 0);
        
        if (isFuncionalidades) {
          setIsFuncionalidadesHero(isFuncionalidadesHero);
        }
        if (isQuienesSomos) {
          setIsQuienesSomosHero(isQuienesSomosHero);
        }
      };

      container.addEventListener('scroll', handleScroll);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (container && handleScroll) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isFuncionalidades, isQuienesSomos, location.pathname]);

  // Detectar si es mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Estilos condicionales para landing page, funcionalidades, quienes-somos y planes - transparente solo allí
  // En mobile NO usar transparencia al scrollear para mejor contraste
  const isTransparent = !isMobile && (
    isLandingPage || 
    isFuncionalidades || 
    isQuienesSomos ||
    location.pathname === '/planes'
  );
  
  // En el hero de Funcionalidades o QuienesSomos, forzar modo oscuro para buen contraste
  const forceDarkMode = (isFuncionalidades && isFuncionalidadesHero) || 
    (isQuienesSomos && isQuienesSomosHero);
  
  // Usar modo oscuro si el usuario lo seleccionó O si estamos en el hero
  const isDarkMode = modoOscuro || forceDarkMode;
  
  const navBgClass = isTransparent
    ? 'bg-transparent text-white border-b border-white/20'
    : isDarkMode
      ? 'bg-black/80 backdrop-blur-lg text-white border-b border-white/10'
      : 'bg-white/95 backdrop-blur-lg text-gray-900 border-b border-gray-100';
  const planSlug = user && user.currentPlan && typeof user.currentPlan === 'object'
    ? (user.currentPlan.slug || '')
    : (inferPlanSlugFromFeatures(user?.unlockedFeatures) || '');

  // Dashboard según permisos reales del hook (porque depende de más flags)
  const hasUserDashboardAccess = user ? canAccessDashboard() : false;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`w-full flex items-center justify-between px-4 lg:px-10 py-4 font-sans transition-all duration-300 relative z-50 ${navBgClass}`}
      role="navigation"
      aria-label="Barra de navegación principal"
    >
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link to={user ? "/inicio" : "/"} aria-label="Ir al inicio" className="flex items-center gap-2">
          <img
            src={isDarkMode ? "/logo-ingleswhite.png" : "/logo-inglesblack.png"}
            alt="Logo"
            className="navbar-logo cursor-pointer select-none"
          />
        </Link>
      </div>

      {/* Menú principal (desktop) */}
      <div className="hidden lg:flex items-center gap-1.5">
        {(user ? privateLinks : publicLinks).map(link => (
          link.isModal ? (
            <button
              key={link.key}
              onClick={() => setContactModalOpen(true)}
              className={`px-3.5 py-2 rounded-full font-medium transition-colors text-sm
                ${isLandingPage
                  ? 'text-white/90 hover:text-white hover:bg-white/20'
                  : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }
              `}
            >
              {link.label}
            </button>
          ) : (
            <Link
              key={link.key}
              to={link.to}
              className={`px-3.5 py-2 rounded-full font-medium transition-colors text-sm
                ${isLandingPage
                  ? location.pathname.startsWith(link.to)
                    ? 'bg-white text-black'
                    : 'text-white/90 hover:text-white hover:bg-white/20'
                  : location.pathname.startsWith(link.to)
                    ? (isDarkMode
                      ? 'bg-white text-black'
                      : 'bg-black text-white')
                    : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }
              `}
              aria-current={location.pathname.startsWith(link.to) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          )
        ))}
        
        {/* Enlace al dashboard de métricas (según plan) */}
        {user && hasUserDashboardAccess && (
          <Link
            to="/dashboard"
            className={`px-3.5 py-2 rounded-full font-medium transition-colors text-sm
              ${isLandingPage
                ? location.pathname.startsWith('/dashboard')
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:text-white hover:bg-white/20'
                : location.pathname.startsWith('/dashboard')
                  ? (isDarkMode
                    ? 'bg-white text-black'
                    : 'bg-black text-white')
                  : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }
            `}
            aria-current={location.pathname.startsWith('/dashboard') ? 'page' : undefined}
          >
            Dashboard
          </Link>
        )}

        {/* Equipo (plan empresarial) */}
        {user && ['empresarial', 'enterprise'].includes((planSlug || '').toLowerCase()) && (
          <>
            <Link
              to="/equipo/usuarios"
              className={`px-3.5 py-2 rounded-full font-medium transition-colors text-sm
                ${isLandingPage
                  ? location.pathname.startsWith('/equipo')
                    ? 'bg-white text-black'
                    : 'text-white/90 hover:text-white hover:bg-white/20'
                  : location.pathname.startsWith('/equipo')
                    ? (isDarkMode
                      ? 'bg-white text-black'
                      : 'bg-black text-white')
                    : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }
              `}
              aria-current={location.pathname.startsWith('/equipo') ? 'page' : undefined}
            >
              Equipo
            </Link>
          </>
        )}

        {/* Administración del sistema (solo superadmin) */}
        {user && user.role === 'admin' && user.isSuperAdmin === true && (
          <Link
            to="/admin/users"
            className={`px-3.5 py-2 rounded-full font-medium transition-colors text-sm
              ${isLandingPage
                ? location.pathname.startsWith('/admin/users')
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:text-white hover:bg-white/20'
                : location.pathname.startsWith('/admin/users')
                  ? (isDarkMode
                    ? 'bg-white text-black'
                    : 'bg-black text-white')
                  : isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
              }
            `}
            aria-current={location.pathname.startsWith('/admin/users') ? 'page' : undefined}
          >
            Admin usuarios
          </Link>
        )}
      </div>

      {/* Acciones a la derecha (desktop) */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Botón de modo oscuro */}
        <button
          onClick={() => setModoOscuro(!modoOscuro)}
          className={`p-2.5 rounded-full border transition-colors ${
            isLandingPage
              ? 'border-white/30 text-white hover:bg-white/20'
              : isDarkMode
                ? 'border-white/20 text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {modoOscuro ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
        </button>

        {/* Usuario logueado */}
        {user ? (
          <>
            <Link
              to="/cuenta"
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full transition-colors ${
                isLandingPage
                  ? 'hover:bg-white/20 text-white'
                  : isDarkMode
                    ? 'hover:bg-white/10'
                    : 'hover:bg-gray-50'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                isLandingPage
                  ? 'bg-white text-black'
                  : 'bg-gray-900 text-white'
              }`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className={`font-medium ${
                isLandingPage
                  ? 'text-white'
                  : isDarkMode
                    ? 'text-white'
                    : 'text-gray-900'
              }`}>
                {user.name}
              </span>
            </Link>
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-2.5 rounded-full border transition-colors ${
                isLandingPage
                  ? 'border-white/30 text-white hover:bg-white/20'
                  : isDarkMode
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-red-500'
              }`}
              title="Cerrar sesión"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Botones de login/registro */
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`px-3.5 py-2 rounded-full font-medium text-sm transition-colors ${
                isLandingPage
                  ? 'text-white hover:bg-white/20'
                  : isDarkMode
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </div>

      {/* Menú mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <button
          onClick={() => setModoOscuro(!modoOscuro)}
          className={`p-3 rounded-xl transition-all duration-300 ${
            isDarkMode
              ? 'text-white hover:bg-white/10'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {modoOscuro ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
        </button>
        
        <button
          className={`p-3 rounded-xl transition-all duration-300 ${
            isDarkMode
              ? 'text-white hover:bg-white/10'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
            <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-5 h-0.5 bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
        </button>
      </div>

      {/* Menú mobile tipo drawer */}
      <MenuMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      {/* Contact Modal */}
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar; 