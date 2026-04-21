const express = require('express');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

async function getUserCompanies(req) {
  if (req.user.isSuperAdmin === true) return [req.user.userId];
  if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
    const companies = await Company.find({}, '_id');
    return companies.map(c => c._id);
  }
  if (req.user.role === 'company_owner') return req.user.ownedCompanies || [];
  const user = await User.findById(req.user.userId).populate('currentPlan');
  let list = [];
  if (user?.currentPlan && ['Empresarial', 'Enterprise'].includes(user.currentPlan.name)) {
    if (user.ownedCompanies?.length) list = [...user.ownedCompanies];
    if (user.employeeOf?.length) list = [...list, ...user.employeeOf.map(e => e.company)];
  } else if (user?.ownedCompanies?.length) list = user.ownedCompanies;
  if (list.length === 0) list = [req.user.userId];
  return list;
}

function escapeCsv(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[,"\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsvLine(arr) {
  return arr.map(escapeCsv).join(',') + '\r\n';
}

// GET /api/export/ventas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/export/ventas', auth, async (req, res) => {
  try {
    const companies = await getUserCompanies(req);
    const filter = companies.length > 0
      ? { $or: [{ userId: { $in: companies } }, { companyId: { $in: companies } }] }
      : { userId: req.user.userId };

    const { desde, hasta } = req.query;
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = desde;
      if (hasta) filter.fecha.$lte = hasta;
    }

    const invoices = await Invoice.find(filter).sort({ fecha: 1, numero: 1 }).lean();
    const headers = ['Número', 'Fecha', 'Cliente', 'País', 'Email', 'Total', 'Estado', 'Categoría', 'Concepto'];
    let csv = '\uFEFF' + toCsvLine(headers);
    for (const inv of invoices) {
      const concepto = inv.conceptos?.[0]?.detalle ?? '';
      csv += toCsvLine([
        inv.numero,
        inv.fecha,
        inv.razonSocial,
        inv.pais,
        inv.email,
        inv.total,
        inv.estadoPago === 'pagada' ? 'Pagada' : 'Impaga',
        inv.categoria || '',
        concepto
      ]);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error export ventas:', error);
    res.status(500).json({ message: 'Error al exportar ventas.' });
  }
});

// GET /api/export/clientes
router.get('/export/clientes', auth, async (req, res) => {
  try {
    const companies = await getUserCompanies(req);
    const filter = companies.length > 0
      ? { $or: [{ userId: { $in: companies } }, { companyId: { $in: companies } }] }
      : { userId: req.user.userId };

    const clients = await Client.find(filter).sort({ razonSocial: 1 }).lean();
    const headers = ['Razón social', 'Email', 'País', 'Domicilio', 'Localidad', 'Teléfono'];
    let csv = '\uFEFF' + toCsvLine(headers);
    for (const c of clients) {
      csv += toCsvLine([
        c.razonSocial,
        c.email,
        c.pais,
        c.domicilio || '',
        c.localidad || '',
        c.telefono || ''
      ]);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error export clientes:', error);
    res.status(500).json({ message: 'Error al exportar clientes.' });
  }
});

// GET /api/export/egresos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/export/egresos', auth, async (req, res) => {
  try {
    const companies = await getUserCompanies(req);
    const filter = companies.length > 0
      ? { $or: [{ userId: { $in: companies } }, { companyId: { $in: companies } }] }
      : { userId: req.user.userId };

    const { desde, hasta } = req.query;
    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = desde;
      if (hasta) filter.fecha.$lte = hasta;
    }

    const expenses = await Expense.find(filter).sort({ fecha: 1 }).lean();
    const headers = ['Fecha', 'Concepto', 'Monto', 'Moneda', 'Categoría', 'Proveedor', 'Notas'];
    let csv = '\uFEFF' + toCsvLine(headers);
    for (const e of expenses) {
      csv += toCsvLine([
        e.fecha,
        e.concepto,
        e.monto,
        e.moneda || 'ARS',
        e.categoria || '',
        e.proveedor || '',
        e.notas || ''
      ]);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="egresos.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error export egresos:', error);
    res.status(500).json({ message: 'Error al exportar egresos.' });
  }
});

module.exports = router;
