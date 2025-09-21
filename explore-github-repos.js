#!/usr/bin/env node

const axios = require('axios');

async function exploreGitHubRepositories() {
  console.log('🔍 Exploring GitHub Tennis Repositories');
  console.log('=====================================\n');

  const repositories = [
    {
      name: 'tennis_atp',
      url: 'https://api.github.com/repos/JeffSackmann/tennis_atp/contents',
      description: 'ATP tennis data'
    },
    {
      name: 'tennis_wta', 
      url: 'https://api.github.com/repos/JeffSackmann/tennis_wta/contents',
      description: 'WTA tennis data'
    },
    {
      name: 'tennis_MatchChartingProject',
      url: 'https://api.github.com/repos/JeffSackmann/tennis_MatchChartingProject/contents',
      description: 'Match charting data'
    },
    {
      name: 'tennis_slam_pointbypoint',
      url: 'https://api.github.com/repos/JeffSackmann/tennis_slam_pointbypoint/contents',
      description: 'Grand Slam point-by-point data'
    }
  ];

  for (const repo of repositories) {
    console.log(`\n📁 Repository: ${repo.name}`);
    console.log(`📝 Description: ${repo.description}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await axios.get(repo.url, {
        headers: {
          'User-Agent': 'AskTennis-Explorer/1.0.0',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      });

      const files = response.data;
      
      if (files && files.length > 0) {
        console.log(`✅ Found ${files.length} files/directories:`);
        
        // Group files by type
        const csvFiles = files.filter(f => f.name.endsWith('.csv'));
        const directories = files.filter(f => f.type === 'dir');
        const otherFiles = files.filter(f => !f.name.endsWith('.csv') && f.type === 'file');
        
        if (csvFiles.length > 0) {
          console.log(`\n📊 CSV Files (${csvFiles.length}):`);
          csvFiles.forEach(file => {
            console.log(`  - ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
          });
        }
        
        if (directories.length > 0) {
          console.log(`\n📁 Directories (${directories.length}):`);
          directories.forEach(dir => {
            console.log(`  - ${dir.name}/`);
          });
        }
        
        if (otherFiles.length > 0) {
          console.log(`\n📄 Other Files (${otherFiles.length}):`);
          otherFiles.forEach(file => {
            console.log(`  - ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
          });
        }
        
        // Look for ranking-related files
        const rankingFiles = files.filter(f => 
          f.name.toLowerCase().includes('rank') || 
          f.name.toLowerCase().includes('current')
        );
        
        if (rankingFiles.length > 0) {
          console.log(`\n🏆 Ranking-related files:`);
          rankingFiles.forEach(file => {
            console.log(`  - ${file.name}`);
          });
        }
        
        // Look for match-related files
        const matchFiles = files.filter(f => 
          f.name.toLowerCase().includes('match') || 
          f.name.toLowerCase().includes('result')
        );
        
        if (matchFiles.length > 0) {
          console.log(`\n🎾 Match-related files:`);
          matchFiles.forEach(file => {
            console.log(`  - ${file.name}`);
          });
        }
        
      } else {
        console.log('❌ No files found or empty repository');
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ HTTP ${error.response.status}: ${error.response.statusText}`);
        if (error.response.status === 404) {
          console.log('   Repository not found or private');
        } else if (error.response.status === 403) {
          console.log('   Rate limited or access forbidden');
        }
      } else if (error.code === 'ECONNABORTED') {
        console.log('❌ Request timeout');
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 Repository exploration completed!');
  console.log('\n📝 Summary:');
  console.log('- This script explores the actual file structure of GitHub repositories');
  console.log('- It helps identify what data is actually available');
  console.log('- Results can be used to update the data fetching logic');
  console.log('- Consider rate limiting when making multiple API calls');
}

// Run the exploration
if (require.main === module) {
  exploreGitHubRepositories()
    .then(() => {
      console.log('\n✅ Repository exploration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Exploration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { exploreGitHubRepositories };
