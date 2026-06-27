const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Général'
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lowStockAlert: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'products',
  indexes: [
    { fields: ['name'] },
    { fields: ['category'] },
    { fields: ['stock'] },
    { fields: ['isActive'] },
    { fields: ['barcode'] },
  ]
});

module.exports = Product;
