import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { FiActivity, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const EquipoAuditoria = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const location = useLocation();

  const [company, setCompany] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900 focus:border-gray-900';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await secureFetch('/api/team/activity');
      if (!res.ok) throw new Error('No se pudo cargar auditoría');
      const data = await res.json();
      setCompany(data.company);
      setActivities(data.activities || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return activities;
    return activities.filter(a =>
      (a.action || '').toLowerCase().includes(s) ||
      (a.details || '').toLowerCase().includes(s) ||
      (a.user?.name || '').toLowerCase().includes(s) ||
      (a.user?.email || '').toLowerCase().includes(s)
    );
  }, [activities, q]);

  useEffect(() => {
    // Resetear a la primera página cuando cambia el filtro o la data
    setPage(1);
  }, [q, activities]);

  const totalPages = Math.max(1, Math.ceil((filtered?.length || 0) / pageSize));
  const paginated = useMemo(
    () =>
      filtered.slice(
        (page - 1) * pageSize,
        page * pageSize
      ),
    [filtered, page, pageSize]
  );

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gray-50 text-gray-900'}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold ${textPri}`}>Auditoría</h1>
              <p className={`text-xs ${textSec}`}>
                {company?.name ? `Actividad del equipo de ${company.name}.` : 'Actividad reciente del equipo.'}
              </p>
            </div>
          </div>

          <button
            onClick={load}
            className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${btnOut}`}
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Tabs Equipo / Auditoría */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex rounded-full p-1 ${modoOscuro ? 'bg-gray-900 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
            <Link
              to="/equipo/usuarios"
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                location.pathname.startsWith('/equipo/usuarios')
                  ? modoOscuro ? 'bg-white text-black' : 'bg-black text-white'
                  : modoOscuro ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Usuarios
            </Link>
            <Link
              to="/equipo/auditoria"
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                location.pathname.startsWith('/equipo/auditoria')
                  ? modoOscuro ? 'bg-white text-black' : 'bg-black text-white'
                  : modoOscuro ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              Auditoría
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por acción, usuario o detalle..."
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClass}`}
            />
          </div>
        </div>

        {/* Lista mobile como tarjetas */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className={`px-4 py-6 text-center text-sm ${textSec}`}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className={`px-4 py-6 text-center text-sm ${textSec}`}>No hay actividad.</div>
          ) : (
            paginated.map(a => (
              <div
                key={a._id}
                className={`rounded-2xl border px-4 py-3 flex flex-col gap-1 ${
                  modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs ${textMuted}`}>
                      {new Date(a.createdAt).toLocaleString('es-AR')}
                    </div>
                    <div className={`text-sm font-medium ${textPri} truncate`}>
                      {a.user?.name || 'Usuario'}
                    </div>
                    {a.user?.email && (
                      <div className={`text-xs ${textMuted} truncate`}>{a.user.email}</div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${modoOscuro ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
                    {a.action}
                  </div>
                </div>
                {a.details && (
                  <div className={`mt-1 text-xs ${textSec}`}>
                    {a.details}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Tabla para pantallas medianas y grandes */}
        <div className={`hidden md:block rounded-2xl border overflow-hidden ${box}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}>
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Usuario</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Acción</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Detalle</th>
                </tr>
              </thead>
              <tbody className={modoOscuro ? 'divide-y divide-gray-800' : 'divide-y divide-gray-100'}>
                {loading ? (
                  <tr><td colSpan={4} className={`px-4 py-6 ${textSec}`}>Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className={`px-4 py-6 ${textSec}`}>No hay actividad.</td></tr>
                ) : (
                  paginated.map(a => (
                    <tr key={a._id} className={modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-3 text-xs ${textSec}`}>{new Date(a.createdAt).toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${textPri}`}>{a.user?.name || 'Usuario'}</div>
                        <div className={`text-xs ${textMuted}`}>{a.user?.email || ''}</div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${textPri}`}>{a.action}</td>
                      <td className={`px-4 py-3 text-xs ${textSec}`}>{a.details || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between mt-3 text-[11px]">
            <span className={textMuted}>
              Mostrando{' '}
              <span className={textPri}>
                {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, filtered.length)}
              </span>{' '}
              de <span className={textPri}>{filtered.length}</span> registros
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-2 py-1 rounded border text-[11px] ${
                  page === 1
                    ? modoOscuro
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : modoOscuro
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-2 py-1 rounded border text-[11px] ${
                  page === totalPages
                    ? modoOscuro
                      ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : modoOscuro
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipoAuditoria;

