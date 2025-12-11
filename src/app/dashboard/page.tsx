'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// URL n8n của bạn (đã đúng rồi)
const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth';

export default function DashboardPage() {
  const [username, setUsername] = useState<string | null>(null);
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
        if (data.success && data.username) {
          setUsername(data.username);
          setName(data.name);
        } else {
          localStorage.removeItem('token');
          router.replace('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Đang kiểm tra...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4">Đăng nhập thành công!</h1>
        <p className="text-xl mb-8">
          Xin chào <span className="font-bold text-blue-600">{name}</span>
        </p>

        {/* === 2 NÚT MỚI ĐẸP ĐÂY === */}
        <div className="space-y-4">
          <a
            href="/profile"
            className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg transition"
          >
            Thông tin tài khoản
          </a>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium text-lg transition"
          >
            Đăng xuất
          </button>
        </div>
        {/* ========================= */}

      </div>
    </div>
  );
}
