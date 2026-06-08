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

class ApiService {
  private token: string | null = null;
  private user: AuthResponse | null = null;

  constructor() {
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

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): AuthResponse | null {
    return this.user;
  }
}

export const api = new ApiService();
