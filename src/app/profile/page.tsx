'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';   // ← ĐÃ SỬA ĐÚNG DẤU NGOẶC

// URL n8n của bạn (đúng rồi)
const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

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

    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error();
        return fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_user_info',
            username: data.username
          }),
        }).then(r => r.json());
      })
      .then(res => {
        if (res.user) {
          setUserInfo(res.user);
        } else {
          throw new Error();
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Đang tải thông tin...</div>;
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
          className="mt-10 w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg"
        >
          ← Quay lại Dashboard
        </button>
      </div>
    </div>
  );
}
