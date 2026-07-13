const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'EMPLOYEE'),
    defaultValue: 'EMPLOYEE',
    allowNull: false
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  businessType: {
    type: DataTypes.ENUM('BIBLES', 'VETEMENTS', 'CHAUSSURES', 'CUISINE', 'GENERAL'),
    allowNull: true,
    defaultValue: 'GENERAL'
  },
  employeeCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  locality: {
    type: DataTypes.STRING,
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      sales: true,
      inventory: true,
      clients: true,
      suppliers: true,
      expenses: true,
      invoices: true,
      cash: true,
      reports: true,
      appointments: true,
      credits: true,
      messages: true,
      employees: false
    }
  }
}, {
  timestamps: true,
  tableName: 'users',
  indexes: [
    { fields: ['username'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['businessId'] },
    { fields: ['employeeCode'], unique: true },
  ]
});

User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  if (user.role === 'EMPLOYEE' && !user.employeeCode) {
    const lastUser = await User.findOne({
      order: [['id', 'DESC']],
      where: { role: 'EMPLOYEE', businessId: user.businessId }
    });
    const nextNum = lastUser && lastUser.employeeCode
      ? parseInt(lastUser.employeeCode.replace('EMP-', '')) + 1
      : 1;
    user.employeeCode = `EMP-${String(nextNum).padStart(3, '0')}`;
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
