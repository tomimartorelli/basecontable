import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiTarget,
  FiHeart,
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight
} from 'react-icons/fi';
import { gsap } from 'gsap';
import { ThemeContext } from '../context/ThemeContext';
import MarketingLayout from '../layouts/MarketingLayout';

const QuienesSomos = () => {
  const navigate = useNavigate();
  const { modoOscuro } = useContext(ThemeContext);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const sectionBg = modoOscuro ? 'bg-black' : 'bg-white';

  // Colores específicos para hero (sobre Aurora)
  const heroText = modoOscuro ? 'text-white' : 'text-black';
  const heroTextMuted = modoOscuro ? 'text-white/80' : 'text-black/80';

  // Refs para secciones
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);

  // Scroll animation - exact same pattern as Landing.js
  const scrollDuration = 1.2;
  const scrollEase = 'power2.inOut';
  const isScrollingRef = useRef(false);
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);

  // Reset section y scroll cuando se monta el componente (navegación a la vista)
  useEffect(() => {
    activeSectionRef.current = 0;
    setActiveSection(0);
    // Reset scroll position al inicio
    const container = document.getElementById('main-scroll');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const sections = [section1Ref, section2Ref, section3Ref];

    const handleWheel = (e) => {
      if (isScrollingRef.current) return;

      e.preventDefault();

      const currentSection = activeSectionRef.current;

      if (e.deltaY > 0 && currentSection < sections.length - 1) {
        // Scrolling down
        isScrollingRef.current = true;
        const nextSection = currentSection + 1;
        activeSectionRef.current = nextSection;
        setActiveSection(nextSection);

        const targetElement = sections[nextSection].current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const currentScrollTop = container.scrollTop;
        const targetPosition = currentScrollTop + (targetRect.top - containerRect.top);

        gsap.to(container, {
          scrollTop: targetPosition,
          duration: scrollDuration,
          ease: scrollEase,
          onComplete: () => {
            isScrollingRef.current = false;
          }
        });
      } else if (e.deltaY < 0 && currentSection > 0) {
        // Scrolling up
        isScrollingRef.current = true;
        const prevSection = currentSection - 1;
        activeSectionRef.current = prevSection;
        setActiveSection(prevSection);

        const targetElement = sections[prevSection].current;
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const currentScrollTop = container.scrollTop;
        const targetPosition = currentScrollTop + (targetRect.top - containerRect.top);

        gsap.to(container, {
          scrollTop: targetPosition,
          duration: scrollDuration,
          ease: scrollEase,
          onComplete: () => {
            isScrollingRef.current = false;
          }
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Expose current section for Navbar transparency detection
  useEffect(() => {
    window.__quienesSomosActiveSection = activeSection;
  }, [activeSection]);

  // Expose scrollTo for navigation
  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;

    window.__quienesSomosScroll = {
      goToSection: (index) => {
        const sections = [section1Ref, section2Ref, section3Ref];
        const targetElement = sections[index]?.current;
        if (!targetElement) return;

        const containerRect = container.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        const currentScrollTop = container.scrollTop;
        const targetPosition = currentScrollTop + (targetRect.top - containerRect.top);

        gsap.to(container, {
          scrollTop: targetPosition,
          duration: scrollDuration,
          ease: scrollEase,
        });
        activeSectionRef.current = index;
        setActiveSection(index);
      },
    };
    return () => {
      delete window.__quienesSomosScroll;
      delete window.__quienesSomosActiveSection;
    };
  }, []);

  const stats = [
    { number: '+500', label: 'Empresas que confían' },
    { number: '+50K', label: 'Facturas gestionadas' },
    { number: '99.9%', label: 'Uptime garantizado' },
    { number: '4.8/5', label: 'Calificación promedio' }
  ];

  const values = [
    {
      icon: <FiHeart className="w-6 h-6" />,
      title: 'Pasión por simplificar',
      description: 'Creemos que la tecnología debe hacer la vida más fácil, no más compleja.'
    },
    {
      icon: <FiShield className="w-6 h-6" />,
      title: 'Seguridad primero',
      description: 'Tu información está protegida con los más altos estándares de seguridad.'
    },
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: 'Enfoque humano',
      description: 'Diseñamos pensando en personas reales, no en números abstractos.'
    },
    {
      icon: <FiTrendingUp className="w-6 h-6" />,
      title: 'Mejora continua',
      description: 'Escuchamos a nuestros usuarios y evolucionamos constantemente.'
    }
  ];

  const differentiators = [
    'Sin complejidad fiscal',
    'Soporte humano real',
    'Actualizaciones automáticas',
    'Precio justo sin sorpresas'
  ];

  // Estilos para dots de navegación
  // const dotActive = 'bg-[#1F80FF] scale-110';bg-white' : 'bg-gray-900';
  // const dotInactive = modoOscuro ? 'bg-gray-600' : 'bg-gray-300';

  return (
    <MarketingLayout>
      <div className="bg-transparent">
        {/* ========== SECCIÓN 1: HERO ========== */}
        <section ref={section1Ref} className="relative min-h-screen flex flex-col justify-center py-12 lg:py-16 overflow-hidden bg-transparent">
          <div className="w-full relative">
            {/* Header de sección */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
              <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${heroTextMuted}`}>
                CONOCÉ CONTASUITE
              </p>
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${heroText}`}>
                Simplificamos la gestión de tu negocio
              </h1>
              <p className={`text-base md:text-lg max-w-3xl mx-auto ${heroTextMuted}`}>
                Nacimos con una misión clara: liberar a los emprendedores de la burocracia para que puedan enfocarse en lo que realmente importa.
              </p>
            </div>

            {/* Stats */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 backdrop-blur-sm rounded-2xl p-6 border ${modoOscuro ? 'bg-black/20 border-white/10' : 'bg-white/20 border-black/10'}`}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-2xl md:text-3xl font-bold mb-1 ${heroText}`}>{stat.number}</div>
                    <div className={`text-xs ${heroTextMuted}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== SECCIÓN 2: MISIÓN + DIFERENCIADORES ========== */}
        <section ref={section2Ref} className={`relative z-20 min-h-screen flex flex-col justify-center py-8 lg:py-12 ${sectionBg}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Misión */}
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 text-[#6366f1]">
                    NUESTRA MISIÓN
                  </p>
                  <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 ${textPri}`}>
                    Democratizar la gestión financiera
                  </h2>
                  <p className={`text-base ${textSec} mb-6`}>
                    Queremos que cualquier emprendedor, sin importar su tamaño o experiencia, tenga acceso a herramientas profesionales de gestión. Sin costos prohibitivos, sin curvas de aprendizaje empinadas.
                  </p>

                  <div className={`p-4 rounded-xl border ${modoOscuro ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${textPri}`}>Lo que nos diferencia</h3>
                    <ul className="space-y-2">
                      {differentiators.map((item, idx) => (
                        <li key={idx} className={`flex items-center gap-2 text-sm ${textSec}`}>
                          <FiCheckCircle className="w-4 h-4 text-[#6366f1] flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ilustración */}
                <div className={`p-8 rounded-2xl border ${modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-[#6366f1] rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                      <FiTarget className="w-10 h-10" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${textPri}`}>Hecho en Argentina</h3>
                    <p className={`text-sm ${textSec}`}>
                      Entendemos las necesidades reales de los emprendedores locales porque somos emprendedores locales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SECCIÓN 3: VALORES + CTA ========== */}
        <section ref={section3Ref} className={`relative z-20 min-h-screen flex flex-col justify-center py-8 lg:py-12 ${sectionBg}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 lg:mb-10">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 text-[#6366f1]">
                  NUESTROS VALORES
                </p>
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-3 ${textPri}`}>
                  Los principios que nos guían
                </h2>
                <p className={`text-base lg:text-lg max-w-3xl mx-auto ${textSec}`}>
                  Cada decisión que tomamos está alineada con estos valores fundamentales.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 mb-12">
                {values.map((value, index) => (
                  <div key={index} className={`${box} rounded-xl p-6 shadow-md border`}>
                    <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center text-white mb-4">
                      {value.icon}
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${textPri}`}>{value.title}</h3>
                    <p className={`text-sm ${textSec}`}>{value.description}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`text-center p-8 rounded-2xl ${modoOscuro ? 'bg-gradient-to-r from-indigo-900 to-purple-900' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                  ¿Querés ser parte de esta historia?
                </h3>
                <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                  Sumate a cientos de emprendedores que ya simplificaron su gestión con Contasuite.
                </p>
                <button 
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#6366f1] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Empezar gratis
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default QuienesSomos;
