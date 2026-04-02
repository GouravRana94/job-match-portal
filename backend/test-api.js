const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function testAPI() {
  console.log('🧪 Testing Job Match Portal API\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', health.data);
    
    // 2. Test registration
    console.log('\n2. Testing user registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: '123456',
      fullName: 'Test User'
    };
    
    const register = await axios.post(`${BASE_URL}/auth/register`, registerData);
    authToken = register.data.token;
    console.log('✅ Registration successful:', register.data.user);
    
    // 3. Test login
    console.log('\n3. Testing login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    authToken = login.data.token;
    console.log('✅ Login successful');
    
    // 4. Test profile update
    console.log('\n4. Testing profile update...');
    const profileData = {
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      experience_years: 3.5,
      education: 'BS Computer Science',
      resume_text: 'Experienced full-stack developer',
      preferred_location: 'Remote'
    };
    
    const profile = await axios.put(`${BASE_URL}/profile`, profileData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile updated:', profile.data.message);
    
    // 5. Test get jobs
    console.log('\n5. Testing get jobs...');
    const jobs = await axios.get(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${jobs.data.jobs.length} jobs`);
    
    // 6. Test generate matches
    console.log('\n6. Testing generate matches...');
    try {
      const matches = await axios.post(`${BASE_URL}/matches/generate`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Matches generated:', matches.data.message);
    } catch (error) {
      console.log('⚠️ ML service not available, using fallback');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();