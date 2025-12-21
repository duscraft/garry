const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081/api/v1';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

interface RequestConfig extends RequestInit {
  token?: string;
}

class ApiClient {
  private static instance: ApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private async refreshTokens(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${AUTH_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  public async request<T>(endpoint: string, config: RequestConfig = {}, isAuthService = false): Promise<T> {
    const baseUrl = isAuthService ? AUTH_URL : API_URL;
    const url = `${baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (this.accessToken) {
      (headers as any)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...config, headers });

    // Handle 401 Unauthorized (Token expired)
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed && this.accessToken) {
        // Retry with new token
        (headers as any)['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Session expirée');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }
}

export const api = ApiClient.getInstance();
