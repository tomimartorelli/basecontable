import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FacturaForm from "../components/FacturaForm";
import { AuthContext } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { ThemeContext } from '../context/ThemeContext';

// Hook personalizado para debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};


const FacturaDetalleModal = ({ factura, onClose, modoOscuro, onEnviarRecordatorio, onEnviarEmail }) => {
  if (!factura) return null;
  
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const cardInner = modoOscuro ? 'bg-gray-800' : 'bg-gray-50';
  const btnPrimary = modoOscuro ? 'bg-[#1F80FF] hover:bg-blue-600 text-white' : 'bg-[#1F80FF] hover:bg-blue-700 text-white';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-gray-900 hover:bg-gray-50';
  const puedeRecordatorio = factura.estadoPago !== 'pagada' && factura.email;
  const puedeEmail = !!factura.email;

  const handleDescargarAdjunto = () => {
    if (!factura._id || !factura.adjunto) return;
    window.open(`/api/invoices/${factura._id}/adjunto`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`rounded-2xl shadow-2xl max-w-2xl w-full mx-4 relative overflow-hidden border ${box}`}>
        {/* Header del modal */}
        <div className={`border-b p-5 ${divide}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${textPri}`}>Detalle del registro de venta</h2>
                <p className={`text-xs ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}>Registro #{factura.numero}</p>
              </div>
            </div>
            <button
              onClick={onClose} 
              className={modoOscuro ? 'w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors text-white' : 'w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors text-gray-700'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 space-y-6">
          {/* Información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${box}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${textPri}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Información del Cliente
                </h3>
                <div className={`space-y-2 text-xs sm:text-sm ${textSec}`}>
                  <div><span className="font-medium">Razón social:</span> {factura.razonSocial}</div>
                  <div><span className="font-medium">País:</span> {factura.pais}</div>
                  <div><span className="font-medium">Email:</span> {factura.email}</div>
                  <div><span className="font-medium">Domicilio:</span> {factura.domicilio}</div>
                  <div><span className="font-medium">Localidad:</span> {factura.localidad}</div>
                  <div><span className="font-medium">Teléfono:</span> {factura.telefono}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${box}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${textPri}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Detalles del registro
                </h3>
                <div className={`space-y-3 text-xs sm:text-sm ${textSec}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Número:</span>
                    <div className={`rounded-lg px-3 py-1 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                      <span className="text-white font-mono font-semibold text-xs sm:text-sm tracking-wide">#{factura.numero}</span>
                    </div>
                  </div>
                  <div><span className="font-medium">Fecha:</span> {factura.fecha}</div>
                  <div><span className="font-medium">Tipo:</span> {factura.tipo}</div>
                  <div className={`pt-2 border-t ${divide}`}>
                    <span className={`font-semibold text-base sm:text-lg ${textPri}`}>Total: ${factura.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conceptos */}
          <div className={`p-4 rounded-xl border ${box}`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${textPri}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Conceptos
            </h3>
            <div className="space-y-2">
              {factura.conceptos && factura.conceptos.map((c, i) => (
                <div key={i} className={`flex justify-between items-center py-2 px-3 rounded-lg ${cardInner}`}>
                  <span className={`text-sm ${modoOscuro ? 'text-gray-200' : 'text-gray-800'}`}>{c.detalle}</span>
                  <span className={`font-semibold text-sm ${textPri}`}>${c.importe}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Adjunto si existe */}
          {factura.adjunto && (
            <div className={`p-4 rounded-xl border ${box}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${textPri}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Archivo Adjunto
              </h3>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-medium truncate max-w-xs ${textSec}`}>{factura.adjunto}</span>
                <button
                  className={modoOscuro ? 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm font-semibold' : 'px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold'}
                  onClick={handleDescargarAdjunto}
                >
                  Descargar
                </button>
              </div>
          </div>
        )}

          {/* Acciones: enviar por email y recordatorio de cobro */}
          <div className={`p-4 rounded-xl border ${box}`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${textPri}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar al cliente
            </h3>
            <div className="flex flex-wrap gap-2">
              {onEnviarEmail && (
                <button
                  type="button"
                  disabled={!puedeEmail}
                  onClick={() => onEnviarEmail(factura._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${puedeEmail ? btnOut : 'opacity-50 cursor-not-allowed border-gray-500 text-gray-500'}`}
                  title={puedeEmail ? 'Enviar comprobante por email' : 'Este registro no tiene email de cliente'}
                >
                  Enviar comprobante
                </button>
              )}
              {onEnviarRecordatorio && (
                <button
                  type="button"
                  disabled={!puedeRecordatorio}
                  onClick={() => onEnviarRecordatorio(factura._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${puedeRecordatorio ? btnPrimary : 'opacity-50 cursor-not-allowed border-gray-500 text-gray-500'}`}
                  title={puedeRecordatorio ? 'Enviar recordatorio de cobro por email' : factura.estadoPago === 'pagada' ? 'Ya está pagado' : 'Este registro no tiene email de cliente'}
                >
                  Recordatorio de cobro
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Facturas = () => {
  const { user, token } = useContext(AuthContext);
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hook de permisos de administración
  // const { canAccessABM, getABMAccessLevel, userPlan } = useAdminPermissions();

  const [facturas, setFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);

  // Determinar tab inicial según query param (?tab=crear) para mejorar el flujo desde Inicio
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'crear' ? 'crear' : 'listado';
  const [tab, setTab] = useState(initialTab);
  const [, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [nuevaFacturaId, setNuevaFacturaId] = useState(null);
  const [nuevaAdjunto, setNuevaAdjunto] = useState(null);
  const [nuevaAdjuntoInfo, setNuevaAdjuntoInfo] = useState(null);
  const nuevaFileInputRef = useRef();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  
  // Debounce para la búsqueda
  const debouncedBusqueda = useDebounce(busqueda, 300);

  const fetchFacturas = useCallback(async () => {
    if (!user || !token) return;
    
    // Evitar múltiples llamadas simultáneas
    if (isFetching) {
      console.log('🔄 FACTURAS: Ya se está haciendo fetch, ignorando llamada duplicada');
      return;
    }
    
    setIsFetching(true);
    setLoading(true);
    setError("");
    try {
      // Obtener ID del usuario para filtrar datos
      const userId = user?.id || user?._id;
      const empresaId = user?.empresaId || user?.empresa?.id;
      
      if (!userId) {
        throw new Error('No se pudo identificar al usuario');
      }
      
      // Construir URL con filtros de usuario - FORZAR SIEMPRE
      const invoicesUrl = `/api/invoices?userId=${userId}&forceUserFilter=true&preventGlobalData=true&userSpecificOnly=true`;
      
      // Headers personalizados para forzar filtro de usuario
      const userSpecificHeaders = {
        'X-Force-User-Filter': 'true',
        'X-Prevent-Global-Data': 'true',
        'X-User-Specific-Only': 'true'
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 FACTURAS: Obteniendo facturas para usuario:', {
          user: user?.email,
          userId,
          empresaId,
          url: invoicesUrl
        });
      }
      
      const res = await secureFetch(invoicesUrl, { headers: userSpecificHeaders });
      if (!res.ok) throw new Error("Error al obtener facturas");
      const data = await res.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ FACTURAS: Datos recibidos y validados:', {
          cantidad: data.length,
          usuario: user?.email
        });
      }
      
      setFacturas(data);
      setFacturasFiltradas(data);
    } catch (err) {
      setError(err.message || "Error de conexión");
      console.error('❌ FACTURAS: Error al cargar facturas:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user, token, secureFetch, isFetching]);

  useEffect(() => {
    if (token) fetchFacturas();
    // eslint-disable-next-line
  }, [token]);

  // Clientes únicos para filtro (razonSocial)
  const clientesUnicos = useMemo(() => {
    const set = new Set();
    facturas.forEach(f => {
      const name = (f.razonSocial || '').trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facturas]);

  useEffect(() => {
    let filtradas = facturas;
    if (filtroEstado !== 'todas') {
      filtradas = filtradas.filter(f => f.estadoPago === filtroEstado);
    }
    if (filtroCategoria) {
      filtradas = filtradas.filter(f => (f.categoria || '') === filtroCategoria);
    }
    if (filtroCliente) {
      filtradas = filtradas.filter(f => (f.razonSocial || '').trim() === filtroCliente);
    }
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde);
      desde.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(f => new Date(f.fecha) >= desde);
    }
    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(f => new Date(f.fecha) <= hasta);
    }
    if (debouncedBusqueda.trim()) {
      filtradas = filtradas.filter(factura =>
        factura.numero.toString().toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
        (factura.razonSocial || '').toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
        (factura.pais || '').toLowerCase().includes(debouncedBusqueda.toLowerCase())
      );
    }
    // Ordenar de mayor a menor por número (numérico robusto), y por fecha descendente si hay empate o error
    filtradas = filtradas.slice().sort((a, b) => {
      const numA = parseInt(a.numero, 10);
      const numB = parseInt(b.numero, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numB !== numA) return numB - numA;
      } else if (!isNaN(numA)) {
        return -1;
      } else if (!isNaN(numB)) {
        return 1;
      }
      const fechaA = new Date(a.fecha);
      const fechaB = new Date(b.fecha);
      return fechaB - fechaA;
    });
    setFacturasFiltradas(filtradas);
  }, [facturas, filtroEstado, filtroCategoria, filtroCliente, filtroFechaDesde, filtroFechaHasta, debouncedBusqueda]);

  // Filtrado se realiza por debounce en useEffect; función auxiliar removida por no uso

  const handleBusqueda = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    // El filtrado se hace automáticamente con debounce en el useEffect
  };

  const registrarActividad = async (accion, detalles) => {
    try {
      await secureFetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: accion, details: detalles })
      });
    } catch (err) {}
  };

  // Utilidad para mostrar cambios entre dos objetos factura
  const obtenerCambiosFactura = (antes, despues) => {
    if (!antes || !despues) return '';
    const campos = [
      { key: 'numero', label: 'Número' },
      { key: 'razonSocial', label: 'Razón social' },
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'total', label: 'Total' },
      { key: 'pais', label: 'País' },
      { key: 'email', label: 'Email' },
      { key: 'domicilio', label: 'Domicilio' },
      { key: 'localidad', label: 'Localidad' },
      { key: 'telefono', label: 'Teléfono' }
    ];
    let cambios = [];
    campos.forEach(({key, label}) => {
      if (antes[key] !== despues[key]) {
        cambios.push(`• ${label}: ${antes[key] || '-'} → ${despues[key] || '-'}`);
      }
    });
    // Conceptos
    if (JSON.stringify(antes.conceptos) !== JSON.stringify(despues.conceptos)) {
      cambios.push('• Conceptos: Modificados');
    }
    return cambios.length ? cambios.join('\n') : 'Sin cambios relevantes';
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro de venta?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const facturaEliminada = facturas.find(f => f._id === id);
      const res = await secureFetch(`/api/invoices/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar factura");
      setSuccess("Registro eliminado correctamente.");
      if (editId === id) {
        setEditId(null);
        setEditData(null);
      }
      registrarActividad(
        'Eliminar registro',
        `Registro N°${facturaEliminada?.numero} eliminado\n• Cliente: ${facturaEliminada?.razonSocial}\n• Total: $${facturaEliminada?.total}`
      );
      fetchFacturas();
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = idx => {
    const factura = facturasFiltradas[idx];
    setEditId(factura._id);
    setEditData({ ...factura });
    setSuccess("");
    setTab('crear');
  };

  const handleCancelarEdicion = () => {
    setEditId(null);
    setEditData(null);
    setSuccess("");
    setError("");
  };

  const handleGuardarEdicion = async (facturaEditada) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const facturaAntes = facturas.find(f => f._id === editId);
      const res = await secureFetch(`/api/invoices/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(facturaEditada),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al editar el registro de venta");
      setSuccess("Registro de venta actualizado correctamente.");
      setEditId(null);
      setEditData(null);
      registrarActividad(
        'Editar registro',
        `Registro N°${facturaAntes?.numero} actualizado\n${obtenerCambiosFactura(facturaAntes, facturaEditada)}`
      );
      fetchFacturas();
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarFactura = async (nuevaFactura) => {
    setLoading(true);
    setError("");
    setErrorCode(null);
    setSuccess("");
    try {
      const res = await secureFetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevaFactura),
      });
      const data = await res.json();
      if (!res.ok) {
        // Si el error es por número repetido, mostrar mensaje especial
        if (data.message && data.message.includes('Ya existe una factura con ese número')) {
          setError('El número de registro ya está en uso. Elegí otro número.');
        } else if (data.code === 'PLAN_DOCUMENT_LIMIT_REACHED') {
          setError(data.message || 'Alcanzaste el límite de registros de tu plan actual.');
          setErrorCode('PLAN_DOCUMENT_LIMIT_REACHED');
        } else {
          setError(data.message || "Error al agregar registro");
        }
        return;
      }
      setSuccess("Registro de venta agregado correctamente.");
      setNuevaFacturaId(data._id);
      setNuevaAdjuntoInfo(data.adjunto || null);
      fetchFacturas();
      setTab('listado');
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Limpiar error al cambiar de pestaña o abrir el formulario de nuevo
  useEffect(() => {
    setError("");
  }, [tab]);

  const subirAdjuntoNueva = async () => {
    if (!nuevaFacturaId || !nuevaAdjunto) return;
    if (!nuevaFacturaId) {
      console.error('nuevaFacturaId es undefined');
      return;
    }
    const formData = new FormData();
    formData.append('adjunto', nuevaAdjunto);
    const res = await secureFetch(`/api/invoices/${nuevaFacturaId}/adjunto`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      setNuevaAdjuntoInfo(data.adjunto);
      setNuevaAdjunto(null);
      if (nuevaFileInputRef.current) nuevaFileInputRef.current.value = '';
      fetchFacturas();
    }
  };

  const descargarAdjuntoNueva = () => {
    if (!nuevaFacturaId || !nuevaAdjuntoInfo) return;
    if (!nuevaFacturaId) {
      console.error('nuevaFacturaId es undefined');
      return;
    }
    window.open(`/api/invoices/${nuevaFacturaId}/adjunto`, '_blank');
  };

  const eliminarAdjuntoNueva = async () => {
    if (!nuevaFacturaId || !nuevaAdjuntoInfo) return;
    if (!nuevaFacturaId) {
      console.error('nuevaFacturaId es undefined');
      return;
    }
    const res = await secureFetch(`/api/invoices/${nuevaFacturaId}/adjunto`, {
      method: 'DELETE'
    });
    if (res.ok) setNuevaAdjuntoInfo(null);
  };

  const descargarPDF = async (id, numero) => {
    if (!id) {
      console.error('ID de factura es undefined');
      return;
    }
    try {
      // Generar PDF directamente sin plantilla personalizada
      console.log('Generando PDF con plantilla por defecto');
      
      const res = await secureFetch(`/api/invoices/${id}/pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template: null })
      });
      
      if (!res.ok) throw new Error('No se pudo generar el PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el PDF: ' + (err.message || '')); 
    }
  };

  const cambiarEstadoPago = async (id, estadoPago) => {
    if (!id) {
      console.error('ID de factura es undefined');
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await secureFetch(`/api/invoices/${id}/estado-pago`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ estadoPago }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cambiar estado de pago");
      setSuccess("Estado de pago actualizado.");
      fetchFacturas();
    } catch (err) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const exportarVentasCsv = async () => {
    setExportingCsv(true);
    setError("");
    try {
      const res = await secureFetch('/api/export/ventas');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al exportar');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ventas.csv';
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Exportación descargada (ventas.csv).');
    } catch (err) {
      setError(err.message || 'Error al exportar');
    } finally {
      setExportingCsv(false);
    }
  };

  const enviarFacturaPorEmail = async (id) => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await secureFetch(`/api/invoices/${id}/send-email`, {
        method: 'POST'
      });
      let data = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error('El servidor devolvió una respuesta inesperada.\n' + text);
      }
      if (!res.ok) throw new Error(data.message || 'Error al enviar el email');
      setSuccess('Comprobante enviado por email correctamente.');
    } catch (err) {
      setError(err.message || 'Error al enviar el email');
    } finally {
      setLoading(false);
    }
  };

  const enviarRecordatorioPago = async (id) => {
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const res = await secureFetch(`/api/invoices/${id}/reminder`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar el recordatorio');
      setSuccess('Recordatorio de pago enviado correctamente.');
    } catch (err) {
      setError(err.message || 'Error al enviar el recordatorio');
    } finally {
      setLoading(false);
    }
  };

  // Mismo criterio que Clientes: modo oscuro = contenedores oscuros + texto blanco
  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500';
  const emptyBox = modoOscuro ? 'bg-gray-800/50 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-600';
  const tabInactive = modoOscuro ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  const btnSec = modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 text-gray-900 hover:bg-gray-50';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700';
  const tableRow = modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const divide = modoOscuro ? 'border-gray-700' : 'border-gray-200';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-200';

  return (
    <div className={modoOscuro ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-[#f5f5f7] text-gray-900'}>
      <div className="w-full max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Header compacto */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl font-semibold leading-tight ${textPri}`}>
                  Registro de ventas
                </h1>
                {isFetching && (
                  <div className={`flex items-center gap-1 ${textMuted}`}>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  </div>
                )}
              </div>
              <p className={`text-xs leading-tight ${textSec}`}>
                Listado y creación de registros de venta.
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes de estado compactos */}
        {success && (
          <div className={`mb-3 p-2 rounded-lg shadow-sm border-l-4 ${modoOscuro ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-400'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'bg-green-800/50' : 'bg-green-100'}`}>
                <svg className={`w-3 h-3 ${modoOscuro ? 'text-green-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`font-medium text-sm ${modoOscuro ? 'text-green-200' : 'text-green-800'}`}>{success}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`mb-3 p-2 rounded-lg shadow-sm border-l-4 ${modoOscuro ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${modoOscuro ? 'bg-red-800/50' : 'bg-red-100'}`}>
                  <svg className={`w-3 h-3 ${modoOscuro ? 'text-red-300' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className={`font-medium text-sm ${modoOscuro ? 'text-red-200' : 'text-red-800'}`}>{error}</span>
              </div>
              {errorCode === 'PLAN_DOCUMENT_LIMIT_REACHED' && (
                <button
                  type="button"
                  onClick={() => navigate('/planes')}
                  className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Ver planes
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs compactos */}
        <div className="mb-4">
          <div className={`rounded-xl p-1 shadow border w-full ${box}`}>
            <div className="flex space-x-1">
              <button
                onClick={() => { setTab('listado'); setEditId(null); setEditData(null); }}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  tab === 'listado'
                    ? 'bg-[#1F80FF] text-white shadow-sm'
                    : tabInactive
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Listado</span>
              </button>
              <button
                onClick={() => { setTab('crear'); setEditId(null); setEditData(null); }}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  tab === 'crear'
                    ? 'bg-[#1F80FF] text-white shadow-sm'
                    : tabInactive
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{editId !== null ? 'Editar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      {/* Contenido de tabs */}
      {tab === 'listado' && (
          <div className={`rounded-xl shadow-sm border overflow-hidden w-full ${box}`}>
            {/* Header de la sección - compacto */}
            <div className={`border-b p-3 ${divide}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <h2 className={`text-sm font-semibold leading-tight ${textPri}`}>Listado de registros de venta</h2>
                    <p className={`text-[10px] leading-tight ${textMuted}`}>{facturasFiltradas.length} registros • Total: {new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'}).format(facturasFiltradas.reduce((sum, f) => sum + (f.total || 0), 0))}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setTab('crear'); setEditId(null); setEditData(null); }}
                    className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-white text-xs ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                    Nueva
                  </button>
                  <button
                    onClick={fetchFacturas}
                    disabled={isFetching}
                    className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 ${btnOut}`}
                    title="Actualizar"
                  >
                    <svg className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={exportarVentasCsv}
                    disabled={exportingCsv}
                    className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md border text-xs disabled:opacity-50 ${btnOut}`}
                  >
                    <svg className={`w-3 h-3 ${exportingCsv ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Buscador compacto */}
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${textMuted}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por número, cliente o país..."
                  value={busqueda}
                  onChange={handleBusqueda}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm ${inputClass}`}
                />
              </div>

              {busqueda && (
                <div className={`text-xs px-2 py-1 rounded ${modoOscuro ? 'text-gray-300 bg-gray-800' : 'text-gray-600 bg-gray-100'}`}>
                  <span className="font-medium">{facturasFiltradas.length}</span> resultado{facturasFiltradas.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Filtros compactos */}
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFiltroEstado('todas')} 
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    filtroEstado === 'todas' 
                      ? 'bg-[#1F80FF] text-white shadow-sm' 
                      : btnSec
                  }`}
                >
                  Todas
                </button>
                <button 
                  onClick={() => setFiltroEstado('pagada')} 
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    filtroEstado === 'pagada' 
                      ? 'bg-[#1F80FF] text-white shadow-sm' 
                      : btnSec
                  }`}
                >
                  Pagadas
                </button>
                <button 
                  onClick={() => setFiltroEstado('impaga')} 
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                    filtroEstado === 'impaga' 
                      ? 'bg-[#1F80FF] text-white shadow-sm' 
                      : btnSec
                  }`}
                >
                  Impagas
                </button>
              </div>

              {/* Filtros avanzados compactos */}
              <div className={`flex flex-wrap items-end gap-2 p-2 rounded-lg border ${modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="min-w-[120px] flex-1">
                  <label className={`block text-[10px] font-medium mb-0.5 ${textMuted}`}>Categoría</label>
                  <select
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded border text-xs ${inputClass}`}
                  >
                    <option value="">Todas</option>
                    <option value="Honorarios">Honorarios</option>
                    <option value="Asesoría mensual">Asesoría mensual</option>
                    <option value="Proyecto único">Proyecto único</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="min-w-[110px]">
                  <label className={`block text-[10px] font-medium mb-0.5 ${textMuted}`}>Desde</label>
                  <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={e => setFiltroFechaDesde(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded border text-xs ${inputClass}`}
                  />
                </div>
                <div className="min-w-[110px]">
                  <label className={`block text-[10px] font-medium mb-0.5 ${textMuted}`}>Hasta</label>
                  <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={e => setFiltroFechaHasta(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded border text-xs ${inputClass}`}
                  />
                </div>
                <div className="min-w-[140px] flex-1">
                  <label className={`block text-[10px] font-medium mb-0.5 ${textMuted}`}>Cliente</label>
                  <select
                    value={filtroCliente}
                    onChange={e => setFiltroCliente(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded border text-xs ${inputClass}`}
                  >
                    <option value="">Todos</option>
                    {clientesUnicos.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {(filtroCategoria || filtroFechaDesde || filtroFechaHasta || filtroCliente) && (
                  <button
                    type="button"
                    onClick={() => { setFiltroCategoria(''); setFiltroFechaDesde(''); setFiltroFechaHasta(''); setFiltroCliente(''); }}
                    className={`px-2 py-1.5 rounded text-xs font-medium ${btnSec}`}
                  >
                    Limpiar
                  </button>
                )}
              </div>

          {/* Empty state */}
          {facturasFiltradas.length === 0 ? (
            <div className={`py-10 flex flex-col items-center justify-center text-center border border-dashed rounded-2xl ${emptyBox}`}>
              <svg className={`w-10 h-10 mb-3 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-4l-2-2H9z" />
              </svg>
              <p className={`text-sm font-medium mb-1 ${textPri}`}>Todavía no hay registros de venta</p>
              <p className={`text-xs mb-4 max-w-xs ${textSec}`}>
                Creá tu primer registro para empezar a ver el historial acá.
              </p>
              <button
                type="button"
                onClick={() => { setTab('crear'); setEditId(null); setEditData(null); }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
                Crear registro
              </button>
            </div>
          ) : (
            <>
          {/* Vista tipo tarjeta para mobile - compacta */}
              <div className="grid grid-cols-1 gap-2 md:hidden">
            {facturasFiltradas.map((f, idx) => (
                  <div key={f._id || idx} className={`rounded-xl border shadow p-3 hover:shadow-md transition-all ${box}`}>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`rounded px-2 py-1 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                          <span className="text-white font-mono font-semibold text-xs tracking-wide">#{f.numero}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-semibold text-sm ${textPri}`}>{f.razonSocial}</span>
                          <span className={`text-xs ${textMuted}`}>{f.pais}</span>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        f.estadoPago === 'pagada'
                          ? modoOscuro ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                          : modoOscuro ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {f.estadoPago === 'pagada' ? 'Pagada' : 'Impaga'}
                      </span>
                    </div>

                    {/* Información de la factura */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div>
                        <div className={`text-[10px] ${textMuted}`}>Fecha</div>
                        <div className={`font-medium text-xs ${textPri}`}>{f.fecha}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] ${textMuted}`}>Tipo</div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${modoOscuro ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          {f.documentType || 'invoice'}
                        </span>
                      </div>
                      <div>
                        <div className={`text-[10px] ${textMuted}`}>Cat.</div>
                        <div className={`text-xs ${textPri}`}>{f.categoria || '—'}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] ${textMuted}`}>Total</div>
                        <div className={`text-sm font-bold ${textPri}`}>${f.total}</div>
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className={`flex flex-wrap gap-2 pt-3 sm:pt-4 border-t ${divide}`}>
                      <button 
                        onClick={() => setDetalle(f)} 
                        className={`px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm ${btnSec}`}
                      >
                        Ver
                      </button>
                      <button 
                        onClick={() => handleEditar(idx)} 
                        className={`px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm ${btnOut}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => descargarPDF(f._id, f.numero)}
                        className={`px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm flex items-center gap-2 ${btnOut}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                      <button
                        onClick={() => cambiarEstadoPago(f._id, f.estadoPago === 'pagada' ? 'impaga' : 'pagada')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${btnOut}`}
                      >
                        {f.estadoPago === 'pagada' ? 'Marcar impaga' : 'Marcar pagada'}
                      </button>
                    </div>
                  </div>
            ))}
          </div>
          {/* Tabla solo en escritorio/tablet - compacta */}
          <div className="overflow-x-auto hidden md:block">
            <div className={`rounded-xl border shadow ${box}`}>
              <table className="w-full">
                <thead>
                  <tr className={tableHead}>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">N°</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">Cliente</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">Fecha</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">Tipo</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">Cat.</th>
                    <th className="py-2 px-3 text-left font-semibold text-xs uppercase tracking-wider">Total</th>
                    <th className="py-2 px-3 text-center font-semibold text-xs uppercase tracking-wider">Estado</th>
                    <th className="py-2 px-3 text-center font-semibold text-xs uppercase tracking-wider">Acc.</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${divideY}`}>
                  {facturasFiltradas.map((f, idx) => (
                    <tr key={f._id || idx} className={`transition-all group ${tableRow}`}>
                      <td className="py-2 px-3">
                        <div className={`rounded px-2 py-1 ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                          <span className="text-white font-mono font-semibold text-xs">#{f.numero}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className={`font-medium text-sm ${textPri}`}>{f.razonSocial}</div>
                        <div className={`text-xs ${textMuted}`}>{f.pais}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-sm ${textPri}`}>{f.fecha}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${modoOscuro ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          {f.documentType || 'invoice'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-xs ${textPri}`}>{f.categoria || '—'}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-base font-bold ${textPri}`}>${f.total}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            f.estadoPago === 'pagada'
                              ? modoOscuro ? 'bg-green-600 text-white border-green-600' : 'bg-green-500 text-white border-green-500'
                              : modoOscuro ? 'bg-red-600 text-white border-red-600' : 'bg-red-500 text-white border-red-500'
                          }`}>
                            {f.estadoPago === 'pagada' ? 'Pagada' : 'Impaga'}
                          </span>
                          <button
                            onClick={() => cambiarEstadoPago(f._id, f.estadoPago === 'pagada' ? 'impaga' : 'pagada')}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${btnOut}`}
                          >
                            {f.estadoPago === 'pagada' ? 'Marcar impaga' : 'Marcar pagada'}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => setDetalle(f)} 
                            className={`px-2 py-1 rounded transition-colors text-xs font-medium ${btnSec}`}
                            title="Ver"
                          >
                            Ver
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuOpenId(menuOpenId === f._id ? null : f._id)}
                              className={`p-1.5 rounded border transition-colors ${btnOut}`}
                              title="Más"
                            >
                              <span className="text-sm leading-none">⋯</span>
                            </button>
                              {menuOpenId === f._id && (
                                <div className={`absolute right-0 ${idx >= facturasFiltradas.length - 2 ? 'bottom-full mb-2' : 'mt-2'} w-40 border rounded-lg shadow-xl z-50 text-left ${box}`}>
                                  <button
                                    onClick={() => { setMenuOpenId(null); handleEditar(idx); }}
                                    className={`w-full px-3 py-2 text-xs text-left ${modoOscuro ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-50'}`}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => { setMenuOpenId(null); descargarPDF(f._id, f.numero); }}
                                    className={`w-full px-3 py-2 text-xs text-left ${modoOscuro ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-50'}`}
                                  >
                                    Descargar PDF
                                  </button>
                                  <button
                                    onClick={() => { setMenuOpenId(null); enviarFacturaPorEmail(f._id); }}
                                    className={`w-full px-3 py-2 text-xs text-left ${modoOscuro ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-50'}`}
                                  >
                                    Enviar por email
                                  </button>
                                  {f.estadoPago !== 'pagada' && (
                                    <button
                                      onClick={() => { setMenuOpenId(null); enviarRecordatorioPago(f._id); }}
                                      className={`w-full px-3 py-2 text-xs text-left ${modoOscuro ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-50'}`}
                                    >
                                      Recordatorio de pago
                                    </button>
                                  )}
                                  <button
                                    onClick={() => { setMenuOpenId(null); handleEliminar(f._id); }}
                                    className={`w-full px-3 py-2 text-xs text-left ${modoOscuro ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
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
          <div className={`rounded-2xl shadow-xl border overflow-hidden w-full ${box}`}>
            {/* Header de la sección */}
            <div className={modoOscuro ? 'bg-gray-800 p-4 sm:p-6 text-white' : 'bg-[#004AAD] p-4 sm:p-6 text-white'}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold">{editId !== null ? 'Editar Comprobante' : 'Crear Nuevo Comprobante'}</h2>
                  <p className="text-green-100 text-xs sm:text-sm">
                    {editId !== null ? 'Modifica los datos del comprobante seleccionado' : 'Completa el formulario para generar un nuevo comprobante'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
          <FacturaForm
            onAdd={editId !== null ? handleGuardarEdicion : handleAgregarFactura}
            initialData={editData}
            editMode={editId !== null}
            onCancel={handleCancelarEdicion}
            modoOscuro={modoOscuro}
          />
            </div>
        </div>
      )}
      {nuevaFacturaId && (
          <div className={`rounded-xl shadow-lg p-6 mt-6 border w-full ${box}`}>
            <div className={`mb-2 font-semibold ${textPri}`}>Adjuntar archivo a la nueva factura</div>
          <input
            type="file"
            ref={nuevaFileInputRef}
            className={`block w-full border rounded-lg p-2 ${inputClass}`}
            onChange={e => setNuevaAdjunto(e.target.files[0])}
            accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
          <button
            type="button"
            className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!nuevaAdjunto}
            onClick={subirAdjuntoNueva}
          >
            Subir adjunto
          </button>
          {nuevaAdjuntoInfo && (
            <div className="mt-2 flex items-center gap-3">
              <span className={`text-sm font-semibold truncate max-w-xs ${modoOscuro ? 'text-green-300' : 'text-green-700'}`}>{nuevaAdjuntoInfo}</span>
              <button type="button" className={modoOscuro ? 'text-blue-400 underline' : 'text-blue-600 underline'} onClick={descargarAdjuntoNueva}>Descargar</button>
              <button type="button" className={modoOscuro ? 'text-red-400 underline' : 'text-red-600 underline'} onClick={eliminarAdjuntoNueva}>Eliminar</button>
            </div>
          )}
        </div>
      )}
        
      <FacturaDetalleModal
        factura={detalle}
        onClose={() => setDetalle(null)}
        modoOscuro={modoOscuro}
        onEnviarEmail={enviarFacturaPorEmail}
        onEnviarRecordatorio={enviarRecordatorioPago}
      />
      </div>
    </div>
  );
};

export default Facturas; 