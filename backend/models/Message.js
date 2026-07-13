const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'messages',
  indexes: [
    { fields: ['businessId'] },
    { fields: ['fromUserId'] },
    { fields: ['toUserId'] },
  ]
});

module.exports = Message;
