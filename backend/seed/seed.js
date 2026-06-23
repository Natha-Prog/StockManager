const bcrypt = require('bcryptjs');
const { get, run } = require('../db/database');
const { adminEmail, adminPassword } = require('../config/env');

async function seedAdmin() {
  const existing = await get('SELECT id FROM users WHERE email = ?', [adminEmail.toLowerCase()]);
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await run(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    [adminEmail.toLowerCase(), passwordHash, 'admin']
  );
  console.log(`Admin user created: ${adminEmail}`);
}

module.exports = { seedAdmin };
