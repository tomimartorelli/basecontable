/**
 * Fix all companies and users - LOCAL MongoDB
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/basecontable';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to local MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }), 'companies');

    // 1. Fix company names
    const companyUpdates = [
      { email: 'tomi@gmail.com', name: 'Nekodev' },
      { email: 'tomimartorelli@gmail.com', name: 'Torrentio' },
      { email: 'nico.siciliano@gmail.com', name: 'Rentix' },
      { email: 'nicoguarch@gmail.com', name: 'Brelito S.A' }
    ];

    console.log('🏢 Fixing company names...\n');

    for (const { email, name } of companyUpdates) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      // Find company by this user
      const company = await Company.findOne({ owner: user._id });
      if (!company) {
        console.log(`❌ No company for: ${email}`);
        continue;
      }

      const oldName = company.name;
      await Company.updateOne(
        { _id: company._id },
        { $set: { name: name, legalName: name } }
      );

      console.log(`✅ ${oldName} → ${name}`);

      // Update user's company field
      await User.updateOne(
        { _id: user._id },
        { $set: { company: name, role: 'company_owner' } }
      );

      // Find and update employees
      const employees = await User.find({
        'employeeOf.company': company._id.toString()
      });

      for (const emp of employees) {
        await User.updateOne(
          { _id: emp._id },
          { $set: { company: name } }
        );
        console.log(`   👤 ${emp.email} → ${name}`);
      }
    }

    // 2. Specifically fix Luna
    console.log('\n👤 Fixing Luna...');
    const luna = await User.findOne({ email: 'luna.bianchi@gmail.com' });
    if (luna) {
      // Find which company she's in
      const nekodev = await Company.findOne({ name: 'Nekodev' });
      if (nekodev) {
        await User.updateOne(
          { _id: luna._id },
          { $set: { company: 'Nekodev' } }
        );
        console.log(`✅ Luna → Nekodev`);
      }
    }

    console.log('\n✅ Done!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

run();
