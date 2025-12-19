'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// URL Webhook n8n của bạn
const N8N_STATS_URL = 'https://n8n.koutsourcing.vn/webhook-test/dashboard';

// Định nghĩa kiểu dữ liệu cho stats
interface SourceStat {
  name: string;
  count: number;
  percentage: number;
}

interface DashboardStats {
  candidate_count: number | string;
  applied_permission: string;
  source_distribution: SourceStat[];
}

function DashboardContent() {
  const { name, user_group, user_id, logout, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({ 
    candidate_count: '...', 
    applied_permission: '...',
    source_distribution: [] 
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Chờ cho đến khi AuthContext có đủ thông tin user
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
        console.error("Lỗi lấy stats từ n8n:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [user_group, user_id, authLoading]);

  const renderSection2 = () => {
    return (
      <div className="space-y-6">
        {/* Dòng trạng thái phạm vi dữ liệu đẩy lên đầu */}
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Phạm vi dữ liệu: <span className="text-blue-700">{stats.applied_permission} ({user_group})</span>
        </div>

        {/* NHÓM 1: THỐNG KÊ NGUỒN ỨNG VIÊN */}
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 shadow-sm">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">
            Nhóm 1 - Thống kê nguồn ứng viên
          </h4>
          
          {statsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-full"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Dòng 1: Tổng số lượng in đậm */}
              <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 pb-2 mb-2">
                <span className="font-bold text-gray-800">Tổng cộng:</span>
                <span className="text-lg font-black text-blue-600">{stats.candidate_count} <small className="text-[10px] text-gray-400 font-normal uppercase">Ứng viên</small></span>
              </div>

              {/* Danh sách các loại nguồn: gọn, bé, không thanh màu */}
              <div className="grid grid-cols-1 gap-1.5">
                {stats.source_distribution.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-600 truncate mr-4">• {item.name}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">
                      {item.count} <span className="text-gray-400 text-[11px]">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
                {stats.source_distribution.length === 0 && (
                  <p className="text-xs text-gray-400 italic">Không tìm thấy dữ liệu nguồn.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* NHÓM 2: PLACEHOLDER */}
        <div className="border border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center bg-white">
          <span className="text-xs text-gray-300 font-medium italic">Nhóm 2 - Đang cập nhật...</span>
        </div>
      </div>
    );
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 lg:p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        
        {/* SECTION 1: USER INFO & NAVIGATION */}
        <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl text-center flex flex-col justify-center">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">Đăng nhập thành công</h1>
          <p className="text-2xl mb-8 font-black text-blue-700 break-words">{name}</p>
          
          <div className="space-y-3">
            <Link href="/candidates" className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-bold shadow-md active:scale-95">
              Quản lý Ứng viên
            </Link>
            <Link href="/profile" className="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-bold shadow-md active:scale-95">
              Thông tin tài khoản
            </Link>
            <button 
              onClick={logout} 
              className="w-full bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition font-semibold text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* SECTION 2: REPORT & STATS */}
        <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/50">
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
