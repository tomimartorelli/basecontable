import React, { useContext, useEffect, useRef, useState } from 'react';
import MarketingLayout from '../layouts/MarketingLayout';
import { ThemeContext } from '../context/ThemeContext';
import { gsap } from 'gsap';
import { 
  FiFileText, 
  FiUsers, 
  FiTrendingUp, 
  FiBarChart, 
  FiShield, 
  FiZap, 
  FiClock, 
  FiCheckCircle,
  FiDollarSign,
  FiDatabase,
  FiSmartphone,
  FiGlobe,
  FiLock,
  FiAward,
  FiTarget
} from 'react-icons/fi';

const Funcionalidades = () => {
  const { modoOscuro } = useContext(ThemeContext);
  // Refs para secciones - mismo patrón que Planes.js
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  
  // Scroll animation - exact same pattern as Landing.js
  const scrollDuration = 1.2;
  const scrollEase = 'power2.inOut';
  const isScrollingRef = useRef(false);
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);

  // Reset section cuando se monta el componente (navegación a la vista)
  useEffect(() => {
    activeSectionRef.current = 0;
    setActiveSection(0);
  }, []);

  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const sections = [section1Ref, section2Ref, section3Ref, section4Ref];

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

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      if (!container) return;

      const containerHeight = container.clientHeight;
      
      sections.forEach((ref, index) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTop = rect.top - containerRect.top;
        
        // Si el elemento está en el viewport y es el más visible
        if (elementTop >= -containerHeight / 2 && elementTop < containerHeight / 2) {
          if (activeSectionRef.current !== index) {
            activeSectionRef.current = index;
            setActiveSection(index);
            window.__funcionalidadesActiveSection = index;
          }
        }
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Expose current section for Navbar transparency detection
  useEffect(() => {
    window.__funcionalidadesActiveSection = activeSection;
  }, [activeSection]);
  useEffect(() => {
    const container = document.getElementById('main-scroll');
    if (!container) return;
    
    window.__funcionalidadesScroll = {
      goToSection: (index) => {
        const sections = [section1Ref, section2Ref, section3Ref, section4Ref];
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
      delete window.__funcionalidadesScroll;
    };
  }, []);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const sectionBg = modoOscuro ? 'bg-black' : 'bg-white';
  const ctaBg = modoOscuro ? 'bg-[#002b5c]' : 'bg-[#004aad]';

  // Colores específicos para hero (sobre Aurora)
  const heroText = modoOscuro ? 'text-white' : 'text-black';
  const heroTextMuted = modoOscuro ? 'text-white/80' : 'text-black/80';

  const features = [
    {
      icon: <FiFileText className="w-8 h-8" />,
      title: "Registro de ventas y movimientos",
      description: "Registrá ventas, ingresos y egresos con numeración interna. Control de estados de pago y vencimientos. Todo para tu gestión, sin facturación electrónica.",
      highlights: ["Numeración interna", "Estados de pago", "Seguimiento de vencimientos", "Registro listo para el contador"]
    },
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Cartera de clientes",
      description: "Tu cartera en un solo lugar: datos de contacto, historial de operaciones y estado de cobranzas.",
      highlights: ["Datos completos", "Historial por cliente", "Cobranzas asociadas", "Exportación de datos"]
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: "Dashboard y métricas",
      description: "Ventas por período, flujo de caja y métricas clave con gráficos y reportes en tiempo real.",
      highlights: ["Vista en tiempo real", "Gráficos por período", "Resúmenes exportables", "Para vos o tu contador"]
    },
    {
      icon: <FiBarChart className="w-8 h-8" />,
      title: "Reportes y exportación",
      description: "Reportes de ventas, clientes y cobranzas. Exportá a PDF o Excel para llevar al contador o para tu gestión.",
      highlights: ["Reportes por período", "Exportación PDF/Excel", "Filtros por fecha y cliente", "Sin complejidad fiscal"]
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Seguridad y Acceso",
      description: "Sistema de roles y permisos para controlar el acceso a la información según las responsabilidades.",
      highlights: ["Roles de usuario", "Permisos granulares", "Auditoría de acciones", "Acceso seguro"]
    },
    {
      icon: <FiZap className="w-8 h-8" />,
      title: "Automatización",
      description: "Automatiza tareas repetitivas como recordatorios de vencimientos y notificaciones.",
      highlights: ["Recordatorios automáticos", "Notificaciones por email", "Tareas programadas", "Flujos de trabajo"]
    }
  ];

  const technicalFeatures = [
    {
      icon: <FiDatabase className="w-6 h-6" />,
      title: "Base de Datos Robusta",
      description: "MongoDB con arquitectura escalable y respaldos automáticos"
    },
    {
      icon: <FiSmartphone className="w-6 h-6" />,
      title: "Responsive Design",
      description: "Funciona perfectamente en desktop, tablet y móvil"
    },
    {
      icon: <FiGlobe className="w-6 h-6" />,
      title: "Acceso Web",
      description: "Accede desde cualquier lugar con conexión a internet"
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Encriptación SSL",
      description: "Toda la información se transmite de forma segura"
    }
  ];

  const benefits = [
    {
      icon: <FiClock className="w-6 h-6" />,
      title: "Ahorro de Tiempo",
      description: "Reduce el tiempo de gestión administrativa en un 60%"
    },
    {
      icon: <FiCheckCircle className="w-6 h-6" />,
      title: "Precisión",
      description: "Elimina errores humanos en cálculos y reportes"
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "ROI Incremental",
      description: "Mejora la rentabilidad con mejor control financiero"
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: "Profesionalismo",
      description: "Presenta información de calidad a tus clientes"
    }
  ];

  return (
    <MarketingLayout>
      <div className="bg-transparent">
        {/* ========== SECCIÓN 1: HERO ========== */}
        <section ref={section1Ref} className="relative min-h-screen flex flex-col justify-center py-12 lg:py-16 overflow-hidden bg-transparent">
          <div className="w-full relative">
            {/* Header de sección */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
              <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${heroTextMuted}`}>
                PLATAFORMA DE ADMINISTRACIÓN
              </p>
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${heroText}`}>
                Todo para tener el registro en orden, sin tocar AFIP
              </h1>
              <p className={`text-sm md:text-base max-w-2xl mx-auto ${heroTextMuted}`}>
                Centralizá clientes, registro de ventas y control de cobranzas en un solo lugar. Sin complejidad fiscal.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur text-sm ${modoOscuro ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                  <FiTarget className="w-4 h-4" />
                  <span>Registro de ventas y movimientos</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur text-sm ${modoOscuro ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                  <FiZap className="w-4 h-4" />
                  <span>Control de cobranzas</span>
                </div>
              </div>
            </div>

            {/* Cards de resumen */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 backdrop-blur-sm rounded-2xl p-6 border ${modoOscuro ? 'bg-black/20 border-white/10' : 'bg-white/20 border-black/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'bg-white/10' : 'bg-black/10'}`}>
                    <FiShield className={`w-6 h-6 ${heroText}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${heroText}`}>Cobranzas al día</h3>
                    <p className={`text-sm ${heroTextMuted}`}>Control de lo que te deben y lo que ya cobraste</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'bg-white/10' : 'bg-black/10'}`}>
                    <FiBarChart className={`w-6 h-6 ${heroText}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${heroText}`}>Visión mensual</h3>
                    <p className={`text-sm ${heroTextMuted}`}>Movimientos del mes y salud de cobro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Separador mobile */}
          <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />
        </section>

        {/* ========== SECCIÓN 2: FUNCIONALIDADES PRINCIPALES ========== */}
        <section ref={section2Ref} className={`relative z-20 min-h-screen flex flex-col justify-center py-8 lg:py-12 overflow-hidden ${sectionBg}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8 lg:mb-10">
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-3 ${textPri}`}>
                  Lo básico que necesitás para dejar el Excel
                </h2>
                <p className={`text-base lg:text-lg max-w-3xl mx-auto ${textSec}`}>
                  Registro de ventas, cobranzas, gastos y reportes claros. Todo explicado en simple.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {features.map((feature, index) => (
                  <div key={index} className="group">
                    <div className={`${box} rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border h-full`}>
                      <div className="w-12 h-12 bg-[#1f80ff] rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${textPri}`}>{feature.title}</h3>
                      <p className={`mb-3 text-sm leading-relaxed ${textSec}`}>{feature.description}</p>
                      <ul className="space-y-1">
                        {feature.highlights.map((highlight, idx) => (
                          <li key={idx} className={`flex items-center gap-2 text-xs ${modoOscuro ? 'text-gray-300' : 'text-gray-700'}`}>
                            <FiCheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separador mobile */}
          <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'} mt-6`} />
        </section>

        {/* ========== SECCIÓN 3: BENEFICIOS + CARACTERÍSTICAS TÉCNICAS ========== */}
        <section ref={section3Ref} className={`relative z-20 min-h-screen flex flex-col justify-center py-8 lg:py-12 overflow-hidden ${sectionBg}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* Beneficios */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
              <div className="text-center mb-8">
                <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${textPri}`}>
                  ¿Por qué elegir Contasuite?
                </h2>
                <p className={`text-sm max-w-xl mx-auto ${textSec}`}>
                  Sabé sin vueltas cuánto vendiste, qué te deben y cómo viene tu caja.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="text-center group">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-[#1f80ff] rounded-full flex items-center justify-center text-white mx-auto mb-2 group-hover:scale-105 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>{benefit.title}</h3>
                    <p className={`text-xs leading-tight ${textSec}`}>{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Características Técnicas */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 border-t border-gray-700/30">
              <div className="text-center mb-8">
                <h2 className={`text-2xl md:text-3xl font-bold mb-3 ${textPri}`}>
                  Bajo el capó
                </h2>
                <p className={`text-sm max-w-xl mx-auto ${textSec}`}>
                  Tecnología moderna para que la app sea rápida, segura y siempre disponible.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {technicalFeatures.map((feature, index) => (
                  <div key={index} className={`${box} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-300 border`}>
                    <div className="w-10 h-10 bg-[#5ca3ff] rounded-lg flex items-center justify-center text-white mb-2">
                      {feature.icon}
                    </div>
                    <h3 className={`text-xs font-semibold mb-1 ${textPri}`}>{feature.title}</h3>
                    <p className={`text-xs leading-tight ${textSec}`}>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separador mobile */}
          <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />
        </section>

        {/* ========== SECCIÓN 4: CTA ========== */}
        <section ref={section4Ref} className={`relative z-20 min-h-screen flex flex-col justify-center py-12 lg:py-16 overflow-hidden ${ctaBg}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                ¿Listo para transformar tu negocio?
              </h2>
              <p className="text-xl text-[#5ca3ff] mb-8 leading-relaxed">
                Sumate a quienes ya tienen el registro en orden con Contasuite
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className={`px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ${modoOscuro ? 'bg-white text-[#002b5c] hover:bg-gray-100' : 'bg-white text-[#004aad] hover:bg-gray-50'}`}>
                  Comenzar Prueba Gratuita
                </button>
                <button className={`border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white transition-all duration-300 ${modoOscuro ? 'hover:text-[#002b5c]' : 'hover:text-[#004aad]'}`}>
                  Ver Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Funcionalidades;
