const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function testComplete() {
  console.log('🧪 Complete API Testing\n');
  console.log('=' .repeat(50));
  
  let authToken = '';
  let testJobId = '';
  
  try {
    // 1. Test registration
    console.log('\n1. Testing registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: '123456',
      fullName: 'Test User',
      userType: 'seeker'
    };
    
    const register = await axios.post('http://localhost:5000/api/auth/register', registerData);
    authToken = register.data.token;
    console.log('✅ Registration successful');
    console.log('   User ID:', register.data.user.id);
    
    // 2. Test login
    console.log('\n2. Testing login...');
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: registerData.email,
      password: '123456'
    });
    console.log('✅ Login successful');
    
    // 3. Test get profile
    console.log('\n3. Testing get profile...');
    const profile = await axios.get('http://localhost:5000/api/profile', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile fetched');
    console.log('   User:', profile.data.full_name);
    
    // 4. Test update profile
    console.log('\n4. Testing update profile...');
    const profileData = {
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      experience_years: 3.5,
      education: 'BS Computer Science',
      resume_text: 'Experienced full-stack developer',
      current_title: 'Full Stack Developer'
    };
    
    const updatedProfile = await axios.put('http://localhost:5000/api/profile', profileData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated');
    console.log('   Skills:', updatedProfile.data.profile.skills.length);
    
    // 5. Test get jobs
    console.log('\n5. Testing get jobs...');
    const jobs = await axios.get('http://localhost:5000/api/jobs', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${jobs.data.jobs?.length || 0} jobs`);
    
    if (jobs.data.jobs && jobs.data.jobs.length > 0) {
      testJobId = jobs.data.jobs[0].id;
      console.log('   Sample job:', jobs.data.jobs[0].title);
    }
    
    // 6. Test apply for job
    if (testJobId) {
      console.log('\n6. Testing apply for job...');
      const application = await axios.post('http://localhost:5000/api/applications',
        { job_id: testJobId, notes: 'I am very interested in this position!' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log('✅ Application submitted');
      console.log('   Application ID:', application.data.application.id);
    }
    
    // 7. Test get applications
    console.log('\n7. Testing get applications...');
    const applications = await axios.get('http://localhost:5000/api/applications', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${applications.data.total || 0} applications`);
    
    // 8. Test dashboard stats
    console.log('\n8. Testing dashboard stats...');
    const stats = await axios.get('http://localhost:5000/api/profile/stats', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Stats fetched');
    console.log('   Total applications:', stats.data.total_applications || 0);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   URL:', error.config?.url);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response from server. Make sure backend is running: npm run dev');
    } else {
      console.error('   Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

testComplete();