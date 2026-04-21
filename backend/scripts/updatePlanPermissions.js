require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const Plan = require('../models/Plan');

async function updatePlanPermissions() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Conectado a MongoDB');

    // Definir los permisos por slug de plan
    const permissionsBySlug = {
      'basico': {
        canViewDashboard: true,
        canViewAnalytics: false,
        canViewCharts: false,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      },
      'starter': {
        canViewDashboard: true,
        canViewAnalytics: false,
        canViewCharts: false,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      },
      'profesional': {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      },
      'pro': {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: false,
        canExportData: false,
        canViewRealTimeData: false
      },
      'empresarial': {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: true,
        canExportData: true,
        canViewRealTimeData: false
      },
      'business': {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: true,
        canExportData: true,
        canViewRealTimeData: false
      },
      'enterprise': {
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewCharts: true,
        canViewAdvancedStats: true,
        canExportData: true,
        canViewRealTimeData: true
      }
    };

    // Obtener todos los planes
    const plans = await Plan.find({});
    console.log(`🔍 Encontrados ${plans.length} planes`);

    let updatedCount = 0;

    for (const plan of plans) {
      const slug = plan.slug?.toLowerCase();
      const permissions = permissionsBySlug[slug];

      if (permissions) {
        // Verificar si ya tiene los permisos configurados correctamente
        const current = plan.dashboardPermissions || {};
        const needsUpdate = 
          current.canViewCharts !== permissions.canViewCharts ||
          current.canViewAnalytics !== permissions.canViewAnalytics ||
          current.canViewAdvancedStats !== permissions.canViewAdvancedStats ||
          current.canExportData !== permissions.canExportData ||
          current.canViewRealTimeData !== permissions.canViewRealTimeData;

        if (needsUpdate || !plan.dashboardPermissions) {
          plan.dashboardPermissions = permissions;
          await plan.save();
          console.log(`✅ Actualizado: ${plan.name} (${slug})`);
          console.log(`   Permisos:`, permissions);
          updatedCount++;
        } else {
          console.log(`⏭️  Sin cambios: ${plan.name} (${slug})`);
        }
      } else {
        console.log(`⚠️  Slug desconocido: ${plan.name} (${slug}) - aplicando permisos básicos`);
        plan.dashboardPermissions = permissionsBySlug['basico'];
        await plan.save();
        updatedCount++;
      }
    }

    console.log(`\n✅ Migración completada: ${updatedCount} planes actualizados`);

  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

updatePlanPermissions();
