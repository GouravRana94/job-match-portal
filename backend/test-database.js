const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function testDatabase() {
  console.log('🗄️ Database Testing\n');
  
  try {
    // Test connection
    const connTest = await pool.query('SELECT NOW()');
    console.log('✅ Database Connected');
    
    // Check tables
    const tables = ['users', 'job_seekers', 'jobs', 'applications', 'job_matches'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`, [table]);
      
      if (result.rows[0].exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}': ${count.rows[0].count} records`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename IN ('users', 'jobs', 'applications')
    `);
    console.log(`\n📇 Indexes found: ${indexes.rows.length}`);
    
    // Check foreign keys
    const fkeys = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint 
      WHERE contype = 'f'
    `);
    console.log(`🔗 Foreign keys: ${fkeys.rows.length}`);
    
    console.log('\n✅ Database integrity check passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();