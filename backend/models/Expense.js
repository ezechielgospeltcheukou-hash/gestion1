const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    defaultValue: 'Général'
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
    type: DataTypes.ENUM('Espèces', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Carte Bancaire'),
    defaultValue: 'Espèces'
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
    { fields: ['category'] },
    { fields: ['date'] },
    { fields: ['createdBy'] },
    { fields: ['createdAt'] },
  ]
});

module.exports = Expense;
