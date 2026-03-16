'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/constants/masterData';

function ProfileContent() {
  const router = useRouter();
  const { username, isLoading: isAuthLoading } = useAuth();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchFullUserInfo = async () => {
      if (isAuthLoading) return;
      if (!username) { setDataLoading(false); return; }
      setDataLoading(true);
      try {
        const res = await fetch(API_CONFIG.LOGIN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_user_info', username }),
        });
        const data = await res.json();
        if (data.user) setUserInfo(data.user);
        else if (Array.isArray(data) && data[0]?.user) setUserInfo(data[0].user);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin chi tiết:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchFullUserInfo();
  }, [username, isAuthLoading]);

  if (isAuthLoading || dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 italic text-sm">
            {isAuthLoading ? 'Đang xác nhận danh tính...' : 'Đang tải hồ sơ...'}
          </span>
        </div>
      </div>
    );
  }

  const fields = [
    { label: 'Username',    value: userInfo?.username },
    { label: 'Họ tên',      value: userInfo?.name },
    { label: 'Email',       value: userInfo?.email },
    { label: 'Nhóm',        value: userInfo?.user_group?.toUpperCase() },
    { label: 'Ngày tạo',    value: userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString('vi-VN') : undefined },
  ];

  const isActive = userInfo?.user_status === 'active';

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden text-sm p-4 items-start justify-center">
      <div className="w-full max-w-lg flex flex-col gap-3">

        {/* TOOLBAR */}
        <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition"
            >
              ← Quay lại
            </button>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Thông tin tài khoản
            </span>
          </div>
          {/* Trạng thái */}
          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-tighter shadow-sm inline-block ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {isActive ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
          </span>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          {/* Header */}
          <div className="p-4 border-b bg-orange-600 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 border-2 border-orange-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-white font-black text-xl uppercase">
                {userInfo?.name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="text-white font-black text-base uppercase leading-tight">
                {userInfo?.name || '—'}
              </p>
              <p className="text-orange-200 text-[11px] font-mono mt-0.5">
                @{userInfo?.username || '—'}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="p-5 space-y-0 divide-y divide-gray-50">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-28 flex-shrink-0">
                  {f.label}
                </span>
                <span className="text-sm font-bold text-gray-800 text-right break-all">
                  {f.value || <span className="text-gray-300 font-normal">—</span>}
                </span>
              </div>
            ))}

            {/* Trạng thái — dòng riêng có badge */}
            <div className="flex items-center justify-between py-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-28 flex-shrink-0">
                Trạng thái
              </span>
              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-tighter shadow-sm ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {isActive ? 'HOẠT ĐỘNG' : 'BỊ KHÓA'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ProfileContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
