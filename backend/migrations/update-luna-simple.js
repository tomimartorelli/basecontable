// Script simple para actualizar el campo company de Luna
const mongoose = require('mongoose');

// Usar URI local
const MONGODB_URI = 'mongodb://127.0.0.1:27017/basecontable';

async function update() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    
    const result = await User.updateOne(
      { email: 'luna.bianchi@gmail.com' },
      { $set: { company: 'Nekodev' } }
    );
    
    console.log('Update result:', result);
    
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    console.log('\nAfter update:');
    console.log('  company:', luna?.company);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

update();
