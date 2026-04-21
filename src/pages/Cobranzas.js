import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

const getEstadoVencimiento = (fecha) => {
  if (!fecha) return { tipo: 'sin-fecha', texto: '—', esVencido: false };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha);
  v.setHours(0, 0, 0, 0);
  const dias = Math.ceil((v - hoy) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { tipo: 'vencido', texto: `Vencido hace ${Math.abs(dias)} días`, esVencido: true };
  if (dias === 0) return { tipo: 'vencido', texto: 'Vence hoy', esVencido: true };
  if (dias <= 7) return { tipo: 'proximo', texto: `Vence en ${dias} días`, esVencido: false };
  return { tipo: 'normal', texto: `Vence en ${dias} días`, esVencido: false };
};

const Cobranzas = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();

  const [impagas, setImpagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const fetchImpagas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await secureFetch('/api/invoices');
      if (!res.ok) throw new Error('Error al cargar registros');
      const data = await res.json();
      const soloImpagas = data.filter(
        f => f.estadoPago === 'impaga' || (f.estadoPago !== 'pagada' && !f.estadoPago)
      );
      setImpagas(soloImpagas);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [token, secureFetch]);

  useEffect(() => {
    if (token) fetchImpagas();
  }, [token, fetchImpagas]);

  const enviarRecordatorio = async (id) => {
    setSuccess('');
    setError('');
    try {
      const res = await secureFetch(`/api/invoices/${id}/reminder`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar recordatorio');
      setSuccess('Recordatorio enviado correctamente.');
    } catch (err) {
      setError(err.message || 'Error al enviar recordatorio');
    }
  };

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return impagas;
    const q = busqueda.toLowerCase();
    return impagas.filter(
      f =>
        (f.razonSocial || '').toLowerCase().includes(q) ||
        (f.numero || '').toString().toLowerCase().includes(q)
    );
  }, [impagas, busqueda]);

  const totalCobrar = useMemo(
    () => filtradas.reduce((sum, f) => sum + (f.total || 0), 0),
    [filtradas]
  );

  const porCliente = useMemo(() => {
    const map = new Map();
    filtradas.forEach(f => {
      const key = (f.razonSocial || '').trim() || 'Sin nombre';
      if (!map.has(key)) map.set(key, { razonSocial: key, items: [], subtotal: 0 });
      const entry = map.get(key);
      entry.items.push(f);
      entry.subtotal += f.total || 0;
    });
    return Array.from(map.values()).sort((a, b) => (b.subtotal || 0) - (a.subtotal || 0));
  }, [filtradas]);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const btnSec = modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-gray-900 hover:bg-gray-50';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-amber-600' : 'bg-amber-500'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className={`text-2xl sm:text-3xl font-semibold ${textPri}`}>Qué me deben</h1>
              <p className={`text-xs sm:text-sm ${textSec}`}>Control de cobranzas y ventas impagas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/facturas')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold border ${btnOut}`}
          >
            Ir a registro de ventas
          </button>
        </div>

        {success && (
          <div className={`mb-4 p-3 rounded-xl border-l-4 ${modoOscuro ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-400'}`}>
            <span className={modoOscuro ? 'text-green-200' : 'text-green-800'}>{success}</span>
          </div>
        )}
        {error && (
          <div className={`mb-4 p-3 rounded-xl border-l-4 ${modoOscuro ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'}`}>
            <span className={modoOscuro ? 'text-red-200' : 'text-red-800'}>{error}</span>
          </div>
        )}

        {loading ? (
          <div className={`rounded-2xl border ${box} p-8 text-center`}>
            <div className={`animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F80FF] mx-auto mb-3`} />
            <p className={textMuted}>Cargando cobranzas...</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className={`rounded-2xl border ${box} p-6 mb-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${textPri}`}>Resumen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Total a cobrar</p>
                  <p className={`text-2xl font-bold ${textPri}`}>
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalCobrar)}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${modoOscuro ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${textMuted}`}>Registros impagos</p>
                  <p className={`text-2xl font-bold ${textPri}`}>{filtradas.length}</p>
                </div>
              </div>
            </div>

            {filtradas.length === 0 ? (
              <div className={`rounded-2xl border border-dashed ${divide} p-12 text-center`}>
                <p className={`text-sm ${textSec} mb-2`}>No tenés ventas pendientes de cobro.</p>
                <button
                  type="button"
                  onClick={() => navigate('/facturas')}
                  className={`px-4 py-2 rounded-xl font-semibold ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                >
                  Ver registro de ventas
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Buscar por cliente o número..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm ${inputClass}`}
                  />
                  <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textMuted}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Por cliente */}
                <div className="space-y-6">
                  {porCliente.map(({ razonSocial, items, subtotal }) => (
                    <div key={razonSocial} className={`rounded-2xl border overflow-hidden ${box}`}>
                      <div className={`px-4 py-3 border-b ${divide} flex flex-wrap items-center justify-between gap-2`}>
                        <h3 className={`font-semibold ${textPri}`}>{razonSocial}</h3>
                        <span className={`font-bold ${textPri}`}>
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(subtotal)}
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {items.map(f => {
                          const estado = getEstadoVencimiento(f.fecha);
                          return (
                            <li
                              key={f._id}
                              className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${modoOscuro ? 'hover:bg-gray-800/80' : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex flex-wrap items-center gap-3 min-w-0">
                                <span className={`font-mono text-sm font-medium ${textPri}`}>#{f.numero}</span>
                                <span className={`text-sm ${textSec}`}>{f.fecha}</span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    estado.esVencido
                                      ? modoOscuro
                                        ? 'bg-red-900/50 text-red-200'
                                        : 'bg-red-100 text-red-700'
                                      : modoOscuro
                                      ? 'bg-gray-700 text-gray-300'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {estado.texto}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold ${textPri}`}>
                                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(f.total || 0)}
                                </span>
                                {f.email && (
                                  <button
                                    type="button"
                                    onClick={() => enviarRecordatorio(f._id)}
                                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold ${modoOscuro ? 'bg-amber-800/50 text-amber-200 hover:bg-amber-700/50' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                                    title="Enviar recordatorio de cobro por email"
                                  >
                                    Recordatorio
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => navigate('/facturas')}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold ${btnSec}`}
                                >
                                  Ver
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cobranzas;
