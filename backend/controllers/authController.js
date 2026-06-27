const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, businessName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir username et mot de passe' });
    }

    const userExists = await User.findOne({ where: { username } });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Cet utilisateur existe déjà' });
    }

    const user = await User.create({
      username,
      email,
      password,
      businessName,
      role: 'ADMIN',
      permissions: { 
        sales: true, inventory: true, clients: true, suppliers: true, 
        expenses: true, invoices: true, cash: true, reports: true, 
        appointments: true, credits: true, messages: true, employees: true 
      }
    });

    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      data: {
        ...userWithoutPassword,
        token: generateToken(user.id)
      },
      message: 'Inscription réussie'
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (user && (await user.comparePassword(password)) && user.isActive) {
      const userWithoutPassword = { ...user.get() };
      delete userWithoutPassword.password;
      
      res.json({
        success: true,
        data: {
          ...userWithoutPassword,
          token: generateToken(user.id)
        },
        message: 'Connexion réussie'
      });
    } else {
      res.status(401).json({ success: false, message: 'Identifiants invalides ou compte désactivé' });
    }

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const loginByCode = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir le code et le mot de passe' });
    }

    const user = await User.findOne({ where: { employeeCode: employeeCode.toUpperCase() } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Code employé invalide' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Votre compte a été désactivé. Contactez l\'administrateur.' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }

    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      data: {
        ...userWithoutPassword,
        token: generateToken(user.id)
      },
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('Erreur loginByCode:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email, phone, address, locality, salary, businessName } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    await user.update({
      username: username || user.username,
      email: email !== undefined ? email : user.email,
      phone: phone !== undefined ? phone : user.phone,
      address: address !== undefined ? address : user.address,
      locality: locality !== undefined ? locality : user.locality,
      salary: salary !== undefined ? salary : user.salary,
      businessName: businessName !== undefined ? businessName : user.businessName,
    });

    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;

    res.json({ success: true, data: userWithoutPassword, message: 'Profil mis à jour' });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { register, login, loginByCode, getMe, updateProfile };
