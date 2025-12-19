'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  candidate_count: number | string;
  applied_permission: string;
  today: {
    interview: number;
    onboard: number;
  };
  source_distribution: SourceStat[];
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({ 
    candidate_count: '...', 
    applied_permission: '...',
    today: { interview: 0, onboard: 0 },
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

  const renderSection2 = () => {
    return (
      <div className="space-y-6">
        {/* Dòng trạng thái phạm vi dữ liệu */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Dữ liệu: <span className="text-blue-600">{stats.applied_permission}</span>
        </div>

        {/* --- DÒNG THÔNG BÁO HÔM NAY (MỚI THÊM) --- */}
        <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg">
          <p className="text-xs font-bold opacity-80 uppercase mb-3 tracking-widest">Lịch trình hôm nay</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm font-medium">
                <span className="text-xl font-black mr-1">{statsLoading ? '..' : stats.today.interview}</span> ứng viên phỏng vấn
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
              </div>
              <p className="text-sm font-medium">
                <span className="text-xl font-black mr-1">{statsLoading ? '..' : stats.today.onboard}</span> ứng viên nhận việc
              </p>
            </div>
          </div>
        </div>

        {/* NHÓM 1: THỐNG KÊ NGUỒN */}
        <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 shadow-inner">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b border-gray-200 pb-2">
            Thống kê nguồn ứng viên
          </h4>
          
          {statsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
              <div className="h-4 bg-gray-100 rounded w-full"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-medium text-gray-500">Tổng quy mô:</span>
                <span className="text-2xl font-black text-gray-800 leading-none">
                  {stats.candidate_count} <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Hồ sơ</span>
                </span>
              </div>

              <div className="space-y-2">
                {stats.source_distribution.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
                    <span className="text-xs font-bold text-gray-600 truncate">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">{item.count}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: PROFILE */}
        <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl border border-gray-200/50 text-center flex flex-col justify-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg rotate-3">
            <svg className="w-10 h-10 text-white -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cổng thông tin nhân sự</p>
          <h1 className="text-3xl font-black text-slate-800 mb-10 break-words leading-tight">{name}</h1>
          
          <div className="space-y-3">
            <Link href="/candidates" className="group flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all font-bold shadow-lg">
              Quản lý Ứng viên
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/profile" className="block w-full bg-white border-2 border-slate-200 text-slate-600 py-3.5 rounded-2xl hover:border-indigo-400 hover:text-indigo-600 transition-all font-bold text-sm">
              Thông tin cá nhân
            </Link>
            <button onClick={logout} className="w-full text-red-400 hover:text-red-600 py-2 transition font-bold text-xs uppercase tracking-tighter">
              Thoát tài khoản
            </button>
          </div>
        </div>

        {/* RIGHT: DASHBOARD DATA */}
        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
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
