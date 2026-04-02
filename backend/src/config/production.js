module.exports = {
  corsOrigin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  database: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
};