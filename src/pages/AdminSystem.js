import React, { useEffect, useState, useContext } from 'react';
import { FiDatabase, FiShield, FiServer, FiClock, FiSettings, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { useApi } from '../hooks/useApi';
import { ThemeContext } from '../context/ThemeContext';

const AdminSystem = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { canManageSystem } = useAdminPermissions();
  const { secureFetch } = useApi();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsRes, activitiesRes] = await Promise.all([
          secureFetch('/api/admin/dashboard/stats'),
          secureFetch('/api/admin/dashboard/activities')
        ]);

        if (!statsRes.ok) {
          const data = await statsRes.json();
          throw new Error(data.message || 'Error al obtener estadísticas del sistema');
        }
        if (!activitiesRes.ok) {
          const data = await activitiesRes.json();
          throw new Error(data.message || 'Error al obtener actividad reciente');
        }

        const statsData = await statsRes.json();
        const activitiesData = await activitiesRes.json();

        setStats(statsData);
        setActivities(activitiesData || []);
        setActivityPage(1);
      } catch (err) {
        console.error('❌ AdminSystem: Error al cargar datos:', err);
        setError(err.message || 'Error al cargar datos del sistema.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [secureFetch]);

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';

  const totalActivityPages = Math.max(1, Math.ceil((activities?.length || 0) / activityPageSize));
  const paginatedActivities = activities.slice(
    (activityPage - 1) * activityPageSize,
    activityPage * activityPageSize
  );

  const renderSystemHealthBadge = (health) => {
    if (health === 'healthy') {
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${modoOscuro ? 'bg-green-900/40 text-green-200 border-green-700' : 'bg-green-50 text-green-700 border-green-200'}`}>
          <FiCheckCircle className="w-3 h-3" />
          Saludable
        </span>
      );
    }
    if (health === 'warning') {
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${modoOscuro ? 'bg-yellow-900/40 text-yellow-200 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
          <FiAlertCircle className="w-3 h-3" />
          Advertencia
        </span>
      );
    }
    if (health === 'critical') {
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${modoOscuro ? 'bg-red-900/40 text-red-200 border-red-700' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <FiAlertCircle className="w-3 h-3" />
          Crítico
        </span>
      );
    }
    return null;
  };

  return (
    <AdminLayout requiredPermission={canManageSystem}>
      <div className={modoOscuro ? 'min-h-full bg-black' : 'min-h-full bg-[#f5f5f7]'}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className={`text-xl font-semibold ${textPri}`}>Sistema</h1>
              <p className={`text-sm ${textSec}`}>
                Parámetros globales de la plataforma. Afectan a todos los usuarios y empresas.
              </p>
            </div>
          </div>

          {error && (
            <div className={`p-3 rounded-xl border text-sm ${modoOscuro ? 'bg-red-900/30 border-red-600 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${box}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                <FiDatabase className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>Usuarios</h3>
                <p className={`text-2xl font-semibold ${textPri}`}>{stats ? stats.totalUsers : (loading ? '—' : 0)}</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Cuentas registradas en la plataforma</p>
              </div>
            </div>
            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${box}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>Estudios / Empresas</h3>
                <p className={`text-2xl font-semibold ${textPri}`}>{stats ? stats.totalCompanies : (loading ? '—' : 0)}</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Organizaciones activas en el sistema</p>
              </div>
            </div>
            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${box}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <FiServer className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>Registros</h3>
                <p className={`text-2xl font-semibold ${textPri}`}>{stats ? stats.totalInvoices : (loading ? '—' : 0)}</p>
                <p className={`text-xs mt-1 ${textMuted}`}>Documentos internos registrados</p>
              </div>
            </div>
            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${box}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <FiServer className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-semibold ${textPri}`}>Salud del sistema</h3>
                  {stats && renderSystemHealthBadge(stats.systemHealth)}
                </div>
                <p className={`text-xs ${textSec}`}>
                  Estado de la conexión a base de datos y servicios principales.
                </p>
                {stats && typeof stats.totalRevenue === 'number' && (
                  <p className={`text-xs mt-2 ${textMuted}`}>
                    Ingresos totales procesados:{' '}
                    <span className="font-mono">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue || 0)}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className={`rounded-2xl p-5 border ${box}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    <FiSettings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-semibold ${textPri}`}>Correo y notificaciones</h2>
                    <p className={`text-xs ${textSec}`}>
                      Configuración de SMTP y envío de emails transaccionales.
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  <FiCheckCircle className="w-3 h-3" />
                  Operativo
                </span>
              </div>

              <div className={`mt-2 space-y-2.5 text-xs ${textSec}`}>
                <div className="flex items-center justify-between">
                  <span>Proveedor SMTP</span>
                  <span className={`font-mono ${textPri}`}>smtp.gmail.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Puerto</span>
                  <span className={`font-mono ${textPri}`}>465 (SSL)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notificaciones de sistema</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    Activas
                  </span>
                </div>
              </div>
            </section>

            <section className={`rounded-2xl p-5 border ${box}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  <FiAlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-sm font-semibold ${textPri}`}>Mantenimiento</h2>
                  <p className={`text-xs ${textSec}`}>Control del modo mantenimiento y ventanas de servicio.</p>
                </div>
              </div>
              <div className={`space-y-2.5 text-xs ${textSec}`}>
                <div className="flex items-center justify-between">
                  <span>Estado actual</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    <FiCheckCircle className="w-3 h-3" />
                    En línea
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Próxima ventana de mantenimiento</span>
                  <span className={`font-mono ${textPri}`}>Sin programar</span>
                </div>
              </div>
            </section>
          </div>

          <section className={`rounded-2xl p-5 border ${box}`}>
            <h2 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${textPri}`}>
              <FiClock className="w-4 h-4" />
              Actividad reciente del sistema
            </h2>
            {loading && !stats ? (
              <p className={`text-xs ${textMuted}`}>Cargando actividad...</p>
            ) : activities.length === 0 ? (
              <p className={`text-xs ${textMuted}`}>No hay actividades registradas aún.</p>
            ) : (
              <>
                <div className={`mt-2 divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {paginatedActivities.map((activity, index) => (
                    <div key={`${activity._id || activity.createdAt}-${index}`} className="py-2 flex items-start gap-3 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 ${modoOscuro ? 'bg-gray-500' : 'bg-gray-700'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${textPri}`}>{activity.action}</p>
                        <p className={textSec}>{activity.details}</p>
                        <p className={`mt-1 ${textMuted}`}>
                          {activity.user} · {new Date(activity.createdAt).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {activities.length > activityPageSize && (
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className={textMuted}>
                      Mostrando{' '}
                      <span className={textPri}>
                        {(activityPage - 1) * activityPageSize + 1}–
                        {Math.min(activityPage * activityPageSize, activities.length)}
                      </span>{' '}
                      de <span className={textPri}>{activities.length}</span> actividades
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                        disabled={activityPage === 1}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          activityPage === 1
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
                        onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                        disabled={activityPage === totalActivityPages}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          activityPage === totalActivityPages
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
              </>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSystem;

