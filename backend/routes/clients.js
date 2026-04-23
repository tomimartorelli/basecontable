const express = require('express');
const Client = require('../models/Client');
const User = require('../models/User');
const Company = require('../models/Company');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { checkPlanLimits } = require('../middleware/featureCheck');

const router = express.Router();

// Listar todos los clientes
router.get('/clients', auth, async (req, res) => {
  try {
    console.log(' Listando clientes para usuario:', req.user.userId);
    console.log(' Usuario completo:', req.user);
    
    let userCompanies = [];

    // Empleados: solo empresas donde está asignado (+ owners para datos legacy)
    if (req.user.role === 'employee') {
      const user = await User.findById(req.user.userId).select('employeeOf').lean();
      if (!user?.employeeOf?.length) {
        userCompanies = [req.user.userId];
      } else {
        const companyIds = user.employeeOf.map(e => e.company).filter(Boolean);
        const companies = await Company.find({ _id: { $in: companyIds } }).select('owner').lean();
        const ownerIds = companies.map(c => c.owner).filter(Boolean);
        userCompanies = [...companyIds, ...ownerIds];
      }
    } else if (req.user.isSuperAdmin === true) {
      console.log(' Superadmin: Mostrando SOLO sus propios datos');
      userCompanies = [req.user.userId];
    } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      userCompanies = await Company.find({}, '_id');
      userCompanies = userCompanies.map(c => c._id);
      console.log(' Admin: Acceso a todas las empresas');
    } else if (req.user.role === 'company_owner') {
      // Propietario de empresa: ver empresas propias
      console.log(' Propietario de empresa: Mostrando empresas propias');
      userCompanies = req.user.ownedCompanies || [];
    } else {
      // Usuario normal: verificar su plan
      const user = await User.findById(req.user.userId).populate('currentPlan');
      console.log(' Usuario encontrado:', {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        currentPlan: user.currentPlan,
        ownedCompanies: user.ownedCompanies
      });
      
      if (user.currentPlan) {
        console.log(' Plan del usuario:', user.currentPlan.name);
        
        // Planes que permiten multi-empresa y empleados
        if (['Empresarial', 'Enterprise'].includes(user.currentPlan.name)) {
          // Dueño de empresa: ver empresas propias
          if (user.ownedCompanies && user.ownedCompanies.length > 0) {
            userCompanies = user.ownedCompanies;
            console.log(' Dueño de empresa: Empresas propias:', userCompanies);
          }
          
          // Empleado: ver empresas donde trabaja
          if (user.employeeOf && user.employeeOf.length > 0) {
            const employeeCompanies = user.employeeOf.map(emp => emp.company);
            userCompanies = [...userCompanies, ...employeeCompanies];
            console.log(' Empleado: Empresas donde trabaja:', employeeCompanies);
          }
        } else {
          // Planes Básico/Profesional: solo empresa propia
          if (user.ownedCompanies && user.ownedCompanies.length > 0) {
            userCompanies = user.ownedCompanies;
            console.log(' Plan básico: Empresa propia:', userCompanies);
          }
        }
      }
      
      // Si no tiene empresas configuradas, usar clientes del usuario directamente
      if (userCompanies.length === 0) {
        userCompanies = [req.user.userId];
        console.log(' Usuario individual: Clientes propios usando userId:', userCompanies);
      }
    }
    
    // Filtrar clientes por empresas del usuario
    console.log(' DEBUG: userCompanies =', userCompanies);
    console.log(' DEBUG: req.user.userId =', req.user.userId);
    
    let filterQuery = {};
    
    if (userCompanies.length > 0) {
      filterQuery = {
        $or: [
          { userId: { $in: userCompanies } },
          { companyId: { $in: userCompanies } }
        ]
      };
      console.log(' Aplicando filtrado por empresa');
    } else {
      // Si no hay empresas, mostrar clientes del usuario directamente
      filterQuery = { userId: req.user.userId };
      console.log(' Mostrando clientes del usuario directamente');
    }
    
    console.log(' Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    
    const clients = await Client.find(filterQuery).sort({ createdAt: -1 });
    
    console.log(` Clientes encontrados para el usuario: ${clients.length}`);
    if (clients.length > 0) {
      console.log(' Primer cliente:', {
        _id: clients[0]._id,
        razonSocial: clients[0].razonSocial,
        userId: clients[0].userId,
      });
    }
    
    res.json(clients);
  } catch (error) {
    console.error(' Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes.' });
  }
});

// Crear cliente
router.post('/clients', auth, checkPlanLimits('clients'), async (req, res) => {
  try {
    const { razonSocial, domicilio, pais, localidad, email, telefono } = req.body;
    if (!razonSocial || !pais || !email) {
      return res.status(400).json({ message: 'Razón social, país y email son obligatorios.' });
    }
    
    let companyId = req.user.ownedCompanies?.[0] || req.user.userId;
    if (req.user.role === 'employee' && req.user.employeeOf?.length) {
      const first = req.user.employeeOf[0];
      companyId = first.company || first.company?._id || companyId;
    }
    const client = new Client({ 
      razonSocial, 
      domicilio, 
      pais, 
      localidad, 
      email, 
      telefono,
      userId: req.user.userId,
      companyId
    });
    
    await client.save();
    console.log('✅ Cliente creado para usuario:', req.user.userId);
    res.status(201).json(client);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ message: 'Error al crear cliente.' });
  }
});

// Editar cliente
router.put('/clients/:id', auth, async (req, res) => {
  try {
    // Buscar el cliente y verificar que pertenezca al usuario
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    // Verificar que el cliente pertenezca al usuario o a una empresa donde trabaje
    let userCompanies = [req.user.userId];
    if (req.user.ownedCompanies && req.user.ownedCompanies.length > 0) {
      userCompanies = [...userCompanies, ...req.user.ownedCompanies];
    }
    if (req.user.employeeOf && req.user.employeeOf.length > 0) {
      const employeeCompanies = req.user.employeeOf.map(emp => emp.company);
      userCompanies = [...userCompanies, ...employeeCompanies];
    }
    
    // Convertir ObjectIds a strings para comparación
    const clientUserId = client.userId?.toString();
    const clientCompanyId = client.companyId?.toString();
    
    console.log(' Permisos cliente - userCompanies:', userCompanies);
    console.log(' Permisos cliente - client.userId:', clientUserId, 'client.companyId:', clientCompanyId);
    
    if (!userCompanies.includes(clientUserId) && !userCompanies.includes(clientCompanyId)) {
      return res.status(403).json({ message: 'No tienes permisos para editar este cliente.' });
    }
    
    // Guardar el país anterior para verificar si cambió
    const oldPais = client.pais;
    const newPais = req.body.pais;
    
    // Actualizar el cliente
    const clientActualizado = await Client.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    // Si cambió el país, actualizarlo en todas las facturas de este cliente
    if (newPais && newPais !== oldPais) {
      console.log(`🌍 Actualizando país en facturas para cliente "${client.razonSocial}": ${oldPais} → ${newPais}`);
      try {
        // Buscar facturas que coincidan con el cliente (por razón social y userId o companyId)
        const filterQuery = {
          razonSocial: client.razonSocial,
          $or: [
            { userId: client.userId },
            { companyId: client.userId },
            { userId: client.companyId },
            { companyId: client.companyId }
          ].filter(id => id != null)
        };
        
        console.log('🔍 Filtro para actualizar facturas:', JSON.stringify(filterQuery, null, 2));
        
        const updateResult = await Invoice.updateMany(
          filterQuery,
          { $set: { pais: newPais } }
        );
        console.log(`✅ Actualizadas ${updateResult.modifiedCount} facturas con el nuevo país`);
        
        // Si no se actualizó ninguna factura, intentar buscar solo por razón social (más flexible)
        if (updateResult.modifiedCount === 0) {
          console.log('⚠️ No se encontraron facturas con los filtros anteriores, intentando solo por razón social...');
          const fallbackResult = await Invoice.updateMany(
            { razonSocial: client.razonSocial },
            { $set: { pais: newPais } }
          );
          console.log(`✅ Fallback: Actualizadas ${fallbackResult.modifiedCount} facturas solo por razón social`);
        }
      } catch (invoiceError) {
        console.error('⚠️ Error al actualizar facturas:', invoiceError);
        // No fallamos la operación principal si esto falla
      }
    }
    
    console.log('✅ Cliente editado por usuario:', req.user.userId);
    res.json(clientActualizado);
  } catch (error) {
    console.error(' Error al editar cliente:', error);
    res.status(500).json({ message: 'Error al editar cliente.' });
  }
});

// Eliminar cliente
router.delete('/clients/:id', auth, async (req, res) => {
  try {
    // Buscar el cliente y verificar que pertenezca al usuario
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    
    // Verificar que el cliente pertenezca al usuario o a una empresa donde trabaje
    let userCompanies = [req.user.userId];
    if (req.user.ownedCompanies && req.user.ownedCompanies.length > 0) {
      userCompanies = [...userCompanies, ...req.user.ownedCompanies];
    }
    if (req.user.employeeOf && req.user.employeeOf.length > 0) {
      const employeeCompanies = req.user.employeeOf.map(emp => emp.company);
      userCompanies = [...userCompanies, ...employeeCompanies];
    }
    
    // Convertir ObjectIds a strings para comparación
    const clientUserId = client.userId?.toString();
    const clientCompanyId = client.companyId?.toString();
    
    if (!userCompanies.includes(clientUserId) && !userCompanies.includes(clientCompanyId)) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este cliente.' });
    }
    
    // Eliminar el cliente
    await Client.findByIdAndDelete(req.params.id);
    
    console.log(' Cliente eliminado por usuario:', req.user.userId);
    res.json({ message: 'Cliente eliminado.' });
  } catch (error) {
    console.error(' Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente.' });
  }
});

module.exports = router;