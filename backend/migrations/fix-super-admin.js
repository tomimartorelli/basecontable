/**
 * Fix Super Admin - Remove plan assignment
 * Super Admin should have no plan and full access
 */

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/basecontable';

async function fixSuperAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Find Super Admin
    const superAdmin = await User.findOne({ role: 'admin', isSuperAdmin: true });
    
    if (!superAdmin) {
      console.log('❌ Super Admin not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Current Super Admin:');
    console.log('  Email:', superAdmin.email);
    console.log('  currentPlan:', superAdmin.currentPlan);
    console.log('  unlockedFeatures:', JSON.stringify(superAdmin.unlockedFeatures, null, 2));
    console.log('  subscription:', JSON.stringify(superAdmin.subscription, null, 2));
    console.log();

    // Remove plan and subscription from Super Admin
    const result = await User.updateOne(
      { _id: superAdmin._id },
      { 
        $set: { 
          currentPlan: null,
          unlockedFeatures: {},
          subscription: null
        }
      }
    );

    console.log('Update result:', result);

    // Verify
    const updated = await User.findById(superAdmin._id);
    console.log('\nAfter update:');
    console.log('  currentPlan:', updated.currentPlan);
    console.log('  subscription:', updated.subscription);

    console.log('\n✅ Super Admin fixed - no plan assigned');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixSuperAdmin();
