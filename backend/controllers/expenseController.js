const Expense = require('../models/Expense');
const sequelize = require('../config/database');

const getExpenses = async (req, res, next) => {
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
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'DÃ©pense non trouvÃ©e' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error('Erreur getExpenseById:', error);
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { description, amount, category, date, paymentMethod, notes } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir description et montant' });
    }

    const expense = await Expense.create({
      description,
      amount,
      category: category || 'GÃ©nÃ©ral',
      date: date || new Date(),
      paymentMethod: paymentMethod || 'EspÃ¨ces',
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: expense, message: 'DÃ©pense enregistrÃ©e' });
  } catch (error) {
    console.error('Erreur createExpense:', error);
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'DÃ©pense non trouvÃ©e' });
    }

    const { description, amount, category, date, paymentMethod, notes } = req.body;
    await expense.update({ description, amount, category, date, paymentMethod, notes });
    res.json({ success: true, data: expense, message: 'DÃ©pense mise Ã  jour' });
  } catch (error) {
    console.error('Erreur updateExpense:', error);
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'DÃ©pense non trouvÃ©e' });
    }

    await expense.destroy();
    res.json({ success: true, message: 'DÃ©pense supprimÃ©e avec succÃ¨s' });
  } catch (error) {
    console.error('Erreur deleteExpense:', error);
    next(error);
  }
};

const getExpensesStats = async (req, res, next) => {
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
    next(error);
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

