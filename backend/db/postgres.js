const { Pool } = require('pg');

function normalizeDatabaseUrl(raw) {
  if (!raw) return raw;
  let url = String(raw).trim();
  // Render / copier-coller : guillemets accidentels
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

function describeDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      user: decodeURIComponent(parsed.username || ''),
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: (parsed.pathname || '/').replace(/^\//, '') || 'postgres',
    };
  } catch {
    return { user: '?', host: '?', port: '?', database: '?' };
  }
}

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);
const isSupabase = connectionString && connectionString.includes('supabase.com');
const useSsl =
  process.env.NODE_ENV === 'production' || isSupabase
    ? { rejectUnauthorized: false }
    : false;

if (connectionString) {
  const info = describeDatabaseUrl(connectionString);
  console.log(
    `Postgres config: user=${info.user} host=${info.host} port=${info.port} db=${info.database}`
  );
  if (info.user === 'postgres' && isSupabase && info.host.includes('pooler')) {
    console.warn(
      'Warning: pooler Supabase attend user "postgres.<project-ref>", pas seulement "postgres"'
    );
  }
}

const pool = new Pool({
  connectionString,
  ssl: useSsl,
  ...(connectionString && connectionString.includes('pgbouncer=true')
    ? { allowExitOnIdle: true }
    : {}),
});

module.exports = pool;
