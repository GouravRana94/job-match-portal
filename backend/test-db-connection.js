const { Pool } = require('pg');
require('dotenv').config();

// Test different connection configurations
const configs = [
  {
    name: 'Using jobmatch_user',
    config: {
      user: 'jobmatch_user',
      password: 'jobmatch123',
      host: 'localhost',
      database: 'jobmatch',
      port: 5432,
    }
  },
  {
    name: 'Using postgres user',
    config: {
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      database: 'jobmatch',
      port: 5432,
    }
  },
  {
    name: 'Using postgres with empty password',
    config: {
      user: 'postgres',
      password: '',
      host: 'localhost',
      database: 'jobmatch',
      port: 5432,
    }
  }
];

async function testConnection(configInfo) {
  console.log(`\n📡 Testing: ${configInfo.name}`);
  console.log(`   User: ${configInfo.config.user}`);
  console.log(`   Database: ${configInfo.config.database}`);
  
  const pool = new Pool(configInfo.config);
  
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_user as user, current_database() as database');
    console.log(`✅ Connection successful!`);
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   User: ${result.rows[0].user}`);
    console.log(`   Database: ${result.rows[0].database}`);
    
    // Test creating a simple table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS connection_test (
        id SERIAL PRIMARY KEY,
        test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`   ✅ Can create tables`);
    
    await pool.query(`DROP TABLE connection_test`);
    console.log(`   ✅ Can drop tables`);
    
    return true;
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🧪 Testing PostgreSQL Connections\n');
  console.log('=' .repeat(50));
  
  let success = false;
  
  for (const config of configs) {
    const result = await testConnection(config);
    if (result) {
      success = true;
      console.log(`\n✅ Using configuration: ${config.name}`);
      console.log('   Update your .env file with:');
      console.log(`   DB_USER=${config.config.user}`);
      console.log(`   DB_PASSWORD=${config.config.password}`);
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ No working configuration found!');
    console.log('\nPlease check:');
    console.log('1. Is PostgreSQL installed?');
    console.log('2. Is PostgreSQL service running?');
    console.log('3. What is your PostgreSQL password?');
    console.log('\nTo check PostgreSQL status:');
    console.log('  Windows: Get-Service postgresql*');
    console.log('  Mac: brew services list | grep postgres');
    console.log('  Linux: sudo systemctl status postgresql');
  }
}

main();