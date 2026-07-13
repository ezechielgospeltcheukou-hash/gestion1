const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupplierPayment = sequelize.define('SupplierPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('Espèces', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Carte Bancaire'),
    defaultValue: 'Espèces'
  },
  transactionReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'supplier_payments',
  indexes: [
    { fields: ['businessId'] },
    { fields: ['supplierId'] },
  ]
});

module.exports = SupplierPayment;
