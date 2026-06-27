const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED'),
    defaultValue: 'DRAFT'
  },
  items: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'invoices',
  indexes: [
    { fields: ['clientId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    { fields: ['createdBy'] },
  ]
});

module.exports = Invoice;
