const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

console.log("🔥 DEV MODE: NO DB + NO AUTH 🔥");

app.use(cors());
app.use(express.json());

// 🔥 Fake user (bypass login)
app.use((req, res, next) => {
  req.user = { id: 1, email: "test@example.com" };
  next();
});

// ===================== AUTH ROUTES =====================
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  res.json({
    success: true,
    message: "User registered (mock)",
    user: { id: 1, email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;

  res.json({
    success: true,
    message: "Login success (mock)",
    token: "fake-jwt-token",
    user: { id: 1, email }
  });
});

// ===================== JOB ROUTES =====================
app.get('/api/jobs', (req, res) => {
  res.json({
    jobs: [
      { id: 1, title: "React Developer", company: "TechCorp" },
      { id: 2, title: "Python Developer", company: "DataSys" }
    ]
  });
});

// ===================== PROFILE =====================
app.get('/api/profile', (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: "Test User",
      email: req.user.email
    }
  });
});

// ===================== MATCHES =====================
app.get('/api/matches', (req, res) => {
  res.json({
    matches: [
      { jobId: 1, matchScore: 85 },
      { jobId: 2, matchScore: 78 }
    ]
  });
});

// ===================== APPLICATIONS =====================
app.get('/api/applications', (req, res) => {
  res.json({
    applications: [
      { id: 1, job: "React Dev", status: "Applied" }
    ]
  });
});

// ===================== HEALTH =====================
app.get('/api/health', (req, res) => {
  res.json({
    status: "Server running (no DB)",
    timestamp: new Date().toISOString()
  });
});

// ===================== ROOT =====================
app.get('/', (req, res) => {
  res.json({
    message: "Job Match API - DEV MODE",
    note: "No DB, no auth"
  });
});

// ===================== ERROR =====================
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: err.message });
});

// ===================== 404 =====================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
