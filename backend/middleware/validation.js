const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map(e => e.msg),
    });
  }
  next();
};

const authValidation = {
  register: [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Le nom d\'utilisateur doit avoir entre 3 et 50 caractères'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit avoir au moins 8 caractères'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    handleValidation,
  ],
  login: [
    body('username').trim().notEmpty().withMessage('Le nom d\'utilisateur est requis'),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
    handleValidation,
  ],
};

const clientValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Le nom est requis (max 100 caractères)'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('phone').optional().trim().isLength({ max: 20 }),
    handleValidation,
  ],
  update: [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().withMessage('Email invalide'),
    handleValidation,
  ],
};

const productValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Le nom du produit est requis'),
    body('price').isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
    body('purchasePrice').optional().isFloat({ min: 0 }),
    handleValidation,
  ],
  update: [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('price').optional().isFloat({ min: 0 }),
    body('stock').optional().isInt({ min: 0 }),
    handleValidation,
  ],
};

const saleValidation = {
  create: [
    body('productId').isInt({ min: 1 }).withMessage('ID produit invalide'),
    body('quantity').isInt({ min: 1 }).withMessage('La quantite doit etre au moins 1'),
    body('paymentMethod').optional().isIn(['Espèces', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Carte Bancaire', 'Crédit']),
    handleValidation,
  ],
};

const expenseValidation = {
  create: [
    body('description').trim().isLength({ min: 1, max: 200 }).withMessage('La description est requise'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit etre positif'),
    body('category').optional().trim(),
    handleValidation,
  ],
};

const supplierValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Le nom du fournisseur est requis'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    handleValidation,
  ],
};

const employeeValidation = {
  create: [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Le nom d\'utilisateur est requis (3-50 caractères)'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit avoir au moins 8 caractères'),
    body('role').optional().isIn(['ADMIN', 'EMPLOYEE']).withMessage('Rôle invalide'),
    handleValidation,
  ],
  update: [
    body('username').optional().trim().isLength({ min: 3, max: 50 }),
    body('role').optional().isIn(['ADMIN', 'EMPLOYEE']),
    handleValidation,
  ],
};

const invoiceValidation = {
  create: [
    body('invoiceNumber').trim().notEmpty().withMessage('Le numéro de facture est requis'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Le montant total doit être positif'),
    body('status').optional().isIn(['DRAFT', 'SENT', 'PAID', 'CANCELLED']),
    handleValidation,
  ],
};

const appointmentValidation = {
  create: [
    body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Le titre est requis'),
    body('date').isISO8601().withMessage('La date est invalide'),
    handleValidation,
  ],
};

const cashValidation = {
  create: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    body('type').isIn(['IN', 'OUT']).withMessage('Le type doit être IN ou OUT'),
    handleValidation,
  ],
};

const creditValidation = {
  create: [
    body('personId').isInt({ min: 1 }).withMessage('ID personne invalide'),
    body('personType').isIn(['CLIENT', 'SUPPLIER']).withMessage('Le type doit être CLIENT ou SUPPLIER'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Le montant doit être positif'),
    handleValidation,
  ],
};

const messageValidation = {
  create: [
    body('toUserId').isInt({ min: 1 }).withMessage('ID destinataire invalide'),
    body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Le message est requis (max 2000 caractères)'),
    handleValidation,
  ],
};

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100'),
  handleValidation,
];

module.exports = {
  handleValidation,
  authValidation,
  clientValidation,
  productValidation,
  saleValidation,
  expenseValidation,
  supplierValidation,
  employeeValidation,
  invoiceValidation,
  appointmentValidation,
  cashValidation,
  creditValidation,
  messageValidation,
  paginationValidation,
};
