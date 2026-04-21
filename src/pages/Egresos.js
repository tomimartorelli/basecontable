import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

const CATEGORIAS = ['', 'Insumos', 'Alquiler', 'Servicios', 'Impuestos', 'Sueldos', 'Otro'];

const formInicial = {
  fecha: new Date().toISOString().split('T')[0],
  concepto: '',
  monto: 0,
  moneda: 'ARS',
  categoria: '',
  proveedor: '',
  notas: ''
};

const Egresos = () => {
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();

  const [egresos, setEgresos] = useState([]);
  const [egresosFiltrados, setEgresosFiltrados] = useState([]);
  const [tab, setTab] = useState('listado');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(formInicial);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);

  const fetchEgresos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await secureFetch('/api/expenses');
      if (!res.ok) throw new Error('Error al obtener gastos');
      const data = await res.json();
      setEgresos(data);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [token, secureFetch]);

  useEffect(() => {
    if (token) fetchEgresos();
  }, [token, fetchEgresos]);

  useEffect(() => {
    let filtradas = egresos;
    if (filtroCategoria) filtradas = filtradas.filter(e => (e.categoria || '') === filtroCategoria);
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde);
      desde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(e => new Date(e.fecha) >= desde);
    }
    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(e => new Date(e.fecha) <= hasta);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      filtradas = filtradas.filter(
        e =>
          (e.concepto || '').toLowerCase().includes(q) ||
          (e.proveedor || '').toLowerCase().includes(q) ||
          (e.notas || '').toLowerCase().includes(q)
      );
    }
    filtradas = filtradas.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setEgresosFiltrados(filtradas);
  }, [egresos, filtroCategoria, filtroFechaDesde, filtroFechaHasta, busqueda]);

  const totalFiltrado = useMemo(
    () => egresosFiltrados.reduce((sum, e) => sum + (e.monto || 0), 0),
    [egresosFiltrados]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'monto' ? parseFloat(value) || 0 : value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.concepto?.trim()) {
      setError('El concepto es obligatorio.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = editId ? `/api/expenses/${editId}` : '/api/expenses';
      const method = editId ? 'PUT' : 'POST';
      const res = await secureFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar');
      setSuccess(editId ? 'Gasto actualizado correctamente.' : 'Gasto registrado correctamente.');
      setForm(formInicial);
      setEditId(null);
      fetchEgresos();
      setTimeout(() => setTab('listado'), 800);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (gasto) => {
    setEditId(gasto._id);
    setForm({
      fecha: gasto.fecha || formInicial.fecha,
      concepto: gasto.concepto || '',
      monto: gasto.monto ?? 0,
      moneda: gasto.moneda || 'ARS',
      categoria: gasto.categoria || '',
      proveedor: gasto.proveedor || '',
      notas: gasto.notas || ''
    });
    setTab('crear');
    setError('');
    setSuccess('');
  };

  const exportarEgresosCsv = async () => {
    setExportingCsv(true);
    setError('');
    try {
      const res = await secureFetch('/api/export/egresos');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al exportar');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'egresos.csv';
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Exportación descargada (egresos.csv).');
    } catch (err) {
      setError(err.message || 'Error al exportar');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar');
      setSuccess('Gasto eliminado.');
      if (editId === id) setEditId(null);
      fetchEgresos();
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';
  const btnSec = modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-gray-900 hover:bg-gray-50';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700';
  const tableRow = modoOscuro ? 'hover:bg-gray-800/80' : 'hover:bg-gray-50';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-200';
  const bgPage = modoOscuro ? 'bg-black text-white' : 'bg-[#f5f5f7] text-gray-900';

  return (
    <div className={`min-h-screen ${bgPage}`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V9a2 2 0 012-2h2a2 2 0 012 2v1m-4 4h10" />
              </svg>
            </div>
            <div className="space-y-1">
              <h1 className={`text-2xl sm:text-3xl font-semibold ${textPri}`}>Registro de gastos</h1>
              <p className={`text-xs sm:text-sm ${textSec}`}>Registrá y controlá tus egresos.</p>
            </div>
          </div>
        </div>

        {success && (
          <div
            className={`mb-4 p-3 rounded-xl border-l-4 ${modoOscuro ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-400'}`}
          >
            <span className={modoOscuro ? 'text-green-200' : 'text-green-800'}>{success}</span>
          </div>
        )}
        {error && (
          <div
            className={`mb-4 p-3 rounded-xl border-l-4 ${modoOscuro ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'}`}
          >
            <span className={modoOscuro ? 'text-red-200' : 'text-red-800'}>{error}</span>
          </div>
        )}

        <div className={`mb-6 rounded-2xl p-1 shadow-lg border ${box}`}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setTab('listado'); setEditId(null); setForm(formInicial); }}
              className={`flex-1 justify-center px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm ${
                tab === 'listado' ? 'bg-[#1F80FF] text-white' : modoOscuro ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Listado
            </button>
            <button
              type="button"
              onClick={() => { setTab('crear'); setEditId(null); setForm(formInicial); setError(''); setSuccess(''); }}
              className={`flex-1 justify-center px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm ${
                tab === 'crear' ? 'bg-[#1F80FF] text-white' : modoOscuro ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {editId ? 'Editar' : 'Nuevo gasto'}
            </button>
          </div>
        </div>

        {tab === 'crear' && (
          <div className={`rounded-2xl border shadow-sm p-6 ${box}`}>
            <h2 className={`text-xl font-bold mb-4 ${textPri}`}>{editId ? 'Editar gasto' : 'Nuevo gasto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSec}`}>Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSec}`}>Moneda</label>
                  <select
                    name="moneda"
                    value={form.moneda}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSec}`}>Concepto *</label>
                <input
                  type="text"
                  name="concepto"
                  value={form.concepto}
                  onChange={handleChange}
                  placeholder="Ej. Alquiler oficina, servicios, insumos..."
                  required
                  className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSec}`}>Monto *</label>
                  <input
                    type="number"
                    name="monto"
                    value={form.monto || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSec}`}>Categoría</label>
                  <select
                    name="categoria"
                    value={form.categoria}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat || 'vacio'} value={cat}>{cat || 'Sin categoría'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSec}`}>Proveedor (opcional)</label>
                <input
                  type="text"
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  placeholder="Nombre del proveedor"
                  className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSec}`}>Notas (opcional)</label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1F80FF] text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Guardando…' : editId ? 'Actualizar' : 'Registrar gasto'}
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('listado'); setEditId(null); setForm(formInicial); }}
                  className={`px-4 py-2 rounded-lg font-semibold border ${btnOut}`}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'listado' && (
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${box}`}>
            <div className={`p-4 sm:p-6 border-b ${divide}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs sm:text-sm">
                  <div className={`font-semibold ${textPri}`}>{egresosFiltrados.length} gastos</div>
                  <div className={textMuted}>
                    Total:{' '}
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalFiltrado)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { setTab('crear'); setEditId(null); setForm(formInicial); }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1F80FF] text-white rounded-xl font-semibold hover:bg-blue-600 text-xs sm:text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo gasto
                  </button>
                  <button
                    type="button"
                    onClick={exportarEgresosCsv}
                    disabled={exportingCsv}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm disabled:opacity-50 ${btnOut}`}
                    title="Exportar listado en CSV para tu contador"
                  >
                    <svg className={`w-4 h-4 ${exportingCsv ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por concepto, proveedor o notas..."
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

              <div className={`flex flex-wrap gap-3 p-3 rounded-xl border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${inputClass}`}
                  >
                    <option value="">Todas</option>
                    {CATEGORIAS.filter(Boolean).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Desde</label>
                  <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={e => setFiltroFechaDesde(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Hasta</label>
                  <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={e => setFiltroFechaHasta(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${inputClass}`}
                  />
                </div>
                {(filtroCategoria || filtroFechaDesde || filtroFechaHasta) && (
                  <button
                    type="button"
                    onClick={() => { setFiltroCategoria(''); setFiltroFechaDesde(''); setFiltroFechaHasta(''); }}
                    className={`self-end px-3 py-2 rounded-lg text-sm font-medium ${btnSec}`}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {egresosFiltrados.length === 0 ? (
                <div className={`py-12 text-center rounded-xl border border-dashed ${divide}`}>
                  <p className={`text-sm ${textSec}`}>No hay gastos registrados.</p>
                  <button
                    type="button"
                    onClick={() => setTab('crear')}
                    className={`mt-3 px-4 py-2 rounded-lg font-semibold ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                  >
                    Registrar primer gasto
                  </button>
                </div>
              ) : (
                <>
                  <div className="md:hidden space-y-3">
                    {egresosFiltrados.map(g => (
                      <div
                        key={g._id}
                        className={`p-4 rounded-xl border ${divide}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-semibold ${textPri}`}>{g.concepto}</span>
                          <span className={`font-bold ${textPri}`}>
                            {g.moneda} {Number(g.monto).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className={`text-xs ${textMuted} flex flex-wrap gap-2 mb-3`}>
                          <span>{g.fecha}</span>
                          {g.categoria && <span>• {g.categoria}</span>}
                          {g.proveedor && <span>• {g.proveedor}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditar(g)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${btnSec}`}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(g._id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${btnOut}`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={tableHead}>
                          <th className="py-3 px-4 text-left text-xs font-bold uppercase">Fecha</th>
                          <th className="py-3 px-4 text-left text-xs font-bold uppercase">Concepto</th>
                          <th className="py-3 px-4 text-left text-xs font-bold uppercase">Categoría</th>
                          <th className="py-3 px-4 text-left text-xs font-bold uppercase">Proveedor</th>
                          <th className="py-3 px-4 text-right text-xs font-bold uppercase">Monto</th>
                          <th className="py-3 px-4 text-center text-xs font-bold uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${divideY}`}>
                        {egresosFiltrados.map(g => (
                          <tr key={g._id} className={tableRow}>
                            <td className="py-3 px-4 text-sm">{g.fecha}</td>
                            <td className="py-3 px-4 font-medium">{g.concepto}</td>
                            <td className="py-3 px-4 text-sm">{g.categoria || '—'}</td>
                            <td className="py-3 px-4 text-sm">{g.proveedor || '—'}</td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {g.moneda} {Number(g.monto).toLocaleString('es-AR')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleEditar(g)}
                                className={`px-2 py-1 rounded text-xs font-semibold mr-1 ${btnSec}`}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminar(g._id)}
                                className={`px-2 py-1 rounded text-xs font-semibold border ${btnOut}`}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Egresos;
