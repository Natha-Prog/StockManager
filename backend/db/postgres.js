const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString && connectionString.includes('supabase.com');
const useSsl =
  process.env.NODE_ENV === 'production' || isSupabase
    ? { rejectUnauthorized: false }
    : false;

// Session-mode pooler (port 5432) recommandé pour Express.
// Transaction-mode (6543 + pgbouncer=true) : éviter les prepared statements.
const pool = new Pool({
  connectionString,
  ssl: useSsl,
  ...(connectionString && connectionString.includes('pgbouncer=true')
    ? { allowExitOnIdle: true }
    : {}),
});

module.exports = pool;
