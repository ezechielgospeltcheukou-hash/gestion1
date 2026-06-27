const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé, pas de token' });
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé, utilisateur introuvable' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Non autorisé, token invalide' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Rôle ${req.user.role} non autorisé pour cette action` 
      });
    }
    next();
  };
};

const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ message: `Permission ${permission} requise` });
    }

    next();
  };
};

module.exports = { protect, authorize, hasPermission };
