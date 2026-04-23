import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  FiCreditCard, 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiStar
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../hooks/useApi';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { ThemeContext } from '../context/ThemeContext';

const AdminPlans = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const { canManagePlans } = useAdminPermissions();

  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: {
      basicInvoicing: true,
      basicTemplates: true,
      customTemplates: false,
      logoUpload: false,
      companyBranding: false,
      employeeAccounts: false,
      multiCompany: false,
      advancedAnalytics: false,
      prioritySupport: false
    },
    maxEmployees: 1,
    maxCompanies: 1,
    maxTemplates: 1,
    isActive: true,
    isPopular: false,
    description: ''
  });

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await secureFetch('/api/admin/plans');
      
      if (response.ok) {
        const plansData = await response.json();
        setPlans(plansData);
      } else {
        throw new Error('Error al cargar planes');
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  const filterPlans = useCallback(() => {
    let filtered = plans;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(plan => 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(plan => 
        statusFilter === 'active' ? plan.isActive : !plan.isActive
      );
    }

    setFilteredPlans(filtered);
  }, [plans, searchTerm, statusFilter]);

  useEffect(() => {
    if (canManagePlans()) {
      loadPlans();
    }
  }, [canManagePlans, loadPlans]);

  useEffect(() => {
    filterPlans();
  }, [filterPlans]);

  const handleAddPlan = async (e) => {
    e.preventDefault();
    
    try {
      const response = await secureFetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPlan = await response.json();
        alert(`Plan "${newPlan.name}" creado correctamente`);
        setShowAddModal(false);
        setFormData({
          name: '',
          slug: '',
          price: 0,
          currency: 'USD',
          billingCycle: 'monthly',
          features: {
            basicInvoicing: true,
            basicTemplates: true,
            customTemplates: false,
            logoUpload: false,
            companyBranding: false,
            employeeAccounts: false,
            multiCompany: false,
            advancedAnalytics: false,
            prioritySupport: false
          },
          maxEmployees: 1,
          maxCompanies: 1,
          maxTemplates: 1,
          maxClients: 50,
          maxDocumentsPerMonth: 200,
          maxStorageMB: 100,
          dataHistoryMonths: 6,
          hasTrial: false,
          isActive: true,
          isPopular: false,
          description: ''
        });
        setSelectedPlan(null);
        loadPlans();
      } else {
        throw new Error('Error al crear plan');
      }
    } catch (error) {
      console.error('Error al crear plan:', error);
      alert('Error al crear el plan');
    }
  };

  const handleEditPlan = async (e) => {
    e.preventDefault();
    
    try {
      const response = await secureFetch(`/api/admin/plans/${selectedPlan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPlan = await response.json();
        alert(`Plan "${updatedPlan.name}" actualizado correctamente`);
        setShowEditModal(false);
        setSelectedPlan(null);
        setFormData({
          name: '',
          slug: '',
          price: 0,
          currency: 'USD',
          billingCycle: 'monthly',
          features: {
            basicInvoicing: true,
            basicTemplates: true,
            customTemplates: false,
            logoUpload: false,
            companyBranding: false,
            employeeAccounts: false,
            multiCompany: false,
            advancedAnalytics: false,
            prioritySupport: false,
            multimoneda: false,
            presupuestos: false,
            flujoDeCaja: false,
            reportesAutomatizados: false
          },
          maxEmployees: 1,
          maxCompanies: 1,
          maxTemplates: 1,
          maxClients: 50,
          maxDocumentsPerMonth: 200,
          maxStorageMB: 100,
          dataHistoryMonths: 6,
          hasTrial: false,
          isActive: true,
          isPopular: false,
          description: ''
        });
        loadPlans();
      } else {
        throw new Error('Error al actualizar plan');
      }
    } catch (error) {
      console.error('Error al actualizar plan:', error);
      alert('Error al actualizar el plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    const plan = plans.find(p => p._id === planId);
    if (!plan) return;
    
    const confirmMessage = `¿Estás seguro de que quieres eliminar el plan "${plan.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await secureFetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(`Plan "${plan.name}" eliminado correctamente`);
        loadPlans();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al eliminar el plan');
      }
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      alert('Error al eliminar el plan');
    }
  };

  // Función para generar slug automáticamente
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle,
      features: plan.features,
      maxEmployees: plan.maxEmployees,
      maxCompanies: plan.maxCompanies,
      maxTemplates: plan.maxTemplates,
      maxClients: plan.maxClients || 50,
      maxDocumentsPerMonth: plan.maxDocumentsPerMonth || 200,
      maxStorageMB: plan.maxStorageMB || 100,
      dataHistoryMonths: plan.dataHistoryMonths || 6,
      hasTrial: plan.hasTrial || false,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      description: plan.description
    });
    setShowEditModal(true);
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';
  const badge = modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300';
  const badgePopular = modoOscuro ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200';
  const tableRow = modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50/70';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-100';

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
        <FiCheck className="w-3 h-3 mr-1" />
        {isActive ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const getPopularBadge = (isPopular) => {
    return isPopular ? (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgePopular}`}>
        <FiStar className="w-3 h-3 mr-1" />
        Popular
      </span>
    ) : null;
  };

  if (!canManagePlans()) {
    return (
      <AdminLayout>
        <div className={`min-h-[60vh] flex items-center justify-center px-4 ${modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]'}`}>
          <div className="text-center max-w-md">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <FiX className="mx-auto h-7 w-7" />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${textPri}`}>
              Sin acceso a planes
            </h3>
            <p className={`text-sm ${textSec}`}>
              Tu usuario no tiene permisos para gestionar los planes de suscripción.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={modoOscuro ? 'min-h-full bg-black' : 'min-h-full bg-[#f5f5f7]'}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className={`text-xl font-semibold ${textPri}`}>Planes</h1>
              <p className={`mt-1 text-sm ${textSec}`}>
                Administra los planes de suscripción disponibles en la plataforma.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium text-white transition-colors ${modoOscuro ? 'border-gray-500 bg-gray-600 hover:bg-gray-500' : 'border-gray-900 bg-gray-900 hover:bg-black'}`}
              >
                <FiPlus className="w-4 h-4 mr-1.5" />
                Nuevo plan
              </button>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row gap-3 border rounded-2xl p-4 ${box}`}>
            <div className="flex-1">
              <div className="relative">
                <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                <input
                  type="text"
                  placeholder="Buscar planes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              <button
                onClick={loadPlans}
                className={`inline-flex items-center justify-center px-3 py-2 border rounded-lg text-sm focus:outline-none ${btnOut}`}
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista mobile como tarjetas */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className={`px-4 py-6 text-center text-sm ${textMuted}`}>
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-6 h-6 border-[3px] rounded-full animate-spin ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`} />
                  <p>Cargando planes...</p>
                </div>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className={`px-4 py-6 text-center text-sm ${textMuted}`}>
                No se encontraron planes
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <div
                  key={plan._id}
                  className={`rounded-2xl border px-4 py-3 flex flex-col gap-2 ${
                    modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                      <FiCreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${textPri}`}>{plan.name}</div>
                      <div className={`text-xs ${textMuted}`}>{plan.slug}</div>
                      {plan.description && (
                        <div className={`mt-1 text-xs ${textMuted}`}>{plan.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className={textPri}>
                      ${plan.price}{' '}
                      <span className={textMuted}>
                        {plan.billingCycle === 'monthly' ? 'por mes' : 'por año'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(plan.isActive)}
                      {getPopularBadge(plan.isPopular)}
                    </div>
                  </div>
                  <div className={`mt-1 grid grid-cols-2 gap-1 text-[11px] ${textPri}`}>
                    <div className="flex items-center">
                      <FiUsers className={`w-3 h-3 mr-1 ${textMuted}`} />
                      {plan.maxEmployees} usuarios
                    </div>
                    <div className="flex items-center">
                      <FiBriefcase className={`w-3 h-3 mr-1 ${textMuted}`} />
                      {plan.maxCompanies} empresas
                    </div>
                    <div className="flex items-center">
                      <FiFileText className={`w-3 h-3 mr-1 ${textMuted}`} />
                      {plan.maxTemplates} plantillas
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => openViewModal(plan)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Ver detalles"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    <button
                      onClick={() => openEditModal(plan)}
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Editar"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Eliminar"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabla para pantallas medianas y grandes */}
          <div className={`hidden md:block border rounded-2xl overflow-hidden ${box}`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full text-sm divide-y ${modoOscuro ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={tableHead}>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Precio
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Límites
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className={`${modoOscuro ? 'bg-gray-900' : 'bg-white'} divide-y ${divideY}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className={`px-4 py-10 text-center text-sm ${textMuted}`}>
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-6 h-6 border-[3px] rounded-full animate-spin ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`} />
                          <p>Cargando planes...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={`px-4 py-10 text-center text-sm ${textMuted}`}>
                        No se encontraron planes
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map((plan) => (
                      <tr key={plan._id} className={tableRow}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                              <FiCreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <div className={`text-sm font-medium ${textPri}`}>
                                {plan.name}
                              </div>
                              <div className={`text-xs ${textMuted}`}>
                                {plan.slug}
                              </div>
                              {plan.description && (
                                <div className={`text-xs mt-0.5 line-clamp-1 ${textMuted}`}>
                                  {plan.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`text-sm ${textPri}`}>
                            ${plan.price}
                          </div>
                          <div className={`text-xs ${textMuted}`}>
                            {plan.billingCycle === 'monthly' ? 'por mes' : 'por año'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`text-xs space-y-1.5 ${textPri}`}>
                            <div className="flex items-center">
                              <FiUsers className={`w-3 h-3 mr-1 ${textMuted}`} />
                              {plan.maxEmployees} usuarios
                            </div>
                            <div className="flex items-center">
                              <FiBriefcase className={`w-3 h-3 mr-1 ${textMuted}`} />
                              {plan.maxCompanies} empresas
                            </div>
                            <div className="flex items-center">
                              <FiFileText className={`w-3 h-3 mr-1 ${textMuted}`} />
                              {plan.maxTemplates} plantillas
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(plan.isActive)}
                            {getPopularBadge(plan.isPopular)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openViewModal(plan)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Ver detalles"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                            <button
                              onClick={() => openEditModal(plan)}
                              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Editar"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Eliminar"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Agregar Plan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 w-full max-w-2xl">
            <div className={`mx-4 rounded-2xl p-5 ${box}`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>
                Crear nuevo plan
              </h3>
              <form onSubmit={handleAddPlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData, 
                          name,
                          slug: generateSlug(name)
                        });
                      }}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Slug *
                    </label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, slug: generateSlug(formData.name)})}
                        className={`px-3 py-2 rounded-lg border text-xs ${btnOut}`}
                        title="Generar slug automáticamente"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Precio *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Ciclo de cobro
                    </label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de empleados
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxEmployees}
                      onChange={(e) => setFormData({...formData, maxEmployees: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de empresas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxCompanies}
                      onChange={(e) => setFormData({...formData, maxCompanies: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de plantillas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxTemplates}
                      onChange={(e) => setFormData({...formData, maxTemplates: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Estado
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${textSec}`}>
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                    className={`h-4 w-4 rounded ${modoOscuro ? 'text-gray-300 focus:ring-gray-500 border-gray-600' : 'text-gray-900 focus:ring-gray-900 border-gray-300'}`}
                  />
                  <label htmlFor="isPopular" className={`block text-xs ${textPri}`}>
                    Marcar como plan popular
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-3">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500' : 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900'}`}
                  >
                    Crear plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${btnOut}`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Plan */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 w-full max-w-2xl">
            <div className={`mx-4 rounded-2xl p-5 ${box}`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>
                Editar plan: {selectedPlan?.name}
              </h3>
              <form onSubmit={handleEditPlan} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData, 
                          name,
                          slug: generateSlug(name)
                        });
                      }}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Slug *
                    </label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, slug: generateSlug(formData.name)})}
                        className={`px-3 py-2 rounded-lg border text-xs ${btnOut}`}
                        title="Generar slug automáticamente"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Precio *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Moneda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Ciclo de cobro
                    </label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de empleados
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxEmployees}
                      onChange={(e) => setFormData({...formData, maxEmployees: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de empresas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxCompanies}
                      onChange={(e) => setFormData({...formData, maxCompanies: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Máximo de plantillas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxTemplates}
                      onChange={(e) => setFormData({...formData, maxTemplates: parseInt(e.target.value) || 1})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium ${textSec}`}>
                      Estado
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium ${textSec}`}>
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                    className={`h-4 w-4 rounded ${modoOscuro ? 'text-gray-300 focus:ring-gray-500 border-gray-600' : 'text-gray-900 focus:ring-gray-900 border-gray-300'}`}
                  />
                  <label htmlFor="editIsPopular" className={`block text-xs ${textPri}`}>
                    Marcar como plan popular
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-3">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500' : 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900'}`}
                  >
                    Actualizar plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${btnOut}`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Plan */}
      {showViewModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/40 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-0 w-full max-w-2xl">
            <div className={`mx-4 rounded-2xl p-5 ${box}`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>
                Detalles del plan: {selectedPlan.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="space-y-3">
                  <div>
                    <span className={`text-xs font-medium ${textSec}`}>Nombre</span>
                    <p className={`text-sm font-semibold mt-0.5 ${textPri}`}>{selectedPlan.name}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-medium ${textSec}`}>Slug</span>
                    <p className={`text-xs px-2 py-1 rounded border mt-0.5 ${textPri} ${modoOscuro ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>{selectedPlan.slug}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-medium ${textSec}`}>Precio</span>
                    <p className={`text-sm mt-0.5 ${textPri}`}>
                      ${selectedPlan.price} {selectedPlan.currency} / {selectedPlan.billingCycle === 'monthly' ? 'mes' : 'año'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs font-medium ${textSec}`}>Estado</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {getStatusBadge(selectedPlan.isActive)}
                      {getPopularBadge(selectedPlan.isPopular)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className={`text-xs font-medium ${textSec}`}>Límites</span>
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center">
                        <FiUsers className={`w-4 h-4 mr-2 ${textMuted}`} />
                        <span className={`text-sm ${textPri}`}>{selectedPlan.maxEmployees} usuarios</span>
                      </div>
                      <div className="flex items-center">
                        <FiBriefcase className={`w-4 h-4 mr-2 ${textMuted}`} />
                        <span className={`text-sm ${textPri}`}>{selectedPlan.maxCompanies} empresas</span>
                      </div>
                      <div className="flex items-center">
                        <FiFileText className={`w-4 h-4 mr-2 ${textMuted}`} />
                        <span className={`text-sm ${textPri}`}>{selectedPlan.maxTemplates} plantillas</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedPlan.description && (
                    <div>
                      <span className={`text-xs font-medium ${textSec}`}>Descripción</span>
                      <p className={`text-sm mt-1 p-3 rounded border ${textPri} ${modoOscuro ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        {selectedPlan.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className={`w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500' : 'bg-gray-900 text-white hover:bg-black focus:ring-gray-900'}`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPlans;
