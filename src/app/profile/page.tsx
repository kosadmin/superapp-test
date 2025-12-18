'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

function ProfileContent() {
  const router = useRouter();
  const { username, isLoading: isAuthLoading } = useAuth(); // Lấy username từ Context

  const [userInfo, setUserInfo] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchFullUserInfo = async () => {
      // Chỉ chạy khi ProtectedRoute đã xác thực xong và có username
      if (isAuthLoading || !username) return;

      setDataLoading(true);
      try {
        const res = await fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_user_info',
            username: username,
          }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUserInfo(data.user);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin chi tiết:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFullUserInfo();
  }, [username, isAuthLoading]);

  // Hiển thị loading kết hợp
  if (isAuthLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        {isAuthLoading ? 'Đang xác thực...' : 'Đang tải thông tin chi tiết...'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-10 text-blue-700">
          Thông tin tài khoản
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="font-medium text-gray-600">Username:</div>
          <div className="font-bold text-gray-900">{userInfo?.username}</div>

          <div className="font-medium text-gray-600">Họ tên:</div>
          <div className="font-bold text-gray-900">{userInfo?.name || '—'}</div>

          <div className="font-medium text-gray-600">Email:</div>
          <div className="font-bold text-gray-900">{userInfo?.email || '—'}</div>

          <div className="font-medium text-gray-600">Nhóm:</div>
          <div className="font-bold text-gray-900">{userInfo?.user_group || '—'}</div>

          <div className="font-medium text-gray-600">Trạng thái:</div>
          <div className={`font-bold ${userInfo?.user_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            {userInfo?.user_status === 'active' ? 'Hoạt động' : 'Bị khóa'}
          </div>

          <div className="font-medium text-gray-600">Ngày tạo:</div>
          <div className="font-bold text-gray-900">
            {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('vi-VN') : '—'}
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-10 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg transition shadow-md"
        >
          ← Quay lại Dashboard
        </button>
      </div>
    </div>
  );
}

// Bọc toàn bộ trong ProtectedRoute
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
