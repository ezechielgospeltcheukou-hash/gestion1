const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  purchasePriceAtSale: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  paymentMethod: {
    type: DataTypes.ENUM('Espèces', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Carte Bancaire', 'Crédit'),
    defaultValue: 'Espèces'
  },
  transactionReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  soldBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'sales',
  indexes: [
    { fields: ['productId'] },
    { fields: ['createdAt'] },
    { fields: ['paymentMethod'] },
    { fields: ['soldBy'] },
  ]
});

module.exports = Sale;
