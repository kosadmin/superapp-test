'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// THAY URL WEBHOOK N8N CỦA BẠN VÀO ĐÂY
const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/auth'; // ← DÁN URL THẬT CỦA BẠN VÀO ĐÂY

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Kiểm tra token khi vào trang login → nếu còn hạn thì đẩy thẳng sang dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) router.replace('/dashboard');
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password,
          remember,
        }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        // Lưu token vào cookie (có thể đọc được ở server middleware)
document.cookie = `auth_token=${data.token}; path=/; max-age=2592000`; // 30 ngày

localStorage.setItem('token', data.token); // vẫn giữ để các trang khác dùng
        router.push('/dashboard');
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Đăng nhập hệ thống</h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="mr-2"
            />
            <span>Nhớ đăng nhập (30 ngày)</span>
          </label>

          {error && <p className="text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Test account: <strong>admin</strong> / <strong>Kos@8386</strong>
        </p>
      </div>
    </div>
  );
}
