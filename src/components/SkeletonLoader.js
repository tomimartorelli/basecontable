import React from "react";

/**
 * Componente SkeletonLoader
 * Props:
 * - width: ancho (ej: 'w-32', 'w-full')
 * - height: alto (ej: 'h-4', 'h-8')
 * - circle: boolean, si es true renderiza un círculo
 * - lines: número de líneas (para listas o párrafos)
 * - className: clases extra
 * - style: estilos inline opcionales
 */
const SkeletonLoader = ({
  width = "w-full",
  height = "h-4",
  circle = false,
  lines = 1,
  className = "",
  style = {},
}) => {
  // Renderiza múltiples líneas si lines > 1
  if (lines > 1) {
    return (
      <div className={className} style={style}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${width} h-4 mb-2 last:mb-0`}
          />
        ))}
      </div>
    );
  }

  // Renderiza círculo (avatar)
  if (circle) {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full ${width} ${height} ${className}`}
        style={style}
      />
    );
  }

  // Rectángulo simple
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${width} ${height} ${className}`}
      style={style}
    />
  );
};

export default SkeletonLoader; 