const Product = require('../models/Product');
const User = require('../models/User');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { isActive: true, businessId: req.user.businessId },
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
    const product = await Product.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
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
    const product = await Product.create({
      name,
      description,
      price,
      purchasePrice,
      stock,
      category,
      barcode,
      expirationDate,
      lowStockAlert,
      businessId: req.user.businessId
    });
    res.status(201).json({ success: true, data: product, message: 'Produit créé avec succès' });
  } catch (error) {
    console.error('Erreur createProduct:', error);
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const { name, description, price, purchasePrice, stock, category, barcode, expirationDate, lowStockAlert } = req.body;
    await product.update({ name, description, price, purchasePrice, stock, category, barcode, expirationDate, lowStockAlert });
    res.json({ success: true, data: product, message: 'Produit mis à jour' });
  } catch (error) {
    console.error('Erreur updateProduct:', error);
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      const adminPassword = req.headers['x-admin-password'];
      if (!adminPassword) {
        return res.status(403).json({ success: false, message: 'Autorisation requise de l\'administrateur' });
      }
      
      const adminUser = await User.findOne({
        where: { id: req.user.businessId, role: 'ADMIN' }
      });
      
      if (!adminUser || !(await adminUser.comparePassword(adminPassword))) {
        return res.status(403).json({ success: false, message: 'Mot de passe administrateur incorrect' });
      }
    }

    const product = await Product.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    await product.update({ isActive: false });
    res.json({ success: true, message: 'Produit désactivé avec succès' });
  } catch (error) {
    console.error('Erreur deleteProduct:', error);
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });

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

