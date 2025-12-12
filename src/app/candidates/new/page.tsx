'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute'; // Import ProtectedRoute

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

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

export default function NewCandidate() {
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
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...form,
          // Các trường boolean mặc định false nếu không tick
          contacted: true, // khi tạo mới coi như đã liên hệ
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

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-700">
          Tạo ứng viên mới
        </h1>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={form.candidate_name}
                onChange={(e) => handleChange('candidate_name', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CMND/CCCD</label>
              <input
                type="text"
                value={form.id_card_number}
                onChange={(e) => handleChange('id_card_number', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
              <input
                type="text"
                value={form.address_street}
                onChange={(e) => handleChange('address_street', e.target.value)}
                placeholder="Số nhà, đường..."
                className="w-full px-4 py-3 border rounded-lg mb-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.address_ward}
                  onChange={(e) => handleChange('address_ward', e.target.value)}
                  placeholder="Phường/Xã"
                  className="px-4 py-3 border rounded-lg"
                />
                <input
                  type="text"
                  value={form.address_city}
                  onChange={(e) => handleChange('address_city', e.target.value)}
                  placeholder="Tỉnh/Thành phố"
                  className="px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dự án/Khách hàng</label>
              <input
                type="text"
                value={form.project}
                onChange={(e) => handleChange('project', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="VD: VinFast Outsourcing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí tuyển</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="Công nhân sản xuất"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="VinFast"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn dữ liệu</label>
              <input
                type="text"
                value={form.data_source_type}
                onChange={(e) => handleChange('data_source_type', e.target.value)}
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="Tiktok Ads, Seeding,..."
              />
            </div>
          </div>

          <div className="flex gap-4 justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-xl text-xl transition shadow-lg disabled:opacity-70"
            >
              {loading ? 'Đang tạo...' : 'TẠO ỨNG VIÊN'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/candidates')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-12 rounded-xl text-xl transition"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
