const Appointment = require('../models/Appointment');

const getAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Appointment.findAndCountAll({
      order: [['date', 'ASC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getAppointments:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { title, description, date, time, clientId, clientName, status } = req.body;
    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Titre et date requis' });
    }
    const appointment = await Appointment.create({
      title,
      description,
      date,
      time,
      clientId,
      clientName,
      status,
      createdBy: req.user?.id
    });
    res.status(201).json({ success: true, data: appointment, message: 'Rendez-vous créé' });
  } catch (error) {
    console.error('Erreur createAppointment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    }
    const { title, description, date, time, clientId, clientName, status } = req.body;
    await appointment.update({ title, description, date, time, clientId, clientName, status });
    res.json({ success: true, data: appointment, message: 'Rendez-vous mis à jour' });
  } catch (error) {
    console.error('Erreur updateAppointment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    }
    await appointment.destroy();
    res.json({ success: true, message: 'Rendez-vous supprimé' });
  } catch (error) {
    console.error('Erreur deleteAppointment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
