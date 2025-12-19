'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Import Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Đăng ký các thành phần của Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  candidate_count: number;
  source_distribution: SourceStat[];
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ 
    candidate_count: 0, 
    source_distribution: [] 
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !user_group || !user_id) return;
      try {
        const res = await fetch(N8N_STATS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_group, user_id }),
        });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error("Lỗi lấy stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user_group, user_id, authLoading]);

  // Cấu hình dữ liệu cho Biểu đồ Doughnut
  const chartData = {
    labels: stats.source_distribution.map(s => s.name),
    datasets: [
      {
        data: stats.source_distribution.map(s => s.count),
        backgroundColor: [
          '#3b82f6', // blue-500
          '#10b981', // emerald-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#8b5cf6', // violet-500
          '#ec4899', // pink-500
        ],
        borderWidth: 0,
        hoverOffset: 10,
        cutout: '75%', // Tạo lỗ hổng ở giữa cho số tổng
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false }, // Ẩn chú thích mặc định để tự làm chú thích bên dưới cho đẹp
    },
    maintainAspectRatio: false,
  };

  const renderRoleSpecificDashboard = () => {
    if (statsLoading) {
      return <div className="text-center py-20 text-gray-400">Đang tính toán dữ liệu...</div>;
    }

    return (
      <div className="flex flex-col items-center">
        {/* Container biểu đồ với số tổng ở giữa */}
        <div className="relative w-64 h-64 mb-8">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-gray-800">{stats.candidate_count}</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Tổng ứng viên</span>
          </div>
        </div>

        {/* Legend (Chú thích) tùy chỉnh */}
        <div className="w-full space-y-3">
          {stats.source_distribution.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: chartData.datasets[0].backgroundColor[idx] }}
                />
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-800">{item.count}</span>
                <span className="text-xs text-gray-400 ml-1">({item.percentage}%)</span>
              </div>
            </div>
          ))}
          
          {stats.source_distribution.length === 0 && (
            <p className="text-center text-sm text-gray-400 italic">Không có dữ liệu nguồn để hiển thị.</p>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT CARD: USER INFO */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-3">
              <span className="text-3xl font-bold text-white tracking-tighter">KO</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Xin chào, {name.split(' ').pop()}!</h1>
            <p className="text-gray-400 mb-8 mt-1">Vai trò: <span className="text-blue-600 font-semibold uppercase">{user_group}</span></p>
            
            <div className="space-y-3 text-left">
              <Link href="/candidates" className="flex items-center justify-between w-full bg-blue-50 text-blue-700 px-5 py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all font-bold group">
                Quản lý Ứng viên
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/profile" className="flex items-center justify-between w-full bg-gray-50 text-gray-600 px-5 py-4 rounded-2xl hover:bg-gray-100 transition-all font-bold group">
                Hồ sơ cá nhân
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            </div>
          </div>

          <button onClick={logout} className="mt-8 text-gray-400 hover:text-red-500 font-medium text-sm transition-colors flex items-center justify-center gap-2">
            Đăng xuất tài khoản
          </button>
        </div>

        {/* RIGHT CARD: CHART */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-gray-800 font-bold text-lg">Thống kê nguồn dữ liệu</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">Real-time</span>
          </div>
          
          {renderRoleSpecificDashboard()}
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
