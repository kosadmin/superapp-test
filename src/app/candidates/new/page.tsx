'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'; 
import { MASTER_DATA } from '@/constants/masterData';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

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
    candidate_name: '', phone: '', gender: '', email: '',
    id_card_number: '', id_card_issued_date: '', id_card_issued_place: '',
    date_of_birth: '', address_street: '', address_ward: '', address_city: '',
    education_level: '', experience_summary: '', job_wish: '',
    project: '', position: '', company: '',
    data_source_dept: '', data_source_type_group: '', data_source_type: '',
    assigned_user: '',
  });

  useEffect(() => {
    if (user_id) setForm(prev => ({ ...prev, assigned_user: String(user_id) }));
  }, [user_id]);

  const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city].filter(Boolean).join(' - ');

  // Logic lấy danh sách dropdown
  const availableSourceTypeGroups = form.data_source_dept 
    ? (MASTER_DATA as any).sourceTypeGroupsByDept[form.data_source_dept] || [] 
    : [];

  const availableSourceTypes = form.data_source_type_group
    ? (MASTER_DATA as any).sourceTypesByGroup[form.data_source_type_group] || []
    : [];

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.candidate_name) newErrors.candidate_name = "Vui lòng nhập họ tên";
    if (!form.phone || form.phone.length !== 10) newErrors.phone = "Số điện thoại phải đúng 10 số";
    
    // Kiểm tra tính nhất quán của nguồn (Fix logic thiếu ngoặc ở đây)
    if (form.data_source_dept && form.data_source_type_group) {
        const validGroups = (MASTER_DATA as any).sourceTypeGroupsByDept[form.data_source_dept] || [];
        if (!validGroups.includes(form.data_source_type_group)) {
            newErrors.data_source_type_group = "Loại nguồn không khớp";
        }
    }

    if (form.data_source_type_group && form.data_source_type) {
        const validTypes = (MASTER_DATA as any).sourceTypesByGroup[form.data_source_type_group] || [];
        if (!validTypes.includes(form.data_source_type)) {
            newErrors.data_source_type = "Nguồn cụ thể không khớp";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CandidateForm, value: string) => {
    setForm(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'data_source_dept') {
        newData.data_source_type_group = '';
        newData.data_source_type = '';
      }
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
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        action: 'create', ...form, birth_year: birthYear,
        address_full: addressFull, user_id: user_id || 'unknown',
        user_group: user_group || 'unknown', contacted: true,
      };
      console.log("Submit:", payload);
      alert("Thành công!");
    } catch (err) {
      alert("Lỗi!");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName: string) => `w-full px-4 py-2 border rounded-lg outline-none transition-all ${
    errors[fieldName] ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
  }`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icons.UserPlus /> Tạo Mới Ứng Viên</h1>
          <button onClick={() => window.history.back()} className="flex items-center gap-1 text-gray-500"><Icons.ArrowLeft /> Quay lại</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
          {/* Section 1: Thông tin cá nhân */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-blue-600 mb-4">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Họ tên *</label>
                <input type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} className={inputClass('candidate_name')} />
                {errors.candidate_name && <p className="text-red-500 text-xs mt-1">{errors.candidate_name}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold">Điện thoại *</label>
                <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className={inputClass('phone')} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Nguồn dữ liệu - ĐÃ FIX SELECT */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-pink-600 mb-4">Nguồn dữ liệu 3 cấp</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cấp 1 */}
              <div>
                <label className="text-sm font-semibold">Bộ phận</label>
                <select value={form.data_source_dept} onChange={(e) => handleChange('data_source_dept', e.target.value)} className={inputClass('data_source_dept')}>
                  <option value="">-- Chọn --</option>
                  {MASTER_DATA.sourceDepartments.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              {/* Cấp 2 */}
              <div>
                <label className="text-sm font-semibold">Loại nguồn</label>
                <select 
                  value={form.data_source_type_group} 
                  onChange={(e) => handleChange('data_source_type_group', e.target.value)} 
                  className={inputClass('data_source_type_group')}
                  disabled={!form.data_source_dept}
                >
                  <option value="">-- Chọn --</option>
                  {availableSourceTypeGroups.map((item: string) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              {/* Cấp 3 */}
              <div>
                <label className="text-sm font-semibold">Nguồn cụ thể</label>
                <select 
                  value={form.data_source_type} 
                  onChange={(e) => handleChange('data_source_type', e.target.value)} 
                  className={inputClass('data_source_type')}
                  disabled={!form.data_source_type_group}
                >
                  <option value="">-- Chọn --</option>
                  {availableSourceTypes.map((item: string) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Footer nút bấm */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 border-t flex justify-center gap-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold flex items-center gap-2">
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
