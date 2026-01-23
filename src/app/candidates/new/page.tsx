'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'; 
import { MASTER_DATA } from '@/constants/masterData';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACE) ---
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

// Định nghĩa kiểu cho lỗi (Sửa lỗi "Property ... does not exist on type '{}'")
interface FormErrors {
  [key: string]: string | undefined;
}

// SVG Icons
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
  
  // Áp dụng Interface FormErrors
  const [errors, setErrors] = useState<FormErrors>({});

  // Áp dụng Interface CandidateForm
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

  useEffect(() => {
    if (user_id) {
      setForm(prev => ({ ...prev, assigned_user: String(user_id) }));
    }
  }, [user_id]);

  const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city]
    .filter(Boolean)
    .join(' - ');

// Tìm đến đoạn định nghĩa availableSourceTypes và bổ sung thêm:

// Danh sách Loại nguồn dựa trên Bộ phận (Đã có của bạn)
const availableSourceTypeGroups = form.data_source_dept 
  ? (MASTER_DATA.sourceTypeGroupsByDept as any)[form.data_source_dept] || [] 
  : [];

// THÊM MỚI: Danh sách Nguồn cụ thể dựa trên Loại nguồn
const availableSourceTypes = form.data_source_type_group
  ? (MASTER_DATA.sourceTypesByGroup as any)[form.data_source_type_group] || []
  : [];

  const validate = () => {
    const newErrors: FormErrors = {};
    
    if (!form.candidate_name) newErrors.candidate_name = "Vui lòng nhập họ tên";
    if (!form.phone || form.phone.length !== 10) newErrors.phone = "Số điện thoại phải đúng 10 số";

    if (form.project && !MASTER_DATA.projects.includes(form.project)) {
      newErrors.project = "Dự án không hợp lệ";
    }
    if (form.address_city && !MASTER_DATA.cities.includes(form.address_city)) {
      newErrors.address_city = "Tỉnh/Thành phố không hợp lệ";
    }

    if (form.data_source_dept && !MASTER_DATA.sourceDepartments.includes(form.data_source_dept)) {
        newErrors.data_source_dept = "Bộ phận không hợp lệ";
    }
    
    if (form.data_source_dept && form.data_source_type_group) {
        const validTypes = (MASTER_DATA.sourceTypeGroupsByDept as any)[form.data_source_dept] || [];
        if (!validTypes.includes(form.data_source_type_group)) {
            newErrors.data_source_type_group = "Loại nguồn không khớp với Bộ phận";
        }
    }
    if (form.data_source_type_group && form.data_source_type) {
    const validSpecificTypes = (MASTER_DATA.sourceTypesByGroup as any)[form.data_source_type_group] || [];
    if (!validSpecificTypes.includes(form.data_source_type)) {
        newErrors.data_source_type = "Nguồn cụ thể không hợp lệ với Loại nguồn đã chọn";
    }
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleChange = (field: keyof CandidateForm, value: string) => {
  setForm(prev => {
    const newData = { ...prev, [field]: value };
    
    // Nếu đổi Bộ phận -> Reset cả 2 tầng dưới
    if (field === 'data_source_dept') {
      newData.data_source_type_group = ''; 
      newData.data_source_type = '';
    }
    
    // Nếu đổi Loại nguồn -> Reset tầng nguồn cụ thể
    if (field === 'data_source_type_group') {
      newData.data_source_type = '';
    }
    
    return newData;
  });

    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
        alert("Vui lòng kiểm tra lại thông tin nhập liệu");
        return;
    }

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

      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("PAYLOAD SENT:", payload);
      alert(`[THÀNH CÔNG] Đã tạo ứng viên: ${payload.candidate_name}`);
      
    } catch (err) {
      console.error("Submit error:", err);
      alert('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white text-gray-900 ${
    errors[fieldName] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
  }`;
  
  const readOnlyClass = "w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const errorMsgClass = "text-red-500 text-xs mt-1 font-medium";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="text-blue-600"><Icons.UserPlus /></div>
              Tạo Mới Ứng Viên
            </h1>
            <button 
                type="button"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <Icons.ArrowLeft /> Quay lại
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* Thông tin cá nhân */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-blue-700 mb-6 border-l-4 border-blue-600 pl-3">Thông tin cá nhân</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Họ và tên *</label>
                  <input type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} className={inputClass('candidate_name')} placeholder="Nguyễn Văn A" />
                  {errors.candidate_name && <p className={errorMsgClass}>{errors.candidate_name}</p>}
                </div>
                <div>
                  <label className={labelClass}>Giới tính</label>
                  <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className={inputClass('gender')}>
                    <option value="">-- Chọn giới tính --</option>
                    {MASTER_DATA.genders.map((item) => (<option key={item} value={item}>{item}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại *</label>
                  <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} placeholder="0901234567" />
                  {errors.phone && <p className={errorMsgClass}>{errors.phone}</p>}
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={inputClass('email')} placeholder="example@gmail.com" />
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

            {/* Căn cước công dân */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-blue-700 mb-6 border-l-4 border-blue-600 pl-3">Thông tin CCCD</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass('id_card_number')} />
                </div>
                <div>
                  <label className={labelClass}>Ngày cấp</label>
                  <input type="date" value={form.id_card_issued_date} onChange={(e) => handleChange('id_card_issued_date', e.target.value)} className={inputClass('id_card_issued_date')} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Nơi cấp</label>
                  <input type="text" value={form.id_card_issued_place} onChange={(e) => handleChange('id_card_issued_place', e.target.value)} className={inputClass('id_card_issued_place')} />
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
                    <input type="text" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} className={inputClass('address_street')} />
                  </div>
                  <div>
                    <label className={labelClass}>Phường / Xã</label>
                    <input type="text" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass('address_ward')} />
                  </div>
                  <div>
                    <label className={labelClass}>Tỉnh / Thành phố</label>
                    <select value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass('address_city')}>
                      <option value="">-- Chọn --</option>
                      {MASTER_DATA.cities.map((item) => (<option key={item} value={item}>{item}</option>))}
                    </select>
                  </div>
                </div>
                <input type="text" value={addressFull} readOnly className={readOnlyClass} placeholder="Địa chỉ hiển thị tự động" />
              </div>
            </div>

                      {/* Học vấn & Kinh nghiệm */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-orange-700 mb-6 border-l-4 border-orange-600 pl-3">Học vấn & Kinh nghiệm</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Trình độ học vấn</label>
                  <input type="text" value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)} className={inputClass('education_level')} placeholder="Đại học, Cao đẳng..." />
                </div>
                <div>
                  <label className={labelClass}>Tóm tắt kinh nghiệm làm việc</label>
                  <textarea rows={3} value={form.experience_summary} onChange={(e) => handleChange('experience_summary', e.target.value)} className={inputClass('experience_summary')} placeholder="Các công ty đã làm, vị trí đảm nhiệm..."></textarea>
                </div>
                <div>
                  <label className={labelClass}>Nguyện vọng công việc</label>
                  <textarea rows={2} value={form.job_wish} onChange={(e) => handleChange('job_wish', e.target.value)} className={inputClass('job_wish')} placeholder="Mong muốn về lương, môi trường..."></textarea>
                </div>
              </div>
            </div>

            {/* Tuyển dụng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-purple-700 mb-6 border-l-4 border-purple-600 pl-3">Phân loại tuyển dụng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Dự án</label>
                  <select value={form.project} onChange={(e) => handleChange('project', e.target.value)} className={inputClass('project')}>
                    <option value="">-- Chọn dự án --</option>
                    {MASTER_DATA.projects.map((item) => (<option key={item} value={item}>{item}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass('company')} />
                </div>
                                <div className="md:col-span-2">
                  <label className={labelClass}>Vị trí ứng tuyển</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={inputClass('position')} />
                </div>
              </div>
            </div>

            {/* Nguồn dữ liệu */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-pink-700 mb-6 border-l-4 border-pink-600 pl-3">Nguồn dữ liệu & Phụ trách</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Bộ phận tạo nguồn</label>
                  <select value={form.data_source_dept} onChange={(e) => handleChange('data_source_dept', e.target.value)} className={inputClass('data_source_dept')}>
                    <option value="">-- Chọn bộ phận --</option>
                    {MASTER_DATA.sourceDepartments.map((item) => (<option key={item} value={item}>{item}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Loại nguồn</label>
                  <select 
                    value={form.data_source_type_group} 
                    onChange={(e) => handleChange('data_source_type_group', e.target.value)} 
                    className={`${inputClass('data_source_type_group')} ${!form.data_source_dept ? 'bg-gray-100' : ''}`}
                    disabled={!form.data_source_dept}
                  >
                    <option value="">-- Chọn loại nguồn --</option>
                    {availableSourceTypes.map((item: string) => (<option key={item} value={item}>{item}</option>))}
                  </select>
                </div>
<div>
  <label className={labelClass}>Loại nguồn cụ thể</label>
  <select 
    value={form.data_source_type} 
    onChange={(e) => handleChange('data_source_type', e.target.value)} 
    className={`${inputClass('data_source_type')} ${!form.data_source_type_group ? 'bg-gray-100' : ''}`}
    disabled={!form.data_source_type_group}
  >
    <option value="">-- Chọn nguồn cụ thể --</option>
    {availableSourceTypes.map((item) => (
      <option key={item} value={item}>{item}</option>
    ))}
  </select>
</div>
              </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center gap-4 z-10">
              <button type="button" onClick={() => window.history.back()} className="bg-white border border-gray-300 py-3 px-8 rounded-xl font-bold">Hủy bỏ</button>
              <button type="submit" disabled={loading} className="bg-blue-600 text-white py-3 px-12 rounded-xl font-bold shadow-lg flex items-center gap-2">
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
