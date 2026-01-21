'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

// SVG Icons nội bộ
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
  // Cơ bản
  candidate_name: string;
  phone: string;
  gender: string;
  email: string;
  id_card_number: string;
  id_card_issued_date: string;
  id_card_issued_place: string;
  date_of_birth: string;
  // Địa chỉ
  address_street: string;
  address_ward: string;
  address_city: string;
  // Học vấn
  education_level: string;
  experience_summary: string;
  job_wish: string;
  // Tuyển dụng
  project: string;
  position: string;
  company: string;
  // Nguồn & Phân công
  data_source_dept: string;
  data_source_type_group: string;
  data_source_type: string;
  assigned_user: string;
}

export default function NewCandidate() {
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
  const router = useRouter();

  // Tự động tính Năm sinh và Địa chỉ đầy đủ
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
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...form,
          birth_year: birthYear,
          address_full: addressFull,
          contacted: true,
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
  const readOnlyClass = "w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const uploadBoxClass = "border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer text-gray-500 min-h-[120px]";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
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
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="09xxxxxxxx" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="example@gmail.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Năm sinh (Tự động)</label>
                  <input type="text" value={birthYear} readOnly className={readOnlyClass} placeholder="YYYY" />
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

            {/* Nhóm: Địa chỉ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-emerald-700 mb-6 border-b pb-2">Địa chỉ</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Số nhà/Tên đường</label>
                    <input type="text" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} placeholder="123 Đường ABC..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Phường/Xã</label>
                    <input type="text" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Tỉnh/Thành</label>
                    <input type="text" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Địa chỉ đầy đủ (Tự động)</label>
                  <input type="text" value={addressFull} readOnly className={readOnlyClass} placeholder="Sẽ tự động nối các trường trên" />
                </div>
              </div>
            </div>

            {/* Nhóm: Học vấn & Sự nghiệp */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-orange-700 mb-6 border-b pb-2">Học vấn & Sự nghiệp</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Trình độ học vấn</label>
                  <input type="text" value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)} placeholder="VD: Đại học, 12/12..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tóm tắt kinh nghiệm</label>
                  <textarea rows={3} value={form.experience_summary} onChange={(e) => handleChange('experience_summary', e.target.value)} placeholder="Mô tả ngắn gọn kinh nghiệm làm việc..." className={inputClass}></textarea>
                </div>
                <div>
                  <label className={labelClass}>Nguyện vọng công việc</label>
                  <textarea rows={2} value={form.job_wish} onChange={(e) => handleChange('job_wish', e.target.value)} placeholder="Mong muốn về lương, khu vực làm việc..." className={inputClass}></textarea>
                </div>
              </div>
            </div>

            {/* Nhóm: Tuyển dụng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-purple-700 mb-6 border-b pb-2">Thông tin tuyển dụng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Dự án</label>
                  <input type="text" value={form.project} onChange={(e) => handleChange('project', e.target.value)} placeholder="VD: VinFast" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Vị trí</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="VD: Công nhân sản xuất" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nhóm: Tạo nguồn & Phân công */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-pink-700 mb-6 border-b pb-2">Thông tin tạo nguồn & Phân công công việc</h2>
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
                  <label className={labelClass}>Loại nguồn</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} placeholder="Facebook, Tiktok..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>ID người phụ trách</label>
                  <input type="text" value={form.assigned_user} onChange={(e) => handleChange('assigned_user', e.target.value)} placeholder="ID nhân viên..." className={inputClass} />
                </div>
              </div>
            </div>

            {/* Nhóm mới: Hồ sơ đính kèm */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-700 mb-6 border-b pb-2">Hồ sơ đính kèm</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Ảnh CCCD mặt trước</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-xs">Tải lên hoặc kéo thả ảnh mặt trước</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Ảnh CCCD mặt sau</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-xs">Tải lên hoặc kéo thả ảnh mặt sau</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>File đính kèm khác (CV, Bằng cấp...)</label>
                  <div className={`${uploadBoxClass} min-h-[80px]`}>
                    <div className="flex items-center gap-2">
                      <Icons.FileText />
                      <span className="text-sm">Chọn file để đính kèm</span>
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
