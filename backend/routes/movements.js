const express = require('express');
const { body, query } = require('express-validator');
const { get, all, withTransaction } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['entry', 'exit']),
    query('product_id').optional().isInt({ min: 1 }),
    query('from').optional().matches(/^\d{4}-\d{2}-\d{2}/).withMessage('Date invalide'),
    query('to').optional().matches(/^\d{4}-\d{2}-\d{2}/).withMessage('Date invalide'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;

      let where = 'WHERE 1=1';
      const params = [];

      if (req.query.type) {
        where += ' AND sm.type = ?';
        params.push(req.query.type);
      }
      if (req.query.product_id) {
        where += ' AND sm.product_id = ?';
        params.push(req.query.product_id);
      }
      if (req.query.from) {
        where += ' AND sm.created_at >= ?';
        params.push(`${req.query.from} 00:00:00`);
      }
      if (req.query.to) {
        where += ' AND sm.created_at <= ?';
        params.push(`${req.query.to} 23:59:59`);
      }

      const countRow = await get(
        `SELECT COUNT(*) as total FROM stock_movements sm ${where}`,
        params
      );

      const movements = await all(
        `SELECT sm.*, p.name as product_name, p.reference, u.email as user_email
         FROM stock_movements sm
         JOIN products p ON sm.product_id = p.id
         LEFT JOIN users u ON sm.user_id = u.id
         ${where}
         ORDER BY sm.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      res.json({
        data: movements,
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

router.post(
  '/',
  [
    body('product_id').isInt({ min: 1 }).withMessage('Produit requis'),
    body('type').isIn(['entry', 'exit']).withMessage('Type invalide'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
    body('reason').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { product_id, type, quantity, reason } = req.body;
      const product = await get('SELECT * FROM products WHERE id = ?', [product_id]);

      if (!product) {
        throw new AppError('Produit non trouvé', 404);
      }

      if (type === 'exit' && product.stock < quantity) {
        throw new AppError(
          `Stock insuffisant. Disponible: ${product.stock}, demandé: ${quantity}`,
          400
        );
      }

      const stockChange = type === 'entry' ? quantity : -quantity;

      const movement = await withTransaction(async (tx) => {
        const result = await tx.run(
          `INSERT INTO stock_movements (product_id, user_id, type, quantity, reason)
           VALUES (?, ?, ?, ?, ?)`,
          [product_id, req.user.id, type, quantity, reason || null]
        );

        await tx.run(
          `UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [stockChange, product_id]
        );

        return tx.get(
          `SELECT sm.*, p.name as product_name, p.reference, u.email as user_email
           FROM stock_movements sm
           JOIN products p ON sm.product_id = p.id
           LEFT JOIN users u ON sm.user_id = u.id
           WHERE sm.id = ?`,
          [result.lastID]
        );
      });

      res.status(201).json(movement);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
