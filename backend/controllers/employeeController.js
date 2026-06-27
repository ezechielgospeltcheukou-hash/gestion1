const User = require('../models/User');

const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit,
      offset
    });
    res.json({ success: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { username, email, password, phone, address, salary, locality, role, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir username et mot de passe' });
    }

    const userExists = await User.findOne({ where: { username } });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Cet utilisateur existe déjà' });
    }

    const employee = await User.create({
      username,
      email,
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
        : permissions
    });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.status(201).json({ success: true, data: employeeWithoutPassword, message: 'Employé ajouté avec succès' });
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, address, salary, locality, isActive, role, permissions } = req.body;

    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
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

    res.json({ success: true, data: employeeWithoutPassword, message: 'Employé mis à jour' });
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    await employee.destroy();
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const resetEmployeeCode = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Generate new unique code
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
      message: `Nouveau code généré: ${newCode}` 
    });
  } catch (error) {
    console.error('Erreur resetEmployeeCode:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee, resetEmployeeCode };
