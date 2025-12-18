// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_AUTH_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

function DashboardContent() {
  // Lấy dữ liệu từ AuthContext (đã được ProtectedRoute điền vào sau khi verify thành công)
  const { username, logout, isLoading: isAuthLoading } = useAuth();
  
  const [displayName, setDisplayName] = useState<string>('...');
  const [infoLoading, setInfoLoading] = useState(true);

  // Bước 2: Lấy thêm thông tin user chi tiết (name)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) return;

      setInfoLoading(true);
      try {
        const res = await fetch(N8N_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_user_info',
            username: username
          }),
        });
        const data = await res.json();
        
        if (data.success && data.user) {
          const name = data.user.name?.trim();
          setDisplayName(name && name !== '' ? name : username);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
        setDisplayName(username); // Fallback về username nếu lỗi
      } finally {
        setInfoLoading(false);
      }
    };

    if (!isAuthLoading) {
        fetchUserInfo();
    }
  }, [username, isAuthLoading]);

  // Hiển thị trạng thái chờ
  if (isAuthLoading || infoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        {isAuthLoading ? 'Đang xác thực phiên...' : 'Đang tải thông tin cá nhân...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        {/* Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4">Đăng nhập thành công!</h1>
        <p className="text-2xl mb-10">
          Xin chào <span className="font-bold text-blue-600">{displayName}</span>
        </p>

        <div className="space-y-4">
          <Link
            href="/candidates"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium text-lg transition shadow-md"
          >
            Quản lý Ứng viên
          </Link>

          <Link
            href="/profile"
            className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg transition shadow-md"
          >
            Thông tin tài khoản
          </Link>

          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium text-lg transition shadow-md"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

// Export mặc định được bọc trong ProtectedRoute
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
