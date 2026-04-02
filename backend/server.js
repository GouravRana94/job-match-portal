const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// Simple middleware
app.use(cors());
app.use(express.json());

// Simple in-memory database
const users = [];
const jobs = [
  { id: 1, title: "React Developer", company: "TechCorp", location: "Remote", requirements: ["React", "JS"], salary: "$80k" },
  { id: 2, title: "Python Developer", company: "DataSys", location: "Remote", requirements: ["Python", "Django"], salary: "$90k" },
  { id: 3, title: "Full Stack Developer", company: "StartupInc", location: "SF", requirements: ["React", "Node"], salary: "$100k" }
];

// Simple auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, 'mysecret');
    req.userId = decoded.userId;
    next();
  } catch(e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Health check (working)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Root (working)
app.get('/', (req, res) => {
  res.json({ message: 'Job Match API is live!', endpoints: ['POST /api/auth/register', 'POST /api/auth/login'] });
});

// REGISTER - This is what you need
app.post('/api/auth/register', async (req, res) => {
  console.log('Register request received:', req.body);
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name: fullName || email.split('@')[0]
    };
    users.push(newUser);
    
    // Create token
    const token = jwt.sign({ userId: newUser.id }, 'mysecret', { expiresIn: '7d' });
    
    console.log('User registered:', email);
    res.json({ 
      success: true, 
      token, 
      user: { id: newUser.id, email, name: newUser.name } 
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  console.log('Login request received:', req.body.email);
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id }, 'mysecret', { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, email, name: user.name } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token
app.get('/api/auth/verify', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  res.json({ valid: true, user: { id: user.id, email: user.email, name: user.name } });
});

// Get jobs
app.get('/api/jobs', auth, (req, res) => {
  res.json({ jobs });
});

// Get profile
app.get('/api/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  res.json({ id: user.id, email: user.email, full_name: user.name });
});

// Update profile
app.put('/api/profile', auth, (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
});

// Applications
app.get('/api/applications', auth, (req, res) => {
  res.json({ applications: [] });
});

app.post('/api/applications', auth, (req, res) => {
  res.json({ success: true, message: 'Applied!' });
});

// Matches
app.get('/api/matches/top', auth, (req, res) => {
  const matches = jobs.map(j => ({ ...j, match_score: Math.floor(Math.random() * 40) + 60 }));
  res.json(matches);
});

app.post('/api/matches/generate', auth, (req, res) => {
  const matches = jobs.map(j => ({ ...j, match_score: Math.floor(Math.random() * 40) + 60 }));
  res.json({ success: true, matches });
});

// Dashboard stats
app.get('/api/profile/stats', auth, (req, res) => {
  res.json({ total_applications: 0, response_rate: 0 });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: https://job-match-portal-api.onrender.com/api/health`);
  console.log(`📍 Register: POST to /api/auth/register`);
});