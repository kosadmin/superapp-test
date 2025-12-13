// src/contexts/AuthContext.tsx (Đã sửa)

import { createContext, useContext, useState, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho thông tin người dùng
interface AuthData {
  username: string | null;
  user_id: string | null; // <--- TRƯỜNG MỚI
  user_group: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ... (phần AuthContextType và useAuth không đổi)

const defaultAuthData: AuthData = {
  username: null,
  user_id: null, // <--- KHỞI TẠO
  user_group: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ... (hàm useAuth không đổi)

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
