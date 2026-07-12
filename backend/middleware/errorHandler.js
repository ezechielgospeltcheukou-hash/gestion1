const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ success: false, message: 'Erreur de validation', errors: messages });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ success: false, message: 'Doublon détecté', errors: messages });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ 
      success: false, 
      message: 'Impossible de supprimer cet élément car il a un historique (ventes, factures, etc.). Veuillez plutôt le désactiver ou le modifier.' 
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({ success: false, message: 'Erreur de base de données' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token invalide' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expiré' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
