import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

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

const TOKEN_KEY = '@comptabilite:token';
const USER_KEY = '@comptabilite:user';

class ApiService {
  private token: string | null = null;
  private user: AuthResponse | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY)
      ]);
      
      this.token = token;
      this.user = userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  private async saveToStorage(token: string, user: AuthResponse) {
    try {
      this.token = token;
      this.user = user;
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      ]);
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private async clearStorage() {
    try {
      this.token = null;
      this.user = null;
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY)
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
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
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);
      if (result.success && result.data) {
        await this.saveToStorage(result.data.token, result.data);
      }
      return result;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      const result = await this.handleResponse<AuthResponse>(response);
      if (result.success && result.data) {
        await this.saveToStorage(result.data.token, result.data);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async logout() {
    await this.clearStorage();
  }

  async getMe(): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await this.handleResponse<AuthResponse>(response);
    } catch (error) {
      console.error('GetMe error:', error);
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): AuthResponse | null {
    return this.user;
  }

  async getStats(): Promise<ApiResponse<any>> {
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
}

export const api = new ApiService();
