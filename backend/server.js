const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory storage
const users = [];
const profiles = [];
const jobs = [
  { id: 1, title: "Senior React Developer", company: "TechCorp", location: "Remote", requirements: ["React", "JavaScript", "Redux"], salary_range: "$120k-$150k", is_active: true },
  { id: 2, title: "Python Backend Engineer", company: "DataSys", location: "Remote", requirements: ["Python", "Django", "PostgreSQL"], salary_range: "$100k-$130k", is_active: true },
  { id: 3, title: "Full Stack Developer", company: "StartupInc", location: "San Francisco", requirements: ["React", "Node.js", "MongoDB"], salary_range: "$90k-$120k", is_active: true },
  { id: 4, title: "DevOps Engineer", company: "CloudTech", location: "Remote", requirements: ["AWS", "Docker", "Kubernetes"], salary_range: "$130k-$160k", is_active: true },
  { id: 5, title: "ML Engineer", company: "AI Solutions", location: "Boston", requirements: ["Python", "TensorFlow", "PyTorch"], salary_range: "$140k-$180k", is_active: true }
];
const applications = [];

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ PUBLIC ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Job Match Portal API', version: '2.0', endpoints: ['/api/auth/register', '/api/auth/login', '/api/jobs', '/api/health'] });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register endpoint hit');
  try {
    const { email, password, fullName, userType = 'seeker' } = req.body;
    console.log('Register data:', { email, fullName, userType });
    
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
      password_hash: hashedPassword,
      full_name: fullName || email.split('@')[0],
      user_type: userType,
      created_at: new Date()
    };
    users.push(newUser);
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );
    
    console.log('✅ User registered:', email);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        userType: newUser.user_type
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login endpoint hit');
  try {
    const { email, password } = req.body;
    console.log('Login data:', { email });
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '7d' }
    );
    
    console.log('✅ User logged in:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.get('/api/auth/verify', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  res.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type
    }
  });
});

// ============ PROTECTED ROUTES ============

// Get profile
app.get('/api/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  const profile = profiles.find(p => p.user_id === req.user.id);
  res.json({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    user_type: user.user_type,
    profile: profile || null
  });
});

// Update profile
app.put('/api/profile', auth, (req, res) => {
  const { skills, experience_years, education, resume_text } = req.body;
  let profile = profiles.find(p => p.user_id === req.user.id);
  
  if (!profile) {
    profile = { id: profiles.length + 1, user_id: req.user.id };
    profiles.push(profile);
  }
  
  profile.skills = skills || [];
  profile.experience_years = experience_years || 0;
  profile.education = education || '';
  profile.resume_text = resume_text || '';
  
  res.json({ success: true, profile });
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

// Apply for job
app.post('/api/applications', auth, (req, res) => {
  const { job_id } = req.body;
  const profile = profiles.find(p => p.user_id === req.user.id);
  
  if (!profile) {
    return res.status(400).json({ error: 'Complete your profile first' });
  }
  
  const existing = applications.find(a => a.user_id === req.user.id && a.job_id === job_id);
  if (existing) {
    return res.status(400).json({ error: 'Already applied' });
  }
  
  const application = {
    id: applications.length + 1,
    user_id: req.user.id,
    job_id,
    status: 'pending',
    applied_date: new Date()
  };
  applications.push(application);
  
  res.status(201).json({ success: true, application });
});

// Get applications
app.get('/api/applications', auth, (req, res) => {
  const userApps = applications.filter(a => a.user_id === req.user.id);
  res.json({ applications: userApps });
});

// Dashboard stats
app.get('/api/profile/stats', auth, (req, res) => {
  const userApps = applications.filter(a => a.user_id === req.user.id);
  res.json({ total_applications: userApps.length });
});

// Top matches
app.get('/api/matches/top', auth, (req, res) => {
  const matches = jobs.map(j => ({ ...j, match_score: Math.floor(Math.random() * 40) + 60 }));
  res.json(matches.slice(0, 5));
});

// Generate matches
app.post('/api/matches/generate', auth, (req, res) => {
  const matches = jobs.map(j => ({ ...j, match_score: Math.floor(Math.random() * 40) + 60 }));
  res.json({ success: true, matches });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: https://job-match-portal-api.onrender.com/api/health`);
  console.log(`📍 Register: POST /api/auth/register`);
  console.log(`📍 Login: POST /api/auth/login`);
});