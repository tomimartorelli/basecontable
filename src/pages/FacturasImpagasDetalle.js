import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon, CurrencyDollarIcon, CalendarIcon, ExclamationTriangleIcon, DocumentTextIcon, UserIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '../components/SkeletonLoader';
import { ThemeContext } from '../context/ThemeContext';

const FacturasImpagasDetalle = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);


  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('fechaVencimiento'); // fechaVencimiento, monto, cliente
  const [sortOrder] = useState('asc'); // asc, desc
  const [filtroFecha, setFiltroFecha] = useState('mes');
  const [filtroEstado, setFiltroEstado] = useState('todas'); // todas, vencidas, proximas

  useEffect(() => {
    fetchFacturasImpagas();
    // eslint-disable-next-line
  }, [token, filtroFecha]);

  const fetchFacturasImpagas = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/invoices-dashboard/facturas-impagas-detalle?periodo=${filtroFecha}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar ventas impagas');
      const data = await response.json();
      console.log('Facturas (ventas) recibidas del backend:', data); // Debug
      setFacturas(data);
    } catch (err) {
      setError('Error al cargar la lista de ventas impagas');
    } finally {
      setLoading(false);
    }
  };



  const getDiasVencimiento = (fecha) => {
    if (!fecha) return 0;
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diffTime = vencimiento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEstadoFactura = (fecha) => {
    const dias = getDiasVencimiento(fecha);
    if (dias < 0) return { estado: 'vencida', color: 'red', texto: `${Math.abs(dias)} días vencida` };
    if (dias <= 7) return { estado: 'proxima', color: 'yellow', texto: `${dias} días para vencer` };
    return { estado: 'normal', color: 'green', texto: `${dias} días para vencer` };
  };

  const filteredAndSortedFacturas = facturas
    .filter(factura => {
      const matchesSearch = (factura.razonSocial && factura.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           factura.numero.toString().includes(searchTerm);
      
      if (filtroEstado === 'todas') return matchesSearch;
      
      const estado = getEstadoFactura(factura.fecha);
      if (filtroEstado === 'vencidas') return matchesSearch && estado.estado === 'vencida';
      if (filtroEstado === 'proximas') return matchesSearch && estado.estado === 'proxima';
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'fechaVencimiento':
          aValue = new Date(a.fecha || 0);
          bValue = new Date(b.fecha || 0);
          break;
        case 'monto':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'cliente':
          aValue = a.razonSocial || '';
          bValue = b.razonSocial || '';
          break;
        default:
          aValue = new Date(a.fecha || 0);
          bValue = new Date(b.fecha || 0);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatearMoneda = (monto, moneda = 'ARS') => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: moneda || 'ARS'
      }).format(monto || 0);
    } catch {
      return `${moneda || 'ARS'} ${(monto || 0).toLocaleString('es-AR')}`;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalImpagas = filteredAndSortedFacturas.reduce((sum, f) => sum + (f.total || 0), 0);
  const cantidadImpagas = filteredAndSortedFacturas.length;

  const containerClass = modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gray-50 text-gray-900';
  const cardClass = modoOscuro ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-100';
  const accentText = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const subtleText = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'px-4 py-2 rounded-xl border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200'
    : 'px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200';
  const selectClass = inputClass;
  const backButtonClass = modoOscuro
    ? 'p-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200'
    : 'p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200';

  return (
    <div className={containerClass}>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header moderno */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className={backButtonClass}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-[#1F80FF] rounded-2xl flex items-center justify-center shadow-lg">
              <ExclamationTriangleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>
                Ventas impagas - Detalle
              </h1>
              <p className={subtleText}>
                Gestioná y monitoreá las ventas pendientes de cobro
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-2xl p-6 shadow-lg ${cardClass}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#1F80FF] rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-sm ${accentText}`}>Ventas pendientes</p>
                <p className="text-2xl font-bold text-red-500">{cantidadImpagas}</p>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl p-6 shadow-lg ${cardClass}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#5CA3FF] rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-sm ${accentText}`}>Monto Total</p>
                <p className="text-2xl font-bold text-yellow-400">{formatearMoneda(totalImpagas)}</p>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl p-6 shadow-lg ${cardClass}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#004AAD] rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-sm ${accentText}`}>Período</p>
                <p className="text-2xl font-bold text-blue-400 capitalize">{filtroFecha}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles y filtros */}
        <div className={`rounded-2xl p-6 shadow-lg mb-8 ${cardClass}`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Filtro de fecha */}
            <div className="flex items-center gap-2">
              <CalendarIcon className={`h-5 w-5 ${subtleText}`} />
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className={selectClass}
              >
                <option value="semana">Última semana</option>
                <option value="mes">Último mes</option>
                <option value="trimestre">Último trimestre</option>
                <option value="año">Último año</option>
              </select>
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <FunnelIcon className={`h-5 w-5 ${subtleText}`} />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className={selectClass}
              >
                <option value="todas">Todas las impagas</option>
                <option value="vencidas">Solo vencidas</option>
                <option value="proximas">Próximas a vencer</option>
              </select>
            </div>

            {/* Búsqueda */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <MagnifyingGlassIcon className={`h-5 w-5 ${subtleText}`} />
              <input
                type="text"
                placeholder="Buscar por cliente o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} w-full lg:w-64`}
              />
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className={`mb-6 border-l-4 rounded-xl p-4 shadow-sm ${modoOscuro ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-red-900/60' : 'bg-red-100'}`}>
                <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              </div>
              <span className={`font-semibold ${modoOscuro ? 'text-red-200' : 'text-red-800'}`}>{error}</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`rounded-2xl p-6 shadow-lg ${cardClass}`}>
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
            {/* Lista de ventas impagas */}
            <div className="space-y-4">
              {filteredAndSortedFacturas.length === 0 ? (
                <div className={`rounded-2xl p-8 shadow-lg border text-center ${modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <ExclamationTriangleIcon className={`w-16 h-16 mx-auto mb-4 ${subtleText}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${accentText}`}>No hay ventas impagas</h3>
                  <p className={subtleText}>No se encontraron ventas que coincidan con los filtros aplicados</p>
                </div>
              ) : (
                filteredAndSortedFacturas.map((factura) => {
                  const estado = getEstadoFactura(factura.fecha);
                  
                  return (
                    <div
                      key={factura._id}
                      className={`rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300 ${
                        modoOscuro ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                        {/* Información del cliente */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#1F80FF] rounded-xl flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>{factura.razonSocial}</h3>
                            <div className={`flex items-center gap-4 text-sm ${accentText}`}>
                              <span className="flex items-center gap-1">
                                <DocumentTextIcon className="w-4 h-4" />
                                #{factura.numero}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formatearFecha(factura.fecha)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Estado y días */}
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            estado.estado === 'vencida'
                              ? (modoOscuro ? 'bg-red-900/40 text-red-200' : 'bg-red-100 text-red-800')
                              : estado.estado === 'proxima'
                                ? (modoOscuro ? 'bg-yellow-900/40 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                                : (modoOscuro ? 'bg-green-900/40 text-green-200' : 'bg-green-100 text-green-800')
                          }`}>
                            {estado.texto}
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>
                              {formatearMoneda(factura.total, factura.moneda)}
                            </div>
                            <div className={`text-sm ${subtleText}`}>Total</div>
                          </div>
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

export default FacturasImpagasDetalle; 