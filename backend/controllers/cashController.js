const CashTransaction = require('../models/CashTransaction');
const { Op, fn, col } = require('sequelize');

const getCashTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await CashTransaction.findAndCountAll({
      where: { businessId: req.user.businessId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totals = await CashTransaction.findAll({
      where: { businessId: req.user.businessId },
      attributes: [
        'type',
        [fn('SUM', col('amount')), 'total']
      ],
      group: ['type'],
      raw: true
    });
    const totalIn = parseFloat(totals.find(t => t.type === 'IN')?.total || 0);
    const totalOut = parseFloat(totals.find(t => t.type === 'OUT')?.total || 0);
    const balance = totalIn - totalOut;
    res.json({ success: true, data: { transactions: rows, totalIn, totalOut, balance }, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getCashTransactions:', error);
    next(error);
  }
};

const createCashTransaction = async (req, res, next) => {
  try {
    const { amount, type, description, category, reference } = req.body;
    if (!amount || !type) {
      return res.status(400).json({ success: false, message: 'Montant et type requis' });
    }
    const transaction = await CashTransaction.create({
      amount,
      type,
      description,
      category,
      reference,
      createdBy: req.user?.id,
      businessId: req.user.businessId
    });
    res.status(201).json({ success: true, data: transaction, message: 'Transaction enregistrÃ©e' });
  } catch (error) {
    console.error('Erreur createCashTransaction:', error);
    next(error);
  }
};

const deleteCashTransaction = async (req, res, next) => {
  try {
    const transaction = await CashTransaction.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction non trouvÃ©e' });
    }
    await transaction.destroy();
    res.json({ success: true, message: 'Transaction supprimÃ©e' });
  } catch (error) {
    console.error('Erreur deleteCashTransaction:', error);
    next(error);
  }
};

module.exports = {
  getCashTransactions,
  createCashTransaction,
  deleteCashTransaction
};

