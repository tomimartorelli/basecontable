const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper estándar para errores en rutas de empresas
const sendError = (res, status, code, message) => {
  return res.status(status).json({ code, message });
};

// Configuración de multer para logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// GET /api/companies - Obtener empresas del usuario
router.get('/', auth, async (req, res) => {
  try {
    let companies = [];
    
    if (req.user.role === 'admin') {
      // Admin puede ver todas las empresas
      companies = await Company.find()
        .populate('owner', 'name email')
        .populate('plan', 'name price')
        .populate('employees.user', 'name email role');
    } else {
      // Usuario normal ve solo sus empresas o donde es empleado
      const ownedCompanies = await Company.find({ owner: req.user._id })
        .populate('plan', 'name price')
        .populate('employees.user', 'name email role');
      
      const employeeCompanies = await Company.find({
        'employees.user': req.user._id
      }).populate('owner', 'name email').populate('plan', 'name price').populate('employees.user', 'name email role');
      
      companies = [...ownedCompanies, ...employeeCompanies];
    }
    
    res.json(companies);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// GET /api/companies/:id - Obtener una empresa específica
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('plan', 'name features maxEmployees')
      .populate('employees.user', 'name email role');
    
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner._id.toString() === req.user._id.toString();
    const isEmployee = company.employees.some(emp => emp.user._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isEmployee && !isAdmin) {
      return sendError(res, 403, 'FORBIDDEN', 'Acceso denegado');
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// POST /api/companies - Crear una nueva empresa
router.post('/', auth, async (req, res) => {
  try {
    // Verificar que el usuario tenga un plan activo
    if (!req.user.currentPlan) {
      return sendError(
        res,
        400,
        'PLAN_REQUIRED',
        'Debes tener un plan activo para crear una empresa'
      );
    }
    
    // Verificar límites del plan
    const plan = await Plan.findById(req.user.currentPlan);
    if (!plan) {
      return sendError(res, 400, 'INVALID_PLAN', 'Plan no válido');
    }
    
    const ownedCompaniesCount = await Company.countDocuments({ owner: req.user._id });
    if (ownedCompaniesCount >= plan.maxCompanies) {
      return sendError(
        res,
        403,
        'COMPANY_LIMIT_REACHED',
        'Has alcanzado el límite de empresas para tu plan'
      );
    }
    
    const companyData = {
      ...req.body,
      owner: req.user._id,
      plan: req.user.currentPlan
    };
    
    const company = new Company(companyData);
    await company.save();
    
    // Actualizar usuario con la nueva empresa
    await User.findByIdAndUpdate(req.user._id, {
      $push: { ownedCompanies: company._id }
    });
    
    res.status(201).json(company);
  } catch (error) {
    console.error('Error al crear empresa:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// PUT /api/companies/:id - Actualizar una empresa
router.put('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede editar la empresa'
      );
    }
    
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// POST /api/companies/:id/logo - Subir logo de la empresa
router.post('/:id/logo', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'No se proporcionó ningún archivo');
    }
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede cambiar el logo'
      );
    }
    
    // Eliminar logo anterior si existe
    if (company.logo && company.logo.path) {
      try {
        fs.unlinkSync(company.logo.path);
      } catch (err) {
        console.log('No se pudo eliminar el logo anterior:', err);
      }
    }
    
    // Actualizar empresa con nuevo logo
    company.logo = {
      path: req.file.path,
      filename: req.file.filename
    };
    
    await company.save();
    res.json(company);
  } catch (error) {
    console.error('Error al subir logo:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// POST /api/companies/:id/employees - Invitar empleado
router.post('/:id/employees', auth, async (req, res) => {
  try {
    const { email, role, permissions } = req.body;
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede invitar empleados'
      );
    }
    
    // Verificar límites del plan
    const plan = await Plan.findById(company.plan);
    if (company.employees.length >= plan.maxEmployees) {
      return sendError(
        res,
        403,
        'EMPLOYEE_LIMIT_REACHED',
        'Has alcanzado el límite de empleados para tu plan'
      );
    }
    
    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'Usuario no encontrado');
    }
    
    // Verificar que no sea ya empleado
    const isAlreadyEmployee = company.employees.some(emp => emp.user.toString() === user._id.toString());
    if (isAlreadyEmployee) {
      return sendError(
        res,
        409,
        'EMPLOYEE_ALREADY_EXISTS',
        'El usuario ya es empleado de esta empresa'
      );
    }
    
    // Agregar empleado
    company.employees.push({
      user: user._id,
      role: role || 'employee',
      permissions: permissions || {}
    });
    
    await company.save();
    
    // Actualizar usuario
    await User.findByIdAndUpdate(user._id, {
      $push: {
        employeeOf: {
          company: company._id,
          role: role || 'employee',
          permissions: permissions || {}
        }
      }
    });
    
    res.json(company);
  } catch (error) {
    console.error('Error al invitar empleado:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// PUT /api/companies/:id/employees/:employeeId - Actualizar empleado
router.put('/:id/employees/:employeeId', auth, async (req, res) => {
  try {
    const { role, permissions } = req.body;
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede editar empleados'
      );
    }
    
    const employee = company.employees.id(req.params.employeeId);
    if (!employee) {
      return sendError(res, 404, 'EMPLOYEE_NOT_FOUND', 'Empleado no encontrado');
    }
    
    if (role) employee.role = role;
    if (permissions) employee.permissions = { ...employee.permissions, ...permissions };
    
    await company.save();
    
    // Actualizar usuario también
    await User.updateOne(
      { _id: employee.user, 'employeeOf.company': company._id },
      {
        $set: {
          'employeeOf.$.role': employee.role,
          'employeeOf.$.permissions': employee.permissions
        }
      }
    );
    
    res.json(company);
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// DELETE /api/companies/:id/employees/:employeeId - Remover empleado
router.delete('/:id/employees/:employeeId', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede remover empleados'
      );
    }
    
    const employee = company.employees.id(req.params.employeeId);
    if (!employee) {
      return sendError(res, 404, 'EMPLOYEE_NOT_FOUND', 'Empleado no encontrado');
    }
    
    // Remover empleado
    company.employees.pull(req.params.employeeId);
    await company.save();
    
    // Actualizar usuario
    await User.updateOne(
      { _id: employee.user },
      { $pull: { employeeOf: { company: company._id } } }
    );
    
    res.json({ message: 'Empleado removido correctamente' });
  } catch (error) {
    console.error('Error al remover empleado:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

// DELETE /api/companies/:id - Eliminar empresa
router.delete('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return sendError(res, 404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada');
    }
    
    // Verificar permisos
    const isOwner = company.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        'Solo el propietario puede eliminar la empresa'
      );
    }
    
    // Remover empresa de todos los usuarios
    await User.updateMany(
      { 'employeeOf.company': company._id },
      { $pull: { employeeOf: { company: company._id } } }
    );
    
    await User.updateMany(
      { ownedCompanies: company._id },
      { $pull: { ownedCompanies: company._id } }
    );
    
    // Eliminar empresa
    await Company.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Error interno del servidor');
  }
});

module.exports = router;
