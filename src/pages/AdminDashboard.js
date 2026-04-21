import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  FiUsers, 
  FiBriefcase, 
  FiFileText, 
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiBarChart
} from 'react-icons/fi';
import { useApi } from '../hooks/useApi';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { ThemeContext } from '../context/ThemeContext';

const AdminDashboard = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const {
    canManageUsers,
    canManageCompanies,
    canManagePlans,
    canManageSystem,
    getUserLimit,
    getCompanyLimit,
    canAccessABM,
    loading: permissionsLoading,
    error: permissionsError
  } = useAdminPermissions();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    systemHealth: 'healthy',
    lastBackup: null
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas del sistema
      const [statsRes, activitiesRes] = await Promise.all([
        secureFetch('/api/admin/dashboard/stats'),
        secureFetch('/api/admin/dashboard/activities')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData.slice(0, 10)); // Solo las últimas 10
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  useEffect(() => {
    if (canAccessABM()) {
      loadDashboardData();
    }
  }, [canAccessABM, loadDashboardData]);

  const getSystemHealthColor = (health) => {
    if (health === 'critical') return modoOscuro ? 'bg-red-900/50 text-red-100' : 'bg-gray-900 text-white';
    return modoOscuro ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
  };

  const getSystemHealthIcon = (health) => {
    if (health === 'healthy') return <FiCheckCircle className="w-5 h-5" />;
    if (health === 'warning') return <FiAlertCircle className="w-5 h-5" />;
    return <FiAlertCircle className="w-5 h-5" />;
  };

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const cardInner = modoOscuro ? 'bg-gray-800' : 'bg-gray-50';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';
  const quickCard = modoOscuro ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200';

  // Si no puede acceder al ABM, mostrar mensaje de acceso restringido
  if (!permissionsLoading && !canAccessABM()) {
    return (
      <div className={modoOscuro ? 'min-h-screen bg-black text-white flex items-center justify-center' : 'min-h-screen bg-[#f5f5f7] text-gray-900 flex items-center justify-center'}>
        <div className={`rounded-2xl shadow-sm border p-8 max-w-md mx-4 ${box}`}>
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className={`text-base font-semibold mb-2 ${textPri}`}>Acceso restringido</h3>
            <p className={`mb-4 ${textSec}`}>
              No tienes permisos para acceder al panel de administración.
            </p>
            <button 
              onClick={() => window.history.back()} 
              className={modoOscuro ? 'bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm' : 'bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors text-sm'}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className={modoOscuro ? 'min-h-screen bg-black text-white flex items-center justify-center' : 'min-h-screen bg-[#f5f5f7] text-gray-900 flex items-center justify-center'}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${textSec}`}>Verificando permisos...</p>
          <p className={`text-sm ${textMuted}`}>Cargando información del plan</p>
        </div>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <div className={modoOscuro ? 'min-h-screen bg-black text-white flex items-center justify-center' : 'min-h-screen bg-[#f5f5f7] text-gray-900 flex items-center justify-center'}>
        <div className={`rounded-2xl shadow-sm border p-8 max-w-md mx-4 ${box}`}>
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${textPri}`}>Error al cargar permisos</h3>
            <p className={`mb-4 ${textSec}`}>{permissionsError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className={modoOscuro ? 'bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 text-sm' : 'bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black text-sm'}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={modoOscuro ? 'min-h-screen bg-black text-white flex items-center justify-center' : 'min-h-screen bg-[#f5f5f7] text-gray-900 flex items-center justify-center'}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p className={`text-sm font-medium ${textSec}`}>Cargando resumen administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                <FiBarChart className="w-4 h-4" />
              </div>
              <div>
                <h1 className={`text-2xl font-semibold ${textPri}`}>Panel administrador</h1>
                <p className={`text-xs ${textSec}`}>Resumen general de usuarios, empresas y actividad.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                {getSystemHealthIcon(stats.systemHealth)}
                {stats.systemHealth === 'healthy' ? 'Sistema estable' : stats.systemHealth === 'warning' ? 'Advertencia' : 'Crítico'}
              </span>
              <button 
                onClick={loadDashboardData}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${btnOut}`}
              >
                <FiClock className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`rounded-2xl p-3.5 shadow-sm border ${box}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                  <FiUsers className="w-4 h-4" />
                </div>
                {canManageUsers() && <span className={`text-xs ${textMuted}`}>Límite {getUserLimit()}</span>}
              </div>
              <div className={`text-xl font-semibold mb-0.5 ${textPri}`}>{stats.totalUsers.toLocaleString()}</div>
              <div className={`text-xs uppercase tracking-wide ${textSec}`}>Usuarios</div>
              {canManageUsers() && <div className={`mt-3 text-[11px] ${textSec}`}>{stats.totalUsers < getUserLimit() ? 'Dentro del límite' : 'Límite alcanzado'}</div>}
            </div>
            <div className={`rounded-2xl p-3.5 shadow-sm border ${box}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                  <FiBriefcase className="w-4 h-4" />
                </div>
                {canManageCompanies() && <span className={`text-xs ${textMuted}`}>Límite {getCompanyLimit()}</span>}
              </div>
              <div className={`text-xl font-semibold mb-0.5 ${textPri}`}>{stats.totalCompanies.toLocaleString()}</div>
              <div className={`text-xs uppercase tracking-wide ${textSec}`}>Empresas</div>
              {canManageCompanies() && <div className={`mt-3 text-[11px] ${textSec}`}>{stats.totalCompanies < getCompanyLimit() ? 'Dentro del límite' : 'Límite alcanzado'}</div>}
            </div>
            <div className={`rounded-2xl p-3.5 shadow-sm border ${box}`}>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                <FiFileText className="w-4 h-4" />
              </div>
              <div className={`text-xl font-semibold mb-0.5 ${textPri}`}>{stats.totalInvoices.toLocaleString()}</div>
              <div className={`text-xs uppercase tracking-wide ${textSec}`}>Registros</div>
              {stats.pendingInvoices > 0 && <div className={`mt-2 text-[11px] ${textSec}`}>{stats.pendingInvoices} pendientes</div>}
            </div>
            <div className={`rounded-2xl p-3.5 shadow-sm border ${box}`}>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
                <FiDollarSign className="w-4 h-4" />
              </div>
              <div className={`text-xl font-semibold mb-0.5 ${textPri}`}>
                ${stats.totalRevenue > 0 ? (stats.totalRevenue >= 1000000 ? (stats.totalRevenue / 1000000).toFixed(1) + 'M' : (stats.totalRevenue / 1000).toFixed(0) + 'K') : '0'}
              </div>
              <div className={`text-xs uppercase tracking-wide ${textSec}`}>Ingresos</div>
              <div className={`mt-2 text-[11px] ${textSec}`}>{stats.activeSubscriptions} suscripciones activas</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 shadow-sm border ${box}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPri}`}>
                <FiTrendingUp className="w-4 h-4" />
                Estado del sistema
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Estado general', value: stats.systemHealth === 'healthy' ? 'Saludable' : stats.systemHealth === 'warning' ? 'Advertencia' : 'Crítico', badge: true },
                  { label: 'Último backup', value: stats.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('es-ES') : 'No disponible' },
                  { label: 'Suscripciones activas', value: stats.activeSubscriptions },
                  { label: 'Ventas pendientes', value: stats.pendingInvoices > 0 ? `${stats.pendingInvoices} pendientes` : 'Al día' }
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg ${cardInner}`}>
                    <span className={`text-xs font-medium ${textSec}`}>{row.label}</span>
                    {row.badge ? (
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getSystemHealthColor(stats.systemHealth)}`}>
                        {getSystemHealthIcon(stats.systemHealth)}
                        {row.value}
                      </span>
                    ) : (
                      <span className={`text-xs ${textSec}`}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={`rounded-2xl p-4 shadow-sm border ${box}`}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textPri}`}>
                <FiClock className="w-4 h-4" />
                Actividad reciente
              </h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${cardInner}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                        <FiUsers className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${textPri}`}>{activity.action}</p>
                        <p className={`text-[11px] ${textMuted}`}>{activity.user} • {new Date(activity.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-6 text-xs ${textMuted}`}>
                    <FiClock className={`w-8 h-8 mx-auto mb-2 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p>No hay actividad reciente.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-5 shadow-sm border ${box}`}>
            <h3 className={`text-sm font-semibold mb-3 ${textPri}`}>Accesos rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {canManageUsers() && (
                <button className={`p-4 rounded-xl border transition-colors text-left ${quickCard}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <FiUsers className="w-4 h-4" />
                  </div>
                  <div className={`font-medium text-sm ${textPri}`}>Usuarios</div>
                  <div className={`text-xs ${textSec}`}>Agregar o editar usuarios.</div>
                </button>
              )}
              {canManageCompanies() && (
                <button className={`p-4 rounded-xl border transition-colors text-left ${quickCard}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <FiBriefcase className="w-4 h-4" />
                  </div>
                  <div className={`font-medium text-sm ${textPri}`}>Empresas</div>
                  <div className={`text-xs ${textSec}`}>Administrar empresas.</div>
                </button>
              )}
              {canManagePlans() && (
                <button className={`p-4 rounded-xl border transition-colors text-left ${quickCard}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <FiTrendingUp className="w-4 h-4" />
                  </div>
                  <div className={`font-medium text-sm ${textPri}`}>Planes</div>
                  <div className={`text-xs ${textSec}`}>Configurar planes.</div>
                </button>
              )}
              {canManageSystem() && (
                <button className={`p-4 rounded-xl border transition-colors text-left ${quickCard}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <FiBarChart className="w-4 h-4" />
                  </div>
                  <div className={`font-medium text-sm ${textPri}`}>Configuración</div>
                  <div className={`text-xs ${textSec}`}>Opciones del sistema.</div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
