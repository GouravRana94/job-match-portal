const axios = require('axios');

async function testMatchEndpoint() {
  console.log('🧪 Testing /api/matches/generate endpoint\n');
  
  try {
    // First, login to get token
    console.log('1. Logging in...');
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: '123456'
    });
    
    const token = login.data.token;
    console.log('✅ Login successful');
    
    // Test generate matches endpoint
    console.log('\n2. Testing POST /api/matches/generate...');
    try {
      const response = await axios.post(
        'http://localhost:5000/api/matches/generate',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Matches generated successfully!');
      console.log('   Message:', response.data.message);
      console.log('   Total matches:', response.data.total);
      
      if (response.data.matches && response.data.matches.length > 0) {
        console.log('\n🏆 Top 3 Matches:');
        response.data.matches.slice(0, 3).forEach((match, idx) => {
          console.log(`\n   ${idx + 1}. ${match.title} at ${match.company}`);
          console.log(`      Match Score: ${match.match_score}%`);
          console.log(`      Level: ${match.match_details.match_level}`);
          console.log(`      Matching Skills: ${match.match_details.matching_skills.slice(0, 3).join(', ')}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to generate matches:');
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Message:', error.response.data.message);
        console.error('   Error:', error.response.data.error);
      } else {
        console.error('   Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
  }
}

testMatchEndpoint();