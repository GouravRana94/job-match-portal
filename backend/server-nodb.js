const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory storage (no database needed!)
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
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Job Match Portal API', version: '2.0' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, userType = 'seeker' } = req.body;
    console.log('📝 Registration attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      email,
      password_hash: hashedPassword,
      full_name: fullName,
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', email);
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify token
app.get('/api/auth/verify', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
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

// Get profile
app.get('/api/profile', auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  let profile = profiles.find(p => p.user_id === req.user.id);
  
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
  const { skills, experience_years, education, resume_text, current_title, preferred_location } = req.body;
  
  let profile = profiles.find(p => p.user_id === req.user.id);
  if (!profile) {
    profile = { id: profiles.length + 1, user_id: req.user.id };
    profiles.push(profile);
  }
  
  profile.skills = skills || [];
  profile.experience_years = experience_years || 0;
  profile.education = education || '';
  profile.resume_text = resume_text || '';
  profile.current_title = current_title || '';
  profile.preferred_location = preferred_location || '';
  profile.updated_at = new Date();
  
  res.json({ success: true, message: 'Profile updated', profile });
});

// Get all jobs
app.get('/api/jobs', auth, (req, res) => {
  const { title, location } = req.query;
  let filteredJobs = jobs.filter(j => j.is_active);
  
  if (title) {
    filteredJobs = filteredJobs.filter(j => j.title.toLowerCase().includes(title.toLowerCase()));
  }
  if (location) {
    filteredJobs = filteredJobs.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  res.json({ jobs: filteredJobs });
});

// Get single job
app.get('/api/jobs/:id', auth, (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json({ job });
});

// Apply for job
app.post('/api/applications', auth, (req, res) => {
  const { job_id, notes } = req.body;
  const profile = profiles.find(p => p.user_id === req.user.id);
  
  if (!profile) {
    return res.status(400).json({ message: 'Please complete your profile first' });
  }
  
  const existing = applications.find(a => a.user_id === req.user.id && a.job_id === job_id);
  if (existing) {
    return res.status(400).json({ message: 'Already applied for this job' });
  }
  
  const application = {
    id: applications.length + 1,
    user_id: req.user.id,
    job_id,
    notes,
    status: 'pending',
    applied_date: new Date()
  };
  applications.push(application);
  
  res.status(201).json({ success: true, message: 'Application submitted', application });
});

// Get user applications
app.get('/api/applications', auth, (req, res) => {
  const userApps = applications.filter(a => a.user_id === req.user.id);
  const appsWithJobs = userApps.map(app => ({
    ...app,
    title: jobs.find(j => j.id === app.job_id)?.title,
    company: jobs.find(j => j.id === app.job_id)?.company
  }));
  
  res.json({ applications: appsWithJobs, total: appsWithJobs.length });
});

// Get dashboard stats
app.get('/api/profile/stats', auth, (req, res) => {
  const userApps = applications.filter(a => a.user_id === req.user.id);
  res.json({
    total_applications: userApps.length,
    response_rate: 0,
    active_applications: userApps.filter(a => a.status === 'pending').length
  });
});

// Get top matches
app.get('/api/matches/top', auth, (req, res) => {
  const profile = profiles.find(p => p.user_id === req.user.id);
  if (!profile) {
    return res.json([]);
  }
  
  const matches = jobs.map(job => {
    let matchScore = 50;
    if (profile.skills) {
      const matchingSkills = profile.skills.filter(s => 
        job.requirements.some(r => r.toLowerCase().includes(s.toLowerCase()))
      );
      matchScore = 50 + Math.min(45, (matchingSkills.length / job.requirements.length) * 45);
    }
    return {
      job_id: job.id,
      title: job.title,
      company: job.company,
      match_score: Math.round(matchScore),
      location: job.location
    };
  }).sort((a, b) => b.match_score - a.match_score).slice(0, 5);
  
  res.json(matches);
});

// Generate matches
app.post('/api/matches/generate', auth, async (req, res) => {
  const profile = profiles.find(p => p.user_id === req.user.id);
  if (!profile) {
    return res.status(400).json({ message: 'Complete your profile first' });
  }
  
  const matches = jobs.map(job => {
    let matchScore = 50;
    if (profile.skills) {
      const matchingSkills = profile.skills.filter(s => 
        job.requirements.some(r => r.toLowerCase().includes(s.toLowerCase()))
      );
      matchScore = 50 + Math.min(45, (matchingSkills.length / job.requirements.length) * 45);
    }
    return {
      job_id: job.id,
      title: job.title,
      company: job.company,
      match_score: Math.round(matchScore),
      match_details: {
        matching_skills: profile.skills?.filter(s => 
          job.requirements.some(r => r.toLowerCase().includes(s.toLowerCase()))
        ) || [],
        match_level: matchScore >= 80 ? 'Excellent' : matchScore >= 60 ? 'Good' : 'Potential'
      }
    };
  }).sort((a, b) => b.match_score - a.match_score);
  
  res.json({ success: true, matches, total: matches.length });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 API URL: https://job-match-portal-api.onrender.com`);
});