const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const CashTransaction = require('../models/CashTransaction');
const Credit = require('../models/Credit');
const { Op } = require('sequelize');

const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [
      totalSalesToday,
      totalSalesYesterday,
      totalSalesThisMonth,
      totalSalesLastMonth,
      totalExpensesThisMonth,
      totalExpensesLastMonth,
      lowStockProducts,
      totalProducts,
      totalClients,
      totalSuppliers,
      allProducts,
      allCash,
      allCreditsClient,
      allCreditsSupplier,
      allSales,
      allExpenses,
    ] = await Promise.all([
      Sale.sum('totalPrice', { where: { createdAt: { [Op.gte]: today } } }),
      Sale.sum('totalPrice', { where: { createdAt: { [Op.between]: [yesterday, today] } } }),
      Sale.sum('totalPrice', { where: { createdAt: { [Op.gte]: thisMonth } } }),
      Sale.sum('totalPrice', { where: { createdAt: { [Op.between]: [lastMonth, thisMonth] } } }),
      Expense.sum('amount', { where: { date: { [Op.gte]: thisMonth } } }),
      Expense.sum('amount', { where: { date: { [Op.between]: [lastMonth, thisMonth] } } }),
      Product.count({ where: { stock: { [Op.lt]: 10 } } }),
      Product.count({ where: { isActive: true } }),
      Client.count({ where: { isActive: true } }),
      Supplier.count({ where: { isActive: true } }),
      Product.findAll({ where: { isActive: true }, attributes: ['purchasePrice', 'stock'], raw: true }),
      CashTransaction.findAll({ raw: true }),
      Credit.findAll({ where: { personType: 'CLIENT', isRepaid: false }, raw: true }),
      Credit.findAll({ where: { personType: 'SUPPLIER', isRepaid: false }, raw: true }),
      Sale.findAll({ raw: true }),
      Expense.findAll({ raw: true }),
    ]);

    const stockVal = allProducts.reduce((s, p) => s + (parseFloat(p.purchasePrice || 0) * (p.stock || 0)), 0);
    const cashIn = allCash.filter(t => t.type === 'IN').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const cashOut = allCash.filter(t => t.type === 'OUT').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const creditsReceivable = allCreditsClient.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const creditsPayable = allCreditsSupplier.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const totalSalesVal = allSales.reduce((s, sale) => s + parseFloat(sale.totalPrice || 0), 0);
    const totalExpensesVal = allExpenses.reduce((s, exp) => s + parseFloat(exp.amount || 0), 0);
    const cogsVal = allSales.reduce((s, sale) => s + (parseFloat(sale.purchasePriceAtSale || 0) * (sale.quantity || 0)), 0);
    const grossProfit = totalSalesVal - cogsVal;
    const netProfitAllTime = grossProfit - totalExpensesVal;
    const netProfitMonth = (parseFloat(totalSalesThisMonth || 0)) - (parseFloat(totalExpensesThisMonth || 0));

    res.json({
      success: true,
      data: {
        totalSalesToday: totalSalesToday || 0,
        totalSalesYesterday: totalSalesYesterday || 0,
        totalSalesThisMonth: totalSalesThisMonth || 0,
        totalSalesLastMonth: totalSalesLastMonth || 0,
        totalExpensesThisMonth: totalExpensesThisMonth || 0,
        totalExpensesLastMonth: totalExpensesLastMonth || 0,
        netProfit: netProfitMonth,
        lowStockProducts,
        totalProducts,
        totalClients,
        totalSuppliers,
        bilan: {
          valeurStock: stockVal,
          tresorerie: cashIn - cashOut,
          encaissements: cashIn,
          decaissements: cashOut,
          creditsClients: creditsReceivable,
          creditsFournisseurs: creditsPayable,
          chiffreAffairesTotal: totalSalesVal,
          depensesTotal: totalExpensesVal,
          coutDesVentes: cogsVal,
          margeBrute: grossProfit,
          resultatNet: netProfitAllTime,
        }
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la recuperation des statistiques: ' + error.message });
  }
};

module.exports = {
  getStats
};
