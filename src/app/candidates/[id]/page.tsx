'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  id_card_number?: string;
  date_of_birth?: string;
  address_street?: string;
  address_ward?: string;
  address_city?: string;
  address_full?: string;
  project?: string;
  position?: string;
  company?: string;
  data_source_type?: string;
  contacted?: boolean;
  interested?: boolean;
  scheduled_for_interview?: boolean;
  show_up_for_interview?: boolean;
  pass_interview?: boolean;
  onboard?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  interview_date?: string;
  onboard_date?: string;
  reason_rejected_offer?: string;
  reason_unqualified?: string;
  created_at: string;
  created_by?: string;
  assigned_user?: string;
}

export default function CandidateDetail() {
  const {id} = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCandidate(data.data);
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

  // Hàm lưu tự động khi thay đổi bất kỳ field nào
  const saveUpdate = async (updates: Partial<Candidate>) => {
    if (!candidate || saving) return;
    setSaving(true);

    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: candidate.candidate_id,
          updates,
        }),
      });
      setCandidate(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      alert('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa ứng viên này? Hành động không thể hoàn tác!')) return;

    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      alert('Đã xóa thành công');
      router.push('/candidates');
    } catch (err) {
      alert('Lỗi khi xóa');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Đang tải...</div>;
  if (!candidate) return null;

  const statusSteps = [
    { key: 'contacted', label: 'Đã liên hệ', color: 'blue' },
    { key: 'interested', label: 'Quan tâm', color: 'yellow' },
    { key: 'scheduled_for_interview', label: 'Đặt lịch PV', color: 'purple' },
    { key: 'show_up_for_interview', label: 'Đi phỏng vấn', color: 'orange' },
    { key: 'pass_interview', label: 'Pass PV', color: 'emerald' },
    { key: 'onboard', label: 'Onboard', color: 'green' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <h1 className="text-4xl font-bold mb-2">{candidate.candidate_name}</h1>
          <p className="text-xl opacity-90">Mã ứng viên: {candidate.candidate_id}</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Thông tin cơ bản */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">Số điện thoại</label>
                <input
                  type="text"
                  value={candidate.phone}
                  onChange={(e) => saveUpdate({ phone: e.target.value })}
                  className="mt-1 w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">CMND/CCCD</label>
                <input
                  type="text"
                  value={candidate.id_card_number || ''}
                  onChange={(e) => saveUpdate({ id_card_number: e.target.value })}
                  className="mt-1 w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Ngày sinh</label>
                <input
                  type="date"
                  value={candidate.date_of_birth || ''}
                  onChange={(e) => saveUpdate({ date_of_birth: e.target.value })}
                  className="mt-1 w-full px-4 py-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Địa chỉ</label>
                <input
                  type="text"
                  value={candidate.address_full || ''}
                  onChange={(e) => saveUpdate({ address_full: e.target.value })}
                  className="mt-1 w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Phễu tuyển dụng */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Quy trình tuyển dụng</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {statusSteps.map((step) => (
                <label
                  key={step.key}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${
                    candidate[step.key as keyof Candidate]
                      ? `bg-${step.color}-100 border-${step.color}-500`
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!candidate[step.key as keyof Candidate]}
                    onChange={(e) => saveUpdate({ [step.key]: e.target.checked })}
                    className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-4 text-lg font-medium">{step.label}</span>
                </label>
              ))}
            </div>

            {/* Lý do thua */}
            {(candidate.reject_offer || candidate.unqualified) && (
              <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
                <h3 className="text-xl font-bold text-red-800 mb-4">Lý do không thành công</h3>
                {candidate.reject_offer && (
                  <div className="mb-4">
                    <label className="font-medium">Từ chối offer:</label>
                    <textarea
                      value={candidate.reason_rejected_offer || ''}
                      onChange={(e) => saveUpdate({ reason_rejected_offer: e.target.value })}
                      className="mt-2 w-full px-4 py-3 border rounded-lg"
                      rows={3}
                    />
                  </div>
                )}
                {candidate.unqualified && (
                  <div>
                    <label className="font-medium">Không đủ điều kiện:</label>
                    <textarea
                      value={candidate.reason_unqualified || ''}
                      onChange={(e) => saveUpdate({ reason_unqualified: e.target.value })}
                      className="mt-2 w-full px-4 py-3 border rounded-lg"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Nút hành động */}
          <div className="flex justify-between items-center pt-8 border-t">
            <button
              onClick={() => router.push('/candidates')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
            >
              ← Quay lại danh sách
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
            >
              XÓA ỨNG VIÊN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
