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

async function testAuthMiddleware() {
  console.log('🧪 Testing Auth Middleware\n');
  
  const BASE_URL = 'http://localhost:5000/api';
  let authToken = '';
  
  try {
    // 1. Create a test user
    console.log('1. Creating test user...');
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Delete existing test user
    await pool.query('DELETE FROM users WHERE email = $1', ['auth-test@example.com']);
    
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name`,
      ['auth-test@example.com', hashedPassword, 'Auth Test User', 'seeker']
    );
    
    console.log('✅ Test user created:', userResult.rows[0].email);
    
    // 2. Test login
    console.log('\n2. Testing login...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'auth-test@example.com',
      password: '123456'
    });
    
    authToken = login.data.token;
    console.log('✅ Login successful');
    console.log('   Token received:', authToken.substring(0, 50) + '...');
    
    // 3. Test protected route with valid token
    console.log('\n3. Testing protected route with valid token...');
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Protected route accessible');
      console.log('   Response status:', response.status);
    } catch (error) {
      console.log('❌ Failed to access protected route:', error.response?.data);
    }
    
    // 4. Test protected route without token
    console.log('\n4. Testing protected route without token...');
    try {
      const response = await axios.get(`${BASE_URL}/profile`);
      console.log('⚠️ Protected route should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly blocked - No token provided');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // 5. Test protected route with invalid token
    console.log('\n5. Testing protected route with invalid token...');
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: 'Bearer invalid.token.here' }
      });
      console.log('⚠️ Protected route should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly blocked - Invalid token');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // 6. Test token verification endpoint
    console.log('\n6. Testing token verification endpoint...');
    const verify = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Token verified successfully');
    console.log('   User:', verify.data.user);
    
    console.log('\n🎉 All auth tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response from server. Is the backend running?');
    } else {
      console.error('   Error:', error.message);
    }
  } finally {
    await pool.end();
  }
}

// Run the test
testAuthMiddleware();