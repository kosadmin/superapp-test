'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { MASTER_DATA } from '@/constants/masterData';
import { API_CONFIG } from '@/constants/masterData';

interface CandidateForm {
  candidate_name: string;
  phone: string;
  other_phone: string;
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
  take_note: string;
  project: string;
  project_id: string;
  project_type: string;
  position: string;
  company: string;
  department: string;
  data_source_dept: string;
  data_source_type_group: string;
  data_source_type: string;
  assigned_user: string;
  assigned_user_name: string;
  assigned_user_group: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

function NewCandidateForm() {
  const { name, user_id, user_group } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<CandidateForm>({
    candidate_name: '', phone: '', other_phone: '', gender: '', email: '',
    id_card_number: '', id_card_issued_date: '', id_card_issued_place: '',
    date_of_birth: '', address_street: '', address_ward: '', address_city: '',
    education_level: '', experience_summary: '', job_wish: '', take_note: '',
    project: '', project_id: '', project_type: '', position: '', company: '', department: '',
    data_source_dept: '', data_source_type_group: '', data_source_type: '',
    assigned_user: '', assigned_user_name: '', assigned_user_group: '',
  });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      assigned_user: user_id ? String(user_id) : prev.assigned_user,
      assigned_user_name: name ? String(name) : prev.assigned_user_name,
      assigned_user_group: user_group ? String(user_group) : prev.assigned_user_group,
    }));
  }, [user_id, name, user_group]);

  const availableSourceTypeGroups = form.data_source_dept
    ? (MASTER_DATA.sourceTypeGroupsByDept as Record<string, string[]>)[form.data_source_dept] || []
    : [];

  const availableSourceTypes = form.data_source_type_group
    ? (MASTER_DATA.sourceTypesByGroup as Record<string, string[]>)[form.data_source_type_group] || []
    : [];

  const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city].filter(Boolean).join(' - ');

  const handleChange = (field: keyof CandidateForm, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      if (field === 'project') {
        newForm.project_type = MASTER_DATA.projectTypeMap[value] || '';
        newForm.project_id = MASTER_DATA.projectIdMap[value] || '';
        newForm.company = MASTER_DATA.projectCompanyMap[value] || '';
      }
      if (field === 'data_source_dept') {
        newForm.data_source_type_group = '';
        newForm.data_source_type = '';
      } else if (field === 'data_source_type_group') {
        newForm.data_source_type = '';
      }
      return newForm;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (field === 'phone' && value && !/^0\d{9}$/.test(value))
      setErrors(prev => ({ ...prev, phone: 'SĐT phải có 10 chữ số và bắt đầu bằng 0' }));
    if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value))
      setErrors(prev => ({ ...prev, email: 'Email không đúng định dạng' }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!form.candidate_name.trim()) newErrors.candidate_name = 'Họ tên là bắt buộc';
    if (!form.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^0\d{9}$/.test(form.phone)) newErrors.phone = 'SĐT phải có 10 chữ số và bắt đầu bằng 0';
    if (!form.data_source_dept) newErrors.data_source_dept = 'Vui lòng chọn Bộ phận tạo nguồn';
    if (!form.data_source_type_group) newErrors.data_source_type_group = 'Vui lòng chọn Nhóm nguồn';
    if (!form.data_source_type) newErrors.data_source_type = 'Vui lòng chọn Loại nguồn cụ thể';
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
        name: name || 'unknown',
        user_id: user_id || 'unknown',
        user_group: user_group || 'unknown',
        ...form,
        birth_year: birthYear,
        address_full: addressFull,
        contacted: true,
      };
      const res = await fetch(API_CONFIG.CANDIDATE_URL, {
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
      console.error('Submit error:', err);
      alert('Lỗi kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  // --- STYLE HELPERS ---
  const inp = (field: keyof CandidateForm) =>
    `w-full p-2.5 border rounded-xl mt-1 text-sm outline-none transition focus:bg-white ${errors[field] ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:border-orange-400 bg-white'}`;
  const ro = "w-full p-2.5 border rounded-xl mt-1 bg-gray-50 text-gray-500 text-sm cursor-not-allowed";
  const lbl = "text-[10px] font-bold text-gray-400 uppercase ml-1";
  const err = "text-red-500 text-[10px] mt-0.5 ml-1 font-medium";

  // Section header component helper
  const SectionHeader = ({ color, label }: { color: string; label: string }) => (
    <h3 className={`font-bold mb-4 border-l-4 pl-3 text-xs uppercase tracking-wider text-gray-800 ${color}`}>{label}</h3>
  );

  return (
    <div className="h-full bg-gray-100 overflow-hidden flex flex-col text-sm">

      {/* TOP BAR */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 className="font-black text-orange-700 uppercase tracking-tight text-sm">Tạo mới ứng viên</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.history.back()}
            className="px-4 py-2 rounded-xl border text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition">
            Hủy bỏ
          </button>
          <button type="submit" form="new-candidate-form" disabled={loading}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300 shadow-sm shadow-orange-200 transition flex items-center gap-1.5">
            {loading ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.21-8.58"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            )}
            {loading ? 'Đang lưu...' : 'Lưu ứng viên'}
          </button>
        </div>
      </div>

      {/* BODY — scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <form id="new-candidate-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* CỘT TRÁI */}
            <div className="space-y-4">

              {/* THÔNG TIN CÁ NHÂN */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-purple-500" label="Thông tin cá nhân" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <label className={lbl}>Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" value={form.candidate_name} onChange={e => handleChange('candidate_name', e.target.value)} className={inp('candidate_name')} placeholder="Nguyễn Văn A" />
                    {errors.candidate_name && <p className={err}>{errors.candidate_name}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Giới tính</label>
                    <select value={form.gender} onChange={e => handleChange('gender', e.target.value)} className={inp('gender')}>
                      <option value="">-- Chọn --</option>
                      {MASTER_DATA.genders.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ngày sinh</label>
                    <input type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} className={inp('date_of_birth')} />
                  </div>
                  <div>
                    <label className={lbl}>Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)} className={inp('phone')} placeholder="090..." />
                    {errors.phone && <p className={err}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Số điện thoại khác</label>
                    <input type="text" value={form.other_phone} onChange={e => handleChange('other_phone', e.target.value)} className={inp('other_phone')} placeholder="090..." />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Email</label>
                    <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className={inp('email')} placeholder="example@gmail.com" />
                    {errors.email && <p className={err}>{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* CCCD */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-purple-400" label="Thông tin CCCD" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className={lbl}>Số CCCD</label>
                    <input type="text" value={form.id_card_number} onChange={e => handleChange('id_card_number', e.target.value)} className={inp('id_card_number')} />
                  </div>
                  <div>
                    <label className={lbl}>Ngày cấp</label>
                    <input type="date" value={form.id_card_issued_date} onChange={e => handleChange('id_card_issued_date', e.target.value)} className={inp('id_card_issued_date')} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Nơi cấp</label>
                    <input type="text" value={form.id_card_issued_place} onChange={e => handleChange('id_card_issued_place', e.target.value)} className={inp('id_card_issued_place')} />
                  </div>
                </div>
              </div>

              {/* ĐỊA CHỈ */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-emerald-500" label="Địa chỉ thường trú" />
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Số nhà / Tên đường</label>
                      <input type="text" value={form.address_street} onChange={e => handleChange('address_street', e.target.value)} className={inp('address_street')} />
                    </div>
                    <div>
                      <label className={lbl}>Phường / Xã</label>
                      <input type="text" value={form.address_ward} onChange={e => handleChange('address_ward', e.target.value)} className={inp('address_ward')} />
                    </div>
                    <div>
                      <label className={lbl}>Tỉnh / Thành phố</label>
                      <select value={form.address_city} onChange={e => handleChange('address_city', e.target.value)} className={inp('address_city')}>
                        <option value="">-- Chọn --</option>
                        {MASTER_DATA.cities.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Địa chỉ đầy đủ (Tự động)</label>
                    <input type="text" value={addressFull} readOnly className={ro} placeholder="Tự động ghép từ các ô trên" />
                  </div>
                </div>
              </div>

            </div>

            {/* CỘT PHẢI */}
            <div className="space-y-4">

              {/* HỌC VẤN */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-orange-500" label="Học vấn & Kinh nghiệm" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Trình độ học vấn</label>
                    <select value={form.education_level} onChange={e => handleChange('education_level', e.target.value)} className={inp('education_level')}>
                      <option value="">-- Chọn trình độ --</option>
                      {MASTER_DATA.educationLevels.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Tóm tắt kinh nghiệm làm việc</label>
                    <textarea rows={3} value={form.experience_summary} onChange={e => handleChange('experience_summary', e.target.value)} className={inp('experience_summary')} placeholder="Các công ty đã làm, vị trí đảm nhiệm..." />
                  </div>
                  <div>
                    <label className={lbl}>Nguyện vọng công việc</label>
                    <textarea rows={2} value={form.job_wish} onChange={e => handleChange('job_wish', e.target.value)} className={inp('job_wish')} placeholder="Mong muốn về lương, môi trường..." />
                  </div>
                  <div>
                    <label className={lbl}>Ghi chú chăm sóc</label>
                    <textarea rows={2} value={form.take_note} onChange={e => handleChange('take_note', e.target.value)} className={inp('take_note')} placeholder="Ghi chú về cách chăm sóc, mốc chăm sóc..." />
                  </div>
                </div>
              </div>

              {/* TUYỂN DỤNG */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-orange-600" label="Phân loại tuyển dụng" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <label className={lbl}>Dự án</label>
                    <select value={form.project} onChange={e => handleChange('project', e.target.value)} className={inp('project')}>
                      <option value="">-- Chọn dự án --</option>
                      {MASTER_DATA.projects.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Loại dự án (Tự động)</label>
                    <input type="text" value={form.project_type} readOnly className={ro} placeholder="Sẽ hiển thị khi chọn dự án" />
                  </div>
                  <div>
                    <label className={lbl}>ID Dự án (Tự động)</label>
                    <input type="text" value={form.project_id} readOnly className={ro} placeholder="Sẽ hiển thị khi chọn dự án" />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Công ty (Tự động)</label>
                    <input type="text" value={form.company} readOnly className={ro} placeholder="Sẽ hiển thị khi chọn dự án" />
                  </div>
                  <div>
                    <label className={lbl}>Vị trí ứng tuyển</label>
                    <input type="text" value={form.position} onChange={e => handleChange('position', e.target.value)} className={inp('position')} />
                  </div>
                  <div>
                    <label className={lbl}>Bộ phận ứng tuyển</label>
                    <input type="text" value={form.department} onChange={e => handleChange('department', e.target.value)} className={inp('department')} />
                  </div>
                </div>
              </div>

              {/* NGUỒN & PHỤ TRÁCH */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-pink-500" label="Nguồn dữ liệu & Phụ trách" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className={lbl}>Bộ phận tạo nguồn <span className="text-red-500">*</span></label>
                    <select value={form.data_source_dept} onChange={e => handleChange('data_source_dept', e.target.value)} className={inp('data_source_dept')}>
                      <option value="">-- Chọn bộ phận --</option>
                      {MASTER_DATA.sourceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.data_source_dept && <p className={err}>{errors.data_source_dept}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Nhóm nguồn <span className="text-red-500">*</span></label>
                    <select value={form.data_source_type_group} onChange={e => handleChange('data_source_type_group', e.target.value)} className={inp('data_source_type_group')} disabled={!form.data_source_dept}>
                      <option value="">-- Chọn nhóm --</option>
                      {availableSourceTypeGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {errors.data_source_type_group && <p className={err}>{errors.data_source_type_group}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Loại nguồn cụ thể <span className="text-red-500">*</span></label>
                    <select value={form.data_source_type} onChange={e => handleChange('data_source_type', e.target.value)} className={inp('data_source_type')} disabled={!form.data_source_type_group}>
                      <option value="">-- Chọn nguồn --</option>
                      {availableSourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.data_source_type && <p className={err}>{errors.data_source_type}</p>}
                  </div>

                  <div className="col-span-2 border-t pt-3 mt-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Người phụ trách (Tự động)</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <label className={lbl}>ID Nhân viên</label>
                        <input type="text" value={form.assigned_user} readOnly className={ro} />
                      </div>
                      <div>
                        <label className={lbl}>Họ tên nhân viên</label>
                        <input type="text" value={form.assigned_user_name} readOnly className={ro} />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>Nhóm phụ trách</label>
                        <input type="text" value={form.assigned_user_group} readOnly className={ro} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCandidate() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <NewCandidateForm />
      </AppLayout>
    </ProtectedRoute>
  );
}
