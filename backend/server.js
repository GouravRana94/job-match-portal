const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Simple in-memory storage (no database!)
const users = [];

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Job Match API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register - This is what you need
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register request:', req.body);
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name: fullName || email.split('@')[0]
    };
    users.push(newUser);
    
    const token = jwt.sign({ userId: newUser.id }, 'my_secret_key', { expiresIn: '7d' });
    
    console.log('✅ User registered:', email);
    res.json({
      success: true,
      token,
      user: { id: newUser.id, email, fullName: newUser.name }
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login request:', req.body.email);
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, 'my_secret_key', { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user.id, email, fullName: user.name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simple jobs endpoint
app.get('/api/jobs', (req, res) => {
  const jobs = [
    { id: 1, title: "React Developer", company: "TechCorp", location: "Remote", requirements: ["React", "JS"], salary: "$80k" },
    { id: 2, title: "Python Developer", company: "DataSys", location: "Remote", requirements: ["Python", "Django"], salary: "$90k" }
  ];
  res.json({ jobs });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: https://job-match-portal-api.onrender.com/api/health`);
  console.log(`📍 Register: POST /api/auth/register`);
});