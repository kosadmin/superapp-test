'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

  const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/auth';

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

    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.username) {
          setUsername(data.username);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    );
  }

  if (!username) {
    return null; // Redirect sẽ handle
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Chào mừng bạn!
        </h1>

        <p className="text-lg text-gray-700 mb-6">
          User <span className="font-semibold text-blue-600">{username}</span> đã đăng nhập thành công
        </p>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition font-medium"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
