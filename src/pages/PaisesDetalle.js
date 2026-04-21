import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, CurrencyDollarIcon, DocumentTextIcon, GlobeAltIcon, CalendarIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '../components/SkeletonLoader';
import { ThemeContext } from '../context/ThemeContext';

const PaisesDetalle = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);


  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total'); // total, cantidad
  const [sortOrder] = useState('desc'); // asc, desc
  const [filtroFecha, setFiltroFecha] = useState('mes');

  useEffect(() => {
    fetchPaises();
    // eslint-disable-next-line
  }, [token, filtroFecha]);

  const fetchPaises = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/invoices-dashboard/ingresos-por-pais?periodo=${filtroFecha}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar países');
      const data = await response.json();
      setPaises(data);
    } catch (err) {
      setError('Error al cargar la lista de países');
    } finally {
      setLoading(false);
    }
  };



  const filteredAndSortedPaises = paises
    .filter(pais =>
      (pais.pais || pais._id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'cantidad':
          aValue = a.cantidadFacturas || 0;
          bValue = b.cantidadFacturas || 0;
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

  const totalIngresos = filteredAndSortedPaises.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalPaises = filteredAndSortedPaises.length;
  const totalFacturas = filteredAndSortedPaises.reduce((sum, p) => sum + (p.cantidadFacturas || 0), 0);

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-white text-gray-900'}>
      <div className="w-full px-8 py-8">
        {/* Header moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-[#1F80FF] rounded-2xl flex items-center justify-center shadow-lg">
              <GlobeAltIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ingresos por País - Detalle
              </h1>
              <p className="text-gray-600">
                Analiza la distribución de ingresos por países y regiones
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#5CA3FF] rounded-xl flex items-center justify-center">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Países</p>
                <p className="text-2xl font-bold text-green-600">{totalPaises}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#1F80FF] rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-blue-600">{formatearMoneda(totalIngresos)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#004AAD] rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total ventas registradas</p>
                <p className="text-2xl font-bold text-purple-600">{totalFacturas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles y filtros */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Filtro de fecha */}
          <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            >
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="año">Último año</option>
            </select>
          </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                <option value="total">Ordenar por Ingresos</option>
                <option value="cantidad">Ordenar por Cantidad</option>
              </select>
        </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 w-full lg:w-64"
              />
            </div>
            </div>
          </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-semibold text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
          {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <SkeletonLoader width="w-16" height="h-16" circle />
                  <div className="flex-1 space-y-2">
                    <SkeletonLoader width="w-1/3" height="h-4" />
                    <SkeletonLoader width="w-1/4" height="h-3" />
                  </div>
                  <SkeletonLoader width="w-24" height="h-8" />
                  </div>
                </div>
            ))}
              </div>
        ) : (
          <>
            {/* Lista de países */}
            <div className="space-y-4">
                {filteredAndSortedPaises.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                  <GlobeAltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay países</h3>
                  <p className="text-gray-500">No se encontraron países que coincidan con los filtros aplicados</p>
                  </div>
                ) : (
                filteredAndSortedPaises.map((pais, index) => {
                  const porcentaje = totalIngresos > 0 ? (pais.total / totalIngresos) * 100 : 0;
                  
                  return (
                    <div key={pais.pais || pais._id || index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                        {/* Información del país */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#5CA3FF] rounded-xl flex items-center justify-center">
                            <GlobeAltIcon className="w-6 h-6 text-white" />
                            </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{pais.pais || pais._id}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <DocumentTextIcon className="w-4 h-4" />
                                {pais.cantidadFacturas || 0} facturas
                              </span>
                              <span className="flex items-center gap-1">
                                <ChartBarIcon className="w-4 h-4" />
                                {porcentaje.toFixed(1)}% del total
                              </span>
                              </div>
                            </div>
                          </div>

                        {/* Ingresos */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatearMoneda(pais.total)}
                          </div>
                          <div className="text-sm text-gray-500">Ingresos totales</div>
                          </div>
                        </div>
                      </div>
                  );
                })
                )}
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default PaisesDetalle; 