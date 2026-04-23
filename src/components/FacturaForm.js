import React, { useState, useEffect, useContext } from 'react';
import { useCompanyData } from '../hooks/useCompanyData';
import { useApi } from '../hooks/useApi';
import { ThemeContext } from '../context/ThemeContext';
import { sanitizeText, sanitizeEmail, sanitizeNumber } from '../utils/sanitize';

const FacturaForm = ({ onAdd, initialData = null, editMode = false, onCancel, modoOscuro: modoOscuroProp }) => {
  const { modoOscuro: contextoOscuro } = useContext(ThemeContext);
  const modoOscuro = modoOscuroProp ?? contextoOscuro ?? false;
  // Debug: Log de props recibidas
  console.log('🔧 FacturaForm props:', { onAdd, initialData, editMode, onCancel });
  console.log('🔧 Tipo de onAdd:', typeof onAdd);
  
  const { secureFetch } = useApi();
  const { loading } = useCompanyData();
  
  // Estados para la factura - Modelo actual con array de conceptos
  const [factura, setFactura] = useState({
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    conceptos: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }],
    moneda: 'ARS',
    formaPago: 'Transferencia bancaria',
    vencimiento: '',
    estadoPago: 'impaga',
    notas: '',
    tipo: 'A',
    email: '',
    pais: '',
    razonSocial: '',
    total: 0,
    documentType: 'invoice',
    categoria: ''
  });

  // Debug: Log cuando cambia factura.cliente
  useEffect(() => {
    console.log('📝 factura.cliente cambió a:', factura.cliente);
  }, [factura.cliente]);

  // Recalcular total cuando cambien los conceptos
  useEffect(() => {
    const nuevoTotal = factura.conceptos.reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0);
    if (nuevoTotal !== factura.total) {
      setFactura(prev => ({ ...prev, total: nuevoTotal }));
    }
  }, [factura.conceptos, factura.total]);

  // Estados para manejo de clientes
  const [clientes, setClientes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Debug: Log cuando cambia mostrarSugerencias
  useEffect(() => {
    console.log('👁️ Estado de mostrarSugerencias cambió a:', mostrarSugerencias);
    if (mostrarSugerencias) {
      console.log('✅ Sugerencias abiertas');
    } else {
      console.log('❌ Sugerencias cerradas');
    }
  }, [mostrarSugerencias]);

  // Estado para mostrar/ocultar campos avanzados
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (initialData) {
      console.log('📥 Datos recibidos para edición:', initialData);
      
      // Adaptar datos del backend al formato del formulario
      const adaptedData = { ...initialData };
      
      // Si viene del backend, los conceptos tienen formato {detalle, importe}
      // Necesitamos convertirlos a {descripcion, cantidad, precioUnitario}
      if (initialData.conceptos && Array.isArray(initialData.conceptos) && initialData.conceptos.length > 0) {
        adaptedData.conceptos = initialData.conceptos.map(c => ({
          descripcion: c.detalle || c.descripcion || '',
          cantidad: c.cantidad || 1,
          precioUnitario: c.precioUnitario || (c.importe / (c.cantidad || 1)) || 0
        }));
        console.log('✅ Conceptos adaptados del backend:', adaptedData.conceptos);
      }
      // Adaptar datos del modelo anterior si vienen como concepto/cantidad/precioUnitario
      else if (!adaptedData.conceptos && (adaptedData.concepto || adaptedData.cantidad || adaptedData.precioUnitario)) {
        adaptedData.conceptos = [{
          descripcion: adaptedData.concepto || '',
          cantidad: adaptedData.cantidad || 1,
          precioUnitario: adaptedData.precioUnitario || 0
        }];
      }
      // Si no hay conceptos, inicializar con uno vacío
      if (!adaptedData.conceptos || adaptedData.conceptos.length === 0) {
        adaptedData.conceptos = [{ descripcion: '', cantidad: 1, precioUnitario: 0 }];
      }
      
      // Sincronizar cliente con razonSocial (el formulario usa 'cliente', el backend usa 'razonSocial')
      if (!adaptedData.cliente && adaptedData.razonSocial) {
        adaptedData.cliente = adaptedData.razonSocial;
      }
      
      console.log('📤 Datos adaptados para el formulario:', adaptedData);
      setFactura(adaptedData);
    }
  }, [initialData]);

  const fetchClientes = React.useCallback(async () => {
    try {
      console.log('🔄 Cargando clientes...');
      const res = await secureFetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        console.log('📊 Clientes cargados:', data);
        console.log('📝 Cantidad de clientes:', data.length);
        setClientes(data);
      } else {
        console.log('❌ Error al cargar clientes, status:', res.status);
      }
    } catch (err) {
      console.error('❌ Error al cargar clientes:', err);
    }
  }, [secureFetch]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    console.log('🚀 useEffect - Cargando clientes al montar');
    fetchClientes();
  }, [fetchClientes]);

  // Cerrar sugerencias cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      
      // No cerrar si:
      // 1. Estamos haciendo click en el input
      // 2. Estamos haciendo click en el contenedor de sugerencias
      // 3. Estamos haciendo click en un elemento de la lista
      if (target.matches('input') || 
          target.closest('.cliente-search-container') ||
          target.closest('.cliente-suggestion-item')) {
        console.log('🖱️ Click dentro del campo o sugerencias, manteniendo abierto');
        return;
      }
      
      // Cerrar si hacemos click en cualquier otro lugar
      console.log('🖱️ Click fuera del campo, cerrando sugerencias');
      setMostrarSugerencias(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para filtrar clientes
  const filtrarClientes = (termino) => {
    if (!termino.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.razonSocial.toLowerCase().includes(termino.toLowerCase()) ||
      cliente.email.toLowerCase().includes(termino.toLowerCase())
    );
  };

  // Función para manejar búsqueda de cliente
  const handleBusquedaCliente = (e) => {
    const valor = e.target.value;
    console.log('🔄 Cambiando valor del cliente a:', valor);
    setFactura(prev => {
      const nuevaFactura = { ...prev, cliente: valor };
      console.log('✅ Factura actualizada:', nuevaFactura);
      return nuevaFactura;
    });
    
    if (valor.trim()) {
      const filtrados = filtrarClientes(valor);
      console.log('🔍 Clientes filtrados:', filtrados);
      setMostrarSugerencias(filtrados.length > 0);
    } else {
      setMostrarSugerencias(false);
    }
  };

  // Función para seleccionar cliente
  const seleccionarCliente = (cliente) => {
    console.log('🔄 Seleccionando cliente:', cliente);
    console.log('📝 Razón social del cliente:', cliente.razonSocial);
    console.log('📧 Email del cliente:', cliente.email);
    console.log('🌍 País del cliente:', cliente.pais);
    
    setFactura(prev => {
      const nuevaFactura = { 
        ...prev, 
        cliente: cliente.razonSocial,
        // Extraer datos del cliente para la factura
        email: cliente.email || '',
        pais: cliente.pais || 'Argentina',
        razonSocial: cliente.razonSocial,
        // Calcular total
        total: prev.cantidad * prev.precioUnitario
      };
      console.log('✅ Nueva factura con cliente y datos:', nuevaFactura);
      console.log('📧 Email extraído:', nuevaFactura.email);
      console.log('🌍 País extraído:', nuevaFactura.pais);
      console.log('🏢 Razón social extraída:', nuevaFactura.razonSocial);
      return nuevaFactura;
    });
    setMostrarSugerencias(false);
    console.log('🔒 Sugerencias cerradas');
  };

  // Función para manejar cambios en la factura
  const handleChange = (field, value) => {
    // Sanitizar según el tipo de campo
    let sanitizedValue = value;
    switch (field) {
      case 'email':
        sanitizedValue = sanitizeEmail(value);
        break;
      case 'numero':
      case 'cantidad':
        // Solo números y letras permitidos
        sanitizedValue = value.replace(/[^a-zA-Z0-9\-]/g, '');
        break;
      case 'notas':
        sanitizedValue = sanitizeText(value);
        break;
      default:
        // Campos de texto general
        if (typeof value === 'string') {
          sanitizedValue = sanitizeText(value);
        }
    }
    
    setFactura(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const [error, setError] = useState('');

  // Función para manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validar que se haya seleccionado un cliente
    if (!factura.cliente.trim()) {
      setError('Por favor ingresá el cliente antes de guardar la venta.');
      return;
    }
    
    // Validar que onAdd sea una función
    if (typeof onAdd !== 'function') {
      console.error('❌ onAdd no es una función:', onAdd);
      setError('No se pudo procesar el registro de venta. Reintentá o actualizá la página.');
      return;
    }
    
    // Calcular total de la factura desde el array de conceptos
    const total = factura.conceptos.reduce((sum, c) => sum + (c.cantidad * c.precioUnitario), 0);
    
    // Sanitizar y crear factura completa con todos los campos requeridos
    const facturaCompleta = {
      ...factura,
      numero: sanitizeText(factura.numero),
      cliente: sanitizeText(factura.cliente),
      email: sanitizeEmail(factura.email),
      pais: sanitizeText(factura.pais),
      razonSocial: sanitizeText(factura.razonSocial),
      notas: sanitizeText(factura.notas),
      categoria: sanitizeText(factura.categoria),
      total: total,
      tipo: factura.tipo || 'A',
      
      // Convertir conceptos al formato que espera el backend
      conceptos: factura.conceptos.map(c => ({
        detalle: sanitizeText(c.descripcion),
        importe: c.cantidad * c.precioUnitario
      }))
    };
    
    console.log('📤 Enviando comprobante completo:', facturaCompleta);
    console.log('📊 Campos requeridos verificados:');
    console.log('  - total:', facturaCompleta.total);
    console.log('  - tipo:', facturaCompleta.tipo);
    console.log('  - email:', facturaCompleta.email);
    console.log('  - pais:', facturaCompleta.pais);
    console.log('  - razonSocial:', facturaCompleta.razonSocial);
    
    console.log('📋 Conceptos que se envían:');
    console.log('  - conceptos:', facturaCompleta.conceptos);
    console.log('  - detalle:', facturaCompleta.conceptos?.[0]?.detalle);
    console.log('  - importe:', facturaCompleta.conceptos?.[0]?.importe);
    
    onAdd(facturaCompleta);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-700';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-800/50' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100';
  const sectionGray = modoOscuro ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200';

  return (
    <div className={`w-full p-4 rounded-lg shadow border ${box}`}>
      <h2 className={`text-xl font-bold mb-4 text-center ${textPri}`}>
        {editMode ? 'Editar registro' : 'Nuevo registro'}
      </h2>

      {error && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs border ${modoOscuro ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {sanitizeText(error)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Información de la factura - Layout compacto tipo tabla */}
        <div className={`p-4 rounded-lg border ${sectionGray}`}>
          <h3 className={`text-lg font-bold mb-3 ${textPri}`}>Información del registro</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Número *
              </label>
              <input
                type="text"
                value={factura.numero}
                onChange={e => handleChange('numero', e.target.value)}
                required
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Fecha *
              </label>
              <input
                type="date"
                value={factura.fecha}
                onChange={e => handleChange('fecha', e.target.value)}
                required
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
              />
            </div>
            <div className="col-span-2">
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Cliente *
              </label>
              <div className="relative cliente-search-container">
                <input
                  type="text"
                  value={factura.cliente}
                  onChange={handleBusquedaCliente}
                  onFocus={() => {
                    setTimeout(() => {
                      setMostrarSugerencias(true);
                    }, 100);
                  }}
                  placeholder="Buscar o escribir cliente..."
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                />
              </div>

              {/* Lista de clientes existentes */}
              {mostrarSugerencias && (
                <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${box}`}>
                  <div className={`p-2 text-xs border-b ${modoOscuro ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-500 bg-gray-100 border-gray-200'}`}>
                    Mostrando {clientes.length} clientes disponibles
                  </div>
                  {clientes.map((cliente) => (
                    <div
                      key={cliente._id}
                      onClick={() => {
                        console.log('🖱️ Click en cliente:', cliente);
                        seleccionarCliente(cliente);
                      }}
                      className={`cliente-suggestion-item px-4 py-2 cursor-pointer border-b last:border-b-0 ${modoOscuro ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}
                    >
                      <div className={`font-medium ${textPri}`}>{cliente.razonSocial}</div>
                      <div className={`text-sm ${textSec}`}>{cliente.email} • {cliente.pais}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Conceptos - Layout compacto tipo tabla */}
            <div className="col-span-2 md:col-span-4">
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Concepto / Descripción *
              </label>
              {factura.conceptos.map((concepto, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={concepto.descripcion}
                      onChange={e => {
                        const newConceptos = [...factura.conceptos];
                        newConceptos[idx].descripcion = e.target.value;
                        setFactura(prev => ({ ...prev, conceptos: newConceptos }));
                      }}
                      required
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                      placeholder="Descripción"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={concepto.cantidad}
                      onChange={e => {
                        const newConceptos = [...factura.conceptos];
                        newConceptos[idx].cantidad = parseInt(e.target.value) || 1;
                        setFactura(prev => ({ ...prev, conceptos: newConceptos }));
                      }}
                      min="1"
                      required
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                      placeholder="Cant"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={concepto.precioUnitario}
                      onChange={e => {
                        const newConceptos = [...factura.conceptos];
                        newConceptos[idx].precioUnitario = parseFloat(e.target.value) || 0;
                        setFactura(prev => ({ ...prev, conceptos: newConceptos }));
                      }}
                      min="0"
                      step="0.01"
                      required
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                      placeholder="Precio"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <span className={`text-xs font-semibold ${modoOscuro ? 'text-blue-300' : 'text-blue-600'}`}>
                      {(concepto.cantidad * concepto.precioUnitario).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Fila de totales y moneda */}
            <div className="col-span-2">
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Total
              </label>
              <div className={`px-2 py-1.5 text-sm font-semibold border rounded-md ${modoOscuro ? 'bg-gray-800 border-gray-600 text-blue-300' : 'bg-gray-100 border-gray-300 text-blue-600'}`}>
                {factura.moneda} {factura.total.toLocaleString('es-AR', {minimumFractionDigits: 2})}
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Moneda
              </label>
              <select
                value={factura.moneda}
                onChange={e => handleChange('moneda', e.target.value)}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Estado
              </label>
              <select
                value={factura.estadoPago}
                onChange={e => handleChange('estadoPago', e.target.value)}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
              >
                <option value="impaga">Impaga</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                Categoría
              </label>
              <select
                value={factura.categoria || ''}
                onChange={e => handleChange('categoria', e.target.value)}
                className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
              >
                <option value="">Sin cat.</option>
                <option value="Honorarios">Honorarios</option>
                <option value="Asesoría">Asesoría</option>
                <option value="Proyecto">Proyecto</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Campos avanzados */}
          {showAdvancedFields && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-700">
              <div>
                <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                  Forma de Pago
                </label>
                <select
                  value={factura.formaPago}
                  onChange={e => handleChange('formaPago', e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                >
                  <option value="Transferencia">Transferencia</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={factura.vencimiento}
                  onChange={e => handleChange('vencimiento', e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block text-xs font-medium mb-1 ${textSec}`}>
                  Notas
                </label>
                <input
                  type="text"
                  value={factura.notas}
                  onChange={e => handleChange('notas', e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${inputClass}`}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          )}

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowAdvancedFields(prev => !prev)}
              className={`text-xs underline-offset-2 hover:underline ${modoOscuro ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {showAdvancedFields ? 'Ocultar campos avanzados ↑' : 'Mostrar campos avanzados ↓'}
            </button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {editMode ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacturaForm; 