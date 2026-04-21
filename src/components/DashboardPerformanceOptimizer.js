import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useChartOptimization } from '../hooks/useChartOptimization';

// Componente para optimizar el rendimiento de listas largas
const VirtualizedList = React.memo(({ 
  items, 
  renderItem, 
  itemHeight = 60, 
  containerHeight = 400,
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {items.slice(visibleRange.start, visibleRange.end).map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Componente para optimizar el renderizado de gráficos
const OptimizedChart = React.memo(({ 
  data, 
  chartType, 
  options = {}, 
  onChartClick 
}) => {
  const chartRef = useRef(null);
  const { processedData, shouldRender, isOptimized } = useChartOptimization(data, {
    ...options,
    cacheKey: `chart-${chartType}`
  });

  const handleChartClick = useCallback((event) => {
    if (onChartClick && shouldRender()) {
      onChartClick(event);
    }
  }, [onChartClick, shouldRender]);

  // Solo renderizar si es necesario
  if (!shouldRender()) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        <div className="animate-pulse">Actualizando gráfico...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Indicador de optimización */}
      {isOptimized && (
        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          Optimizado
        </div>
      )}
      
      {/* Aquí iría tu gráfico real */}
      <div 
        ref={chartRef}
        className="w-full h-64 bg-white rounded-lg border border-gray-200 flex items-center justify-center"
        onClick={handleChartClick}
      >
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">
            Gráfico: {chartType}
          </div>
          <div className="text-sm text-gray-500">
            {processedData.length} puntos de datos
          </div>
          {isOptimized && (
            <div className="text-xs text-blue-600 mt-1">
              Rendimiento optimizado
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OptimizedChart.displayName = 'OptimizedChart';

// Componente principal de optimización
const DashboardPerformanceOptimizer = React.memo(({ 
  children, 
  enableVirtualization = true,
  enableChartOptimization = true,
  maxItems = 1000
}) => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    domNodes: 0
  });

  // Medir rendimiento
  useEffect(() => {
    const startTime = performance.now();
    
    const measurePerformance = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Medir uso de memoria (si está disponible)
      const memoryUsage = performance.memory ? 
        Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0;
      
      // Contar nodos DOM
      const domNodes = document.querySelectorAll('*').length;
      
      setPerformanceMetrics({
        renderTime: Math.round(renderTime),
        memoryUsage,
        domNodes
      });
      
      setIsOptimized(true);
    };

    // Medir después de que se complete el renderizado
    const timer = setTimeout(measurePerformance, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Indicador de rendimiento - Completamente oculto */}
      {false && process.env.NODE_ENV === 'development' && isOptimized && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full shadow-sm opacity-75 hover:opacity-100 transition-opacity">
          ⚡ {performanceMetrics.renderTime}ms
        </div>
      )}
      
      {/* Métricas de rendimiento - Completamente ocultas */}
      {false && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-gray-100 text-gray-700 text-xs p-2 rounded-lg shadow-sm opacity-75 hover:opacity-100 transition-opacity">
          <div>Render: {performanceMetrics.renderTime}ms</div>
          <div>Memoria: {performanceMetrics.memoryUsage}MB</div>
          <div>DOM: {performanceMetrics.domNodes}</div>
        </div>
      )}
      
      {/* Contenido del dashboard */}
      <div className={enableVirtualization ? 'virtualized-content' : ''}>
        {children}
      </div>
    </div>
  );
});

DashboardPerformanceOptimizer.displayName = 'DashboardPerformanceOptimizer';

export { 
  DashboardPerformanceOptimizer, 
  VirtualizedList, 
  OptimizedChart 
};
