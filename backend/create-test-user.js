const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function createTestUser() {
  console.log('🔧 Creating test user...\n');
  
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', dbTest.rows[0].now);
    
    // Clean up existing test user with proper order (handle foreign keys)
    console.log('Cleaning up existing test data...');
    
    // First, get the user ID if exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    
    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id;
      
      // Delete in correct order to respect foreign keys
      await pool.query('DELETE FROM job_matches WHERE job_seeker_id IN (SELECT id FROM job_seekers WHERE user_id = $1)', [userId]);
      await pool.query('DELETE FROM applications WHERE job_seeker_id IN (SELECT id FROM job_seekers WHERE user_id = $1)', [userId]);
      await pool.query('DELETE FROM job_seekers WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM jobs WHERE posted_by = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      
      console.log('✅ Cleaned up existing test user and related data');
    } else {
      console.log('✅ No existing test user found');
    }
    
    // Create password hash
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, user_type`,
      ['test@example.com', hashedPassword, 'Test User', 'seeker']
    );
    
    const user = userResult.rows[0];
    console.log('✅ Test user created:', user);
    
    // Create job seeker profile
    const seekerResult = await pool.query(
      `INSERT INTO job_seekers (user_id, skills, experience_years, education, resume_text, current_title)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [user.id, 
       ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL'],
       3.5,
       'BS Computer Science',
       'Experienced full-stack developer with 3+ years of experience in MERN stack.',
       'Full Stack Developer']
    );
    
    console.log('✅ Job seeker profile created, ID:', seekerResult.rows[0].id);
    
    // Create test jobs
    const jobs = [
      ['Senior React Developer', 'TechCorp', 
       'Looking for an experienced React developer to lead our frontend team.',
       ['React', 'JavaScript', 'Redux', 'TypeScript'],
       'Remote', '$120,000 - $150,000', 'Full-time'],
      ['Python Backend Engineer', 'DataSys',
       'Build scalable backend services using Python and Django.',
       ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
       'Remote', '$100,000 - $130,000', 'Full-time'],
      ['Full Stack Developer', 'StartupInc',
       'Join our startup to build full-stack applications.',
       ['React', 'Node.js', 'MongoDB', 'Express'],
       'San Francisco, CA', '$90,000 - $120,000', 'Full-time']
    ];
    
    for (const job of jobs) {
      const jobResult = await pool.query(
        `INSERT INTO jobs (title, company, description, requirements, location, salary_range, employment_type, posted_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [...job, user.id, true]
      );
      console.log(`✅ Created job: ${job[0]} (ID: ${jobResult.rows[0].id})`);
    }
    
    console.log('\n🎉 Test setup complete!');
    console.log('\n📝 Test credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: 123456');
    console.log('   User ID:', user.id);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.code === '42P01') {
      console.error('   Tables not found! Run create_tables.sql first:');
      console.error('   psql -U jobmatch_user -d jobmatch -f backend/src/models/create_tables.sql');
    } else if (error.code === '23503') {
      console.error('   Foreign key constraint error. Tables might not be properly set up.');
      console.error('   Run the create_tables.sql script again.');
    }
  } finally {
    await pool.end();
  }
}

createTestUser();