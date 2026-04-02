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

async function testRegistration() {
  console.log('🧪 Testing User Registration\n');
  
  try {
    // First, test database connection
    console.log('1. Testing database connection...');
    const dbTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', dbTest.rows[0].now);
    
    // Clean up any existing test user
    console.log('\n2. Cleaning up existing test user...');
    await pool.query('DELETE FROM users WHERE email = $1', ['register-test@example.com']);
    console.log('✅ Cleanup complete');
    
    // Test registration via API
    console.log('\n3. Testing registration API...');
    const registerData = {
      email: 'register-test@example.com',
      password: '123456',
      fullName: 'Register Test User'
    };
    
    const register = await axios.post('http://localhost:5000/api/auth/register', registerData);
    console.log('✅ Registration successful!');
    console.log('   User:', register.data.user);
    console.log('   Token received:', register.data.token.substring(0, 50) + '...');
    
    // Verify user in database
    console.log('\n4. Verifying user in database...');
    const userCheck = await pool.query(
      'SELECT id, email, full_name, user_type FROM users WHERE email = $1',
      ['register-test@example.com']
    );
    
    if (userCheck.rows.length > 0) {
      console.log('✅ User found in database:', userCheck.rows[0]);
    } else {
      console.log('❌ User not found in database!');
    }
    
    // Test login with new user
    console.log('\n5. Testing login with new user...');
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'register-test@example.com',
      password: '123456'
    });
    console.log('✅ Login successful!');
    console.log('   User:', login.data.user);
    
    console.log('\n🎉 All tests passed! Your auth system is working!');
    
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

// Run the test
testRegistration();
