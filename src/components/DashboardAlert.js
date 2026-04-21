import React from 'react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const DashboardAlert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  modoOscuro = false,
  show = true 
}) => {
  if (!show) return null;

  const getAlertStyles = () => {
    const baseStyles = 'rounded-lg px-4 py-3 shadow-lg transition-all duration-300 flex items-start gap-3';
    
    switch (type) {
      case 'error':
        return `${baseStyles} ${
          modoOscuro 
            ? 'text-red-400 bg-red-900/50 border border-red-700' 
            : 'text-red-700 bg-red-50 border border-red-200'
        }`;
      case 'warning':
        return `${baseStyles} ${
          modoOscuro 
            ? 'text-yellow-400 bg-yellow-900/50 border border-yellow-700' 
            : 'text-yellow-700 bg-yellow-50 border border-yellow-200'
        }`;
      case 'success':
        return `${baseStyles} ${
          modoOscuro 
            ? 'text-green-400 bg-green-900/50 border border-green-700' 
            : 'text-green-700 bg-green-50 border border-green-200'
        }`;
      default:
        return `${baseStyles} ${
          modoOscuro 
            ? 'text-blue-400 bg-blue-900/50 border border-blue-700' 
            : 'text-blue-700 bg-blue-50 border border-blue-200'
        }`;
    }
  };

  const getIcon = () => {
    const iconClasses = 'h-5 w-5 flex-shrink-0 mt-0.5';
    
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className={`${iconClasses} text-red-500`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-500`} />;
      case 'success':
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />;
      default:
        return <InformationCircleIcon className={`${iconClasses} text-blue-500`} />;
    }
  };

  return (
    <div className={getAlertStyles()}>
      {getIcon()}
      
      <div className="flex-1">
        {title && (
          <h3 className="font-semibold mb-1">
            {title}
          </h3>
        )}
        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors duration-200 ${
            modoOscuro 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default DashboardAlert; 