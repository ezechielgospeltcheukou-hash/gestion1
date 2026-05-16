const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/database');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

const startServer = async () => {
  try {
    // ⬇️ petit délai pour Railway (TRÈS IMPORTANT)
    await new Promise(resolve => setTimeout(resolve, 5000));

    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données');

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
  }
};

startServer();