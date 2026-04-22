import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { 
  FiUsers, 
  FiFileText, 
  FiTrendingUp, 
  FiShield, 
  FiStar,
  FiArrowRight,
  FiPlay,
  FiClock,
  FiCheckCircle,
  FiZap
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import MarketingLayout from '../layouts/MarketingLayout';

const Landing = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const { modoOscuro } = useContext(ThemeContext);
  
  // Navbar visible solo en hero (desktop)
  const showNavbar = activeSection === 0;
  
  // Refs para secciones
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Refs para contenido animable
  const heroContentRef = useRef(null);
  const statsContentRef = useRef(null);
  const featuresContentRef = useRef(null);
  const ctaContentRef = useRef(null);
  
  // En landing, el hero usa fondo transparente para ver Aurora, el resto usa fondo sólido
  const heroBg = 'bg-transparent';
  const contentBg = modoOscuro ? 'bg-black' : 'bg-white';
  const box = modoOscuro ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const dotActive = modoOscuro ? 'bg-white' : 'bg-gray-900';
  const dotInactive = modoOscuro ? 'bg-gray-600' : 'bg-gray-300';
  const cardHighlight = modoOscuro ? 'bg-gray-800/80 text-gray-200 border-gray-600' : 'bg-gray-50/80 text-gray-800 border-gray-200';
  
  // Colores específicos para hero según modo (sobre Aurora)
  const heroText = modoOscuro ? 'text-white' : 'text-black';
  const heroTextSec = modoOscuro ? 'text-white/90' : 'text-black/90';
  const heroTextMuted = modoOscuro ? 'text-white/80' : 'text-black/80';
  const heroBadgeBg = modoOscuro ? 'bg-white/10 border-white/20' : 'bg-black/10 border-black/20';
  const heroBadgeText = modoOscuro ? 'text-white' : 'text-black';
  const heroBtnPrimary = modoOscuro 
    ? 'bg-white text-[#004aad] border-white hover:bg-[#00357a] hover:text-white hover:border-[#00357a]' 
    : 'bg-black text-white border-black hover:bg-gray-800 hover:text-white';
  const heroBtnSecondary = modoOscuro
    ? 'border-2 border-white text-white hover:bg-white hover:text-[#004aad]'
    : 'border-2 border-black text-black hover:bg-black hover:text-white';

  // Animaciones GSAP al montar el componente
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      
      // Badge - fade in + slide down
      tl.fromTo('.hero-badge',
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6 }
      );
      
      // Título - fade in + slide up
      tl.fromTo('.hero-title',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.3'
      );
      
      // Descripción
      tl.fromTo('.hero-desc',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );
      
      // Botones CTA
      tl.fromTo('.hero-cta',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.3'
      );
      
      // Benefits - stagger
      tl.fromTo('.hero-benefits > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1 },
        '-=0.3'
      );
      
      // Showcase - slide from right
      tl.fromTo('.hero-showcase',
        { opacity: 0, x: 100 },
        { opacity: 1, x: 0, duration: 0.8 },
        '-=0.8'
      );
    }, heroRef);
    
    return () => ctx.revert();
  }, []);

  // Scroll suave entre secciones
  useEffect(() => {
    const sections = [heroRef, statsRef, featuresRef, ctaRef];
    const currentSectionRef = { current: 0 };
    const isScrollingRef = { current: false };
    const scrollDuration = 1.2;
    const scrollEase = 'power2.inOut';
    
    // Detectar mobile
    const isMobile = window.innerWidth < 768;

    // Definir scrollToSection primero
    const scrollToSection = (index) => {
      if (index < 0 || index >= sections.length || isScrollingRef.current) return;
      
      isScrollingRef.current = true;
      const targetRef = sections[index];
      if (!targetRef.current) {
        isScrollingRef.current = false;
        return;
      }

      const container = document.getElementById('main-scroll');
      if (!container) {
        isScrollingRef.current = false;
        return;
      }

      const targetPosition = targetRef.current.offsetTop;
      
      gsap.to(container, {
        scrollTop: targetPosition,
        duration: scrollDuration,
        ease: scrollEase,
        onComplete: () => {
          isScrollingRef.current = false;
          currentSectionRef.current = index;
          setActiveSection(index);
          window.__landingActiveSection = index;
        }
      });
    };

    // Exponer referencias para botones externos (después de definir scrollToSection)
    window.__landingScroll = {
      goToSection: scrollToSection,
      goToHero: () => {
        if (isScrollingRef.current) return;
        isScrollingRef.current = true;
        
        const container = document.getElementById('main-scroll');
        if (!container || !heroRef.current) {
          isScrollingRef.current = false;
          return;
        }

        gsap.to(container, {
          scrollTop: 0,
          duration: scrollDuration,
          ease: scrollEase,
          onComplete: () => {
            isScrollingRef.current = false;
            currentSectionRef.current = 0;
            setActiveSection(0);
            window.__landingActiveSection = 0;
          }
        });
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      
      if (isScrollingRef.current) return;

      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      const nextSection = currentSectionRef.current + direction;

      if (nextSection >= 0 && nextSection < sections.length) {
        scrollToSection(nextSection);
      }
    };

    // Detectar sección activa basado en scroll nativo (para mobile y scroll no controlado)
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const container = document.getElementById('main-scroll');
      if (!container) return;

      const containerHeight = container.clientHeight;
      
      sections.forEach((ref, index) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTop = rect.top - containerRect.top;
        
        // Si el elemento está en el viewport y es el más visible
        if (elementTop >= -containerHeight / 2 && elementTop < containerHeight / 2) {
          if (currentSectionRef.current !== index) {
            currentSectionRef.current = index;
            setActiveSection(index);
            window.__landingActiveSection = index;
          }
        }
      });
    };

    const container = document.getElementById('main-scroll');
    
    // Scroll controlado en desktop
    if (container && !isMobile) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    // Scroll nativo para detectar sección activa (mobile y scroll no controlado)
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
      delete window.__landingScroll;
    };
  }, []);

  // Sin animaciones de contenido al cambiar de sección (eliminadas para evitar interferencias)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FiUsers />,
      title: "Cartera de Clientes",
      description: "Tu cartera ordenada con datos de contacto e historial de operaciones",
      highlight: "Un solo lugar para ver quién te debe y qué cobraste"
    },
    {
      icon: <FiFileText />,
      title: "Registro de ventas y cobranzas",
      description: "Registrá ventas y controlá qué te deben, sin facturación electrónica ni AFIP",
      highlight: "Numeración interna, estados de pago y recordatorios"
    },
    {
      icon: <FiTrendingUp />,
      title: "Reportes y análisis",
      description: "Ventas por período, flujo de caja y resúmenes para vos o para tu contador",
      highlight: "Dashboard en tiempo real y exportación PDF/Excel"
    },
    {
      icon: <FiShield />,
      title: "Simple y seguro",
      description: "Datos protegidos y acceso desde cualquier dispositivo",
      highlight: "Sin instalaciones, sin complejidad fiscal"
    }
  ];

  const stats = [
    {
      icon: <FiUsers />,
      number: "2.500+",
      label: "Clientes activos",
      description: "Emprendimientos que organizan su negocio"
    },
    {
      icon: <FiFileText />,
      number: "50K+",
      label: "Facturas emitidas",
      description: "Operaciones registradas en el último año"
    },
    {
      icon: <FiTrendingUp />,
      number: "$12M",
      label: "Facturado total",
      description: "En operaciones gestionadas"
    },
    {
      icon: <FiClock />,
      number: "2min",
      label: "Por factura",
      description: "Tiempo promedio de registro"
    }
  ];

  const benefits = [
    "Registro y cobranzas al día",
    "Clientes organizados",
    "Reportes para vos o tu contador",
    "Soporte cuando lo necesites",
    "Acceso desde cualquier lugar",
    "Sin AFIP, sin instalaciones"
  ];

  return (
    <MarketingLayout showNavbar={showNavbar}>
      {/* Hero Section */}
      <section ref={heroRef} className={`relative overflow-hidden min-h-[100svh] lg:min-h-screen flex flex-col justify-center py-12 sm:py-16 lg:py-0 ${heroBg}`}>
        <div ref={heroContentRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Contenido primero, showcase después */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-16">
            
            {/* Left Content - Principal */}
            <div className="text-center lg:text-left space-y-4 sm:space-y-5 lg:space-y-6">
              <div className={`hero-badge inline-flex items-center gap-1.5 backdrop-blur-sm rounded-full px-3 py-1.5 border ${heroBadgeBg}`}>
                <FiStar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${heroBadgeText}`} />
                <span className={`text-xs font-medium ${heroBadgeText}`}>Para negocios y emprendimientos</span>
              </div>
              
              <h1 className={`hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight ${heroText}`}>
                Pasá de Excel desordenado a un registro claro
              </h1>
              
              <p className={`hero-desc text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 ${heroTextSec}`}>
                Tené en un solo lugar tus clientes, ventas y cobranzas. Sin AFIP, sin conceptos contables raros.
              </p>
              
              {/* CTA Buttons */}
              <div className="hero-cta flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <button 
                  onClick={() => navigate('/register')}
                  className={`group px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 ${heroBtnPrimary}`}
                >
                  Comenzar Gratis
                  <FiArrowRight className="inline-block ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/funcionalidades')}
                  className={`group px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 active:scale-95 ${heroBtnSecondary}`}
                >
                  <FiPlay className="inline-block mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Ver Demo
                </button>
              </div>
              
              {/* Benefits - Mobile en 2 columnas */}
              <div className="hero-benefits grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm pt-3">
                {benefits.slice(0, 4).map((benefit, index) => (
                  <div key={index} className={`flex items-center gap-2 ${heroTextMuted}`}>
                    <FiCheckCircle className={`w-4 h-4 flex-shrink-0 ${heroTextMuted}`} />
                    <span className="font-medium truncate">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Feature Showcase - Oculto en mobile, visible en lg */}
            <div className="hero-showcase hidden lg:flex lg:items-center lg:justify-center lg:pl-8">
              <div className={`${box} rounded-3xl p-8 shadow-2xl border backdrop-blur-sm w-full max-w-md`}>
                <div className="text-center mb-6">
                  <div className={`${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'} rounded-3xl p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {React.cloneElement(features[currentFeature].icon, { className: "w-12 h-12 text-white" })}
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${textPri}`}>
                    {features[currentFeature].title}
                  </h3>
                  <p className={`text-base mb-3 ${textSec}`}>
                    {features[currentFeature].description}
                  </p>
                  <div className={`${cardHighlight} px-4 py-2 rounded-full text-sm font-medium border`}>
                    {features[currentFeature].highlight}
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentFeature 
                          ? `${dotActive} w-8` 
                          : `${dotInactive} w-4`
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separador mobile */}
      <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />

      {/* Stats Section */}
      <section ref={statsRef} className={`relative py-16 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:justify-center ${contentBg}`}>
        <div ref={statsContentRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${modoOscuro ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
              <FiTrendingUp className="w-4 h-4" />
              <span>Crecimiento real</span>
            </div>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${textPri}`}>
              Cifras que hablan
            </h2>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto ${textSec}`}>
              Cada número representa un emprendimiento que organizó su negocio con nosotros
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`group text-center p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${modoOscuro ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700' : 'bg-white border border-gray-200 hover:shadow-lg'}`}
              >
                {/* Icono */}
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-[#004AAD] transform group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(stat.icon, { className: "w-8 h-8 text-white" })}
                </div>
                
                {/* Número */}
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-[#004AAD]">
                  {stat.number}
                </div>
                
                {/* Label */}
                <div className={`text-sm md:text-base font-semibold mb-1 ${textPri}`}>
                  {stat.label}
                </div>
                
                {/* Descripción */}
                <div className={`text-xs md:text-sm ${textSec}`}>
                  {stat.description}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className={`text-sm md:text-base mb-4 ${textSec}`}>
              Sumate a esta comunidad de emprendedores organizados
            </p>
            <button 
              onClick={() => navigate('/register')}
              className={`group inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all duration-300 ${modoOscuro ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              Empezar ahora
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Botón volver arriba */}
        <button
          onClick={() => window.__landingScroll?.goToHero()}
          className={`absolute bottom-8 right-8 w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 group z-20 ${modoOscuro ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-black/10 border-black/20 hover:bg-black/20'}`}
          aria-label="Volver arriba"
        >
          <FiArrowRight className={`w-5 h-5 rotate-[-90deg] group-hover:-translate-y-1 transition-transform ${modoOscuro ? 'text-white' : 'text-gray-900'}`} />
        </button>
      </section>

      {/* Separador mobile */}
      <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />

      {/* Features Section */}
      <section ref={featuresRef} className={`relative py-16 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:justify-center overflow-hidden ${contentBg}`}>
        <div ref={featuresContentRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header mejorado */}
          <div className="text-center mb-12 lg:mb-16">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${modoOscuro ? 'bg-[#004AAD]/20 text-[#5CA3FF]' : 'bg-[#004AAD]/10 text-[#004AAD]'}`}>
              <FiZap className="w-4 h-4" />
              <span>Funcionalidades</span>
            </div>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${textPri}`}>
              Todo en una plataforma
            </h2>
            <p className={`text-lg md:text-xl max-w-2xl mx-auto ${textSec}`}>
              Diseñada específicamente para emprendimientos y pequeñas empresas
            </p>
          </div>
          
          {/* Features Grid con animaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group relative p-6 lg:p-8 rounded-2xl border transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${modoOscuro ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-[#004AAD]/50' : 'bg-white/80 border-gray-200 hover:shadow-xl hover:border-[#004AAD]/30'}`}
              >
                {/* Icono con fondo azul animado */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${modoOscuro ? 'bg-[#004AAD]' : 'bg-[#004AAD]'}`}>
                  {React.cloneElement(feature.icon, { className: "w-7 h-7 text-white" })}
                </div>
                
                {/* Título */}
                <h3 className={`text-lg font-bold mb-3 ${textPri}`}>
                  {feature.title}
                </h3>
                
                {/* Descripción */}
                <p className={`text-sm leading-relaxed mb-4 ${textSec}`}>
                  {feature.description}
                </p>
                
                {/* Highlight azul */}
                <div className={`text-xs font-semibold ${modoOscuro ? 'text-[#5CA3FF]' : 'text-[#004AAD]'}`}>
                  {feature.highlight}
                </div>
                
                {/* Línea decorativa animada */}
                <div className={`absolute bottom-0 left-0 h-1 rounded-full transition-all duration-500 w-0 group-hover:w-full ${modoOscuro ? 'bg-[#004AAD]' : 'bg-[#004AAD]'}`} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Botón volver arriba */}
        <button
          onClick={() => window.__landingScroll?.goToHero()}
          className={`absolute bottom-8 right-8 w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 group z-20 ${modoOscuro ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-black/10 border-black/20 hover:bg-black/20'}`}
          aria-label="Volver arriba"
        >
          <FiArrowRight className={`w-5 h-5 rotate-[-90deg] group-hover:-translate-y-1 transition-transform ${modoOscuro ? 'text-white' : 'text-gray-900'}`} />
        </button>
      </section>

      {/* Separador mobile */}
      <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />

      {/* CTA Section */}
      <section ref={ctaRef} className="relative py-16 lg:py-0 lg:min-h-screen lg:flex lg:items-center lg:justify-center bg-[#004AAD]">
        <div ref={ctaContentRef} className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-sm md:text-base text-white/90 mb-6 leading-relaxed">
            Sumate a quienes ya administran su negocio con Contasuite, sin tocar AFIP
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="bg-white text-[#004aad] px-6 py-2.5 rounded-lg font-semibold text-sm border border-white hover:bg-[#00357a] hover:text-white transition-colors"
            >
              Comenzar Gratis
              <FiArrowRight className="inline-block ml-2 w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/contacto')}
              className="border border-white text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-white hover:text-[#004aad] transition-colors"
            >
              Hablar con Nosotros
            </button>
          </div>
        </div>
        {/* Botón volver arriba */}
        <button
          onClick={() => window.__landingScroll?.goToHero()}
          className={`absolute bottom-8 right-8 w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 group z-20 ${modoOscuro ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-black/10 border-black/20 hover:bg-black/20'}`}
          aria-label="Volver arriba"
        >
          <FiArrowRight className={`w-5 h-5 rotate-[-90deg] group-hover:-translate-y-1 transition-transform ${modoOscuro ? 'text-white' : 'text-gray-900'}`} />
        </button>
      </section>
    </MarketingLayout>
  );
};

export default Landing;
