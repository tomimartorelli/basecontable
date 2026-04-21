import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

const PERIODOS = [
  { id: 'mes', label: 'Este mes' },
  { id: 'mes-pasado', label: 'Mes pasado' },
  { id: 'trimestre', label: 'Este trimestre' },
  { id: 'año', label: 'Este año' },
  { id: 'todo', label: 'Todo el historial' }
];

function getAñosDisponibles() {
  const añoActual = new Date().getFullYear();
  const años = [];
  for (let a = 2020; a <= añoActual + 1; a++) {
    años.push(a);
  }
  return años.reverse();
}

function getRango(periodoId) {
  const hoy = new Date();
  let desde, hasta;
  if (periodoId === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  } else if (periodoId === 'mes-pasado') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  } else if (periodoId === 'trimestre') {
    const t = Math.floor(hoy.getMonth() / 3) + 1;
    desde = new Date(hoy.getFullYear(), (t - 1) * 3, 1);
    hasta = new Date(hoy.getFullYear(), t * 3, 0);
  } else if (periodoId === 'año') {
    desde = new Date(hoy.getFullYear(), 0, 1);
    hasta = new Date(hoy.getFullYear(), 11, 31);
  } else if (periodoId === 'todo') {
    desde = new Date(2000, 0, 1);
    hasta = new Date(2030, 11, 31);
  } else {
    desde = new Date(hoy.getFullYear(), 0, 1);
    hasta = new Date(hoy.getFullYear(), 11, 31);
  }
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10)
  };
}

const Reportes = () => {
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();

  const [periodo, setPeriodo] = useState('mes');
  const [datos, setDatos] = useState(null);
  const [mensual, setMensual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [añoMensual, setAñoMensual] = useState(new Date().getFullYear());
  
  // Estado para desglose diario
  const [mesExpandido, setMesExpandido] = useState(null);
  const [datosDiarios, setDatosDiarios] = useState({});
  const [cargandoDiario, setCargandoDiario] = useState(false);

  const rango = useMemo(() => getRango(periodo), [periodo]);

  const fetchFlujoCaja = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { desde, hasta } = rango;
      const [resFlujo, resCat] = await Promise.all([
        secureFetch(`/api/reportes/flujo-caja?desde=${desde}&hasta=${hasta}`),
        secureFetch(`/api/reportes/categorias?desde=${desde}&hasta=${hasta}`)
      ]);
      if (!resFlujo.ok) throw new Error('Error al cargar el reporte');
      const data = await resFlujo.json();
      setDatos(data);
      if (resCat.ok) {
        const catData = await resCat.json();
        setCategorias(catData.categorias || []);
      } else {
        setCategorias([]);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
      setDatos(null);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, [token, secureFetch, rango]);

  const fetchMensual = useCallback(async () => {
    if (!token) return;
    try {
      const res = await secureFetch(`/api/reportes/flujo-caja-mensual?anno=${añoMensual}`);
      if (!res.ok) return;
      const data = await res.json();
      setMensual(data);
    } catch {
      setMensual(null);
    }
  }, [token, secureFetch, añoMensual]);

  const fetchDiario = useCallback(async (anno, mes) => {
    const key = `${anno}-${mes}`;
    if (datosDiarios[key]) return;
    setCargandoDiario(true);
    try {
      const res = await secureFetch(`/api/reportes/flujo-caja-diario?anno=${anno}&mes=${mes}`);
      if (res.ok) {
        const data = await res.json();
        setDatosDiarios(prev => ({ ...prev, [key]: data.dias }));
      }
    } catch {
      // Silenciar error
    } finally {
      setCargandoDiario(false);
    }
  }, [secureFetch, datosDiarios]);

  const toggleMes = (anno, mes) => {
    const key = `${anno}-${mes}`;
    if (mesExpandido === key) {
      setMesExpandido(null);
    } else {
      setMesExpandido(key);
      fetchDiario(anno, mes);
    }
  };

  useEffect(() => {
    fetchFlujoCaja();
  }, [fetchFlujoCaja]);

  useEffect(() => {
    fetchMensual();
  }, [fetchMensual]);


  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const btnSec = modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-200';
  const bgPage = modoOscuro ? 'bg-black text-white' : 'bg-[#f5f5f7] text-gray-900';

  const formatMoney = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0);

  return (
    <div className={`min-h-screen ${bgPage}`}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-[#1F80FF]'}`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-semibold ${textPri}`}>Reportes</h1>
              <p className={`text-xs ${textSec}`}>Ventas por período y flujo de caja.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-xl border-l-4 ${modoOscuro ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'}`}>
            <span className={modoOscuro ? 'text-red-200' : 'text-red-800'}>{error}</span>
          </div>
        )}

        <div className={`mb-4 sm:mb-6 rounded-xl sm:rounded-2xl border p-2 sm:p-3 lg:p-4 ${box}`}>
          <p className={`text-xs font-medium mb-2 px-1 ${textMuted}`}>Período</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:inline-flex gap-2">
            {PERIODOS.map((p) => (
                <button
                key={p.id}
                type="button"
                onClick={() => setPeriodo(p.id)}
                className={`w-full px-2 sm:px-3 lg:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-medium sm:font-semibold text-center transition-all ${
                  periodo === p.id ? 'bg-[#1F80FF] text-white shadow-sm' : btnSec
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={`rounded-xl sm:rounded-2xl border ${box} p-6 sm:p-8 text-center`}>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F80FF] mx-auto mb-3" />
            <p className={textMuted}>Cargando reporte...</p>
          </div>
        ) : datos ? (
          <>
            <div className={`rounded-xl sm:rounded-2xl border ${box} p-4 sm:p-6 mb-4 sm:mb-6`}>
              <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${textPri}`}>
                Resumen del período ({rango.desde} – {rango.hasta})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Ventas del período</p>
                  <p className={`text-xl font-bold ${textPri}`}>{formatMoney(datos.ventasTotal)}</p>
                  <p className={`text-xs ${textMuted}`}>{datos.cantidadVentas} registros</p>
                </div>
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-green-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Cobrado</p>
                  <p className={`text-xl font-bold ${modoOscuro ? 'text-green-300' : 'text-green-700'}`}>{formatMoney(datos.ventasCobradas)}</p>
                </div>
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-amber-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Pendiente de cobro</p>
                  <p className={`text-xl font-bold ${modoOscuro ? 'text-amber-300' : 'text-amber-700'}`}>{formatMoney(datos.ventasImpagas)}</p>
                </div>
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-red-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Egresos</p>
                  <p className={`text-xl font-bold ${modoOscuro ? 'text-red-300' : 'text-red-700'}`}>{formatMoney(datos.egresosTotal)}</p>
                  <p className={`text-xs ${textMuted}`}>{datos.cantidadEgresos} gastos</p>
                </div>
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-blue-50'} sm:col-span-2 lg:col-span-1`}>
                  <p className={`text-sm ${textMuted}`}>Flujo de caja</p>
                  <p className={`text-2xl font-bold ${datos.flujoCaja >= 0 ? (modoOscuro ? 'text-green-300' : 'text-green-700') : (modoOscuro ? 'text-red-300' : 'text-red-700')}`}>
                    {formatMoney(datos.flujoCaja)}
                  </p>
                  <p className={`text-xs ${textMuted}`}>Cobrado − Egresos</p>
                </div>
              </div>
            </div>

            {categorias && categorias.length > 0 && (
              <div className={`rounded-xl sm:rounded-2xl border ${box} overflow-hidden mb-4 sm:mb-6`}>
                <h2 className={`text-base sm:text-lg font-semibold p-3 sm:p-4 border-b ${divide} ${textPri}`}>
                  Por categoría
                </h2>
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className={`${modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'} text-xs`}>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-bold uppercase">Categoría</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Cobrado</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Egresos</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Margen</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${divideY} text-xs sm:text-sm`}>
                      {categorias.map((row) => (
                        <tr key={row.categoria} className={modoOscuro ? 'hover:bg-gray-800/80' : 'hover:bg-gray-50'}>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{row.categoria}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">{formatMoney(row.ventasCobradas)}</td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-right whitespace-nowrap">{formatMoney(row.egresosTotal)}</td>
                          <td
                            className={`py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap ${
                              row.margen >= 0
                                ? modoOscuro ? 'text-green-300' : 'text-green-700'
                                : modoOscuro ? 'text-red-300' : 'text-red-700'
                            }`}
                          >
                            {formatMoney(row.margen)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mensual && mensual.meses && (
              <div className={`rounded-xl sm:rounded-2xl border ${box} overflow-hidden`}>
                <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${divide}`}>
                  <h2 className={`text-base sm:text-lg font-semibold ${textPri}`}>
                    Flujo de caja por mes
                  </h2>
                  <select
                    value={añoMensual}
                    onChange={(e) => setAñoMensual(Number(e.target.value))}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${modoOscuro ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                  >
                    {getAñosDisponibles().map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full min-w-[350px]">
                    <thead>
                      <tr className={`${modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'} text-xs`}>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-bold uppercase">Mes</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Cobrado</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Egresos</th>
                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-bold uppercase whitespace-nowrap">Flujo</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${divideY}`}>
                      {mensual.meses.map((row) => {
                        const key = `${row.anno}-${row.mes}`;
                        const isExpanded = mesExpandido === key;
                        const dias = datosDiarios[key] || [];
                        return (
                          <React.Fragment key={key}>
                            <tr
                              className={`cursor-pointer transition-colors ${modoOscuro ? 'hover:bg-gray-800/80' : 'hover:bg-gray-50'}`}
                              onClick={() => toggleMes(row.anno, row.mes)}
                            >
                              <td className="py-3 px-2 sm:px-4 font-medium capitalize text-sm sm:text-base">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  {row.nombreMes}
                                </div>
                              </td>
                              <td className="py-3 px-2 sm:px-4 text-right whitespace-nowrap text-sm sm:text-base">{formatMoney(row.ventasCobradas)}</td>
                              <td className="py-3 px-2 sm:px-4 text-right whitespace-nowrap text-sm sm:text-base">{formatMoney(row.egresosTotal)}</td>
                              <td className={`py-3 px-2 sm:px-4 text-right font-semibold whitespace-nowrap text-sm sm:text-base ${row.flujoCaja >= 0 ? (modoOscuro ? 'text-green-300' : 'text-green-700') : (modoOscuro ? 'text-red-300' : 'text-red-700')}`}>
                                {formatMoney(row.flujoCaja)}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={4} className={`p-0 ${modoOscuro ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                  {cargandoDiario ? (
                                    <div className="py-4 text-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1F80FF] mx-auto" />
                                      <p className={`text-xs mt-2 ${textMuted}`}>Cargando días...</p>
                                    </div>
                                  ) : dias.length > 0 ? (
                                    <div className="px-4 py-3">
                                      <p className={`text-xs font-medium mb-2 ${textMuted}`}>Desglose por día</p>
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <th className="text-left py-2 px-2">Fecha</th>
                                            <th className="text-right py-2 px-2">Ingresos</th>
                                            <th className="text-right py-2 px-2">Egresos</th>
                                            <th className="text-right py-2 px-2">Flujo</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {dias.map((dia) => (
                                            <tr key={dia.fecha} className={`${modoOscuro ? 'border-gray-700' : 'border-gray-200'} border-b last:border-b-0`}>
                                              <td className="py-2 px-2 text-left">
                                                {new Date(dia.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                              </td>
                                              <td className="py-2 px-2 text-right">{formatMoney(dia.ingresos)}</td>
                                              <td className="py-2 px-2 text-right">{formatMoney(dia.egresos)}</td>
                                              <td className={`py-2 px-2 text-right font-medium ${(dia.ingresos - dia.egresos) >= 0 ? (modoOscuro ? 'text-green-300' : 'text-green-700') : (modoOscuro ? 'text-red-300' : 'text-red-700')}`}>
                                                {formatMoney(dia.ingresos - dia.egresos)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {dias.some(d => d.facturas?.length > 0 || d.gastos?.length > 0) && (
                                        <div className="mt-3 space-y-2">
                                          {dias.filter(d => d.facturas?.length > 0).slice(0, 3).map(dia => (
                                            <div key={dia.fecha} className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
                                              <span className="font-medium">{new Date(dia.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}:</span>
                                              {' '}{dia.facturas.length} factura(s) - {formatMoney(dia.ingresos)}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className={`py-4 text-center text-xs ${textMuted}`}>No hay movimientos diarios para este mes</p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`rounded-2xl border border-dashed ${divide} p-8 sm:p-12 text-center`}>
            <p className={`text-sm ${textSec}`}>No hay datos para el período seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
