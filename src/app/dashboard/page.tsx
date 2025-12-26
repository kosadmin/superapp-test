'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook/dashboard';

interface LeaderboardItem {
  id: string;
  name: string;
  onboardCount: number;
}

interface DashboardStats {
  total_this_month: number;
  onboard_this_month: number;
  new_this_month_count: number;
  applied_permission: string;
  commission_report?: { mkt: number; recruiter: number; vendor: number };
  today: { interview: number; onboard: number };
  funnel: {
    new: number;
    scheduled: number;
    pass: number;
    onboard: number;
  };
  source_distribution_monthly: { name: string; count: number; percentage: number }[];
  ranking: {
    my_rank: number;
    my_group: string;
    leaderboard: LeaderboardItem[];
    vendor_leaderboard?: LeaderboardItem[];
  };
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user_group === 'admin';
  const isManager = user_group === 'manager' || isAdmin;
  const isVendor = user_group === 'vendor';

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

  const RenderLeaderboard = (title: string, data: LeaderboardItem[] | undefined) => (
    <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm mt-4">
      <div className="mb-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title} (Tháng)</h4>
      </div>
      <div className="space-y-3">
        {!loading && data?.map((user, idx) => (
          <div key={user.id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${user.id === user_id ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {idx + 1}
              </span>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${user.id === user_id ? 'text-blue-700' : 'text-slate-700'}`}>{user.name}</span>
                <span className="text-[9px] text-slate-400 font-mono">ID: {user.id}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-800">{user.onboardCount}</span>
              <span className="text-[9px] block font-bold text-slate-400 uppercase">Onboard</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSection2 = () => {
    return (
      <div className="space-y-6">
        {/* Header Scope */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Scope: {stats?.applied_permission || '...'} ({user_group})
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
        </div>

        {/* SECTION: ADMIN COMMISSION REPORT */}
        {isAdmin && (
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden border border-slate-700">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Tổng phí tuyển dụng trong năm qua</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-medium text-slate-400">Hoa hồng tạo nguồn MKT</span>
                  <span className="text-sm font-bold text-white">{loading ? '...' : (stats?.commission_report?.mkt || 0).toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-medium text-slate-400">Hoa hồng nhân viên tuyển dụng</span>
                  <span className="text-sm font-bold text-white">{loading ? '...' : (stats?.commission_report?.recruiter || 0).toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">Hoa hồng CTV/vendor</span>
                  <span className="text-sm font-bold text-emerald-400">{loading ? '...' : (stats?.commission_report?.vendor || 0).toLocaleString()} đ</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dự án đang tuyển</p>
            <p className="text-xl font-black text-slate-400">--</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tổng ứng viên</p>
            <p className="text-xl font-black text-slate-800">{loading ? '...' : stats?.total_this_month}</p>
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

        {/* Schedule Today Card */}
        <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold opacity-70 uppercase mb-3 tracking-widest">
              {isAdmin ? 'Hệ thống hôm nay có' : isManager ? 'Đội ngũ của bạn có' : 'Hôm nay bạn có'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black">{loading ? '..' : stats?.today.interview}</p>
                <p className="text-[10px] font-medium opacity-80">Đăng ký Phỏng vấn</p>
              </div>
              <div>
                <p className="text-2xl font-black">{loading ? '..' : stats?.today.onboard}</p>
                <p className="text-[10px] font-medium opacity-80">Đăng ký Nhận việc</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" /></svg>
          </div>
        </div>

        {/* Recruitment Funnel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Phễu tuyển dụng (Tháng)</h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Mới', value: stats?.funnel.new, color: 'bg-slate-100 text-slate-600' },
              { label: 'Hẹn PV', value: stats?.funnel.scheduled, color: 'bg-blue-50 text-blue-600' },
              { label: 'Đỗ PV', value: stats?.funnel.pass, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Onboard', value: stats?.funnel.onboard, color: 'bg-emerald-50 text-emerald-600' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} p-3 rounded-xl text-center`}>
                <p className="text-lg font-black">{loading ? '..' : item.value}</p>
                <p className="text-[9px] font-bold uppercase whitespace-nowrap">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sources Distribution - Hide for Vendors */}
        {!isVendor && (
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
                    <span>{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboards */}
        {!isVendor && (
          <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Xếp hạng nhân viên (Tháng)</h4>
              {!isManager && (
                 <p className="text-xs text-slate-600">
                  Bạn đang đứng <span className="text-blue-600 font-black">Top {stats?.ranking.my_rank}</span> trong nhóm <span className="font-bold">{stats?.ranking.my_group}</span>.
                </p>
              )}
            </div>
            <div className="space-y-3 mt-4">
              {!loading && stats?.ranking.leaderboard.map((user, idx) => (
                <div key={user.id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${user.id === user_id ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-500'}`}>{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${user.id === user_id ? 'text-blue-700' : 'text-slate-700'}`}>{user.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">ID: {user.id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800">{user.onboardCount}</span>
                    <span className="text-[9px] block font-bold text-slate-400 uppercase">Onboard</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isManager && RenderLeaderboard("Xếp hạng CTV / Vendor", stats?.ranking.vendor_leaderboard)}

        {/* Empty State Projects */}
        <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Dự án đang triển khai</h4>
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
             <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             <p className="text-[11px] text-slate-400 font-medium italic">Hiện chưa có dữ liệu dự án</p>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Profile Panel */}
        <div className="bg-white p-8 lg:p-12 rounded-[2rem] shadow-xl border border-gray-200/50 text-center flex flex-col justify-center items-center h-fit sticky top-8">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-3xl mb-6 flex items-center justify-center shadow-2xl rotate-3 transform transition hover:rotate-0">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Portal Access</p>
          <h1 className="text-2xl font-black text-slate-800 mb-10 leading-tight">{name}</h1>
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
        
        {/* Right Dashboard Data */}
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
