import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = api.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.request<User>('/auth/me', {}, true);
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      api.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (token: string, refreshToken: string) => {
    api.setTokens(token, refreshToken);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' }, true);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      api.clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
