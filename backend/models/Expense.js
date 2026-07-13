const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General'
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  receipt: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'Especes'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'expenses',
  indexes: [
    { fields: ['businessId'] },
    { fields: ['category'] },
    { fields: ['date'] },
  ]
});

module.exports = Expense;
