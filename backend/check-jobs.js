const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function checkJobs() {
  console.log('🔍 Checking jobs in database...\n');
  
  try {
    // Check if jobs table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'jobs'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Jobs table does not exist!');
      console.log('   Please run the create_tables.sql script.');
      return;
    }
    
    console.log('✅ Jobs table exists');
    
    // Count total jobs
    const countResult = await pool.query('SELECT COUNT(*) FROM jobs');
    console.log(`📊 Total jobs in database: ${countResult.rows[0].count}`);
    
    // Get all jobs
    const jobsResult = await pool.query(`
      SELECT id, title, company, location, is_active 
      FROM jobs 
      ORDER BY id
    `);
    
    if (jobsResult.rows.length === 0) {
      console.log('\n⚠️ No jobs found in database!');
      console.log('   Creating sample jobs...');
      
      // Create a test user if not exists
      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = 'test@example.com'"
      );
      
      let userId;
      if (userResult.rows.length === 0) {
        const newUser = await pool.query(
          `INSERT INTO users (email, password_hash, full_name, user_type) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id`,
          ['test@example.com', 'dummy_hash', 'Test User', 'seeker']
        );
        userId = newUser.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }
      
      // Insert sample jobs
      const sampleJobs = [
        ['Senior React Developer', 'TechCorp', 'Looking for React developer', 
         ['React', 'JavaScript', 'Redux'], 'Remote', '$120k-$150k', 'Full-time'],
        ['Python Backend Engineer', 'DataSys', 'Looking for Python developer', 
         ['Python', 'Django', 'PostgreSQL'], 'Remote', '$100k-$130k', 'Full-time'],
        ['Full Stack Developer', 'StartupInc', 'Looking for full stack developer', 
         ['React', 'Node.js', 'MongoDB'], 'San Francisco', '$90k-$120k', 'Full-time']
      ];
      
      for (const job of sampleJobs) {
        await pool.query(
          `INSERT INTO jobs (title, company, description, requirements, location, salary_range, employment_type, posted_by, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [...job, userId, true]
        );
      }
      
      console.log('✅ Created 3 sample jobs');
      
      // Get the newly created jobs
      const newJobsResult = await pool.query(`
        SELECT id, title, company, location 
        FROM jobs 
        WHERE is_active = true
      `);
      
      console.log('\n📋 Available jobs:');
      newJobsResult.rows.forEach(job => {
        console.log(`   ID: ${job.id} | ${job.title} at ${job.company} (${job.location})`);
      });
      
    } else {
      console.log('\n📋 Available jobs:');
      jobsResult.rows.forEach(job => {
        console.log(`   ID: ${job.id} | ${job.title} at ${job.company} (${job.location}) - Active: ${job.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkJobs();