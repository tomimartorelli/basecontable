import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import useDashboardPermissions from '../hooks/useDashboardPermissions';
import { 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import PlanIndicator from '../components/PlanIndicator';
import DashboardStats from '../components/DashboardStats';
import DashboardRestriction from '../components/DashboardRestriction';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Aurora from '../components/Aurora/Aurora';
import { DashboardPerformanceOptimizer } from '../components/DashboardPerformanceOptimizer';
import { ThemeContext } from '../context/ThemeContext';

// Lazy loading de componentes pesados
const LazyDashboardCharts = React.lazy(() => import('../components/DashboardCharts'));

// Hook personalizado para debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Hook personalizado para cache de datos
const useDataCache = (key, data, ttl = 5 * 60 * 1000) => {
  const cacheRef = useRef(new Map());
  
  const getCachedData = useCallback(() => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [key, ttl]);
  
  const setCachedData = useCallback((newData) => {
    cacheRef.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, [key]);
  
  return { getCachedData, setCachedData };
};

const Dashboard = () => {
  const { token, user } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  // Log simple para verificar que el Dashboard se está ejecutando - Solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Dashboard: Componente ejecutándose', {
      user: !!user,
      userEmail: user?.email,
      userPlan: user?.currentPlan?.name
    });
  }
  
  const {
    canAccessDashboard,
    canViewCharts,
    canExportData,
    loading: permissionsLoading
  } = useDashboardPermissions();
  
  const [stats, setStats] = useState({
    topClientes: [],
    impagas: { cantidad: 0, monto: 0 },
    ingresosPais: [],
    resumen: {
      totalFacturas: 0,
      totalIngresos: 0,
      facturasMes: 0,
      clientesUnicos: 0,
      empresas: 0
    }
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtroFecha] = useState('mes');
  
  // Flag para evitar múltiples ejecuciones simultáneas
  const [isFetching, setIsFetching] = useState(false);
  const fetchInProgress = useRef(false);
  
  // Flag para controlar si se debe hacer fetch automático
  const [shouldAutoFetch] = useState(true);
  const lastFetchTime = useRef(null);
  const { secureFetch } = useApi();

  // Cache de datos para evitar re-fetch innecesarios - Específico por usuario
  const userId = user?.id || user?._id;
  const empresaId = user?.empresaId || user?.empresa?.id;
  const cacheKey = `dashboard-${userId || empresaId}-${filtroFecha}`;
  const { getCachedData, setCachedData } = useDataCache(cacheKey, stats);

  // Tema unificado similar a Clientes
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';

  // Debouncing del filtro de fecha para evitar múltiples requests
  const debouncedFiltroFecha = useDebounce(filtroFecha, 1000);
  
  // Memoización de permisos para evitar re-cálculos
  const dashboardAccess = useMemo(() => ({
    canAccess: canAccessDashboard(),
    canViewCharts: canViewCharts(),
    canExport: canExportData()
  }), [canAccessDashboard, canViewCharts, canExportData]);

  // Verificar si el usuario puede acceder al dashboard
  useEffect(() => {
    if (!permissionsLoading && !dashboardAccess.canAccess) {
      navigate('/planes');
      return;
    }
  }, [permissionsLoading, dashboardAccess.canAccess, navigate]);

  // Función para cargar datos del dashboard con cache
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 Dashboard: No hay token, no se puede hacer fetch');
      }
      return;
    }
    
    // EVITAR MÚLTIPLES EJECUCIONES SIMULTÁNEAS
    if (fetchInProgress.current && !forceRefresh) {
      console.log('🚫 Dashboard: Fetch ya en progreso, ignorando llamada...');
      return;
    }
    
    if (isFetching && !forceRefresh) {
      console.log('🚫 Dashboard: Ya se está cargando, ignorando llamada...');
      return;
    }
    
    // Marcar como en progreso
    fetchInProgress.current = true;
    setIsFetching(true);
    
    // Verificar cache primero
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Dashboard: Usando datos del cache');
        }
        setStats(cachedData);
        setLoading(false);
        setIsFetching(false);
        fetchInProgress.current = false;
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Obtener ID del usuario para filtrar datos
      const userId = user?.id || user?._id;
      const empresaId = user?.empresaId || user?.empresa?.id;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dashboard: Usuario actual:', {
          user: user?.email,
          userId,
          empresaId,
          userObject: user
        });
      }
      
      if (!userId) {
        throw new Error('No se pudo identificar al usuario');
      }
      
      // Construir URLs con filtros de usuario para evitar datos globales
      const topClientesUrl = `/api/invoices-dashboard/top-clientes?periodo=${debouncedFiltroFecha}&userId=${userId}`;
      const impagasUrl = `/api/invoices-dashboard/impagas?periodo=${debouncedFiltroFecha}&userId=${userId}`;
      const ingresosPaisUrl = `/api/invoices-dashboard/ingresos-por-pais?periodo=${debouncedFiltroFecha}&userId=${userId}`;
      const resumenUrl = `/api/invoices-dashboard/resumen?userId=${userId}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dashboard: URLs de API con filtros de usuario:', {
          topClientes: topClientesUrl,
          impagas: impagasUrl,
          ingresosPais: ingresosPaisUrl,
          resumen: resumenUrl
        });
      }
      
      // Hacer las llamadas a la API
      const [topClientesRes, impagasRes, ingresosPaisRes, resumenRes] = await Promise.all([
        secureFetch(topClientesUrl),
        secureFetch(impagasUrl),
        secureFetch(ingresosPaisUrl),
        secureFetch(resumenUrl)
      ]);
      
      // Verificar que todas las respuestas sean exitosas
      if (!topClientesRes.ok || !impagasRes.ok || !ingresosPaisRes.ok || !resumenRes.ok) {
        const errors = {
          topClientes: topClientesRes.status,
          impagas: impagasRes.status,
          ingresosPais: ingresosPaisRes.status,
          resumen: resumenRes.status
        };
        console.error('❌ Dashboard: Error en respuestas:', errors);
        throw new Error(`Error en la respuesta del servidor: ${JSON.stringify(errors)}`);
      }
      
      // Obtener los datos
      const [topClientesData, impagasData, ingresosPaisData, resumenData] = await Promise.all([
        topClientesRes.json(),
        impagasRes.json(),
        ingresosPaisRes.json(),
        resumenRes.json()
      ]);
      
      // Log de datos para debug
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dashboard: Datos recibidos de la API:', {
          topClientes: topClientesData,
          impagas: impagasData,
          ingresosPais: ingresosPaisData,
          resumen: resumenData
        });
      }
      
      // Preparar los datos para el estado (los endpoints de backend ya filtran por usuario)
      const newStats = {
        topClientes: topClientesData || [],
        impagas: impagasData || { cantidad: 0, monto: 0 },
        ingresosPais: ingresosPaisData || [],
        resumen: resumenData || {
          totalFacturas: 0,
          totalIngresos: 0,
          facturasMes: 0,
          clientesUnicos: 0,
          empresas: 0
        }
      };
      
      // Validar y convertir tipos de datos
      const validatedStats = {
        ...newStats,
        resumen: {
          totalFacturas: parseInt(newStats.resumen?.totalFacturas) || 0,
          totalIngresos: parseFloat(newStats.resumen?.totalIngresos) || 0,
          facturasMes: parseInt(newStats.resumen?.facturasMes) || 0,
          clientesUnicos: parseInt(newStats.resumen?.clientesUnicos) || 0,
          empresas: parseInt(newStats.resumen?.empresas) || 0,
          documentosMesUsuario: parseInt(newStats.resumen?.documentosMesUsuario) || 0,
          maxDocumentsPerMonth: parseInt(newStats.resumen?.maxDocumentsPerMonth) || null
        },
        impagas: {
          cantidad: parseInt(newStats.impagas?.cantidad) || 0,
          monto: parseFloat(newStats.impagas?.monto) || 0
        },
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Dashboard: Datos validados y guardados:', validatedStats);
      }
      
      // Actualizar el estado
      setStats(validatedStats);
      setCachedData(validatedStats); // Guardar en cache
      
      // Limpiar errores previos
      setError('');
      
      // Mostrar mensaje de éxito
      if (validatedStats.resumen.totalFacturas === 0) {
        setSuccess('✅ Dashboard cargado: No hay registros de venta aún');
      } else {
        setSuccess('✅ Dashboard cargado correctamente con datos del usuario');
      }
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Dashboard: Error al cargar datos:', error);
      setError(`Error al cargar datos: ${error.message}`);
      
      // En caso de error, mostrar datos vacíos
      const emptyStats = {
        topClientes: [],
        impagas: { cantidad: 0, monto: 0 },
        ingresosPais: [],
        resumen: {
          totalFacturas: 0,
          totalIngresos: 0,
          facturasMes: 0,
          clientesUnicos: 0,
          empresas: 0
        }
      };
      
      setStats(emptyStats);
    } finally {
      setLoading(false);
      setIsFetching(false);
      fetchInProgress.current = false;
    }
  }, [token, user, debouncedFiltroFecha, secureFetch, getCachedData, setCachedData, isFetching]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (dashboardAccess.canAccess && !permissionsLoading && shouldAutoFetch) {
      // Solo hacer fetch si han pasado al menos 5 segundos desde el último
      const now = Date.now();
      if (!lastFetchTime.current || (now - lastFetchTime.current) > 5000) {
        console.log('🔄 Dashboard: Ejecutando fetch automático...');
        lastFetchTime.current = now;
        fetchData();
      }
    }
  }, [dashboardAccess.canAccess, permissionsLoading, shouldAutoFetch, fetchData]);

  const handleCardClick = useCallback((type) => {
    switch (type) {
      case 'impagas':
        navigate('/cobranzas');
        break;
      case 'clientes':
        navigate('/clientes-detalle');
        break;
      case 'ingresos':
        navigate('/facturas');
        break;
      case 'paises':
        navigate('/paises-detalle');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleChartClick = useCallback((type) => {
    switch (type) {
      case 'clientes':
        navigate('/distribucion-clientes-detalle');
        break;
      default:
        break;
    }
  }, [navigate]);

  // Mostrar loading inicial mientras se verifican permisos o se cargan datos
  if (permissionsLoading || (loading && !stats.resumen.totalFacturas)) {
    return (
      <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-white text-gray-900'}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header con título */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${textPri}`}>Dashboard</h1>
              <p className={modoOscuro ? 'text-gray-400' : 'text-gray-600'}>Cargando métricas y estadísticas...</p>
            </div>
            
            {/* Esqueletos de carga para las métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <LoadingSkeleton type="metricCard" />
              <LoadingSkeleton type="metricCard" />
              <LoadingSkeleton type="metricCard" />
              <LoadingSkeleton type="metricCard" />
            </div>
            
            {/* Esqueletos de carga para los gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton type="chart" />
              <LoadingSkeleton type="chart" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <DashboardPerformanceOptimizer enableVirtualization={true} enableChartOptimization={true}>
      <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          
          {/* Hero Section con Aurora */}
          <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-8">
            <Aurora
              colorStops={["#7cff67","#B19EEF","#5227FF"]}
              blend={0.5}
              amplitude={1.0}
              speed={1}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
                Bienvenido, {user?.name || 'Usuario'}
              </h1>
              <p className="mt-3 text-lg md:text-xl text-white/90 text-center max-w-2xl drop-shadow-md">
                Gestiona tu negocio con inteligencia y estilo
              </p>
            </div>
          </div>

        {/* Header moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <ChartBarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textPri}`}>
                Dashboard de Métricas
              </h1>
              <p className={`text-sm ${textSec}`}>
                {user ? `Bienvenido, ${user.name}. ` : ''}Resumen de desempeño de tu negocio y tus clientes.
              </p>
              {!loading && stats.resumen?.totalFacturas === 0 && (
                <div className={`mt-3 p-3 rounded-lg border ${modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                    <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Registrá tus primeras ventas para empezar a ver métricas aquí.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del Plan del Usuario */}
        <div className="mb-5">
          <div className={`rounded-2xl border p-3 sm:p-4 ${box}`}>
            <PlanIndicator 
              showFeatures={true}
              onUpgradeClick={() => navigate('/planes')}
            />
          </div>
        </div>

        
        {/* Mensajes compactos */}
        {(error || success) && (
          <div className="mb-4 space-y-2">
            {error && (
              <div className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 border ${
                modoOscuro ? 'bg-red-900/30 border-red-600 text-red-100' : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}>
                <ExclamationTriangleIcon className={`w-4 h-4 ${modoOscuro ? 'text-red-300' : 'text-gray-600'}`} />
                <span className="truncate">{error}</span>
              </div>
            )}
            {success && (
              <div className={`rounded-lg px-3 py-2 text-xs border ${
                modoOscuro ? 'bg-green-900/30 border-green-600 text-green-100' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                {success}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Stats */}
        <DashboardStats 
          stats={stats}
          loading={loading}
          onCardClick={handleCardClick}
        />

        {/* Dashboard Charts - Solo si tiene permisos - Con lazy loading */}
        <DashboardRestriction feature="canViewCharts" isDashboardFeature={true}>
          <React.Suspense fallback={<LoadingSkeleton type="chart" />}>
            <LazyDashboardCharts 
              topClientes={stats.topClientes}
              ingresosPais={stats.ingresosPais}
              loading={loading}
              onChartClick={handleChartClick}
            />
          </React.Suspense>
        </DashboardRestriction>

        </div>
      </div>
    </DashboardPerformanceOptimizer>
  );
};

export default React.memo(Dashboard); 