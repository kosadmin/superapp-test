'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

const Icons = {
  UserPlus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  Loader2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.21-8.58"/></svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  )
};

interface FormData {
  candidate_name: string;
  phone: string;
  gender: string;
  email: string;
  id_card_number: string;
  id_card_issued_date: string;
  id_card_issued_place: string;
  date_of_birth: string;
  address_street: string;
  address_ward: string;
  address_city: string;
  education_level: string;
  experience_summary: string;
  job_wish: string;
  project: string;
  position: string;
  company: string;
  data_source_dept: string;
  data_source_type_group: string;
  data_source_type: string;
  assigned_user: string;
}

export default function NewCandidate() {
  const router = useRouter();
  // Lấy thông tin user từ context
  const { user_id, user_group, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState<FormData>({
    candidate_name: '',
    phone: '',
    gender: '',
    email: '',
    id_card_number: '',
    id_card_issued_date: '',
    id_card_issued_place: '',
    date_of_birth: '',
    address_street: '',
    address_ward: '',
    address_city: '',
    education_level: '',
    experience_summary: '',
    job_wish: '',
    project: '',
    position: '',
    company: '',
    data_source_dept: '',
    data_source_type_group: '',
    data_source_type: '',
    assigned_user: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user_id || !user_group) {
      alert("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.");
      return;
    }
    
    setLoading(true);

    const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
    const addressFull = [form.address_street, form.address_ward, form.address_city]
      .filter(Boolean)
      .join(' - ');

    try {
      const payload = {
        action: 'create',
        ...form,
        birth_year: birthYear,
        address_full: addressFull,
        user_id,        // Gửi thông tin user_id
        user_group,     // Gửi thông tin user_group
        contacted: true,
      };

      console.log("Gửi Payload:", payload);

      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert('Tạo ứng viên thành công!');
        router.push(`/candidates`);
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
  const uploadBoxClass = "border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer text-gray-500 min-h-[120px]";

  if (authLoading) return <div className="h-screen flex items-center justify-center">Đang kiểm tra quyền truy cập...</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
             <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 text-blue-600"><Icons.UserPlus /></div>
              Tạo Mới Ứng Viên
            </h1>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Người thực hiện</p>
              <p className="text-sm font-medium text-gray-600">{user_id} ({user_group})</p>
            </div>
          </header>

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
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@example.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nhóm: Tuyển dụng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-purple-700 mb-6 border-b pb-2">Vị trí ứng tuyển</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Dự án</label>
                  <input type="text" value={form.project} onChange={(e) => handleChange('project', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Vị trí</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nhóm: Hồ sơ đính kèm */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Hồ sơ đính kèm (Dự kiến)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <div>
                  <label className={labelClass}>CCCD Mặt trước</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-[10px] font-bold uppercase text-gray-400">Chưa thêm logic upload</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>CCCD Mặt sau</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-[10px] font-bold uppercase text-gray-400">Chưa thêm logic upload</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>File tài liệu khác</label>
                  <div className={`${uploadBoxClass} min-h-[80px]`}>
                    <div className="flex items-center gap-2">
                      <Icons.FileText />
                      <span className="text-xs">File CV, bằng cấp (PDF, Image...)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-center gap-4 pt-6 pb-12">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-12 rounded-xl text-lg transition shadow-lg flex items-center gap-2 min-w-[240px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5"><Icons.Loader2 /></div>
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5"><Icons.Save /></div>
                    TẠO ỨNG VIÊN
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
