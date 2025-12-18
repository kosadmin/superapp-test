'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const N8N_AUTH_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

interface AuthData {
  username: string | null;
  name: string | null;      // Thêm trường Tên hiển thị
  user_id: string | null;
  user_group: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthData {
  setAuthData: (data: Partial<AuthData>) => void;
  logout: () => void;
  checkAuth: () => Promise<void>; // Hàm để gọi xác thực lại khi cần
}

const defaultAuthData: AuthData = {
  username: null,
  name: null,
  user_id: null,
  user_group: null,
  isAuthenticated: false,
  isLoading: true, // Mặc định là true để ProtectedRoute hiển thị loading
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthData>(defaultAuthData);

  // Hàm cập nhật data linh hoạt
  const setAuthData = (data: Partial<AuthData>) => {
    setAuth(prev => ({ ...prev, ...data }));
  };

  // Hàm Logout tập trung
  const logout = () => {
    localStorage.removeItem('token');
    setAuth({ ...defaultAuthData, isLoading: false });
  };

  // Logic xác thực phiên làm việc (Check Token)
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setAuth(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
      return;
    }

    try {
      // BƯỚC 1: Verify Token lấy username
      const verifyRes = await fetch(N8N_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success || !verifyData.username) {
        throw new Error('Token invalid');
      }

      // BƯỚC 2: Lấy thông tin chi tiết (name, user_id, user_group)
      const infoRes = await fetch(N8N_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'get_user_info', 
          username: verifyData.username 
        }),
      });
      const infoData = await infoRes.json();

      if (infoData.success && infoData.user) {
        setAuth({
          username: infoData.user.username,
          name: infoData.user.name,
          user_id: infoData.user.user_id,
          user_group: infoData.user.user_group,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('User info not found');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout(); // Xóa sạch nếu lỗi
    }
  };

  // Chạy kiểm tra ngay khi khởi tạo ứng dụng (hoặc khi refresh trang)
  useEffect(() => {
    checkAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...auth,
    setAuthData,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
