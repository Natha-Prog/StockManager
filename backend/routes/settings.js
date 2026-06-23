const express = require('express');
const { body } = require('express-validator');
const { get, run } = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const DEFAULT_SETTINGS = {
  language: 'fr',
  currency: 'EUR',
  dateFormat: 'fr-FR',
};

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const row = await get('SELECT language, currency, date_format FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (!row) {
      return res.json(DEFAULT_SETTINGS);
    }
    res.json({
      language: row.language,
      currency: row.currency,
      dateFormat: row.date_format,
    });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/',
  [
    body('language').optional().isIn(['fr', 'en']),
    body('currency').optional().isIn(['EUR', 'USD', 'GBP', 'MGA']),
    body('dateFormat').optional().isIn(['fr-FR', 'en-US', 'en-GB']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { language, currency, dateFormat } = req.body;
      const existing = await get('SELECT user_id FROM user_settings WHERE user_id = ?', [req.user.id]);

      if (existing) {
        await run(
          `UPDATE user_settings SET language = ?, currency = ?, date_format = ? WHERE user_id = ?`,
          [language, currency, dateFormat, req.user.id]
        );
      } else {
        await run(
          `INSERT INTO user_settings (user_id, language, currency, date_format) VALUES (?, ?, ?, ?)`,
          [req.user.id, language, currency, dateFormat]
        );
      }

      res.json({ language, currency, dateFormat });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
