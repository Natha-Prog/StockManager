const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param } = require('express-validator');
const { get, all, run } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await all('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    body('role').isIn(['admin', 'operator']).withMessage('Rôle invalide'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await run(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email.toLowerCase(), passwordHash, role]
      );
      res.status(201).json({ id: result.lastID, email: email.toLowerCase(), role });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  validate,
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (id === req.user.id) {
        throw new AppError('Vous ne pouvez pas supprimer votre propre compte', 400);
      }
      const result = await run('DELETE FROM users WHERE id = ?', [id]);
      if (result.changes === 0) {
        throw new AppError('Utilisateur non trouvé', 404);
      }
      res.json({ message: 'Utilisateur supprimé' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
