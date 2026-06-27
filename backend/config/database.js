const { Sequelize } = require('sequelize');
require('dotenv').config();

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const {
    DB_USER = 'postgres',
    DB_PASSWORD = '',
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_NAME = 'comptabilite_db'
  } = process.env;

  if (!DB_USER || !DB_HOST || !DB_PORT || !DB_NAME) {
    throw new Error('Missing database configuration. Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER.');
  }

  return `postgres://${DB_USER}:${DB_PASSWORD ? encodeURIComponent(DB_PASSWORD) : ''}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

const connectionString = getDatabaseUrl();

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: process.env.DATABASE_URL && process.env.DATABASE_URL !== ''
    ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
    : process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : undefined
});

module.exports = sequelize;