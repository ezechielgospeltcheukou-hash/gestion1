const Expense = require('../models/Expense');
const sequelize = require('../config/database');

const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Expense.findAndCountAll({
      order: [['date', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getExpenses:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Dépense non trouvée' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error('Erreur getExpenseById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, paymentMethod, notes } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir description et montant' });
    }

    const expense = await Expense.create({
      description,
      amount,
      category: category || 'Général',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'Espèces',
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: expense, message: 'Dépense enregistrée' });
  } catch (error) {
    console.error('Erreur createExpense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Dépense non trouvée' });
    }

    const { description, amount, category, date, paymentMethod, notes } = req.body;
    await expense.update({ description, amount, category, date, paymentMethod, notes });
    res.json({ success: true, data: expense, message: 'Dépense mise à jour' });
  } catch (error) {
    console.error('Erreur updateExpense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Dépense non trouvée' });
    }

    await expense.destroy();
    res.json({ success: true, message: 'Dépense supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteExpense:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getExpensesStats = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let where = {};
    if (startDate && endDate) {
      where.date = {
        [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (category) {
      where.category = category;
    }

    const expenses = await Expense.findAll({ where });
    const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      success: true,
      data: {
        totalExpense,
        count: expenses.length,
        expenses
      }
    });
  } catch (error) {
    console.error('Erreur getExpensesStats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesStats
};
