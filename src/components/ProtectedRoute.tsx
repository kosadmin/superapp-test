// src/components/ProtectedRoute.tsx (ĐÃ CẬP NHẬT)
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/AuthContext'; 

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/auth'; // webhook verify của bạn

// Component con chịu trách nhiệm xác thực
function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuthData, isAuthenticated, isLoading } = useAuth(); 

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

        if (data.success) {
          const user = {
            username: data.username || null,
            user_id: data.user_id || null, 
            name: data.name || null, 
            user_group: data.user_group || null,
            isAuthenticated: true,
            isLoading: false,
          };
          setAuthData(user);
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
    // Chúng ta bọc AuthProvider tại đây
    return (
      <AuthProvider>
          <AuthCheck>{children}</AuthCheck>
      </AuthProvider>
    );
}
