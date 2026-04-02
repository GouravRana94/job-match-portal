const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

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
  console.log('Register BODY:', req.body);

  try {
    const { email, password, fullName } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = {
      id: users.length + 1,
      email,
      password: hashed,
      name: fullName || email.split('@')[0]
    };

    users.push(user);

    const token = jwt.sign(
      { userId: user.id },
      'my_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email, fullName: user.name }
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log('Login BODY:', req.body);

  try {
    const { email, password } = req.body || {};

    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id },
      'my_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email, fullName: user.name }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: err.message });
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});