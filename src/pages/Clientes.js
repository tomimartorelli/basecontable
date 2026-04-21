import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useApi } from '../hooks/useApi';
import SkeletonLoader from '../components/SkeletonLoader';

const camposIniciales = {
  razonSocial: "",
  domicilio: "",
  pais: "",
  localidad: "",
  email: "",
  telefono: "",
};

const Clientes = () => {
  const { token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState(camposIniciales);
  const [editId, setEditId] = useState(null); // Usar _id de MongoDB
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState('listado');
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const { secureFetch } = useApi();
  const [offlineMsg, setOfflineMsg] = useState("");

  // Obtener clientes del backend
  const fetchClientes = async () => {
    setLoading(true);
    setError("");
    try {
      console.log('🔍 Clientes: Iniciando fetch de clientes...');
      const res = await secureFetch("/api/clients");
      console.log('🔍 Clientes: Respuesta del servidor:', res);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Clientes: Error del servidor:', errorData);
        throw new Error("Error al obtener clientes");
      }
      
      const data = await res.json();
      console.log('✅ Clientes: Datos recibidos:', data);
      console.log('✅ Clientes: Cantidad de clientes:', data.length);
      
      setClientes(data);
      setClientesFiltrados(data);
    } catch (err) {
      console.error('❌ Clientes: Error en fetchClientes:', err);
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchClientes();
    // eslint-disable-next-line
  }, [token]);

  // Filtrar clientes
  const filtrarClientes = (termino) => {
    if (!termino.trim()) {
      setClientesFiltrados(clientes);
      return;
    }
    const filtrados = clientes.filter(cliente =>
      cliente.razonSocial.toLowerCase().includes(termino.toLowerCase()) ||
      cliente.email.toLowerCase().includes(termino.toLowerCase()) ||
      cliente.pais.toLowerCase().includes(termino.toLowerCase())
    );
    setClientesFiltrados(filtrados);
  };

  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    filtrarClientes(valor);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  // Función para registrar actividad
  const registrarActividad = async (accion, detalles) => {
    try {
      await secureFetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: accion, details: detalles })
      });
    } catch (err) {}
  };

  // Utilidad para mostrar cambios entre dos objetos cliente
  const obtenerCambiosCliente = (antes, despues) => {
    if (!antes || !despues) return '';
    const campos = [
      { key: 'razonSocial', label: 'Razón social' },
      { key: 'pais', label: 'País' },
      { key: 'localidad', label: 'Localidad' },
      { key: 'email', label: 'Email' },
      { key: 'domicilio', label: 'Domicilio' },
      { key: 'telefono', label: 'Teléfono' }
    ];
    let cambios = [];
    campos.forEach(({key, label}) => {
      if ((antes[key] || '') !== (despues[key] || '')) {
        cambios.push(`• ${label}: ${antes[key] || '-'} → ${despues[key] || '-'}`);
      }
    });
    return cambios.length ? cambios.join('\n') : 'Sin cambios relevantes';
  };

  // Crear o editar cliente
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.razonSocial.trim() || !form.pais.trim() || !form.email.trim()) {
      setError("Los campos Razón social, País y Email son obligatorios.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setOfflineMsg("");
    try {
      let res, data;
      if (editId) {
        // Editar
        const clienteAntes = clientes.find(c => c._id === editId);
        res = await secureFetch(`/api/clients/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al editar cliente");
        setSuccess("Cliente editado correctamente.");
        if (data.offline) setOfflineMsg(data.message || "La acción se guardó offline y se sincronizará cuando vuelvas a tener internet.");
        registrarActividad(
          'Editar cliente',
          `Cliente ${clienteAntes?.razonSocial} editado\n${obtenerCambiosCliente(clienteAntes, form)}`
        );
      } else {
        // Crear
        res = await secureFetch("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al agregar cliente");
        setSuccess("Cliente agregado correctamente.");
        if (data.offline) setOfflineMsg(data.message || "La acción se guardó offline y se sincronizará cuando vuelvas a tener internet.");
        registrarActividad(
          'Crear cliente',
          `Cliente ${form.razonSocial} creado\n• Email: ${form.email}\n• País: ${form.pais}`
        );
      }
      setForm(camposIniciales);
      setEditId(null);
      fetchClientes();
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const clienteEliminado = clientes.find(c => c._id === id);
      const res = await secureFetch(`/api/clients/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error al eliminar cliente");
      setSuccess("Cliente eliminado correctamente.");
      if (editId === id) {
        setEditId(null);
        setForm(camposIniciales);
      }
      registrarActividad(
        'Eliminar cliente',
        `Cliente ${clienteEliminado?.razonSocial} eliminado\n• Email: ${clienteEliminado?.email}\n• País: ${clienteEliminado?.pais}`
      );
      fetchClientes();
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Editar cliente (cargar datos en el form)
  const handleEditar = idx => {
    const cliente = clientesFiltrados[idx];
    setForm({ ...cliente });
    setEditId(cliente._id);
    setError("");
    setSuccess("");
    setTab('crear');
  };

  const handleCancelar = () => {
    setForm(camposIniciales);
    setEditId(null);
    setError("");
    setSuccess("");
  };

  const exportarClientesCsv = async () => {
    setExportingCsv(true);
    setError("");
    try {
      const res = await secureFetch('/api/export/clientes');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al exportar');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clientes.csv';
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Exportación descargada (clientes.csv).');
    } catch (err) {
      setError(err.message || 'Error al exportar');
    } finally {
      setExportingCsv(false);
    }
  };

  // Criterio unificado: modo oscuro = contenedores oscuros + texto blanco
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900 focus:border-gray-900';
  const emptyBox = modoOscuro ? 'bg-gray-800/50 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-600';
  const tabInactive = modoOscuro ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  const btnSec = modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-gray-900 hover:bg-gray-50';
  const labelClass = modoOscuro ? 'text-gray-400' : 'text-gray-700';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600';
  const tableRow = modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50/80';
  const badge = modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-100';

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Header minimal */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'} text-white`}>
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-semibold mb-1 ${textPri}`}>
                Clientes
              </h1>
              <p className={`text-xs sm:text-sm ${textSec}`}>
                Listado y alta de clientes en un solo lugar.
              </p>
            </div>
          </div>
        </div>
        {/* Mensajes de estado modernizados */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-semibold text-green-800">{success}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="font-semibold text-red-800">{error}</span>
            </div>
          </div>
        )}

      {offlineMsg && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="font-semibold text-yellow-800">{offlineMsg}</span>
            </div>
          </div>
        )}
        {/* Tabs minimalistas */}
        <div className="mb-6 lg:mb-8">
          <div className={`rounded-2xl p-2 shadow-sm border w-full ${box}`}>
            <div className="flex space-x-2">
              <button
                onClick={() => { setTab('listado'); setEditId(null); setForm(camposIniciales); }}
                className={`flex-1 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  tab === 'listado'
                    ? 'bg-[#1F80FF] text-white shadow-md'
                    : tabInactive
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Listado
              </button>
              <button
                onClick={() => { setTab('crear'); setEditId(null); setForm(camposIniciales); }}
                className={`flex-1 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  tab === 'crear'
                    ? 'bg-[#1F80FF] text-white shadow-md'
                    : tabInactive
                }`}
              >
                <svg className="w-5 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {editId ? 'Editar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      {/* Contenido de tabs */}
      {tab === 'listado' && (
          <div className={`rounded-2xl shadow-sm border overflow-hidden w-full ${box}`}>
        {/* Header de la sección */}
            <div className={`border-b p-4 sm:p-5 ${divide}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold ${modoOscuro ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'}`}>
                    CL
                  </div>
                  <div className="space-y-1">
                    <h2 className={`text-base sm:text-lg font-semibold ${textPri}`}>Listado de clientes</h2>
                    <p className={`text-xs ${textMuted}`}>Todos los clientes registrados en tu cuenta.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm">
                    <div className={`font-semibold ${textPri}`}>{clientesFiltrados.length} clientes</div>
                  </div>
                  <button
                    type="button"
                    onClick={exportarClientesCsv}
                    disabled={exportingCsv}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs sm:text-sm disabled:opacity-50 ${btnOut}`}
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

            <div className="p-4 sm:p-6">
              {/* Buscador modernizado */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por razón social, email o país..."
                value={busqueda}
                onChange={handleBusqueda}
                    className={`w-full border rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 pl-9 sm:pl-10 focus:ring-2 transition-all duration-150 text-sm ${inputClass}`}
              />
                  <svg className={`absolute left-3.5 top-2.5 sm:left-4 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {busqueda && (
                  <div className={`text-xs sm:text-sm mt-2 font-medium ${textSec}`}>
                {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} encontrado{clientesFiltrados.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {loading ? (
            <SkeletonLoader lines={6} width="w-full" height="h-5" className="mb-2" />
          ) : clientesFiltrados.length === 0 ? (
                <div className={`py-10 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl ${emptyBox}`}>
              <svg className={`w-10 h-10 mb-3 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {busqueda ? (
                <>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No se encontraron clientes para “{busqueda}”.
                  </p>
                      <span className="text-xs text-gray-600">Probá con otros términos o limpiá el filtro.</span>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Todavía no hay clientes cargados.
                  </p>
                      <span className="text-xs text-gray-600 mb-4">Cuando agregues clientes, van a aparecer acá.</span>
                </>
              )}
            </div>
          ) : (
            <>
                  {/* Vista tipo tarjeta para mobile, más sobria */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                {clientesFiltrados.map((c, idx) => (
                      <div key={c._id || idx} className={`rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${box}`}>
                        {/* Header de la tarjeta */}
                        <div className={`p-4 border-b ${modoOscuro ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                                <span className="text-white font-bold text-sm">
                                  {c.razonSocial.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className={`font-semibold text-sm ${textPri}`}>{c.razonSocial}</h3>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge}`}>
                                  {c.pais}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contenido de la tarjeta */}
                        <div className="p-4 space-y-2">
                          {c.localidad && (
                            <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                              <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span><span className="font-medium">Localidad:</span> {c.localidad}</span>
                            </div>
                          )}
                          {c.email && (
                            <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                              <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span><span className="font-medium">Email:</span> {c.email}</span>
                            </div>
                          )}
                          {c.domicilio && (
                            <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                              <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span><span className="font-medium">Domicilio:</span> {c.domicilio}</span>
                            </div>
                          )}
                          {c.telefono && (
                            <div className={`flex items-center gap-2 text-xs ${textSec}`}>
                              <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span><span className="font-medium">Teléfono:</span> {c.telefono}</span>
                    </div>
                          )}
                    </div>
                        
                        {/* Acciones de la tarjeta */}
                        <div className="px-4 pb-4 flex gap-2">
                          <button 
                            onClick={() => handleEditar(idx)} 
                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 ${btnSec}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button 
                            onClick={() => handleEliminar(c._id)} 
                            className={`flex-1 border px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 ${btnOut}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                    </div>
                  </div>
                ))}
              </div>
                  {/* Tabla solo en escritorio/tablet, estilo minimal */}
              <div className="overflow-x-auto hidden md:block">
                    <div className={`rounded-2xl border shadow-sm overflow-hidden ${box}`}>
                      <table className="w-full">
                  <thead>
                          <tr className={`text-xs ${tableHead}`}>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>Razón Social</th>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>País</th>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>Localidad</th>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>Email</th>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>Domicilio</th>
                            <th className={`py-4 px-6 text-left font-semibold ${textPri}`}>Teléfono</th>
                            <th className={`py-4 px-6 text-center font-semibold ${textPri}`}>Acciones</th>
                    </tr>
                  </thead>
                        <tbody className={`divide-y text-sm ${divideY}`}>
                    {clientesFiltrados.map((c, idx) => (
                            <tr key={c._id || idx} className={`transition-colors ${tableRow}`}>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                                    <span className="text-white font-bold text-xs">
                                      {c.razonSocial.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className={`font-medium text-sm ${textPri}`}>{c.razonSocial}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                                  {c.pais}
                                </span>
                              </td>
                              <td className={`py-4 px-6 ${textSec}`}>{c.localidad || '-'}</td>
                              <td className={`py-4 px-6 ${textSec}`}>{c.email}</td>
                              <td className={`py-4 px-6 ${textSec}`}>{c.domicilio || '-'}</td>
                              <td className={`py-4 px-6 ${textSec}`}>{c.telefono || '-'}</td>
                              <td className="py-4 px-6 text-center">
                                <div className="inline-flex items-center gap-2">
                                  <button 
                                    onClick={() => handleEditar(idx)} 
                                    className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold ${btnSec}`}
                                  >
                                    Editar
                                  </button>
                                  <button 
                                    onClick={() => handleEliminar(c._id)} 
                                    className={`px-3 py-1.5 border rounded-lg transition-colors text-xs font-semibold ${btnOut}`}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                    </div>
              </div>
            </>
          )}
            </div>
        </div>
      )}
      {tab === 'crear' && (
          <div className={`rounded-2xl shadow-sm border overflow-hidden w-full ${box}`}>
        {/* Header de la sección */}
            <div className={`border-b p-4 sm:p-5 ${divide}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'} text-white`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-base sm:text-lg font-semibold ${textPri}`}>{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                  <p className={`text-xs ${textMuted}`}>
                    {editId ? 'Actualizá los datos del cliente.' : 'Completá solo lo necesario para empezar.'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              <form className="space-y-6 w-full" onSubmit={handleSubmit} autoComplete="off">
                {/* Sección: Información Principal */}
                <div className={`rounded-2xl p-5 border ${box}`}>
                  <div className="mb-4">
                    <h3 className={`text-sm font-semibold ${textPri}`}>Información principal</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>Razón social *</label>
                      <input 
                        name="razonSocial" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.razonSocial} 
                        onChange={handleChange} 
                        placeholder="Nombre de la empresa o cliente"
                        required 
                      />
            </div>
            <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>País *</label>
                      <input 
                        name="pais" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.pais} 
                        onChange={handleChange} 
                        placeholder="País de origen"
                        required 
                      />
            </div>
            <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>Email *</label>
                      <input 
                        name="email" 
                        type="email" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.email} 
                        onChange={handleChange} 
                        placeholder="correo@ejemplo.com"
                        required 
                      />
            </div>
            <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>Localidad</label>
                      <input 
                        name="localidad" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.localidad} 
                        onChange={handleChange} 
                        placeholder="Ciudad o localidad"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Información de contacto */}
                <div className={`rounded-2xl p-5 border ${box}`}>
                  <div className="mb-4">
                    <h3 className={`text-sm font-semibold ${textPri}`}>Información de contacto</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>Domicilio</label>
                      <input 
                        name="domicilio" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.domicilio} 
                        onChange={handleChange} 
                        placeholder="Dirección completa"
                      />
            </div>
            <div>
                      <label className={`block mb-1 text-xs font-medium ${labelClass}`}>Teléfono</label>
                      <input 
                        name="telefono" 
                        className={`w-full border rounded-xl p-4 focus:ring-2 transition-all duration-200 shadow-sm ${inputClass}`}
                        value={form.telefono} 
                        onChange={handleChange} 
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
            </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-end pt-4">
                  <button 
                    type="submit" 
                    className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-150 w-full sm:w-auto text-sm font-semibold flex items-center justify-center gap-2" 
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {editId ? "Guardar cambios" : "Agregar cliente"}
              </button>
                  
              {editId && (
                    <button 
                      type="button" 
                      onClick={handleCancelar} 
                      className={`px-6 py-2.5 rounded-xl transition-all duration-150 w-full sm:w-auto text-sm font-semibold flex items-center justify-center gap-2 ${btnSec}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelar
                    </button>
                  )}
            </div>
          </form>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Clientes; 