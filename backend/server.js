const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// 🔥 Deployment marker (VERY IMPORTANT)
console.log("🔥 STANDALONE SERVER ACTIVE - NO DB 🔥");

app.use(cors());
app.use(express.json());

// In-memory store
const users = [];

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Job Match API is running!', status: 'ok' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register BODY:', req.body);

    if (!req.body) {
      return res.status(400).json({ error: 'Request body missing' });
    }

    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name: fullName || email.split('@')[0]
    };

    users.push(user);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'my_secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name
      }
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login BODY:', req.body);

    if (!req.body) {
      return res.status(400).json({ error: 'Request body missing' });
    }

    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'my_secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name
      }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
});

// Jobs
app.get('/api/jobs', (req, res) => {
  const jobs = [
    { id: 1, title: "React Developer", company: "TechCorp", location: "Remote" },
    { id: 2, title: "Python Developer", company: "DataSys", location: "Remote" }
  ];
  res.json({ jobs });
});

// 404 handler (important)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (important)
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});