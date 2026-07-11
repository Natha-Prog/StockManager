require('dotenv').config();

const corsOriginList = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

function isOriginAllowed(origin, patterns) {
  if (!origin) return true;
  return patterns.some((pattern) => {
    if (pattern === '*' || pattern === origin) return true;
    // https://*.vercel.app → tous les déploiements / previews Vercel
    if (pattern.startsWith('https://*.')) {
      const suffix = pattern.slice('https://*.'.length);
      try {
        const { hostname, protocol } = new URL(origin);
        if (protocol !== 'https:') return false;
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
      } catch {
        return false;
      }
    }
    return false;
  });
}

function corsOriginCallback(origin, callback) {
  if (isOriginAllowed(origin, corsOriginList)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: corsOriginCallback,
  corsOriginList,
  dbPath: process.env.DB_PATH || require('path').join(__dirname, '..', 'stock.db'),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@stock.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
