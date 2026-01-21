'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Hoặc đường dẫn hook Auth của bạn
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
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
  )
};

export default function NewCandidate() {
  const router = useRouter();
  
  // SỬ DỤNG HOOK AUTH ĐỂ LẤY THÔNG TIN USER
  const { user } = useAuth(); 

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
    setLoading(true);

    try {
      // 1. TÍNH TOÁN DỮ LIỆU TỰ ĐỘNG
      const birthYear = formData.date_of_birth ? new Date(formData.date_of_birth).getFullYear() : '';
      
      const addressParts = [
        formData.address_street, 
        formData.address_ward, 
        formData.address_province
      ].filter(Boolean);
      const addressFull = addressParts.join(', ');

      // 2. LẤY THÔNG TIN USER TỪ HOOK AUTH
      // Đảm bảo user tồn tại trước khi lấy
      const userId = user?.id || '';
      const userGroup = user?.group || '';

      if (!userId) {
        console.warn('Cảnh báo: Không tìm thấy User ID. Vui lòng kiểm tra trạng thái đăng nhập.');
      }

      // 3. TẠO PAYLOAD GỬI ĐI
      const payload = {
        action: 'create',      
        user_id: userId,       
        user_group: userGroup, 
        ...formData,
        birth_year: birthYear,
        address_full: addressFull,
        contacted: true 
      };

      console.log('Sending payload:', payload); 

      // 4. GỬI REQUEST
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create candidate');
      
      const data = await res.json();
      
      if (data.id) {
          router.push(`/candidates/${data.id}`); 
      } else {
          router.push('/candidates');
      }

    } catch (error) {
      console.error('Error creating candidate:', error);
      alert('Có lỗi xảy ra khi tạo ứng viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-slate-800"
              >
                <Icons.ArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                  <span className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200">
                    <Icons.UserPlus />
                  </span>
                  Thêm ứng viên mới
                </h1>
                <p className="text-slate-500 mt-1 ml-14">Nhập thông tin hồ sơ ứng viên vào hệ thống</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-all shadow-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all shadow-md shadow-blue-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icons.Save /> Lưu hồ sơ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Cột trái: Thông tin cá nhân */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                  Thông tin cá nhân
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                    <input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giới tính</label>
                      <select 
                        name="gender" 
                        value={formData.gender} 
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày sinh</label>
                      <input 
                        type="date"
                        name="date_of_birth" 
                        value={formData.date_of_birth} 
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="0912 xxx xxx"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input 
                      type="email"
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                  Địa chỉ liên hệ
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tỉnh / Thành phố</label>
                    <input 
                      name="address_province" 
                      value={formData.address_province} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Hà Nội"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quận / Huyện / Phường</label>
                    <input 
                      name="address_ward" 
                      value={formData.address_ward} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Cầu Giấy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số nhà, đường</label>
                    <input 
                      name="address_street" 
                      value={formData.address_street} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Số 1, đường ABC"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin chuyên môn & Ứng tuyển */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* Học vấn & Kinh nghiệm */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Học vấn & Kinh nghiệm
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trường Đại học / Cao đẳng</label>
                    <input 
                      name="university" 
                      value={formData.university} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Đại học Bách Khoa..."
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chuyên ngành</label>
                    <input 
                      name="major" 
                      value={formData.major} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="CNTT, Kinh tế..."
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Năm tốt nghiệp</label>
                    <input 
                      name="graduation_year" 
                      value={formData.graduation_year} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="2023"
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">GPA (Điểm trung bình)</label>
                    <input 
                      name="gpa" 
                      value={formData.gpa} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="3.2/4.0"
                    />
                  </div>

                  <div className="col-span-2">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chứng chỉ ngoại ngữ</label>
                    <input 
                      name="language_certificate" 
                      value={formData.language_certificate} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="TOEIC 800, IELTS 6.5..."
                    />
                  </div>

                   <div className="col-span-2">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tech Stack (Kỹ năng chính)</label>
                    <textarea 
                      name="tech_stack" 
                      value={formData.tech_stack} 
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                      placeholder="ReactJS, NodeJS, Java Spring Boot..."
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin Ứng tuyển */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Thông tin Ứng tuyển
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Dự án ứng tuyển</label>
                    <input 
                      name="project" 
                      value={formData.project} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Banking, E-commerce..."
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vị trí (Role)</label>
                    <input 
                      name="role_applied" 
                      value={formData.role_applied} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Frontend Dev, Tester..."
                    />
                  </div>

                  <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số năm kinh nghiệm</label>
                    <input 
                      name="years_of_experience" 
                      value={formData.years_of_experience} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="1 năm, 2 năm..."
                    />
                  </div>
                   <div>
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nguồn ứng viên</label>
                    <input 
                      name="source" 
                      value={formData.source} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Facebook, LinkedIn, Referral..."
                    />
                  </div>

                  <div className="col-span-2">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">PIC (Người phụ trách)</label>
                    <input 
                      name="pic" 
                      value={formData.pic} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Tên người phụ trách..."
                    />
                  </div>

                  <div className="col-span-2">
                     <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link CV / Portfolio</label>
                    <input 
                      name="cv_link" 
                      value={formData.cv_link} 
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-blue-600 underline-offset-2"
                      placeholder="https://drive.google.com/..."
                    />
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
