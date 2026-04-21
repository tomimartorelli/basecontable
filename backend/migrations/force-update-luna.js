/**
 * Force update Luna's company to Nekodev
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB\n');

    // Find Luna
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    if (!luna) {
      console.log('❌ Luna not found');
      process.exit(1);
    }

    console.log('Current Luna data:');
    console.log(`  Name: ${luna.name}`);
    console.log(`  Email: ${luna.email}`);
    console.log(`  Role: ${luna.role}`);
    console.log(`  Company: ${luna.company}`);
    console.log(`  employeeOf: ${JSON.stringify(luna.employeeOf)}\n`);

    // Find the company "Nekodev" (owned by Tomás Averbuj)
    const nekodev = await Company.findOne({ name: 'Nekodev' });
    if (!nekodev) {
      console.log('❌ Nekodev company not found');
      process.exit(1);
    }

    console.log('Nekodev company found:');
    console.log(`  ID: ${nekodev._id}`);
    console.log(`  Name: ${nekodev.name}`);
    console.log(`  Owner: ${nekodev.owner}\n`);

    // FORCE update Luna's company field
    await User.updateOne(
      { _id: luna._id },
      { 
        $set: { 
          company: 'Nekodev',
          role: 'employee'
        }
      }
    );

    // Verify update
    const updated = await User.findById(luna._id);
    console.log('After update:');
    console.log(`  Company: ${updated.company}`);

    // Also ensure Luna is in Nekodev's employees list
    await Company.updateOne(
      { _id: nekodev._id },
      { 
        $addToSet: { 
          employees: {
            user: luna._id,
            role: 'employee',
            joinedAt: new Date()
          }
        }
      }
    );

    console.log('\n✅ Luna successfully updated to Nekodev');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

run();
