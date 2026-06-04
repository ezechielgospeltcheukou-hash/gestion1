const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

const getStats = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const totalSalesToday = await Sale.sum('totalAmount', { where: { createdAt: { [Op.gte]: today } } });
    const totalSalesYesterday = await Sale.sum('totalAmount', { where: { createdAt: { [Op.between]: [yesterday, today] } } });
    const totalSalesThisMonth = await Sale.sum('totalAmount', { where: { createdAt: { [Op.gte]: thisMonth } } });
    const totalSalesLastMonth = await Sale.sum('totalAmount', { where: { createdAt: { [Op.between]: [lastMonth, thisMonth] } } });
    
    const totalExpensesThisMonth = await Expense.sum('amount', { where: { createdAt: { [Op.gte]: thisMonth } } });
    const totalExpensesLastMonth = await Expense.sum('amount', { where: { createdAt: { [Op.between]: [lastMonth, thisMonth] } } });

    const lowStockProducts = await Product.count({ where: { quantity: { [Op.lt]: 10 } } });
    const totalProducts = await Product.count();
    const totalClients = await Client.count();
    const totalSuppliers = await Supplier.count();

    const netProfit = (totalSalesThisMonth || 0) - (totalExpensesThisMonth || 0);

    res.json({
      totalSalesToday: totalSalesToday || 0,
      totalSalesYesterday: totalSalesYesterday || 0,
      totalSalesThisMonth: totalSalesThisMonth || 0,
      totalSalesLastMonth: totalSalesLastMonth || 0,
      totalExpensesThisMonth: totalExpensesThisMonth || 0,
      totalExpensesLastMonth: totalExpensesLastMonth || 0,
      netProfit,
      lowStockProducts,
      totalProducts,
      totalClients,
      totalSuppliers
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

module.exports = {
  getStats
};
