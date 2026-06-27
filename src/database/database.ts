import * as SQLite from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

let db: SQLite.SQLiteDatabase;

const getDB = () => {
  if (!db) {
    db = SQLite.openDatabaseSync('accounting.db');
  }
  return db;
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5000;

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
};

const setCached = <T>(key: string, data: T) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  purchase_price: number;
  stock: number;
  category: string;
}

export interface Sale {
  id: number;
  product_id: number;
  quantity: number;
  total_price: number;
  purchase_price_at_sale: number;
  payment_method: string;
  sale_date: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Credit {
  id: number;
  person_id: number;
  amount: number;
  date: string;
  is_repaid: number;
  type: 'CLIENT' | 'SUPPLIER';
  description: string;
}

export interface CashTransaction {
  id: number;
  amount: number;
  type: 'IN' | 'OUT';
  date: string;
  description: string;
}

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface UserPermissions {
  can_view_sales: boolean;
  can_create_sales: boolean;
  can_delete_sales: boolean;
  can_view_products: boolean;
  can_create_products: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_view_expenses: boolean;
  can_create_expenses: boolean;
  can_edit_expenses: boolean;
  can_delete_expenses: boolean;
  can_view_reports: boolean;
  can_view_clients: boolean;
  can_manage_clients: boolean;
  can_view_suppliers: boolean;
  can_manage_suppliers: boolean;
  can_view_cash: boolean;
  can_manage_cash: boolean;
  can_view_credits: boolean;
  can_manage_credits: boolean;
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: UserPermissions = {
  can_view_sales: true,
  can_create_sales: true,
  can_delete_sales: false,
  can_view_products: true,
  can_create_products: false,
  can_edit_products: false,
  can_delete_products: false,
  can_view_expenses: false,
  can_create_expenses: false,
  can_edit_expenses: false,
  can_delete_expenses: false,
  can_view_reports: false,
  can_view_clients: true,
  can_manage_clients: false,
  can_view_suppliers: false,
  can_manage_suppliers: false,
  can_view_cash: false,
  can_manage_cash: false,
  can_view_credits: false,
  can_manage_credits: false,
};

export const ADMIN_PERMISSIONS: UserPermissions = {
  can_view_sales: true,
  can_create_sales: true,
  can_delete_sales: true,
  can_view_products: true,
  can_create_products: true,
  can_edit_products: true,
  can_delete_products: true,
  can_view_expenses: true,
  can_create_expenses: true,
  can_edit_expenses: true,
  can_delete_expenses: true,
  can_view_reports: true,
  can_view_clients: true,
  can_manage_clients: true,
  can_view_suppliers: true,
  can_manage_suppliers: true,
  can_view_cash: true,
  can_manage_cash: true,
  can_view_credits: true,
  can_manage_credits: true,
};

export interface User {
  id: number;
  username: string;
  password?: string;
  business_name?: string;
  role: UserRole;
  phone?: string;
  email?: string;
  avatar?: string;
  is_active: number;
  created_at?: string;
  permissions?: string;
  salary?: number;
}

export interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  content: string;
  is_read: number;
  created_at: string;
}



export const getCurrency = (): string => {
  try {
    const setting = getDB().getFirstSync<Setting>('SELECT * FROM settings WHERE key = ?', ['currency']);
    return setting?.value ?? '€';
  } catch (error) {
    console.error('getCurrency error:', error);
    return '€';
  }
};

export const updateSetting = (key: string, value: string) => {
  getDB().runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

export const getSetting = (key: string): string | null => {
  try {
    const setting = getDB().getFirstSync<Setting>('SELECT * FROM settings WHERE key = ?', [key]);
    return setting?.value ?? null;
  } catch (error) {
    console.error('getSetting error:', error);
    return null;
  }
};

export const getAllSettings = (): Record<string, string> => {
  try {
    const settings = getDB().getAllSync<Setting>('SELECT * FROM settings');
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  } catch (error) {
    console.error('getAllSettings error:', error);
    return {};
  }
};

const generateSalt = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
};

const hashPINLegacy = (pin: string, salt: string): string => {
  let hash = 0;
  const combined = pin + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hash2 = combined.split('').reduce((acc, char, idx) => {
    return acc + (char.charCodeAt(0) * Math.pow(31, idx));
  }, 0);
  return Math.abs(hash * hash2).toString(36) + salt;
};

const hashPINSecure = async (pin: string): Promise<string> => {
  const salt = generateSalt();
  const iterations = 10000;
  const keyLength = 64;
  const combined = pin + salt;
  let hashArray = new Uint8Array(keyLength);
  for (let i = 0; i < keyLength; i++) {
    hashArray[i] = combined.charCodeAt(i % combined.length);
  }
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < keyLength; i++) {
      hashArray[i] = (hashArray[i] * 31 + combined.charCodeAt((i + iter) % combined.length)) & 0xff;
    }
  }
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return `v2:${salt}:${hashHex}`;
};

const verifyPIN = async (pin: string, hashedPin: string, salt: string): Promise<boolean> => {
  if (hashedPin.startsWith('v2:')) {
    const [, storedSalt, storedHash] = hashedPin.split(':');
    const iterations = 10000;
    const keyLength = 64;
    const combined = pin + storedSalt;
    let hashArray = new Uint8Array(keyLength);
    for (let i = 0; i < keyLength; i++) {
      hashArray[i] = combined.charCodeAt(i % combined.length);
    }
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < keyLength; i++) {
        hashArray[i] = (hashArray[i] * 31 + combined.charCodeAt((i + iter) % combined.length)) & 0xff;
      }
    }
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === storedHash;
  }
  return hashPINLegacy(pin, salt) === hashedPin;
};

export const registerUser = async (username: string, pin: string, businessName: string) => {
  const database = getDB();
  const hashedPIN = await hashPINSecure(pin);
  database.runSync(
    'INSERT INTO users (username, password, business_name) VALUES (?, ?, ?)',
    [username, hashedPIN, businessName]
  );
  updateSetting('shopName', businessName);
};

export const loginUser = async (pin: string, username?: string, userId?: number) => {
  const database = getDB();
  let user: User | null;
  
  if (userId) {
    user = database.getFirstSync<User>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  } else if (username) {
    user = database.getFirstSync<User>('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  } else {
    user = database.getFirstSync<User>('SELECT * FROM users LIMIT 1');
  }
  
  if (!user) {
    await registerUser('admin', '0000', 'Comptabilité Chrétiens');
    user = database.getFirstSync<User>('SELECT * FROM users LIMIT 1');
    if (!user) return null;
  }
  
  if (!user.password) return null;
  
  if (user.is_active === 0) {
    return null;
  }
  
  if (user.password.includes(':')) {
    const parts = user.password.split(':');
    const hashedPIN = parts[0];
    const salt = parts.slice(1).join(':');
    if (!hashedPIN || !salt) return null;
    if (await verifyPIN(pin, user.password, salt)) {
      updateSetting('currentUserId', user.id.toString());
      if (!user.password.startsWith('v2:')) {
        const newHash = await hashPINSecure(pin);
        database.runSync('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      }
      return { id: user.id, username: user.username, business_name: user.business_name, role: user.role, email: user.email };
    }
  } else {
    if (user.password === pin) {
      const newHash = await hashPINSecure(pin);
      database.runSync('UPDATE users SET password = ? WHERE id = ?', [newHash, user.id]);
      updateSetting('currentUserId', user.id.toString());
      return { id: user.id, username: user.username, business_name: user.business_name, role: user.role || 'ADMIN', email: user.email };
    }
  }
  return null;
};

export const getUser = () => {
  try {
    const database = getDB();
    const currentUserId = getSetting('currentUserId');
    if (currentUserId) {
      return database.getFirstSync<User>('SELECT * FROM users WHERE id = ? LIMIT 1', [parseInt(currentUserId)]);
    }
    return database.getFirstSync<User>('SELECT * FROM users LIMIT 1');
  } catch (error) {
    console.error('getUser error:', error);
    return null;
  }
};

export const getUsers = (): User[] => {
  try {
    const database = getDB();
    const users = database.getAllSync<User>('SELECT * FROM users ORDER BY username ASC');
    return users;
  } catch (error) {
    console.error('getUsers error:', error);
    return [];
  }
};

export const isUserRegistered = () => {
  const database = getDB();
  const user = database.getFirstSync<User>('SELECT COUNT(*) as count FROM users');
  return (user as any)?.count > 0;
};

export const updateCurrency = (newCurrency: string) => {
  getDB().runSync('UPDATE settings SET value = ? WHERE key = ?', [newCurrency, 'currency']);
};

export const getProducts = (searchQuery: string = '', limit: number = 100, offset: number = 0): Product[] => {
  const cacheKey = `products_${searchQuery}_${limit}_${offset}`;
  const cached = getCached<Product[]>(cacheKey);
  if (cached) return cached;

  const database = getDB();
  let products: Product[];
  
  if (searchQuery) {
    products = database.getAllSync<Product>(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?',
      [`%${searchQuery}%`, `%${searchQuery}%`, limit, offset]
    );
  } else {
    products = database.getAllSync<Product>(
      'SELECT * FROM products ORDER BY name ASC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }
  
  setCached(cacheKey, products);
  return products;
};

export const getLowStockCount = (limit: number = 5): number => {
  const result = getDB().getFirstSync<{ count: number | null }>(
    'SELECT COUNT(*) as count FROM products WHERE stock < ?',
    [limit]
  );
  return result?.count ?? 0;
};

export const addProduct = (name: string, description: string, price: number, purchasePrice: number, stock: number, category: string = 'Général') => {
  getDB().runSync(
    'INSERT INTO products (name, description, price, purchase_price, stock, category) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, purchasePrice, stock, category]
  );
  clearCache('products');
};

export const updateProduct = (id: number, name: string, description: string, price: number, purchasePrice: number, stock: number, category: string = 'Général') => {
  getDB().runSync(
    'UPDATE products SET name = ?, description = ?, price = ?, purchase_price = ?, stock = ?, category = ? WHERE id = ?',
    [name, description, price, purchasePrice, stock, category, id]
  );
  clearCache('products');
};

export const deleteProduct = (id: number) => {
  getDB().runSync('DELETE FROM products WHERE id = ?', [id]);
  clearCache('products');
};

export const adjustStock = (id: number, quantity: number) => {
  getDB().runSync('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, id]);
  clearCache('products');
};

export const recordSale = (productId: number, quantity: number, totalPrice: number, purchasePriceAtSale: number, paymentMethod: string = 'Espèces') => {
  const database = getDB();
  const currentUser = getUser();
  database.withTransactionSync(() => {
    database.runSync(
      'INSERT INTO sales (product_id, quantity, total_price, purchase_price_at_sale, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, quantity, totalPrice, purchasePriceAtSale, paymentMethod, currentUser?.id || null]
    );
    database.runSync('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId]);
  });
  clearCache('sales');
  clearCache('products');
  clearCache('stats');
  logActivity('CREATE_SALE', 'SALE', undefined, `Vente enregistrée par ${currentUser?.username}`);
};

export const deleteSale = (id: number) => {
  const database = getDB();
  const sale = database.getFirstSync<Sale>('SELECT * FROM sales WHERE id = ?', [id]);
  if (sale) {
    database.withTransactionSync(() => {
      database.runSync('UPDATE products SET stock = stock + ? WHERE id = ?', [sale.quantity, sale.product_id]);
      database.runSync('DELETE FROM sales WHERE id = ?', [id]);
    });
  }
  clearCache('sales');
  clearCache('products');
  clearCache('stats');
};

export const getSales = (limit: number = 100, offset: number = 0): Sale[] => {
  const cacheKey = `sales_${limit}_${offset}`;
  const cached = getCached<Sale[]>(cacheKey);
  if (cached) return cached;

  const sales = getDB().getAllSync<Sale>(
    'SELECT * FROM sales ORDER BY sale_date DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  setCached(cacheKey, sales);
  return sales;
};

export const addExpense = (description: string, amount: number, category: string, date?: string) => {
  if (date) {
    getDB().runSync(
      'INSERT INTO expenses (description, amount, category, expense_date) VALUES (?, ?, ?, ?)',
      [description, amount, category, date]
    );
  } else {
    getDB().runSync(
      'INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)',
      [description, amount, category]
    );
  }
  clearCache('expenses');
  clearCache('stats');
};

export const updateExpense = (id: number, description: string, amount: number, category: string, date: string) => {
  getDB().runSync(
    'UPDATE expenses SET description = ?, amount = ?, category = ?, expense_date = ? WHERE id = ?',
    [description, amount, category, date, id]
  );
  clearCache('expenses');
  clearCache('stats');
};

export const deleteExpense = (id: number) => {
  getDB().runSync('DELETE FROM expenses WHERE id = ?', [id]);
  clearCache('expenses');
  clearCache('stats');
};

export const getExpenses = (limit: number = 100, offset: number = 0): Expense[] => {
  const cacheKey = `expenses_${limit}_${offset}`;
  const cached = getCached<Expense[]>(cacheKey);
  if (cached) return cached;

  const expenses = getDB().getAllSync<Expense>(
    'SELECT * FROM expenses ORDER BY expense_date DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  setCached(cacheKey, expenses);
  return expenses;
};

const getDateFilterSQL = (filter: string, dateColumn: string) => {
  switch (filter) {
    case 'TODAY':
      return `DATE(${dateColumn}) = DATE('now')`;
    case 'WEEK':
      return `${dateColumn} >= DATE('now', '-7 days')`;
    case 'MONTH':
      return `${dateColumn} >= DATE('now', 'start of month')`;
    case 'YEAR':
      return `${dateColumn} >= DATE('now', 'start of year')`;
    default:
      return '1=1';
  }
};

export const getStats = (dateFilter: string = 'ALL') => {
  try {
    const cacheKey = `stats_${dateFilter}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const database = getDB();
    const salesSQL = `SELECT SUM(total_price) as total_revenue, SUM(purchase_price_at_sale * quantity) as total_purchase_cost, COUNT(*) as total_sales FROM sales WHERE ${getDateFilterSQL(dateFilter, 'sale_date')}`;
    const expensesSQL = `SELECT SUM(amount) as total_expenses FROM expenses WHERE ${getDateFilterSQL(dateFilter, 'expense_date')}`;

    const salesResult = database.getFirstSync<{ total_revenue: number | null, total_purchase_cost: number | null, total_sales: number | null }>(salesSQL);
    const expensesResult = database.getFirstSync<{ total_expenses: number | null }>(expensesSQL);

    const revenue = salesResult?.total_revenue ?? 0;
    const purchaseCost = salesResult?.total_purchase_cost ?? 0;
    const salesCount = salesResult?.total_sales ?? 0;
    const expenses = expensesResult?.total_expenses ?? 0;

    const stats = {
      revenue,
      purchaseCost,
      grossProfit: revenue - purchaseCost,
      expenses,
      netProfit: (revenue - purchaseCost) - expenses,
      salesCount
    };

    setCached(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error('getStats error:', error);
    return {
      revenue: 0,
      purchaseCost: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
      salesCount: 0
    };
  }
};

export const getStockCount = () => {
  const result = getDB().getFirstSync<{ total_stock: number | null, total_stock_value: number | null }>(
    'SELECT SUM(stock) as total_stock, SUM(stock * purchase_price) as total_stock_value FROM products'
  );
  return {
    total_stock: result?.total_stock ?? 0,
    total_stock_value: result?.total_stock_value ?? 0
  };
};

export const getClients = (search: string = ''): Client[] => {
  if (search) {
    return getDB().getAllSync<Client>('SELECT * FROM clients WHERE name LIKE ? ORDER BY name ASC', [`%${search}%`]);
  }
  return getDB().getAllSync<Client>('SELECT * FROM clients ORDER BY name ASC');
};

export const addClient = (name: string, phone: string, address: string) => {
  getDB().runSync('INSERT INTO clients (name, phone, address) VALUES (?, ?, ?)', [name, phone, address]);
};

export const getSuppliers = (search: string = ''): Supplier[] => {
  if (search) {
    return getDB().getAllSync<Supplier>('SELECT * FROM suppliers WHERE name LIKE ? ORDER BY name ASC', [`%${search}%`]);
  }
  return getDB().getAllSync<Supplier>('SELECT * FROM suppliers ORDER BY name ASC');
};

export const addSupplier = (name: string, phone: string, address: string) => {
  getDB().runSync('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [name, phone, address]);
};

export const getCredits = (type: 'CLIENT' | 'SUPPLIER'): Credit[] => {
  return getDB().getAllSync<Credit>('SELECT * FROM credits WHERE type = ? ORDER BY date DESC', [type]);
};

export const addCredit = (personId: number, amount: number, type: 'CLIENT' | 'SUPPLIER', description: string) => {
  getDB().runSync('INSERT INTO credits (person_id, amount, type, description) VALUES (?, ?, ?, ?)', [personId, amount, type, description]);
};

export const markCreditRepaid = (id: number) => {
  getDB().runSync('UPDATE credits SET is_repaid = 1 WHERE id = ?', [id]);
};

export const getCashBalance = (): number => {
  const result = getDB().getFirstSync<{ balance: number | null }>(
    "SELECT (SUM(CASE WHEN type = 'IN' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'OUT' THEN amount ELSE 0 END)) as balance FROM cash_transactions"
  );
  return result?.balance ?? 0;
};

export const addCashTransaction = (amount: number, type: 'IN' | 'OUT', description: string) => {
  getDB().runSync('INSERT INTO cash_transactions (amount, type, description) VALUES (?, ?, ?)', [amount, type, description]);
};

export const getCashTransactions = (): CashTransaction[] => {
  return getDB().getAllSync<CashTransaction>('SELECT * FROM cash_transactions ORDER BY date DESC');
};

export const getDetailedReport = (dateFilter: string = 'ALL') => {
  const stats = getStats(dateFilter);
  const database = getDB();
  const dateSQL = getDateFilterSQL(dateFilter, 'date');
  
  const creditsClient = database.getFirstSync<{ total: number | null }>(`SELECT SUM(amount) as total FROM credits WHERE type = "CLIENT" AND is_repaid = 0 AND ${dateSQL}`);
  const creditsSupplier = database.getFirstSync<{ total: number | null }>(`SELECT SUM(amount) as total FROM credits WHERE type = "SUPPLIER" AND is_repaid = 0 AND ${dateSQL}`);
  const cashBalance = getCashBalance();

  const expenseBreakdown = database.getAllSync<{ category: string, total: number }>(
    `SELECT category, SUM(amount) as total FROM expenses WHERE ${getDateFilterSQL(dateFilter, 'expense_date')} GROUP BY category ORDER BY total DESC`
  );

  const topProducts = database.getAllSync<{ name: string, quantity: number }>(
    `SELECT p.name, SUM(s.quantity) as quantity 
     FROM sales s 
     JOIN products p ON s.product_id = p.id 
     WHERE ${getDateFilterSQL(dateFilter, 's.sale_date')} 
     GROUP BY s.product_id 
     ORDER BY quantity DESC 
     LIMIT 5`
  );

  const dailySales = database.getAllSync<{ date: string, total: number }>(
    `SELECT DATE(sale_date) as date, SUM(total_price) as total 
     FROM sales 
     WHERE sale_date >= DATE('now', '-7 days') 
     GROUP BY DATE(sale_date) 
     ORDER BY date ASC`
  );
  
  return {
    ...stats,
    creditsClient: creditsClient?.total ?? 0,
    creditsSupplier: creditsSupplier?.total ?? 0,
    cashBalance,
    expenseBreakdown,
    topProducts,
    dailySales
  };
};

export const exportData = () => {
  const database = getDB();
  const products = database.getAllSync<Product>('SELECT * FROM products');
  const sales = database.getAllSync<Sale>('SELECT * FROM sales');
  const expenses = database.getAllSync<Expense>('SELECT * FROM expenses');
  const clients = database.getAllSync<Client>('SELECT * FROM clients');
  const suppliers = database.getAllSync<Supplier>('SELECT * FROM suppliers');
  const credits = database.getAllSync<Credit>('SELECT * FROM credits');
  const cash_transactions = database.getAllSync<CashTransaction>('SELECT * FROM cash_transactions');
  const settings = database.getAllSync<Setting>('SELECT * FROM settings');

  return JSON.stringify({
    version: '1.1.0',
    date: new Date().toISOString(),
    data: {
      products,
      sales,
      expenses,
      clients,
      suppliers,
      credits,
      cash_transactions,
      settings
    }
  });
};

export const importData = (jsonString: string) => {
  const database = getDB();
  const { data } = JSON.parse(jsonString);

  database.withTransactionSync(() => {
    database.runSync('DELETE FROM products');
    database.runSync('DELETE FROM sales');
    database.runSync('DELETE FROM expenses');
    database.runSync('DELETE FROM clients');
    database.runSync('DELETE FROM suppliers');
    database.runSync('DELETE FROM credits');
    database.runSync('DELETE FROM cash_transactions');
    database.runSync('DELETE FROM settings');

    if (data.products) {
      data.products.forEach((p: Product) => {
        database.runSync(
          'INSERT INTO products (id, name, description, price, purchase_price, stock, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [p.id, p.name, p.description, p.price, p.purchase_price, p.stock, p.category || 'Général']
        );
      });
    }
    if (data.sales) {
      data.sales.forEach((s: Sale) => {
        database.runSync(
          'INSERT INTO sales (id, product_id, quantity, total_price, purchase_price_at_sale, payment_method, sale_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.product_id, s.quantity, s.total_price, s.purchase_price_at_sale, s.payment_method || 'Espèces', s.sale_date]
        );
      });
    }
    if (data.expenses) {
      data.expenses.forEach((e: Expense) => {
        database.runSync(
          'INSERT INTO expenses (id, description, amount, category, expense_date) VALUES (?, ?, ?, ?, ?)',
          [e.id, e.description, e.amount, e.category, e.expense_date]
        );
      });
    }
    if (data.clients) {
      data.clients.forEach((c: Client) => {
        database.runSync(
          'INSERT INTO clients (id, name, phone, address) VALUES (?, ?, ?, ?)',
          [c.id, c.name, c.phone, c.address]
        );
      });
    }
    if (data.suppliers) {
      data.suppliers.forEach((s: Supplier) => {
        database.runSync(
          'INSERT INTO suppliers (id, name, phone, address) VALUES (?, ?, ?, ?)',
          [s.id, s.name, s.phone, s.address]
        );
      });
    }
    if (data.credits) {
      data.credits.forEach((c: Credit) => {
        database.runSync(
          'INSERT INTO credits (id, person_id, amount, is_repaid, type, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.person_id, c.amount, c.is_repaid, c.type, c.description, c.date]
        );
      });
    }
    if (data.cash_transactions) {
      data.cash_transactions.forEach((t: CashTransaction) => {
        database.runSync(
          'INSERT INTO cash_transactions (id, amount, type, description, date) VALUES (?, ?, ?, ?, ?)',
          [t.id, t.amount, t.type, t.description, t.date]
        );
      });
    }
    if (data.settings) {
      data.settings.forEach((s: Setting) => {
        database.runSync(
          'INSERT INTO settings (key, value) VALUES (?, ?)',
          [s.key, s.value]
        );
      });
    }
  });
};

export const addEmployee = (username: string, pin: string, phone?: string, role: UserRole = 'EMPLOYEE'): number => {
  const database = getDB();
  const salt = generateSalt();
  const hashedPIN = hashPINLegacy(pin, salt);
  const result = database.runSync(
    'INSERT INTO users (username, password, phone, role, is_active, permissions) VALUES (?, ?, ?, ?, 1, ?)',
    [username, hashedPIN + ':' + salt, phone || '', role, JSON.stringify(DEFAULT_EMPLOYEE_PERMISSIONS)]
  );
  clearCache('employees');
  logActivity('CREATE_USER', 'USER', undefined, `Création de ${username} (${role})`);
  return result.lastInsertRowId as number;
};

export const getEmployees = (): User[] => {
  try {
    const cacheKey = 'employees';
    const cached = getCached<User[]>(cacheKey);
    if (cached) return cached;

    const employees = getDB().getAllSync<User>('SELECT id, username, phone, role, is_active, created_at, permissions, salary FROM users ORDER BY username ASC');
    setCached(cacheKey, employees);
    return employees;
  } catch (error) {
    console.error('getEmployees error:', error);
    return [];
  }
};

export const updateEmployee = (id: number, username: string, phone?: string, role?: UserRole, isActive?: number) => {
  const database = getDB();
  const params: any[] = [username];
  let query = 'UPDATE users SET username = ?';
  
  if (phone !== undefined) {
    query += ', phone = ?';
    params.push(phone);
  }
  if (role) {
    query += ', role = ?';
    params.push(role);
  }
  if (isActive !== undefined) {
    query += ', is_active = ?';
    params.push(isActive);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  database.runSync(query, params);
  clearCache('employees');
};

export const deleteEmployee = (id: number) => {
  getDB().runSync('DELETE FROM users WHERE id = ?', [id]);
  clearCache('employees');
};

export const updateEmployeePIN = (id: number, newPin: string) => {
  const database = getDB();
  const salt = generateSalt();
  const hashedPIN = hashPINLegacy(newPin, salt);
  database.runSync('UPDATE users SET password = ? WHERE id = ?', [hashedPIN + ':' + salt, id]);
  clearCache('employees');
};

export const resetUserPIN = (id: number, newPin: string = '0000') => {
  const database = getDB();
  const salt = generateSalt();
  const hashedPIN = hashPINLegacy(newPin, salt);
  database.runSync('UPDATE users SET password = ? WHERE id = ?', [hashedPIN + ':' + salt, id]);
  clearCache('employees');
  logActivity('RESET_PIN', 'USER', id, 'Code PIN réinitialisé');
};

export const updateUserEmail = (id: number, email: string) => {
  const database = getDB();
  database.runSync('UPDATE users SET email = ? WHERE id = ?', [email, id]);
  clearCache('employees');
  logActivity('UPDATE_EMAIL', 'USER', id, 'Email mis à jour');
};

export const getCurrentUserRole = (): UserRole => {
  const user = getUser();
  return (user?.role as UserRole) || 'ADMIN';
};

export interface ActivityLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id?: number;
  client_name?: string;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  items?: string;
  notes?: string;
  due_date?: string;
  created_at: string;
}

export interface Appointment {
  id: number;
  client_id?: number;
  client_name?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export const initDB = () => {
  const database = getDB();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      business_name TEXT,
      role TEXT DEFAULT 'ADMIN',
      phone TEXT,
      email TEXT,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      permissions TEXT,
      salary REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(from_user_id, to_user_id);
    
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      category TEXT DEFAULT 'Général'
    );
    
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
    
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      total_price REAL,
      purchase_price_at_sale REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Espèces',
      sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);
    CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
    
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      expense_date TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
    
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
    
    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      is_repaid INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);
    CREATE INDEX IF NOT EXISTS idx_credits_date ON credits(date DESC);
    
    CREATE TABLE IF NOT EXISTS cash_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_cash_date ON cash_transactions(date DESC);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      client_id INTEGER,
      client_name TEXT,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      items TEXT,
      notes TEXT,
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_name TEXT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
  `);

  try {
    const currency = database.getFirstSync<Setting>('SELECT * FROM settings WHERE key = ?', ['currency']);
    if (!currency) {
      database.runSync('INSERT INTO settings (key, value) VALUES (?, ?)', ['currency', 'FCFA']);
    }
  } catch (e) { console.error('Settings init error', e); }

  try {
    const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(products)');
    if (!columns.some(col => col.name === 'purchase_price')) {
      database.execSync('ALTER TABLE products ADD COLUMN purchase_price REAL DEFAULT 0');
    }
    if (!columns.some(col => col.name === 'category')) {
      database.execSync("ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'Général'");
    }
  } catch (e) { console.error('Migration products error', e); }

  try {
    const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(sales)');
    if (!columns.some(col => col.name === 'purchase_price_at_sale')) {
      database.execSync('ALTER TABLE sales ADD COLUMN purchase_price_at_sale REAL DEFAULT 0');
    }
    if (!columns.some(col => col.name === 'payment_method')) {
      database.execSync("ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'Espèces'");
    }
    if (!columns.some(col => col.name === 'user_id')) {
      database.execSync('ALTER TABLE sales ADD COLUMN user_id INTEGER');
    }
  } catch (e) { console.error('Migration sales error', e); }

  try {
    const columns = database.getAllSync<{ name: string }>('PRAGMA table_info(users)');
    if (!columns.some(col => col.name === 'role')) {
      database.execSync("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'ADMIN'");
    }
    if (!columns.some(col => col.name === 'phone')) {
      database.execSync('ALTER TABLE users ADD COLUMN phone TEXT');
    }
    if (!columns.some(col => col.name === 'avatar')) {
      database.execSync('ALTER TABLE users ADD COLUMN avatar TEXT');
    }
    if (!columns.some(col => col.name === 'is_active')) {
      database.execSync('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
    }
    if (!columns.some(col => col.name === 'salary')) {
      database.execSync('ALTER TABLE users ADD COLUMN salary REAL');
    }
    if (!columns.some(col => col.name === 'email')) {
      database.execSync('ALTER TABLE users ADD COLUMN email TEXT');
    }
  } catch (e) { console.error('Migration users error', e); }
};

export const logActivity = (action: string, entityType: string, entityId?: number, details?: string) => {
  const user = getUser();
  getDB().runSync(
    'INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
    [user?.id || null, user?.username || 'Système', action, entityType, entityId || null, details || null]
  );
  clearCache('activity');
};

export const getActivityLogs = (limit: number = 50): ActivityLog[] => {
  const cacheKey = 'activity';
  const cached = getCached<ActivityLog[]>(cacheKey);
  if (cached) return cached;
  
  const logs = getDB().getAllSync<ActivityLog>(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  setCached(cacheKey, logs);
  return logs;
};

export const getUserPermissions = (): UserPermissions => {
  const user = getUser();
  if (user?.role === 'ADMIN') {
    return ADMIN_PERMISSIONS;
  }
  
  if (user?.permissions) {
    try {
      const parsed = JSON.parse(user.permissions);
      return { ...DEFAULT_EMPLOYEE_PERMISSIONS, ...parsed };
    } catch {
      return DEFAULT_EMPLOYEE_PERMISSIONS;
    }
  }
  
  return DEFAULT_EMPLOYEE_PERMISSIONS;
};

export const hasPermission = (permission: keyof UserPermissions): boolean => {
  if (isAdmin()) return true;
  const permissions = getUserPermissions();
  return permissions[permission] || false;
};

export const setUserPermissions = (userId: number, permissions: Partial<UserPermissions>) => {
  const database = getDB();
  const user = database.getFirstSync<User>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return;
  let currentPermissions = DEFAULT_EMPLOYEE_PERMISSIONS;
  if (user.permissions) {
    try {
      currentPermissions = { ...DEFAULT_EMPLOYEE_PERMISSIONS, ...JSON.parse(user.permissions) };
    } catch {}
  }
  const mergedPermissions = { ...currentPermissions, ...permissions };
  database.runSync(
    'UPDATE users SET permissions = ? WHERE id = ?',
    [JSON.stringify(mergedPermissions), userId]
  );
  clearCache('employees');
};

const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${year}${month}-${random}`;
};

export const addInvoice = (totalAmount: number, clientId?: number, clientName?: string, items?: string, notes?: string, dueDate?: string) => {
  const invoiceNumber = generateInvoiceNumber();
  getDB().runSync(
    'INSERT INTO invoices (invoice_number, client_id, client_name, total_amount, items, notes, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [invoiceNumber, clientId || null, clientName || null, totalAmount, items || null, notes || null, dueDate || null, 'DRAFT']
  );
  clearCache('invoices');
  logActivity('CREATE_INVOICE', 'INVOICE', undefined, `Facture ${invoiceNumber} créée`);
};

export const getInvoices = (): Invoice[] => {
  const cacheKey = 'invoices';
  const cached = getCached<Invoice[]>(cacheKey);
  if (cached) return cached;
  
  const invoices = getDB().getAllSync<Invoice>('SELECT * FROM invoices ORDER BY created_at DESC');
  setCached(cacheKey, invoices);
  return invoices;
};

export const updateInvoiceStatus = (id: number, status: Invoice['status']) => {
  getDB().runSync('UPDATE invoices SET status = ? WHERE id = ?', [status, id]);
  clearCache('invoices');
  logActivity('UPDATE_INVOICE', 'INVOICE', id, `Statut changé en ${status}`);
};

export const deleteInvoice = (id: number) => {
  getDB().runSync('DELETE FROM invoices WHERE id = ?', [id]);
  clearCache('invoices');
  logActivity('DELETE_INVOICE', 'INVOICE', id);
};

export const addAppointment = (title: string, date: string, time?: string, clientId?: number, clientName?: string, description?: string) => {
  getDB().runSync(
    'INSERT INTO appointments (title, date, time, client_id, client_name, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, date, time || null, clientId || null, clientName || null, description || null, 'PENDING']
  );
  clearCache('appointments');
  logActivity('CREATE_APPOINTMENT', 'APPOINTMENT', undefined, `Rendez-vous: ${title}`);
};

export const getAppointments = (): Appointment[] => {
  const cacheKey = 'appointments';
  const cached = getCached<Appointment[]>(cacheKey);
  if (cached) return cached;
  
  const appointments = getDB().getAllSync<Appointment>('SELECT * FROM appointments ORDER BY date ASC, time ASC');
  setCached(cacheKey, appointments);
  return appointments;
};

export const updateAppointmentStatus = (id: number, status: Appointment['status']) => {
  getDB().runSync('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  clearCache('appointments');
  logActivity('UPDATE_APPOINTMENT', 'APPOINTMENT', id, `Statut changé en ${status}`);
};

export const deleteAppointment = (id: number) => {
  getDB().runSync('DELETE FROM appointments WHERE id = ?', [id]);
  clearCache('appointments');
  logActivity('DELETE_APPOINTMENT', 'APPOINTMENT', id);
};

export const updateEmployeeSalary = (userId: number, salary: number) => {
  getDB().runSync('UPDATE users SET salary = ? WHERE id = ?', [salary, userId]);
  clearCache('employees');
  logActivity('UPDATE_SALARY', 'USER', userId, `Salaire mis à jour: ${salary}`);
};

export const sendMessage = (toUserId: number, content: string) => {
  const fromUser = getUser();
  if (!fromUser) return;
  
  getDB().runSync(
    'INSERT INTO messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)',
    [fromUser.id, toUserId, content]
  );
  clearCache(`messages_${fromUser.id}_${toUserId}`);
  clearCache(`messages_${toUserId}_${fromUser.id}`);
  logActivity('SEND_MESSAGE', 'MESSAGE', undefined, `Message à ${toUserId}`);
};

export const getMessagesWithUser = (otherUserId: number): Message[] => {
  const currentUser = getUser();
  if (!currentUser) return [];
  
  const cacheKey = `messages_${currentUser.id}_${otherUserId}`;
  const cached = getCached<Message[]>(cacheKey);
  if (cached) return cached;
  
  const messages = getDB().getAllSync<Message>(
    'SELECT * FROM messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?) ORDER BY created_at ASC',
    [currentUser.id, otherUserId, otherUserId, currentUser.id]
  );
  
  setCached(cacheKey, messages);
  return messages;
};

export const markMessageAsRead = (messageId: number) => {
  getDB().runSync('UPDATE messages SET is_read = 1 WHERE id = ?', [messageId]);
};

export const markAllMessagesAsReadWithUser = (otherUserId: number) => {
  const currentUser = getUser();
  if (!currentUser) return;
  
  getDB().runSync(
    'UPDATE messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?',
    [otherUserId, currentUser.id]
  );
  clearCache(`messages_${currentUser.id}_${otherUserId}`);
};

export const getUnreadMessageCount = (): number => {
  const currentUser = getUser();
  if (!currentUser) return 0;
  
  const result = getDB().getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE to_user_id = ? AND is_read = 0',
    [currentUser.id]
  );
  
  return result?.count || 0;
};



export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleLocalNotification = async (title: string, body: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
};

export const checkAndNotifyLowStock = async () => {
  const lowStock = getLowStockCount();
  if (lowStock > 0) {
    await scheduleLocalNotification(
      'Stock bas',
      `Il y a ${lowStock} produit(s) avec un stock faible !`
    );
  }
};

export const backupDatabase = async () => {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/accounting.db`;
    const backupName = `backup_comptabilite_${Date.now()}.db`;
    const backupUri = `${FileSystem.documentDirectory}${backupName}`;
    
    await FileSystem.copyAsync({
      from: dbPath,
      to: backupUri
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Sauvegarder la base de données',
        UTI: 'public.data'
      });
    }
    return true;
  } catch (error) {
    console.error('Backup error:', error);
    return false;
  }
};

export const isAdmin = (): boolean => {
  return getCurrentUserRole() === 'ADMIN';
};
