import { storage } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://comptabilite-production-08f2.up.railway.app/api';
const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Le serveur ne répond pas. Vérifiez votre connexion internet.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

export interface AuthResponse {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  locality?: string;
  role: 'ADMIN' | 'EMPLOYEE';
  businessName?: string;
  employeeCode?: string;
  token: string;
  permissions?: Permissions;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginByCodeData {
  employeeCode: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  businessName?: string;
}

export interface Client {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  notes?: string;
  balance?: number;
}

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  category?: string;
  barcode?: string;
  expirationDate?: string;
  lowStockAlert?: number;
}

export interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance?: number;
}

export interface Sale {
  id?: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  purchasePriceAtSale?: number;
  paymentMethod?: string;
  transactionReference?: string;
  discount?: number;
  notes?: string;
  createdAt?: string;
}

export interface Expense {
  id?: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  notes?: string;
}

export interface Permissions {
  sales: boolean;
  inventory: boolean;
  clients: boolean;
  suppliers: boolean;
  expenses: boolean;
  invoices: boolean;
  cash: boolean;
  reports: boolean;
  appointments: boolean;
  credits: boolean;
  messages: boolean;
  employees: boolean;
}

export interface Employee {
  id?: number;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  locality?: string;
  salary?: number;
  isActive?: boolean;
  password?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  employeeCode?: string;
  permissions?: Permissions;
}

export interface CashTransaction {
  id?: number;
  amount: number;
  type: 'IN' | 'OUT';
  description?: string;
  category?: string;
  reference?: string;
  createdAt?: string;
}

export interface CashResponse {
  transactions: CashTransaction[];
  totalIn: number;
  totalOut: number;
  balance: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  clientId?: number;
  clientName?: string;
  totalAmount: number;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
  items?: string;
  notes?: string;
  dueDate?: string;
  createdAt?: string;
}

export interface Appointment {
  id?: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  clientId?: number;
  clientName?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
}

export interface Credit {
  id?: number;
  personId: number;
  personType: 'CLIENT' | 'SUPPLIER';
  amount: number;
  description?: string;
  isRepaid?: boolean;
  repaidAt?: string;
  personName?: string;
  createdAt?: string;
}

export interface Message {
  id?: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  isRead?: boolean;
  fromUserName?: string;
  toUserName?: string;
  createdAt?: string;
}

export interface BilanData {
  bilan: {
    actif: {
      stock: { valeur: number; unites: number };
      tresorerie: number;
      encaissement: number;
      decaissement: number;
      creditsClients: number;
      facturesImpayees: number;
      totalActif: number;
    };
    passif: {
      creditsFournisseurs: number;
      soldesFournisseurs: number;
      totalPassif: number;
    };
    capitauxPropres: number;
  };
  performance: {
    chiffreAffaires: { total: number; moisEnCours: number; aujourdhui: number };
    coutDesVentes: number;
    margeBrute: number;
    depenses: { total: number; moisEnCours: number };
    resultatNet: number;
  };
  indicateurs: {
    totalProduits: number;
    totalVentes: number;
    totalClients: number;
    totalFournisseurs: number;
    valeurMoyennePanier: number;
    ratioMarge: number;
  };
  repartitionVentes: Array<{ methode: string; nombre: number; total: number }>;
  evolutionMensuelle: {
    revenus: Array<{ mois: string; total: number }>;
    depenses: Array<{ mois: string; total: number }>;
  };
}

class ApiService {
  private token: string | null = null;
  private user: AuthResponse | null = null;
  private readyPromise: Promise<void>;

  // In-memory caches
  private cachedStats: any = null;
  private cachedClients: Client[] = [];
  private cachedProducts: Product[] = [];
  private cachedSales: Sale[] = [];
  private cachedSuppliers: Supplier[] = [];
  private cachedExpenses: Expense[] = [];
  private cachedEmployees: Employee[] = [];
  private cachedCashResponse: CashResponse | null = null;
  private cachedInvoices: Invoice[] = [];
  private cachedAppointments: Appointment[] = [];
  private cachedCredits: Credit[] = [];
  private cachedMessages: Message[] = [];

  private storageReady = false;

  constructor() {
    this.readyPromise = this.initFromStorage();
  }

  private async initFromStorage(): Promise<void> {
    try {
      const storedToken = await Promise.race([
        storage.getItem('auth_token'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ]);
      const storedUser = await Promise.race([
        storage.getItem('auth_user'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ]);

      if (storedToken) {
        this.token = storedToken;
      }
      if (storedUser) {
        try { this.user = JSON.parse(storedUser); } catch {}
      }

      this.storageReady = true;

      Promise.all([
        this.getCache<any>('cache_stats'),
        this.getCache<Client[]>('cache_clients'),
        this.getCache<Product[]>('cache_products'),
        this.getCache<Sale[]>('cache_sales'),
        this.getCache<Supplier[]>('cache_suppliers'),
        this.getCache<Expense[]>('cache_expenses'),
        this.getCache<Employee[]>('cache_employees'),
        this.getCache<CashResponse>('cache_cash'),
        this.getCache<Invoice[]>('cache_invoices'),
        this.getCache<Appointment[]>('cache_appointments'),
        this.getCache<Credit[]>('cache_credits'),
        this.getCache<Message[]>('cache_messages')
      ]).then(([stats, clients, products, sales, suppliers, expenses, employees, cash, invoices, appointments, credits, messages]) => {
        if (stats) this.cachedStats = stats;
        if (clients) this.cachedClients = clients;
        if (products) this.cachedProducts = products;
        if (sales) this.cachedSales = sales;
        if (suppliers) this.cachedSuppliers = suppliers;
        if (expenses) this.cachedExpenses = expenses;
        if (employees) this.cachedEmployees = employees;
        if (cash) this.cachedCashResponse = cash;
        if (invoices) this.cachedInvoices = invoices;
        if (appointments) this.cachedAppointments = appointments;
        if (credits) this.cachedCredits = credits;
        if (messages) this.cachedMessages = messages;
      }).catch(() => {});

    } catch (error) {
      console.error('Error initializing from storage:', error);
      this.storageReady = true;
    }
  }

  async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  private async saveAuthToStorage(): Promise<void> {
    try {
      if (this.token) {
        await storage.setItem('auth_token', this.token);
      }
      if (this.user) {
        await storage.setItem('auth_user', JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private async clearAuthFromStorage(): Promise<void> {
    try {
      await storage.removeItem('auth_token');
      await storage.removeItem('auth_user');
    } catch (error) {
      console.error('Error clearing from storage:', error);
    }
  }

  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await storage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async setCache(key: string, data: any): Promise<void> {
    try {
      await storage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401 || response.status === 403) {
      this.token = null;
      this.user = null;
      await this.clearAuthFromStorage();
      return { success: false, message: 'Session expirée. Veuillez vous reconnecter.' };
    }

    try {
      const data = await response.json();

      if (data.success !== undefined) {
        return { success: data.success, data: data.data, message: data.message };
      }

      if (response.ok) {
        return { success: true, data };
      }
      return { success: false, message: data.message || 'Une erreur est survenue' };
    } catch (error) {
      return { success: false, message: 'Erreur de lecture de la réponse' };
    }
  }

  private computeLocalStats(): any {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate sales stats
    const totalSalesToday = this.cachedSales
      .filter(sale => {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
        return saleDate >= today;
      })
      .reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);

    const totalSalesThisMonth = this.cachedSales
      .filter(sale => {
        const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
        return saleDate >= startOfMonth;
      })
      .reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);

    // Calculate expenses stats (expenses + cash OUT)
    const totalExpensesThisMonth = this.cachedExpenses
      .filter(expense => {
        const expenseDate = expense.date ? new Date(expense.date) : new Date();
        return expenseDate >= startOfMonth;
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    // Calculate cash in/out this month
    const cashTransactionsThisMonth = (this.cachedCashResponse?.transactions || []).filter(t => {
      const transDate = t.createdAt ? new Date(t.createdAt) : new Date();
      return transDate >= startOfMonth;
    });
    const cashInThisMonth = cashTransactionsThisMonth
      .filter(t => t.type === 'IN')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const cashOutThisMonth = cashTransactionsThisMonth
      .filter(t => t.type === 'OUT')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalProducts = this.cachedProducts.length;
    const lowStockProducts = this.cachedProducts.filter(p => p.stock <= (p.lowStockAlert ?? 5)).length;
    const totalClients = this.cachedClients.length;
    const totalSuppliers = this.cachedSuppliers.length;

    return {
      totalSalesToday,
      totalSalesThisMonth,
      totalExpensesThisMonth,
      cashInThisMonth,
      cashOutThisMonth,
      netProfit: totalSalesThisMonth - totalExpensesThisMonth,
      totalProducts,
      lowStockProducts,
      totalClients,
      totalSuppliers
    };
  }

  private computeLocalCashResponse(): CashResponse {
    let totalIn = 0;
    let totalOut = 0;
    const transactions = this.cachedCashResponse?.transactions || [];
    transactions.forEach(t => {
      if (t.type === 'IN') totalIn += Number(t.amount);
      else totalOut += Number(t.amount);
    });
    return {
      transactions,
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    };
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);
      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data;
        await this.saveAuthToStorage();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);

      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data;
        await this.saveAuthToStorage();
      }
      return result;
    } catch (error) {
      console.error('ApiService.login error:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async logout() {
    this.token = null;
    this.user = null;
    this.cachedStats = null;
    this.cachedClients = [];
    this.cachedProducts = [];
    this.cachedSales = [];
    this.cachedSuppliers = [];
    this.cachedExpenses = [];
    this.cachedEmployees = [];
    this.cachedCashResponse = null;
    this.cachedInvoices = [];
    this.cachedAppointments = [];
    this.cachedCredits = [];
    this.cachedMessages = [];
    await this.clearAuthFromStorage();
    const cacheKeys = ['cache_stats', 'cache_clients', 'cache_products', 'cache_sales', 'cache_suppliers', 'cache_expenses', 'cache_employees', 'cache_cash', 'cache_invoices', 'cache_appointments', 'cache_credits', 'cache_messages'];
    for (const key of cacheKeys) {
      await storage.removeItem(key);
    }
  }

  async loginByCode(data: LoginByCodeData): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login-by-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);

      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data;
        await this.saveAuthToStorage();
      }
      return result;
    } catch (error) {
      console.error('ApiService.loginByCode error:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async getStats(): Promise<ApiResponse<any>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<any>(response);
      if (result.success && result.data) {
        this.cachedStats = result.data;
        await this.setCache('cache_stats', result.data);
      }
      return result;
    } catch (error) {
      // Compute stats locally if server is down
      const localStats = this.computeLocalStats();
      this.cachedStats = localStats;
      await this.setCache('cache_stats', localStats);
      return { success: true, data: localStats, message: 'Données hors ligne' };
    }
  }

  async getBilan(): Promise<ApiResponse<BilanData>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/bilan`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<BilanData>(response);
      return result;
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async getClients(): Promise<ApiResponse<Client[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clients`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Client[]>(response);
      if (result.success && result.data) {
        this.cachedClients = result.data;
        await this.setCache('cache_clients', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedClients, message: 'Données hors ligne' };
    }
  }

  async createClient(data: Client): Promise<ApiResponse<Client>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Client>(response);
      if (result.success && result.data) {
        this.cachedClients = [...this.cachedClients, result.data];
        await this.setCache('cache_clients', this.cachedClients);
      }
      return result;
    } catch (error) {
      const newClient = { ...data, id: Date.now() };
      this.cachedClients = [...this.cachedClients, newClient];
      await this.setCache('cache_clients', this.cachedClients);
      return { success: true, data: newClient, message: 'Enregistré localement' };
    }
  }

  async updateClient(id: number, data: Partial<Client>): Promise<ApiResponse<Client>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clients/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Client>(response);
      if (result.success) {
        this.cachedClients = this.cachedClients.map(c => c.id === id ? { ...c, ...data } : c);
        await this.setCache('cache_clients', this.cachedClients);
      }
      return result;
    } catch (error) {
      this.cachedClients = this.cachedClients.map(c => c.id === id ? { ...c, ...data } : c);
      await this.setCache('cache_clients', this.cachedClients);
      return { success: true, data: { id, ...data } as Client, message: 'Mis à jour localement' };
    }
  }

  async deleteClient(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/clients/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedClients = this.cachedClients.filter(c => c.id !== id);
        await this.setCache('cache_clients', this.cachedClients);
      }
      return result;
    } catch (error) {
      this.cachedClients = this.cachedClients.filter(c => c.id !== id);
      await this.setCache('cache_clients', this.cachedClients);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getProducts(): Promise<ApiResponse<Product[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Product[]>(response);
      if (result.success && result.data) {
        this.cachedProducts = result.data;
        await this.setCache('cache_products', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedProducts, message: 'Données hors ligne' };
    }
  }

  async createProduct(data: Product): Promise<ApiResponse<Product>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Product>(response);
      if (result.success && result.data) {
        this.cachedProducts = [...this.cachedProducts, result.data];
        await this.setCache('cache_products', this.cachedProducts);
      }
      return result;
    } catch (error) {
      const newProduct = { ...data, id: Date.now() };
      this.cachedProducts = [...this.cachedProducts, newProduct];
      await this.setCache('cache_products', this.cachedProducts);
      return { success: true, data: newProduct, message: 'Enregistré localement' };
    }
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<ApiResponse<Product>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Product>(response);
      if (result.success) {
        this.cachedProducts = this.cachedProducts.map(p => p.id === id ? { ...p, ...data } : p);
        await this.setCache('cache_products', this.cachedProducts);
      }
      return result;
    } catch (error) {
      this.cachedProducts = this.cachedProducts.map(p => p.id === id ? { ...p, ...data } : p);
      await this.setCache('cache_products', this.cachedProducts);
      return { success: true, data: { id, ...data } as Product, message: 'Mis à jour localement' };
    }
  }

  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedProducts = this.cachedProducts.filter(p => p.id !== id);
        await this.setCache('cache_products', this.cachedProducts);
      }
      return result;
    } catch (error) {
      this.cachedProducts = this.cachedProducts.filter(p => p.id !== id);
      await this.setCache('cache_products', this.cachedProducts);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async adjustStock(id: number, quantity: number): Promise<ApiResponse<Product>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/products/${id}/adjust-stock`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ quantity }),
      });
      const result = await this.handleResponse<Product>(response);
      if (result.success) {
        this.cachedProducts = this.cachedProducts.map(p => p.id === id ? { ...p, stock: p.stock + quantity } : p);
        await this.setCache('cache_products', this.cachedProducts);
      }
      return result;
    } catch (error) {
      this.cachedProducts = this.cachedProducts.map(p => p.id === id ? { ...p, stock: p.stock + quantity } : p);
      await this.setCache('cache_products', this.cachedProducts);
      return { success: true, data: { id } as Product, message: 'Ajusté localement' };
    }
  }

  async getSales(): Promise<ApiResponse<Sale[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/sales`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Sale[]>(response);
      if (result.success && result.data) {
        this.cachedSales = result.data;
        await this.setCache('cache_sales', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedSales, message: 'Données hors ligne' };
    }
  }

  async createSale(data: Omit<Sale, 'id' | 'createdAt' | 'purchasePriceAtSale' | 'transactionReference' | 'soldBy'> & { discount?: number; notes?: string }): Promise<ApiResponse<Sale>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Sale>(response);
      if (result.success && result.data) {
        this.cachedSales = [...this.cachedSales, result.data];
        await this.setCache('cache_sales', this.cachedSales);
        // Update product stock locally
        if (data.productId) {
          const product = this.cachedProducts.find(p => p.id === data.productId);
          if (product) {
            this.cachedProducts = this.cachedProducts.map(p => 
              p.id === data.productId ? { ...p, stock: p.stock - data.quantity } : p
            );
            await this.setCache('cache_products', this.cachedProducts);
          }
        }
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      const newSale = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
      this.cachedSales = [...this.cachedSales, newSale];
      await this.setCache('cache_sales', this.cachedSales);
      // Update product stock locally
      if (data.productId) {
        const product = this.cachedProducts.find(p => p.id === data.productId);
        if (product) {
          this.cachedProducts = this.cachedProducts.map(p => 
            p.id === data.productId ? { ...p, stock: p.stock - data.quantity } : p
          );
          await this.setCache('cache_products', this.cachedProducts);
        }
      }
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, data: newSale, message: 'Enregistré localement' };
    }
  }

  async deleteSale(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/sales/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        // Find the sale to restore stock
        const sale = this.cachedSales.find(s => s.id === id);
        this.cachedSales = this.cachedSales.filter(s => s.id !== id);
        await this.setCache('cache_sales', this.cachedSales);
        // Restore product stock
        if (sale && sale.productId) {
          const product = this.cachedProducts.find(p => p.id === sale.productId);
          if (product) {
            this.cachedProducts = this.cachedProducts.map(p => 
              p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
            );
            await this.setCache('cache_products', this.cachedProducts);
          }
        }
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      // Find the sale to restore stock
      const sale = this.cachedSales.find(s => s.id === id);
      this.cachedSales = this.cachedSales.filter(s => s.id !== id);
      await this.setCache('cache_sales', this.cachedSales);
      // Restore product stock
      if (sale && sale.productId) {
        const product = this.cachedProducts.find(p => p.id === sale.productId);
        if (product) {
          this.cachedProducts = this.cachedProducts.map(p => 
            p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
          );
          await this.setCache('cache_products', this.cachedProducts);
        }
      }
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/suppliers`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Supplier[]>(response);
      if (result.success && result.data) {
        this.cachedSuppliers = result.data;
        await this.setCache('cache_suppliers', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedSuppliers, message: 'Données hors ligne' };
    }
  }

  async createSupplier(data: Supplier): Promise<ApiResponse<Supplier>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Supplier>(response);
      if (result.success && result.data) {
        this.cachedSuppliers = [...this.cachedSuppliers, result.data];
        await this.setCache('cache_suppliers', this.cachedSuppliers);
      }
      return result;
    } catch (error) {
      const newSupplier = { ...data, id: Date.now() };
      this.cachedSuppliers = [...this.cachedSuppliers, newSupplier];
      await this.setCache('cache_suppliers', this.cachedSuppliers);
      return { success: true, data: newSupplier, message: 'Enregistré localement' };
    }
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Supplier>(response);
      if (result.success) {
        this.cachedSuppliers = this.cachedSuppliers.map(s => s.id === id ? { ...s, ...data } : s);
        await this.setCache('cache_suppliers', this.cachedSuppliers);
      }
      return result;
    } catch (error) {
      this.cachedSuppliers = this.cachedSuppliers.map(s => s.id === id ? { ...s, ...data } : s);
      await this.setCache('cache_suppliers', this.cachedSuppliers);
      return { success: true, data: { id, ...data } as Supplier, message: 'Mis à jour localement' };
    }
  }

  async deleteSupplier(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedSuppliers = this.cachedSuppliers.filter(s => s.id !== id);
        await this.setCache('cache_suppliers', this.cachedSuppliers);
      }
      return result;
    } catch (error) {
      this.cachedSuppliers = this.cachedSuppliers.filter(s => s.id !== id);
      await this.setCache('cache_suppliers', this.cachedSuppliers);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/expenses`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Expense[]>(response);
      if (result.success && result.data) {
        this.cachedExpenses = result.data;
        await this.setCache('cache_expenses', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedExpenses, message: 'Données hors ligne' };
    }
  }

  async createExpense(data: Expense): Promise<ApiResponse<Expense>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Expense>(response);
      if (result.success && result.data) {
        this.cachedExpenses = [...this.cachedExpenses, result.data];
        await this.setCache('cache_expenses', this.cachedExpenses);
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      const newExpense = { ...data, id: Date.now() };
      this.cachedExpenses = [...this.cachedExpenses, newExpense];
      await this.setCache('cache_expenses', this.cachedExpenses);
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, data: newExpense, message: 'Enregistré localement' };
    }
  }

  async updateExpense(id: number, data: Partial<Expense>): Promise<ApiResponse<Expense>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Expense>(response);
      if (result.success) {
        this.cachedExpenses = this.cachedExpenses.map(e => e.id === id ? { ...e, ...data } : e);
        await this.setCache('cache_expenses', this.cachedExpenses);
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      this.cachedExpenses = this.cachedExpenses.map(e => e.id === id ? { ...e, ...data } : e);
      await this.setCache('cache_expenses', this.cachedExpenses);
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, data: { id, ...data } as Expense, message: 'Mis à jour localement' };
    }
  }

  async deleteExpense(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedExpenses = this.cachedExpenses.filter(e => e.id !== id);
        await this.setCache('cache_expenses', this.cachedExpenses);
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      this.cachedExpenses = this.cachedExpenses.filter(e => e.id !== id);
      await this.setCache('cache_expenses', this.cachedExpenses);
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/employees`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Employee[]>(response);
      if (result.success && result.data) {
        this.cachedEmployees = result.data;
        await this.setCache('cache_employees', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedEmployees, message: 'Données hors ligne' };
    }
  }

  async createEmployee(data: Employee): Promise<ApiResponse<Employee>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Employee>(response);
      if (result.success && result.data) {
        this.cachedEmployees = [...this.cachedEmployees, result.data];
        await this.setCache('cache_employees', this.cachedEmployees);
      }
      return result;
    } catch (error) {
      const newEmployee = { ...data, id: Date.now() };
      this.cachedEmployees = [...this.cachedEmployees, newEmployee];
      await this.setCache('cache_employees', this.cachedEmployees);
      return { success: true, data: newEmployee, message: 'Enregistré localement' };
    }
  }

  async updateEmployee(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Employee>(response);
      if (result.success) {
        this.cachedEmployees = this.cachedEmployees.map(e => e.id === id ? { ...e, ...data } : e);
        await this.setCache('cache_employees', this.cachedEmployees);
      }
      return result;
    } catch (error) {
      this.cachedEmployees = this.cachedEmployees.map(e => e.id === id ? { ...e, ...data } : e);
      await this.setCache('cache_employees', this.cachedEmployees);
      return { success: true, data: { id, ...data } as Employee, message: 'Mis à jour localement' };
    }
  }

  async deleteEmployee(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedEmployees = this.cachedEmployees.filter(e => e.id !== id);
        await this.setCache('cache_employees', this.cachedEmployees);
      }
      return result;
    } catch (error) {
      this.cachedEmployees = this.cachedEmployees.filter(e => e.id !== id);
      await this.setCache('cache_employees', this.cachedEmployees);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async resetEmployeeCode(id: number): Promise<ApiResponse<Employee>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/employees/${id}/reset-code`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Employee>(response);
      if (result.success && result.data) {
        this.cachedEmployees = this.cachedEmployees.map(e => e.id === id ? { ...e, ...result.data } : e);
        await this.setCache('cache_employees', this.cachedEmployees);
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async getCash(): Promise<ApiResponse<CashResponse>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/cash`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<CashResponse>(response);
      if (result.success && result.data) {
        this.cachedCashResponse = result.data;
        await this.setCache('cache_cash', result.data);
      }
      return result;
    } catch (error) {
      const localCash = this.computeLocalCashResponse();
      return { success: true, data: localCash, message: 'Données hors ligne' };
    }
  }

  async createCash(data: CashTransaction): Promise<ApiResponse<CashTransaction>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/cash`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<CashTransaction>(response);
      if (result.success && result.data) {
        const newTransactions = [...(this.cachedCashResponse?.transactions || []), result.data];
        let totalIn = 0, totalOut = 0;
        newTransactions.forEach(t => {
          if (t.type === 'IN') totalIn += Number(t.amount);
          else totalOut += Number(t.amount);
        });
        this.cachedCashResponse = { transactions: newTransactions, totalIn, totalOut, balance: totalIn - totalOut };
        await this.setCache('cache_cash', this.cachedCashResponse);
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      const newTransaction = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
      const newTransactions = [...(this.cachedCashResponse?.transactions || []), newTransaction];
      let totalIn = 0, totalOut = 0;
      newTransactions.forEach(t => {
        if (t.type === 'IN') totalIn += Number(t.amount);
        else totalOut += Number(t.amount);
      });
      this.cachedCashResponse = { transactions: newTransactions, totalIn, totalOut, balance: totalIn - totalOut };
      await this.setCache('cache_cash', this.cachedCashResponse);
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, data: newTransaction, message: 'Enregistré localement' };
    }
  }

  async deleteCash(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/cash/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        const newTransactions = (this.cachedCashResponse?.transactions || []).filter(t => t.id !== id);
        let totalIn = 0, totalOut = 0;
        newTransactions.forEach(t => {
          if (t.type === 'IN') totalIn += Number(t.amount);
          else totalOut += Number(t.amount);
        });
        this.cachedCashResponse = { transactions: newTransactions, totalIn, totalOut, balance: totalIn - totalOut };
        await this.setCache('cache_cash', this.cachedCashResponse);
        // Update local stats
        this.cachedStats = this.computeLocalStats();
        await this.setCache('cache_stats', this.cachedStats);
      }
      return result;
    } catch (error) {
      const newTransactions = (this.cachedCashResponse?.transactions || []).filter(t => t.id !== id);
      let totalIn = 0, totalOut = 0;
      newTransactions.forEach(t => {
        if (t.type === 'IN') totalIn += Number(t.amount);
        else totalOut += Number(t.amount);
      });
      this.cachedCashResponse = { transactions: newTransactions, totalIn, totalOut, balance: totalIn - totalOut };
      await this.setCache('cache_cash', this.cachedCashResponse);
      // Update local stats
      this.cachedStats = this.computeLocalStats();
      await this.setCache('cache_stats', this.cachedStats);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/invoices`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Invoice[]>(response);
      if (result.success && result.data) {
        this.cachedInvoices = result.data;
        await this.setCache('cache_invoices', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedInvoices, message: 'Données hors ligne' };
    }
  }

  async createInvoice(data: Invoice): Promise<ApiResponse<Invoice>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/invoices`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Invoice>(response);
      if (result.success && result.data) {
        this.cachedInvoices = [...this.cachedInvoices, result.data];
        await this.setCache('cache_invoices', this.cachedInvoices);
      }
      return result;
    } catch (error) {
      const newInvoice = { ...data, id: Date.now() };
      this.cachedInvoices = [...this.cachedInvoices, newInvoice];
      await this.setCache('cache_invoices', this.cachedInvoices);
      return { success: true, data: newInvoice, message: 'Enregistré localement' };
    }
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Invoice>(response);
      if (result.success) {
        this.cachedInvoices = this.cachedInvoices.map(i => i.id === id ? { ...i, ...data } : i);
        await this.setCache('cache_invoices', this.cachedInvoices);
      }
      return result;
    } catch (error) {
      this.cachedInvoices = this.cachedInvoices.map(i => i.id === id ? { ...i, ...data } : i);
      await this.setCache('cache_invoices', this.cachedInvoices);
      return { success: true, data: { id, ...data } as Invoice, message: 'Mis à jour localement' };
    }
  }

  async deleteInvoice(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedInvoices = this.cachedInvoices.filter(i => i.id !== id);
        await this.setCache('cache_invoices', this.cachedInvoices);
      }
      return result;
    } catch (error) {
      this.cachedInvoices = this.cachedInvoices.filter(i => i.id !== id);
      await this.setCache('cache_invoices', this.cachedInvoices);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/appointments`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Appointment[]>(response);
      if (result.success && result.data) {
        this.cachedAppointments = result.data;
        await this.setCache('cache_appointments', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedAppointments, message: 'Données hors ligne' };
    }
  }

  async createAppointment(data: Appointment): Promise<ApiResponse<Appointment>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Appointment>(response);
      if (result.success && result.data) {
        this.cachedAppointments = [...this.cachedAppointments, result.data];
        await this.setCache('cache_appointments', this.cachedAppointments);
      }
      return result;
    } catch (error) {
      const newAppointment = { ...data, id: Date.now() };
      this.cachedAppointments = [...this.cachedAppointments, newAppointment];
      await this.setCache('cache_appointments', this.cachedAppointments);
      return { success: true, data: newAppointment, message: 'Enregistré localement' };
    }
  }

  async updateAppointment(id: number, data: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Appointment>(response);
      if (result.success) {
        this.cachedAppointments = this.cachedAppointments.map(a => a.id === id ? { ...a, ...data } : a);
        await this.setCache('cache_appointments', this.cachedAppointments);
      }
      return result;
    } catch (error) {
      this.cachedAppointments = this.cachedAppointments.map(a => a.id === id ? { ...a, ...data } : a);
      await this.setCache('cache_appointments', this.cachedAppointments);
      return { success: true, data: { id, ...data } as Appointment, message: 'Mis à jour localement' };
    }
  }

  async deleteAppointment(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedAppointments = this.cachedAppointments.filter(a => a.id !== id);
        await this.setCache('cache_appointments', this.cachedAppointments);
      }
      return result;
    } catch (error) {
      this.cachedAppointments = this.cachedAppointments.filter(a => a.id !== id);
      await this.setCache('cache_appointments', this.cachedAppointments);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getCredits(): Promise<ApiResponse<Credit[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/credits`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Credit[]>(response);
      if (result.success && result.data) {
        this.cachedCredits = result.data;
        await this.setCache('cache_credits', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedCredits, message: 'Données hors ligne' };
    }
  }

  async createCredit(data: Credit): Promise<ApiResponse<Credit>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/credits`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Credit>(response);
      if (result.success && result.data) {
        this.cachedCredits = [...this.cachedCredits, result.data];
        await this.setCache('cache_credits', this.cachedCredits);
      }
      return result;
    } catch (error) {
      const newCredit = { ...data, id: Date.now() };
      this.cachedCredits = [...this.cachedCredits, newCredit];
      await this.setCache('cache_credits', this.cachedCredits);
      return { success: true, data: newCredit, message: 'Enregistré localement' };
    }
  }

  async updateCredit(id: number, data: Partial<Credit>): Promise<ApiResponse<Credit>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/credits/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Credit>(response);
      if (result.success) {
        this.cachedCredits = this.cachedCredits.map(c => c.id === id ? { ...c, ...data } : c);
        await this.setCache('cache_credits', this.cachedCredits);
      }
      return result;
    } catch (error) {
      this.cachedCredits = this.cachedCredits.map(c => c.id === id ? { ...c, ...data } : c);
      await this.setCache('cache_credits', this.cachedCredits);
      return { success: true, data: { id, ...data } as Credit, message: 'Mis à jour localement' };
    }
  }

  async deleteCredit(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/credits/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedCredits = this.cachedCredits.filter(c => c.id !== id);
        await this.setCache('cache_credits', this.cachedCredits);
      }
      return result;
    } catch (error) {
      this.cachedCredits = this.cachedCredits.filter(c => c.id !== id);
      await this.setCache('cache_credits', this.cachedCredits);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async getMessages(): Promise<ApiResponse<Message[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/messages`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<Message[]>(response);
      if (result.success && result.data) {
        this.cachedMessages = result.data;
        await this.setCache('cache_messages', result.data);
      }
      return result;
    } catch (error) {
      return { success: true, data: this.cachedMessages, message: 'Données hors ligne' };
    }
  }

  async createMessage(data: { toUserId: number; content: string }): Promise<ApiResponse<Message>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<Message>(response);
      if (result.success && result.data) {
        this.cachedMessages = [...this.cachedMessages, result.data];
        await this.setCache('cache_messages', this.cachedMessages);
      }
      return result;
    } catch (error) {
      const newMessage: Message = {
        ...data,
        id: Date.now(),
        fromUserId: this.user?.id || 0,
        createdAt: new Date().toISOString()
      };
      this.cachedMessages = [...this.cachedMessages, newMessage];
      await this.setCache('cache_messages', this.cachedMessages);
      return { success: true, data: newMessage, message: 'Envoyé localement' };
    }
  }

  async deleteMessage(id: number): Promise<ApiResponse<void>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/messages/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const result = await this.handleResponse<void>(response);
      if (result.success) {
        this.cachedMessages = this.cachedMessages.filter(m => m.id !== id);
        await this.setCache('cache_messages', this.cachedMessages);
      }
      return result;
    } catch (error) {
      this.cachedMessages = this.cachedMessages.filter(m => m.id !== id);
      await this.setCache('cache_messages', this.cachedMessages);
      return { success: true, message: 'Supprimé localement' };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    await this.waitUntilReady();
    return !!this.token;
  }

  async getUser(): Promise<AuthResponse | null> {
    await this.waitUntilReady();
    return this.user;
  }

  async updateUser(data: Partial<AuthResponse>): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);

      if (result.success && result.data) {
        this.user = { ...this.user, ...result.data } as AuthResponse;
        await this.saveAuthToStorage();
      }

      return result;
    } catch (error) {
      // If API isn't available, update local user
      if (this.user) {
        this.user = { ...this.user, ...data } as AuthResponse;
        await this.saveAuthToStorage();
      }
      return {
        success: true,
        data: { ...this.user, ...data } as AuthResponse
      };
    }
  }

  async checkTokenValidity(): Promise<boolean> {
    if (!this.token) return false;
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      if (response.status === 401 || response.status === 403) {
        await this.logout();
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }
}

export const api = new ApiService();
