const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/basecontable';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }), 'companies');

    // Fix company names
    const fixes = [
      { email: 'tomi@gmail.com', name: 'Nekodev' },
      { email: 'tomimartorelli@gmail.com', name: 'Torrentio' },
      { email: 'nico.siciliano@gmail.com', name: 'Rentix' },
      { email: 'nicoguarch@gmail.com', name: 'Brelito S.A' }
    ];

    for (const fix of fixes) {
      const user = await User.findOne({ email: fix.email });
      if (!user) continue;

      const company = await Company.findOne({ owner: user._id });
      if (!company) continue;

      await Company.updateOne(
        { _id: company._id },
        { $set: { name: fix.name, legalName: fix.name } }
      );
      console.log(`✅ Company: ${company.name} → ${fix.name}`);

      // Update owner
      await User.updateOne(
        { _id: user._id },
        { $set: { company: fix.name, role: 'company_owner' } }
      );

      // Update employees
      const emps = await User.find({ 'employeeOf.company': company._id.toString() });
      for (const emp of emps) {
        await User.updateOne({ _id: emp._id }, { $set: { company: fix.name } });
        console.log(`   👤 ${emp.email} → ${fix.name}`);
      }
    }

    // Fix Luna specifically
    const nekodev = await Company.findOne({ name: 'Nekodev' });
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    if (luna && nekodev) {
      await User.updateOne({ _id: luna._id }, { $set: { company: 'Nekodev' } });
      console.log(`✅ Luna → Nekodev`);
    }

    console.log('\n✅ Done!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  process.exit(0);
}

run();
