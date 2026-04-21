/**
 * Diagnose: Find all users and their roles
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

async function diagnose() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB\n');

    // Find all users with their roles
    const users = await User.find({}).select('name email role company employeeOf ownedCompanies');
    
    console.log('📋 ALL USERS:\n');
    for (const user of users) {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Company: ${user.company || 'N/A'}`);
      
      // Find companies owned by this user
      const owned = await Company.find({ owner: user._id });
      if (owned.length > 0) {
        console.log(`Owned Companies: ${owned.map(c => `"${c.name}"`).join(', ')}`);
      }
      
      // Find companies where this user is an employee
      if (user.employeeOf && user.employeeOf.length > 0) {
        const empCompanies = await Company.find({ 
          _id: { $in: user.employeeOf.map(e => e.company) }
        });
        console.log(`Employee Of: ${empCompanies.map(c => `"${c.name}"`).join(', ')}`);
      }
      
      console.log('---\n');
    }

    // List all companies
    console.log('\n🏢 ALL COMPANIES:\n');
    const companies = await Company.find({}).populate('owner', 'name email');
    for (const company of companies) {
      console.log(`Name: ${company.name}`);
      console.log(`Owner: ${company.owner?.name} (${company.owner?.email})`);
      console.log(`Employees: ${company.employees?.length || 0}`);
      console.log('---');
    }

    await mongoose.disconnect();
    console.log('\n👋 Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
