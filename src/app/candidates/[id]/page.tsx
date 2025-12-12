'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  project?: string;
  position?: string;
  phone: string;
  id_card_number?: string;
  date_of_birth?: string;
  address_street?: string;
  address_ward?: string;
  address_city?: string;
  data_source_dept?: string;
  data_source_type_group?: string;
  data_source_type?: string;
  new?: boolean;
  interested?: boolean;
  scheduled_for_interview?: boolean;
  show_up_for_interview?: boolean;
  pass_interview?: boolean;
  onboard?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  created_at: string;
  created_by?: string;
  last_updated_at?: string;
  assigned_user?: string;
  reason_rejected_offer?: string;
  reason_unqualified?: string;
  interview_date?: string;
  onboard_date?: string;
}

// Chuyển DD/MM/YYYY → YYYY-MM-DD (cho input type="date")
const formatDateToISO = (dateString: string | undefined): string => {
  if (!dateString) return '';
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // Đã sửa: parts[2] (Năm) - parts[1] (Tháng) - parts[0] (Ngày)
    return `${parts[2]}-${parts[1]}-${parts[0]}`; 
  }
  return '';
};

// Chuyển YYYY-MM-DD → DD/MM/YYYY (để gửi về backend)
const formatISOToDDMMYYYY = (isoString: string): string => {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ''; // <-- ĐÃ THÊM DẤU ĐÓNG NGOẶC NHỌN BỊ THIẾU
}; // <-- Dấu đóng ngoặc nhọn cho hàm formatISOToDDMMYYYY()


export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null); // Sửa lỗi cú pháp: setFormData = useState
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', id }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const cand = data.data;
          setOriginalData(cand);
          setFormData(cand);
        } else {
          alert('Không tìm thấy ứng viên');
          router.push('/candidates');
        }
      })
      .catch(() => alert('Lỗi kết nối'));
  };

  if (!formData) return <div className="min-h-screen flex items-center justify-center text-2xl">Đang tải...</div>;

  const handleChange = (field: keyof Candidate, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const handleSave = async () => {
    if (!formData || !hasChanges) return;

    setIsSaving(true);
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Sửa lỗi cú pháp: headers: 'Content-Type': 'application/json'
        body: JSON.stringify({
          action: 'update',
          id: formData.candidate_id,
          updates: formData, // Gửi toàn bộ dữ liệu mới
        }),
      });
      alert('Đã lưu thành công!');
      setOriginalData(formData); // Cập nhật dữ liệu gốc
    } catch {
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('XÓA ứng viên? Không thể khôi phục!')) return; // Sửa lỗi cú pháp: thiếu dấu ) ở confirm
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      alert('Đã xóa thành công');
      router.push('/candidates');
    } catch {
      alert('Lỗi khi xóa');
    }
  };

  const funnelSteps = [
    { key: 'new', label: 'Mới' },
    { key: 'interested', label: 'Quan tâm' },
    { key: 'scheduled_for_interview', label: 'Đặt PV' },
    { key: 'show_up_for_interview', label: 'Đi PV' },
    { key: 'pass_interview', label: 'Đỗ PV' },
    { key: 'onboard', label: 'Nhận việc' },
    { key: 'reject_offer', label: 'Từ chối offer' },
    { key: 'unqualified', label: 'Không đạt' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 text-center rounded-t-3xl mb-8 shadow-lg">
        <h1 className="text-5xl font-bold mb-4">{formData.candidate_name}</h1>
        {/* Sửa lỗi cú pháp: candidate_id --> formData.candidate_id */}
        <p className="text-2xl">Mã UV: <span className="font-mono text-4xl">{formData.candidate_id}</span></p> 
      </div>

      {/* Nút Lưu + Xóa */}
      <div className="flex justify-end gap-6 mb-8">
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
        >
          XÓA ỨNG VIÊN
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`py-4 px-12 rounded-xl text-xl font-bold transition ${
            hasChanges
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Phễu tuyển dụng */}
      <section className="mb-12">
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Quy trình tuyển dụng</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
          {funnelSteps.map(step => (
            <div key={step.key} className="text-center group">
              {/* Sửa lỗi cú pháp: label lặp lại className */}
              <label className="block text-lg font-medium mb-3">{step.label}</label> 
              <div className={`w-full h-20 rounded-2xl border-4 flex items-center justify-center transition-all duration-300 ${
                formData[step.key as keyof Candidate]
                  ? 'bg-indigo-100 border-indigo-600 shadow-xl scale-110'
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={!!formData[step.key as keyof Candidate]} // Thêm as keyof Candidate
                  onChange={(e) => handleChange(step.key as keyof Candidate, e.target.checked)}
                  className="w-10 h-10 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Lý do thua */}
        {(formData.reject_offer || formData.unqualified) && (
          <div className="mt-10 p-8 bg-red-50 border-4 border-red-300 rounded-3xl"> 
            <h3 className="text-2xl font-bold text-red-800 mb-6">Lý do không thành công</h3>
            {formData.reject_offer && (
              <div>
                <label className="font-bold text-red-700">Từ chối offer:</label>
                <textarea
                  value={formData.reason_rejected_offer || ''}
                  onChange={(e) => handleChange('reason_rejected_offer', e.target.value)}
                  className="w-full mt-2 px-6 py-4 border-2 border-red-300 rounded-2xl text-lg"
                  rows={4}
                />
              </div>
            )}
            {formData.unqualified && (
              <div className="mt-6">
                <label className="font-bold text-red-700">Không đạt:</label>
                <textarea
                  value={formData.reason_unqualified || ''}
                  onChange={(e) => handleChange('reason_unqualified', e.target.value)}
                  className="w-full mt-2 px-6 py-4 border-2 border-red-300 rounded-2xl text-lg"
                  rows={4}
                />
              </div>
            )}
          </div>
        )}
      </section>
      
      {/* Bạn đã để trống các phần sau. Để hoàn thiện component, bạn cần thêm các section
        "Thông tin ứng tuyển", "Ngày quan trọng", "Thông tin cá nhân", "Nguồn gốc ứng viên" và "Thông tin hệ thống"
        vào đây, sử dụng `formData` và hàm `handleChange` đã định nghĩa.
        Tôi sẽ chỉ để lại các thẻ `div` trống để bạn điền vào. 
      */}

      {/* 1. Thông tin ứng tuyển */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin ứng tuyển</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-lg font-medium text-gray-700">Dự án / Khách hàng</label>
            <input
              type="text"
              value={formData.project || ''}
              onChange={(e) => handleChange('project', e.target.value)}
              className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
              placeholder="VD: VinFast Outsourcing"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Vị trí tuyển dụng</label>
            <input
              type="text"
              value={formData.position || ''}
              onChange={(e) => handleChange('position', e.target.value)}
              className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
              placeholder="Công nhân sản xuất"
            />
          </div>
        </div>
      </section>

      {/* 3. Ngày quan trọng */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Ngày quan trọng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700">Ngày phỏng vấn</label>
            <input
              type="date"
              value={formatDateToISO(formData.interview_date)}
              onChange={(e) => handleChange('interview_date', formatISOToDDMMYYYY(e.target.value))}
              className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Ngày nhận việc (Onboard)</label>
            <input
              type="date"
              value={formatDateToISO(formData.onboard_date)}
              onChange={(e) => handleChange('onboard_date', formatISOToDDMMYYYY(e.target.value))}
              className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
            />
          </div>
        </div>
      </section>

      {/* 4. Thông tin cá nhân */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin cá nhân</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700">Số điện thoại</label>
            <input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">CMND/CCCD</label>
            <input value={formData.id_card_number || ''} onChange={(e) => handleChange('id_card_number', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Ngày sinh</label>
            <input 
              type="date" 
              value={formatDateToISO(formData.date_of_birth)} 
              onChange={(e) => handleChange('date_of_birth', formatISOToDDMMYYYY(e.target.value))} 
              className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-lg font-medium text-gray-700">Địa chỉ</label>
            <input value={formData.address_street || ''} onChange={(e) => handleChange('address_street', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl mb-2 text-lg" placeholder="Đường..." />
            <div className="grid grid-cols-2 gap-4">
              <input value={formData.address_ward || ''} onChange={(e) => handleChange('address_ward', e.target.value)} className="px-5 py-3 border rounded-xl text-lg" placeholder="Phường/Xã" />
              <input value={formData.address_city || ''} onChange={(e) => handleChange('address_city', e.target.value)} className="px-5 py-3 border rounded-xl text-lg" placeholder="Tỉnh/Thành" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Nguồn gốc ứng viên (Read-Only) */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Nguồn gốc ứng viên</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700">Đơn vị tạo nguồn</label>
            <input value={formData.data_source_dept || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Nhóm nguồn</label>
            <input value={formData.data_source_type_group || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Nguồn cụ thể</label>
            <input value={formData.data_source_type || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
          </div>
        </div>
      </section>

      {/* 6. Thông tin hệ thống */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-lg font-medium text-gray-700">Ngày tạo</label>
            <input value={new Date(formData.created_at).toLocaleString('vi-VN')} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Người tạo</label>
            <input value={formData.created_by || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Cập nhật lần cuối</label>
            <input value={formData.last_updated_at ? new Date(formData.last_updated_at).toLocaleString('vi-VN') : '—'} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700">Người phụ trách</label>
            <input
              type="text"
              value={formData.assigned_user || ''}
              onChange={(e) => handleChange('assigned_user', e.target.value)}
              className="mt-2 w-full px-5 py-3 border rounded-xl font-medium text-lg"
              placeholder="Mã nhân viên phụ trách"
            />
          </div>
        </div>
      </section>

      {/* Footer / Nút Quay lại */}
      <div className="flex justify-start pt-10 border-t-2 border-gray-200">
        <button
          onClick={() => router.push('/candidates')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
        >
          ← Quay lại danh sách
        </button>
      </div>

    </div>
  );
}
