const User = require('../models/User');

const getEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: { businessId: req.user.businessId },
      attributes: { exclude: ['password'] },
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { username, email, password, phone, address, salary, locality, role, permissions } = req.body;

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
        return res.status(400).json({ success: false, message: 'Cet email est deja utilise' });
      }
    }

    const employee = await User.create({
      username,
      email: email || null,
      password,
      phone,
      address,
      salary,
      locality,
      role: role || 'EMPLOYEE',
      permissions: role === 'ADMIN'
        ? {
            sales: true, inventory: true, clients: true, suppliers: true,
            expenses: true, invoices: true, cash: true, reports: true,
            appointments: true, credits: true, messages: true, employees: true
          }
        : permissions,
      businessId: req.user.businessId
    });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.status(201).json({ success: true, data: employeeWithoutPassword, message: 'Employe ajoute avec succes' });
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      if (field === 'email') return res.status(400).json({ success: false, message: 'Cet email est deja utilise' });
      if (field === 'username') return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est deja utilise' });
    }
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, phone, address, salary, locality, isActive, role, permissions } = req.body;

    const employee = await User.findOne({ where: { id, businessId: req.user.businessId } });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }

    await employee.update({
      username,
      email,
      phone,
      address,
      salary,
      locality,
      isActive,
      role,
      permissions: role === 'ADMIN'
        ? {
            sales: true, inventory: true, clients: true, suppliers: true,
            expenses: true, invoices: true, cash: true, reports: true,
            appointments: true, credits: true, messages: true, employees: true
          }
        : permissions
    });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.json({ success: true, data: employeeWithoutPassword, message: 'Employe mis a jour' });
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await User.findOne({ where: { id, businessId: req.user.businessId } });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }

    await employee.destroy();
    res.json({ success: true, message: 'Utilisateur supprime avec succes' });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    next(error);
  }
};

const resetEmployeeCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await User.findOne({ where: { id, businessId: req.user.businessId } });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
    }

    const lastUser = await User.findOne({
      order: [['id', 'DESC']],
      where: { role: 'EMPLOYEE' }
    });
    const nextNum = lastUser && lastUser.employeeCode
      ? parseInt(lastUser.employeeCode.replace('EMP-', '')) + 1
      : 1;
    const newCode = `EMP-${String(nextNum).padStart(3, '0')}`;

    await employee.update({ employeeCode: newCode });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.json({
      success: true,
      data: employeeWithoutPassword,
      message: `Nouveau code genere: ${newCode}`
    });
  } catch (error) {
    console.error('Erreur resetEmployeeCode:', error);
    next(error);
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee, resetEmployeeCode };
