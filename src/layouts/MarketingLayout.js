import React, { useState, useContext, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MenuMobile from '../components/MenuMobile';
import Footer from '../components/Footer';
import Aurora from '../components/Aurora/Aurora';
import Silk from '../components/Silk';
import { ThemeContext } from '../context/ThemeContext';

const MarketingLayout = ({ children, showNavbar = true }) => {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const { modoOscuro } = useContext(ThemeContext);
  const location = useLocation();
  const navbarRef = useRef(null);

  // Detectar página actual para mostrar dots correspondientes
  const isLandingPage = location.pathname === '/';
  const isFuncionalidades = location.pathname === '/funcionalidades';
  const isQuienesSomos = location.pathname === '/quienes-somos';
  const showDots = isLandingPage || isFuncionalidades || isQuienesSomos;

  // Leer sección activa de cada página
  const [activeSection, setActiveSection] = useState(0);
  const sectionCount = isLandingPage ? 4 : isFuncionalidades ? 4 : isQuienesSomos ? 3 : 0;

  useEffect(() => {
    if (!showDots) return;
    
    const interval = setInterval(() => {
      if (isLandingPage) {
        setActiveSection(window.__landingActiveSection || 0);
      } else if (isFuncionalidades) {
        setActiveSection(window.__funcionalidadesActiveSection || 0);
      } else if (isQuienesSomos) {
        setActiveSection(window.__quienesSomosActiveSection || 0);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLandingPage, isFuncionalidades, isQuienesSomos, showDots]);

  const handleDotClick = useCallback((index) => {
    if (isLandingPage && window.__landingScroll) {
      window.__landingScroll.goToSection(index);
    } else if (isFuncionalidades && window.__funcionalidadesScroll) {
      window.__funcionalidadesScroll.goToSection(index);
    } else if (isQuienesSomos && window.__quienesSomosScroll) {
      window.__quienesSomosScroll.goToSection(index);
    }
  }, [isLandingPage, isFuncionalidades, isQuienesSomos]);

  // Estilos para dots
  const dotActive = modoOscuro ? 'bg-white' : 'bg-gray-900';
  const dotInactive = modoOscuro ? 'bg-white/30' : 'bg-gray-400';
  
  const showSilk = false; // Desactivado - ahora usamos Aurora para todas
  const showAurora = isLandingPage || isFuncionalidades || isQuienesSomos || location.pathname === '/planes';
  const wrapperClass = (isLandingPage || isFuncionalidades || isQuienesSomos || location.pathname === '/planes')
    ? 'bg-transparent text-white'
    : modoOscuro
      ? 'bg-black text-white'
      : 'bg-white text-gray-900';

  // Navbar sin animación - mostrar/ocultar inmediatamente
  const navbarStyle = {
    transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
    opacity: showNavbar ? 1 : 0,
    transition: 'none'
  };

  // Reiniciar scroll al cambiar de ruta - usar useLayoutEffect para ejecutar ANTES de la pintura
  useLayoutEffect(() => {
    const container = document.getElementById('main-scroll');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'auto' });
      container.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className={`relative h-screen w-full max-w-full overflow-hidden ${wrapperClass}`}>
      {/* Aurora Background - en landing, funcionalidades y quienes-somos */}
      {showAurora && (
        <div className="fixed inset-0 z-0">
          <Aurora
            colorStops={modoOscuro ? ["#948df7","#0617fe","#9eaeff"] : ["#E8E4FF","#C4D4FF","#A8C6FF"]}
            blend={0.5}
            amplitude={1.0}
            speed={1}
            backgroundColor={modoOscuro ? 'black' : 'transparent'}
          />
        </div>
      )}
      
      {/* Silk Background - en Funcionalidades y QuienesSomos */}
      {showSilk && (
        <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
          <Silk 
            color={isFuncionalidades ? "#004AAD" : "#4A4A8A"} 
            speed={1.5} 
            scale={1.2} 
            rotation={0.785} 
          />
        </div>
      )}
      
      <div className="relative z-10 w-full h-full overflow-y-scroll overflow-x-hidden" id="main-scroll">
        <div ref={navbarRef} className="sticky top-0 z-40 w-full" style={navbarStyle}>
          <Navbar />
        </div>
        <MenuMobile
          open={menuMobileOpen}
          onClose={() => setMenuMobileOpen(false)}
        />
        <main className="w-full max-w-full relative z-30">
          {children}
          <Footer />
        </main>

        {/* Dots de navegación lateral - mostrar en páginas con scroll snap */}
        {showDots && sectionCount > 0 && (
          <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-50 pointer-events-auto">
            {Array.from({ length: sectionCount }, (_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeSection === index ? dotActive : dotInactive
                }`}
                aria-label={`Ir a sección ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingLayout;
