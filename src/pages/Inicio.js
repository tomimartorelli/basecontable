import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { 
  FiUsers, 
  FiFileText, 
  FiTrendingUp, 
  FiShield, 
  FiZap, 
  FiBarChart,
  FiArrowRight,
  FiClock,
  FiDollarSign,
  FiActivity,
  FiTarget,
  FiTrendingDown,
  FiRefreshCw
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import useAdminPermissions from '../hooks/useAdminPermissions';

const Inicio = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const { getPlanName, getPlanSlug, isFeatureAvailable } = useAdminPermissions();
  
  const [stats, setStats] = useState({
    clientes: 0,
    facturas: 0,
    ingresos: 0,
    pendientes: 0,
    crecimiento: 0,
    eficiencia: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [flujoMes, setFlujoMes] = useState({
    desde: null,
    hasta: null,
    ventasCobradas: 0,
    egresosTotal: 0,
    flujoCaja: 0
  });
  const [isLoadingFlujoMes, setIsLoadingFlujoMes] = useState(false);

  // Información del plan actual (para mostrar qué incluye / qué no)
  const planName = getPlanName();
  const planSlug = getPlanSlug();
  const hasEquipo = isFeatureAvailable('employeeAccounts');
  const hasAuditoria = isFeatureAvailable('advancedAnalytics');

  // Función para cargar estadísticas reales
  const fetchStats = useCallback(async () => {
    if (!token || isLoadingStats) return;
    
    try {
      setIsLoadingStats(true);
      setLoading(true);
      setError('');
      
      // Obtener ID del usuario para filtrar datos
      const userId = user?.id || user?._id;
      const empresaId = user?.empresaId || user?.empresa?.id;
      
      if (!userId) {
        throw new Error('No se pudo identificar al usuario');
      }
      
      // Construir URLs con filtros de usuario - FORZAR SIEMPRE
      const resumenUrl = `/api/invoices-dashboard/resumen?userId=${userId}&forceUserFilter=true&preventGlobalData=true&userSpecificOnly=true`;
      const impagasUrl = `/api/invoices-dashboard/impagas?userId=${userId}&forceUserFilter=true&preventGlobalData=true&userSpecificOnly=true`;
      const impagasMesUrl = `/api/invoices-dashboard/impagas?periodo=mes&userId=${userId}&forceUserFilter=true&preventGlobalData=true&userSpecificOnly=true`;
      const mesAnteriorUrl = `/api/invoices-dashboard/resumen?periodo=mes&userId=${userId}&forceUserFilter=true&preventGlobalData=true&userSpecificOnly=true`;
      
      // Headers personalizados para forzar filtro de usuario
      const userSpecificHeaders = {
        'X-Force-User-Filter': 'true',
        'X-Prevent-Global-Data': 'true',
        'X-User-Specific-Only': 'true'
      };
      
      // Obtener resumen del dashboard
      const resumenRes = await secureFetch(resumenUrl, { headers: userSpecificHeaders });
      if (!resumenRes.ok) {
        throw new Error('Error al obtener resumen del dashboard');
      }
      const resumen = await resumenRes.json();
      
      // Log para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 INICIO: Datos del resumen recibidos:', {
          usuario: user?.email,
          userId,
          empresaId,
          resumen,
          url: resumenUrl
        });
      }
      
      // Obtener facturas impagas
      const impagasRes = await secureFetch(impagasUrl, { headers: userSpecificHeaders });
      if (!impagasRes.ok) {
        throw new Error('Error al obtener facturas impagas');
      }
      const impagas = await impagasRes.json();

      // Obtener impagas del mes para eficiencia mensual
      let impagasMes = { cantidad: 0, monto: 0 };
      try {
        const impagasMesRes = await secureFetch(impagasMesUrl, { headers: userSpecificHeaders });
        if (impagasMesRes.ok) {
          impagasMes = await impagasMesRes.json();
        }
      } catch (err) {
        impagasMes = { cantidad: 0, monto: 0 };
      }
      
      // Calcular métricas de crecimiento (comparar con mes anterior)
      let crecimiento = 0;
      try {
        // Obtener facturas del mes anterior para comparar
        const mesAnteriorRes = await secureFetch(mesAnteriorUrl, { headers: userSpecificHeaders });
        if (mesAnteriorRes.ok) {
          const mesAnterior = await mesAnteriorRes.json();
          
          // Calcular crecimiento basado en ingresos del mes actual vs mes anterior
          const ingresosMesActual = resumen.facturasMes > 0 ? resumen.totalIngresos : 0;
          const ingresosMesAnterior = mesAnterior.facturasMes > 0 ? mesAnterior.totalIngresos : 0;
          
          if (ingresosMesActual > 0 && ingresosMesAnterior > 0) {
            crecimiento = Math.round(((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100);
          } else if (ingresosMesActual > 0 && ingresosMesAnterior === 0) {
            crecimiento = 100; // Si no había ingresos el mes anterior, es 100% de crecimiento
          } else if (ingresosMesActual === 0 && ingresosMesAnterior > 0) {
            crecimiento = -100; // Si no hay ingresos este mes pero había el anterior, es -100%
          }
        }
      } catch (err) {
        crecimiento = 0;
      }
      
      // Calcular eficiencia DEL MES (pagadas / total del mes)
      const totalMes = resumen.facturasMes || 0;
      const pagadasMes = Math.max(totalMes - (impagasMes.cantidad || 0), 0);
      const eficiencia = totalMes > 0 ? Math.round((pagadasMes / totalMes) * 100) : 100;
      
      const newStats = {
        clientes: resumen.clientesUnicos || 0,
        facturas: resumen.totalFacturas || 0,
        ingresos: Number(resumen.totalIngresos) || 0,
        pendientes: impagas.cantidad || 0,
        crecimiento: Math.max(crecimiento, 0), // No mostrar crecimiento negativo por ahora
        eficiencia: eficiencia
      };
      
      setStats(newStats);
      setLastUpdated(new Date());
      setError(''); // Limpiar errores previos si la carga fue exitosa
      
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar estadísticas. Intenta de nuevo.');
      
      // Mantener estadísticas anteriores en caso de error
    } finally {
      setLoading(false);
      setIsLoadingStats(false);
    }
  }, [token, secureFetch, isLoadingStats, user]);

  // Función para cargar actividades recientes
  const fetchActivities = useCallback(async () => {
    if (!token || isLoadingActivities) return;
    
    try {
      setIsLoadingActivities(true);
      
      const res = await secureFetch('/api/activity');
      if (!res.ok) throw new Error('Error al obtener actividades');
      
      const activities = await res.json();
      
      // Formatear actividades para mostrar en la UI
      const formattedActivities = activities.slice(0, 4).map(activity => {
        // Determinar tipo de actividad basado en la acción
        let type = 'general';
        let icon = <FiActivity className="w-5 h-5 text-gray-900" />;
        let color = 'bg-white border-gray-200';
        let status = 'info';
        let amount = '';
        
        if (activity.action.includes('factura') || activity.action.includes('Factura')) {
          type = 'factura';
          icon = <FiFileText className="w-5 h-5 text-gray-900" />;
          color = 'bg-white border-gray-200';
          status = 'success';
        } else if (activity.action.includes('cliente') || activity.action.includes('Cliente')) {
          type = 'cliente';
          icon = <FiUsers className="w-5 h-5 text-gray-900" />;
          color = 'bg-white border-gray-200';
          status = 'info';
        } else if (activity.action.includes('pago') || activity.action.includes('Pago')) {
          type = 'pago';
          icon = <FiDollarSign className="w-5 h-5 text-gray-900" />;
          color = 'bg-white border-gray-200';
          status = 'success';
        } else if (activity.action.includes('elimin') || activity.action.includes('Elimin')) {
          type = 'eliminacion';
          icon = <FiTrendingDown className="w-5 h-5 text-gray-900" />;
          color = 'bg-white border-gray-200';
          status = 'warning';
        }
        
        // Calcular tiempo relativo
        const timeAgo = getTimeAgo(activity.createdAt);
        
        return {
          type,
          action: activity.action,
          detail: activity.details || 'Sin detalles adicionales',
          time: timeAgo,
          icon,
          color,
          status,
          amount,
          createdAt: activity.createdAt
        };
      });
      
      setRecentActivities(formattedActivities);
      
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      // No mostrar error en la UI para actividades, solo log
    } finally {
      setIsLoadingActivities(false);
    }
  }, [token, secureFetch, isLoadingActivities]);

  const fetchFlujoMes = useCallback(async () => {
    if (!token || isLoadingFlujoMes) return;
    try {
      setIsLoadingFlujoMes(true);
      const now = new Date();
      const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const res = await secureFetch(`/api/reportes/flujo-caja?desde=${desde}&hasta=${hasta}`);
      if (!res.ok) throw new Error('Error al cargar flujo de caja');
      const data = await res.json();
      setFlujoMes({
        desde: data.desde,
        hasta: data.hasta,
        ventasCobradas: data.ventasCobradas || 0,
        egresosTotal: data.egresosTotal || 0,
        flujoCaja: data.flujoCaja || 0
      });
    } catch (err) {
      console.error('Error al cargar flujo de caja del mes:', err);
    } finally {
      setIsLoadingFlujoMes(false);
    }
  }, [token, secureFetch, isLoadingFlujoMes]);

  // Función para formatear tiempo relativo
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    if (diffInSeconds < 31536000) return `Hace ${Math.floor(diffInSeconds / 2592000)} meses`;
    return `Hace ${Math.floor(diffInSeconds / 31536000)} años`;
  };

  // Función para refrescar datos
  const handleRefresh = useCallback(async () => {
    if (refreshing || isLoadingStats || isLoadingActivities) return;
    
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchActivities(), fetchFlujoMes()]);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing, isLoadingStats, isLoadingActivities]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (token && !hasLoaded) {
      setHasLoaded(true);
      fetchStats();
      fetchActivities();
      fetchFlujoMes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasLoaded]); // Solo se ejecuta cuando cambia el token

  // Resetear flag cuando cambie el usuario
  useEffect(() => {
    setHasLoaded(false);
  }, [user]);

  const quickActions = [
    {
      title: "Nueva venta",
      description: "Registrar una venta en segundos",
      icon: <FiFileText className="w-6 h-6" />,
      action: () => navigate('/facturas?tab=crear'),
      badge: "Popular"
    },
    {
      title: "Qué me deben",
      description: "Ver cobranzas y ventas impagas",
      icon: <FiDollarSign className="w-6 h-6" />,
      action: () => navigate('/cobranzas'),
      badge: stats.pendientes > 0 ? `${stats.pendientes} pendientes` : null
    },
    {
      title: "Agregar Cliente",
      description: "Registrar nuevo cliente al sistema",
      icon: <FiUsers className="w-6 h-6" />,
      action: () => navigate('/clientes'),
    },
    {
      title: "Dashboard",
      description: "Métricas y análisis en tiempo real",
      icon: <FiBarChart className="w-6 h-6" />,
      action: () => navigate('/dashboard'),
    },
    {
      title: "Reportes",
      description: "Ventas por período y flujo de caja",
      icon: <FiTrendingUp className="w-6 h-6" />,
      action: () => navigate('/reportes'),
    }
  ];

  if (user && user.role === 'admin') {
    quickActions.push({
      title: "Panel Admin",
      description: "Gestionar usuarios y sistema",
      icon: <FiShield className="w-6 h-6" />,
      action: () => navigate('/admin/users'),
      
      badge: "Admin"
    });
  }

  const insights = [
    {
      title: "Productividad",
      description: `En total registraste ${stats.facturas || 0} ventas`,
      icon: <FiZap className="w-6 h-6 text-gray-900" />,
      trend: (() => {
        if (stats.crecimiento > 0) return `+${stats.crecimiento}% vs mes anterior`;
        if (stats.crecimiento < 0) return `${stats.crecimiento}% vs mes anterior`;
        return "Sin cambios vs mes anterior";
      })(),
      trendColor: (() => {
        if (stats.crecimiento > 0) return "text-green-600";
        if (stats.crecimiento < 0) return "text-red-600";
        return "text-gray-600";
      })()
    },
    {
      title: "Crecimiento",
      description: `${stats.clientes || 0} clientes únicos en tu cartera`,
      icon: <FiTrendingUp className="w-6 h-6 text-gray-900" />,
      trend: stats.clientes > 0 ? "Activo" : "Sin clientes",
      trendColor: stats.clientes > 0 ? "text-green-600" : "text-gray-600"
    },
    {
      title: "Ventas",
      description: (() => {
        return `Total vendido: $${stats.ingresos > 0 ? 
          (stats.ingresos >= 1000000 ? 
            (stats.ingresos / 1000000).toFixed(1) + 'M' : 
            (stats.ingresos / 1000).toFixed(0) + 'K'
          ) : 
          '0'
        }`;
      })(),
      icon: <FiDollarSign className="w-6 h-6 text-gray-900" />,
      trend: stats.pendientes > 0 ? `${stats.pendientes} pendientes` : "Al día",
      trendColor: stats.pendientes > 0 ? "text-orange-600" : "text-green-600"
    }
  ];

  // Estructura preparada para tareas pendientes futuras
  const upcomingTasks = [
    {
      title: "Revisar ventas vencidas",
      due: "Hoy",
      priority: "high",
      icon: <FiClock className="w-5 h-5" />,
      action: () => navigate('/facturas') // Futuro: filtrar por vencidas
    },
    {
      title: "Actualizar datos de clientes",
      due: "Mañana",
      priority: "medium",
      icon: <FiUsers className="w-5 h-5" />,
      action: () => navigate('/clientes')
    },
    {
      title: "Generar reporte mensual",
      due: "En 3 días",
      priority: "low",
      icon: <FiBarChart className="w-5 h-5" />,
      action: () => navigate('/dashboard')
    }
  ];

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const boxSoft = modoOscuro ? 'bg-gray-900/80 border-gray-700' : 'bg-white border-gray-100';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
      {/* Hero Section */}
      <section className={modoOscuro ? 'border-b border-gray-800 bg-black' : 'border-b border-gray-200 bg-white'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <div className="text-center">
            {/* Welcome Message */}
            <div className="mb-6">
              <p className={`text-[11px] font-semibold tracking-[0.2em] uppercase mb-3 ${textMuted}`}>
                INICIO
              </p>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-semibold mb-2 leading-tight ${textPri}`}>
                ¡Hola,{' '}
                <span className="text-[#1f80ff]">
                  {user?.name || 'Usuario'}!
                </span>
              </h1>
              <p className={`text-sm sm:text-base max-w-3xl mx-auto leading-relaxed ${textSec}`}>
                Números clave de tu negocio: ventas, cobranzas, gastos y flujo de caja.
              </p>
            </div>

            {/* Plan actual + Checklist de primeros pasos */}
            <div className="max-w-6xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resumen del plan */}
              <div className={`${box} rounded-2xl p-4 text-left`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold tracking-[0.18em] uppercase ${textMuted}`}>
                    Tu plan actual
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/planes')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1f80ff] hover:underline"
                  >
                    Ver planes
                    <FiArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className={`text-lg font-semibold ${textPri}`}>{planName}</div>
                    <p className={`text-xs ${textSec}`}>
                      {planSlug === 'basico' && 'Ideal para registrar ventas simples y cobranzas.'}
                      {planSlug === 'profesional' && 'Incluye gastos, reportes y flujo de caja.'}
                      {planSlug === 'empresarial' && 'Pensado para equipos: varios usuarios y auditoría.'}
                      {planSlug !== 'basico' && planSlug !== 'profesional' && planSlug !== 'empresarial' && 'Plan personalizado.'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${hasEquipo ? 'border-green-500/60 bg-green-500/5' : modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <span className={textSec}>Equipo de usuarios</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${hasEquipo ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}>
                      {hasEquipo ? 'Incluido' : 'No incluido'}
                    </span>
                  </div>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${hasAuditoria ? 'border-blue-500/60 bg-blue-500/5' : modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <span className={textSec}>Auditoría de equipo</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${hasAuditoria ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800'}`}>
                      {hasAuditoria ? 'Incluida' : 'No incluida'}
                    </span>
                  </div>
                </div>
                {(!hasEquipo || !hasAuditoria) && (
                  <p className={`mt-3 text-[11px] leading-relaxed ${textSec}`}>
                    {!hasEquipo && (planSlug === 'basico' || planSlug === 'profesional') && (
                      <>
                        Tu plan {planSlug === 'basico' ? 'Básico' : 'Profesional'} no incluye equipo de usuarios.
                        {' '}Al pasar a <strong>Empresarial</strong> vas a poder invitar empleados con sus propias cuentas.
                      </>
                    )}
                    {!hasEquipo && planSlug !== 'basico' && planSlug !== 'profesional' && (
                      <>
                        Tu plan actual no incluye equipo de usuarios.
                        {' '}Al subir a <strong>Empresarial</strong> vas a poder invitar empleados con sus propias cuentas.
                      </>
                    )}
                    {!hasAuditoria && (
                      <>
                        {' '}La auditoría de equipo está disponible en el plan <strong>Empresarial</strong> para ver quién hizo qué y cuándo.
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Checklist de primeros pasos */}
              <div className={`${box} rounded-2xl p-4 text-left`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold tracking-[0.18em] uppercase ${textMuted}`}>
                    Primeros pasos
                  </span>
                </div>
                <p className={`text-xs mb-3 ${textSec}`}>
                  Completá estos pasos para empezar a sacarle provecho a Contasuite.
                </p>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/clientes')}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        stats.clientes > 0
                          ? 'border-green-500 bg-green-500 text-white'
                          : modoOscuro
                            ? 'border-gray-600 text-gray-300'
                            : 'border-gray-300 text-gray-500'
                      }`}>
                        {stats.clientes > 0 ? '✓' : '1'}
                      </span>
                      <span className={textSec}>Agregar tu primer cliente</span>
                    </button>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/facturas?tab=crear')}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        stats.facturas > 0
                          ? 'border-green-500 bg-green-500 text-white'
                          : modoOscuro
                            ? 'border-gray-600 text-gray-300'
                            : 'border-gray-300 text-gray-500'
                      }`}>
                        {stats.facturas > 0 ? '✓' : '2'}
                      </span>
                      <span className={textSec}>Registrar tu primera venta</span>
                    </button>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/reportes')}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        stats.facturas > 0
                          ? 'border-green-500 bg-green-500 text-white'
                          : modoOscuro
                            ? 'border-gray-600 text-gray-300'
                            : 'border-gray-300 text-gray-500'
                      }`}>
                        {stats.facturas > 0 ? '✓' : '3'}
                      </span>
                      <span className={textSec}>Mirar tus reportes y flujo de caja</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-6">
              {/* Indicador de estado */}
              {error && (
                <div className="col-span-full mb-4">
                  <div className={modoOscuro ? 'bg-red-900/30 border border-red-700 rounded-xl p-4 text-center' : 'bg-red-50 border border-red-200 rounded-xl p-4 text-center'}>
                    <div className={`flex items-center justify-center gap-2 ${modoOscuro ? 'text-red-200' : 'text-red-800'}`}>
                      <FiRefreshCw className="w-5 h-5" />
                      <span className="font-medium">{error}</span>
                      <button 
                        onClick={handleRefresh}
                        className={modoOscuro ? 'bg-red-800 hover:bg-red-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors' : 'bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors'}
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Información de última actualización */}
              {!error && lastUpdated && (
                <div className="col-span-full mb-2">
                  <div className={`text-center text-sm ${textMuted}`}>
                    <span className="flex items-center justify-center gap-2">
                      <FiClock className="w-4 h-4" />
                      Última actualización: {lastUpdated.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                      {refreshing && (
                        <FiRefreshCw className="w-4 h-4 animate-spin text-[#1f80ff]" />
                      )}
                    </span>
                  </div>
                </div>
              )}
              
              <div className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center`}>
                <div className={`text-2xl font-semibold mb-1 ${textPri}`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    stats.clientes.toLocaleString()
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Clientes
                </div>
              </div>
              <div className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center`}>
                <div className={`text-2xl font-semibold mb-1 ${textPri}`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    stats.facturas.toLocaleString()
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Ventas (total)
                </div>
              </div>
              <div className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center`}>
                <div className={`text-2xl font-semibold mb-1 ${textPri}`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    (() => {
                      return stats.ingresos > 0 ? 
                        (stats.ingresos >= 1000000 ? 
                          `$${(stats.ingresos / 1000000).toFixed(1)}M` : 
                          `$${(stats.ingresos / 1000).toFixed(0)}K`
                        ) : 
                        '$0';
                    })()
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Total vendido
                </div>
              </div>
              <button
                type="button"
                onClick={() => stats.pendientes > 0 && navigate('/cobranzas')}
                className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center w-full ${stats.pendientes > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`text-2xl font-semibold mb-1 ${textPri}`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    stats.pendientes
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Pendientes
                </div>
              </button>
              <div className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center`}>
                <div className={`text-2xl font-bold mb-1 ${
                  stats.crecimiento > 0 ? 'text-green-500' : 
                  stats.crecimiento < 0 ? 'text-red-500' : modoOscuro ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    stats.crecimiento > 0 ? `+${stats.crecimiento}%` : 
                    stats.crecimiento < 0 ? `${stats.crecimiento}%` : '0%'
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Crecimiento
                </div>
              </div>
              <div className={`${box} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 text-center`}>
                <div className={`text-2xl font-semibold mb-1 ${textPri}`}>
                  {loading ? (
                    <div className={`animate-pulse h-8 w-16 rounded mx-auto ${modoOscuro ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  ) : (
                    `${stats.eficiencia}%`
                  )}
                </div>
                <div className={`text-xs font-medium tracking-wide uppercase ${textMuted}`}>
                  Eficiencia (mes)
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto mb-6">
              <button
                type="button"
                onClick={() => navigate('/reportes')}
                className={`w-full rounded-2xl border p-5 text-left transition-shadow hover:shadow-md ${box}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className={`text-xs font-semibold tracking-wide uppercase ${textMuted}`}>Flujo de caja del mes</div>
                    <div className={`text-2xl sm:text-3xl font-semibold mt-1 ${flujoMes.flujoCaja >= 0 ? (modoOscuro ? 'text-green-300' : 'text-green-700') : (modoOscuro ? 'text-red-300' : 'text-red-700')}`}>
                      {isLoadingFlujoMes
                        ? 'Cargando…'
                        : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(flujoMes.flujoCaja || 0)
                      }
                    </div>
                    <div className={`text-xs mt-1 ${textMuted}`}>
                      Cobrado − Egresos ({flujoMes.desde || '—'} a {flujoMes.hasta || '—'})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-2 rounded-xl text-xs font-semibold ${modoOscuro ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                      Cobrado: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(flujoMes.ventasCobradas || 0)}
                    </span>
                    <span className={`px-3 py-2 rounded-xl text-xs font-semibold ${modoOscuro ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                      Egresos: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(flujoMes.egresosTotal || 0)}
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`group ${box} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border text-left relative overflow-hidden`}
                >
                  {action.badge && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#1f80ff] text-white">
                        {action.badge}
                      </span>
                    </div>
                  )}
                  
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white group-hover:bg-[#1f80ff] transition-colors ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                    {action.icon}
                  </div>
                  
                  <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>
                    {action.title}
                  </h3>
                  
                  <p className={`text-xs leading-relaxed mb-3 ${textSec}`}>
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-[#1f80ff] font-medium text-xs group-hover:text-[#004aad]">
                    Acceder
                    <FiArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className={modoOscuro ? 'py-16 bg-black' : 'py-16 bg-white/50'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Recent Activity & Insights */}
            <div className="xl:col-span-2 space-y-8">
            {/* Recent Activity */}
              <div className={`${boxSoft} rounded-2xl p-6 shadow-lg border`}>
              <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold flex items-center gap-3 ${textPri}`}>
                    <FiActivity className="w-6 h-6 text-[#1f80ff]" />
                    Actividad Reciente
                  </h2>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="text-[#1f80ff] hover:text-[#004aad] font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all disabled:opacity-50"
                    >
                      <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                    <button className="text-[#1f80ff] hover:text-[#004aad] font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                      Ver todo
                      <FiArrowRight className="w-4 h-4" />
                    </button>
              </div>
                </div>
                
                {error && (
                  <div className={modoOscuro ? 'bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4' : 'bg-red-50 border border-red-200 rounded-lg p-4 mb-4'}>
                    <p className={modoOscuro ? 'text-red-200 text-sm' : 'text-red-800 text-sm'}>{error}</p>
                  </div>
                )}
              
              <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity, index) => (
                  <div 
                    key={index}
                        className={`${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-4 border hover:shadow-md transition-all duration-300 cursor-pointer group`}
                  >
                    <div className="flex items-start gap-3">
                          <div className={`mt-1 group-hover:scale-110 transition-transform ${textPri}`}>
                        {React.cloneElement(activity.icon, { className: `w-5 h-5 ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}` })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${textPri}`}>{activity.action}</h4>
                              <div className="flex items-center gap-2">
                                {activity.amount && (
                                  <span className={modoOscuro ? 'text-sm font-semibold text-green-400 bg-green-900/40 px-2 py-1 rounded-full' : 'text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full'}>
                                    {activity.amount}
                                  </span>
                                )}
                          <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                            <FiClock className="w-3 h-3" />
                            {activity.time}
                          </span>
                              </div>
                        </div>
                        <p className={`text-sm ${textSec}`}>{activity.detail}</p>
                      </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${textMuted}`}>
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <FiRefreshCw className="w-5 h-5 animate-spin" />
                          Cargando actividades...
                        </div>
                      ) : (
                        <div>
                          <FiActivity className={`w-12 h-12 mx-auto mb-3 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
                          <p>No hay actividades recientes</p>
                          <p className="text-sm">Las actividades aparecerán aquí cuando realices acciones en el sistema</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Insights & Analytics */}
              <div className={`${boxSoft} rounded-2xl p-6 shadow-lg border`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${textPri}`}>
                  <FiTrendingUp className={`w-6 h-6 ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}`} />
                  Insights del Mes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {insights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`${box} rounded-xl p-5 border hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {React.cloneElement(insight.icon, { className: `w-6 h-6 ${modoOscuro ? 'text-gray-300' : 'text-gray-900'}` })}
                        <h3 className={`font-semibold ${textPri}`}>{insight.title}</h3>
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 ${textSec}`}>
                        {insight.description}
                      </p>
                      <div className={`text-lg font-bold ${insight.trendColor === 'text-gray-600' && modoOscuro ? 'text-gray-400' : insight.trendColor}`}>
                        {insight.trend}
                      </div>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Right Column - Tasks & Quick Tools */}
            <div className="space-y-8">
              {/* Upcoming Tasks */}
              <div className={`${boxSoft} rounded-2xl p-6 shadow-lg border`}>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${textPri}`}>
                  <FiTarget className="w-6 h-6 text-[#f59e0b]" />
                  Tareas Pendientes
                </h2>
              
              <div className="space-y-4">
                  {upcomingTasks.map((task, index) => (
                    <div 
                      key={index}
                      onClick={task.action}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group ${modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high'
                          ? modoOscuro ? 'bg-gray-300' : 'bg-gray-900'
                          : task.priority === 'medium'
                          ? 'bg-gray-500'
                          : modoOscuro ? 'bg-gray-600' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm ${textPri}`}>{task.title}</h4>
                        <p className={`text-xs ${textMuted}`}>Vence: {task.due}</p>
                      </div>
                      <div className={`${modoOscuro ? 'text-gray-500' : 'text-gray-400'} group-hover:text-[#1f80ff] transition-colors`}>
                        {task.icon}
                      </div>
                    </div>
                  ))}
                  </div>
                
                <button className="w-full mt-4 bg-[#1f80ff] text-white py-2 rounded-lg hover:bg-[#004aad] transition-colors font-medium text-sm">
                  Ver todas las tareas
                </button>
                </div>


              {/* Performance Card simplificada */}
              <div className={`${box} rounded-2xl p-6 border`}>
                <h3 className={`text-base font-semibold mb-2 ${textPri}`}>
                  Resumen rápido
                </h3>
                <p className={`text-sm mb-3 ${textSec}`}>
                  Eficiencia general de cobro este mes:
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-semibold ${textPri}`}>
                    {stats.eficiencia || 100}%
                  </span>
                  <span className={`text-xs ${textMuted}`}>
                    (ventas cobradas / totales)
                  </span>
                </div>
              </div>
          </div>
        </div>
      </div>
      </section>

      {/* Sin CTA extra al final para mantener la vista minimalista */}
    </div>
  );
};

export default Inicio;
