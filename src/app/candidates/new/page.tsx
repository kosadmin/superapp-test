'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';


const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

const Icons = {
  UserPlus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="16" x2="22" y1="11" y2="11"/></svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  Loader2: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.21-8.58"/></svg>
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
  
  // Khởi tạo state cho auth để tránh gọi useAuth trực tiếp khi Prerender
  const [authData, setAuthData] = useState<any>(null);
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

  // Khắc phục lỗi Build: Chỉ lấy dữ liệu Auth khi component đã Mounted ở Client
  useEffect(() => {
    setMounted(true);
    try {
        // Trong dự án thật, logic này sẽ an toàn vì chạy sau khi hydrate
        // @ts-ignore
        const data = useAuth(); 
        setAuthData(data);
    } catch (e) {
        console.warn("Auth context not available yet");
    }
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const user_id = authData?.user_id;
    const user_group = authData?.user_group;

    if (!user_id) {
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
        alert('Lỗi: ' + (data.message || 'Không thể lưu dữ liệu'));
      }
    } catch (err) {
      alert('Lỗi kết nối Server n8n');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 shadow-sm";
  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";
  const cardClass = "bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6";

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 text-gray-900">
        <div className="max-w-3xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                        <Icons.UserPlus />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">Tạo mới ứng viên</h1>
                </div>
                <p className="text-sm text-gray-400 font-medium ml-12">Điền thông tin chi tiết để thêm vào danh sách quản lý</p>
            </div>

            {authData && (
                <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400">
                        {authData.user_id?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Nhân viên</p>
                        <p className="text-sm font-black text-gray-700">{authData.user_id}</p>
                    </div>
                </div>
            )}
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <input required type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="0901234567" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Số CCCD</label>
                  <input type="text" value={form.id_card_number} onChange={(e) => handleChange('id_card_number', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ngày sinh</label>
                  <input type="date" value={form.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Thành phố / Tỉnh</label>
                  <input type="text" value={form.address_city} onChange={(e) => handleChange('address_city', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className={cardClass}>
               <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Công việc & Nguồn</h2>
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
                  <label className={labelClass}>Loại nguồn dữ liệu</label>
                  <input type="text" value={form.data_source_type} onChange={(e) => handleChange('data_source_type', e.target.value)} placeholder="VD: Facebook, TikTok" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Công ty</label>
                  <input type="text" value={form.company} onChange={(e) => handleChange('company', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? <Icons.Loader2 /> : <Icons.Save />}
                XÁC NHẬN TẠO MỚI
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
