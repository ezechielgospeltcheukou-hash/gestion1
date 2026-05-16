const Client = require('../models/Client');

const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des clients' });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du client' });
  }
};

const createClient = async (req, res) => {
  try {
    const client = await Client.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du client' });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    await client.update(req.body);
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du client' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    await client.update({ isActive: false });
    res.json({ message: 'Client désactivé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du client' });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
