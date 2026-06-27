const Sale = require('../models/Sale');
const Product = require('../models/Product');
const sequelize = require('../config/database');

const getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Sale.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getSales:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('Erreur getSaleById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createSale = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { productId, quantity, paymentMethod, transactionReference, notes, discount } = req.body;

    if (!productId || !quantity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Veuillez fournir produit et quantité' });
    }

    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    if (product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Stock insuffisant' });
    }

    const discountAmount = discount || 0;
    const totalPrice = (product.price * quantity) * (1 - discountAmount / 100);

    const sale = await Sale.create({
      productId,
      quantity,
      totalPrice,
      purchasePriceAtSale: product.purchasePrice,
      paymentMethod: paymentMethod || 'Espèces',
      transactionReference,
      soldBy: req.user.id,
      discount: discountAmount,
      notes
    }, { transaction });

    await product.update(
      { stock: product.stock - quantity },
      { transaction }
    );

    await transaction.commit();
    res.status(201).json({ success: true, data: sale, message: 'Vente enregistrée' });
  } catch (error) {
    if (transaction) await transaction.rollback().catch(() => {});
    console.error('Erreur createSale:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteSale = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();

    const sale = await Sale.findByPk(req.params.id, { transaction });
    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Vente non trouvée' });
    }

    const product = await Product.findByPk(sale.productId, { transaction });
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
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = {};
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
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
  getSalesStats
};
