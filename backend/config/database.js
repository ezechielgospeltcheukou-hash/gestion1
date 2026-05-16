const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Environment variables:');
console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  - DB_HOST:', process.env.DB_HOST);
console.log('  - DB_PORT:', process.env.DB_PORT);
console.log('  - DB_NAME:', process.env.DB_NAME);
console.log('  - DB_USER:', process.env.DB_USER);

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('✅ Using DATABASE_URL');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (process.env.DB_HOST) {
  console.log('✅ Using individual DB_* variables');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
} else {
  console.log('❌ No database configuration found!');
  console.log('   Please set either DATABASE_URL or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  throw new Error('No database configuration found');
}

module.exports = sequelize;