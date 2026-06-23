const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { AppError } = require('./errorHandler');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentification requise', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Token invalide ou expiré', 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Accès non autorisé', 403));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
