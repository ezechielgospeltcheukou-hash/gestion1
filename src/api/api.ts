const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://comptabilite-production-08f2.up.railway.app/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

interface AuthResponse {
  id: number;
  username: string;
  email?: string;
  role: 'ADMIN' | 'EMPLOYEE';
  businessName?: string;
  token: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email?: string;
  password: string;
  businessName?: string;
}

interface Client {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance?: number;
}

interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  minQuantity?: number;
}

interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Sale {
  id?: number;
  date: string;
  total: number;
  paymentMethod: string;
  items?: any[];
}

interface Expense {
  id?: number;
  date: string;
  description: string;
  amount: number;
  category: string;
}

class ApiService {
  private token: string | null = null;
  private user: AuthResponse | null = null;
  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = Promise.resolve();
  }

  async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, message: data.message || 'Une erreur est survenue' };
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();
    try {
      console.log('Calling register API at:', `${API_BASE_URL}/auth/register`);
      console.log('Sending data:', data);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      console.log('Register response status:', response.status);
      const result = await this.handleResponse<AuthResponse>(response);
      console.log('Register result:', result);
      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data;
      }
      return result;
    } catch (error) {
      console.error('Register error details:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    await this.waitUntilReady();
    try {
      console.log('Calling login API at:', `${API_BASE_URL}/auth/login`);
      console.log('Sending data:', data);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      console.log('Login response status:', response.status);
      const result = await this.handleResponse<AuthResponse>(response);
      console.log('Login result:', result);
      if (result.success && result.data) {
        this.token = result.data.token;
        this.user = result.data;
      }
      return result;
    } catch (error) {
      console.error('Login error details:', error);
      return { success: false, message: 'Erreur de connexion au serveur: ' + (error as Error).message };
    }
  }

  async logout() {
    this.token = null;
    this.user = null;
  }

  async getStats(): Promise<ApiResponse<any>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('GetStats error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async getClients(): Promise<ApiResponse<Client[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<Client[]>(response);
    } catch (error) {
      console.error('GetClients error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async createClient(data: Client): Promise<ApiResponse<Client>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<Client>(response);
    } catch (error) {
      console.error('CreateClient error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async getProducts(): Promise<ApiResponse<Product[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<Product[]>(response);
    } catch (error) {
      console.error('GetProducts error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async createProduct(data: Product): Promise<ApiResponse<Product>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<Product>(response);
    } catch (error) {
      console.error('CreateProduct error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async getSales(): Promise<ApiResponse<Sale[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<Sale[]>(response);
    } catch (error) {
      console.error('GetSales error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async createSale(data: any): Promise<ApiResponse<Sale>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<Sale>(response);
    } catch (error) {
      console.error('CreateSale error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async getSuppliers(): Promise<ApiResponse<Supplier[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<Supplier[]>(response);
    } catch (error) {
      console.error('GetSuppliers error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async createSupplier(data: Supplier): Promise<ApiResponse<Supplier>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<Supplier>(response);
    } catch (error) {
      console.error('CreateSupplier error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<Expense[]>(response);
    } catch (error) {
      console.error('GetExpenses error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async createExpense(data: Expense): Promise<ApiResponse<Expense>> {
    await this.waitUntilReady();
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<Expense>(response);
    } catch (error) {
      console.error('CreateExpense error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
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
}

export const api = new ApiService();
