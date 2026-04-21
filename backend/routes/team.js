const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const Activity = require('../models/Activity');
const Plan = require('../models/Plan');

const router = express.Router();

const sendError = (res, status, code, message) => {
  return res.status(status).json({ code, message });
};

// Función auxiliar para obtener la empresa del usuario
async function getOwnedCompany(req) {
  const userId = req.user.userId;
  // Convertir a ObjectId para asegurar comparación correcta
  const ownerId = new mongoose.Types.ObjectId(userId);
  return await Company.findOne({ owner: ownerId });
}

/** Si el company_owner con plan empresarial no tiene empresa, crea una y la asocia. */
async function getOrCreateOwnedCompany(req, requester) {
  let company = await getOwnedCompany(req);
  if (company) return company;
  if (requester.role !== 'company_owner') return null;
  let planId = requester.currentPlan?._id || requester.currentPlan;
  if (!planId) {
    const fallbackPlan = await Plan.findOne({ slug: { $in: ['empresarial', 'enterprise'] }, isActive: true });
    planId = fallbackPlan?._id;
  }
  if (!planId) return null;
  const companyName = requester.name ? `${requester.name} – Empresa` : 'Mi empresa';
  company = new Company({
    name: companyName,
    legalName: companyName,
    owner: requester._id,
    plan: planId,
    subscription: { status: 'active', startDate: new Date(), autoRenew: false }
  });
  await company.save();
  await User.findByIdAndUpdate(requester._id, { $push: { ownedCompanies: company._id } });
  return company;
}

async function getUserWithPlan(userId) {
  return await User.findById(userId).populate('currentPlan');
}

function ensureBusinessAccess(user) {
  const slug = (user?.currentPlan?.slug || '').toLowerCase();
  const planFeatures = user?.currentPlan?.features || {};
  const hasEmployeeAccounts = !!user?.unlockedFeatures?.employeeAccounts || !!planFeatures?.employeeAccounts;
  const isEligiblePlan = ['empresarial', 'enterprise'].includes(slug);
  return isEligiblePlan && hasEmployeeAccounts;
}

// GET /api/team/users - Listar equipo de la empresa del owner
router.get('/team/users', auth, async (req, res) => {
  try {
    const requester = await getUserWithPlan(req.user.userId);
    if (!requester) return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado.');

    if (requester.role !== 'company_owner' && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado.');
    }

    if (!ensureBusinessAccess(requester) && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'PLAN_RESTRICTED', 'Tu plan no incluye gestión de equipo.');
    }

    let company = await getOrCreateOwnedCompany(req, requester);
    if (!company) return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');

    const employeeIds = (company.employees || []).map(e => e.user).filter(Boolean);
    const users = await User.find({ _id: { $in: [company.owner, ...employeeIds] } })
      .select('name email phone role company createdAt lastLogin');

    const mapped = users.map(u => {
      const isOwner = String(u._id) === String(company.owner);
      const employeeEntry = (company.employees || []).find(e => String(e.user) === String(u._id));
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        isOwner,
        companyRole: isOwner ? 'owner' : (employeeEntry?.role || 'employee'),
        permissions: isOwner ? { all: true } : (employeeEntry?.permissions || {}),
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      };
    });

    res.json({
      company: { _id: company._id, name: company.name },
      users: mapped
    });
  } catch (error) {
    console.error('❌ Team: Error al listar usuarios:', error);
    res.status(500).json({ message: 'Error al listar usuarios del equipo.' });
  }
});

// POST /api/team/users - Crear empleado
router.post('/team/users', auth, async (req, res) => {
  try {
    const requester = await getUserWithPlan(req.user.userId);
    if (!requester) return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado.');

    if (requester.role !== 'company_owner' && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado.');
    }

    if (!ensureBusinessAccess(requester) && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'PLAN_RESTRICTED', 'Tu plan no incluye gestión de equipo.');
    }

    const { name, email, password, phone, companyRole, permissions } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Nombre, email y contraseña son obligatorios.');
    }
    if (typeof password !== 'string' || password.length < 6) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 6 caracteres.');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'EMAIL_ALREADY_REGISTERED', 'Ya existe un usuario con ese email.');
    }

    let company = await getOrCreateOwnedCompany(req, requester);
    if (!company) return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');

    const maxEmployees = requester.currentPlan?.maxEmployees || 1;
    const currentCount = 1 + (company.employees?.filter(e => e.isActive !== false).length || 0); // owner + empleados activos
    if (currentCount >= maxEmployees) {
      return sendError(res, 400, 'PLAN_LIMIT_REACHED', `Límite de usuarios alcanzado (${maxEmployees}).`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // El empleado hereda el plan/funcionalidades del owner (para coherencia de features)
    const newUser = new User({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: 'employee',
      company: company.name,
      currentPlan: requester.currentPlan?._id,
      unlockedFeatures: requester.unlockedFeatures,
      employeeOf: [{
        company: new mongoose.Types.ObjectId(company._id),
        role: (companyRole === 'admin' || companyRole === 'viewer') ? companyRole : 'employee',
        permissions: permissions || {}
      }]
    });

    await newUser.save();

    company.employees.push({
      user: newUser._id,
      role: (companyRole === 'admin' || companyRole === 'viewer') ? companyRole : 'employee',
      permissions: permissions || {},
      acceptedAt: new Date(),
      isActive: true
    });
    await company.save();

    await Activity.create({
      user: requester._id,
      action: 'TEAM_USER_CREATED',
      details: `Creó usuario ${email} en empresa ${company.name}`
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '',
      isOwner: false,
      companyRole: (companyRole === 'admin' || companyRole === 'viewer') ? companyRole : 'employee',
      permissions: permissions || {}
    });
  } catch (error) {
    console.error('❌ Team: Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario del equipo.' });
  }
});

// PUT /api/team/users/:id - Editar empleado (no owner)
router.put('/team/users/:id', auth, async (req, res) => {
  try {
    const requester = await getUserWithPlan(req.user.userId);
    if (!requester) return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado.');

    if (requester.role !== 'company_owner' && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado.');
    }

    if (!ensureBusinessAccess(requester) && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'PLAN_RESTRICTED', 'Tu plan no incluye gestión de equipo.');
    }

    let company = await getOrCreateOwnedCompany(req, requester);
    if (!company) return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');

    const targetId = req.params.id;
    if (String(company.owner) === String(targetId)) {
      return sendError(res, 400, 'INVALID_TARGET', 'No puedes editar al propietario desde aquí.');
    }

    const employeeEntry = (company.employees || []).find(e => String(e.user) === String(targetId));
    if (!employeeEntry) return sendError(res, 404, 'EMPLOYEE_NOT_FOUND', 'Empleado no encontrado.');

    const { name, phone, password, companyRole, permissions, isActive } = req.body;

    const updateUser = {};
    if (name !== undefined) updateUser.name = name;
    if (phone !== undefined) updateUser.phone = phone;
    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'La contraseña debe tener al menos 6 caracteres.');
      }
      const salt = await bcrypt.genSalt(10);
      updateUser.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateUser).length > 0) {
      await User.findByIdAndUpdate(targetId, { $set: updateUser }, { runValidators: true });
    }

    if (companyRole) {
      employeeEntry.role = (companyRole === 'admin' || companyRole === 'viewer') ? companyRole : 'employee';
    }
    if (permissions) {
      employeeEntry.permissions = permissions;
    }
    if (isActive !== undefined) {
      employeeEntry.isActive = !!isActive;
    }

    await company.save();

    await Activity.create({
      user: requester._id,
      action: 'TEAM_USER_UPDATED',
      details: `Actualizó usuario ${targetId} en empresa ${company.name}`
    });

    res.json({ message: 'Usuario actualizado.' });
  } catch (error) {
    console.error('❌ Team: Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario del equipo.' });
  }
});

// DELETE /api/team/users/:id - Eliminar empleado
router.delete('/team/users/:id', auth, async (req, res) => {
  try {
    const requester = await getUserWithPlan(req.user.userId);
    if (!requester) return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado.');

    if (requester.role !== 'company_owner' && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado.');
    }

    if (!ensureBusinessAccess(requester) && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'PLAN_RESTRICTED', 'Tu plan no incluye gestión de equipo.');
    }

    let company = await getOrCreateOwnedCompany(req, requester);
    if (!company) return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');

    const targetId = req.params.id;
    if (String(company.owner) === String(targetId)) {
      return sendError(res, 400, 'INVALID_TARGET', 'No puedes eliminar al propietario.');
    }

    const before = company.employees?.length || 0;
    company.employees = (company.employees || []).filter(e => String(e.user) !== String(targetId));
    const after = company.employees.length;
    if (before === after) return sendError(res, 404, 'EMPLOYEE_NOT_FOUND', 'Empleado no encontrado.');

    await company.save();
    await User.findByIdAndDelete(targetId);

    await Activity.create({
      user: requester._id,
      action: 'TEAM_USER_DELETED',
      details: `Eliminó usuario ${targetId} en empresa ${company.name}`
    });

    res.json({ message: 'Usuario eliminado.' });
  } catch (error) {
    console.error('❌ Team: Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario del equipo.' });
  }
});

// GET /api/team/activity - Auditoría del equipo (owner + empleados)
router.get('/team/activity', auth, async (req, res) => {
  try {
    const requester = await getUserWithPlan(req.user.userId);
    if (!requester) return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado.');

    if (requester.role !== 'company_owner' && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado.');
    }

    if (!ensureBusinessAccess(requester) && !(requester.role === 'admin' && requester.isSuperAdmin === true)) {
      return sendError(res, 403, 'PLAN_RESTRICTED', 'Tu plan no incluye auditoría.');
    }

    let company = await getOrCreateOwnedCompany(req, requester);
    if (!company) return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada.');

    const ids = [company.owner, ...(company.employees || []).map(e => e.user).filter(Boolean)];
    const activities = await Activity.find({ user: { $in: ids } })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('user', 'name email');

    res.json({
      company: { _id: company._id, name: company.name },
      activities: activities.map(a => ({
        _id: a._id,
        action: a.action,
        details: a.details,
        user: a.user ? { name: a.user.name, email: a.user.email } : null,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Team: Error al obtener auditoría:', error);
    res.status(500).json({ message: 'Error al obtener auditoría.' });
  }
});

module.exports = router;

