const Message = require('../models/Message');
const User = require('../models/User');

const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const userIds = [...new Set(messages.flatMap(m => [m.fromUserId, m.toUserId]))];
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'username'] });
    const userMap = new Map(users.map(u => [u.id, u.username]));

    const messagesWithNames = messages.map(msg => ({
      ...msg.toJSON(),
      fromUserName: userMap.get(msg.fromUserId) || 'Utilisateur inconnu',
      toUserName: userMap.get(msg.toUserId) || 'Utilisateur inconnu'
    }));

    res.json({ success: true, data: messagesWithNames, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getMessages:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createMessage = async (req, res) => {
  try {
    const { toUserId, content } = req.body;
    if (!toUserId || !content) {
      return res.status(400).json({ success: false, message: 'Destinataire et contenu requis' });
    }
    const message = await Message.create({
      fromUserId: req.user?.id,
      toUserId,
      content
    });
    res.status(201).json({ success: true, data: message, message: 'Message envoyé' });
  } catch (error) {
    console.error('Erreur createMessage:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message non trouvé' });
    }
    await message.destroy();
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur deleteMessage:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getMessages,
  createMessage,
  deleteMessage
};
