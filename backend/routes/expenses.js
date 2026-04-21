const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');

const router = express.Router();

async function getUserCompanies(req) {
  if (req.user.role === 'employee') {
    const user = await User.findById(req.user.userId).select('employeeOf').lean();
    if (!user?.employeeOf?.length) return [req.user.userId];
    const companyIds = user.employeeOf.map(e => e.company).filter(Boolean);
    const companies = await Company.find({ _id: { $in: companyIds } }).select('owner').lean();
    const ownerIds = companies.map(c => c.owner).filter(Boolean);
    return [...companyIds, ...ownerIds];
  }
  if (req.user.isSuperAdmin === true) return [req.user.userId];
  if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
    const companies = await Company.find({}, '_id');
    return companies.map(c => c._id);
  }
  if (req.user.role === 'company_owner') return req.user.ownedCompanies || [];
  const user = await User.findById(req.user.userId).populate('currentPlan');
  let userCompanies = [];
  if (user?.currentPlan && ['Empresarial', 'Enterprise'].includes(user.currentPlan.name)) {
    if (user.ownedCompanies?.length) userCompanies = [...user.ownedCompanies];
    if (user.employeeOf?.length) {
      const empCompanies = user.employeeOf.map(emp => emp.company);
      userCompanies = [...userCompanies, ...empCompanies];
    }
  } else if (user?.ownedCompanies?.length) userCompanies = user.ownedCompanies;
  if (userCompanies.length === 0) userCompanies = [req.user.userId];
  return userCompanies;
}

// Listar egresos del usuario
router.get('/expenses', auth, async (req, res) => {
  try {
    const userCompanies = await getUserCompanies(req);
    const filterQuery = userCompanies.length > 0
      ? { $or: [{ userId: { $in: userCompanies } }, { companyId: { $in: userCompanies } }] }
      : { userId: req.user.userId };
    const expenses = await Expense.find(filterQuery).sort({ fecha: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    res.status(500).json({ message: 'Error al obtener el registro de gastos.' });
  }
});

// Crear egreso
router.post('/expenses', auth, async (req, res) => {
  try {
    if (req.body._id) delete req.body._id;
    let companyId = req.user.ownedCompanies?.[0] || req.user.userId;
    if (req.user.role === 'employee' && req.user.employeeOf?.length) {
      const first = req.user.employeeOf[0];
      companyId = first.company || first.company?._id || companyId;
    }
    const expense = new Expense({
      ...req.body,
      userId: req.user.userId,
      companyId
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error al crear egreso:', error);
    res.status(500).json({ message: 'Error al registrar el gasto.' });
  }
});

// Editar egreso
router.put('/expenses/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    const userCompanies = await getUserCompanies(req);
    const canEdit = userCompanies.some(
      id => id.toString() === expense.userId?.toString() || id.toString() === expense.companyId?.toString()
    );
    if (!canEdit) return res.status(403).json({ message: 'No tienes permisos para editar este gasto.' });
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    console.error('Error al editar egreso:', error);
    res.status(500).json({ message: 'Error al actualizar el gasto.' });
  }
});

// Eliminar egreso
router.delete('/expenses/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    const userCompanies = await getUserCompanies(req);
    const canDelete = userCompanies.some(
      id => id.toString() === expense.userId?.toString() || id.toString() === expense.companyId?.toString()
    );
    if (!canDelete) return res.status(403).json({ message: 'No tienes permisos para eliminar este gasto.' });
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gasto eliminado.' });
  } catch (error) {
    console.error('Error al eliminar egreso:', error);
    res.status(500).json({ message: 'Error al eliminar el gasto.' });
  }
});

module.exports = router;
