const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-movements', movementRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);

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
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, start, initialize };
