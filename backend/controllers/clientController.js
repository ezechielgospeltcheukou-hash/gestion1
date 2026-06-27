const Client = require('../models/Client');

const getClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Client.findAndCountAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des clients' });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du client' });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, phone, whatsapp, address, email, notes } = req.body;
    const client = await Client.create({
      name,
      phone,
      whatsapp,
      address,
      email,
      notes,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: client, message: 'Client créé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du client' });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    const { name, phone, whatsapp, address, email, notes } = req.body;
    await client.update({ name, phone, whatsapp, address, email, notes });
    res.json({ success: true, data: client, message: 'Client mis à jour' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du client' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }
    await client.update({ isActive: false });
    res.json({ success: true, message: 'Client désactivé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du client' });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};
