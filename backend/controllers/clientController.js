const Client = require('../models/Client');

const getClients = async (req, res, next) => {
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
    next(error);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvÃ©' });
    }
    res.json({ success: true, data: client });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createClient = async (req, res, next) => {
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
    res.status(201).json({ success: true, data: client, message: 'Client crÃ©Ã©' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvÃ©' });
    }
    const { name, phone, whatsapp, address, email, notes } = req.body;
    await client.update({ name, phone, whatsapp, address, email, notes });
    res.json({ success: true, data: client, message: 'Client mis Ã  jour' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvÃ©' });
    }
    await client.update({ isActive: false });
    res.json({ success: true, message: 'Client dÃ©sactivÃ©' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};

