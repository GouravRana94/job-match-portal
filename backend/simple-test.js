const axios = require('axios');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'jobmatch',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');
  
  try {
    // Clear existing test data
    await pool.query('DELETE FROM applications');
    await pool.query('DELETE FROM job_matches');
    await pool.query('DELETE FROM job_seekers');
    await pool.query('DELETE FROM jobs');
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@example.com']);
    
    console.log('✅ Cleared existing test data');
    
    // Create test user with proper password hash
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name`,
      ['test@example.com', hashedPassword, 'Test User', 'seeker']
    );
    
    const userId = userResult.rows[0].id;
    console.log('✅ Created test user:', userResult.rows[0]);
    
    // Create job seeker profile
    const seekerResult = await pool.query(
      `INSERT INTO job_seekers (user_id, skills, experience_years, education, resume_text) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [userId, 
       ['JavaScript', 'React', 'Node.js', 'Python'], 
       3.5, 
       'BS Computer Science',
       'Experienced full-stack developer with expertise in MERN stack']
    );
    
    console.log('✅ Created job seeker profile ID:', seekerResult.rows[0].id);
    
    // Create test employer
    const employerResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['employer@example.com', hashedPassword, 'Test Employer', 'employer']
    );
    
    const employerId = employerResult.rows[0].id;
    console.log('✅ Created test employer ID:', employerId);
    
    // Create test jobs
    const jobs = [
      ['React Developer', 'TechCorp', 'Looking for React developer', 
       ['React', 'JavaScript', 'Redux'], 'Remote', '$80k-$100k', 'Full-time'],
      ['Python Developer', 'DataCorp', 'Looking for Python developer', 
       ['Python', 'Django', 'PostgreSQL'], 'New York', '$90k-$110k', 'Full-time'],
      ['Full Stack Developer', 'Startup Inc', 'Looking for full stack developer', 
       ['React', 'Node.js', 'MongoDB'], 'Remote', '$85k-$105k', 'Full-time']
    ];
    
    for (const job of jobs) {
      await pool.query(
        `INSERT INTO jobs (title, company, description, requirements, location, salary_range, employment_type, posted_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [...job, employerId]
      );
    }
    
    console.log('✅ Created 3 test jobs');
    
    // Get a job ID for testing
    const jobResult = await pool.query('SELECT id FROM jobs LIMIT 1');
    const jobId = jobResult.rows[0].id;
    console.log('✅ Test job ID:', jobId);
    
    console.log('\n🎉 Test data setup complete!');
    return { userId, employerId, jobId, seekerId: seekerResult.rows[0].id };
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

async function testAPI() {
  console.log('🧪 Testing Job Match Portal API\n');
  
  try {
    // First, setup test data
    const testData = await setupTestData();
    
    const BASE_URL = 'http://localhost:5000/api';
    
    // 1. Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', health.data);
    
    // 2. Test login
    console.log('\n2. Testing login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: '123456'
    });
    
    const authToken = login.data.token;
    console.log('✅ Login successful');
    console.log('   User:', login.data.user);
    
    // 3. Test get profile
    console.log('\n3. Testing get profile...');
    const profile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile fetched successfully');
    
    // 4. Test get jobs
    console.log('\n4. Testing get jobs...');
    const jobs = await axios.get(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${jobs.data.jobs.length} jobs`);
    
    // 5. Test apply for job
    console.log('\n5. Testing apply for job...');
    const application = await axios.post(`${BASE_URL}/applications`,
      { job_id: testData.jobId, notes: 'I am very interested in this position!' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ Application submitted successfully');
    console.log('   Application ID:', application.data.application.id);
    
    // 6. Test get applications
    console.log('\n6. Testing get applications...');
    const applications = await axios.get(`${BASE_URL}/applications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${applications.data.total} applications`);
    
    // 7. Test dashboard stats
    console.log('\n7. Testing dashboard stats...');
    const stats = await axios.get(`${BASE_URL}/applications/stats/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Dashboard stats fetched');
    console.log('   Total applications:', stats.data.total_applications);
    console.log('   Response rate:', stats.data.response_rate + '%');
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response from server. Is the backend running?');
      console.error('   Make sure to run: npm run dev in the backend directory');
    } else {
      console.error('   Error:', error.message);
    }
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the test
testAPI();