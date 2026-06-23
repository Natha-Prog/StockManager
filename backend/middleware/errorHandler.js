class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route non trouvée: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';

  if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 409;
    if (err.message.includes('UNIQUE')) {
      message = 'Cette référence ou cet email existe déjà';
    } else if (err.message.includes('FOREIGN KEY')) {
      message = 'Référence invalide ou ressource liée';
    } else {
      message = 'Contrainte de données violée';
    }
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500 && !err.isOperational) {
    console.error(err);
  }

  res.status(statusCode).json({
    error: message,
    ...(err.errors && { errors: err.errors }),
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
