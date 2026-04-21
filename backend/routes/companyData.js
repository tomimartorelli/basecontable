const express = require('express');
const router = express.Router();
const CompanyData = require('../models/CompanyData');
const auth = require('../middleware/auth');

// GET /api/company-data - Obtener datos de empresa del usuario
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Obteniendo datos de empresa para usuario:', req.user.userId);
    
    const companyData = await CompanyData.findOne({ userId: req.user.userId });
    
    if (!companyData) {
      console.log('⚠️ No se encontraron datos de empresa para el usuario');
      return res.json({
        company: {
          name: '',
          address: '',
          city: '',
          postalCode: '',
          phone: '',
          email: '',
          website: '',
          logo: ''
        },
        bank: {
          cbu: ''
        }
      });
    }
    
    console.log('✅ Datos de empresa encontrados');
    console.log('📤 Enviando datos al frontend:', companyData);
    console.log('🏦 Datos bancarios enviados:', companyData.bank);
    console.log('🏦 Campo cbu enviado:', companyData.bank?.cbu);
    res.json(companyData);
  } catch (error) {
    console.error('❌ Error al obtener datos de empresa:', error);
    res.status(500).json({ message: 'Error al obtener datos de empresa' });
  }
});

// POST /api/company-data - Crear/actualizar datos de empresa del usuario
router.post('/', auth, async (req, res) => {
  try {
    console.log('🔍 ===== INICIANDO GUARDADO DE DATOS DE EMPRESA =====');
    console.log('🔍 Usuario autenticado:', req.user.userId);
    console.log('🔍 Timestamp:', new Date().toISOString());
    
    const { company, bank } = req.body;
    
    console.log('📥 Datos recibidos del frontend:');
    console.log('🏢 Company:', company);
    console.log('🏦 Bank:', bank);
    console.log('🏦 Bank.cbu:', bank?.cbu);
    console.log('🏦 Tipo de bank.cbu:', typeof bank?.cbu);
    console.log('🖼️ Logo recibido:', {
      presente: !!company?.logo,
      tamaño: company?.logo ? company.logo.length : 0,
      tipo: company?.logo ? typeof company.logo : 'undefined'
    });
    
    // Validar que el logo no sea demasiado grande
    if (company?.logo && company.logo.length > 50 * 1024 * 1024) { // 50MB como límite absoluto
      console.error('❌ Logo demasiado grande recibido:', company.logo.length, 'bytes');
      return res.status(400).json({ 
        message: 'El logo es demasiado grande. El tamaño máximo es 50MB.' 
      });
    }
    
    // Validar que el logo sea una cadena base64 válida si está presente
    if (company?.logo && !company.logo.startsWith('data:image/')) {
      console.error('❌ Formato de logo inválido:', company.logo.substring(0, 50) + '...');
      return res.status(400).json({ 
        message: 'Formato de logo inválido. Debe ser una imagen en formato base64.' 
      });
    }
    
    console.log('✅ Validaciones de logo pasadas');
    
    // Buscar si ya existen datos para este usuario
    console.log('🔍 Buscando datos existentes para usuario:', req.user.userId);
    let companyData = await CompanyData.findOne({ userId: req.user.userId });
    console.log('🔍 Resultado de búsqueda:', companyData ? 'Encontrado' : 'No encontrado');
    
    if (companyData) {
      // Actualizar datos existentes
      console.log('💾 Actualizando datos existentes...');
      console.log('📝 Datos anteriores:', {
        company: companyData.company,
        bank: companyData.bank
      });
      
      companyData.company = { ...companyData.company, ...company };
      companyData.bank = { ...companyData.bank, ...bank };
      companyData.updatedAt = new Date();
      
      console.log('📝 Datos a guardar:', {
        company: companyData.company,
        bank: companyData.bank,
        updatedAt: companyData.updatedAt
      });
      
      await companyData.save();
      console.log('✅ Datos de empresa actualizados exitosamente');
      console.log('💾 Datos guardados en BD:', companyData);
      console.log('🏦 Datos bancarios guardados:', companyData.bank);
      console.log('🏦 Campo cbu guardado:', companyData.bank?.cbu);
      console.log('🖼️ Logo guardado:', {
        presente: !!companyData.company?.logo,
        tamaño: companyData.company?.logo ? companyData.company.logo.length : 0
      });
    } else {
      // Crear nuevos datos
      console.log('💾 Creando nuevos datos...');
      companyData = new CompanyData({
        userId: req.user.userId,
        company,
        bank
      });
      
      console.log('📝 Nuevo documento a crear:', companyData);
      
      await companyData.save();
      console.log('✅ Datos de empresa creados exitosamente');
      console.log('💾 Datos guardados en BD:', companyData);
      console.log('🏦 Datos bancarios guardados:', companyData.bank);
      console.log('🏦 Campo cbu guardado:', companyData.bank?.cbu);
      console.log('🖼️ Logo guardado:', {
        presente: !!companyData.company?.logo,
        tamaño: companyData.company?.logo ? companyData.company.logo.length : 0
      });
    }
    
    console.log('📤 Enviando respuesta exitosa al frontend');
    console.log('🔍 ===== GUARDADO COMPLETADO EXITOSAMENTE =====');
    res.json(companyData);
  } catch (error) {
    console.error('❌ ===== ERROR AL GUARDAR DATOS DE EMPRESA =====');
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Nombre del error:', error.name);
    console.error('❌ Mensaje del error:', error.message);
    console.error('❌ Código del error:', error.code);
    
    // Log específico para errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      console.error('❌ Error de validación de Mongoose:', error.message);
      console.error('❌ Detalles de validación:', error.errors);
      return res.status(400).json({ 
        message: 'Error de validación: ' + error.message 
      });
    }
    
    // Log específico para errores de tamaño de documento
    if (error.code === 17420) {
      console.error('❌ Documento demasiado grande para MongoDB:', error.message);
      return res.status(400).json({ 
        message: 'El logo es demasiado grande para ser guardado en la base de datos.' 
      });
    }
    
    // Log específico para errores de conexión a MongoDB
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.error('❌ Error de conexión a MongoDB:', error.message);
      return res.status(500).json({ 
        message: 'Error de conexión a la base de datos. Por favor intenta nuevamente.' 
      });
    }
    
    // Log específico para errores de duplicación
    if (error.code === 11000) {
      console.error('❌ Error de duplicación:', error.message);
      return res.status(400).json({ 
        message: 'Ya existen datos para este usuario.' 
      });
    }
    
    console.error('❌ ===== FIN DEL ERROR =====');
    res.status(500).json({ message: 'Error interno del servidor al guardar datos de empresa' });
  }
});

// PUT /api/company-data - Actualizar datos de empresa del usuario
router.put('/', auth, async (req, res) => {
  try {
    console.log('🔍 Actualizando datos de empresa para usuario:', req.user.userId);
    
    const { company, bank } = req.body;
    
    const companyData = await CompanyData.findOneAndUpdate(
      { userId: req.user.userId },
      { 
        company, 
        bank,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    console.log('✅ Datos de empresa actualizados');
    res.json(companyData);
  } catch (error) {
    console.error('❌ Error al actualizar datos de empresa:', error);
    res.status(500).json({ message: 'Error al actualizar datos de empresa' });
  }
});

// DELETE /api/company-data - Eliminar datos de empresa del usuario
router.delete('/', auth, async (req, res) => {
  try {
    console.log('🔍 Eliminando datos de empresa para usuario:', req.user.userId);
    
    const companyData = await CompanyData.findOneAndDelete({ userId: req.user.userId });
    
    if (!companyData) {
      return res.status(404).json({ message: 'No se encontraron datos de empresa para eliminar' });
    }
    
    console.log('✅ Datos de empresa eliminados');
    res.json({ message: 'Datos de empresa eliminados correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar datos de empresa:', error);
    res.status(500).json({ message: 'Error al eliminar datos de empresa' });
  }
});

module.exports = router;
