'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; 
import ProtectedRoute from '@/components/ProtectedRoute';



const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

const Icons = {
  UserPlus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
  )
};

export default function NewCandidate() {
  const router = useRouter();
  
  // SỬA LỖI TẠI ĐÂY: Destructure đúng các thuộc tính từ AuthContextType
  // Thay vì { user }, ta lấy trực tiếp { user_id, user_group }
  const { user_id, user_group } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Nam',
    phone: '',
    email: '',
    date_of_birth: '',
    address_province: '',
    address_ward: '',
    address_street: '',
    university: '',
    major: '',
    graduation_year: '',
    gpa: '',
    language_certificate: '',
    tech_stack: '',
    years_of_experience: '',
    project: '',
    role_applied: '',
    cv_link: '',
    source: '',
    pic: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Vui lòng nhập Họ tên và Số điện thoại");
      return;
    }

    setLoading(true);

    try {
      const birthYear = formData.date_of_birth ? new Date(formData.date_of_birth).getFullYear() : '';
      const addressFull = [formData.address_street, formData.address_ward, formData.address_province].filter(Boolean).join(', ');

      const payload = {
        action: 'create',
        user_id: user_id || '',      // Sử dụng giá trị lấy từ useAuth
        user_group: user_group || '', // Sử dụng giá trị lấy từ useAuth
        ...formData,
        birth_year: birthYear,
        address_full: addressFull,
        contacted: true
      };

      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Network response was not ok');
      
      alert("Tạo ứng viên thành công!");
      router.push('/candidates');

    } catch (error) {
      console.error('Submit error:', error);
      alert('Lỗi khi gửi dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                <Icons.ArrowLeft />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-slate-800">
                  <span className="p-2 bg-blue-600 rounded-lg text-white">
                    <Icons.UserPlus />
                  </span>
                  Thêm ứng viên
                </h1>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="px-5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icons.Save />}
                Lưu hồ sơ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Thông tin cơ bản</h3>
                <div className="space-y-4">
                  <Input label="Họ tên *" name="name" value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Giới tính</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Ngày sinh</label>
                      <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                  </div>
                  <Input label="Số điện thoại *" name="phone" value={formData.phone} onChange={handleChange} placeholder="09xxx" />
                  <Input label="Email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Học vấn & Chuyên môn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Trường" name="university" value={formData.university} onChange={handleChange} />
                  <Input label="Chuyên ngành" name="major" value={formData.major} onChange={handleChange} />
                  <Input label="Năm tốt nghiệp" name="graduation_year" value={formData.graduation_year} onChange={handleChange} />
                  <Input label="GPA" name="gpa" value={formData.gpa} onChange={handleChange} />
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Kỹ năng (Tech Stack)</label>
                    <textarea name="tech_stack" value={formData.tech_stack} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Thông tin ứng tuyển</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Vị trí ứng tuyển" name="role_applied" value={formData.role_applied} onChange={handleChange} />
                  <Input label="Nguồn" name="source" value={formData.source} onChange={handleChange} />
                  <div className="col-span-2">
                    <Input label="Link CV" name="cv_link" value={formData.cv_link} onChange={handleChange} placeholder="https://drive.google.com/..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
      <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300" />
    </div>
  );
}
