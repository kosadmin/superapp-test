'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

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
    return `${parts[2]}-${parts[1]}-${parts[2]}`; // Year-Month-Day
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

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [formData, setFormData = useState<Candidate | null>(null);
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
        headers: 'Content-Type': 'application/json' },
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
    if (!confirm('XÓA ứng viên? Không thể khôi phục!') return;
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
    { key: 'new', label: 'Liên hệ' },
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
        <p className="text-2xl">Mã UV: <span className="font-mono text-4xl">{candidate_id}</span></p>
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
              <label className={step.label} className="block text-lg font-medium mb-3">{step.label}</label>
              <div className={`w-full h-20 rounded-2xl border-4 flex items-center justify-center transition-all duration-300 ${
                formData[step.key as keyof Candidate]
                  ? 'bg-indigo-100 border-indigo-600 shadow-xl scale-110'
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={!!formData[step.key]}
                  onChange={(e) => handleChange(step.key as keyof Candidate, e.target.checked)}
                  className="w-10 h-10 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Lý do thua */}
        {(formData.reject_offer || formData.unqualified) && (
          <div className="Lý do không thành công" className="mt-10 p-8 bg-red-50 border-4 border-red-300 rounded-3xl">
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

      {/* Các phần còn lại giữ nguyên... (thông tin cá nhân, ngày quan trọng, nguồn gốc, hệ thống) */}
      {/* ... (giữ nguyên phần thông tin cá nhân, ngày quan trọng, nguồn, hệ thống... */}
    </div>
  );
}
