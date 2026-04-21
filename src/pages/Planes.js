import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { gsap } from 'gsap';
import {
  FiCheck,
  FiLock,
  FiArrowRight,
  FiShield,
} from 'react-icons/fi';
import MarketingLayout from '../layouts/MarketingLayout';
import { Link, useNavigate } from 'react-router-dom';

const Planes = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const navigate = useNavigate();

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';

  // Colores específicos para hero (sobre Aurora)
  const heroText = modoOscuro ? 'text-white' : 'text-black';
  const heroTextMuted = modoOscuro ? 'text-white/80' : 'text-black/80';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500';
  const tableRowAlt = modoOscuro ? 'bg-gray-800/50' : 'bg-gray-50/70';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-100';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Refs para secciones
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section1ContentRef = useRef(null);
  const section2ContentRef = useRef(null);
  const activeSectionRef = useRef(0);
  const [activeSection, setActiveSection] = useState(0);

  // Sincronizar ref con state
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await secureFetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlan = async () => {
    if (!user?.currentPlan) return;

    // currentPlan puede venir como ID (string) o como objeto populado
    const planId =
      typeof user.currentPlan === 'string'
        ? user.currentPlan
        : user.currentPlan._id || user.currentPlan.id;

    if (!planId) return;

    try {
      const response = await secureFetch(`/api/plans/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPlan(data);
      }
    } catch (error) {
      console.error('Error al cargar plan del usuario:', error);
    }
  };

  useEffect(() => {
    loadPlans();
    loadUserPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Scroll suave entre secciones (como en la landing)
  useEffect(() => {
    const sections = [section1Ref, section2Ref];
    const isScrollingRef = { current: false };
    const scrollDuration = 1.2;
    const scrollEase = 'power2.inOut';
    
    // Detectar mobile
    const isMobile = window.innerWidth < 768;

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
          setActiveSection(index);
        }
      });
    };

    const handleWheel = (e) => {
      if (isScrollingRef.current) return;

      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      const nextSection = activeSectionRef.current + direction;

      // Solo controlar scroll si hay una sección válida a donde ir
      if (nextSection >= 0 && nextSection < sections.length) {
        e.preventDefault();
        scrollToSection(nextSection);
      }
      // Si no hay sección, dejar que el scroll natural ocurra
    };

    const container = document.getElementById('main-scroll');
    
    // Solo aplicar scroll controlado en desktop (no mobile)
    if (container && !isMobile) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Animar contenido al entrar/salir de secciones
  useEffect(() => {
    const contentRefs = [section1ContentRef, section2ContentRef];
    
    // Detectar mobile
    const isMobile = window.innerWidth < 768;

    contentRefs.forEach((ref, index) => {
      if (!ref.current) return;

      if (index === activeSection) {
        // Sección activa: entrar con animación (solo sección 1, índice 0)
        if (index === 0) {
          gsap.fromTo(ref.current,
            { opacity: 0, y: 60, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
          );
        } else {
          // Sección 2: sin animación, solo mostrar
          gsap.set(ref.current, { opacity: 1, y: 0, scale: 1 });
        }
      } else {
        // En mobile, no ocultar contenido de secciones inactivas
        // En desktop, animar salida
        if (!isMobile) {
          gsap.to(ref.current,
            { opacity: 0, y: -40, scale: 0.98, duration: 0.5, ease: 'power2.in' }
          );
        }
      }
    });
  }, [activeSection]);

  const handleSubscribe = (plan) => {
    setErrorMessage('');
    setSuccessMessage('');
    setSelectedPlan(plan);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await secureFetch('/api/users/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlan._id }),
      });

      if (response.ok) {
        // Esperar a que el usuario se actualice completamente antes de navegar
        await refreshUser();
        // Pequeña pausa para asegurar que el estado se propague
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate('/completar-perfil'); // Redirigir a completar perfil
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'No pudimos procesar la suscripción. Probá de nuevo en unos segundos.');
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      setErrorMessage('Error al procesar la suscripción. Verificá tu conexión e intentá nuevamente.');
    }
  };

  const isPlanUpgrade = (plan) => {
    if (!userPlan) return false;
    const currentStatus = userPlan.slug;
    const planStatus = plan.slug;

    const planHierarchy = {
      basico: 1,
      profesional: 2,
      empresarial: 3,
      enterprise: 4,
    };

    return (planHierarchy[planStatus] || 0) > (planHierarchy[currentStatus] || 0);
  };

  const getFeatureName = (feature) => {
    const featureNames = {
      basicInvoicing: 'Registro de ventas básico',
      basicTemplates: 'Plantillas de registro',
      customTemplates: 'Diseño personalizado de registros',
      logoUpload: 'Logo en exportaciones PDF',
      companyBranding: 'Marca de tu negocio',
      employeeAccounts: 'Múltiples usuarios',
      multiCompany: 'Multi-empresa',
      advancedAnalytics: 'Reportes y analíticas avanzadas',
      prioritySupport: 'Soporte prioritario',
    };
    return featureNames[feature] || feature;
  };

  // Todas las funcionalidades activas en al menos un plan (para la tabla)
  const allFeatures = useMemo(() => {
    const set = new Set();
    plans.forEach((plan) => {
      Object.entries(plan.features || {}).forEach(([key, value]) => {
        if (value) set.add(key);
      });
    });
    return Array.from(set);
  }, [plans]);

  // Solo mostramos los 3 planes de producto (Básico, Profesional, Empresarial)
  // y los ordenamos por precio ascendente.
  const orderedPlans = useMemo(() => {
    const allowedSlugs = ['basico', 'profesional', 'empresarial'];
    return [...plans]
      .filter((p) => allowedSlugs.includes((p.slug || '').toLowerCase()) && p.isActive !== false)
      .sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [plans]);

  const getPlanTagline = (plan) => {
    const slug = (plan.slug || '').toLowerCase();
    if (slug === 'basico') {
      return 'Para emprendedores y negocios muy chicos que recién empiezan a ordenar sus ventas y cobranzas fuera de Excel.';
    }
    if (slug === 'profesional') {
      return 'Para quienes ya tienen movimiento mensual y necesitan sumar gastos y reportes simples de flujo de caja.';
    }
    if (slug === 'empresarial') {
      return 'Para negocios que trabajan en equipo y necesitan varios usuarios, auditoría y más volumen de registros.';
    }
    return plan.description || '';
  };

  const getPlanBulletPoints = (plan) => {
    const slug = (plan.slug || '').toLowerCase();
    if (slug === 'basico') {
      return [
        'Registro simple de ventas y cobranzas',
        'Pensado para un solo usuario y un solo negocio',
        'Ideal si hoy llevás todo en cuadernos o Excel'
      ];
    }
    if (slug === 'profesional') {
      return [
        'Suma registro de gastos y reportes básicos',
        'Incluye flujo de caja por período',
        'Exportación CSV lista para tu contador'
      ];
    }
    if (slug === 'empresarial') {
      return [
        'Varios usuarios con acceso a la misma cuenta',
        'Auditoría básica de acciones por usuario',
        'Recomendado para estudios y negocios con equipo'
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <MarketingLayout>
        <div className={`min-h-[60vh] flex items-center justify-center ${modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]'}`}>
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1f80ff] border-t-transparent mx-auto" />
            <p className={`text-[11px] font-medium tracking-[0.2em] uppercase ${textSec}`}>
              Cargando planes
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="bg-transparent">
        {(errorMessage || successMessage) && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {errorMessage && (
              <div className={`mb-3 px-4 py-3 rounded-xl text-sm border ${modoOscuro ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className={`mb-3 px-4 py-3 rounded-xl text-sm border ${modoOscuro ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800'}`}>
                {successMessage}
              </div>
            )}
          </div>
        )}
        {/* ========== SECCIÓN 1: PLANES Y PRECIOS ========== */}
        <section ref={section1Ref} className="relative min-h-screen flex flex-col justify-center py-12 lg:py-16 overflow-hidden">
          <div ref={section1ContentRef} className="w-full">
          {/* Header de sección */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${heroTextMuted}`}>
              PLANES Y PRECIOS
            </p>
            <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${heroText}`}>
              Precios simples para tener el registro en orden
            </h1>
            <p className={`text-sm md:text-base max-w-2xl mx-auto ${heroTextMuted}`}>
              Empezá en minutos, sin instalaciones ni AFIP. Actualizá el plan cuando tu negocio crezca.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1F80FF] text-white text-sm font-semibold shadow-sm hover:bg-[#004AAD] transition-colors"
              >
                Comenzar gratis
                <FiArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                to="/contacto"
                className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors ${btnOut}`}
              >
                Hablar con ventas
              </Link>
            </div>

            {userPlan && (
              <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 shadow-sm border text-xs mt-6 ${box} ${textSec}`}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1F80FF]/10 text-[#1F80FF]">
                  <FiShield className="w-3 h-3" />
                </span>
                <span className="font-medium">Tu plan actual:</span>
                <span className={`font-semibold ${textPri}`}>{userPlan.name}</span>
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${modoOscuro ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  Activo
                </span>
              </div>
            )}
          </div>

          {/* Cards de Planes */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {orderedPlans.map((plan) => (
                <div
                  key={plan._id}
                  className={`group relative rounded-2xl border p-6 text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                    (plan.isPopular || (plan.slug || '').toLowerCase() === 'profesional')
                      ? 'border-[#1F80FF] shadow-lg ring-1 ring-[#1F80FF]/20'
                      : modoOscuro ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:shadow-md'
                  } ${modoOscuro ? 'bg-gray-900' : 'bg-white'}`}
                >
                  {(plan.isPopular || (plan.slug || '').toLowerCase() === 'profesional') && (
                    <div className="absolute -top-3 left-6 rounded-full bg-[#1F80FF] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      Más popular
                    </div>
                  )}
                  {user?.currentPlan === plan._id && (
                    <div className={`absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                      Tu plan
                    </div>
                  )}

                  <h3 className={`text-lg font-bold mb-2 ${textPri}`}>
                    {plan.name}
                  </h3>
                  <p className={`mb-4 text-sm ${textSec}`}>
                    {getPlanTagline(plan)}
                  </p>

                  <div className="mb-4 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${textPri}`}>
                      ${plan.price}
                    </span>
                    <span className={`text-sm ${textMuted}`}>
                      /{plan.billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </div>

                  {getPlanBulletPoints(plan).length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm">
                      {getPlanBulletPoints(plan).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <FiCheck className="w-4 h-4 mt-0.5 text-[#1F80FF] flex-shrink-0" />
                          <span className={textSec}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={user?.currentPlan === plan._id}
                    className={`mt-6 w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                      user?.currentPlan === plan._id
                        ? modoOscuro ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : plan.isPopular
                        ? 'bg-[#1F80FF] text-white hover:bg-[#004AAD] hover:shadow-md'
                        : modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'
                    }`}
                  >
                    {user?.currentPlan === plan._id
                      ? 'Plan actual'
                      : isPlanUpgrade(plan)
                      ? 'Subir de plan'
                      : 'Elegir este plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Separador mobile */}
          <div className={`h-2 lg:hidden ${modoOscuro ? 'bg-gray-800' : 'bg-gray-100'}`} />
        </div>
        </section>

        {/* ========== SECCIÓN 2: DETALLE POR PLAN ========== */}
        <section ref={section2Ref} className={`relative min-h-screen flex flex-col justify-center py-12 lg:py-16 ${modoOscuro ? 'bg-black' : 'bg-white'}`}>
          <div ref={section2ContentRef} className="w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header de sección */}
            <div className="text-center mb-10">
              <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${modoOscuro ? 'text-[#5CA3FF]' : 'text-[#004AAD]'}`}>
                DETALLE POR PLAN
              </p>
              <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 ${textPri}`}>
                Compará funcionalidades y límites
              </h2>
              <p className={`text-sm md:text-base max-w-2xl mx-auto ${textSec}`}>
                Una vista clara para entender qué incluye cada plan.
              </p>
            </div>

            <div className={`overflow-x-auto rounded-2xl border ${modoOscuro ? 'border-gray-800' : 'border-gray-200'}`}>
              <table className="min-w-full text-left text-xs">
                <thead className={tableHead}>
                  <tr>
                    <th className="py-2.5 pl-5 pr-4 text-xs font-semibold uppercase tracking-wide">
                      Característica
                    </th>
                    {orderedPlans.map((plan) => (
                      <th
                        key={plan._id}
                        className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide text-center"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${divideY} ${modoOscuro ? 'bg-gray-900/50' : ''}`}>
                  {/* Límites */}
                  <tr className={tableRowAlt}>
                    <td
                      colSpan={1 + orderedPlans.length}
                      className={`py-2 pl-5 pr-4 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}
                    >
                      Límites incluidos
                    </td>
                  </tr>
                  <tr>
                    <td className={`py-2.5 pl-5 pr-4 text-xs ${textSec}`}>
                      Usuarios incluidos
                    </td>
                    {orderedPlans.map((plan) => (
                      <td
                        key={plan._id + '-users'}
                        className={`py-2.5 px-4 text-center text-xs ${textPri}`}
                      >
                        {plan.maxEmployees}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={`py-2.5 pl-5 pr-4 text-xs ${textSec}`}>
                      Flujos / automatizaciones máx.
                    </td>
                    {orderedPlans.map((plan) => (
                      <td
                        key={plan._id + '-flows'}
                        className={`py-2.5 px-4 text-center text-xs ${textPri}`}
                      >
                        {plan.maxTemplates}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={`py-2.5 pl-5 pr-4 text-xs ${textSec}`}>
                      Registros recomendados / mes
                    </td>
                    {orderedPlans.map((plan) => (
                      <td
                        key={plan._id + '-docs'}
                        className={`py-2.5 px-4 text-center text-xs ${textPri}`}
                      >
                        {plan.maxDocumentsPerMonth || 'Sin límite'}
                      </td>
                    ))}
                  </tr>

                  {/* Funcionalidades */}
                  <tr className={tableRowAlt}>
                    <td
                      colSpan={1 + orderedPlans.length}
                      className={`py-2 pl-5 pr-4 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}
                    >
                      Funcionalidades
                    </td>
                  </tr>
                  {allFeatures.map((featureKey) => (
                    <tr key={featureKey}>
                      <td className={`py-2.5 pl-5 pr-4 text-xs ${textSec}`}>
                        {getFeatureName(featureKey)}
                      </td>
                      {orderedPlans.map((plan) => {
                        const enabled = plan.features?.[featureKey];
                        return (
                          <td
                            key={plan._id + '-' + featureKey}
                            className="py-2.5 px-4 text-center"
                          >
                            {enabled ? (
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${modoOscuro ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                <FiCheck className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${modoOscuro ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
                                <FiLock className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón volver arriba */}
          <button
            onClick={() => {
              const container = document.getElementById('main-scroll');
              if (container && section1Ref.current) {
                gsap.to(container, {
                  scrollTop: section1Ref.current.offsetTop,
                  duration: 1.2,
                  ease: 'power2.inOut',
                  onComplete: () => {
                    setActiveSection(0);
                  }
                });
              }
            }}
            className={`absolute bottom-8 right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group z-20 ${modoOscuro ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
            aria-label="Volver arriba"
          >
            <FiArrowRight className="w-5 h-5 rotate-[-90deg] group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </section>

        {/* Modal de suscripción muy simple */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${box}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F80FF]/10 text-[#1F80FF]">
                  <FiCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${textPri}`}>
                    {isPlanUpgrade(selectedPlan)
                      ? 'Actualizar plan'
                      : 'Confirmar suscripción'}
                  </h3>
                  <p className={`text-xs ${textMuted}`}>
                    {selectedPlan.name} — ${selectedPlan.price}/
                    {selectedPlan.billingCycle === 'monthly' ? 'mes' : 'año'}
                  </p>
                </div>
              </div>
              <p className={`mb-6 text-sm ${textSec}`}>
                {isPlanUpgrade(selectedPlan)
                  ? `¿Querés actualizar tu cuenta al plan ${selectedPlan.name}? Podrás acceder inmediatamente a las funcionalidades nuevas.`
                  : `¿Querés suscribirte al plan ${selectedPlan.name}? Podrás cambiar de plan o cancelarlo cuando quieras.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${btnOut}`}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSubscription}
                  className="flex-1 rounded-full bg-[#1F80FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004AAD]"
                >
                  {isPlanUpgrade(selectedPlan) ? 'Actualizar' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MarketingLayout>
  );
};

export default Planes;

