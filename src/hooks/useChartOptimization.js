import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Hook para optimizar el rendimiento de gráficos
export const useChartOptimization = (data, options = {}) => {
  const {
    debounceMs = 100,
    maxDataPoints = 1000,
    cacheKey = null
  } = options;

  const cacheRef = useRef(new Map());
  const lastRenderRef = useRef(0);

  // Memoización de datos procesados
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // Limitar puntos de datos para mejorar rendimiento
    if (data.length > maxDataPoints) {
      const step = Math.ceil(data.length / maxDataPoints);
      return data.filter((_, index) => index % step === 0);
    }
    
    return data;
  }, [data, maxDataPoints]);

  // Cache de datos procesados
  const getCachedData = useCallback((key) => {
    if (!cacheKey || !key) return null;
    const cached = cacheRef.current.get(`${cacheKey}-${key}`);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutos
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  const setCachedData = useCallback((key, data) => {
    if (!cacheKey || !key) return;
    cacheRef.current.set(`${cacheKey}-${key}`, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Throttling de re-renders
  const shouldRender = useCallback(() => {
    const now = Date.now();
    if (now - lastRenderRef.current < debounceMs) {
      return false;
    }
    lastRenderRef.current = now;
    return true;
  }, [debounceMs]);

  // Limpiar cache cuando se desmonta
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    processedData,
    getCachedData,
    setCachedData,
    shouldRender,
    dataLength: processedData.length,
    isOptimized: processedData.length < (data?.length || 0)
  };
};

// Hook para lazy loading de gráficos
export const useLazyChart = (chartType, dependencies = []) => {
  const [ChartComponent, setChartComponent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadChart = async () => {
      try {
        setLoading(true);
        
        // Simular carga diferida
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return;
        
        // Aquí cargarías el componente del gráfico
        // Por ejemplo: const Chart = await import(`../components/charts/${chartType}`);
        setChartComponent(() => () => <div>Chart: {chartType}</div>);
      } catch (error) {
        console.error('Error loading chart:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, ...dependencies]); // dependencies es un array dinámico, el spread es intencional

  return { ChartComponent, loading };
};

// Hook para optimizar el tamaño de los gráficos
export const useChartResize = (chartRef, options = {}) => {
  const { debounceMs = 250, minWidth = 300, minHeight = 200 } = options;
  const resizeTimeoutRef = useRef(null);

  const handleResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      if (chartRef.current) {
        const container = chartRef.current.parentElement;
        if (container) {
          const { width, height } = container.getBoundingClientRect();
          
          if (width >= minWidth && height >= minHeight) {
            // Trigger chart resize
            if (chartRef.current.resize) {
              chartRef.current.resize();
            }
          }
        }
      }
    }, debounceMs);
  }, [chartRef, debounceMs, minWidth, minHeight]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    
    if (chartRef.current?.parentElement) {
      resizeObserver.observe(chartRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize, chartRef]);

  return { handleResize };
};
