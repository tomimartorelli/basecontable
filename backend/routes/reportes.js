const express = require('express');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

async function getUserCompanies(req, targetUserId = null) {
  // Si se especifica un targetUserId (SuperAdmin viendo cuenta de otro usuario)
  const effectiveUserId = targetUserId || req.user.userId;
  
  // Si es SuperAdmin y NO hay targetUserId específico: ve todas las empresas
  if (req.user?.isSuperAdmin && !targetUserId) {
    return [];
  }
  
  // Si es SuperAdmin CON targetUserId: comportarse como ese usuario
  if (targetUserId) {
    const targetUser = await User.findById(targetUserId).select('employeeOf ownedCompanies role').lean();
    if (!targetUser) return [targetUserId];
    
    if (targetUser.role === 'employee' && targetUser.employeeOf?.length) {
      const companyIds = targetUser.employeeOf.map(e => e.company).filter(Boolean);
      const companies = await Company.find({ _id: { $in: companyIds } }).select('owner').lean();
      const ownerIds = companies.map(c => c.owner).filter(Boolean);
      return [...companyIds, ...ownerIds];
    }
    if (targetUser.role === 'company_owner') {
      return targetUser.ownedCompanies || [targetUserId];
    }
    return [targetUserId];
  }
  
  // Comportamiento normal para usuarios no-SuperAdmin
  if (req.user.role === 'employee') {
    const user = await User.findById(req.user.userId).select('employeeOf').lean();
    if (!user?.employeeOf?.length) return [req.user.userId];
    const companyIds = user.employeeOf.map(e => e.company).filter(Boolean);
    const companies = await Company.find({ _id: { $in: companyIds } }).select('owner').lean();
    const ownerIds = companies.map(c => c.owner).filter(Boolean);
    return [...companyIds, ...ownerIds];
  }
  if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
    const companies = await Company.find({}, '_id');
    return companies.map(c => c._id);
  }
  if (req.user.role === 'company_owner') return req.user.ownedCompanies || [];
  const list = [];
  if (req.user?.currentPlan && ['Empresarial', 'Enterprise'].includes(req.user.currentPlan.name)) {
    if (req.user.ownedCompanies?.length) list.push(...req.user.ownedCompanies);
    if (req.user.employeeOf?.length) list.push(...req.user.employeeOf.map(e => e.company));
  } else if (req.user?.ownedCompanies?.length) list.push(...req.user.ownedCompanies);
  if (list.length === 0) list.push(req.user.userId);
  return list;
}

// Filtro estricto: cada usuario ve SOLO sus registros por userId
// Sin excepciones - todos los usuarios ven solo sus propios datos
function buildBaseFilter(companies, req, targetUserId = null) {
  const effectiveUserId = targetUserId || req.user.userId;
  const userIdObject = new mongoose.Types.ObjectId(effectiveUserId);
  
  // TODOS los usuarios filtran estrictamente por userId
  return { userId: userIdObject };
}

// GET /api/reportes/flujo-caja?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&userId=XXX (opcional para SuperAdmin)
router.get('/reportes/flujo-caja', auth, async (req, res) => {
  try {
    const { desde, hasta, userId: targetUserId } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Parámetros desde y hasta (YYYY-MM-DD) son obligatorios.' });
    }
    // Solo SuperAdmin puede especificar userId de otro usuario
    const effectiveTargetUserId = (req.user.isSuperAdmin && targetUserId) ? targetUserId : null;
    console.log('🔍 REPORTES - Usuario:', req.user.userId, 'isSuperAdmin:', req.user.isSuperAdmin, 'targetUserId:', effectiveTargetUserId);
    const companies = await getUserCompanies(req, effectiveTargetUserId);
    const baseFilter = buildBaseFilter(companies, req, effectiveTargetUserId);
    console.log('🔍 REPORTES - Companies:', companies.length, 'baseFilter:', JSON.stringify(baseFilter));

    const filterVentas = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };
    const filterEgresos = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };

    const [ventasCobradasAgg, ventasImpagasAgg, ventasTotalAgg, egresosAgg, cantidadVentas, cantidadEgresos] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...filterVentas, estadoPago: 'pagada' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { ...filterVentas, $or: [{ estadoPago: 'impaga' }, { estadoPago: { $exists: false } }] } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: filterVentas },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Expense.aggregate([
        { $match: filterEgresos },
        { $group: { _id: null, total: { $sum: '$monto' } } }
      ]),
      Invoice.countDocuments(filterVentas),
      Expense.countDocuments(filterEgresos)
    ]);

    const ventasCobradas = ventasCobradasAgg[0]?.total ?? 0;
    const ventasImpagas = ventasImpagasAgg[0]?.total ?? 0;
    const ventasTotal = ventasTotalAgg[0]?.total ?? 0;
    const egresosTotal = egresosAgg[0]?.total ?? 0;
    const flujoCaja = ventasCobradas - egresosTotal;
    
    console.log('🔍 REPORTES - Resultados:', { ventasCobradas, ventasImpagas, ventasTotal, egresosTotal, flujoCaja, cantidadVentas, cantidadEgresos });
    console.log('🔍 REPORTES - Filtros usados:', { filterVentas, filterEgresos });

    res.json({
      desde,
      hasta,
      ventasTotal,
      ventasCobradas,
      ventasImpagas,
      egresosTotal,
      flujoCaja,
      cantidadVentas,
      cantidadEgresos
    });
  } catch (error) {
    console.error('Error reportes flujo-caja:', error);
    res.status(500).json({ message: 'Error al generar el reporte.' });
  }
});

// GET /api/reportes/flujo-caja-mensual?anno=2025
router.get('/reportes/flujo-caja-mensual', auth, async (req, res) => {
  try {
    const anno = parseInt(req.query.anno, 10) || new Date().getFullYear();
    const { userId: targetUserId } = req.query;
    // Solo SuperAdmin puede especificar userId de otro usuario
    const effectiveTargetUserId = (req.user.isSuperAdmin && targetUserId) ? targetUserId : null;
    const companies = await getUserCompanies(req, effectiveTargetUserId);
    const baseFilter = buildBaseFilter(companies, req, effectiveTargetUserId);

    const meses = [];
    for (let m = 1; m <= 12; m++) {
      const desde = `${anno}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(anno, m, 0);
      const hasta = `${anno}-${String(m).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      const filterV = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };
      const filterE = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };

      const [cobrado, egresos] = await Promise.all([
        Invoice.aggregate([
          { $match: { ...filterV, estadoPago: 'pagada' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        Expense.aggregate([
          { $match: filterE },
          { $group: { _id: null, total: { $sum: '$monto' } } }
        ])
      ]);

      const ventasCobradas = cobrado[0]?.total ?? 0;
      const egresosTotal = egresos[0]?.total ?? 0;
      meses.push({
        mes: m,
        anno,
        nombreMes: new Date(anno, m - 1, 1).toLocaleString('es-AR', { month: 'short' }),
        ventasCobradas,
        egresosTotal,
        flujoCaja: ventasCobradas - egresosTotal
      });
    }

    res.json({ anno, meses });
  } catch (error) {
    console.error('Error reportes flujo-caja-mensual:', error);
    res.status(500).json({ message: 'Error al generar el reporte mensual.' });
  }
});

// GET /api/reportes/flujo-caja-diario?anno=2025&mes=1 - Desglose diario de un mes
router.get('/reportes/flujo-caja-diario', auth, async (req, res) => {
  try {
    const anno = parseInt(req.query.anno, 10) || new Date().getFullYear();
    const mes = parseInt(req.query.mes, 10) || new Date().getMonth() + 1;
    const { userId: targetUserId } = req.query;
    
    // Solo SuperAdmin puede especificar userId de otro usuario
    const effectiveTargetUserId = (req.user.isSuperAdmin && targetUserId) ? targetUserId : null;
    const companies = await getUserCompanies(req, effectiveTargetUserId);
    const baseFilter = buildBaseFilter(companies, req, effectiveTargetUserId);

    const desde = `${anno}-${String(mes).padStart(2, '0')}-01`;
    const lastDay = new Date(anno, mes, 0);
    const hasta = `${anno}-${String(mes).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const filterV = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };
    const filterE = { ...baseFilter, fecha: { $gte: desde, $lte: hasta } };

    // Obtener todas las facturas pagadas del mes agrupadas por día
    const [cobradoPorDia, egresosPorDia] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...filterV, estadoPago: 'pagada' } },
        {
          $group: {
            _id: '$fecha',
            total: { $sum: '$total' },
            facturas: {
              $push: {
                numero: '$numero',
                cliente: '$cliente',
                total: '$total'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: filterE },
        {
          $group: {
            _id: '$fecha',
            total: { $sum: '$monto' },
            gastos: {
              $push: {
                descripcion: '$descripcion',
                monto: '$monto',
                categoria: '$categoria'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Combinar facturas y gastos por día
    const diasMap = new Map();
    
    cobradoPorDia.forEach(dia => {
      diasMap.set(dia._id, {
        fecha: dia._id,
        ingresos: dia.total,
        egresos: 0,
        facturas: dia.facturas,
        gastos: []
      });
    });

    egresosPorDia.forEach(dia => {
      if (diasMap.has(dia._id)) {
        const existing = diasMap.get(dia._id);
        existing.egresos = dia.total;
        existing.gastos = dia.gastos;
      } else {
        diasMap.set(dia._id, {
          fecha: dia._id,
          ingresos: 0,
          egresos: dia.total,
          facturas: [],
          gastos: dia.gastos
        });
      }
    });

    const dias = Array.from(diasMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

    res.json({
      anno,
      mes,
      nombreMes: new Date(anno, mes - 1, 1).toLocaleString('es-AR', { month: 'long' }),
      dias
    });
  } catch (error) {
    console.error('Error reportes flujo-caja-diario:', error);
    res.status(500).json({ message: 'Error al generar el reporte diario.' });
  }
});

// GET /api/reportes/categorias?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/reportes/categorias', auth, async (req, res) => {
  try {
    const { desde, hasta, userId: targetUserId } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Parámetros desde y hasta (YYYY-MM-DD) son obligatorios.' });
    }
    // Solo SuperAdmin puede especificar userId de otro usuario
    const effectiveTargetUserId = (req.user.isSuperAdmin && targetUserId) ? targetUserId : null;
    const companies = await getUserCompanies(req, effectiveTargetUserId);
    const baseFilter = buildBaseFilter(companies, req, effectiveTargetUserId);
    const rangeFilter = { fecha: { $gte: desde, $lte: hasta } };

    const ventasFilter = { ...baseFilter, ...rangeFilter };
    const egresosFilter = { ...baseFilter, ...rangeFilter };

    const [ventasAgg, egresosAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: ventasFilter },
        {
          $group: {
            _id: '$categoria',
            ventasTotal: { $sum: '$total' },
            ventasCobradas: {
              $sum: {
                $cond: [{ $eq: ['$estadoPago', 'pagada'] }, '$total', 0]
              }
            },
            ventasImpagas: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$estadoPago', 'impaga'] },
                      { $not: ['$estadoPago'] }
                    ]
                  },
                  '$total',
                  0
                ]
              }
            }
          }
        }
      ]),
      Expense.aggregate([
        { $match: egresosFilter },
        {
          $group: {
            _id: '$categoria',
            egresosTotal: { $sum: '$monto' }
          }
        }
      ])
    ]);

    const egresosMap = new Map();
    egresosAgg.forEach(e => {
      const key = e._id || '';
      egresosMap.set(key, e.egresosTotal || 0);
    });

    const categoriasSet = new Set();
    ventasAgg.forEach(v => categoriasSet.add(v._id || ''));
    egresosAgg.forEach(e => categoriasSet.add(e._id || ''));

    const categorias = Array.from(categoriasSet).map(cat => {
      const v = ventasAgg.find(x => (x._id || '') === cat);
      const ventasTotal = v?.ventasTotal || 0;
      const ventasCobradas = v?.ventasCobradas || 0;
      const ventasImpagas = v?.ventasImpagas || 0;
      const egresosTotal = egresosMap.get(cat) || 0;
      return {
        categoria: cat || 'Sin categoría',
        ventasTotal,
        ventasCobradas,
        ventasImpagas,
        egresosTotal,
        margen: ventasCobradas - egresosTotal
      };
    }).sort((a, b) => Math.abs(b.margen) - Math.abs(a.margen));

    res.json({
      desde,
      hasta,
      categorias
    });
  } catch (error) {
    console.error('Error reportes categorias:', error);
    res.status(500).json({ message: 'Error al generar el reporte por categorías.' });
  }
});

module.exports = router;
