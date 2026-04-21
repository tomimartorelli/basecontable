/**
 * Migration: Fix company ownership and names
 * 
 * This script:
 * 1. Makes users owners of their companies (instead of employees)
 * 2. Renames companies to correct names
 * 
 * Usage: node backend/migrations/fix-company-ownership.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

const COMPANY_MAP = [
  { email: 'tomi@gmail.com', companyName: 'Nekodev' },
  { email: 'tomimartorelli@gmail.com', companyName: 'Torrentio' },
  { email: 'nico.siciliano@gmail.com', companyName: 'Rentix' },
  { email: 'nicoguarch@gmail.com', companyName: 'Brelito S.A' }
];

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/basecontable';
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB\n');

    let updatedCompanies = 0;
    let updatedUsers = 0;
    let skipped = 0;

    for (const { email, companyName } of COMPANY_MAP) {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          console.log(`⚠️  User not found: ${email}`);
          skipped++;
          continue;
        }

        // Find company by owner OR by employee relationship
        let company = await Company.findOne({ owner: user._id });
        
        if (!company && user.employeeOf && user.employeeOf.length > 0) {
          // If not owner, check if employee of a company
          const empCompanyId = user.employeeOf[0].company;
          company = await Company.findById(empCompanyId);
        }

        if (!company) {
          console.log(`⚠️  No company found for: ${email}`);
          skipped++;
          continue;
        }

        const oldName = company.name;
        
        // Update company: set owner and rename
        await Company.updateOne(
          { _id: company._id },
          { 
            $set: { 
              owner: user._id,
              name: companyName, 
              legalName: companyName 
            }
          }
        );
        
        console.log(`🏢 Company fixed: "${oldName}" -> "${companyName}" (owner: ${user.name})`);
        updatedCompanies++;

        // Update user's company field and role
        await User.updateOne(
          { _id: user._id },
          { 
            $set: { 
              company: companyName,
              role: 'company_owner'
            },
            $pull: { 
              employeeOf: { company: company._id }
            }
          }
        );
        
        console.log(`   👤 Updated user: ${user.email} -> ${companyName}`);
        updatedUsers++;

        // Update all other employees of this company
        const employees = await User.find({
          'employeeOf.company': company._id.toString(),
          _id: { $ne: user._id }
        });
        
        for (const emp of employees) {
          await User.updateOne(
            { _id: emp._id },
            { $set: { company: companyName } }
          );
          console.log(`   👤 Updated employee: ${emp.email} -> ${companyName}`);
          updatedUsers++;
        }

      } catch (error) {
        console.error(`❌ Error processing ${email}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Companies fixed: ${updatedCompanies}`);
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
