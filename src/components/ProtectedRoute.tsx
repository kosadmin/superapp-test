// src/components/ProtectedRoute.tsx (Đã sửa)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext'; // Import AuthContext

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth'; // webhook verify của bạn

// Component con chịu trách nhiệm xác thực
function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuthData, isAuthenticated, isLoading } = useAuth(); // Lấy từ context

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthData({ isLoading: false, isAuthenticated: false });
        router.replace('/login');
        return;
      }

      try {
        const res = await fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', token }),
        });
        const data = await res.json();

        // CHỖ NÀY ĐÃ CẬP NHẬT
        if (data.success) {
          setAuthData({
            isAuthenticated: true,
            username: data.username || null,
            user_group: data.user_group || null,
            isLoading: false,
          });
        } else {
          localStorage.removeItem('token');
          setAuthData({ isAuthenticated: false, isLoading: false });
          router.replace('/login');
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
        localStorage.removeItem('token');
        setAuthData({ isAuthenticated: false, isLoading: false });
        router.replace('/login');
      }
    };

    if (isLoading) {
        checkAuth();
    }
    
  }, [router, setAuthData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl font-medium text-gray-700">Đang kiểm tra phiên đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Đã redirect hoặc đang chờ redirect
  }

  return <>{children}</>;
}


// Component chính bọc AuthProvider
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    // Chúng ta cần bọc AuthProvider ở cấp độ cao hơn (Layout hoặc Component Cha)
    // Nhưng để giữ ProtectedRoute là một Component độc lập, chúng ta bọc nó lại.
    // LƯU Ý: Nếu bạn có thể, hãy đặt AuthProvider trong file src/app/layout.tsx
    // để tránh việc AuthProvider được tạo lại mỗi khi ProtectedRoute được gọi.
    return (
      <AuthProvider>
          <AuthCheck>{children}</AuthCheck>
      </AuthProvider>
    );
}
