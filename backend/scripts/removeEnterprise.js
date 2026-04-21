const mongoose = require('mongoose');

async function removeEnterprisePlan() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const Plan = require('../models/Plan');
    
    // Eliminar plan Enterprise
    const result = await Plan.deleteOne({ slug: 'enterprise' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Plan Enterprise eliminado exitosamente');
    } else {
      console.log('ℹ️ No se encontró plan Enterprise para eliminar');
    }

    // Mostrar planes restantes
    const planes = await Plan.find({}, { name: 1, slug: 1, _id: 0 });
    console.log('📋 Planes restantes:', planes.map(p => p.name).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeEnterprisePlan();
