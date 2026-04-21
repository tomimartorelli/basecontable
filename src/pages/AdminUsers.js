import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  FiUsers, 
  FiSearch, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiRefreshCw,
  FiUserPlus,
  FiShield,
  FiPhone,
  FiCalendar,
  FiBriefcase,
  FiStar
} from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { useApi } from '../hooks/useApi';
import useAdminPermissions from '../hooks/useAdminPermissions';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ThemeContext } from '../context/ThemeContext';

const AdminUsers = () => {
  const { modoOscuro } = useContext(ThemeContext);
  const { secureFetch } = useApi();
  const {
    canManageUsers,
    getUserLimit,
    canAddMoreUsers,
    getABMAccessLevel
  } = useAdminPermissions();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter] = useState('all'); // Filtro por rol (UI no implementada aún)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    company: '',
    phone: '',
    status: 'active',
    currentPlan: '',
    password: ''
  });
  
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const accessLevel = getABMAccessLevel();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Siempre usar el endpoint admin para obtener usuarios con información de planes
      const response = await secureFetch('/api/admin/users');
      
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
        console.log('✅ Usuarios cargados:', usersData.length);
      } else {
        throw new Error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  }, [secureFetch]);

  const loadPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const response = await secureFetch('/api/plans');
      
      if (response.ok) {
        const plansData = await response.json();
        setPlans(plansData);
        console.log('✅ Planes cargados:', plansData.length);
      } else {
        console.error('❌ Error al cargar planes:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar planes:', error);
    } finally {
      setLoadingPlans(false);
    }
  }, [secureFetch]);

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Filtro por rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    if (canManageUsers()) {
      loadUsers();
      loadPlans();
    }
  }, [canManageUsers, loadUsers, loadPlans]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    setErrorMessage('');
    setSuccessMessage('');

    if (!canAddMoreUsers(users.length)) {
      setErrorMessage('Has alcanzado el límite de usuarios incluido en tu plan.');
      return;
    }

    try {
      const response = await secureFetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await response.json(); // no necesitamos los datos, solo confirmar éxito

        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          role: 'employee',
          company: '',
          phone: '',
          status: 'active',
          currentPlan: '',
          password: ''
        });
        loadUsers();
        setSuccessMessage('Usuario creado correctamente.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setErrorMessage(error.message || 'Error al crear el usuario.');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Editando usuario:', selectedUser._id, 'con datos:', formData);
      
      const response = await secureFetch(`/api/admin/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('✅ Usuario actualizado:', updatedUser);
        
        setShowEditModal(false);
        setSelectedUser(null);
        setFormData({ name: '', email: '', role: 'employee', company: '', phone: '', status: 'active', currentPlan: '' });
        loadUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setErrorMessage(error.message || 'Error al actualizar el usuario.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      setErrorMessage('');
      setSuccessMessage('');
      console.log('🗑️ Eliminando usuario:', userId);
      
      const response = await secureFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Usuario eliminado correctamente');
        loadUsers();
        setSuccessMessage('Usuario eliminado correctamente.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setErrorMessage(error.message || 'Error al eliminar el usuario.');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'employee',
      company: user.company || '',
      phone: user.phone || '',
      status: user.status || 'active',
      currentPlan: user.currentPlan?._id || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Activo', color: 'bg-green-100 text-green-800' },
      inactive: { text: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
      suspended: { text: 'Suspendido', color: 'bg-red-100 text-red-800' },
      pending: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' }
    };
    return badges[status] || badges.inactive;
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: 'Administrador', color: 'bg-purple-100 text-purple-800' },
      company_owner: { text: 'Propietario', color: 'bg-blue-100 text-blue-800' },
      employee: { text: 'Empleado', color: 'bg-green-100 text-green-800' },
      user: { text: 'Usuario', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[role] || badges.user;
  };

  const box = modoOscuro ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textPri = modoOscuro ? 'text-white' : 'text-gray-900';
  const textSec = modoOscuro ? 'text-gray-300' : 'text-gray-600';
  const textMuted = modoOscuro ? 'text-gray-400' : 'text-gray-500';
  const inputClass = modoOscuro ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-900 focus:border-gray-900';
  const tableHead = modoOscuro ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500';
  const tableRow = modoOscuro ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const badge = modoOscuro ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200';
  const btnOut = modoOscuro ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50';

  if (!canManageUsers()) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-white ${modoOscuro ? 'bg-gray-700' : 'bg-gray-900'}`}>
              <FiShield className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-semibold mb-1 ${textPri}`}>Acceso restringido</h3>
            <p className={`text-xs ${textSec}`}>
              Tu usuario no tiene permisos para ver la gestión de usuarios.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredPermission={canManageUsers}>
      <div className="max-w-7xl mx-auto space-y-5">
        {errorMessage && (
          <div className={modoOscuro ? 'bg-red-900/40 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-xs' : 'bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs'}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className={modoOscuro ? 'bg-green-900/30 border border-green-700 text-green-200 rounded-xl px-4 py-3 text-xs' : 'bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-xs'}>
            {successMessage}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${modoOscuro ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}>
              <FiUsers className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h1 className={`text-2xl font-semibold ${textPri}`}>Usuarios</h1>
              <p className={`text-xs ${textSec}`}>Personas que pueden acceder a Contasuite.</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className={`text-xs sm:text-sm ${textSec}`}>
              <span className="font-semibold">{users.length}</span> de{' '}
              <span className="font-semibold">{getUserLimit()}</span> usuarios disponibles
            </div>
            {canAddMoreUsers(users.length) && (
              <button
                onClick={() => setShowAddModal(true)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs sm:text-sm transition-colors ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
              >
                <FiUserPlus className="w-4 h-4" />
                Añadir usuario
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMuted}`} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`block w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClass}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 ${inputClass}`}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <button
              onClick={loadUsers}
              className={`inline-flex items-center justify-center px-3 py-2 border rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 ${btnOut}`}
              title="Actualizar lista"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista mobile como tarjetas */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className={`px-4 py-6 text-center text-sm ${textSec}`}>Cargando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FiUsers className={`w-12 h-12 mx-auto mb-4 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={textMuted}>No se encontraron usuarios</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`rounded-2xl border px-4 py-3 flex items-start justify-between gap-3 ${
                  modoOscuro ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                      <span className="text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${textPri} truncate`}>{user.name}</div>
                      <div className={`text-xs ${textMuted} truncate`}>{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${badge}`}>
                      {getRoleBadge(user.role).text}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium border ${badge}`}>
                      {user.currentPlan?.name || 'Sin Plan'}
                    </span>
                    <span className={textMuted}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => openViewModal(user)}
                    className={`p-1.5 rounded-md border ${btnOut}`}
                    title="Ver detalles"
                  >
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(user)}
                    className={`p-1.5 rounded-md border ${btnOut}`}
                    title="Editar usuario"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className={`p-1.5 rounded-md border ${btnOut}`}
                    title="Eliminar usuario"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tabla para pantallas medianas y grandes */}
        <div className={`hidden md:block rounded-2xl shadow-sm border overflow-hidden ${box}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`text-[11px] ${tableHead}`}>
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Usuario
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Rol
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Empresa
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium uppercase tracking-wide">
                    Último acceso
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${modoOscuro ? 'bg-gray-900 divide-gray-700' : 'bg-white divide-gray-100'}`}>
                {loading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td colSpan="7" className="px-6 py-4">
                          <LoadingSkeleton type="tableRow" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FiUsers className={`w-12 h-12 mx-auto mb-4 ${modoOscuro ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={textMuted}>No se encontraron usuarios</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className={`transition-colors ${tableRow}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                            <span className="text-sm font-medium">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className={`text-sm font-medium ${textPri}`}>{user.name}</div>
                            <div className={`text-xs ${textMuted}`}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                          {getRoleBadge(user.role).text}
                        </span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-xs ${textPri}`}>
                        {user.company || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                          {user.currentPlan?.name || 'Sin Plan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                          {getStatusBadge(user.status).text}
                        </span>
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-xs ${textMuted}`}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button onClick={() => openViewModal(user)} className={`p-1.5 rounded-md border ${btnOut}`} title="Ver detalles">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(user)} className={`p-1.5 rounded-md border ${btnOut}`} title="Editar usuario">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteUser(user._id)} className={`p-1.5 rounded-md border ${btnOut}`} title="Eliminar usuario">
                            <FiTrash2 className="w-4 h-4" />
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

        {/* Modal Agregar Usuario */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-2xl p-6 w-full max-w-md mx-4 border ${box}`}>
              <h3 className={`text-base font-semibold mb-4 ${textPri}`}>Nuevo usuario</h3>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  >
                    <option value="employee">Empleado</option>
                    <option value="user">Usuario</option>
                    {accessLevel === 'full' && (
                      <>
                        <option value="admin">Administrador</option>
                        <option value="company_owner">Propietario de Empresa</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Empresa</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Plan</label>
                  <select
                    value={formData.currentPlan}
                    onChange={(e) => setFormData({...formData, currentPlan: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                    disabled={loadingPlans}
                  >
                    <option value="">
                      {loadingPlans ? 'Cargando planes...' : 'Seleccionar Plan'}
                    </option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} - ${plan.price}
                      </option>
                    ))}
                  </select>
                  {loadingPlans && (
                    <div className="mt-1 text-xs text-gray-500">
                      Cargando planes disponibles...
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Contraseña</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                    autoComplete="new-password"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm"
                  >
                    Crear usuario
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          
        {/* Modal Editar Usuario */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-2xl p-6 w-full max-w-md mx-4 border ${box}`}>
              <h3 className={`text-base font-semibold mb-4 ${textPri}`}>Editar usuario</h3>
              
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  />
                  </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  >
                    <option value="employee">Empleado</option>
                    <option value="user">Usuario</option>
                    {accessLevel === 'full' && (
                      <>
                        <option value="admin">Administrador</option>
                        <option value="company_owner">Propietario de Empresa</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Plan</label>
                  <select
                    value={formData.currentPlan}
                    onChange={(e) => setFormData({...formData, currentPlan: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                    disabled={loadingPlans}
                  >
                    <option value="">
                      {loadingPlans ? 'Cargando planes...' : 'Seleccionar Plan'}
                    </option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} - ${plan.price}
                      </option>
                    ))}
                  </select>
                  {loadingPlans && (
                    <div className="mt-1 text-xs text-gray-500">
                      Cargando planes disponibles...
                    </div>
                  )}
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSec}`}>Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${inputClass}`}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                        <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm"
                  >
                    Guardar cambios
                        </button>
              </div>
              </form>
            </div>
                      </div>
        )}

        {/* Modal Ver Usuario */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-2xl p-6 w-full max-w-md mx-4 border ${box}`}>
              <h3 className={`text-base font-semibold mb-4 ${textPri}`}>Detalle del usuario</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${modoOscuro ? 'bg-gray-600' : 'bg-gray-900'}`}>
                    <span className="text-lg font-medium">
                      {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${textPri}`}>{selectedUser.name}</h4>
                    <p className={`text-xs ${textSec}`}>{selectedUser.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiShield className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Rol:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                      {getRoleBadge(selectedUser.role).text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiBriefcase className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Empresa:</span>
                    <span className={`text-xs ${textPri}`}>{selectedUser.company || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiStar className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Plan:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                      {selectedUser.currentPlan?.name || 'Sin Plan'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Teléfono:</span>
                    <span className={`text-xs ${textPri}`}>{selectedUser.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Estado:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}>
                      {getStatusBadge(selectedUser.status).text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className={`w-4 h-4 ${textMuted}`} />
                    <span className={`text-xs ${textSec}`}>Último acceso:</span>
                    <span className={`text-xs ${textPri}`}>
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('es-ES') : 'Nunca'}
                    </span>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className={`w-full px-4 py-2 text-white rounded-lg transition-colors text-sm ${modoOscuro ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-900 hover:bg-black'}`}
                  >
                    Cerrar
                  </button>
                  </div>
                </div>
            </div>
          </div>
        )}
        </div>
    </AdminLayout>
  );
};

export default AdminUsers;
