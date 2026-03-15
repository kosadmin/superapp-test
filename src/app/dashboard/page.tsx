'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/constants/masterData';

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
        const res = await fetch(API_CONFIG.DASHBOARD_URL, {
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

  const Skeleton = () => (
    <span className="inline-block w-12 h-4 bg-gray-200 rounded animate-pulse" />
  );

  const LeaderboardSection = ({
    title,
    data,
  }: {
    title: string;
    data: LeaderboardItem[] | undefined;
  }) => (
    <section>
      <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-orange-600 pl-3 text-xs uppercase tracking-wider">
        {title}
        <span className="ml-2 text-[10px] font-normal text-gray-400 normal-case">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</span>
      </h3>
      <div className="space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border animate-pulse">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="flex-1 h-3 bg-gray-200 rounded" />
                <div className="w-8 h-3 bg-gray-200 rounded" />
              </div>
            ))
          : data?.map((user, idx) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  user.id === user_id
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${
                      idx === 0
                        ? 'bg-yellow-400 text-white'
                        : idx === 1
                        ? 'bg-gray-400 text-white'
                        : idx === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold ${
                        user.id === user_id ? 'text-orange-700' : 'text-gray-700'
                      }`}
                    >
                      {user.name}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">ID: {user.id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-gray-800">{user.onboardCount}</span>
                  <span className="text-[9px] block font-bold text-gray-400 uppercase">Onboard</span>
                </div>
              </div>
            ))}
        {!loading && (!data || data.length === 0) && (
          <p className="text-center text-xs text-gray-400 italic py-4">Chưa có dữ liệu</p>
        )}
      </div>
    </section>
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 italic text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden text-sm p-4 gap-3">

      {/* LEFT: MAIN CONTENT */}
      <div className="flex flex-col flex-1 gap-3 overflow-y-auto scrollbar-thin pb-4">

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Scope: {stats?.applied_permission || '...'} ({user_group})
            </span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </span>
        </div>

        {/* ADMIN COMMISSION REPORT */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-800">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Tổng phí tuyển dụng trong năm qua
              </span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Hoa hồng tạo nguồn MKT', value: stats?.commission_report?.mkt },
                { label: 'Hoa hồng nhân viên tuyển dụng', value: stats?.commission_report?.recruiter },
                { label: 'Hoa hồng CTV / Vendor', value: stats?.commission_report?.vendor, highlight: true },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between py-2 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-sm font-bold ${item.highlight ? 'text-emerald-600' : 'text-gray-800'}`}>
                    {loading ? <Skeleton /> : (item.value || 0).toLocaleString()} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Dự án đang tuyển', value: '--', color: 'text-gray-400', bg: '' },
            { label: 'Tổng ứng viên', value: stats?.total_this_month, color: 'text-gray-800', bg: '' },
            { label: 'Nhận việc (Tháng)', value: stats?.onboard_this_month, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
            { label: 'Tỷ lệ chuyển đổi', value: '--%', color: 'text-gray-400', bg: '' },
          ].map((item, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-sm border p-4 ${item.bg}`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className={`text-2xl font-black ${item.color}`}>
                {loading && typeof item.value === 'number' ? <Skeleton /> : item.value ?? '--'}
              </p>
            </div>
          ))}
        </div>

        {/* TODAY CARD */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-shrink-0">
          <div className="p-3 border-b bg-orange-600 flex items-center justify-between">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Hôm nay</span>
            <span className="text-[10px] text-orange-200 font-bold">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 divide-x divide-gray-100">
            <div className="text-center pr-4">
              <p className="text-3xl font-black text-orange-600">
                {loading ? <Skeleton /> : stats?.today.interview}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Phỏng vấn</p>
            </div>
            <div className="text-center pl-4">
              <p className="text-3xl font-black text-emerald-600">
                {loading ? <Skeleton /> : stats?.today.onboard}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Nhận việc</p>
            </div>
          </div>
        </div>

        {/* RECRUITMENT FUNNEL */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-shrink-0">
          <div className="p-3 border-b">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phễu tuyển dụng (Tháng)</span>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Mới', value: stats?.funnel.new, color: 'bg-gray-50 text-gray-600 border-gray-100' },
              { label: 'Hẹn PV', value: stats?.funnel.scheduled, color: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Đỗ PV', value: stats?.funnel.pass, color: 'bg-orange-50 text-orange-600 border-orange-100' },
              { label: 'Onboard', value: stats?.funnel.onboard, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
            ].map((item, i) => (
              <div key={i} className={`${item.color} border rounded-xl p-3 text-center`}>
                <p className="text-xl font-black">{loading ? '..' : item.value ?? '--'}</p>
                <p className="text-[9px] font-bold uppercase mt-1 whitespace-nowrap">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOURCE DISTRIBUTION */}
        {!isVendor && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-shrink-0">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nguồn ứng viên mới (Tháng)</span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                {loading ? '...' : stats?.new_this_month_count} hồ sơ
              </span>
            </div>
            <div className="p-4 space-y-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-8" />
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full" />
                    </div>
                  ))
                : stats?.source_distribution_monthly.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-gray-600">
                        <span>{item.name}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-500 h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              {!loading && (!stats?.source_distribution_monthly || stats.source_distribution_monthly.length === 0) && (
                <p className="text-center text-xs text-gray-400 italic py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: RANKINGS SIDEBAR */}
      {!isVendor && (
        <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto scrollbar-thin pb-4">

          {/* MY RANK BADGE (non-manager only) */}
          {!isManager && stats?.ranking && (
            <div className="bg-white rounded-xl shadow-sm border p-4 flex-shrink-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thứ hạng của bạn</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <span className="text-xl font-black text-orange-600">#{stats.ranking.my_rank}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{name}</p>
                  <p className="text-[10px] text-gray-400">Nhóm: <span className="font-bold text-gray-600">{stats.ranking.my_group}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEE LEADERBOARD */}
          <div className="bg-white rounded-xl shadow-sm border p-4 flex-shrink-0">
            <LeaderboardSection title="Xếp hạng nhân viên" data={stats?.ranking.leaderboard} />
          </div>

          {/* VENDOR LEADERBOARD */}
          {isManager && (
            <div className="bg-white rounded-xl shadow-sm border p-4 flex-shrink-0">
              <LeaderboardSection title="Xếp hạng CTV / Vendor" data={stats?.ranking.vendor_leaderboard} />
            </div>
          )}

          {/* ACTIVE PROJECTS PLACEHOLDER */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-shrink-0">
            <div className="p-3 border-b">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dự án đang triển khai</span>
            </div>
            <div className="p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl m-3">
              <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-[11px] text-gray-400 italic">Hiện chưa có dữ liệu dự án</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
