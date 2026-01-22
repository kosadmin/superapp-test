'use client';

import React, { useState } from 'react';
// Đảm bảo đường dẫn tương đối chính xác dựa trên cấu trúc thư mục thực tế của dự án
import { useAuth } from '@/contexts/AuthContext'; 
import ProtectedRoute from '@/components/ProtectedRoute';


const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

// SVG Icons nội bộ để đảm bảo giao diện hiển thị ngay cả khi thiếu thư viện ngoài
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
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
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
  const { user_id, user_group } = useAuth();
  const [loading, setLoading] = useState(false);
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

  const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city]
    .filter(Boolean)
    .join(' - ');

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        action: 'create',
        ...form,
        birth_year: birthYear,
        address_full: addressFull,
        user_id: user_id || 'unknown',
        user_group: user_group || 'unknown',
        contacted: true,
      };

      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Lỗi server: ${res.status}`);

      const data = await res.json();

      if (data.success) {
        alert('Tạo ứng viên thành công!');
        window.location.href = '/candidates';
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể tạo ứng viên'));
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert('Lỗi kết nối server. Hãy đảm bảo n8n Webhook đã được kích hoạt.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900";
  const readOnlyClass = "w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="text-blue-600"><Icons.UserPlus /></div>
              Tạo Mới Ứng Viên
            </h1>
            <button 
                type="button"
                onClick={() => window.location.href = '/candidates'}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <Icons.ArrowLeft /> Quay lại
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            
            {/* Thông tin cơ bản */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-blue-700 mb-6 border-l-4 border-blue-600 pl-3">Thông tin cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Họ và tên *</label>
                  <input required type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} className={inputClass} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className={labelClass}>Giới tính</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={inputClass}>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại *</label>
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass} placeholder="090..." />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} placeholder="example@gmail.com" />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Năm sinh (Tự động)</label>
                  <input type="text" value={birthYear} readOnly className={readOnlyClass} />
                </div>
              </div>
            </div>

            {/* Căn cước công dân */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-blue-700 mb-6 border-l-4 border-blue-600 pl-3">Thông tin CCCD</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày cấp</label>
                  <input type="date" value={form.id_card_issued_date} onChange={(e) => handleChange('id_card_issued_date', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Nơi cấp</label>
                  <input type="text" value={form.id_card_issued_place} onChange={(e) => handleChange('id_card_issued_place', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-emerald-700 mb-6 border-l-4 border-emerald-600 pl-3">Địa chỉ thường trú</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Số nhà / Tên đường</label>
                    <input type="text" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phường / Xã</label>
                    <input type="text" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Tỉnh / Thành phố</label>
                    <input type="text" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Địa chỉ hiển thị (Tự động)</label>
                  <input type="text" value={addressFull} readOnly className={readOnlyClass} />
                </div>
              </div>
            </div>

            {/* Kinh nghiệm & Nguyện vọng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-orange-700 mb-6 border-l-4 border-orange-600 pl-3">Học vấn & Kinh nghiệm</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Trình độ học vấn</label>
                  <input type="text" value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)} className={inputClass} placeholder="Đại học, Cao đẳng..." />
                </div>
                <div>
                  <label className={labelClass}>Tóm tắt kinh nghiệm làm việc</label>
                  <textarea rows={3} value={form.experience_summary} onChange={(e) => handleChange('experience_summary', e.target.value)} className={inputClass} placeholder="Các công ty đã làm, vị trí đảm nhiệm..."></textarea>
                </div>
                <div>
                  <label className={labelClass}>Nguyện vọng công việc</label>
                  <textarea rows={2} value={form.job_wish} onChange={(e) => handleChange('job_wish', e.target.value)} className={inputClass} placeholder="Mong muốn về lương, môi trường..."></textarea>
                </div>
              </div>
            </div>

            {/* Thông tin tuyển dụng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-purple-700 mb-6 border-l-4 border-purple-600 pl-3">Phân loại tuyển dụng</h2>
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
                  <label className={labelClass}>Vị trí ứng tuyển</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nguồn dữ liệu & Phụ trách */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-pink-700 mb-6 border-l-4 border-pink-600 pl-3">Nguồn dữ liệu & Phụ trách</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Bộ phận tạo nguồn</label>
                  <input type="text" value={form.data_source_dept} onChange={(e) => handleChange('data_source_dept', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nhóm nguồn</label>
                  <input type="text" value={form.data_source_type_group} onChange={(e) => handleChange('data_source_type_group', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Loại nguồn cụ thể</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ID nhân viên phụ trách</label>
                  <input type="text" value={form.assigned_user} onChange={(e) => handleChange('assigned_user', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center gap-4 z-10">
              <button
                type="button"
                onClick={() => window.location.href = '/candidates'}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-8 rounded-xl transition shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-12 rounded-xl transition shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <><Icons.Loader2 /> Đang xử lý...</>
                ) : (
                  <><Icons.Save /> LƯU ỨNG VIÊN</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
