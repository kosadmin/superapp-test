'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

// --- Types ---
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

  // --- Fetch Data ---
  useEffect(() => {
    const fetchStats = async () => {
      // Chỉ fetch khi auth đã xong và có đủ định danh
      if (authLoading || !user_group || !user_id) return;

      try {
        setStatsLoading(true);
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
        console.error("Lỗi lấy dữ liệu dashboard:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user_group, user_id, authLoading]);

  // --- UI Components ---
  const renderRoleSpecificDashboard = () => {
    const colorMap: Record<string, string> = {
      admin: "bg-red-50 border-red-100 text-red-700",
      manager: "bg-amber-50 border-amber-100 text-amber-700",
      recruiter: "bg-emerald-50 border-emerald-100 text-emerald-700"
    };
    
    const currentClass = colorMap[user_group?.toLowerCase() || ''] || "bg-gray-50 border-gray-100 text-gray-700";

    return (
      <div className="space-y-8">
        {/* Phần 1: Tổng số lượng dựa trên quyền */}
        <div className={`p-6 border rounded-2xl shadow-sm transition-all ${currentClass}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold opacity-70">Phạm vi truy cập</p>
              <h2 className="text-lg font-black uppercase">{user_group}</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black block leading-none">
                {statsLoading ? '...' : stats.candidate_count}
              </span>
              <span className="text-xs font-bold opacity-70">Ứng viên hợp lệ</span>
            </div>
          </div>
        </div>

        {/* Phần 2: Biểu đồ nguồn ứng viên (Source Distribution) */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Nguồn ứng viên</h4>
            {!statsLoading && (
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                REAL-TIME
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-2"></div>
                  <div className="h-2 bg-gray-50 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {stats.source_distribution.length > 0 ? (
                stats.source_distribution.map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-gray-400">
                        {item.count} UV <span className="ml-1 text-gray-300">|</span> <span className="ml-1 text-blue-500">{item.percentage}%</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-sm text-gray-400 italic">Không tìm thấy dữ liệu nguồn phù hợp.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 text-slate-900">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* --- CỘT TRÁI: USER INFO & NAVIGATION (4/12) --- */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-3xl rotate-12 absolute inset-0 blur-lg opacity-30"></div>
            <div className="w-24 h-24 bg-white rounded-3xl shadow-inner flex items-center justify-center relative border border-emerald-100">
              <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl text-slate-400 font-medium">Hệ thống quản trị</h1>
          <p className="text-2xl font-black text-slate-800 mt-1 mb-8">
            {name || '...'}
          </p>

          <div className="w-full space-y-3">
            <Link 
              href="/candidates" 
              className="group flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all font-bold shadow-lg shadow-slate-200"
            >
              Quản lý Ứng viên
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            
            <Link 
              href="/profile" 
              className="block w-full bg-white text-slate-600 border border-slate-200 py-4 rounded-2xl hover:bg-slate-50 transition-all font-bold"
            >
              Thông tin hồ sơ
            </Link>

            <div className="pt-4">
              <button 
                onClick={logout} 
                className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: BÁO CÁO CHI TIẾT (8/12) --- */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Thống kê dữ liệu</h3>
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
