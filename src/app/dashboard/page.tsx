// src/app/dashboard/page.tsx
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
  funnel: { new: number; scheduled: number; pass: number; onboard: number; };
  source_distribution_monthly: { name: string; count: number; percentage: number }[];
  ranking: {
    my_rank: number;
    total_in_group: number;
    group_name: string;
    leaderboard: { user_id: string; onboardCount: number }[];
  }
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
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchStats();
  }, [user_group, user_id, authLoading]);

  const renderSection2 = () => {
    return (
      <div className="space-y-6">
        {/* --- CÁC PHẦN CŨ GIỮ NGUYÊN --- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Scope: {stats?.applied_permission || '...'}
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tháng {new Date().getMonth() + 1}</span>
        </div>

        {/* QUICK STATS & LỊCH TRÌNH & PHỄU (GIỮ NGUYÊN NHƯ CODE BẠN GỬI) */}
        {/* ... (Phần 4 ô stats, Lịch trình màu indigo, Phễu) ... */}
        
        {/* THỐNG KÊ NGUỒN (GIỮ NGUYÊN) */}
        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Nguồn ứng viên mới</h4>
          <div className="space-y-3">
             {stats?.source_distribution_monthly.map((item, idx) => (
               <div key={idx} className="flex flex-col gap-1">
                 <div className="flex justify-between text-[11px] font-bold text-gray-600">
                   <span>{item.name}</span>
                   <span>{item.count}</span>
                 </div>
                 <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full rounded-full" style={{ width: `${item.percentage}%` }}></div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* --- PHẦN MỚI: XẾP HẠNG NHÂN VIÊN --- */}
        <div className="border-2 border-amber-100 rounded-3xl p-6 bg-gradient-to-b from-amber-50 to-white shadow-sm">
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 text-center">Xếp hạng nhân viên</h4>
          
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 font-medium">
              Bạn đứng top <span className="text-xl font-black text-amber-600">#{stats?.ranking.my_rank}</span> trong nhóm <span className="font-bold text-slate-800 uppercase">{stats?.ranking.group_name}</span> của tháng này.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 italic">Hãy tiếp tục cố gắng!</p>
          </div>

          <div className="space-y-2">
            {stats?.ranking.leaderboard.map((user, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  user.user_id === user_id 
                    ? 'bg-amber-500 text-white border-amber-400 shadow-lg scale-105' 
                    : 'bg-white border-gray-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    user.user_id === user_id ? 'bg-white text-amber-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold font-mono">{user.user_id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black">{user.onboardCount}</span>
                  <span className="text-[9px] font-bold uppercase opacity-70">onboard</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ... (Phần UI bao ngoài giữ nguyên như code bạn gửi) ...
  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: PROFILE (GIỮ NGUYÊN) */}
        <div className="bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl border border-gray-200/50 text-center flex flex-col justify-center items-center h-fit md:sticky md:top-8">
           {/* ... nội dung Profile ... */}
           <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-3xl mb-6 flex items-center justify-center shadow-2xl rotate-3">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Portal Access</p>
          <h1 className="text-3xl font-black text-slate-800 mb-10 leading-tight">{name}</h1>
          <div className="w-full space-y-3">
            <Link href="/candidates" className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all font-bold shadow-lg">
              Quản lý Ứng viên
            </Link>
            <Link href="/profile" className="block w-full bg-white border-2 border-slate-100 text-slate-500 py-3.5 rounded-2xl font-bold text-sm">
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
