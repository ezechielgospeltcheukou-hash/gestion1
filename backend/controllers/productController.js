const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getProducts:', error);
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvÃ©' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Erreur getProductById:', error);
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, purchasePrice, stock, category, barcode, expirationDate, lowStockAlert } = req.body;

    if (!name || !price || purchasePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir les champs obligatoires' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      purchasePrice: purchasePrice || 0,
      stock: stock || 0,
      category: category || 'GÃ©nÃ©ral',
      barcode,
      expirationDate,
      lowStockAlert: lowStockAlert || 5,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: product, message: 'Produit crÃ©Ã©' });
  } catch (error) {
    console.error('Erreur createProduct:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Ce code barre existe dÃ©jÃ ' });
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvÃ©' });
    }

    const { name, description, price, purchasePrice, stock, category, barcode, expirationDate, lowStockAlert } = req.body;
    await product.update({ name, description, price, purchasePrice, stock, category, barcode, expirationDate, lowStockAlert });
    res.json({ success: true, data: product, message: 'Produit mis Ã  jour' });
  } catch (error) {
    console.error('Erreur updateProduct:', error);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvÃ©' });
    }

    await product.update({ isActive: false });
    res.json({ success: true, message: 'Produit dÃ©sactivÃ© avec succÃ¨s' });
  } catch (error) {
    console.error('Erreur deleteProduct:', error);
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvÃ©' });
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    await product.update({ stock: newStock });
    res.json({ success: true, data: product, message: 'Stock mis Ã  jour' });
  } catch (error) {
    console.error('Erreur adjustStock:', error);
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};

