const { Op } = require('sequelize');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const CashTransaction = require('../models/CashTransaction');
const Credit = require('../models/Credit');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');
const Invoice = require('../models/Invoice');

const getBilan = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      allSales,
      salesThisMonth,
      salesToday,
      allExpenses,
      expensesThisMonth,
      allProducts,
      cashData,
      creditsClientData,
      creditsSupplierData,
      clientBalances,
      supplierBalances,
      pendingInvoices,
      clientsData,
      suppliersData,
      monthlySalesData,
      monthlyExpensesData,
    ] = await Promise.all([

      Sale.findAll({ raw: true }),
      Sale.findAll({ where: { createdAt: { [Op.gte]: startOfMonth } }, raw: true }),
      Sale.findAll({ where: { createdAt: { [Op.gte]: today } }, raw: true }),

      Expense.findAll({ raw: true }),
      Expense.findAll({ where: { date: { [Op.gte]: startOfMonth } }, raw: true }),

      Product.findAll({ where: { isActive: true }, raw: true }),

      CashTransaction.findAll({ raw: true }),

      Credit.findAll({ where: { personType: 'CLIENT', isRepaid: false }, raw: true }),
      Credit.findAll({ where: { personType: 'SUPPLIER', isRepaid: false }, raw: true }),

      Client.findAll({ where: { isActive: true }, raw: true }),
      Supplier.findAll({ where: { isActive: true }, raw: true }),

      Invoice.findAll({ where: { status: ['DRAFT', 'SENT'] }, raw: true }),

      Client.count({ where: { isActive: true } }),
      Supplier.count({ where: { isActive: true } }),
    ]);

    const totalSalesVal = allSales.reduce((s, sale) => s + parseFloat(sale.totalPrice || 0), 0);
    const totalSalesMonth = salesThisMonth.reduce((s, sale) => s + parseFloat(sale.totalPrice || 0), 0);
    const totalSalesTodayVal = salesToday.reduce((s, sale) => s + parseFloat(sale.totalPrice || 0), 0);
    const salesCount = allSales.length;

    const totalExpensesVal = allExpenses.reduce((s, exp) => s + parseFloat(exp.amount || 0), 0);
    const totalExpensesMonth = expensesThisMonth.reduce((s, exp) => s + parseFloat(exp.amount || 0), 0);

    const stockVal = allProducts.reduce((s, p) => s + (parseFloat(p.purchasePrice || 0) * (p.stock || 0)), 0);
    const totalStockUnits = allProducts.reduce((s, p) => s + (p.stock || 0), 0);

    const cashIn = cashData.filter(t => t.type === 'IN').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const cashOut = cashData.filter(t => t.type === 'OUT').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const cashBalance = cashIn - cashOut;

    const creditsReceivable = creditsClientData.reduce((s, c) => s + parseFloat(c.amount || 0), 0);
    const creditsPayable = creditsSupplierData.reduce((s, c) => s + parseFloat(c.amount || 0), 0);

    const totalClientBalance = clientBalances.reduce((s, c) => s + parseFloat(c.balance || 0), 0);
    const totalSupplierBalance = supplierBalances.reduce((s, s2) => s + parseFloat(s2.balance || 0), 0);
    const invoicesPendingVal = pendingInvoices.reduce((s, inv) => s + parseFloat(inv.totalAmount || 0), 0);

    const cogsVal = allSales.reduce((s, sale) => s + (parseFloat(sale.purchasePriceAtSale || 0) * (sale.quantity || 0)), 0);

    const grossProfit = totalSalesVal - cogsVal;
    const netProfit = grossProfit - totalExpensesVal;

    const totalAssets = stockVal + cashBalance + creditsReceivable;
    const totalLiabilities = creditsPayable + totalSupplierBalance;

    const productsCount = allProducts.length;

    const paymentMethods = {};
    allSales.forEach(sale => {
      const method = sale.paymentMethod || 'Inconnu';
      if (!paymentMethods[method]) paymentMethods[method] = { nombre: 0, total: 0 };
      paymentMethods[method].nombre++;
      paymentMethods[method].total += parseFloat(sale.totalPrice || 0);
    });

    const monthlyRevenue = {};
    allSales.forEach(sale => {
      if (!sale.createdAt) return;
      const month = sale.createdAt.substring(0, 7);
      if (!monthlyRevenue[month]) monthlyRevenue[month] = 0;
      monthlyRevenue[month] += parseFloat(sale.totalPrice || 0);
    });

    const monthlyExpensesMap = {};
    allExpenses.forEach(exp => {
      if (!exp.date) return;
      const month = exp.date.substring(0, 7);
      if (!monthlyExpensesMap[month]) monthlyExpensesMap[month] = 0;
      monthlyExpensesMap[month] += parseFloat(exp.amount || 0);
    });

    const sortMonths = (a, b) => b.localeCompare(a);
    const last12Months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push(d.toISOString().substring(0, 7));
    }

    res.json({
      success: true,
      data: {
        bilan: {
          actif: {
            stock: { valeur: stockVal, unites: totalStockUnits },
            tresorerie: cashBalance,
            encaissement: cashIn,
            decaissement: cashOut,
            creditsClients: creditsReceivable,
            facturesImpayees: invoicesPendingVal,
            totalActif: totalAssets,
          },
          passif: {
            creditsFournisseurs: creditsPayable,
            soldesFournisseurs: totalSupplierBalance,
            totalPassif: totalLiabilities,
          },
          capitauxPropres: totalAssets - totalLiabilities,
        },
        performance: {
          chiffreAffaires: {
            total: totalSalesVal,
            moisEnCours: totalSalesMonth,
            aujourdhui: totalSalesTodayVal,
          },
          coutDesVentes: cogsVal,
          margeBrute: grossProfit,
          depenses: {
            total: totalExpensesVal,
            moisEnCours: totalExpensesMonth,
          },
          resultatNet: netProfit,
        },
        indicateurs: {
          totalProduits: productsCount,
          totalVentes: salesCount,
          totalClients: clientsData,
          totalFournisseurs: suppliersData,
          valeurMoyennePanier: salesCount > 0 ? totalSalesVal / salesCount : 0,
          ratioMarge: totalSalesVal > 0 ? (grossProfit / totalSalesVal * 100) : 0,
        },
        repartitionVentes: Object.entries(paymentMethods).map(([methode, data]) => ({
          methode,
          nombre: data.nombre,
          total: data.total,
        })),
        evolutionMensuelle: {
          revenus: last12Months.map(month => ({
            mois: month,
            total: monthlyRevenue[month] || 0,
          })),
          depenses: last12Months.map(month => ({
            mois: month,
            total: monthlyExpensesMap[month] || 0,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Erreur bilan:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du calcul du bilan: ' + error.message });
  }
};

module.exports = { getBilan };
