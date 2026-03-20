'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/constants/masterData';

interface LeaderboardItem {
  id: string;
  name: string;
  onboardCount: number;
}

interface ProjectLeaderboardItem {
  id: string;
  name: string;
  onboardCount: number;
}

interface DashboardStats {
  total_this_month: number;
  onboard_this_month: number;
  new_this_month_count: number;
  conversion_rate: number;
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
    project_leaderboard?: ProjectLeaderboardItem[];
  };
}

function DashboardContent() {
  const { name, user_group, user_id, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user_group === 'admin';
  const isManager = user_group === 'manager' || isAdmin;
  const isVendor = user_group === 'vendor';

  const now = new Date();
  const monthLabel = `THÁNG ${now.getMonth() + 1}/${now.getFullYear()}`;
  const todayLabel = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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

  // ─── SKELETON ───
  const Skeleton = ({ w = 'w-12' }: { w?: string }) => (
    <span className={`inline-block ${w} h-5 bg-gray-200 rounded animate-pulse`} />
  );

  // ─── LEADERBOARD CARD dùng chung ───
  const LeaderboardCard = ({
    title,
    data,
    idLabel = 'ID',
    highlightId,
  }: {
    title: string;
    data: any[] | undefined;
    idLabel?: string;
    highlightId?: string;
  }) => (
    <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-1 min-w-0">
      <div className="p-3 border-b bg-white">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-3 space-y-2 max-h-[232px] overflow-y-auto scrollbar-thin">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border animate-pulse">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 h-3 bg-gray-200 rounded" />
                <div className="w-8 h-3 bg-gray-200 rounded" />
              </div>
            ))
          : data?.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  item.id === highlightId
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-black ${
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
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold truncate ${item.id === highlightId ? 'text-orange-700' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono truncate">{idLabel}: {item.id}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-black text-gray-800">{item.onboardCount}</span>
                  <span className="text-[9px] block font-bold text-gray-400 uppercase">Onboard</span>
                </div>
              </div>
            ))}
        {!loading && (!data || data.length === 0) && (
          <p className="text-center text-xs text-gray-400 italic py-6">Chưa có dữ liệu</p>
        )}
      </div>
    </div>
  );

  // ─── LOADING STATE ───
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
    <div className="h-full bg-gray-100 overflow-y-auto text-sm p-4 space-y-3 scrollbar-thin">

      {/* ── SCOPE BAR ── */}
      <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Scope: {stats?.applied_permission || '...'} · {user_group}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase">{monthLabel}</span>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 1 — HÔM NAY (hero banner)
      ══════════════════════════════════════════ */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl shadow-sm overflow-hidden">
        {/* Thông điệp + ngày cùng dòng */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-orange-100">
          <h2 className="text-orange-700 font-black text-sm uppercase tracking-wide leading-none">
            HÔM NAY {isManager ? 'ĐỘI NGŨ CỦA BẠN' : 'BẠN'} CÓ
          </h2>
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest ml-4 whitespace-nowrap">
            {todayLabel}
          </span>
        </div>

        {/* 2 số liệu */}
        <div className="grid grid-cols-2 divide-x divide-orange-100">
          <div className="px-6 py-5 text-center">
            <p className="text-5xl font-black text-orange-600 leading-none">
              {loading
                ? <span className="inline-block w-14 h-10 bg-orange-100 rounded animate-pulse" />
                : (stats?.today.interview ?? '—')}
            </p>
            <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mt-2">
              Ứng viên đăng ký phỏng vấn
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-5xl font-black text-emerald-600 leading-none">
              {loading
                ? <span className="inline-block w-14 h-10 bg-orange-100 rounded animate-pulse" />
                : (stats?.today.onboard ?? '—')}
            </p>
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mt-2">
              Ứng viên đăng ký nhận việc
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 2 — SỐ LIỆU THÁNG
      ══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        {/* Header tháng nổi bật */}
        <div className="p-4 border-b bg-gray-800 flex items-center justify-between">
          <span className="text-sm font-black text-white uppercase tracking-[0.15em]">
            Số liệu {monthLabel}
          </span>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full uppercase">
            {stats?.applied_permission || '...'}
          </span>
        </div>

        <div className="p-4 space-y-5">

          {/* 2a ─ QUICK STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Dự án đang tuyển',  value: '--',                        valueColor: 'text-gray-400', bg: 'bg-gray-50 border-gray-100' },
              { label: 'Tổng ứng viên',      value: stats?.total_this_month,     valueColor: 'text-gray-800', bg: 'bg-gray-50 border-gray-100' },
              { label: 'Nhận việc mới',      value: stats?.onboard_this_month,   valueColor: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
              { label: 'Tỷ lệ chuyển đổi',  value: stats?.conversion_rate !== undefined ? `${stats.conversion_rate}%` : '--%', valueColor: stats?.conversion_rate ? 'text-emerald-600' : 'text-gray-400', bg: 'bg-gray-50 border-gray-100' },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl border p-4 ${item.bg}`}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className={`text-2xl font-black ${item.valueColor}`}>
                  {loading && typeof item.value === 'number'
                    ? <Skeleton w="w-10" />
                    : (item.value ?? '--')}
                </p>
              </div>
            ))}
          </div>

          {/* 2b ─ LEADERBOARDS (cùng cấp, flex row) */}
          {!isVendor && (
            <div className="space-y-3">
              {/* My rank badge (non-manager) */}
              {!isManager && stats?.ranking && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-black text-orange-600">#{stats.ranking.my_rank}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{name}</p>
                    <p className="text-[10px] text-gray-400">
                      Xếp hạng tháng này trong nhóm{' '}
                      <span className="font-bold text-gray-600">{stats.ranking.my_group}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 items-stretch">
                {/* Xếp hạng nhân viên */}
                <LeaderboardCard
                  title="Xếp hạng nhân viên"
                  data={stats?.ranking.leaderboard}
                  highlightId={user_id ?? undefined}
                />

                {/* Xếp hạng CTV/Vendor — chỉ manager + admin */}
                {isManager && (
                  <LeaderboardCard
                    title="Xếp hạng CTV / Vendor"
                    data={stats?.ranking.vendor_leaderboard}
                  />
                )}

                {/* Xếp hạng dự án nổi bật */}
                <LeaderboardCard
                  title="Xếp hạng dự án"
                  data={stats?.ranking.project_leaderboard}
                  idLabel="ID dự án"
                />
              </div>
            </div>
          )}

          {/* 2c ─ PHỄU + NGUỒN (cùng cấp, flex row) */}
          <div className="flex gap-3 items-stretch">

            {/* Phễu tuyển dụng */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-1 min-w-0">
              <div className="p-3 border-b bg-white">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Phễu tuyển dụng
                </span>
              </div>
              <div className="p-3 grid grid-cols-4 gap-2">
                {[
                  { label: 'Mới',          value: stats?.funnel.new,       color: 'bg-white text-gray-600 border-gray-200' },
                  { label: 'Đăng ký PV',   value: stats?.funnel.scheduled, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                  { label: 'Đỗ PV',        value: stats?.funnel.pass,      color: 'bg-orange-50 text-orange-600 border-orange-100' },
                  { label: 'Onboard',      value: stats?.funnel.onboard,   color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                ].map((item, i) => (
                  <div key={i} className={`${item.color} border rounded-xl p-3 text-center`}>
                    <p className="text-xl font-black">{loading ? '..' : (item.value ?? '--')}</p>
                    <p className="text-[9px] font-bold uppercase mt-1 whitespace-nowrap">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nguồn ứng viên mới — ẩn với vendor */}
            {!isVendor && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex-1 min-w-0">
                <div className="p-3 border-b bg-white flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Nguồn ứng viên mới
                  </span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {loading ? '...' : stats?.new_this_month_count} hồ sơ
                  </span>
                </div>
                <div className="p-3 space-y-2.5">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-1 animate-pulse">
                          <div className="flex justify-between">
                            <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                            <div className="h-2.5 bg-gray-200 rounded w-8" />
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
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
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

        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECTION 3 — COMMISSION REPORT
          ẨN TẠM: đổi `false &&` thành `isAdmin &&` khi cần bật lại
      ══════════════════════════════════════════ */}
      {false && isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gray-800">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
              Tổng phí tuyển dụng trong năm qua
            </span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { label: 'Hoa hồng tạo nguồn MKT',         value: stats?.commission_report?.mkt },
              { label: 'Hoa hồng nhân viên tuyển dụng',  value: stats?.commission_report?.recruiter },
              { label: 'Hoa hồng CTV / Vendor',           value: stats?.commission_report?.vendor, highlight: true },
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
