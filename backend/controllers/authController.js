const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, businessName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir username et mot de passe' });
    }

    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est deja utilise' });
    }

    if (email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Cet email est deja utilise par un autre compte' });
      }
    }

    const user = await User.create({
      username,
      email: email || null,
      password,
      businessName,
      role: 'ADMIN',
      permissions: {
        sales: true, inventory: true, clients: true, suppliers: true,
        expenses: true, invoices: true, cash: true, reports: true,
        appointments: true, credits: true, messages: true, employees: true
      }
    });

    user.businessId = user.id;
    await user.save();

    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      data: { ...userWithoutPassword, token: generateToken(user.id) },
      message: 'Inscription reussie'
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      if (field === 'email') return res.status(400).json({ success: false, message: 'Cet email est deja utilise' });
      if (field === 'username') return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est deja utilise' });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (user && (await user.comparePassword(password)) && user.isActive) {
      const userWithoutPassword = { ...user.get() };
      delete userWithoutPassword.password;

      res.json({
        success: true,
        data: { ...userWithoutPassword, token: generateToken(user.id) },
        message: 'Connexion reussie'
      });
    } else {
      res.status(401).json({ success: false, message: 'Identifiants invalides ou compte desactive' });
    }

  } catch (error) {
    console.error('Erreur connexion:', error);
    next(error);
  }
};

const loginByCode = async (req, res, next) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir le code et le mot de passe' });
    }

    const user = await User.findOne({ where: { employeeCode: employeeCode.toUpperCase() } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Code employe invalide' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Votre compte a ete desactive. Contactez l\'administrateur.' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }

    const userWithoutPassword = { ...user.get() };
    delete userWithoutPassword.password;

    res.json({
      success: true,
      data: { ...userWithoutPassword, token: generateToken(user.id) },
      message: 'Connexion reussie'
    });

  } catch (error) {
    console.error('Erreur loginByCode:', error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Erreur getMe:', error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, email, phone, address, locality, salary, businessName } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
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

    res.json({ success: true, data: userWithoutPassword, message: 'Profil mis a jour' });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token requis' });
    }

    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    const newToken = generateToken(user.id);
    await user.update({ refreshToken: refreshToken });

    res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    console.error('Erreur refreshToken:', error);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.update({ refreshToken: null }, { where: { id: req.user.id } });
    res.json({ success: true, message: 'Deconnexion reussie' });
  } catch (error) {
    console.error('Erreur logout:', error);
    next(error);
  }
};

module.exports = { register, login, loginByCode, getMe, updateProfile, refreshToken, logout };
