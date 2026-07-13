const Appointment = require('../models/Appointment');

const getAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Appointment.findAndCountAll({
      where: { businessId: req.user.businessId },
      order: [['date', 'ASC']],
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getAppointments:', error);
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
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
      createdBy: req.user?.id,
      businessId: req.user.businessId
    });
    res.status(201).json({ success: true, data: appointment, message: 'Rendez-vous crÃ©Ã©' });
  } catch (error) {
    console.error('Erreur createAppointment:', error);
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvÃ©' });
    }
    const { title, description, date, time, clientId, clientName, status } = req.body;
    await appointment.update({ title, description, date, time, clientId, clientName, status });
    res.json({ success: true, data: appointment, message: 'Rendez-vous mis Ã  jour' });
  } catch (error) {
    console.error('Erreur updateAppointment:', error);
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ where: { id: req.params.id, businessId: req.user.businessId } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvÃ©' });
    }
    await appointment.destroy();
    res.json({ success: true, message: 'Rendez-vous supprimÃ©' });
  } catch (error) {
    console.error('Erreur deleteAppointment:', error);
    next(error);
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
};

