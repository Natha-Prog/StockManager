const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { get } = require('../db/database');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard' },
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      if (!user) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await get('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
