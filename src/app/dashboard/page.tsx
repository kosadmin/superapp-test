'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

interface DashboardStats {
  total_all_time: number;
  onboard_this_month: number;
  new_this_month_count: number;
  applied_permission: string;
  today: { interview: number; onboard: number };
  source_distribution_monthly: { name: string; count: number; percentage: number }[];
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user_group, user_id, authLoading]);

  const renderSection2 = () => {
    return (
      <div className="space-y-6">
        {/* Header trạng thái */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Scope: {stats?.applied_permission || '...'}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
        </div>

        {/* 4 Ô SỐ LIỆU CHÍNH (QUICK STATS) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dự án đang tuyển</p>
            <p className="text-xl font-black text-slate-400">--</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tổng ứng viên</p>
            <p className="text-xl font-black text-slate-800">{loading ? '...' : stats?.total_all_time}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Nhận việc mới (Tháng)</p>
            <p className="text-xl font-black text-blue-700">{loading ? '...' : stats?.onboard_this_month}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tỷ lệ chuyển đổi</p>
            <p className="text-xl font-black text-slate-400">--%</p>
          </div>
        </div>

        {/* LỊCH TRÌNH HÔM NAY */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold opacity-70 uppercase mb-3 tracking-widest">Lịch trình hôm nay</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black">{loading ? '..' : stats?.today.interview}</p>
                <p className="text-[10px] font-medium opacity-80">Phỏng vấn</p>
              </div>
              <div>
                <p className="text-2xl font-black">{loading ? '..' : stats?.today.onboard}</p>
                <p className="text-[10px] font-medium opacity-80">Nhận việc</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
          </div>
        </div>

        {/* THỐNG KÊ NGUỒN MỚI TRONG THÁNG */}
        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nguồn ứng viên mới (Tháng)</h4>
            <span className="text-xs font-bold text-slate-800">{loading ? '...' : stats?.new_this_month_count} hồ sơ</span>
          </div>
          
          <div className="space-y-2">
            {!loading && stats?.source_distribution_monthly.map((item, idx) => (
              <div key={idx} className="group flex flex-col gap-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                  <span>{item.name}</span>
                  <span>{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {!loading && stats?.source_distribution_monthly.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4 italic">Chưa có dữ liệu mới trong tháng này</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: PROFILE - GIỮ NGUYÊN HOẶC TINH CHỈNH NHẸ */}
        <div className="bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl border border-gray-200/50 text-center flex flex-col justify-center items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-3xl mb-6 flex items-center justify-center shadow-2xl rotate-3 transform transition hover:rotate-0">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Portal Access</p>
          <h1 className="text-3xl font-black text-slate-800 mb-10 leading-tight">{name}</h1>
          <div className="w-full space-y-3">
            <Link href="/candidates" className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all font-bold shadow-lg active:scale-95">
              Quản lý Ứng viên
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <Link href="/profile" className="block w-full bg-white border-2 border-slate-100 text-slate-500 py-3.5 rounded-2xl hover:border-blue-200 hover:text-blue-600 transition-all font-bold text-sm">
              Thông tin cá nhân
            </Link>
            <button onClick={logout} className="text-red-400 hover:text-red-600 py-4 transition font-bold text-[10px] uppercase tracking-widest">
              Đăng xuất hệ thống
            </button>
          </div>
        </div>

        {/* RIGHT: DASHBOARD DATA */}
        <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-xl border border-gray-200/50">
          {renderSection2()}
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
