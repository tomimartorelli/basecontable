import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { ArrowLeftIcon, UserGroupIcon, CurrencyDollarIcon, ChartBarIcon, CalendarIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '../components/SkeletonLoader';

const DistribucionClientesDetalle = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();


  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total'); // total, porcentaje
  const [sortOrder] = useState('desc'); // asc, desc
  const [filtroFecha, setFiltroFecha] = useState('mes');

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line
  }, [token, filtroFecha]);

  const fetchClientes = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await secureFetch(`/api/invoices-dashboard/top-clientes?periodo=${filtroFecha}&limit=100`);
      if (!res.ok) throw new Error('Error al cargar clientes');
      const data = await res.json();
      setClientes(data);
    } catch (err) {
      setError('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  const totalMonto = clientes.reduce((sum, c) => sum + (c.total || 0), 0);



  const filteredAndSortedClientes = clientes
    .filter(cliente =>
      (cliente.cliente || cliente._id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(cliente => ({
      ...cliente,
      porcentaje: totalMonto > 0 ? (cliente.total / totalMonto) * 100 : 0
    }))
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'porcentaje':
          aValue = a.porcentaje || 0;
          bValue = b.porcentaje || 0;
          break;
        case 'cantidadTrabajos':
          aValue = a.cantidadTrabajos || 0;
          bValue = b.cantidadTrabajos || 0;
          break;
        case 'antiguedad':
          aValue = a.antiguedad ? new Date(a.antiguedad) : new Date(0);
          bValue = b.antiguedad ? new Date(b.antiguedad) : new Date(0);
          break;
        case 'ultimoTrabajo':
          aValue = a.ultimoTrabajo ? new Date(a.ultimoTrabajo) : new Date(0);
          bValue = b.ultimoTrabajo ? new Date(b.ultimoTrabajo) : new Date(0);
          break;
        default:
          aValue = a.total || 0;
          bValue = b.total || 0;
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalClientes = filteredAndSortedClientes.length;
  const promedioPorCliente = totalClientes > 0 ? totalMonto / totalClientes : 0;

  // Colores adaptados al modo oscuro
  const bgCard = modoOscuro ? 'bg-[#1a1a1a]' : 'bg-white';
  const textPrimary = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSecondary = modoOscuro ? 'text-gray-400' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-500' : 'text-gray-500';
  const borderColor = modoOscuro ? 'border-gray-800' : 'border-gray-200';
  const inputBg = modoOscuro ? 'bg-[#252525] border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900';
  const inputFocus = modoOscuro ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-[#1F80FF] focus:border-[#1F80FF]';
  const hoverCard = modoOscuro ? 'hover:bg-[#252525]' : 'hover:shadow-lg';

  return (
    <div className={`${textPrimary} transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header compacto */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-lg ${modoOscuro ? 'bg-[#252525] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-all duration-200`}
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-[#1F80FF] to-[#004AAD]`}>
              <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Distribución de Clientes</h1>
              <p className={`${textSecondary} text-xs sm:text-sm`}>Analiza la distribución y rendimiento</p>
            </div>
          </div>
        </div>

        {/* Resumen de métricas - Compacto */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className={`${bgCard} rounded-xl p-3 sm:p-4 shadow-sm ${borderColor} border`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#1F80FF] to-[#5CA3FF] flex items-center justify-center shadow">
                <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className={`${textMuted} text-[10px] sm:text-xs`}>Clientes</p>
                <p className="text-lg sm:text-xl font-bold text-[#1F80FF]">{totalClientes}</p>
              </div>
            </div>
          </div>
          
          <div className={`${bgCard} rounded-xl p-3 sm:p-4 shadow-sm ${borderColor} border`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow">
                <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className={`${textMuted} text-[10px] sm:text-xs`}>Ingresos</p>
                <p className="text-sm sm:text-lg font-bold text-emerald-500">{formatearMoneda(totalMonto)}</p>
              </div>
            </div>
          </div>
          
          <div className={`${bgCard} rounded-xl p-3 sm:p-4 shadow-sm ${borderColor} border`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
                <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className={`${textMuted} text-[10px] sm:text-xs`}>Promedio</p>
                <p className="text-sm sm:text-lg font-bold text-violet-500">{formatearMoneda(promedioPorCliente)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles compactos */}
        <div className={`${bgCard} rounded-xl p-3 sm:p-4 shadow-sm ${borderColor} border mb-4 sm:mb-6`}>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <CalendarIcon className={`h-4 w-4 ${textMuted}`} />
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg border ${inputBg} ${inputFocus} text-xs sm:text-sm`}
              >
                <option value="semana">Última semana</option>
                <option value="mes">Último mes</option>
                <option value="trimestre">Trimestre</option>
                <option value="año">Año</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <ChartBarIcon className={`h-4 w-4 ${textMuted}`} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg border ${inputBg} ${inputFocus} text-xs sm:text-sm`}
              >
                <option value="total">Por Ingresos</option>
                <option value="porcentaje">Por Porcentaje</option>
                <option value="cantidadTrabajos">Por Trabajos</option>
                <option value="antiguedad">Por Antigüedad</option>
                <option value="ultimoTrabajo">Por Último Trabajo</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <MagnifyingGlassIcon className={`h-4 w-4 ${textMuted}`} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-1 sm:w-40 px-2 py-1.5 rounded-lg border ${inputBg} ${inputFocus} text-xs sm:text-sm`}
              />
            </div>
          </div>
        </div>

        {/* Mensaje de error compacto */}
        {error && (
          <div className={`mb-4 ${modoOscuro ? 'bg-red-900/20 border-red-500/50' : 'bg-red-50 border-red-400'} border-l-4 rounded-lg p-3 shadow-sm`}>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className={`w-4 h-4 ${modoOscuro ? 'text-red-400' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${modoOscuro ? 'text-red-300' : 'text-red-800'}`}>{error}</span>
            </div>
          </div>
        )}

        {/* Loading compacto */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${bgCard} rounded-xl p-3 shadow-sm ${borderColor} border`}>
                <div className="flex items-center gap-3">
                  <SkeletonLoader width="w-10" height="h-10" circle />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonLoader width="w-1/3" height="h-3" />
                    <SkeletonLoader width="w-1/4" height="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Lista de clientes compacta */}
            <div className="space-y-2">
              {filteredAndSortedClientes.length === 0 ? (
                <div className={`${bgCard} rounded-xl p-6 shadow-sm ${borderColor} border text-center`}>
                  <UserGroupIcon className={`w-12 h-12 mx-auto mb-2 ${textMuted}`} />
                  <h3 className={`text-base font-medium ${textPrimary}`}>No hay clientes</h3>
                  <p className={`text-sm ${textMuted}`}>No se encontraron resultados</p>
                </div>
              ) : (
                filteredAndSortedClientes.map((cliente, index) => (
                  <div 
                    key={cliente._id || index} 
                    className={`${bgCard} rounded-xl p-3 shadow-sm ${borderColor} border ${hoverCard} transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1F80FF] to-[#004AAD] flex items-center justify-center shadow flex-shrink-0">
                        <UserGroupIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm ${textPrimary} truncate`}>
                          {cliente.cliente || cliente._id}
                        </h3>
                        <div className={`flex items-center gap-3 text-xs ${textMuted}`}>
                          <span>{cliente.cantidadTrabajos || 0} trabajos</span>
                          <span>{formatearFecha(cliente.antiguedad)}</span>
                          <span>{cliente.porcentaje.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-[#1F80FF]">
                          {formatearMoneda(cliente.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DistribucionClientesDetalle; 