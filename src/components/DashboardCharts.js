import React, { useContext } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../context/ThemeContext';

const DashboardCharts = ({ topClientes, ingresosPais, loading, onChartClick }) => {
  const { modoOscuro } = useContext(ThemeContext);
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`rounded-2xl shadow-xl p-6 border animate-pulse ${
          modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className={modoOscuro ? 'h-6 bg-gray-700 rounded mb-6' : 'h-6 bg-gray-200 rounded mb-6'}></div>
          <div className={modoOscuro ? 'h-80 bg-gray-700 rounded' : 'h-80 bg-gray-200 rounded'}></div>
        </div>
        <div className={`rounded-2xl shadow-xl p-6 border animate-pulse ${
          modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className={modoOscuro ? 'h-6 bg-gray-700 rounded mb-6' : 'h-6 bg-gray-200 rounded mb-6'}></div>
          <div className={modoOscuro ? 'h-80 bg-gray-700 rounded' : 'h-80 bg-gray-200 rounded'}></div>
        </div>
      </div>
    );
  }

  const colores = ['#2563eb', '#059669', '#f59e42', '#e11d48', '#a21caf', '#0ea5e9', '#fbbf24'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0);
  };

  // Preparar datos para el gráfico de ingresos por país
  const datosIngresosPais = ingresosPais?.map((item, index) => ({
    ...item,
    color: colores[index % colores.length]
  })) || [];

  // Preparar datos para el gráfico de distribución de clientes
  const datosClientes = topClientes?.map((item, index) => ({
    ...item,
    color: colores[index % colores.length]
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Gráfico de barras - Ingresos por país */}
      <div className={`rounded-2xl shadow-xl p-6 border ${modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-2 mb-6">
          <GlobeAltIcon className="h-6 w-6 text-green-500" />
          <h3 className={`text-lg font-bold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>Ingresos por País</h3>
        </div>
        
        {datosIngresosPais.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={datosIngresosPais} 
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={modoOscuro ? '#4b5563' : '#e5e7eb'}
                vertical={false}
              />
              <XAxis 
                dataKey="pais" 
                stroke={modoOscuro ? '#9ca3af' : '#6b7280'}
                tick={{ fill: modoOscuro ? '#d1d5db' : '#6b7280', fontSize: 12 }} 
              />
              <YAxis 
                stroke={modoOscuro ? '#9ca3af' : '#6b7280'}
                tick={{ fill: modoOscuro ? '#d1d5db' : '#6b7280', fontSize: 12 }} 
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Ingresos']}
                contentStyle={{
                  backgroundColor: modoOscuro ? '#020617' : '#ffffff',
                  border: `1px solid ${modoOscuro ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  color: modoOscuro ? '#e5e7eb' : '#0f172a',
                  boxShadow: '0 4px 24px 0 rgba(15,23,42,0.24)'
                }}
                itemStyle={{
                  color: modoOscuro ? '#e5e7eb' : '#0f172a'
                }}
                labelStyle={{
                  color: modoOscuro ? '#e5e7eb' : '#4b5563'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={24}
                formatter={(value) => (
                  <span className={`text-xs ${modoOscuro ? 'text-gray-300' : 'text-gray-600'}`}>{value}</span>
                )}
              />
              <Bar 
                dataKey="total" 
                radius={[10, 10, 0, 0]} 
                barSize={32}
                fill="url(#ingresosGradient)"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-80 flex items-center justify-center ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-center">
              <GlobeAltIcon className={`h-16 w-16 mx-auto mb-4 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
              <p>No hay datos de ingresos por país</p>
              <p className="text-sm">Registrá ventas para ver las estadísticas</p>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de dona - Distribución por cliente */}
      <div
        className={`rounded-2xl shadow-xl p-6 border cursor-pointer hover:shadow-2xl transition-all duration-300 ${
          modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
        }`}
        onClick={() => onChartClick('clientes')}
        title="Ver distribución completa de clientes"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-blue-500" />
            <h3 className={`text-lg font-bold ${modoOscuro ? 'text-white' : 'text-gray-900'}`}>Distribución por Cliente</h3>
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
            modoOscuro ? 'text-purple-200 bg-purple-900/40' : 'text-purple-600 bg-purple-100'
          }`}>
            Ver detalle
          </div>
        </div>
        
        {datosClientes.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <defs>
                <linearGradient id="clientesGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <Pie 
                data={datosClientes} 
                dataKey="total" 
                nameKey="cliente" 
                cx="50%" 
                cy="50%" 
                innerRadius={60}
                outerRadius={110} 
                paddingAngle={2}
                label={(props) => {
                  const { cliente, percent, cx, cy, midAngle, outerRadius } = props;
                  const nombre = (cliente || '').length > 12 
                    ? `${cliente.substring(0, 12)}…` 
                    : cliente;
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 8;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const fill = modoOscuro ? '#e5e7eb' : '#111827';
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={fill}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize={11}
                    >
                      {`${nombre} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                labelLine={false}
              >
                {datosClientes.map((entry, index) => (
                  <Cell 
                    key={entry.cliente || index} 
                    fill={entry.color || 'url(#clientesGradient)'} 
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  formatCurrency(value),
                  props?.payload?.cliente || 'Cliente'
                ]}
                contentStyle={{
                  backgroundColor: modoOscuro ? '#020617' : '#ffffff',
                  border: `1px solid ${modoOscuro ? '#334155' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  color: modoOscuro ? '#e5e7eb' : '#000000',
                  boxShadow: '0 4px 24px 0 rgba(15,23,42,0.24)'
                }}
                itemStyle={{
                  color: modoOscuro ? '#e5e7eb' : '#0f172a'
                }}
                labelStyle={{
                  color: modoOscuro ? '#e5e7eb' : '#4b5563'
                }}
              />
              <Legend 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                formatter={(value) => (
                  <span className={`text-xs ${modoOscuro ? 'text-gray-300' : 'text-gray-600'}`}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-80 flex items-center justify-center ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-center">
              <UserGroupIcon className={`h-16 w-16 mx-auto mb-4 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
              <p>No hay datos de clientes</p>
              <p className="text-sm">Registrá ventas para ver las estadísticas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
