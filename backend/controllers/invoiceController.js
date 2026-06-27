const Invoice = require('../models/Invoice');

const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Invoice.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getInvoices:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, clientId, clientName, totalAmount, status, items, notes, dueDate } = req.body;
    if (!invoiceNumber || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Numéro de facture et montant requis' });
    }
    const invoice = await Invoice.create({
      invoiceNumber,
      clientId,
      clientName,
      totalAmount,
      status,
      items: typeof items === 'object' ? JSON.stringify(items) : items,
      notes,
      dueDate,
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: invoice, message: 'Facture créée' });
  } catch (error) {
    console.error('Erreur createInvoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    const { invoiceNumber, clientId, clientName, totalAmount, status, items, notes, dueDate } = req.body;
    await invoice.update({
      invoiceNumber, clientId, clientName, totalAmount, status,
      items: typeof items === 'object' ? JSON.stringify(items) : items,
      notes, dueDate
    });
    res.json({ success: true, data: invoice, message: 'Facture mise à jour' });
  } catch (error) {
    console.error('Erreur updateInvoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    }
    await invoice.destroy();
    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    console.error('Erreur deleteInvoice:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
};
