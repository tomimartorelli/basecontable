/**
 * Migration: Fix company names and reassign employees
 * 
 * This script:
 * 1. Renames companies created with default names to their actual company names
 * 2. Updates all employees' company field to match the new name
 * 
 * Usage: node backend/migrations/fix-company-names.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

// Map of owner emails to their correct company names
const COMPANY_NAME_MAP = {
  'tomi@gmail.com': 'Nekodev',
  'tomimartorelli@gmail.com': 'Torrentio',
  'nico.siciliano@gmail.com': 'Rentix',
  'nicoguarch@gmail.com': 'Brelito S.A'
};

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB\n');

    let updatedCompanies = 0;
    let updatedUsers = 0;
    let skipped = 0;

    for (const [ownerEmail, correctName] of Object.entries(COMPANY_NAME_MAP)) {
      try {
        // Find the owner
        const owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
          console.log(`⚠️  Owner not found: ${ownerEmail}`);
          skipped++;
          continue;
        }

        // Find their company
        const company = await Company.findOne({ owner: owner._id });
        if (!company) {
          console.log(`⚠️  No company found for: ${ownerEmail}`);
          skipped++;
          continue;
        }

        const oldName = company.name;
        
        // Update company name
        await Company.updateOne(
          { _id: company._id },
          { $set: { name: correctName, legalName: correctName } }
        );
        
        console.log(`🏢 Company renamed: "${oldName}" -> "${correctName}"`);
        updatedCompanies++;

        // Update all employees of this company (handle both string and ObjectId)
        const companyIdStr = company._id.toString();
        const employees = await User.find({
          $or: [
            { 'employeeOf.company': company._id },
            { 'employeeOf.company': companyIdStr }
          ]
        });
        for (const emp of employees) {
          await User.updateOne(
            { _id: emp._id },
            { $set: { company: correctName } }
          );
          console.log(`   👤 Updated employee: ${emp.email} -> ${correctName}`);
          updatedUsers++;
        }

        // Also update the owner if they have a company field
        if (owner.company && owner.company !== correctName) {
          await User.updateOne(
            { _id: owner._id },
            { $set: { company: correctName } }
          );
          console.log(`   👤 Updated owner: ${owner.email} -> ${correctName}`);
          updatedUsers++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${ownerEmail}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Companies renamed: ${updatedCompanies}`);
    console.log(`   Users updated: ${updatedUsers}`);
    console.log(`   Skipped: ${skipped}`);

    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
