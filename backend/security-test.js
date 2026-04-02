const axios = require('axios');

async function securityTest() {
  console.log('🔒 Security Testing\n');
  
  const tests = [
    {
      name: 'SQL Injection',
      payload: { email: "' OR '1'='1", password: 'test' },
      endpoint: '/api/auth/login'
    },
    {
      name: 'XSS Attack',
      payload: { fullName: '<script>alert("XSS")</script>' },
      endpoint: '/api/auth/register'
    },
    {
      name: 'Invalid Token',
      payload: {},
      headers: { Authorization: 'Bearer invalid.token.here' },
      endpoint: '/api/profile'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const response = await axios.post(`http://localhost:5000${test.endpoint}`, test.payload, {
        headers: test.headers || {}
      });
      console.log(`⚠️ Potential vulnerability in ${test.name}`);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.log(`✅ ${test.name}: Properly rejected`);
      } else {
        console.log(`⚠️ ${test.name}: Unexpected response ${error.response?.status}`);
      }
    }
  }
}

securityTest();