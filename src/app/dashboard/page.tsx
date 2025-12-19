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
      admin: "text-red-600 bg-red-50 border-red-100",
      manager: "text-amber-600 bg-amber-50 border-amber-100",
      recruiter: "text-emerald-600 bg-emerald-50 border-emerald-100"
    };
    const currentTheme = colorMap[user_group?.toLowerCase() || ''] || "text-gray-600 bg-gray-50 border-gray-100";

    return (
      <div className="space-y-6">
        {/* Card tổng số lượng - Tinh gọn lại */}
        <div className={`p-4 border rounded-xl flex items-center justify-between ${currentTheme}`}>
          <div>
            <p className="text-xs uppercase font-bold opacity-70">Phạm vi dữ liệu</p>
            <h2 className="text-lg font-black">{user_group}</h2>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black">{stats.candidate_count}</span>
            <span className="text-xs ml-1 font-bold">UV</span>
          </div>
        </div>

        {/* Nhóm Biểu đồ nguồn ứng viên */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-bold text-gray-700 uppercase">Biểu đồ nguồn ứng viên</h4>
          </div>

          {statsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {stats.source_distribution.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-medium text-gray-600 truncate mr-2">
                    {item.name}
                  </span>
                  <div className="text-xs font-bold text-gray-900 whitespace-nowrap">
                    {item.count} <span className="text-[10px] text-gray-400 font-normal">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
              {stats.source_distribution.length === 0 && (
                <p className="text-[11px] text-gray-400 italic text-center py-2">Không có dữ liệu nguồn.</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: USER INFO */}
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center flex flex-col justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-1 italic text-gray-500">Xin chào,</h1>
          <p className="text-2xl mb-8 font-black text-blue-700 uppercase tracking-tight">{name}</p>
          
          <div className="space-y-3">
            <Link href="/candidates" className="block w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg hover:shadow-blue-200">
              Quản lý Ứng viên
            </Link>
            <Link href="/profile" className="block w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 rounded-xl hover:bg-indigo-50 transition-all font-bold">
              Thông tin tài khoản
            </Link>
            <button onClick={logout} className="w-full text-red-500 hover:text-red-700 text-sm font-bold mt-4 transition-colors">
              Đăng xuất tài khoản
            </button>
          </div>
        </div>

        {/* SECTION 2: STATS & SOURCE CHART GROUP */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-white/50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-400 uppercase tracking-tighter text-xs font-black">Báo cáo tình hình</h3>
            {statsLoading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>
          
          {renderRoleSpecificDashboard()}
          
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-center gap-2 px-3 py-1 bg-gray-100 rounded-full w-fit mx-auto">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Hệ thống thời gian thực</span>
            </div>
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
