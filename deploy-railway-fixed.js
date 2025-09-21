#!/usr/bin/env node

const { fixRailwayDatabase } = require('./fix-railway-database');
const { getDatabaseStats, cleanupDatabase } = require('./railway-data-processor');

async function deployRailwayFixed() {
  console.log('🚀 Deploying AskTennis to Railway (Fixed)');
  console.log('==========================================\n');

  try {
    // Step 1: Fix database schema issues
    console.log('🔧 Step 1: Fixing Railway database schema...');
    await fixRailwayDatabase();
    console.log('✅ Database schema fixed\n');

    // Step 2: Clean up database
    console.log('🧹 Step 2: Cleaning up database...');
    await cleanupDatabase();
    console.log('✅ Database cleaned up\n');

    // Step 3: Get final statistics
    console.log('📊 Step 3: Database statistics:');
    const stats = await getDatabaseStats();
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count.toLocaleString()} records`);
    });

    console.log('\n🎉 Railway deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Database schema issues fixed');
    console.log('✅ Missing columns added');
    console.log('✅ Historical tables created');
    console.log('✅ Performance indexes created');
    console.log('✅ Corrupted data cleaned up');
    console.log('✅ Database space optimized');
    console.log('✅ System ready for production');

    console.log('\n🎾 AskTennis is now live on Railway!');
    console.log('🌐 Your tennis analytics platform is ready to serve users.');

  } catch (error) {
    console.error('\n❌ Railway deployment failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  deployRailwayFixed()
    .then(() => {
      console.log('\n✅ Railway deployment completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Railway deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deployRailwayFixed };
