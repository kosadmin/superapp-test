'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
  // Lấy name và user_group từ AuthContext
  const { name, user_group, logout, isLoading } = useAuth();

  // Hàm render nội dung cho Section 2 dựa trên role
  const renderRoleSpecificDashboard = () => {
    switch (user_group?.toLowerCase()) {
      case 'admin':
        return (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
            <h2 className="text-xl font-bold text-red-700">Dashboard Admin</h2>
            <p className="text-gray-600 italic">Hệ thống quản trị và cấu hình toàn cục.</p>
          </div>
        );
      case 'manager':
        return (
          <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <h2 className="text-xl font-bold text-amber-700">Dashboard Manager</h2>
            <p className="text-gray-600 italic">Báo cáo tổng hợp và phê duyệt ứng viên.</p>
          </div>
        );
      case 'recruiter':
        return (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
            <h2 className="text-xl font-bold text-emerald-700">Dashboard Recruiter</h2>
            <p className="text-gray-600 italic">Theo dõi tiến độ tuyển dụng hàng ngày.</p>
          </div>
        );
      default:
        return (
          <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <p className="text-gray-500 italic">Đang xác định vai trò người dùng...</p>
          </div>
        );
    }
  };

  if (isLoading) return null; // ProtectedRoute đã hiển thị loading rồi

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- SECTION 1: THÔNG TIN CHUNG --- */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center border border-white/50">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Đăng nhập thành công!</h1>
          <p className="text-xl mb-8">
            Xin chào <span className="font-bold text-blue-600">{name || '...'}</span>
          </p>

          <div className="space-y-3">
            <Link
              href="/candidates"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition shadow-md"
            >
              Quản lý Ứng viên
            </Link>

            <Link
              href="/profile"
              className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium transition shadow-md"
            >
              Thông tin tài khoản
            </Link>

            <button
              onClick={logout}
              className="w-full bg-red-100 text-red-600 py-3 rounded-lg hover:bg-red-200 font-medium transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* --- SECTION 2: MÀN HÌNH RIÊNG THEO ROLE --- */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col justify-center border border-white/50">
          <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">Hệ thống chức năng</h3>
          
          {renderRoleSpecificDashboard()}
          
          <div className="mt-8">
            <p className="text-sm text-gray-400">
              Bạn đang đăng nhập với quyền: <span className="font-mono font-bold text-gray-600 uppercase">{user_group}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
