const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const Client = require('./Client');
const Supplier = require('./Supplier');
const SupplierPayment = require('./SupplierPayment');
const Expense = require('./Expense');
const CashTransaction = require('./CashTransaction');
const Credit = require('./Credit');
const Invoice = require('./Invoice');
const Appointment = require('./Appointment');
const Message = require('./Message');

const setupAssociations = () => {

  Product.hasMany(Sale, { foreignKey: 'productId', as: 'sales' });
  Sale.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

  User.hasMany(Sale, { foreignKey: 'soldBy', as: 'sales' });
  Sale.belongsTo(User, { foreignKey: 'soldBy', as: 'seller' });

  User.hasMany(CashTransaction, { foreignKey: 'createdBy', as: 'cashTransactions' });
  CashTransaction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  User.hasMany(Expense, { foreignKey: 'createdBy', as: 'expenses' });
  Expense.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'invoices' });
  Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  User.hasMany(Appointment, { foreignKey: 'createdBy', as: 'appointments' });
  Appointment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

  User.hasMany(Message, { foreignKey: 'fromUserId', as: 'sentMessages' });
  Message.belongsTo(User, { foreignKey: 'fromUserId', as: 'sender' });

  User.hasMany(Message, { foreignKey: 'toUserId', as: 'receivedMessages' });
  Message.belongsTo(User, { foreignKey: 'toUserId', as: 'receiver' });

  Supplier.hasMany(SupplierPayment, { foreignKey: 'supplierId', as: 'payments' });
  SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

  Client.hasMany(Invoice, { foreignKey: 'clientId', as: 'invoices' });
  Invoice.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

  Client.hasMany(Appointment, { foreignKey: 'clientId', as: 'appointments' });
  Appointment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

};

module.exports = setupAssociations;
