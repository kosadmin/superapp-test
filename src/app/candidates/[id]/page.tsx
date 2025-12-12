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
  contacted?: boolean;
  interested?: boolean;
  scheduled_for_interview?: boolean;
  show_up_for_interview?: boolean;
  pass_interview?: boolean;
  onboard?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  reason_rejected_offer?: string;
  reason_unqualified?: string;
  interview_date?: string;
  onboard_date?: string;
  created_at: string;
  created_by?: string;
  last_updated_at?: string;
  assigned_user?: string;
}

// Chuyển DD/MM/YYYY → YYYY-MM-DD cho input date
const toISODate = (dateStr?: string) => {
  if (!dateStr) return '';
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

// Chuyển YYYY-MM-DD → DD/MM/YYYY để lưu
const toDDMMYYYY = (isoStr: string) => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [original, setOriginal] = useState<Candidate | null>(null);   // dữ liệu gốc
  const [edited, setEdited] = useState<Candidate | null>(null);       // dữ liệu đang chỉnh
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lấy dữ liệu khi vào trang
  useEffect(() => {
    if (!id) return;
    const fetchCandidate = async () => {
      try {
        const res = await fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', id }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOriginal(data.data);
          setEdited(data.data);
        } else {
          alert('Không tìm thấy ứng viên');
          router.push('/candidates');
        }
      } catch (err) {
        alert('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id, router]);

  // Hàm lưu toàn bộ thay đổi
  const handleSave = async () => {
    if (!edited || !original) return;
    setSaving(true);

    // Tính toán những field nào thay đổi
    const updates: Partial<Candidate> = {};
    (Object.keys(edited) as (keyof Candidate)[]).forEach(key => {
      if (edited[key] !== original[key]) {
        updates[key] = edited[key] as any;
      }
    });

    if (Object.keys(updates).length === 0) {
      alert('Không có thay đổi nào để lưu');
      setSaving(false);
      return;
    }

    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: edited.candidate_id,
          updates,
        }),
      });
      alert('Đã lưu thành công!');
      setOriginal(edited); // cập nhật dữ liệu gốc
    } catch (err) {
      alert('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // Hủy bỏ thay đổi
  const handleCancel = () => {
    setEdited(original);
  };

  const handleDelete = async () => {
    if (!confirm('XÓA ứng viên này? Không thể hoàn tác!')) return;
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      alert('Đã xóa thành công!');
      router.push('/candidates');
    } catch (err) {
      alert('Lỗi khi xóa');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Đang tải...</div>;
  if (!edited) return null;

  const funnelSteps = [
    { key: 'contacted', label: 'Liên hệ' },
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
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 text-center">
          <h1 className="text-5xl font-bold mb-3">{edited.candidate_name}</h1>
          <p className="text-2xl opacity-95">Mã ứng viên: <span className="font-mono text-3xl">{edited.candidate_id}</span></p>
        </div>

        <div className="p-10 space-y-10">

          {/* Các section thông tin */}
          {/* ... (giữ nguyên phần hiển thị như cũ, chỉ đổi onChange để cập nhật edited) */}
          {/* Ví dụ một field: */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin ứng tuyển</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700">Dự án / Khách hàng</label>
                <input
                  type="text"
                  value={edited.project || ''}
                  onChange={(e) => setEdited(prev => prev ? { ...prev, project: e.target.value } : null)}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                />
              </div>
              {/* Các input khác cũng đổi tương tự: onChange cập nhật setEdited */}
              {/* ... */}
            </div>
          </section>

          {/* Phễu tuyển dụng */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-indigo-200 pb-3">Quy trình tuyển dụng</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {funnelSteps.map((step) => (
                <div key={step.key} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{step.label}</label>
                  <div className={`w-full h-16 rounded-xl border-4 flex items-center justify-center transition-all ${
                    edited[step.key as keyof Candidate]
                      ? 'bg-indigo-100 border-indigo-600 shadow-lg scale-105'
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={!!edited[step.key as keyof Candidate]}
                      onChange={(e) => setEdited(prev => prev ? { ...prev, [step.key]: e.target.checked } : null)}
                      className="w-8 h-8 text-blue-600 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Các section khác giữ nguyên, chỉ đổi onChange → setEdited */}

          {/* NÚT LƯU + HỦY */}
          <div className="flex justify-center gap-6 pt-10 border-t-2 border-gray-200">
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-12 rounded-xl text-xl transition"
            >
              HỦY
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-16 rounded-xl text-xl transition disabled:opacity-70"
            >
              {saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-xl text-xl transition"
            >
              XÓA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
