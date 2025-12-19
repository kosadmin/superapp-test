'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

// Định nghĩa kiểu dữ liệu cho stats
interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  candidate_count: number | string;
  source_distribution: SourceStat[];
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({ 
    candidate_count: '...', 
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
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Lỗi lấy stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user_group, user_id, authLoading]);

  const renderRoleSpecificDashboard = () => {
    const colorMap: any = {
      admin: "bg-red-50 border-red-200 text-red-700",
      manager: "bg-amber-50 border-amber-200 text-amber-700",
      recruiter: "bg-emerald-50 border-emerald-200 text-emerald-700"
    };
    const currentClass = colorMap[user_group?.toLowerCase() || ''] || "bg-gray-50 border-gray-200 text-gray-700";

    return (
      <div className="space-y-6">
        {/* Card tổng số lượng */}
        <div className={`p-6 border-2 rounded-xl ${currentClass}`}>
          <h2 className="text-lg font-bold mb-1">Phạm vi: {user_group}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.candidate_count}</span>
            <span className="text-sm font-medium opacity-80">Ứng viên</span>
          </div>
        </div>

        {/* Danh sách tỉ lệ nguồn */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Phân tích nguồn dữ liệu</h4>
          {statsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.source_distribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.count} UV ({item.percentage}%)</span>
                  </div>
                  {/* Thanh progress bar đơn giản */}
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {stats.source_distribution.length === 0 && (
                <p className="text-sm text-gray-400 italic">Không có dữ liệu nguồn.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Giữ nguyên phần return chính của bạn...
  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SECTION 1: USER INFO (Giữ nguyên code của bạn) */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Xin chào!</h1>
          <p className="text-xl mb-8 font-bold text-blue-600">{name}</p>
          <div className="space-y-3">
            <Link href="/candidates" className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">Quản lý Ứng viên</Link>
            <Link href="/profile" className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">Thông tin tài khoản</Link>
            <button onClick={logout} className="w-full bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition">Đăng xuất</button>
          </div>
        </div>

        {/* SECTION 2: STATS & SOURCE CHART */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-white/50">
          <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-6 border-b pb-2">Báo cáo tình hình dữ liệu</h3>
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
