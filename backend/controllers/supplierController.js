const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const sequelize = require('../config/database');

const getSuppliers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Supplier.findAndCountAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getSuppliers:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erreur getSupplierById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, phone, whatsapp, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir le nom du fournisseur' });
    }

    const supplier = await Supplier.create({
      name,
      phone,
      whatsapp,
      address,
      email,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: supplier, message: 'Fournisseur créé' });
  } catch (error) {
    console.error('Erreur createSupplier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    const { name, phone, whatsapp, address, email } = req.body;
    await supplier.update({ name, phone, whatsapp, address, email });
    res.json({ success: true, data: supplier, message: 'Fournisseur mis à jour' });
  } catch (error) {
    console.error('Erreur updateSupplier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    await supplier.update({ isActive: false });
    res.json({ success: true, message: 'Fournisseur désactivé avec succès' });
  } catch (error) {
    console.error('Erreur deleteSupplier:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const recordSupplierPayment = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { supplierId, amount, paymentMethod, transactionReference, notes } = req.body;

    if (!supplierId || !amount) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Veuillez fournir fournisseur et montant' });
    }

    const supplier = await Supplier.findByPk(supplierId, { transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
    }

    const payment = await SupplierPayment.create({
      supplierId,
      amount,
      paymentMethod: paymentMethod || 'Espèces',
      transactionReference,
      notes,
      createdBy: req.user.id
    }, { transaction });

    const newBalance = parseFloat(supplier.balance) - parseFloat(amount);
    await supplier.update({ balance: newBalance }, { transaction });

    await transaction.commit();
    res.status(201).json({ success: true, data: payment, message: 'Paiement enregistré' });
  } catch (error) {
    if (transaction) await transaction.rollback().catch(() => {});
    console.error('Erreur recordSupplierPayment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getSupplierPayments = async (req, res) => {
  try {
    const payments = await SupplierPayment.findAll({
      where: { supplierId: req.params.supplierId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Erreur getSupplierPayments:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment,
  getSupplierPayments
};
