const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testJobId = '';
let testApplicationId = '';

async function testApplicationRoutes() {
  console.log('🧪 Testing Application Routes\n');
  
  try {
    // 1. Login first
    console.log('1. Logging in...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: '123456'
    });
    authToken = login.data.token;
    console.log('✅ Login successful\n');
    
    // 2. Get jobs to apply
    console.log('2. Fetching available jobs...');
    const jobs = await axios.get(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (jobs.data.jobs && jobs.data.jobs.length > 0) {
      testJobId = jobs.data.jobs[0].id;
      console.log(`✅ Found job ID: ${testJobId}\n`);
    } else {
      console.log('⚠️ No jobs found to apply\n');
      return;
    }
    
    // 3. Apply for a job
    console.log('3. Applying for job...');
    const application = await axios.post(`${BASE_URL}/applications`, 
      { job_id: testJobId, notes: 'I am very interested in this position!' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    testApplicationId = application.data.application.id;
    console.log(`✅ Application submitted! ID: ${testApplicationId}\n`);
    
    // 4. Get all applications
    console.log('4. Fetching all applications...');
    const applications = await axios.get(`${BASE_URL}/applications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Found ${applications.data.total} applications\n`);
    
    // 5. Get specific application
    console.log('5. Fetching specific application...');
    const singleApp = await axios.get(`${BASE_URL}/applications/${testApplicationId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Application details: Status - ${singleApp.data.status}\n`);
    
    // 6. Get dashboard stats
    console.log('6. Fetching dashboard statistics...');
    const stats = await axios.get(`${BASE_URL}/applications/stats/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`✅ Stats: Total applications - ${stats.data.total_applications}`);
    console.log(`   Response rate - ${stats.data.response_rate}%\n`);
    
    // 7. Test withdraw (optional)
    console.log('7. Testing withdraw...');
    try {
      const withdraw = await axios.put(`${BASE_URL}/applications/${testApplicationId}/withdraw`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log(`✅ Application withdrawn: ${withdraw.data.message}\n`);
    } catch (error) {
      console.log('⚠️ Could not withdraw (might already be processed)\n');
    }
    
    console.log('🎉 All application route tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testApplicationRoutes();