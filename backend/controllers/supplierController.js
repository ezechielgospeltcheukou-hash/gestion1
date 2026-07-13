const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const sequelize = require('../config/database');

const getSuppliers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Supplier.findAndCountAll({
      where: { isActive: true, businessId: req.user.businessId },
      order: [['name', 'ASC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getSuppliers:', error);
    next(error);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvÃ©' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Erreur getSupplierById:', error);
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
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
      createdBy: req.user.id,
      businessId: req.user.businessId
    });

    res.status(201).json({ success: true, data: supplier, message: 'Fournisseur crÃ©Ã©' });
  } catch (error) {
    console.error('Erreur createSupplier:', error);
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvÃ©' });
    }

    const { name, phone, whatsapp, address, email } = req.body;
    await supplier.update({ name, phone, whatsapp, address, email });
    res.json({ success: true, data: supplier, message: 'Fournisseur mis Ã  jour' });
  } catch (error) {
    console.error('Erreur updateSupplier:', error);
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvÃ©' });
    }

    await supplier.update({ isActive: false });
    res.json({ success: true, message: 'Fournisseur dÃ©sactivÃ© avec succÃ¨s' });
  } catch (error) {
    console.error('Erreur deleteSupplier:', error);
    next(error);
  }
};

const recordSupplierPayment = async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { supplierId, amount, paymentMethod, transactionReference, notes } = req.body;

    if (!supplierId || !amount) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Veuillez fournir fournisseur et montant' });
    }

    const supplier = await Supplier.findOne({ where: { id: supplierId, businessId: req.user.businessId }, transaction });
    if (!supplier) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Fournisseur non trouvÃ©' });
    }

    const payment = await SupplierPayment.create({
      supplierId,
      amount,
      paymentMethod: paymentMethod || 'EspÃ¨ces',
      transactionReference,
      notes,
      createdBy: req.user.id,
      businessId: req.user.businessId
    }, { transaction });

    const newBalance = parseFloat(supplier.balance) - parseFloat(amount);
    await supplier.update({ balance: newBalance }, { transaction });

    await transaction.commit();
    res.status(201).json({ success: true, data: payment, message: 'Paiement enregistrÃ©' });
  } catch (error) {
    if (transaction) await transaction.rollback().catch(() => {});
    console.error('Erreur recordSupplierPayment:', error);
    next(error);
  }
};

const getSupplierPayments = async (req, res, next) => {
  try {
    const payments = await SupplierPayment.findAll({
      where: { supplierId: req.params.supplierId, businessId: req.user.businessId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Erreur getSupplierPayments:', error);
    next(error);
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

