const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Credit = sequelize.define('Credit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  personType: {
    type: DataTypes.ENUM('CLIENT', 'SUPPLIER'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRepaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  repaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'credits',
  indexes: [
    { fields: ['businessId'] },
    { fields: ['personId'] },
    { fields: ['personType'] },
    { fields: ['isRepaid'] },
  ]
});

module.exports = Credit;
