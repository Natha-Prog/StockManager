const express = require('express');
const { body, param, query } = require('express-validator');
const { get, all, run } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalide'),
    query('search').optional().isString(),
    query('category').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;
      const search = req.query.search?.trim() || '';
      const category = req.query.category?.trim() || '';

      let where = 'WHERE 1=1';
      const params = [];

      if (search) {
        where += ' AND (name LIKE ? OR reference LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        where += ' AND category = ?';
        params.push(category);
      }

      const countRow = await get(`SELECT COUNT(*) as total FROM products ${where}`, params);
      const products = await all(
        `SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      res.json({
        data: products,
        pagination: {
          page,
          limit,
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  validate,
  async (req, res, next) => {
    try {
      const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
      if (!product) {
        throw new AppError('Produit non trouvé', 404);
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty().withMessage('Nom requis'),
    body('reference').trim().notEmpty().withMessage('Référence requise'),
    body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('min_stock').optional().isInt({ min: 0 }).withMessage('Stock minimum invalide'),
    body('category').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, reference, category, price, min_stock } = req.body;
      const result = await run(
        `INSERT INTO products (name, reference, category, price, stock, min_stock)
         VALUES (?, ?, ?, ?, 0, ?)`,
        [name, reference, category || null, price, min_stock || 0]
      );
      const product = await get('SELECT * FROM products WHERE id = ?', [result.lastID]);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('name').trim().notEmpty().withMessage('Nom requis'),
    body('reference').trim().notEmpty().withMessage('Référence requise'),
    body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
    body('min_stock').optional().isInt({ min: 0 }).withMessage('Stock minimum invalide'),
    body('category').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, reference, category, price, min_stock } = req.body;
      const result = await run(
        `UPDATE products
         SET name = ?, reference = ?, category = ?, price = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, reference, category || null, price, min_stock || 0, req.params.id]
      );
      if (result.changes === 0) {
        throw new AppError('Produit non trouvé', 404);
      }
      const product = await get('SELECT * FROM products WHERE id = ?', [req.params.id]);
      res.json(product);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  validate,
  async (req, res, next) => {
    try {
      const movements = await get(
        'SELECT COUNT(*) as count FROM stock_movements WHERE product_id = ?',
        [req.params.id]
      );
      if (movements.count > 0) {
        throw new AppError('Impossible de supprimer un produit avec des mouvements de stock', 409);
      }
      const result = await run('DELETE FROM products WHERE id = ?', [req.params.id]);
      if (result.changes === 0) {
        throw new AppError('Produit non trouvé', 404);
      }
      res.json({ message: 'Produit supprimé' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
