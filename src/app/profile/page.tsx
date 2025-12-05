'use client';

import { useEffect, useState } from 'react';
import { useRouter from 'next/navigation';

// URL n8n giống 2 trang kia
const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth'; // ← DÁN URL THẬT CỦA BẠN VÀO ĐÂY

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    // Gọi verify để lấy username trước
    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.username) {
          // Sau khi có username → gọi thêm 1 lần mới để lấy full thông tin từ sheet users
          return fetch(N8N_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_user_info',        // action mới mình sẽ thêm ở bước 2
              username: data.username
            }),
          }).then(r => r.json());
        } else {
          throw new Error('Invalid token');
        }
      })
      .then(info => {
        setUserInfo(info.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      });
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Đang tải thông tin...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Thông tin tài khoản
        </h1>

        <div className="space-y-6 text-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-medium text-gray-600">Username:</div>
            <div className="font-bold">{userInfo?.username}</div>

            <div className="font-medium text-gray-600">Họ tên:</div>
            <div className="font-bold">{userInfo?.name || '—'}</div>

            <div className="font-medium text-gray-600">Email:</div>
            <div className="font-bold">{userInfo?.email || '—'}</div>

            <div className="font-medium text-gray-600">Nhóm người dùng:</div>
            <div className="font-bold">{userInfo?.user_group || '—'}</div>

            <div className="font-medium text-gray-600">Trạng thái:</div>
            <div className="font-bold text-green-600">{userInfo?.user_status === 'active' ? 'Đang hoạt động' : 'Khóa'}</div>

            <div className="font-medium text-gray-600">Ngày tạo:</div>
            <div className="font-bold">{userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('vi-VN') : '—'}</div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="mt-10 w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
        >
          Quay lại Dashboard
        </button>
      </div>
    </div>
  );
}
