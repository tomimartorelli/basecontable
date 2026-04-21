/**
 * Fix Luna's company field in Atlas database
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env from backend folder
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Atlas connection string (from environment or fallback)
const ATLAS_URI = process.env.MONGO_URI;

if (!ATLAS_URI || ATLAS_URI.includes('localhost')) {
  console.log('MONGO_URI from .env:', process.env.MONGO_URI);
  console.log('Please provide the Atlas connection string in .env file');
  process.exit(1);
}

async function fixLuna() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('Connected to Atlas\n');

    // Define User schema dynamically
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      company: String,
      role: String,
      employeeOf: [{
        company: mongoose.Schema.Types.Mixed,
        role: String
      }]
    }, { collection: 'users' });
    
    const User = mongoose.model('User', UserSchema);

    // Find Luna
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    
    if (!luna) {
      console.log('Luna not found in database');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Found Luna:');
    console.log('  Current company:', luna.company);
    console.log('  Current role:', luna.role);
    console.log('  employeeOf:', JSON.stringify(luna.employeeOf));
    console.log();

    // Update Luna's company
    const result = await User.updateOne(
      { _id: luna._id },
      { $set: { company: 'Nekodev' } }
    );

    console.log('Update result:', result);

    // Verify
    const updated = await User.findById(luna._id);
    console.log('\nAfter update:');
    console.log('  Company:', updated.company);

    await mongoose.disconnect();
    console.log('\nDone!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixLuna();
