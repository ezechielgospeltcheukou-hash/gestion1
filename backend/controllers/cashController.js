const CashTransaction = require('../models/CashTransaction');
const { Op, fn, col } = require('sequelize');

const getCashTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await CashTransaction.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totals = await CashTransaction.findAll({
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
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createCashTransaction = async (req, res) => {
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
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: transaction, message: 'Transaction enregistrée' });
  } catch (error) {
    console.error('Erreur createCashTransaction:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteCashTransaction = async (req, res) => {
  try {
    const transaction = await CashTransaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }
    await transaction.destroy();
    res.json({ success: true, message: 'Transaction supprimée' });
  } catch (error) {
    console.error('Erreur deleteCashTransaction:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getCashTransactions,
  createCashTransaction,
  deleteCashTransaction
};
