'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import { MASTER_DATA } from '@/constants/masterData';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface CandidateForm {
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

interface FormErrors {
  [key: string]: string | undefined;
}

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
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
  )
};

function NewCandidateForm() {
  const { user_id, user_group } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<CandidateForm>({
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

  // Tự động điền ID nhân viên khi có thông tin auth
  useEffect(() => {
    if (user_id) {
      setForm(prev => ({ ...prev, assigned_user: String(user_id) }));
    }
  }, [user_id]);

  // Logic Master Data lọc dropdown
  const availableSourceTypeGroups = form.data_source_dept 
    ? (MASTER_DATA.sourceTypeGroupsByDept as Record<string, string[]>)[form.data_source_dept] || [] 
    : [];

  const availableSourceTypes = form.data_source_type_group
    ? (MASTER_DATA.sourceTypesByGroup as Record<string, string[]>)[form.data_source_type_group] || []
    : [];

  // Tính toán thông tin tự động
  const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city].filter(Boolean).join(' - ');

  // Xử lý thay đổi dữ liệu & Validation
  const handleChange = (field: keyof CandidateForm, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      // Reset các cấp nguồn thấp hơn nếu cấp cao hơn thay đổi
      if (field === 'data_source_dept') {
        newForm.data_source_type_group = '';
        newForm.data_source_type = '';
      } else if (field === 'data_source_type_group') {
        newForm.data_source_type = '';
      }
      return newForm;
    });

    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Validation nhanh
    if (field === 'phone' && value && !/^\d{10,11}$/.test(value)) {
      setErrors(prev => ({ ...prev, phone: 'Số điện thoại phải có 10-11 chữ số' }));
    }
    if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      setErrors(prev => ({ ...prev, email: 'Email không đúng định dạng' }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!form.candidate_name.trim()) newErrors.candidate_name = 'Họ tên là bắt buộc';
    if (!form.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

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

  const inputClass = (field: keyof CandidateForm) => `
    w-full px-4 py-2 border rounded-lg outline-none transition-all bg-white text-gray-900
    ${errors[field] ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}
  `;
  const readOnlyClass = "w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const errorClass = "text-red-500 text-xs mt-1 font-medium";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="text-blue-600"><Icons.UserPlus /></div>
            Tạo Mới Ứng Viên
          </h1>
          <button type="button" onClick={() => window.history.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <Icons.ArrowLeft /> Quay lại
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
          {/* Thông tin cá nhân */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-blue-700 mb-6 border-l-4 border-blue-600 pl-3">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Họ và tên *</label>
                <input type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} className={inputClass('candidate_name')} placeholder="Nguyễn Văn A" />
                {errors.candidate_name && <p className={errorClass}>{errors.candidate_name}</p>}
              </div>
              <div>
                <label className={labelClass}>Giới tính</label>
                <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={inputClass('gender')}>
                  <option value="">-- Chọn giới tính --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Số điện thoại *</label>
                <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} placeholder="090..." />
                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass('email')} placeholder="example@gmail.com" />
                {errors.email && <p className={errorClass}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelClass}>Ngày sinh</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass('date_of_birth')} />
              </div>
              <div>
                <label className={labelClass}>Năm sinh (Tự động)</label>
                <input type="text" value={birthYear} readOnly className={readOnlyClass} />
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-emerald-700 mb-6 border-l-4 border-emerald-600 pl-3">Địa chỉ thường trú</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Số nhà / Tên đường" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} className={inputClass('address_street')} />
                <input type="text" placeholder="Phường / Xã" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass('address_ward')} />
                <input type="text" placeholder="Tỉnh / Thành phố" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass('address_city')} />
              </div>
              <input type="text" value={addressFull} readOnly className={readOnlyClass} placeholder="Địa chỉ hiển thị đầy đủ..." />
            </div>
          </div>

          {/* Nguồn dữ liệu & Phụ trách */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-pink-700 mb-6 border-l-4 border-pink-600 pl-3">Nguồn dữ liệu & Phụ trách</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Bộ phận tạo nguồn</label>
                <select value={form.data_source_dept} onChange={(e) => handleChange('data_source_dept', e.target.value)} className={inputClass('data_source_dept')}>
                  <option value="">-- Chọn bộ phận --</option>
                  {MASTER_DATA.sourceDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nhóm nguồn</label>
                <select value={form.data_source_type_group} onChange={(e) => handleChange('data_source_type_group', e.target.value)} className={inputClass('data_source_type_group')} disabled={!form.data_source_dept}>
                  <option value="">-- Chọn nhóm nguồn --</option>
                  {availableSourceTypeGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Loại nguồn cụ thể</label>
                <select value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} className={inputClass('data_source_type')} disabled={!form.data_source_type_group}>
                  <option value="">-- Chọn nguồn cụ thể --</option>
                  {availableSourceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>ID nhân viên phụ trách (Tự động)</label>
                <input type="text" value={form.assigned_user} readOnly className={readOnlyClass} />
              </div>
            </div>
          </div>

          {/* Nút thao tác */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center gap-4 z-10">
            <button type="button" onClick={() => window.history.back()} className="bg-white border border-gray-300 py-3 px-8 rounded-xl font-bold hover:bg-gray-50 transition">Hủy bỏ</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white py-3 px-12 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-300 transition">
              {loading ? <Icons.Loader2 /> : <Icons.Save />} LƯU ỨNG VIÊN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCandidate() {
  return (
    <ProtectedRoute>
      <NewCandidateForm />
    </ProtectedRoute>
  );
}
