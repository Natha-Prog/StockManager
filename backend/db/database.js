const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('../config/env');
const pool = require('./postgres');

let db = null;
const usePostgres = Boolean(process.env.DATABASE_URL);

/** Convertit les placeholders SQLite (?) en Postgres ($1, $2, …). */
function preparePgSql(sql) {
  let i = 0;
  let pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const upper = pgSql.trim().toUpperCase();
  if (upper.startsWith('INSERT') && !/\bRETURNING\b/i.test(pgSql)) {
    pgSql = pgSql.replace(/;?\s*$/, '') + ' RETURNING id';
  }
  return pgSql;
}

function run(sql, params = []) {
  if (usePostgres) {
    return pool.query(preparePgSql(sql), params).then((result) => ({
      lastID: result.rows[0]?.id,
      changes: result.rowCount,
    }));
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  if (usePostgres) {
    return pool.query(preparePgSql(sql), params).then((result) => result.rows[0]);
  }
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  if (usePostgres) {
    return pool.query(preparePgSql(sql), params).then((result) => result.rows);
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/** Exécute fn({ run, get, all }) dans une transaction (même connexion Postgres). */
async function withTransaction(fn) {
  if (usePostgres) {
    const client = await pool.connect();
    const tx = {
      run: (sql, params = []) =>
        client.query(preparePgSql(sql), params).then((result) => ({
          lastID: result.rows[0]?.id,
          changes: result.rowCount,
        })),
      get: (sql, params = []) =>
        client.query(preparePgSql(sql), params).then((result) => result.rows[0]),
      all: (sql, params = []) =>
        client.query(preparePgSql(sql), params).then((result) => result.rows),
    };
    try {
      await client.query('BEGIN');
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        /* ignore */
      }
      throw err;
    } finally {
      client.release();
    }
  }

  await run('BEGIN TRANSACTION');
  try {
    const result = await fn({ run, get, all });
    await run('COMMIT');
    return result;
  } catch (err) {
    await run('ROLLBACK');
    throw err;
  }
}

async function initializeTables() {
  if (usePostgres) {
    await initializePostgresTables();
  } else {
    await initializeSqliteTables();
  }
}

async function initializeSqliteTables() {
  await run('PRAGMA foreign_keys = ON');

  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('entry', 'exit')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  const columns = await all('PRAGMA table_info(stock_movements)');
  const hasUserId = columns.some((c) => c.name === 'user_id');
  if (!hasUserId) {
    await run('ALTER TABLE stock_movements ADD COLUMN user_id INTEGER REFERENCES users(id)');
  }

  await run(`CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    language TEXT DEFAULT 'fr',
    currency TEXT DEFAULT 'EUR',
    date_format TEXT DEFAULT 'fr-FR',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
}

async function initializePostgresTables() {
  await run(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('entry', 'exit')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY,
    language TEXT DEFAULT 'fr',
    currency TEXT DEFAULT 'EUR',
    date_format TEXT DEFAULT 'fr-FR',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
}

function connect() {
  if (usePostgres) {
    return initializeTables().then(() => {
      console.log('Connected to PostgreSQL database');
      return pool;
    });
  }
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        await initializeTables();
        console.log('Connected to SQLite database');
        resolve(db);
      } catch (initErr) {
        reject(initErr);
      }
    });
  });
}

function close() {
  if (usePostgres) {
    return pool.end();
  }
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) reject(err);
      else {
        db = null;
        resolve();
      }
    });
  });
}

module.exports = { connect, close, run, get, all, withTransaction, usePostgres };
