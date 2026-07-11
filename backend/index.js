const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];
if (!process.env.DATABASE_URL) {
  requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER');
}
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  logger.error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET === 'votre_cle_secrete_tres_longue_et_securisee_ici') {
  logger.warn('JWT_SECRET utilise la valeur par défaut. Changez-la en production!');
}

const app = express();

app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login-by-code', authLimiter);

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url !== '/health') {
      logger.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

const setupAssociations = require('./models/associations');
setupAssociations();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const clientRoutes = require('./routes/clientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const cashRoutes = require('./routes/cashRoutes');
const creditRoutes = require('./routes/creditRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');
const bilanRoutes = require('./routes/bilanRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/bilan', bilanRoutes);

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'API Comptabilite Backend is running!' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connexion a la base de donnees etablie');

    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('Modeles synchronises avec la base de donnees');
  } catch (error) {
    logger.error('Erreur de connexion a la base de donnees:', error.message);
    logger.warn('Le serveur va demarrer malgre tout, certaines routes peuvent echouer.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Serveur backend demarre sur le port ${PORT}`);
  });
};

startServer();

module.exports = app;
