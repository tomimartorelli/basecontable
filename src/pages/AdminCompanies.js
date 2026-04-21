import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  FiBriefcase, 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiUsers,
  FiCalendar
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../hooks/useApi';
import useAdminPermissions from '../hooks/useAdminPermissions';
import { ThemeContext } from '../context/ThemeContext';

const AdminCompanies = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const {
    canManageCompanies,
    getCompanyLimit,
    canAddMoreCompanies,
    getABMAccessLevel
  } = useAdminPermissions();

  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    taxId: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    status: 'active',
    employees: 1
  });

  // Función para mapear datos de empresa del backend al frontend
  const mapCompanyData = (company) => ({
    name: company.name || '',
    legalName: company.legalName || '',
    taxId: company.taxId || '',
    address: company.address?.street || '',
    city: company.address?.city || '',
    country: company.address?.country || '',
    phone: company.contact?.phone || '',
    email: company.contact?.email || '',
    website: company.contact?.website || '',
    status: company.isActive ? 'active' : 'inactive',
    employees: company.employees?.length || 1
  });

  // Función para mapear datos del frontend al backend
  const mapToBackendFormat = (data) => ({
    name: data.name,
    legalName: data.legalName,
    taxId: data.taxId,
    address: data.address,
    city: data.city,
    country: data.country,
    phone: data.phone,
    email: data.email,
    website: data.website,
    status: data.status,
    employees: data.employees
  });

  const accessLevel = getABMAccessLevel();

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      
      // Endpoint diferente según el nivel de acceso
      const endpoint = accessLevel === 'full' 
        ? '/api/admin/companies' 
        : '/api/admin/companies/user';
      
      const response = await secureFetch(endpoint);
      
      if (response.ok) {
        const companiesData = await response.json();
        setCompanies(companiesData);
      } else {
        throw new Error('Error al cargar empresas');
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  }, [secureFetch, accessLevel]);

  const filterCompanies = useCallback(() => {
    let filtered = companies;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(company => 
        statusFilter === 'active' ? company.isActive : !company.isActive
      );
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, statusFilter]);

  useEffect(() => {
    if (canManageCompanies()) {
      loadCompanies();
    }
  }, [canManageCompanies, loadCompanies]);

  useEffect(() => {
    filterCompanies();
  }, [filterCompanies]);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    
    if (!canAddMoreCompanies(companies.length)) {
      alert('Has alcanzado el límite de empresas de tu plan');
      return;
    }

    try {
      const response = await secureFetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapToBackendFormat(formData)),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ 
          name: '', legalName: '', taxId: '', address: '', city: '', 
          country: '', phone: '', email: '', website: '', status: 'active', 
          employees: 1 
        });
        loadCompanies();
      } else {
        throw new Error('Error al crear empresa');
      }
    } catch (error) {
      console.error('Error al crear empresa:', error);
      alert('Error al crear la empresa');
    }
  };

  const handleEditCompany = async (e) => {
    e.preventDefault();
    
    try {
      const response = await secureFetch(`/api/admin/companies/${selectedCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapToBackendFormat(formData)),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedCompany(null);
        setFormData({ 
          name: '', legalName: '', taxId: '', address: '', city: '', 
          country: '', phone: '', email: '', website: '', status: 'active', 
          employees: 1 
        });
        loadCompanies();
      } else {
        throw new Error('Error al actualizar empresa');
      }
    } catch (error) {
      console.error('Error al actualizar empresa:', error);
      alert('Error al actualizar la empresa');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      return;
    }

    try {
      const response = await secureFetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCompanies();
      } else {
        throw new Error('Error al eliminar empresa');
      }
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      alert('Error al eliminar la empresa');
    }
  };

  const openEditModal = (company) => {
    setSelectedCompany(company);
    setFormData(mapCompanyData(company));
    setShowEditModal(true);
  };

  const openViewModal = (company) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  };

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-800 hover:bg-gray-50';
  const badge = modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200';
  const badgeActive = modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-900 border-gray-300';
  const badgeInactive = modoOscuro ? 'bg-gray-800 text-gray-400 border-gray-600' : 'bg-gray-50 text-gray-600 border-gray-200';
  const tableRow = modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50/70';
  const divideY = modoOscuro ? 'divide-gray-700' : 'divide-gray-100';

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Activa', color: badgeActive },
      inactive: { text: 'Inactiva', color: badgeInactive }
    };
    return badges[status] || badges.inactive;
  };

  if (!canManageCompanies()) {
    return (
      <AdminLayout>
        <div className={`min-h-[60vh] flex items-center justify-center px-4 ${modoOscuro ? 'bg-black' : 'bg-[#f5f5f7]'}`}>
          <div className="text-center max-w-md">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <FiBriefcase className="w-7 h-7" />
            </div>
            <h3 className={`text-base font-semibold mb-1 ${textPri}`}>Acceso restringido a empresas</h3>
            <p className={`text-sm ${textSec}`}>
              Tu usuario no tiene permisos para gestionar empresas en este entorno.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredPermission={canManageCompanies}>
      <div className={modoOscuro ? 'min-h-full bg-black' : 'min-h-full bg-[#f5f5f7]'}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className={`text-xl font-semibold ${textPri}`}>Empresas</h1>
              <p className={`text-sm ${textSec}`}>Administra las empresas vinculadas a tu cuenta.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-xs sm:text-sm ${textSec}`}>
                {companies.length} / {getCompanyLimit()} empresas
              </div>
              {canAddMoreCompanies(companies.length) && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${modoOscuro ? 'border-gray-400 text-white hover:bg-gray-700' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'}`}
                >
                  <FiPlus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>
          </div>

          <div className={`rounded-2xl p-4 sm:p-5 border ${box}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              <button
                onClick={loadCompanies}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${btnOut}`}
              >
                <FiRefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>

          {/* Lista mobile como tarjetas */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className={`px-4 py-6 text-center text-sm ${textMuted}`}>
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-6 h-6 border-[3px] rounded-full animate-spin ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`} />
                  <p>Cargando empresas...</p>
                </div>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className={`px-4 py-6 text-center text-sm ${textMuted}`}>
                <div className="flex flex-col items-center gap-3">
                  <FiBriefcase className={`w-8 h-8 ${textMuted}`} />
                  <p>No se encontraron empresas</p>
                </div>
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div
                  key={company._id}
                  className={`rounded-2xl border px-4 py-3 flex flex-col gap-2 ${
                    modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs font-medium ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                      {company.name?.charAt(0)?.toUpperCase() || 'E'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${textPri}`}>{company.name}</div>
                      <div className={`text-xs truncate ${textMuted}`}>{company.legalName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${badge}`}>
                          {company.plan?.name || 'Sin plan'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${
                            getStatusBadge(company.isActive ? 'active' : 'inactive').color
                          }`}
                        >
                          {getStatusBadge(company.isActive ? 'active' : 'inactive').text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className={`flex items-center gap-1 ${textPri}`}>
                      <FiMapPin className={`w-3.5 h-3.5 ${textMuted}`} />
                      <span className="truncate">
                        {company.address?.city || 'N/A'}, {company.address?.country || 'N/A'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${textPri}`}>
                      <FiUsers className={`w-3.5 h-3.5 ${textMuted}`} />
                      {company.employees?.length || 1}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => openViewModal(company)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Ver detalles"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      Ver
                    </button>
                    <button
                      onClick={() => openEditModal(company)}
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Editar empresa"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company._id)}
                      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] transition-colors ${btnOut}`}
                      title="Eliminar empresa"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tabla para pantallas medianas y grandes */}
          <div className={`hidden md:block rounded-2xl border overflow-hidden ${box}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={tableHead}>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Empresa
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Propietario
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Plan
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Ubicación
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Empleados
                    </th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className={`${modoOscuro ? 'bg-gray-900' : 'bg-white'} divide-y ${divideY}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className={`px-4 py-10 text-center text-sm ${textMuted}`}>
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-6 h-6 border-[3px] rounded-full animate-spin ${modoOscuro ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-900'}`} />
                          <p>Cargando empresas...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={`px-4 py-10 text-center text-sm ${textMuted}`}>
                        <div className="flex flex-col items-center gap-3">
                          <FiBriefcase className={`w-8 h-8 ${textMuted}`} />
                          <p>No se encontraron empresas</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr key={company._id} className={tableRow}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xs font-medium ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                              {company.name?.charAt(0)?.toUpperCase() || 'E'}
                            </div>
                            <div>
                              <div className={`text-sm font-medium line-clamp-1 ${textPri}`}>
                                {company.name}
                              </div>
                              <div className={`text-xs line-clamp-1 ${textMuted}`}>
                                {company.legalName}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-medium ${modoOscuro ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                              {company.owner?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className={`text-sm line-clamp-1 ${textPri}`}>
                                {company.owner?.name || 'N/A'}
                              </div>
                              <div className={`text-xs line-clamp-1 ${textMuted}`}>
                                {company.owner?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                            {company.plan?.name || 'N/A'}
                          </span>
                        </td>

                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${textPri}`}>
                          <div className="flex items-center gap-1.5">
                            <FiMapPin className={`w-3.5 h-3.5 ${textMuted}`} />
                            <span className="truncate">
                              {company.address?.city || 'N/A'}, {company.address?.country || 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              getStatusBadge(company.isActive ? 'active' : 'inactive').color
                            }`}
                          >
                            {getStatusBadge(company.isActive ? 'active' : 'inactive').text}
                          </span>
                        </td>

                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${textPri}`}>
                          <div className="flex items-center gap-1.5">
                            <FiUsers className={`w-3.5 h-3.5 ${textMuted}`} />
                            {company.employees?.length || 1}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openViewModal(company)}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Ver detalles"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                            <button
                              onClick={() => openEditModal(company)}
                              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Editar empresa"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCompany(company._id)}
                              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs transition-colors ${btnOut}`}
                              title="Eliminar empresa"
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
        {/* Modal Agregar Empresa */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className={`${box} rounded-2xl p-5 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>Agregar empresa</h3>
              
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Nombre comercial *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Razón social</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>CUIT / RUT</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>País *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Sitio web</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Nº de empleados</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.employees}
                      onChange={(e) => setFormData({...formData, employees: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Dirección</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  />
                </div>
                
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${btnOut}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'}`}
                  >
                    Crear Empresa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Editar Empresa */}
        {showEditModal && selectedCompany && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className={`${box} rounded-2xl p-5 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>Editar empresa</h3>
              
              <form onSubmit={handleEditCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Nombre comercial *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Razón social</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>CUIT / RUT</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Ciudad *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>País *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Sitio web</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Nº de empleados</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.employees}
                      onChange={(e) => setFormData({...formData, employees: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${textSec}`}>Dirección</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 ${inputClass}`}
                  />
                </div>
                
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${btnOut}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'}`}
                  >
                    Actualizar Empresa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ver Empresa */}
        {showViewModal && selectedCompany && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className={`${box} rounded-2xl p-5 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-base font-semibold mb-3 ${textPri}`}>Detalles de la empresa</h3>
              
              <div className="space-y-6">
                {/* Header de la empresa */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
                    <span className="text-xl font-medium">
                      {selectedCompany.name?.charAt(0)?.toUpperCase() || 'E'}
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${textPri}`}>{selectedCompany.name}</h4>
                    <p className={`text-sm ${textSec}`}>{selectedCompany.legalName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(selectedCompany.isActive ? 'active' : 'inactive').color}`}>
                         {getStatusBadge(selectedCompany.isActive ? 'active' : 'inactive').text}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                        {selectedCompany.plan?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Información de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiMapPin className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Ubicación</span>
                      <span className={`text-sm ${textPri}`}>{selectedCompany.address?.city || 'N/A'}, {selectedCompany.address?.country || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FiPhone className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Teléfono</span>
                      <span className={`text-sm ${textPri}`}>{selectedCompany.contact?.phone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FiMail className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Email</span>
                      <span className={`text-sm ${textPri}`}>{selectedCompany.contact?.email || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FiGlobe className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Sitio web</span>
                      <span className={`text-sm ${textPri}`}>{selectedCompany.contact?.website || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FiUsers className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Empleados</span>
                      <span className={`text-sm ${textPri}`}>{selectedCompany.employees?.length || 1}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FiCalendar className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs ${textSec}`}>Creada</span>
                      <span className={`text-sm ${textPri}`}>
                        {selectedCompany.createdAt ? 
                          new Date(selectedCompany.createdAt).toLocaleDateString('es-ES') : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Dirección */}
                {selectedCompany.address?.street && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <FiMapPin className={`w-4 h-4 ${textMuted}`} />
                      <span className={`text-xs font-medium ${textSec}`}>Dirección completa</span>
                    </div>
                    <p className={`text-sm p-3 rounded-lg border ${textPri} ${modoOscuro ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      {selectedCompany.address.street}, {selectedCompany.address.city}, {selectedCompany.address.country}
                    </p>
                  </div>
                )}
                
                {/* Botón de cerrar */}
                <div className="pt-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className={`w-full px-4 py-2 rounded-lg text-sm transition-colors ${modoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-black'}`}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanies;
