const User = require('../models/User');

const getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'EMPLOYEE' },
      attributes: { exclude: ['password'] }
    });
    res.json(employees);
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { username, email, password, phone, address, salary } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Veuillez fournir username et mot de passe' });
    }

    const userExists = await User.findOne({ where: { username } });

    if (userExists) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const employee = await User.create({
      username,
      email,
      password,
      phone,
      address,
      salary,
      role: 'EMPLOYEE'
    });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.status(201).json(employeeWithoutPassword);
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, address, salary, isActive } = req.body;

    const employee = await User.findByPk(id);

    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    await employee.update({
      username,
      email,
      phone,
      address,
      salary,
      isActive
    });

    const employeeWithoutPassword = { ...employee.get() };
    delete employeeWithoutPassword.password;

    res.json(employeeWithoutPassword);
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findByPk(id);

    if (!employee || employee.role !== 'EMPLOYEE') {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    await employee.destroy();
    res.json({ message: 'Employé supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteEmployee:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
