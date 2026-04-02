const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple storage
const users = [];

// === SIMPLE ROUTES ===

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', async (req, res) => {
  console.log('Register hit');
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    // Check if exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User exists' });
    }
    
    // Create user
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: users.length + 1, email, password: hashed, name: fullName || email.split('@')[0] };
    users.push(user);
    
    // Create token
    const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '7d' });
    
    res.json({ success: true, token, user: { id: user.id, email, fullName: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  console.log('Login hit');
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid' });
    
    const token = jwt.sign({ userId: user.id }, 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email, fullName: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});