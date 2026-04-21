const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');

async function check() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    
    if (!luna) {
      console.log('Luna not found in database');
    } else {
      console.log('Luna found:');
      console.log('  _id:', luna._id);
      console.log('  name:', luna.name);
      console.log('  email:', luna.email);
      console.log('  company:', luna.company);
      console.log('  role:', luna.role);
      console.log('  employeeOf:', JSON.stringify(luna.employeeOf, null, 2));
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
