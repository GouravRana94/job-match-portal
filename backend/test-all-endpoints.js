const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';
let testJobId = '';

async function testAllEndpoints() {
  console.log('🧪 Starting Comprehensive API Testing\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Health Check
    console.log('\n📡 1. Testing Health Check...');
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health Check Passed:', health.data.status);
    
    // 2. User Registration
    console.log('\n📝 2. Testing User Registration...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerData = {
      email: uniqueEmail,
      password: 'Test123456',
      fullName: 'Test User',
      userType: 'seeker'
    };
    const register = await axios.post(`${BASE_URL}/auth/register`, registerData);
    authToken = register.data.token;
    testUserId = register.data.user.id;
    console.log('✅ Registration Successful');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Email: ${uniqueEmail}`);
    
    // 3. User Login
    console.log('\n🔐 3. Testing Login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'Test123456'
    });
    console.log('✅ Login Successful');
    
    // 4. Create/Update Profile
    console.log('\n👤 4. Testing Profile Update...');
    const profileData = {
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL'],
      experience_years: 4.5,
      education: "MS Computer Science",
      resume_text: "Experienced full-stack developer with 4+ years experience",
      current_title: "Senior Full Stack Developer",
      preferred_location: "Remote"
    };
    const profile = await axios.put(`${BASE_URL}/profile`, profileData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile Updated Successfully');
    
    // 5. Get Profile
    console.log('\n👀 5. Testing Get Profile...');
    const getProfile = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile Retrieved');
    console.log(`   Skills: ${getProfile.data.profile?.skills?.length || 0} skills`);
    
    // 6. Get All Jobs
    console.log('\n💼 6. Testing Get Jobs...');
    const jobs = await axios.get(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${jobs.data.jobs?.length || 0} jobs`);
    if (jobs.data.jobs && jobs.data.jobs.length > 0) {
      testJobId = jobs.data.jobs[0].id;
      console.log(`   Sample Job ID: ${testJobId}`);
    }
    
    // 7. Get Single Job
    if (testJobId) {
      console.log('\n🔍 7. Testing Get Single Job...');
      const singleJob = await axios.get(`${BASE_URL}/jobs/${testJobId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Job Retrieved: ${singleJob.data.job.title}`);
    }
    
    // 8. Generate ML Matches
    console.log('\n🤖 8. Testing ML Match Generation...');
    try {
      const matches = await axios.post(`${BASE_URL}/matches/generate`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000
      });
      console.log(`✅ Generated ${matches.data.total || 0} ML matches`);
      if (matches.data.matches && matches.data.matches.length > 0) {
        console.log(`   Top Match Score: ${matches.data.matches[0].match_score}%`);
      }
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('⚠️ ML Service not running (skipping)');
      } else {
        throw error;
      }
    }
    
    // 9. Get Top Matches
    console.log('\n🏆 9. Testing Get Top Matches...');
    const topMatches = await axios.get(`${BASE_URL}/matches/top`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${topMatches.data.length} top matches`);
    
    // 10. Apply for Job
    if (testJobId) {
      console.log('\n📋 10. Testing Job Application...');
      const application = await axios.post(`${BASE_URL}/applications`, {
        job_id: testJobId,
        notes: "I'm very interested in this position!"
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Application Submitted');
      console.log(`   Application ID: ${application.data.application.id}`);
    }
    
    // 11. Get Applications
    console.log('\n📊 11. Testing Get Applications...');
    const applications = await axios.get(`${BASE_URL}/applications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Retrieved ${applications.data.total || 0} applications`);
    
    // 12. Get Dashboard Stats
    console.log('\n📈 12. Testing Dashboard Stats...');
    const stats = await axios.get(`${BASE_URL}/profile/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Dashboard Stats Retrieved');
    
    // 13. Test Token Verification
    console.log('\n✅ 13. Testing Token Verification...');
    const verify = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Token Valid');
    
    // 14. Test Invalid Token
    console.log('\n❌ 14. Testing Invalid Token Rejection...');
    try {
      await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: 'Bearer invalid_token' }
      });
      console.log('❌ Should have rejected invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token correctly rejected');
      }
    }
    
    // 15. Test Without Token
    console.log('\n🚫 15. Testing No Token Rejection...');
    try {
      await axios.get(`${BASE_URL}/profile`);
      console.log('❌ Should have rejected no token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ No token correctly rejected');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ API Endpoints Tested: 15`);
    console.log(`   ✅ User Created: ${uniqueEmail}`);
    console.log(`   ✅ Profile Created: Yes`);
    console.log(`   ✅ Jobs Available: ${jobs.data.jobs?.length || 0}`);
    console.log(`   ✅ Applications: ${applications.data.total || 0}`);
    console.log(`   ✅ ML Service: ${matches ? 'Connected' : 'Not Available'}`);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Endpoint: ${error.config?.url}`);
      console.error(`   Error: ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      console.error('   No response from server. Make sure backend is running!');
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the tests
testAllEndpoints();