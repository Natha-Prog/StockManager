require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  dbPath: process.env.DB_PATH || require('path').join(__dirname, '..', 'stock.db'),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@stock.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
