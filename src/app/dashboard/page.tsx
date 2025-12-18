// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  
  // State lưu số liệu
  const [stats, setStats] = useState<{ candidate_count: number | string }>({ candidate_count: '...' });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !user_group || !user_id) return;

      try {
        const res = await fetch(N8N_STATS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_group: user_group,
            user_id: user_id 
          }),
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
    // Component hiển thị con số chung
    const StatCard = ({ label, colorClass }: { label: string, colorClass: string }) => (
      <div className={`p-6 border-2 rounded-xl ${colorClass}`}>
        <h2 className="text-xl font-bold mb-2">{label}</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black">
            {statsLoading ? '...' : stats.candidate_count}
          </span>
          <span className="text-sm font-medium opacity-80">Ứng viên</span>
        </div>
        <p className="mt-4 text-sm italic opacity-70">
          (Dữ liệu dựa trên quyền: {user_group})
        </p>
      </div>
    );

    switch (user_group?.toLowerCase()) {
      case 'admin':
        return <StatCard label="Tổng quy mô hệ thống" colorClass="bg-red-50 border-red-200 text-red-700" />;
      case 'manager':
        return <StatCard label="Số lượng quản lý mục tiêu" colorClass="bg-amber-50 border-amber-200 text-amber-700" />;
      case 'recruiter':
        return <StatCard label="Ứng viên tôi phụ trách" colorClass="bg-emerald-50 border-emerald-200 text-emerald-700" />;
      default:
        return <p>Đang tải cấu hình...</p>;
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* SECTION 1: USER INFO */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Xin chào!</h1>
          <p className="text-xl mb-8 font-bold text-blue-600">{name}</p>
          <div className="space-y-3">
            <Link href="/candidates" className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              Quản lý Ứng viên
            </Link>
            <Link href="/profile" className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
              Thông tin tài khoản
            </Link>
            <button onClick={logout} className="w-full bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition">
              Đăng xuất
            </button>
          </div>
        </div>

        {/* SECTION 2: STATS & ROLE DASHBOARD */}
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-white/50">
          <h3 className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-4">Số liệu báo cáo</h3>
          {renderRoleSpecificDashboard()}
          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Trạng thái: Đã kết nối với hệ thống n8n
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
