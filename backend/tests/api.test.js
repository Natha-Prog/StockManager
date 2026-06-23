const path = require('path');
const request = require('supertest');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_PATH = ':memory:';
process.env.ADMIN_EMAIL = 'test@admin.com';
process.env.ADMIN_PASSWORD = 'testpass123';

const { app, initialize } = require('../server');
const { run, get, close } = require('../db/database');

let adminToken;

beforeAll(async () => {
  await initialize();
  const hash = await bcrypt.hash('testpass123', 10);
  await run('DELETE FROM users');
  await run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', ['test@admin.com', hash, 'admin']);
  await run('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', ['operator@test.com', hash, 'operator']);
});

afterAll(async () => {
  await close();
});

async function getToken(email = 'test@admin.com', password = 'testpass123') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('Auth', () => {
  test('POST /api/auth/login returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@admin.com', password: 'testpass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  test('GET /api/auth/me requires auth', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('operator cannot access users', async () => {
    const token = await getToken('operator@test.com', 'testpass123');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Products', () => {
  let adminToken;
  let operatorToken;
  let productId;

  beforeAll(async () => {
    adminToken = await getToken();
    operatorToken = await getToken('operator@test.com', 'testpass123');
  });

  test('admin can create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Product', reference: 'REF-001', price: 10.5, min_stock: 5 });
    expect(res.status).toBe(201);
    expect(res.body.stock).toBe(0);
    productId = res.body.id;
  });

  test('operator cannot create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ name: 'Blocked', reference: 'REF-002', price: 5 });
    expect(res.status).toBe(403);
  });

  test('cannot delete product with movements', async () => {
    await request(app)
      .post('/api/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_id: productId, type: 'entry', quantity: 10 });

    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
  });
});

describe('Stock Movements', () => {
  let adminToken;
  let productId;

  beforeAll(async () => {
    adminToken = await getToken();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Movement Test', reference: 'REF-MOV', price: 20 });
    productId = res.body.id;

    await request(app)
      .post('/api/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_id: productId, type: 'entry', quantity: 5 });
  });

  test('entry increases stock', async () => {
    const product = await get('SELECT stock FROM products WHERE id = ?', [productId]);
    expect(product.stock).toBe(5);
  });

  test('exit with insufficient stock returns 400', async () => {
    const res = await request(app)
      .post('/api/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_id: productId, type: 'exit', quantity: 100 });
    expect(res.status).toBe(400);
  });

  test('valid exit decreases stock', async () => {
    const res = await request(app)
      .post('/api/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_id: productId, type: 'exit', quantity: 2 });
    expect(res.status).toBe(201);

    const product = await get('SELECT stock FROM products WHERE id = ?', [productId]);
    expect(product.stock).toBe(3);
  });
});

describe('Health', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
