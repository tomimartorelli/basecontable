import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import { FiUsers, FiSearch, FiUserPlus, FiTrash2, FiRefreshCw, FiShield, FiKey } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

const EquipoUsuarios = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', companyRole: 'employee' });

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900 focus:border-gray-900';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50';

  const isOwner = user?.role === 'company_owner' || (user?.role === 'admin' && user?.isSuperAdmin === true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await secureFetch('/api/team/users');
      if (!res.ok) throw new Error('No se pudo cargar el equipo');
      const data = await res.json();
      setCompany(data.company);
      setUsers(data.users || []);
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
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch('/api/team/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.code || 'Error');
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', phone: '', companyRole: 'employee' });
      load();
    } catch (err) {
      console.error('Equipo: error al crear usuario', err);
      setError(err.message || 'No se pudo crear el usuario del equipo. Intentalo de nuevo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario del equipo?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await secureFetch(`/api/team/users/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.code || 'Error');
      load();
    } catch (err) {
      console.error('Equipo: error al eliminar usuario', err);
      setError(err.message || 'No se pudo eliminar el usuario del equipo.');
    }
  };

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-gray-50 text-gray-900'}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold ${textPri}`}>Equipo</h1>
              <p className={`text-xs ${textSec}`}>
                {company?.name ? `Usuarios de ${company.name}.` : 'Gestión de usuarios de tu empresa.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${btnOut}`}
              title="Actualizar"
            >
              <FiRefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            {isOwner && (
              <button
                onClick={() => setShowAdd(true)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
              >
                <FiUserPlus className="w-4 h-4" />
                Añadir usuario
              </button>
            )}
          </div>
        </div>

        {/* Tabs Equipo / Auditoría */}
        {/* Mensajes de estado */}
        {error && (
          <div className={modoOscuro ? 'bg-red-900/30 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-xs' : 'bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs'}>
            {error}
          </div>
        )}
        {success && (
          <div className={modoOscuro ? 'bg-green-900/30 border border-green-700 text-green-200 rounded-xl px-4 py-3 text-xs' : 'bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-xs'}>
            {success}
          </div>
        )}

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClass}`}
            />
          </div>
        </div>

        {/* Lista mobile como tarjetas */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className={`px-4 py-6 text-center text-sm ${textSec}`}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className={`px-4 py-6 text-center text-sm ${textSec}`}>No hay usuarios.</div>
          ) : (
            filtered.map(u => (
              <div
                key={u._id}
                className={`rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 ${
                  modoOscuro ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${textPri} truncate`}>{u.name}</div>
                  <div className={`text-xs ${textMuted} truncate`}>{u.email}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${
                        modoOscuro ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.isOwner ? <FiShield className="w-3 h-3" /> : <FiKey className="w-3 h-3" />}
                      {u.isOwner
                        ? 'Propietario'
                        : u.companyRole === 'admin'
                        ? 'Admin'
                        : u.companyRole === 'viewer'
                        ? 'Lector'
                        : 'Empleado'}
                    </span>
                    <span className={textMuted}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-AR') : 'Sin acceso aún'}
                    </span>
                  </div>
                </div>
                {isOwner && !u.isOwner && (
                  <button
                    onClick={() => handleDelete(u._id)}
                    className={`shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[11px] border ${
                      modoOscuro ? 'border-red-700 text-red-200 hover:bg-red-900/30' : 'border-red-200 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
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
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Usuario</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Rol</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide">Último acceso</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className={modoOscuro ? 'divide-y divide-gray-800' : 'divide-y divide-gray-100'}>
                {loading ? (
                  <tr>
                    <td colSpan={4} className={`px-4 py-6 ${textSec}`}>Cargando...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`px-4 py-6 ${textSec}`}>No hay usuarios.</td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u._id} className={modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${textPri}`}>{u.name}</div>
                        <div className={`text-xs ${textMuted}`}>{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
                            modoOscuro ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.isOwner ? <FiShield className="w-3 h-3" /> : <FiKey className="w-3 h-3" />}
                          {u.isOwner
                            ? 'Propietario'
                            : u.companyRole === 'admin'
                            ? 'Admin'
                            : u.companyRole === 'viewer'
                            ? 'Lector'
                            : 'Empleado'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${textSec}`}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString('es-AR') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isOwner && !u.isOwner && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                              modoOscuro ? 'border-red-700 text-red-200 hover:bg-red-900/30' : 'border-red-200 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAdd && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className={`w-full max-w-md mx-4 rounded-2xl border p-6 ${box}`}>
              <h3 className={`text-base font-semibold mb-4 ${textPri}`}>Nuevo usuario</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Nombre</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Contraseña</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Rol</label>
                  <select
                    value={form.companyRole}
                    onChange={(e) => setForm({ ...form, companyRole: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${inputClass}`}
                  >
                    <option value="employee">Empleado</option>
                    <option value="viewer">Lector</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className={`flex-1 px-4 py-2 rounded-lg border text-sm ${btnOut}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm text-white ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipoUsuarios;

