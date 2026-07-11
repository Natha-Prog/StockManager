const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { port, corsOrigin } = require('./config/env');
const { connect, close } = require('./db/database');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { seedAdmin } = require('./seed/seed');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const movementRoutes = require('./routes/movements');
const statisticsRoutes = require('./routes/statistics');
const settingsRoutes = require('./routes/settings');

const app = express();

// Configurer Helmet pour autoriser les ressources statiques
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const publicDir = path.join(__dirname, 'public');
const serveFrontend = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(publicDir, 'index.html'));

// Servir le frontend uniquement si le build est présent (Docker mono-service)
if (serveFrontend) {
  app.use(express.static(publicDir, {
    maxAge: '1d',
    etag: true
  }));
}

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-movements', movementRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);

if (serveFrontend) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

async function initialize() {
  await connect();
  if (process.env.NODE_ENV !== 'test') {
    await seedAdmin();
  }
}

async function start() {
  await initialize();

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message || err);
    if (err.code) console.error('Error code:', err.code);
    if (process.env.DATABASE_URL) {
      console.error(
        'Hint: vérifiez DATABASE_URL sur Render (user postgres.<ref>, mot de passe DB Supabase, sans guillemets).'
      );
    } else {
      console.error('Hint: DATABASE_URL est absent.');
    }
    process.exit(1);
  });
}

module.exports = { app, start, initialize };
