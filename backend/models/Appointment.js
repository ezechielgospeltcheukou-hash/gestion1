const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'appointments',
  indexes: [
    { fields: ['date'] },
    { fields: ['clientId'] },
    { fields: ['status'] },
    { fields: ['createdBy'] },
  ]
});

module.exports = Appointment;
