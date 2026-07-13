const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashTransaction = sequelize.define('CashTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'cash_transactions',
  indexes: [
    { fields: ['businessId'] },
    { fields: ['type'] },
  ]
});

module.exports = CashTransaction;
