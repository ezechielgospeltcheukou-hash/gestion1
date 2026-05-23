const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Comptabilité Backend is running!' });
});

const PORT = process.env.PORT || 8081;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
});

module.exports = app;
