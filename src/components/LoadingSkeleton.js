import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const LoadingSkeleton = ({ 
  type = 'card', 
  count = 1, 
  className = '' 
}) => {
  const { modoOscuro } = useContext(ThemeContext);
  const cardBg = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100';
  const barBg = modoOscuro ? 'bg-gray-700' : 'bg-gray-200';
  const borderCl = modoOscuro ? 'border-gray-700' : 'border-gray-100';

  const CardSkeleton = () => (
    <div className={`rounded-xl p-6 shadow-sm border animate-pulse ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`h-6 ${barBg} rounded w-24`}></div>
        <div className={`h-4 ${barBg} rounded w-16`}></div>
      </div>
      <div className="space-y-3">
        <div className={`h-8 ${barBg} rounded w-32`}></div>
        <div className={`h-4 ${barBg} rounded w-20`}></div>
      </div>
    </div>
  );

  const TableRowSkeleton = () => (
    <div className="animate-pulse">
      <div className={`flex items-center space-x-4 py-4 border-b ${borderCl}`}>
        <div className={`h-10 w-10 ${barBg} rounded-full`}></div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${barBg} rounded w-24`}></div>
          <div className={`h-3 ${barBg} rounded w-32`}></div>
        </div>
        <div className={`h-8 ${barBg} rounded w-20`}></div>
        <div className={`h-8 ${barBg} rounded w-16`}></div>
      </div>
    </div>
  );

  const MetricCardSkeleton = () => (
    <div className={`rounded-xl p-6 shadow-sm border animate-pulse ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`h-8 w-8 ${barBg} rounded-lg`}></div>
        <div className={`h-4 ${barBg} rounded w-16`}></div>
      </div>
      <div className="space-y-2">
        <div className={`h-8 ${barBg} rounded w-20`}></div>
        <div className={`h-4 ${barBg} rounded w-24`}></div>
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className={`rounded-xl p-6 shadow-sm border animate-pulse ${cardBg}`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`h-6 ${barBg} rounded w-32`}></div>
        <div className={`h-4 ${barBg} rounded w-16`}></div>
      </div>
      <div className={`h-64 ${barBg} rounded-lg`}></div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />;
      case 'tableRow':
        return <TableRowSkeleton />;
      case 'metricCard':
        return <MetricCardSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  if (count === 1) {
    return <div className={className}>{renderSkeleton()}</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
