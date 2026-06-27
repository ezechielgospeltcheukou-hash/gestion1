const Credit = require('../models/Credit');
const Client = require('../models/Client');
const Supplier = require('../models/Supplier');

const getCredits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: credits } = await Credit.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const clientIds = credits.filter(c => c.personType === 'CLIENT').map(c => c.personId);
    const supplierIds = credits.filter(c => c.personType === 'SUPPLIER').map(c => c.personId);

    const clients = clientIds.length ? await Client.findAll({ where: { id: clientIds }, attributes: ['id', 'name'] }) : [];
    const suppliers = supplierIds.length ? await Supplier.findAll({ where: { id: supplierIds }, attributes: ['id', 'name'] }) : [];

    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    const creditsWithNames = credits.map(credit => ({
      ...credit.toJSON(),
      personName: credit.personType === 'CLIENT'
        ? (clientMap.get(credit.personId) || 'Client inconnu')
        : (supplierMap.get(credit.personId) || 'Fournisseur inconnu')
    }));

    res.json({ success: true, data: creditsWithNames, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getCredits:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createCredit = async (req, res) => {
  try {
    const { personId, personType, amount, description } = req.body;
    if (!personId || !personType || !amount) {
      return res.status(400).json({ success: false, message: 'Données requises' });
    }
    const credit = await Credit.create({
      personId,
      personType,
      amount,
      description,
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: credit, message: 'Crédit créé' });
  } catch (error) {
    console.error('Erreur createCredit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateCredit = async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) {
      return res.status(404).json({ success: false, message: 'Crédit non trouvé' });
    }
    const { isRepaid, repaidAt } = req.body;
    await credit.update({ isRepaid, repaidAt });
    res.json({ success: true, data: credit, message: 'Crédit mis à jour' });
  } catch (error) {
    console.error('Erreur updateCredit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteCredit = async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) {
      return res.status(404).json({ success: false, message: 'Crédit non trouvé' });
    }
    await credit.destroy();
    res.json({ success: true, message: 'Crédit supprimé' });
  } catch (error) {
    console.error('Erreur deleteCredit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getCredits,
  createCredit,
  updateCredit,
  deleteCredit
};
