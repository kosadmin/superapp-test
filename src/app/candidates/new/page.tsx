'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

// --- UTILS ---
const formatISOToDDMMYYYY = (isoString: string): string => {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return '';
};

interface FormData {
  candidate_name: string;
  phone: string;
  email: string;
  id_card_number: string;
  id_card_issued_date: string;
  id_card_issued_place: string;
  date_of_birth: string;
  birth_year: string;
  address_full: string;
  
  project: string;
  position: string;
  company: string;
  data_source_type: string;
  
  education_level: string;
  experience_summary: string;
  job_wish: string;
  
  id_card_front_img: string;
  id_card_back_img: string;
  attachment_url: string;
}

export default function NewCandidate() {
  const { user_id, user_group } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    candidate_name: '',
    phone: '',
    email: '',
    id_card_number: '',
    id_card_issued_date: '',
    id_card_issued_place: '',
    date_of_birth: '',
    birth_year: '',
    address_full: '',
    project: '',
    position: '',
    company: '',
    data_source_type: '',
    education_level: '',
    experience_summary: '',
    job_wish: '',
    id_card_front_img: '',
    id_card_back_img: '',
    attachment_url: '',
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // Chuẩn bị payload gửi đi
    const payload = {
      action: 'create',
      user_id,
      user_group,
      ...form,
      // Convert các trường ngày tháng sang định dạng DD/MM/YYYY cho Sheet
      id_card_issued_date: formatISOToDDMMYYYY(form.id_card_issued_date),
      // Mặc định các trạng thái phễu là false khi tạo mới
      interested: false,
      scheduled_for_interview: false,
      show_up_for_interview: false,
      pass_interview: false,
      onboard: false,
      reject_offer: false,
      unqualified: false,
    };

    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert('Tạo ứng viên thành công!');
        router.push('/candidates'); // Quay lại danh sách
      } else {
        alert('Lỗi: ' + (data.message || 'Không thể tạo ứng viên'));
      }
    } catch (err) {
      alert('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-blue-800 uppercase tracking-tight">Thêm Ứng Viên Mới</h1>
              <p className="text-gray-500 text-sm">Điền thông tin chi tiết để khởi tạo hồ sơ trên hệ thống.</p>
            </div>
            <Link href="/candidates" className="text-gray-400 hover:text-gray-600 transition p-2">
               <span className="text-2xl">✕</span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. THÔNG TIN CÁ NHÂN */}
            <div className="bg-white shadow-sm border rounded-2xl p-6">
              <h3 className="text-blue-600 font-bold mb-6 flex items-center gap-2 border-b pb-3 uppercase text-xs tracking-widest">
                <span className="bg-blue-100 p-1.5 rounded-lg">👤</span> Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Họ và tên *</label>
                  <input required type="text" value={form.candidate_name} onChange={e => handleChange('candidate_name', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Số điện thoại *</label>
                  <input required type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="090..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
                  <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="example@gmail.com" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={e => handleChange('id_card_number', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Ngày cấp CCCD</label>
                  <input type="date" value={form.id_card_issued_date} onChange={e => handleChange('id_card_issued_date', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nơi cấp</label>
                  <input type="text" value={form.id_card_issued_place} onChange={e => handleChange('id_card_issued_place', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Cục CS QLHC..." />
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Ngày sinh (Text)</label>
                   <input type="text" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="VD: 01/01/1995" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Năm sinh</label>
                   <input type="number" value={form.birth_year} onChange={e => handleChange('birth_year', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="1995" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Địa chỉ đầy đủ</label>
                  <textarea value={form.address_full} onChange={e => handleChange('address_full', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-20" placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành..." />
                </div>
              </div>
            </div>

            {/* 2. THÔNG TIN CÔNG VIỆC */}
            <div className="bg-white shadow-sm border rounded-2xl p-6">
              <h3 className="text-emerald-600 font-bold mb-6 flex items-center gap-2 border-b pb-3 uppercase text-xs tracking-widest">
                <span className="bg-emerald-100 p-1.5 rounded-lg">💼</span> Thông tin công việc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Dự án/Khách hàng</label>
                  <input type="text" value={form.project} onChange={e => handleChange('project', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Vị trí ứng tuyển</label>
                  <input type="text" value={form.position} onChange={e => handleChange('position', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Công ty</label>
                  <input type="text" value={form.company} onChange={e => handleChange('company', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nguồn dữ liệu</label>
                  <input type="text" value={form.data_source_type} onChange={e => handleChange('data_source_type', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Tiktok, Facebook,..." />
                </div>
              </div>
            </div>

            {/* 3. HỌC VẤN & KINH NGHIỆM */}
            <div className="bg-white shadow-sm border rounded-2xl p-6">
              <h3 className="text-purple-600 font-bold mb-6 flex items-center gap-2 border-b pb-3 uppercase text-xs tracking-widest">
                <span className="bg-purple-100 p-1.5 rounded-lg">🎓</span> Học vấn & Kinh nghiệm
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Trình độ học vấn</label>
                  <input type="text" value={form.education_level} onChange={e => handleChange('education_level', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="VD: Cao đẳng Điện" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tóm tắt kinh nghiệm</label>
                  <textarea value={form.experience_summary} onChange={e => handleChange('experience_summary', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-24" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nguyện vọng</label>
                  <textarea value={form.job_wish} onChange={e => handleChange('job_wish', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-20 text-blue-700 font-medium" />
                </div>
              </div>
            </div>

            {/* 4. TÀI LIỆU ĐÍNH KÈM (URL) */}
            <div className="bg-white shadow-sm border rounded-2xl p-6">
              <h3 className="text-orange-600 font-bold mb-6 flex items-center gap-2 border-b pb-3 uppercase text-xs tracking-widest">
                <span className="bg-orange-100 p-1.5 rounded-lg">📎</span> Link tài liệu & Hình ảnh
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Link Ảnh mặt trước CCCD</label>
                  <input type="text" value={form.id_card_front_img} onChange={e => handleChange('id_card_front_img', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Link Ảnh mặt sau CCCD</label>
                  <input type="text" value={form.id_card_back_img} onChange={e => handleChange('id_card_back_img', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Link File CV / Đính kèm khác</label>
                  <input type="text" value={form.attachment_url} onChange={e => handleChange('attachment_url', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs text-blue-600 underline" />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-4 pt-6 pb-12">
              <button
                type="button"
                onClick={() => router.push('/candidates')}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition"
              >
                HỦY BỎ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  'TẠO HỒ SƠ ỨNG VIÊN'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
