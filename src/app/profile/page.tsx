'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

function ProfileContent() {
  const router = useRouter();
  const { username, isLoading: isAuthLoading } = useAuth();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchFullUserInfo = async () => {
      // 1. Chờ xác thực xong mới chạy
      if (isAuthLoading) return;
      
      // 2. Nếu không có username (lỗi auth) thì dừng
      if (!username) {
        setDataLoading(false);
        return;
      }

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
        
        // FIX LỖI TẠI ĐÂY: n8n trả về mảng hoặc object chứa key 'user' 
        // Dựa trên output bạn đưa: { "user": { ... } }
        if (data.user) {
          setUserInfo(data.user);
        } else if (Array.isArray(data) && data[0]?.user) {
          // Trường hợp n8n trả về mảng bọc ngoài
          setUserInfo(data[0].user);
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin chi tiết:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFullUserInfo();
  }, [username, isAuthLoading]);

  // Hiển thị loading
  if (isAuthLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-medium text-gray-600">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {isAuthLoading ? 'Đang xác nhận danh tính...' : 'Đang tải hồ sơ...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center mb-10 text-blue-700">
          Thông tin tài khoản
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 text-lg border-t border-gray-100 pt-8">
          <div className="text-gray-500 font-medium">Username:</div>
          <div className="font-bold text-gray-900">{userInfo?.username || '—'}</div>

          <div className="text-gray-500 font-medium">Họ tên:</div>
          <div className="font-bold text-gray-900">{userInfo?.name || '—'}</div>

          <div className="text-gray-500 font-medium">Email:</div>
          <div className="font-bold text-gray-900 break-all">{userInfo?.email || '—'}</div>

          <div className="text-gray-500 font-medium">Nhóm:</div>
          <div className="font-bold text-gray-900 uppercase">{userInfo?.user_group || '—'}</div>

          <div className="text-gray-500 font-medium">Trạng thái:</div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              userInfo?.user_status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {userInfo?.user_status === 'active' ? 'Hoạt động' : 'Bị khóa'}
            </span>
          </div>

          <div className="text-gray-500 font-medium">Ngày tạo:</div>
          <div className="font-bold text-gray-900">
            {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('vi-VN') : '—'}
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-12 w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold text-lg transition-all shadow-lg active:scale-[0.98]"
        >
          ← Quay lại Dashboard
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
