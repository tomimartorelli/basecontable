/**
 * Migration: Fix employee company assignments
 * 
 * This script fixes employees that were created without the 'company' field
 * by reading their employeeOf relationship and copying the company name.
 * 
 * Usage: node backend/migrations/fix-employee-companies.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Import models
const User = require('../models/User');
const Company = require('../models/Company');

async function runMigration() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB');

    // Find all employees with employeeOf relationship but missing or empty company field
    const employees = await User.find({
      $or: [
        { role: 'employee' },
        { employeeOf: { $exists: true, $ne: [] } }
      ],
      $or: [
        { company: { $exists: false } },
        { company: '' },
        { company: null }
      ]
    });

    console.log(`🔍 Found ${employees.length} employees without company assignment`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of employees) {
      try {
        // Get the company from employeeOf relationship
        const employeeOfEntry = user.employeeOf?.[0];
        
        if (!employeeOfEntry || !employeeOfEntry.company) {
          console.log(`⚠️  Skipped: ${user.email} - No employeeOf relationship found`);
          skipped++;
          continue;
        }

        const company = await Company.findById(employeeOfEntry.company);
        
        if (!company) {
          console.log(`⚠️  Skipped: ${user.email} - Company ${employeeOfEntry.company} not found`);
          skipped++;
          continue;
        }

        // Update the user's company field
        await User.updateOne(
          { _id: user._id },
          { $set: { company: company.name } }
        );

        console.log(`✅ Updated: ${user.email} -> ${company.name}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error processing ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
