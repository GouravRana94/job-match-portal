const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   ✅ CORS CONFIG (PRODUCTION READY)
========================= */
const allowedOrigins = [
  'http://localhost:3000',
  'https://job-match-portal-5b25-neon.vercel.app/login',
  'https://job-match-portal-5b25-git-main-gouravrana94s-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile apps

    if (!allowedOrigins.includes(origin)) {
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    }

    return callback(null, true);
  },
  credentials: true
}));

/* =========================
   ✅ MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ✅ ROUTES
========================= */
const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/applications', applicationRoutes);

/* =========================
   ✅ HEALTH CHECK
========================= */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

/* =========================
   ✅ ROOT
========================= */
app.get('/', (req, res) => {
  res.json({
    message: 'Job Match Portal API',
    version: '1.0.0'
  });
});

/* =========================
   ✅ DEBUG ROUTES (DEV ONLY)
========================= */
if (process.env.NODE_ENV === 'development') {
  console.log('\n📋 Registered routes:');

  const listRoutes = (stack, basePath = '') => {
    stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .join(', ')
          .toUpperCase();
        console.log(`   ${methods} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        const routerPath = layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\?/g, '');

        listRoutes(layer.handle.stack, basePath + routerPath);
      }
    });
  };

  listRoutes(app._router.stack);
}

/* =========================
   ✅ ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

/* =========================
   ✅ 404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.url}`
  });
});

/* =========================
   ✅ START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});