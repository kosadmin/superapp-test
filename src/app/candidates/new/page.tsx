'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';


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
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  )
};

interface FormData {
  candidate_name: string;
  phone: string;
  id_card_number: string;
  date_of_birth: string;
  address_street: string;
  address_ward: string;
  address_city: string;
  project: string;
  position: string;
  company: string;
  data_source_type: string;
  assigned_user?: string;
}

export default function App() {
  const router = useRouter();
  const auth = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    candidate_name: '',
    phone: '',
    id_card_number: '',
    date_of_birth: '',
    address_street: '',
    address_ward: '',
    address_city: '',
    project: '',
    position: '',
    company: '',
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

    const user_id = auth?.user_id;
    const user_group = auth?.user_group;

    if (!user_id || !user_group) {
      alert("Lỗi: Không tìm thấy thông tin định danh người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);

    const birthYear = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
    const addressFull = [form.address_street, form.address_ward, form.address_city]
      .filter(Boolean)
      .join(' - ');

    try {
      const payload = {
        action: 'create',
        ...form,
        birth_year: birthYear,
        address_full: addressFull,
        user_id,
        user_group,
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
        alert('Lỗi: ' + (data.message || 'Không thể tạo ứng viên'));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối server n8n');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-gray-900";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";
  const cardClass = "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6";
  const uploadBoxClass = "border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-gray-400 min-h-[100px]";

  if (!mounted || auth?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 text-blue-600"><Icons.Loader2 /></div>
          <span className="text-sm text-gray-400 font-medium">Đang tải hệ thống...</span>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
        <div className="max-w-4xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-blue-200 shadow-lg">
                <Icons.UserPlus />
              </div>
              TẠO MỚI ỨNG VIÊN
            </h1>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Người thực hiện</p>
                <p className="text-sm font-black text-gray-700">{auth?.user_id}</p>
              </div>
              <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded uppercase">
                {auth?.user_group}
              </span>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            
            {/* THÔNG TIN CÁ NHÂN */}
            <div className={cardClass}>
              <h2 className="text-sm font-black text-blue-600 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                THÔNG TIN CÁ NHÂN
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>Họ và tên ứng viên *</label>
                  <input required type="text" value={form.candidate_name} onChange={(e) => handleChange('candidate_name', e.target.value)} placeholder="VD: NGUYỄN VĂN A" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại *</label>
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="09xxxxxxxx" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} placeholder="Nhập số thẻ..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Năm sinh (Tự động)</label>
                  <input readOnly type="text" value={form.date_of_birth ? form.date_of_birth.split('-')[0] : ''} className="w-full px-4 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-400 outline-none" />
                </div>
              </div>
            </div>

            {/* ĐỊA CHỈ */}
            <div className={cardClass}>
              <h2 className="text-sm font-black text-emerald-600 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                ĐỊA CHỈ THƯỜNG TRÚ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Số nhà / Đường</label>
                  <input type="text" value={form.address_street} onChange={(e) => handleChange('address_street', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phường / Xã</label>
                  <input type="text" value={form.address_ward} onChange={(e) => handleChange('address_ward', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Thành phố / Tỉnh</label>
                  <input type="text" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* CÔNG VIỆC */}
            <div className={cardClass}>
              <h2 className="text-sm font-black text-orange-600 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-600 rounded-full"></div>
                VỊ TRÍ ỨNG TUYỂN
              </h2>
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
                  <label className={labelClass}>Vị trí</label>
                  <input type="text" value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* NGUỒN DỮ LIỆU */}
            <div className={cardClass}>
              <h2 className="text-sm font-black text-purple-600 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-purple-600 rounded-full"></div>
                PHÂN LOẠI NGUỒN
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Loại nguồn dữ liệu</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} placeholder="VD: Facebook, TikTok..." className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phân công cho (ID User)</label>
                  <input type="text" value={form.assigned_user} onChange={(e) => handleChange('assigned_user', e.target.value)} placeholder="Nhập mã nhân viên..." className={inputClass} />
                </div>
              </div>
            </div>

            {/* HỒ SƠ ĐÍNH KÈM */}
            <div className={cardClass}>
              <h2 className="text-sm font-black text-gray-700 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gray-700 rounded-full"></div>
                HỒ SƠ ĐÍNH KÈM (DỰ KIẾN)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Ảnh CCCD Mặt trước</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-[10px] font-black uppercase text-gray-300 tracking-tighter">Chưa thêm logic upload</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Ảnh CCCD Mặt sau</label>
                  <div className={uploadBoxClass}>
                    <Icons.Upload />
                    <span className="mt-2 text-[10px] font-black uppercase text-gray-300 tracking-tighter">Chưa thêm logic upload</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Tài liệu khác (CV, Bằng cấp...)</label>
                  <div className={`${uploadBoxClass} min-h-[80px]`}>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Icons.FileText />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Click để chọn file đính kèm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NÚT BẤM */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 px-16 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5"><Icons.Loader2 /></div>
                    ĐANG XỬ LÝ...
                  </>
                ) : (
                  <>
                    <Icons.Save />
                    TẠO ỨNG VIÊN MỚI
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/candidates')}
                className="w-full md:w-auto bg-white border border-gray-200 text-gray-500 font-bold py-4 px-10 rounded-2xl hover:bg-gray-50 transition-all"
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
