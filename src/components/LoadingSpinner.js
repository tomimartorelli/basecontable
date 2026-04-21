import React from 'react';
import { FiLoader } from 'react-icons/fi';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  text = 'Cargando...',
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'text-[#1f80ff]',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <FiLoader className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin`} />
      {text && (
        <p className={`mt-3 text-sm font-medium ${variantClasses[variant]} text-center`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
