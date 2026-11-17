import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shopsphere_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('shopsphere_token');
  });

  useEffect(() => {
    if (token && !user) {
      authApi.getCurrentUser()
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('shopsphere_user', JSON.stringify(res.data));
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData as User);
      localStorage.setItem('shopsphere_token', jwtToken);
      localStorage.setItem('shopsphere_user', JSON.stringify(userData));
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string }) => {
    const res = await authApi.register(data);
    if (res.success && res.data) {
      const { token: jwtToken, ...userData } = res.data;
      setToken(jwtToken);
      setUser(userData as User);
      localStorage.setItem('shopsphere_token', jwtToken);
      localStorage.setItem('shopsphere_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shopsphere_token');
    localStorage.removeItem('shopsphere_user');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user ? user.roles.includes('ROLE_ADMIN') : false;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
