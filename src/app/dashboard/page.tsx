'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Tách nội dung Dashboard ra một component riêng
function DashboardContent() {
  const { user_id, name, username, logout, isLoading } = useAuth();

  // Xác định tên hiển thị: Ưu tiên tên thật (name), nếu không có thì dùng username
  const displayName = name && name.trim() !== '' ? name : (username || 'User');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        {/* Icon Success */}
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
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium text-lg transition"
          >
            Đăng xuất
          </button>
        </div>
        
        {/* Hiển thị ID để debug nếu cần */}
        <p className="mt-6 text-xs text-gray-400">User ID: {user_id}</p>
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
