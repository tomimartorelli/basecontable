const express = require('express');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { checkPlanLimits } = require('../middleware/featureCheck');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const imageSize = require('image-size');
const Activity = require('../models/Activity');
const Client = require('../models/Client');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { Readable } = require('stream');
const Company = require('../models/Company'); // Added for dashboard filtering
const User = require('../models/User'); // Added for dashboard filtering

const router = express.Router();

// Configuración de multer para guardar archivos en /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Nombre: factura_<id>_<timestamp>_original.ext
    const ext = path.extname(file.originalname);
    cb(null, `factura_${req.params.id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Listar todas las facturas
router.get('/invoices', auth, async (req, res) => {
  try {
    
    let userCompanies = [];

    // Empleados: solo empresas donde está asignado (+ owners para datos legacy). Nunca admin/superadmin.
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
      userCompanies = [req.user.userId];
    } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      userCompanies = await Company.find({}, '_id');
      userCompanies = userCompanies.map(c => c._id);
    } else if (req.user.role === 'company_owner') {
      // Propietario de empresa: ver empresas propias
      userCompanies = req.user.ownedCompanies || [];
    } else {
      // Usuario normal: verificar su plan
      const user = await User.findById(req.user.userId).populate('currentPlan');
      
      if (user.currentPlan) {
        // Planes que permiten multi-empresa y empleados
        if (['Empresarial', 'Enterprise'].includes(user.currentPlan.name)) {
          // Dueño de empresa: ver empresas propias
          if (user.ownedCompanies && user.ownedCompanies.length > 0) {
            userCompanies = user.ownedCompanies;
          }
          
          // Empleado: ver empresas donde trabaja
          if (user.employeeOf && user.employeeOf.length > 0) {
            const employeeCompanies = user.employeeOf.map(emp => emp.company);
            userCompanies = [...userCompanies, ...employeeCompanies];
          }
        } else {
          // Planes Básico/Profesional: solo empresa propia
          if (user.ownedCompanies && user.ownedCompanies.length > 0) {
            userCompanies = user.ownedCompanies;
          }
        }
      }
      
      // Si no tiene empresas configuradas, usar facturas del usuario directamente
      if (userCompanies.length === 0) {
        userCompanies = [req.user.userId];
      }
    }
    
    // Filtrar facturas por empresas del usuario
    let filterQuery = {};
    
    if (userCompanies.length > 0) {
      filterQuery = {
        $or: [
          { userId: { $in: userCompanies } },
          { companyId: { $in: userCompanies } }
        ]
      };
      console.log('✅ Aplicando filtrado por empresa');
    } else {
      // Si no hay empresas, mostrar facturas del usuario directamente
      filterQuery = { userId: req.user.userId };
      console.log('👤 Mostrando facturas del usuario directamente');
    }
    
    console.log('🔍 Query de filtrado:', JSON.stringify(filterQuery, null, 2));
    
    const invoices = await Invoice.find(filterQuery).sort({ createdAt: -1 });
    
    console.log(`✅ Facturas encontradas para el usuario: ${invoices.length}`);
    if (invoices.length > 0) {
      console.log('📋 Primeras facturas:', invoices.slice(0, 3).map(inv => ({
        _id: inv._id,
        numero: inv.numero,
        userId: inv.userId,
        companyId: inv.companyId
      })));
    }
    
    res.json(invoices);
  } catch (error) {
    console.error('❌ Error al obtener registros de venta:', error);
    res.status(500).json({ message: 'Error al obtener registros de venta.' });
  }
});

// Crear factura
router.post('/invoices', auth, checkPlanLimits('documents'), async (req, res) => {
  try {
    // Elimina el _id si viene en el body
    if (req.body._id) delete req.body._id;
    
    // Log para debugging de datos recibidos
    console.log('📥 Datos recibidos para crear factura:');
    console.log('  - empresa:', req.body.empresa ? 'Presente' : 'Ausente');
    console.log('  - datosBancarios:', req.body.datosBancarios ? 'Presente' : 'Ausente');
    console.log('  - logo:', req.body.empresa?.logo ? 'Presente' : 'Ausente');
    console.log('  - cbu:', req.body.datosBancarios?.cbu ? 'Presente' : 'Ausente');

    // Verificar límites del plan (comprobantes por mes)
    try {
      const user = await User.findById(req.user.userId).populate('currentPlan');
      const plan = user?.currentPlan;

      if (plan && typeof plan.maxDocumentsPerMonth === 'number' && plan.maxDocumentsPerMonth > 0) {
        const startOfMonth = new Date();
        startOfMonth.setUTCDate(1);
        startOfMonth.setUTCHours(0, 0, 0, 0);

        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);

        const usedThisMonth = await Invoice.countDocuments({
          userId: req.user.userId,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        if (usedThisMonth >= plan.maxDocumentsPerMonth) {
          console.warn(`⚠️ Límite de registros de venta alcanzado para el usuario ${req.user.userId} en el plan ${plan.name}`);
          return res.status(403).json({
            code: 'PLAN_DOCUMENT_LIMIT_REACHED',
            message: 'Alcanzaste el volumen recomendado de registros de venta para tu plan actual. Considerá actualizarlo para seguir cargando nuevos registros.'
          });
        }
      }
    } catch (limitError) {
      console.error('❌ Error al verificar límite de comprobantes del plan:', limitError);
      // No impedimos la creación si falla solo la verificación de límite
    }
    
    // Validar número de factura único para el usuario
    const existe = await Invoice.findOne({ 
      numero: req.body.numero,
      userId: req.user.userId 
    });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe un registro con ese número.' });
    }
    
    // companyId: empleados usan la empresa donde están asignados; dueños usan su primera empresa
    let companyId = req.user.ownedCompanies?.[0] || req.user.userId;
    if (req.user.role === 'employee' && req.user.employeeOf?.length) {
      const first = req.user.employeeOf[0];
      companyId = first.company || first.company?._id || companyId;
    }
    const factura = new Invoice({
      ...req.body,
      userId: req.user.userId,
      companyId
    });
    
    console.log('💾 Guardando factura con datos:');
    console.log('  - empresa:', factura.empresa ? 'Presente' : 'Ausente');
    console.log('  - datosBancarios:', factura.datosBancarios ? 'Presente' : 'Ausente');
    
    await factura.save();
    console.log('✅ Factura creada para usuario:', req.user.userId);
    res.status(201).json(factura);
  } catch (error) {
    console.error('❌ Error al crear registro de venta:', error);
    res.status(500).json({ message: 'Error al crear el registro de venta.' });
  }
});

// Editar factura
router.put('/invoices/:id', auth, async (req, res) => {
  try {
    // Buscar la factura y verificar que pertenezca al usuario
    const factura = await Invoice.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    }
    
    // Verificar que la factura pertenezca al usuario o a una empresa donde trabaje
    let userCompanies = [req.user.userId];
    if (req.user.ownedCompanies && req.user.ownedCompanies.length > 0) {
      userCompanies = [...userCompanies, ...req.user.ownedCompanies];
    }
    if (req.user.employeeOf && req.user.employeeOf.length > 0) {
      const employeeCompanies = req.user.employeeOf.map(emp => emp.company);
      userCompanies = [...userCompanies, ...employeeCompanies];
    }
    
    if (!userCompanies.includes(factura.userId) && !userCompanies.includes(factura.companyId)) {
      return res.status(403).json({ message: 'No tienes permisos para editar esta factura.' });
    }
    
    // Actualizar la factura
    const facturaActualizada = await Invoice.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    console.log('✅ Factura editada por usuario:', req.user.userId);
    res.json(facturaActualizada);
  } catch (error) {
    console.error('❌ Error al editar registro de venta:', error);
    res.status(500).json({ message: 'Error al editar el registro de venta.' });
  }
});

// Eliminar factura
router.delete('/invoices/:id', auth, async (req, res) => {
  try {
    const factura = await Invoice.findByIdAndDelete(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    res.json({ message: 'Registro de venta eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar factura.' });
  }
});

// Cambiar estado de pago de una factura
router.put('/invoices/:id/estado-pago', auth, async (req, res) => {
  try {
    const { estadoPago } = req.body;
    if (!['pagada', 'impaga'].includes(estadoPago)) {
      return res.status(400).json({ message: 'Estado de pago inválido.' });
    }
    const factura = await Invoice.findByIdAndUpdate(
      req.params.id,
      { estadoPago },
      { new: true }
    );
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    // Registrar actividad
    await Activity.create({
      user: req.user.userId,
      action: 'Cambio de estado de pago',
      details: `Factura N°${factura.numero} (${factura.razonSocial}) marcada como ${estadoPago}`
    });
    res.json(factura);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado de pago.' });
  }
});

// Generar y descargar PDF de una factura (alineación precisa)
router.post('/invoices/:id/pdf', auth, async (req, res) => {
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });

    // Obtener plantilla personalizada del body o usar plantilla por defecto
    const template = req.body.template;

    // Usar un buffer intermedio para evitar errores de stream
    const buffers = [];
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura_${factura.numero}.pdf"`);
      res.end(pdfData);
    });

    // Medidas y helpers
    const pageW = 595.28, pageH = 841.89;
    const left = 30, right = pageW - 30, top = 30, bottom = pageH - 30;
    const colW = (right - left) / 2;
    const colImporteW = 80; // Reducir ancho de la columna de importe
    const colDetalleW = right - left - colImporteW; // El resto para detalles
    const importeX = right - colImporteW; // Importe alineado a la derecha
    const line = (x1, y1, x2, y2, thick = 1) => {
      doc.save().lineWidth(thick).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
    };
    const drawRect = (x, y, w, h, thick = 1) => {
      doc.save().lineWidth(thick).rect(x, y, w, h).stroke().restore();
    };

    // Borde exterior
    drawRect(left, top, right - left, bottom - top, 2);

    // Encabezado: dos columnas
    // Columna izquierda: logo y datos del estudio (logo centrado)
    let logoPath = path.join(__dirname, '../../public/logo-inglesblack.png');
    let logoMaxW = colW - 30;
    let logoX = left + (colW - logoMaxW) / 2;
    let logoY = top + 10;
    let logoHeight = 0;

    // Si hay plantilla personalizada, usar su logo
    if (template && template.companyInfo.logo?.path) {
      logoPath = template.companyInfo.logo.path;
      console.log('Usando logo personalizado:', logoPath);
    }

    // Si hay logo en los datos de la factura, usarlo (base64)
    // Buscar en empresa (campo del frontend) o companyData (campo del backend)
    let logoEncontrado = false;
    
    if (factura.empresa && factura.empresa.logo) {
      try {
        // El logo viene como base64, convertirlo a buffer
        const logoBuffer = Buffer.from(factura.empresa.logo.split(',')[1], 'base64');
        const logoDims = imageSize(logoBuffer);
        let scale = Math.min(logoMaxW / logoDims.width, 50 / logoDims.height, 1);
        let logoW = logoDims.width * scale;
        logoHeight = logoDims.height * scale;
        doc.image(logoBuffer, left + (colW - logoW) / 2, logoY, { width: logoW });
        console.log('✅ Usando logo de la empresa (campo empresa)');
        logoEncontrado = true;
      } catch (error) {
        console.log('❌ Error al procesar logo base64 del campo empresa:', error.message);
      }
    }
    
    if (!logoEncontrado && factura.companyData && factura.companyData.logo) {
      try {
        // El logo viene como base64, convertirlo a buffer
        const logoBuffer = Buffer.from(factura.companyData.logo.split(',')[1], 'base64');
        const logoDims = imageSize(logoBuffer);
        let scale = Math.min(logoMaxW / logoDims.width, 50 / logoDims.height, 1);
        let logoW = logoDims.width * scale;
        logoHeight = logoDims.height * scale;
        doc.image(logoBuffer, left + (colW - logoW) / 2, logoY, { width: logoW });
        console.log('✅ Usando logo de la factura (campo companyData)');
        logoEncontrado = true;
      } catch (error) {
        console.log('❌ Error al procesar logo base64 del campo companyData:', error.message);
      }
    }
    
    if (!logoEncontrado && fs.existsSync(logoPath)) {
      const getImageSize = imageSize.default || imageSize;
      const logoBuffer = fs.readFileSync(logoPath);
      const logoDims = getImageSize(logoBuffer);
      let scale = Math.min(logoMaxW / logoDims.width, 50 / logoDims.height, 1);
      let logoW = logoDims.width * scale;
      logoHeight = logoDims.height * scale;
      doc.image(logoPath, left + (colW - logoW) / 2, logoY, { width: logoW });
    }

    // Datos del estudio alineados al centro debajo del logo
    let datosEstudio = [
      'Florida 470, Floor 2, Office 214/216',
      '(C1005AAF) Autonomous City of Buenos Aires',
      'Republic of Argentina.',
      'Tel/Fax: (54-11) 4325-9933',
      'berti@berti.com.ar',
      'www.berti.com.ar'
    ];

    // Si hay plantilla personalizada, usar su información
    if (template && template.companyInfo) {
      datosEstudio = [];
      if (template.companyInfo.address) datosEstudio.push(template.companyInfo.address);
      if (template.companyInfo.city && template.companyInfo.postalCode) {
        datosEstudio.push(`(${template.companyInfo.postalCode}) ${template.companyInfo.city}`);
      }
      if (template.companyInfo.city && !template.companyInfo.postalCode) {
        datosEstudio.push(template.companyInfo.city);
      }
      if (template.companyInfo.phone) datosEstudio.push(`Tel/Fax: ${template.companyInfo.phone}`);
      if (template.companyInfo.email) datosEstudio.push(template.companyInfo.email);
      if (template.companyInfo.website) datosEstudio.push(template.companyInfo.website);
    }

    // Si hay datos de empresa en la factura, usarlos
    // Priorizar el campo empresa (frontend) sobre companyData (backend)
    if (factura.empresa) {
      datosEstudio = [];
      if (factura.empresa.address) datosEstudio.push(factura.empresa.address);
      if (factura.empresa.city && factura.empresa.postalCode) {
        datosEstudio.push(`(${factura.empresa.postalCode}) ${factura.empresa.city}`);
      }
      if (factura.empresa.city && !factura.empresa.postalCode) {
        datosEstudio.push(factura.empresa.city);
      }
      if (factura.empresa.phone) datosEstudio.push(`Tel/Fax: ${factura.empresa.phone}`);
      if (factura.empresa.email) datosEstudio.push(factura.empresa.email);
      if (factura.empresa.website) datosEstudio.push(factura.empresa.website);
      console.log('✅ Usando datos de empresa del campo empresa');
    } else if (factura.companyData) {
      datosEstudio = [];
      if (factura.companyData.address) datosEstudio.push(factura.companyData.address);
      if (factura.companyData.city && factura.companyData.postalCode) {
        datosEstudio.push(`(${factura.companyData.postalCode}) ${factura.companyData.city}`);
      }
      if (factura.companyData.city && !factura.companyData.postalCode) {
        datosEstudio.push(factura.companyData.city);
      }
      if (factura.companyData.phone) datosEstudio.push(`Tel/Fax: ${factura.companyData.phone}`);
      if (factura.companyData.email) datosEstudio.push(factura.companyData.email);
      if (factura.companyData.website) datosEstudio.push(factura.companyData.website);
      console.log('✅ Usando datos de empresa del campo companyData');
    }

    doc.font('Helvetica').fontSize(9);
    datosEstudio.forEach((linea, i) => {
      doc.text(linea, left, logoY + logoHeight + 10 + i * 11, { width: colW, align: 'center' });
    });

    // Columna derecha: título y datos de la factura (centrados, uno debajo del otro)
    let col2X = left + colW;
    let tituloY = top + 20;
    doc.font('Helvetica-Bold').fontSize(18).text('DEBIT NOTE', col2X, tituloY, { width: colW, align: 'center' });
    let datosFacturaY = tituloY + 35;
    // N° y número centrados en la misma línea
    const numeroCompleto = `N° ${factura.numero}`;
    doc.font('Helvetica-Bold').fontSize(11).text(numeroCompleto, col2X, datosFacturaY, { width: colW, align: 'center' });
    doc.font('Helvetica').fontSize(11).text('Date:', col2X, datosFacturaY + 30, { width: colW, align: 'center' });
    doc.font('Helvetica-Bold').text(`Buenos Aires, ${factura.fecha}`, col2X, datosFacturaY + 43, { width: colW, align: 'center' });

    // Línea horizontal bajo encabezado
    let yEncabezado = Math.max(logoY + logoHeight + 10 + datosEstudio.length * 11, datosFacturaY + 36);
    line(left, yEncabezado, right, yEncabezado, 2);

    // Línea vertical separadora del encabezado
    line(left + colW, top, left + colW, yEncabezado, 2);

    // Datos del cliente
    let yCliente = yEncabezado + 10;
    const labelWidth = 90; // Espacio reservado para la etiqueta
    doc.font('Helvetica').fontSize(11).text('Mr./Mrs.:', left + 10, yCliente, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + factura.razonSocial, { continued: false });
    doc.font('Helvetica').fontSize(11).text('Adress:', left + 10, yCliente + 18, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + (factura.domicilio || '-'), { continued: false });
    doc.font('Helvetica').fontSize(11).text('City:', left + 10, yCliente + 36, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + (factura.localidad || '-'), { continued: false });
    doc.font('Helvetica').fontSize(11).text('Country:', right - 120, yCliente + 36, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + factura.pais, { continued: false });

    // Línea horizontal bajo datos cliente
    line(left, yCliente + 54, right, yCliente + 54, 2);

    // Tabla conceptos: encabezado
    let yTabla = yCliente + 64;
    const headerHeight = 25; // Aumentar altura del encabezado de la tabla
    const encabezadoAltura = 12; // altura aproximada de la fuente
    const headerCenterY = yTabla + (headerHeight - encabezadoAltura) / 2;

    // Títulos centrados
    doc.font('Helvetica-Bold').fontSize(11).text('Details', left + 20, headerCenterY, { width: colDetalleW - 40, align: 'left' });
    doc.text('Amount', importeX + 10, headerCenterY, { width: colImporteW - 20, align: 'right' });

    // Línea horizontal superior de la tabla (de left a importeX)
    line(left, yTabla + headerHeight, importeX, yTabla + headerHeight, 2);
    // Línea horizontal bajo encabezado (inicio de la tabla, de left a right)
    line(left, yTabla + headerHeight, right, yTabla + headerHeight, 2);
    // Línea vertical que separa Detalle de Importe (de yTabla + headerHeight a bottom - 30)
    line(importeX, yTabla + headerHeight, importeX, bottom - 30, 2);
    // Línea horizontal inferior (de left a right en bottom - 30)
    line(left, bottom - 30, right, bottom - 30, 2);

    // Conceptos - RESTAURAR DISEÑO ORIGINAL
    let yConcepto = yTabla + headerHeight + 20; // Aumentar espaciado entre header y primer concepto
    factura.conceptos.forEach((c, i) => {
      // Detalle del concepto en la columna izquierda (Details) - más cerca de la línea
      doc.font('Helvetica').fontSize(10).text(`${i + 1}. ${c.detalle}`, left + 10, yConcepto, { width: colDetalleW - 20 });
      
      // Importe en la columna derecha (Amount) - US$ y número uno al lado del otro
      const importeText = `US$ ${c.importe.toFixed(2)}`;
      doc.text(importeText, importeX + 5, yConcepto, { width: colImporteW - 10, align: 'right' });
      
      yConcepto += 35; // Aumentar espaciado entre conceptos
    });

    // Recuadro de datos bancarios: justo debajo del último concepto, con un margen adecuado y centrado
    let boxW = 270, boxH = 80; // Aumentar altura del recuadro
    let boxX = left + ((right - left) - boxW) / 2;
    let boxY = yConcepto + 60; // Aumentar margen superior del recuadro
    
    // Datos bancarios por defecto
    let datosBancarios = [
      'Debit note in US$ Dollars - Wire transfers to:',
      'Bank account n° 24 78 20275137 0',
      'Banca Sella SpA (Piazza Gaudenzio Sella, 1- Biella, IT)',
      'IBAN: IT 42 P 03268 22300 078202751370',
      'BIC CODE: SELBIT2BXXX'
    ];

    // Si hay datos bancarios en la factura, usarlos
    // Priorizar datosBancarios (frontend) sobre bankingData (backend)
    if (factura.datosBancarios && factura.datosBancarios.cbu) {
      const cbuInfo = factura.datosBancarios.cbu;
      if (cbuInfo.trim()) {
        // Dividir el texto en líneas para mejor presentación
        datosBancarios = cbuInfo.split('\n').filter(linea => linea.trim());
        console.log('✅ Usando datos bancarios personalizados del campo datosBancarios');
      }
    } else if (factura.bankingData && factura.bankingData.bankingInfo) {
      const bankingInfo = factura.bankingData.bankingInfo;
      if (bankingInfo.trim()) {
        datosBancarios = [
          `Debit note in ${factura.moneda || 'USD'} - Wire transfers to:`,
          ...bankingInfo.split('\n').filter(line => line.trim())
        ];
      }
    } else if (template && template.bankingInfo && template.bankingInfo.bankDetails) {
      // Usar datos bancarios de la plantilla si no hay en la factura
      const bankDetails = template.bankingInfo.bankDetails;
      const currency = template.bankingInfo.currency || 'USD';
      
      datosBancarios = [
        `Debit note in ${currency} - Wire transfers to:`,
        ...bankDetails.split('\n').filter(line => line.trim())
      ];
    }

    // Ajustar altura del recuadro según la cantidad de líneas
    boxH = Math.max(80, datosBancarios.length * 12 + 20);
    if (boxY + boxH > bottom - 30) boxY = bottom - 30 - boxH;
    
    // Dibujar el recuadro bancario (solo una vez)
    drawRect(boxX, boxY, boxW, boxH, 1.5);

    // Imprimir datos bancarios con mejor espaciado
    doc.fontSize(9).font('Helvetica-Bold').text(datosBancarios[0], boxX + 8, boxY + 8);
    for (let i = 1; i < datosBancarios.length; i++) {
      doc.font('Helvetica').fontSize(8).text(datosBancarios[i], boxX + 8, boxY + 20 + (i - 1) * 12);
    }

    // Total al pie
    line(left, bottom - 30, right, bottom - 30, 2);
    const totalStr = 'US$ ' + factura.total.toFixed(2);
    const totalFontSize = factura.total >= 1000 ? 11 : 12;
    doc.font('Helvetica-Bold').fontSize(totalFontSize).text(totalStr, right - 140, bottom - 25, { width: 130, align: 'right', continued: false });

    // Aviso legal: documento interno, no comprobante fiscal
    doc.font('Helvetica').fontSize(7).fillColor('#666666').text(
      'Este documento ha sido generado por ContaSuite como comprobante interno de gestión y no reemplaza a los comprobantes fiscales oficiales que deban emitirse conforme a la normativa vigente en cada país.',
      left,
      bottom - 20,
      { width: right - left - 150, align: 'left' }
    );

    doc.end();
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al generar el PDF.' });
    }
  }
});

// Dashboard: Top clientes por monto total facturado
router.get('/invoices-dashboard/top-clientes', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Obteniendo top clientes para usuario:', req.user.userId);
    console.log('🔍 Usuario autenticado:', req.user);
    console.log('🔍 Parámetros de query:', req.query);
    
    let filterQuery = {};
    
    // Filtro estricto: cada usuario ve solo sus registros por userId
    const userIdObject = new mongoose.Types.ObjectId(req.user.userId);
    filterQuery = { userId: userIdObject };
    console.log('� Dashboard - Filtro por userId:', req.user.userId);
    
    console.log('🔍 Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    
    // Construir filtro de fecha si se especifica
    let fechaFiltro = {};
    const { periodo } = req.query;
    
    if (periodo && periodo !== 'todas') {
      const ahora = new Date();
      let fechaDesde;
      
      switch (periodo) {
        case 'semana':
          fechaDesde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case 'trimestre':
          fechaDesde = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
          break;
        case 'año':
          fechaDesde = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      
      if (fechaDesde) {
        fechaFiltro.fecha = { $gte: fechaDesde.toISOString().split('T')[0] };
      }
    }
    
    // Agrupar facturas por cliente
    const top = await Invoice.aggregate([
      {
        $match: { 
          ...filterQuery,
          ...fechaFiltro
        }
      },
      {
        $group: {
          _id: "$razonSocial",
          total: { $sum: "$total" },
          cantidadTrabajos: { $sum: 1 },
          ultimoTrabajo: { $max: "$fecha" }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    console.log('📊 Dashboard: Top clientes encontrados:', top.length);
    
    // Formatear respuesta
    const clientesFormateados = top.map(c => ({
      cliente: c._id,
      total: c.total || 0,
      cantidadTrabajos: c.cantidadTrabajos || 0,
      ultimoTrabajo: c.ultimoTrabajo || ''
    }));

    console.log('✅ Dashboard: Top clientes enviados:', clientesFormateados);
    res.json(clientesFormateados);
  } catch (error) {
    console.error('❌ Error en dashboard top clientes:', error);
    res.status(500).json({ message: 'Error al obtener top clientes' });
  }
});

// Dashboard: Facturas impagas (cantidad y monto)
router.get('/invoices-dashboard/impagas', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Buscando facturas impagas...');
    console.log('🔍 Dashboard: Usuario autenticado:', req.user);
    console.log('🔍 Parámetros de query:', req.query);
    
    let filterQuery = {};
    
    // PRIORIDAD: Usar userId de la query si está presente (para forzar filtro específico)
    const queryUserId = req.query.userId;
    if (queryUserId) {
      console.log('🔒 Usando userId de la query para forzar filtro específico:', queryUserId);
      filterQuery = { userId: new mongoose.Types.ObjectId(queryUserId) };
    } else {
      // Lógica original basada en el rol del usuario
      if (req.user.isSuperAdmin === true) {
        console.log('👑 Superadmin: Mostrando TODAS las facturas');
        filterQuery = {}; // Super admin ve todo
      } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
        // Si es admin normal, mostrar datos de todas las empresas
        console.log('👑 Admin: Mostrando facturas impagas de todas las empresas');
        const userCompanies = await Company.find({}, '_id');
        const companyIds = userCompanies.map(c => c._id);
        filterQuery = {
          $or: [
            { userId: { $in: companyIds } },
            { companyId: { $in: companyIds } }
          ]
        };
      } else if (req.user.role === 'company_owner') {
        // Propietario de empresa: mostrar datos de sus empresas
        const userCompanies = req.user.ownedCompanies || [];
        if (userCompanies.length > 0) {
          filterQuery = {
            $or: [
              { userId: { $in: userCompanies } },
              { companyId: { $in: userCompanies } }
            ]
          };
        } else {
          filterQuery = { userId: req.user.userId };
        }
      } else {
        // Usuario normal: mostrar solo sus datos
        console.log('👤 Usuario normal: Mostrando facturas impagas personales');
        const userId = req.user.userId;
        const userIdObjectId = new mongoose.Types.ObjectId(userId);
        filterQuery = { userId: userIdObjectId };
      }
    }
    
    console.log('🔍 Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    
    // Construir filtro de fecha si se especifica
    let fechaFiltro = {};
    const { periodo } = req.query;
    
    console.log('🔍 Dashboard: Período solicitado:', periodo);
    
    // Obtener total de facturas
    const totalFacturas = await Invoice.countDocuments(filterQuery);
    console.log('🔍 Dashboard: Total facturas:', totalFacturas);
    
    // Obtener facturas impagas
    let consultaImpagas = { 
      ...filterQuery,
      $or: [
        { estadoPago: 'impaga' },
        { estadoPago: { $exists: false } }
      ]
    };
    
    // Aplicar filtro de fecha si se especifica
    if (periodo && periodo !== 'todas') {
      const ahora = new Date();
      let fechaDesde;
      
      switch (periodo) {
        case 'semana':
          fechaDesde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case 'trimestre':
          fechaDesde = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
          break;
        case 'año':
          fechaDesde = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      
      if (fechaDesde) {
        consultaImpagas.fecha = { $gte: fechaDesde.toISOString().split('T')[0] };
      }
    }
    
    console.log('🔍 Dashboard: Consulta de agregación:', consultaImpagas);
    
    // Obtener facturas impagas con agregación para calcular total y totales por moneda
    const [impagas, impagasPorMoneda] = await Promise.all([
      Invoice.aggregate([
        { $match: consultaImpagas },
        { $group: { _id: null, cantidad: { $sum: 1 }, monto: { $sum: "$total" } } }
      ]),
      Invoice.aggregate([
        { $match: consultaImpagas },
        { $group: { _id: "$moneda", total: { $sum: "$total" } } }
      ])
    ]);
    
    console.log('🔍 Dashboard: Resultado agregación MongoDB:', impagas, impagasPorMoneda);
    
    const resultado = {
      cantidad: impagas[0]?.cantidad || 0,
      monto: impagas[0]?.monto || 0,
      totalesPorMoneda: (impagasPorMoneda || []).map(t => ({
        moneda: t._id || 'ARS',
        total: t.total || 0
      })),
      totalFacturas: totalFacturas
    };
    
    console.log('✅ Dashboard: Facturas impagas encontradas:', resultado);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error en dashboard ventas impagas:', error);
    res.status(500).json({ message: 'Error al obtener ventas impagas.' });
  }
});

// Dashboard: Ingresos por país
router.get('/invoices-dashboard/ingresos-por-pais', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Buscando ingresos por país...');
    console.log('🔍 Dashboard: Usuario autenticado:', req.user);
    console.log('🔍 Parámetros de query:', req.query);
    
    let filterQuery = {};
    
    // PRIORIDAD: Usar userId de la query si está presente (para forzar filtro específico)
    const queryUserId = req.query.userId;
    if (queryUserId) {
      console.log('🔒 Usando userId de la query para forzar filtro específico:', queryUserId);
      filterQuery = { userId: new mongoose.Types.ObjectId(queryUserId) };
    } else {
      // Lógica original basada en el rol del usuario
      if (req.user.isSuperAdmin === true) {
        console.log('👑 Superadmin: Mostrando TODAS las facturas');
        filterQuery = {}; // Super admin ve todo
      } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
        // Si es admin normal, mostrar datos de todas las empresas
        console.log('👑 Admin: Mostrando ingresos por país de todas las empresas');
        const userCompanies = await Company.find({}, '_id');
        const companyIds = userCompanies.map(c => c._id);
        filterQuery = {
          $or: [
            { userId: { $in: companyIds } },
            { companyId: { $in: companyIds } }
          ]
        };
      } else if (req.user.role === 'company_owner') {
        // Propietario de empresa: mostrar datos de sus empresas
        const userCompanies = req.user.ownedCompanies || [];
        if (userCompanies.length > 0) {
          filterQuery = {
            $or: [
              { userId: { $in: userCompanies } },
              { companyId: { $in: userCompanies } }
            ]
          };
        } else {
          filterQuery = { userId: req.user.userId };
        }
      } else {
        // Usuario normal: mostrar solo sus datos
        console.log('👤 Usuario normal: Mostrando ingresos por país personales');
        const userId = req.user.userId;
        const userIdObjectId = new mongoose.Types.ObjectId(userId);
        filterQuery = { userId: userIdObjectId };
      }
    }
    
    console.log('🔍 Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    
    // Construir filtro de fecha si se especifica
    let fechaFiltro = {};
    const { periodo } = req.query;
    
    console.log('🔍 Dashboard: Período solicitado para ingresos por país:', periodo);
    
    // Aplicar filtro de fecha si se especifica
    if (periodo && periodo !== 'todas') {
      const ahora = new Date();
      let fechaDesde;
      
      switch (periodo) {
        case 'semana':
          fechaDesde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mes':
          fechaDesde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        case 'trimestre':
          fechaDesde = new Date(ahora.getFullYear(), Math.floor(ahora.getMonth() / 3) * 3, 1);
          break;
        case 'año':
          fechaDesde = new Date(ahora.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      
      if (fechaDesde) {
        fechaFiltro.fecha = { $gte: fechaDesde.toISOString().split('T')[0] };
      }
    }
    
    // Consulta de agregación
    const ingresos = await Invoice.aggregate([
      {
        $match: { 
          ...filterQuery,
          ...fechaFiltro
        }
      },
      { $group: { _id: "$pais", total: { $sum: "$total" }, cantidadFacturas: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $project: { 
        pais: "$_id", 
        total: 1, 
        cantidadFacturas: 1,
        _id: 0 
      }}
    ]);
    
    console.log('🔍 Dashboard: Resultado agregación ingresos por país:', ingresos);
    console.log('✅ Dashboard: Ingresos por país encontrados:', ingresos.length);
    res.json(ingresos);
  } catch (error) {
    console.error('❌ Error al obtener ingresos por país:', error);
    res.status(500).json({ message: 'Error al obtener ingresos por país.' });
  }
});

// Dashboard: Detalle de facturas impagas por periodo
router.get('/invoices-dashboard/facturas-impagas-detalle', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Buscando detalle de facturas impagas...');
    console.log('🔍 Dashboard: Usuario autenticado:', req.user);
    
    let filterQuery = {};
    
    // Si es superadmin, mostrar TODAS las facturas
    if (req.user.isSuperAdmin === true) {
      console.log('👑 Superadmin: Mostrando TODAS las facturas');
      filterQuery = {}; // Super admin ve todo
    } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      // Si es admin normal, mostrar datos de todas las empresas
      console.log('👑 Admin: Mostrando detalle de facturas impagas de todas las empresas');
      const userCompanies = await Company.find({}, '_id');
      const companyIds = userCompanies.map(c => c._id);
      filterQuery = {
        $or: [
          { userId: { $in: companyIds } },
          { companyId: { $in: companyIds } },
        ]
      };
    } else if (req.user.role === 'company_owner') {
      // Propietario de empresa: mostrar datos de sus empresas
      console.log('🏢 Propietario de empresa: Mostrando datos de sus empresas');
      const userCompanies = req.user.ownedCompanies || [];
      if (userCompanies.length > 0) {
        filterQuery = {
          $or: [
            { userId: { $in: userCompanies } },
            { companyId: { $in: userCompanies } }
          ]
        };
      } else {
        filterQuery = { userId: req.user.userId };
      }
    } else {
      // Usuario normal: mostrar solo sus datos
      console.log('👤 Usuario normal: Mostrando detalle de facturas impagas personales');
      const userId = req.user.userId;
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      filterQuery = { userId: userIdObjectId };
    }
    
    console.log('🔍 Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    
    const { periodo } = req.query;
    let fechaDesde;
    const hoy = new Date();
    
    // Configurar filtro de fecha según el período
    if (periodo === 'semana') {
      fechaDesde = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else if (periodo === 'mes') {
      fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else if (periodo === 'trimestre') {
      fechaDesde = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
    } else if (periodo === 'año') {
      fechaDesde = new Date(hoy.getFullYear(), 0, 1);
    }
    
    // Filtro base: solo facturas impagas + filtro de usuario
    let filtro = { 
      ...filterQuery,
      estadoPago: 'impaga' 
    };
    
    // Agregar filtro de fecha solo si se especifica un período
    if (fechaDesde && periodo !== 'todas') {
      filtro.fecha = { $gte: fechaDesde.toISOString().split('T')[0] };
    }
    
    console.log('🔍 Filtro final aplicado:', filtro);
    
    const facturas = await Invoice.find(filtro).sort({ fecha: -1 });
    
    console.log(`✅ Facturas impagas encontradas: ${facturas.length}`);
    
    res.json(facturas);
  } catch (error) {
    console.error('❌ Error en facturas-impagas-detalle:', error);
    res.status(500).json({ message: 'Error al obtener detalle de ventas impagas.' });
  }
});

// Dashboard: Próximos vencimientos de comprobantes impagos
router.get('/invoices-dashboard/proximos-vencimientos', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Buscando próximos vencimientos de comprobantes impagos...');
    console.log('🔍 Usuario autenticado:', req.user);

    let filterQuery = {};

    // Reutilizar lógica de visibilidad según rol
    if (req.user.isSuperAdmin === true) {
      console.log('👑 Superadmin: Mostrando TODAS las facturas');
      filterQuery = {}; // Super admin ve todo
    } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      console.log('👑 Admin: Mostrando vencimientos de todas las empresas');
      const userCompanies = await Company.find({}, '_id');
      const companyIds = userCompanies.map(c => c._id);
      filterQuery = {
        $or: [
          { userId: { $in: companyIds } },
          { companyId: { $in: companyIds } },
        ]
      };
    } else if (req.user.role === 'company_owner') {
      console.log('🏢 Propietario de empresa: Mostrando vencimientos de sus empresas');
      const userCompanies = req.user.ownedCompanies || [];
      if (userCompanies.length > 0) {
        filterQuery = {
          $or: [
            { userId: { $in: userCompanies } },
            { companyId: { $in: userCompanies } }
          ]
        };
      } else {
        filterQuery = { userId: req.user.userId };
      }
    } else {
      console.log('👤 Usuario normal: Mostrando vencimientos personales');
      const userId = req.user.userId;
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      filterQuery = { userId: userIdObjectId };
    }

    const hoy = new Date();
    const hoyISO = hoy.toISOString().split('T')[0];

    // Filtro: solo impagas con fecha de vencimiento definida y futura/actual
    const filtro = {
      ...filterQuery,
      estadoPago: 'impaga',
      vencimiento: { $gte: hoyISO }
    };

    console.log('🔍 Filtro aplicado para próximos vencimientos:', JSON.stringify(filtro, null, 2));

    // Traer las próximas 10 ordenadas por vencimiento ascendente
    const proximos = await Invoice.find(filtro)
      .sort({ vencimiento: 1 })
      .limit(10)
      .select('numero razonSocial total vencimiento estadoPago documentType');

    const totalPendiente = proximos.reduce((sum, f) => sum + (Number(f.total) || 0), 0);

    res.json({
      totalPendiente,
      cantidad: proximos.length,
      items: proximos
    });
  } catch (error) {
    console.error('❌ Error al obtener próximos vencimientos:', error);
    res.status(500).json({ message: 'Error al obtener próximos vencimientos.' });
  }
});

// Subir archivo adjunto a una factura
router.post('/invoices/:id/adjunto', auth, upload.single('adjunto'), async (req, res) => {
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    // Si ya hay un adjunto, eliminar el archivo anterior
    if (factura.adjunto) {
      const prevPath = path.join(__dirname, '../uploads', factura.adjunto);
      if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
    }
    // Guardar el nombre del archivo
    factura.adjunto = req.file.filename;
    await factura.save();
    res.json({ message: 'Archivo adjunto subido correctamente.', adjunto: factura.adjunto });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir el archivo adjunto.' });
  }
});

// Descargar archivo adjunto de una factura
router.get('/invoices/:id/adjunto', auth, async (req, res) => {
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura || !factura.adjunto) return res.status(404).json({ message: 'Adjunto no encontrado.' });
    const filePath = path.join(__dirname, '../uploads', factura.adjunto);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Archivo no encontrado en el servidor.' });
    res.download(filePath, factura.adjunto);
  } catch (error) {
    res.status(500).json({ message: 'Error al descargar el archivo adjunto.' });
  }
});

// Eliminar archivo adjunto de una factura
router.delete('/invoices/:id/adjunto', auth, async (req, res) => {
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura || !factura.adjunto) return res.status(404).json({ message: 'Adjunto no encontrado.' });
    const filePath = path.join(__dirname, '../uploads', factura.adjunto);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    factura.adjunto = undefined;
    await factura.save();
    res.json({ message: 'Archivo adjunto eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el archivo adjunto.' });
  }
});

// Endpoint para enviar la factura por email al cliente
router.post('/invoices/:id/send-email', auth, async (req, res) => {
  console.log('POST /invoices/:id/send-email llamado para ID:', req.params.id);
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    if (!factura.email) return res.status(400).json({ message: 'El registro no tiene email de cliente.' });

    // Generar el PDF en memoria (usando el mismo código que para descargar)
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(buffers);

      // Configurar el transporte de nodemailer (puedes cambiar a tu SMTP real)
      let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Email fijo y profesional
      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@basecontable.com',
        to: factura.email,
        subject: `Nota de Débito N°${factura.numero} - Estudio Marcelo L. Berti`,
        text: `Estimado/a ${factura.razonSocial},\n\nAdjuntamos la Nota de Débito N°${factura.numero} correspondiente a sus servicios.\n\nAnte cualquier consulta, quedamos a disposición.\n\nSaludos cordiales,\nEstudio Marcelo L. Berti`,
        attachments: [
          {
            filename: `NotaDebito_${factura.numero}.pdf`,
            content: pdfData,
            contentType: 'application/pdf'
          }
        ]
      };

      try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Factura enviada por email correctamente.' });
      } catch (err) {
        console.error('Error enviando email:', err);
        res.status(500).json({ message: 'Error al enviar el email.' });
      }
    });

    // --- Generar el PDF (copia de la lógica real) ---
    const pageW = 595.28, pageH = 841.89;
    const left = 30, right = pageW - 30, top = 30, bottom = pageH - 30;
    const colW = (right - left) / 2;
    const colImporteW = 80;
    const colDetalleW = right - left - colImporteW;
    const importeX = left + colDetalleW;
    const line = (x1, y1, x2, y2, thick = 1) => {
      doc.save().lineWidth(thick).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
    };
    const drawRect = (x, y, w, h, thick = 1) => {
      doc.save().lineWidth(thick).rect(x, y, w, h).stroke().restore();
    };

    // Borde exterior
    drawRect(left, top, right - left, bottom - top, 2);

    // Encabezado: dos columnas
    // Columna izquierda: logo y datos del estudio (logo centrado)
    const logoPath = path.join(__dirname, '../../public/logo-inglesblack.png');
    let logoMaxW = colW - 30;
    let logoX = left + (colW - logoMaxW) / 2;
    let logoY = top + 10;
    let datosY = logoY;
    if (fs.existsSync(logoPath)) {
      const getImageSize = imageSize.default || imageSize;
      const logoBuffer = fs.readFileSync(logoPath);
      const logoDims = getImageSize(logoBuffer);
      let scale = Math.min(logoMaxW / logoDims.width, 50 / logoDims.height, 1);
      let logoW = logoDims.width * scale;
      let logoH = logoDims.height * scale;
      doc.image(logoPath, left + (colW - logoW) / 2, logoY, { width: logoW });
      datosY = logoY + logoH + 5;
    }
    // Datos del estudio alineados al centro debajo del logo
    const datosEstudio = [
      'Florida 470, Floor 2, Office 214/216',
      '(C1005AAJ) Autonomous City of Buenos Aires',
      'Republic of Argentina.',
      'Tel/Fax: (54-11) 4325-9933',
      'berti@berti.com.ar',
      'www.berti.com.ar'
    ];
    doc.font('Helvetica').fontSize(9);
    datosEstudio.forEach((linea, i) => {
      doc.text(linea, left, datosY + i * 11, { width: colW, align: 'center' });
    });

    // Columna derecha: título y datos de la factura (centrados, uno debajo del otro)
    let col2X = left + colW;
    let tituloY = top + 20;
    doc.font('Helvetica-Bold').fontSize(18).text('DEBIT NOTE', col2X, tituloY, { width: colW, align: 'center' });
    let datosFacturaY = tituloY + 35;
    // N° y número en la misma línea, uno al lado del otro
    doc.font('Helvetica').fontSize(11).text('N°', col2X, datosFacturaY, { width: 20, align: 'right' });
    doc.font('Helvetica-Bold').text(factura.numero, col2X + 25, datosFacturaY, { width: colW - 25, align: 'left' });
    doc.font('Helvetica').fontSize(11).text('Date:', col2X, datosFacturaY + 30, { width: colW, align: 'center' });
    doc.font('Helvetica-Bold').text(`Buenos Aires, ${factura.fecha}`, col2X, datosFacturaY + 43, { width: colW, align: 'center' });

    // Línea horizontal bajo encabezado
    let yEncabezado = Math.max(datosY + datosEstudio.length * 11, datosFacturaY + 36);
    
    line(left, yEncabezado, right, yEncabezado, 2);

    // Línea vertical separadora del encabezado
    line(left + colW, top, left + colW, yEncabezado, 2);

    // Datos del cliente
    let yCliente = yEncabezado + 10;
    
    // Asegurar que haya suficiente espacio para los datos del cliente
    const alturaCliente = 54;
    if (yCliente + alturaCliente > bottom - 200) {
      yCliente = bottom - 200 - alturaCliente;
    }
    const labelWidth = 90; // Espacio reservado para la etiqueta
    doc.font('Helvetica').fontSize(11).text('Mr./Mrs.:', left + 10, yCliente, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + factura.razonSocial, { continued: false });
    doc.font('Helvetica').fontSize(11).text('Adress:', left + 10, yCliente + 18, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + (factura.domicilio || '-'), { continued: false });
    doc.font('Helvetica').fontSize(11).text('City:', left + 10, yCliente + 36, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + (factura.localidad || '-'), { continued: false });
    doc.font('Helvetica').fontSize(11).text('Country:', right - 120, yCliente + 36, { continued: true });
    doc.font('Helvetica-Bold').text('    ' + factura.pais, { continued: false });

    // Línea horizontal bajo datos cliente
    line(left, yCliente + 54, right, yCliente + 54, 2);

    // Tabla conceptos: encabezado
    let yTabla = yCliente + 64;
    const headerHeight = 25; // Aumentar altura del encabezado de la tabla
    const encabezadoAltura = 12; // altura aproximada de la fuente
    const headerCenterY = yTabla + (headerHeight - encabezadoAltura) / 2;

    // Títulos centrados
    doc.font('Helvetica-Bold').fontSize(11).text('Details', left + 2, headerCenterY, { width: colDetalleW - 4, align: 'center' });
    doc.text('Amount', importeX + 2, headerCenterY, { width: colImporteW - 4, align: 'center' });

    // Línea horizontal superior de la tabla (de left a importeX)
    line(left, yTabla + headerHeight, importeX, yTabla + headerHeight, 2);
    // Línea horizontal bajo encabezado (inicio de la tabla, de left a right)
    line(left, yTabla + headerHeight, right, yTabla + headerHeight, 2);
    // Línea vertical que separa Detalle de Importe (de yTabla + headerHeight a bottom - 30)
    line(importeX, yTabla + headerHeight, importeX, bottom - 30, 2);
    // Línea horizontal inferior (de left a right en bottom - 30)
    line(left, bottom - 30, right, bottom - 30, 2);

    // Conceptos - RESTAURAR DISEÑO ORIGINAL
    let yConcepto = yTabla + headerHeight + 10;
    factura.conceptos.forEach((c, i) => {
      doc.font('Helvetica').fontSize(10).text(`${i + 1}. ${c.detalle}`, left + 15, yConcepto, { width: colDetalleW - 30 });
      doc.text(`US$ ${c.importe.toFixed(2)}`, importeX + 10, yConcepto, { width: colImporteW - 20, align: 'right' });
      yConcepto += 28;
    });

    // Recuadro de datos bancarios: justo debajo del último concepto, con un margen de 40px y centrado
    let boxW = 270, boxH = 55;
    let boxX = left + ((right - left) - boxW) / 2;
    let boxY = yConcepto + 40;
    if (boxY + boxH > bottom - 30) boxY = bottom - 30 - boxH;
    drawRect(boxX, boxY, boxW, boxH, 1.5);
    
    // Usar datos bancarios personalizados si están disponibles
    let datosBancarios = [
      'Debit note in US$ Dollars - Wire transfers to:',
      'Bank account n° 24 78 20275137 0',
      'Banca Sella SpA (Piazza Gaudenzio Sella, 1- Biella, IT)',
      'IBAN: IT 42 P 03268 22300 078202751370',
      'BIC CODE: SELBIT2BXXX'
    ];

    // Imprimir datos bancarios
    doc.fontSize(8).font('Helvetica-Bold').text(datosBancarios[0], boxX + 5, boxY + 5);
    for (let i = 1; i < datosBancarios.length; i++) {
      doc.font('Helvetica').fontSize(8).text(datosBancarios[i], boxX + 5, boxY + 17 + (i - 1) * 10);
    }

    // Total al pie
    line(left, bottom - 30, right, bottom - 30, 2);
    const totalStr = 'US$ ' + factura.total.toFixed(2);
    const totalFontSize = factura.total >= 1000 ? 11 : 12;
    doc.font('Helvetica-Bold').fontSize(totalFontSize).text(totalStr, right - 140, bottom - 25, { width: 130, align: 'right', continued: false });

    doc.end();
  } catch (error) {
    console.error('Error en /invoices/:id/send-email:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error al enviar el registro de venta por email.' });
    }
  }
});

// Enviar recordatorio de pago de un comprobante impago
router.post('/invoices/:id/reminder', auth, async (req, res) => {
  console.log('POST /invoices/:id/reminder llamado para ID:', req.params.id);
  try {
    const factura = await Invoice.findById(req.params.id);
    if (!factura) return res.status(404).json({ message: 'Registro de venta no encontrado.' });
    if (!factura.email) return res.status(400).json({ message: 'El registro de venta no tiene email de cliente.' });
    if (factura.estadoPago === 'pagada') {
      return res.status(400).json({ message: 'El comprobante ya está marcado como pagado.' });
    }

    // Configurar transporte de correo
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@basecontable.com',
      to: factura.email,
      subject: `Recordatorio de pago - Comprobante N°${factura.numero}`,
      text: `Estimado/a ${factura.razonSocial},

Te recordamos que tienes un comprobante pendiente de pago:

- Número: ${factura.numero}
- Fecha: ${factura.fecha}
- Importe: ${factura.total}

Si ya realizaste el pago, puedes ignorar este mensaje. De lo contrario, te agradecemos realizarlo a la brevedad.

Saludos cordiales,
Equipo ContaSuite`,
    };

    try {
      await transporter.sendMail(mailOptions);
      // Registrar actividad
      await Activity.create({
        user: req.user.userId,
        action: 'Recordatorio de pago enviado',
        details: `Recordatorio enviado para comprobante N°${factura.numero} (${factura.razonSocial})`
      });
      res.json({ message: 'Recordatorio de pago enviado correctamente.' });
    } catch (err) {
      console.error('Error enviando recordatorio de pago:', err);
      res.status(500).json({ message: 'Error al enviar el recordatorio de pago.' });
    }
  } catch (error) {
    console.error('Error en /invoices/:id/reminder:', error);
    res.status(500).json({ message: 'Error al procesar el recordatorio de pago.' });
  }
});

// Dashboard: Estadísticas resumidas del usuario
router.get('/invoices-dashboard/resumen', auth, async (req, res) => {
  try {
    console.log('🔍 Dashboard: Generando resumen...');
    console.log('🔍 Usuario autenticado:', req.user);
    console.log('🔍 Parámetros de query:', req.query);
    
    let filterQuery = {};
    let isSuperAdmin = false;
    
    // PRIORIDAD: Usar userId de la query si está presente (para forzar filtro específico)
    const queryUserId = req.query.userId;
    if (queryUserId) {
      console.log('🔒 Usando userId de la query para forzar filtro específico:', queryUserId);
      filterQuery = { userId: new mongoose.Types.ObjectId(queryUserId) };
      isSuperAdmin = false; // Forzar como usuario normal cuando se especifica userId
    } else {
      // Lógica original basada en el rol del usuario
      if (req.user.isSuperAdmin === true) {
        console.log('👑 Superadmin: Mostrando TODAS las facturas');
        filterQuery = {}; // Super admin ve todo
        isSuperAdmin = true;
      } else if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
        // Si es admin normal, mostrar datos de todas las empresas
        console.log('👑 Admin: Mostrando datos de todas las empresas');
        const userCompanies = await Company.find({}, '_id');
        const companyIds = userCompanies.map(c => c._id);
        filterQuery = {
          $or: [
            { userId: { $in: companyIds } },
            { companyId: { $in: companyIds } }
          ]
        };
      } else if (req.user.role === 'company_owner') {
        // Propietario de empresa: mostrar datos de sus empresas
        const userCompanies = req.user.ownedCompanies || [];
        if (userCompanies.length > 0) {
          filterQuery = {
            $or: [
              { userId: { $in: userCompanies } },
              { companyId: { $in: userCompanies } }
            ]
          };
        } else {
          filterQuery = { userId: req.user.userId };
        }
      } else {
        // Usuario normal: mostrar solo sus datos
        console.log('👤 Usuario normal: Mostrando datos personales');
        const userId = req.user.userId;
        const userIdObjectId = new mongoose.Types.ObjectId(userId);
        filterQuery = { userId: userIdObjectId };
      }
    }
    
    console.log('🔍 Query de filtrado aplicado:', JSON.stringify(filterQuery, null, 2));
    console.log('🔒 Dashboard: Filtro forzado por usuario:', queryUserId !== undefined);
    
    // Construir filtro de fecha si se especifica
    const { periodo } = req.query;
    console.log('🔍 Dashboard: Período solicitado para resumen:', periodo);
    
    // Fechas UTC para el mes actual (uso del plan)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    
    // Obtener estadísticas generales
    const [totalFacturas, totalIngresos, totalesPorMoneda, facturasMes, clientesUnicos, facturasMesUsuario] = await Promise.all([
      // Total de facturas
      Invoice.countDocuments(filterQuery),
      
      // Total de ingresos (todas las monedas)
      Invoice.aggregate([
        { $match: filterQuery },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]),
      
      // Totales por moneda
      Invoice.aggregate([
        { $match: filterQuery },
        { $group: { _id: "$moneda", total: { $sum: "$total" } } }
      ]),
      
      // Facturas del mes actual
      Invoice.countDocuments({
        ...filterQuery,
        fecha: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        }
      }),
      
      // Clientes únicos
      Invoice.distinct('razonSocial', filterQuery),
      
      // Facturas del mes actual para el usuario actual (para comparar con el límite del plan)
      Invoice.countDocuments({
        userId: new mongoose.Types.ObjectId(req.user.userId),
        createdAt: {
          $gte: startOfMonth,
          $lt: startOfNextMonth
        }
      })
    ]);
    
    // Diagnóstico: verificar facturas del usuario
    const facturaEjemplo = await Invoice.findOne({ 
      userId: new mongoose.Types.ObjectId(req.user.userId) 
    }).sort({ createdAt: -1 });
    
    console.log('🔍 Dashboard: Factura ejemplo:', {
      id: facturaEjemplo?._id,
      fecha: facturaEjemplo?.fecha,
      createdAt: facturaEjemplo?.createdAt,
      userId: facturaEjemplo?.userId,
      tipo: typeof facturaEjemplo?.userId
    });
    
    console.log('🔍 Dashboard: Resultados consultas resumen:', {
      totalFacturas,
      totalIngresos: totalIngresos[0]?.total,
      facturasMes,
      clientesUnicos: clientesUnicos?.length,
      facturasMesUsuario,
      fechasConsulta: {
        startOfMonth: startOfMonth.toISOString(),
        startOfNextMonth: startOfNextMonth.toISOString()
      },
      userId: req.user.userId,
      isSuperAdmin
    });

    // Intentar obtener el plan del usuario para conocer el límite de comprobantes/mes
    let maxDocumentsPerMonth = null;
    try {
      const user = await User.findById(req.user.userId).populate('currentPlan');
      console.log('👤 Usuario encontrado:', user?._id, 'Plan:', user?.currentPlan?.name);
      console.log('📋 Plan completo:', user?.currentPlan);
      if (user && user.currentPlan && typeof user.currentPlan.maxDocumentsPerMonth === 'number') {
        maxDocumentsPerMonth = user.currentPlan.maxDocumentsPerMonth;
        console.log('✅ maxDocumentsPerMonth encontrado:', maxDocumentsPerMonth);
      } else {
        console.log('⚠️ No se encontró maxDocumentsPerMonth. user:', !!user, 'currentPlan:', !!user?.currentPlan, 'tipo:', typeof user?.currentPlan?.maxDocumentsPerMonth);
      }
    } catch (planError) {
      console.error('❌ Error al obtener plan del usuario para resumen de dashboard:', planError);
    }

    const resumen = {
      totalFacturas: totalFacturas || 0,
      totalIngresos: totalIngresos[0]?.total || 0,
      totalesPorMoneda: (totalesPorMoneda || []).map(t => ({
        moneda: t._id || 'ARS',
        total: t.total || 0
      })),
      facturasMes: facturasMes || 0,
      clientesUnicos: clientesUnicos?.length || 0,
      empresas: isSuperAdmin ? await Company.countDocuments() : 1,
      // Uso del plan de comprobantes
      documentosMesUsuario: facturasMesUsuario || 0,
      maxDocumentsPerMonth: maxDocumentsPerMonth
    };

    console.log('✅ Dashboard: Resumen generado:', resumen);
    res.json(resumen);
  } catch (error) {
    console.error('❌ Error al obtener resumen del dashboard:', error);
    res.status(500).json({ message: 'Error al obtener resumen del dashboard.' });
  }
});

module.exports = router; 