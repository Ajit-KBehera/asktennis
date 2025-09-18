#!/usr/bin/env node

require('dotenv').config();
const database = require('./src/database');
const seedData = require('./src/seedData');

async function main() {
  try {
    console.log('🎾 AskTennis Database Seeder');
    console.log('============================');
    console.log('Environment check:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    // Connect to database 
    console.log('\n📡 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected successfully');
    
    // Seed the database
    console.log('\n🌱 Starting database seeding...');
    await seedData.seed();
    console.log('✅ Seeding completed successfully');
    
    console.log('\n🎉 Seeding completed successfully!');
    console.log('\nYou can now start the server with: npm run server');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    try {
      await database.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
    process.exit(0);
  }
}

main();
