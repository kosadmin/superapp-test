// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho thông tin người dùng
interface AuthData {
  username: string | null;
  name: string | null; // THÊM TRƯỜNG NÀY
  user_id: string | null;
  user_group: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType extends AuthData {
  setAuthData: (data: Partial<AuthData>) => void;
  logout: () => void;
}

const defaultAuthData: AuthData = {
  username: null,
  name: null, // Default
  user_id: null,
  user_group: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthData>(defaultAuthData);

  const setAuthData = (data: Partial<AuthData>) => {
    setAuth(prev => ({ ...prev, ...data }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuth(defaultAuthData);
  };

  const contextValue: AuthContextType = {
    ...auth,
    setAuthData,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

