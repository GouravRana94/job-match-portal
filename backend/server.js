const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes - MAKE SURE THESE PATHS ARE CORRECT
const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const matchRoutes = require('./src/routes/matchRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');

// Debug: Log route imports
console.log('✅ Routes imported:');
console.log('   - Auth routes');
console.log('   - Job routes');
console.log('   - Profile routes');
console.log('   - Match routes');
console.log('   - Application routes');

// Routes - MAKE SURE THESE ARE CORRECT
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Job Match Portal API', version: '1.0.0' });
});

// Debug: List all registered routes (for development)
if (process.env.NODE_ENV === 'development') {
  console.log('\n📋 Registered routes:');
  const listRoutes = (stack, basePath = '') => {
    stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler - This should be last
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Test jobs: http://localhost:${PORT}/api/jobs\n`);
});