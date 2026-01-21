'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

// SVG Icons nội bộ để không bị lỗi thiếu thư viện lucide
const Icons = {
  UserPlus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  Loader2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.21-8.58"/></svg>
  )
};

interface FormData {
  candidate_name: string;
  phone: string;
  id_card_number: string;
  date_of_birth: string;
  address_street: string;
  address_ward: string;
  address_city: string;
  project: string;
  position: string;
  company: string;
  data_source_type: string;
  assigned_user?: string;
}

export default function NewCandidate() {
  const [form, setForm] = useState<FormData>({
    candidate_name: '',
    phone: '',
    id_card_number: '',
    date_of_birth: '',
    address_street: '',
    address_ward: '',
    address_city: '',
    project: '',
    position: '',
    company: '',
    data_source_type: '',
    assigned_user: '',
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...form,
          contacted: true, // Mặc định khi tạo mới
        }),
      });

      const data = await res.json();

      if (data.success && data.id) {
        alert('Tạo ứng viên thành công!');
        router.push(`/candidates/${data.id}`);
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể tạo ứng viên'));
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 text-blue-600"><Icons.UserPlus /></div>
            Tạo Mới Ứng Viên
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nhóm: Thông tin cơ bản */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-blue-700 mb-6 border-b pb-2">Thông tin cơ bản</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Họ và tên *</label>
                  <input required type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} placeholder="Nguyễn Văn A" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại *</label>
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="09xxxxxxxx" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số CMND/CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nhóm: Địa chỉ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-emerald-700 mb-6 border-b pb-2">Địa chỉ</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Địa chỉ chi tiết (Số nhà, tên đường)</label>
                  <input type="text" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} placeholder="123 Đường ABC..." className={inputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Phường/Xã</label>
                    <input type="text" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Thành phố/Tỉnh</label>
                    <input type="text" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm: Tuyển dụng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-purple-700 mb-6 border-b pb-2">Thông tin tuyển dụng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Dự án/Khách hàng</label>
                  <input type="text" value={form.project} onChange={(e) => handleChange('project', e.target.value)} placeholder="VD: VinFast" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vị trí ứng tuyển</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Công nhân..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nguồn dữ liệu</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} placeholder="Facebook, Tiktok..." className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Nhân viên phụ trách</label>
                  <input type="text" value={form.assigned_user} onChange={(e) => handleChange('assigned_user', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-12 rounded-xl text-lg transition shadow-lg flex items-center gap-2 min-w-[200px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5"><Icons.Loader2 /></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5"><Icons.Save /></div>
                    TẠO ỨNG VIÊN
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/candidates')}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-12 rounded-xl text-lg transition"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
