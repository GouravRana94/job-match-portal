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

async function testAuth() {
  console.log('🧪 Testing Authentication\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const dbTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', dbTest.rows[0].now);
    
    // Test registration
    console.log('\n2. Testing registration...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: '123456',
      fullName: 'Test User',
      userType: 'seeker'
    };
    
    const register = await axios.post('http://localhost:5000/api/auth/register', registerData);
    console.log('✅ Registration successful!');
    console.log('   User:', register.data.user);
    const token = register.data.token;
    
    // Test login
    console.log('\n3. Testing login...');
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: registerData.email,
      password: '123456'
    });
    console.log('✅ Login successful!');
    console.log('   User:', login.data.user);
    
    // Test token verification
    console.log('\n4. Testing token verification...');
    const verify = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token verified!');
    console.log('   Valid:', verify.data.valid);
    console.log('   User:', verify.data.user);
    
    // Test protected route
    console.log('\n5. Testing protected route...');
    const profile = await axios.get('http://localhost:5000/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Protected route accessible!');
    console.log('   Profile:', profile.data);
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
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

testAuth();