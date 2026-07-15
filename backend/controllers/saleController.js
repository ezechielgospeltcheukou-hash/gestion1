const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const sequelize = require('../config/database');

const getSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Sale.findAndCountAll({
      where: { businessId: req.user.businessId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getSales:', error);
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('Erreur getSaleById:', error);
    next(error);
  }
};

const createSale = async (req, res, next) => {
  let transaction;
  try {
    const { productId, quantity, paymentMethod, transactionReference, discount, notes, customUnitPrice, totalPrice } = req.body;
    
    transaction = await sequelize.transaction();

    const product = await Product.findOne({ where: { id: productId, businessId: req.user.businessId }, transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    // Calcul du prix de vente unitaire
    const unitPrice = customUnitPrice !== undefined ? customUnitPrice : product.price;
    const computedTotal = totalPrice !== undefined ? totalPrice : (unitPrice * quantity * (1 - (discount || 0) / 100));

    const sale = await Sale.create({
      productId,
      quantity,
      unitPriceAtSale: unitPrice,
      purchasePriceAtSale: product.purchasePrice || 0,
      totalPrice: computedTotal,
      paymentMethod,
      transactionReference,
      discount,
      notes,
      userId: req.user.id,
      businessId: req.user.businessId
    }, { transaction });

    await product.update({ stock: product.stock - quantity }, { transaction });

    await transaction.commit();
    res.status(201).json({ success: true, data: sale, message: 'Vente enregistrée' });

  } catch (error) {
    if (transaction) await transaction.rollback().catch(() => {});
    console.error('Erreur createSale:', error);
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
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
  } catch (authError) {
    console.error('Erreur validation admin deleteSale:', authError);
    return res.status(500).json({ success: false, message: 'Erreur d\'autorisation' });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    const sale = await Sale.findOne({ where: { id: req.params.id, businessId: req.user.businessId }, transaction });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }

    const product = await Product.findOne({ where: { id: sale.productId, businessId: req.user.businessId }, transaction });
    if (product) {
      await product.update(
        { stock: product.stock + sale.quantity },
        { transaction }
      );
    }

    await sale.destroy({ transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Vente annulée et stock restitué' });
  } catch (error) {
    if (transaction) await transaction.rollback().catch(() => {});
    console.error('Erreur deleteSale:', error);
    next(error);
  }
};

const getSalesStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = { businessId: req.user.businessId };
    if (startDate && endDate) {
      where = {
        createdAt: {
          [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    const sales = await Sale.findAll({ where });
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.totalPrice), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) - (parseFloat(s.purchasePriceAtSale) * s.quantity)), 0);

    res.json({
      success: true,
      data: {
        totalSales: sales.length,
        totalRevenue,
        totalProfit,
        sales
      }
    });
  } catch (error) {
    console.error('Erreur getSalesStats:', error);
    next(error);
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
  getSalesStats
};

