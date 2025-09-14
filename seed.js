#!/usr/bin/env node

require('dotenv').config();
const database = require('./src/database');
const seedData = require('./src/seedData');

async function main() {
  try {
    console.log('🎾 AskTennis Database Seeder');
    console.log('============================');
    
    // Connect to database 
    await database.connect();
    
    // Seed the database
    await seedData.seed();
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\nYou can now start the server with: npm run server');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await database.close();
    process.exit(0);
  }
}

main();
