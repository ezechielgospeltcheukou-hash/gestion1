const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const clientRoutes = require('./routes/clientRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clients', clientRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Comptabilité Backend is running!' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
  }
};

startServer();

module.exports = app;
