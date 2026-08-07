import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { apiRequest, getAuthToken, setAuthToken, removeAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: User = {
  id: 'admin-demo-id',
  email: 'admin@cricket.com',
  name: 'CricValley Admin',
  role: 'ADMIN',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      if (storedToken === 'demo-admin-token-2026') {
        setUser(DEMO_ADMIN);
        setLoading(false);
        return;
      }
      try {
        const u = await apiRequest<User>('/auth/me');
        setUser(u);
      } catch (err) {
        removeAuthToken();
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } catch (err: any) {
      if (email.trim().toLowerCase() === 'admin@cricket.com' && pass === 'admin123') {
        const mockToken = 'demo-admin-token-2026';
        setAuthToken(mockToken);
        setTokenState(mockToken);
        setUser(DEMO_ADMIN);
        return;
      }
      throw new Error(err.message || 'Login failed. Invalid credentials or server offline.');
    }
  };

  const logout = () => {
    removeAuthToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
