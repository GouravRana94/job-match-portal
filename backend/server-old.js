const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];
const jobs = [
  { id: 1, title: "React Developer", company: "TechCorp", location: "Remote", requirements: ["React", "JavaScript"], salary_range: "$80k-$100k", is_active: true },
  { id: 2, title: "Python Developer", company: "DataSys", location: "Remote", requirements: ["Python", "Django"], salary_range: "$90k-$110k", is_active: true },
  { id: 3, title: "Full Stack Developer", company: "StartupInc", location: "SF", requirements: ["React", "Node.js"], salary_range: "$100k-$130k", is_active: true }
];

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, 'my_secret_key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Job Match API', endpoints: ['POST /api/auth/register', 'POST /api/auth/login'] });
});

// REGISTER - This is the key endpoint
app.post('/api/auth/register', async (req, res) => {
  console.log('=== REGISTER REQUEST RECEIVED ===');
  console.log('Body:', req.body);
  
  try {
    const { email, password, fullName } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name: fullName || email.split('@')[0],
      created_at: new Date()
    };
    users.push(newUser);
    
    // Create token
    const token = jwt.sign({ userId: newUser.id }, 'my_secret_key', { expiresIn: '7d' });
    
    console.log('✅ User registered:', email);
    console.log('Total users:', users.length);
    
    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Body:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, 'my_secret_key', { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.get('/api/auth/verify', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.name
    }
  });
});

// Get jobs
app.get('/api/jobs', auth, (req, res) => {
  res.json({ jobs: jobs.filter(j => j.is_active) });
});

// Get single job
app.get('/api/jobs/:id', auth, (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  res.json({ job });
});

// Get profile
app.get('/api/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  res.json({
    id: user.id,
    email: user.email,
    full_name: user.name
  });
});

// Update profile
app.put('/api/profile', auth, (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
});

// Get applications
app.get('/api/applications', auth, (req, res) => {
  res.json({ applications: [] });
});

// Apply for job
app.post('/api/applications', auth, (req, res) => {
  res.json({ success: true, message: 'Application submitted' });
});

// Get stats
app.get('/api/profile/stats', auth, (req, res) => {
  res.json({ total_applications: 0, response_rate: 0 });
});

// Get top matches
app.get('/api/matches/top', auth, (req, res) => {
  const matches = jobs.map(j => ({
    job_id: j.id,
    title: j.title,
    company: j.company,
    match_score: Math.floor(Math.random() * 40) + 60
  }));
  res.json(matches);
});

// Generate matches
app.post('/api/matches/generate', auth, (req, res) => {
  const matches = jobs.map(j => ({
    job_id: j.id,
    title: j.title,
    company: j.company,
    match_score: Math.floor(Math.random() * 40) + 60
  }));
  res.json({ success: true, matches });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: https://job-match-portal-api.onrender.com/api/health`);
  console.log(`📍 Register: POST /api/auth/register`);
  console.log(`📍 Login: POST /api/auth/login`);
});