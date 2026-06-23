const express = require('express');
const { all, get } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const totalProducts = await get('SELECT COUNT(*) as total FROM products');
    const totalStock = await get('SELECT SUM(stock) as total FROM products');
    const lowStock = await get('SELECT COUNT(*) as low FROM products WHERE stock < min_stock');
    const movementsThisWeek = await get(
      `SELECT COUNT(*) as movements FROM stock_movements WHERE created_at >= datetime('now', '-7 days')`
    );
    const totalValue = await get('SELECT SUM(price * stock) as value FROM products');

    const recentMovements = await all(
      `SELECT sm.*, p.name as product_name, p.reference, u.email as user_email
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN users u ON sm.user_id = u.id
       ORDER BY sm.created_at DESC
       LIMIT 10`
    );

    const lowStockItems = await all(
      `SELECT id, name, reference, stock, min_stock, category
       FROM products
       WHERE stock < min_stock
       ORDER BY (min_stock - stock) DESC
       LIMIT 10`
    );

    const weeklyChart = await all(
      `SELECT date(created_at) as date,
              SUM(CASE WHEN type = 'entry' THEN quantity ELSE 0 END) as entries,
              SUM(CASE WHEN type = 'exit' THEN quantity ELSE 0 END) as exits
       FROM stock_movements
       WHERE created_at >= datetime('now', '-7 days')
       GROUP BY date(created_at)
       ORDER BY date ASC`
    );

    res.json({
      totalProducts: totalProducts.total,
      totalStock: totalStock.total || 0,
      lowStockProducts: lowStock.low,
      movementsThisWeek: movementsThisWeek.movements,
      totalValue: totalValue.value || 0,
      recentMovements,
      lowStockItems,
      weeklyChart,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
