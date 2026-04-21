import React from 'react';

const DashboardDebug = ({ stats, user, token, loading, error, dataCycle, isFetching, shouldAutoFetch }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-3">🔍 DEBUG DASHBOARD</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Información del usuario */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-gray-800 mb-2">👤 USUARIO ACTUAL</h4>
          <div className="space-y-1 text-gray-600">
            <div><strong>Email:</strong> {user?.email || 'No disponible'}</div>
            <div><strong>ID:</strong> {user?.id || user?._id || 'No disponible'}</div>
            <div><strong>Empresa ID:</strong> {user?.empresaId || user?.empresa?.id || 'No disponible'}</div>
            <div><strong>Plan:</strong> {user?.currentPlan?.name || 'No disponible'}</div>
            <div><strong>Token:</strong> {token ? `${token.substring(0, 30)}...` : 'No hay token'}</div>
          </div>
        </div>

        {/* Estado del componente */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-gray-800 mb-2">📊 ESTADO DEL COMPONENTE</h4>
          <div className="space-y-1 text-gray-600">
            <div><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'Ninguno'}</div>
            <div><strong>Stats cargados:</strong> {stats ? 'Sí' : 'No'}</div>
            <div><strong>Fetch en progreso:</strong> {isFetching ? 'Sí' : 'No'}</div>
            <div><strong>Auto-fetch:</strong> {shouldAutoFetch ? '🟢 Activado' : '🔴 Desactivado'}</div>
          </div>
        </div>

        {/* Ciclo de datos */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-gray-800 mb-2">🔄 CICLO DE DATOS</h4>
          <div className="space-y-1 text-gray-600">
            <div><strong>Fetchs totales:</strong> {dataCycle?.fetchCount || 0}</div>
            <div><strong>Cache hits:</strong> {dataCycle?.cacheHits || 0}</div>
            <div><strong>Cache misses:</strong> {dataCycle?.cacheMisses || 0}</div>
            <div><strong>Reintentos:</strong> {dataCycle?.retryCount || 0}/{dataCycle?.maxRetries || 3}</div>
            <div><strong>Último fetch:</strong> {dataCycle?.lastFetch ? new Date(dataCycle.lastFetch).toLocaleTimeString() : 'Nunca'}</div>
            <div><strong>Último éxito:</strong> {dataCycle?.lastSuccess ? new Date(dataCycle.lastSuccess).toLocaleTimeString() : 'Nunca'}</div>
            <div><strong>Último error:</strong> {dataCycle?.lastError ? new Date(dataCycle.lastError).toLocaleTimeString() : 'Nunca'}</div>
          </div>
        </div>

        {/* Datos recibidos */}
        <div className="bg-white p-3 rounded border md:col-span-2">
          <h4 className="font-semibold text-gray-800 mb-2">📈 DATOS RECIBIDOS</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Total registros de venta</div>
              <div className="text-lg">{stats?.resumen?.totalFacturas || 0}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Total Ingresos</div>
              <div className="text-lg">{stats?.resumen?.totalIngresos || 0}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Clientes Únicos</div>
              <div className="text-lg">{stats?.resumen?.clientesUnicos || 0}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Registros del mes</div>
              <div className="text-lg">{stats?.resumen?.facturasMes || 0}</div>
            </div>
          </div>
          
          {/* Detalles adicionales */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Facturas Impagas</div>
              <div>Cantidad: {stats?.impagas?.cantidad || 0}</div>
              <div>Monto: {stats?.impagas?.monto || 0}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-semibold">Top Clientes</div>
              <div>Cantidad: {stats?.topClientes?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Análisis de datos */}
        <div className="bg-white p-3 rounded border md:col-span-2">
          <h4 className="font-semibold text-gray-800 mb-2">🔍 ANÁLISIS DE DATOS</h4>
          <div className="space-y-2 text-sm">
            {stats?.resumen?.totalIngresos > 1000000 && (
              <div className="text-red-600 font-semibold">
                ⚠️ INGRESOS SOSPECHOSOS: ${stats.resumen.totalIngresos} - Posiblemente datos de otro usuario
              </div>
            )}
            {stats?.resumen?.totalFacturas > 10000 && (
              <div className="text-red-600 font-semibold">
                ⚠️ REGISTROS SOSPECHOSOS: {stats.resumen.totalFacturas} - Posiblemente datos de otro usuario
              </div>
            )}
            {stats?.resumen?.clientesUnicos > 1000 && (
              <div className="text-red-600 font-semibold">
                ⚠️ CLIENTES SOSPECHOSOS: {stats.resumen.clientesUnicos} - Posiblemente datos de otro usuario
              </div>
            )}
            {(!stats?.resumen?.totalFacturas || stats.resumen.totalFacturas === 0) && 
             (!stats?.resumen?.totalIngresos || stats.resumen.totalIngresos === 0) && (
              <div className="text-green-600 font-semibold">
                ✅ DATOS CORRECTOS: No hay ventas ni ingresos (usuario nuevo)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardDebug;
