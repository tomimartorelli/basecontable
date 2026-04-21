import React, { useMemo, useCallback, useContext } from 'react';
import { 
  ExclamationTriangleIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ThemeContext } from '../context/ThemeContext';

// Componente memoizado para las tarjetas individuales
const StatCard = React.memo(({ card, onClick, modoOscuro }) => {
  const handleClick = useCallback(() => {
    onClick(card.id);
  }, [onClick, card.id]);

  const cardBox = modoOscuro ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50';
  const iconBorder = modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white';
  const titleColor = modoOscuro ? 'text-gray-300' : 'text-gray-500';
  const valueColor = modoOscuro ? 'text-white' : 'text-gray-900';
  const subtitleColor = modoOscuro ? 'text-gray-400' : 'text-gray-600';

  return (
    <div
      onClick={handleClick}
      className={`rounded-2xl p-4 border transition-colors cursor-pointer ${cardBox}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${iconBorder}`}>
          <card.icon className={modoOscuro ? 'h-5 w-5 text-white' : 'h-5 w-5 text-gray-900'} />
        </div>
        <div className={`text-[11px] font-medium uppercase tracking-wide ${titleColor}`}>
          {card.title}
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className={`text-xl font-semibold ${valueColor}`}>
          {card.value}
        </div>
        <div className={`text-xs ${subtitleColor}`}>
          {card.subtitle}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

const DashboardStats = React.memo(({ stats, loading, onCardClick }) => {
  const { modoOscuro } = useContext(ThemeContext);
  // Formateo de montos según moneda
  const formatCurrency = useCallback((amount, currency = 'ARS') => {
    if (!currency) currency = 'ARS';
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency
      }).format(amount || 0);
    } catch {
      // Fallback simple si la moneda no es válida
      return `${currency} ${(amount || 0).toLocaleString('es-AR')}`;
    }
  }, []);

  // Memoización de las tarjetas de estadísticas para evitar re-creaciones
  const statCards = useMemo(() => {
    const usedDocs = stats.resumen?.documentosMesUsuario || 0;
    const maxDocs = stats.resumen?.maxDocumentsPerMonth || null;
    const usagePercent = maxDocs ? Math.round((usedDocs / maxDocs) * 100) : null;

    const ingresosPorMoneda = stats.resumen?.totalesPorMoneda || [];
    const impagasPorMoneda = stats.impagas?.totalesPorMoneda || [];

    let ingresosValue = '—';
    let ingresosSubtitle = `${stats.resumen?.facturasMes || 0} registros del mes`;
    if (ingresosPorMoneda.length === 1) {
      const only = ingresosPorMoneda[0];
      ingresosValue = formatCurrency(only.total, only.moneda || 'ARS');
      ingresosSubtitle = `${only.moneda || 'ARS'} • ${stats.resumen?.facturasMes || 0} registros del mes`;
    } else if (ingresosPorMoneda.length > 1) {
      ingresosValue = ingresosPorMoneda
        .map(t => `${t.moneda || '—'} ${Number(t.total || 0).toLocaleString('es-AR')}`)
        .join(' • ');
      ingresosSubtitle = `${stats.resumen?.facturasMes || 0} registros del mes, múltiples monedas`;
    } else if ((stats.resumen?.totalIngresos || 0) > 0) {
      // Fallback: si aún no hay totalesPorMoneda (datos antiguos), usar totalIngresos
      ingresosValue = formatCurrency(stats.resumen.totalIngresos || 0, 'ARS');
      ingresosSubtitle = `${stats.resumen?.facturasMes || 0} registros del mes (moneda principal)`;
    }

    let impagasSubtitle = '';
    if (impagasPorMoneda && impagasPorMoneda.length > 0) {
      impagasSubtitle = impagasPorMoneda
        .map(t => `${t.moneda || '—'} ${Number(t.total || 0).toLocaleString('es-AR')}`)
        .join(' • ');
    } else {
      impagasSubtitle = formatCurrency(stats.impagas?.monto || 0);
    }

    return [
      {
        id: 'impagas',
        title: 'Registros impagos',
        value: stats.impagas?.cantidad || 0,
        subtitle: impagasSubtitle,
        icon: ExclamationTriangleIcon
      },
      {
        id: 'clientes',
        title: 'Clientes únicos',
        value: stats.resumen?.clientesUnicos || 0,
        subtitle: `${stats.resumen?.totalFacturas || 0} registros totales`,
        icon: UserGroupIcon
      },
      {
        id: 'ingresos',
        title: 'Ingresos totales',
        value: ingresosValue,
        subtitle: ingresosSubtitle,
        icon: CurrencyDollarIcon
      },
      {
        id: 'uso-plan',
        title: 'Uso de plan',
        value: maxDocs ? `${usedDocs} / ${maxDocs}` : usedDocs,
        subtitle: maxDocs && usagePercent !== null
          ? `${usagePercent}% del límite mensual`
          : 'Volumen mensual de registros',
        icon: DocumentTextIcon
      }
    ];
  }, [stats, formatCurrency]);

  // Memoización del handler de click
  const handleCardClick = useCallback((cardId) => {
    onCardClick(cardId);
  }, [onCardClick]);

  // Loading state optimizado
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`rounded-xl shadow-lg p-6 border animate-pulse ${
              modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
            }`}
          >
            <div className={modoOscuro ? 'w-12 h-12 bg-gray-700 rounded-lg mb-4' : 'w-12 h-12 bg-gray-200 rounded-lg mb-4'}></div>
            <div className={modoOscuro ? 'h-6 bg-gray-700 rounded mb-2' : 'h-6 bg-gray-200 rounded mb-2'}></div>
            <div className={modoOscuro ? 'h-8 bg-gray-700 rounded mb-2' : 'h-8 bg-gray-200 rounded mb-2'}></div>
            <div className={modoOscuro ? 'h-4 bg-gray-700 rounded' : 'h-4 bg-gray-200 rounded'}></div>
          </div>
        ))}
      </div>
    );
  }

  // Estado cuando no hay datos
  const hasData = stats.resumen?.totalFacturas > 0 || stats.resumen?.totalIngresos > 0;
  
  if (!hasData && !loading) {
    return (
      <div className="mb-8">
        <div className={`rounded-xl shadow-lg p-8 border text-center ${
          modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            modoOscuro ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <svg className={modoOscuro ? 'w-8 h-8 text-gray-300' : 'w-8 h-8 text-gray-400'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>No hay datos disponibles</h3>
          <p className={`mb-4 ${modoOscuro ? 'text-gray-300' : 'text-gray-600'}`}>
            El dashboard mostrará métricas cuando se registren ventas y clientes en el sistema.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/facturas'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Registro de ventas
            </button>
            <button
              onClick={() => window.location.href = '/clientes'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ir a Clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si los datos parecen reales o son placeholder
  const hasRealData = stats.resumen?.totalFacturas > 0 || 
                     stats.resumen?.totalIngresos > 0 || 
                     stats.impagas?.cantidad > 0;
  
  // Mostrar advertencia si no hay datos reales pero se muestran valores
  if (!hasRealData && !loading) {
    return (
      <div className="mb-8">
        <div className={`rounded-xl shadow-lg p-8 text-center border ${
          modoOscuro ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            modoOscuro ? 'bg-yellow-900/40' : 'bg-yellow-100'
          }`}>
            <svg className={modoOscuro ? 'w-8 h-8 text-yellow-300' : 'w-8 h-8 text-yellow-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${modoOscuro ? 'text-yellow-200' : 'text-yellow-800'}`}>Datos no disponibles</h3>
          <p className={`mb-4 ${modoOscuro ? 'text-yellow-100' : 'text-yellow-700'}`}>
            No se encontraron registros de venta ni clientes en el sistema. 
            <br />
            <strong>Los valores mostrados pueden ser datos de prueba o cache antiguo.</strong>
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Recargar Página
            </button>
            <button
              onClick={() => window.location.href = '/facturas'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Registro de ventas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card) => (
        <StatCard 
          key={card.id} 
          card={card} 
          onClick={handleCardClick}
          modoOscuro={modoOscuro}
        />
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';

export default DashboardStats; 