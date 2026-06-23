const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new AppError('Données invalides', 400);
    err.errors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(err);
  }
  next();
}

module.exports = { validate };
