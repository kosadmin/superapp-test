'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';


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

export default function App() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Lấy thông tin User từ localStorage giống bản tham khảo của bạn
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : '';
    const storedUserGroup = typeof window !== 'undefined' ? localStorage.getItem('user_group') : '';

    if (!storedUserId) {
      alert("Lỗi: Không xác định được người dùng. Vui lòng kiểm tra lại đăng nhập.");
      return;
    }

    setLoading(true);

    try {
      const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
      const addressFull = [form.address_street, form.address_ward, form.address_city].filter(Boolean).join(' - ');

      const payload = {
        action: 'create',
        ...form,
        birth_year: birthYear,
        address_full: addressFull,
        user_id: storedUserId,
        user_group: storedUserGroup || 'unknown',
        contacted: true,
      };

      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert('Tạo ứng viên thành công!');
        router.push('/candidates');
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể lưu dữ liệu'));
      }
    } catch (err) {
      alert('Lỗi kết nối Server n8n');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 shadow-sm transition-all";
  const readOnlyClass = "w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const cardClass = "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6";
  const uploadBoxClass = "border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer text-gray-400 min-h-[100px]";

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-gray-900 font-sans">
        <div className="max-w-4xl mx-auto">
          
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                    <Icons.UserPlus />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Tạo mới ứng viên</h1>
            </div>
            <p className="text-sm text-gray-400 font-medium ml-12">Hệ thống quản lý nguồn lực K-Outsourcing</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* THÔNG TIN CƠ BẢN */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin cá nhân</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Họ và tên ứng viên *</label>
                  <input required type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} placeholder="NGUYỄN VĂN A" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại *</label>
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="090..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Giới tính</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={inputClass}>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày cấp CCCD</label>
                  <input type="date" value={form.id_card_issued_date} onChange={(e) => handleChange('id_card_issued_date', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Nơi cấp CCCD</label>
                  <input type="text" value={form.id_card_issued_place} onChange={(e) => handleChange('id_card_issued_place', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* ĐỊA CHỈ */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Địa chỉ thường trú</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Số nhà / Đường</label>
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
            </div>

            {/* HỌC VẤN & KINH NGHIỆM */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Học vấn & Sự nghiệp</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Trình độ học vấn</label>
                  <input type="text" value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tóm tắt kinh nghiệm làm việc</label>
                  <textarea rows={3} value={form.experience_summary} onChange={(e) => handleChange('experience_summary', e.target.value)} className={inputClass}></textarea>
                </div>
                <div>
                  <label className={labelClass}>Nguyện vọng công việc</label>
                  <textarea rows={2} value={form.job_wish} onChange={(e) => handleChange('job_wish', e.target.value)} className={inputClass}></textarea>
                </div>
              </div>
            </div>

            {/* TUYỂN DỤNG */}
            <div className={cardClass}>
               <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin tuyển dụng</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Dự án</label>
                  <input type="text" value={form.project} onChange={(e) => handleChange('project', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vị trí</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Người phụ trách (ID)</label>
                  <input type="text" value={form.assigned_user} onChange={(e) => handleChange('assigned_user', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* NGUỒN DỮ LIỆU */}
            <div className={cardClass}>
               <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-pink-500 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Nguồn dữ liệu</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Bộ phận tạo nguồn</label>
                  <input type="text" value={form.data_source_dept} onChange={(e) => handleChange('data_source_dept', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nhóm nguồn</label>
                  <input type="text" value={form.data_source_type_group} onChange={(e) => handleChange('data_source_type_group', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Loại nguồn</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* HỒ SƠ ĐÍNH KÈM */}
            <div className={cardClass}>
               <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Hồ sơ đính kèm</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>CCCD Mặt trước</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="text-[10px] font-bold mt-2 uppercase">Chọn file ảnh</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>CCCD Mặt sau</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="text-[10px] font-bold mt-2 uppercase">Chọn file ảnh</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-6 pb-20">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? <Icons.Loader2 /> : <Icons.Save />}
                TẠO ỨNG VIÊN MỚI
              </button>
              <button
                type="button"
                onClick={() => router.push('/candidates')}
                className="bg-white border border-gray-200 text-gray-400 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
