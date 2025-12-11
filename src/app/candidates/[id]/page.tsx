'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  project?: string;
  position?: string;
  id_card_number?: string;
  date_of_birth?: string;
  birth_year?: number;
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
  created_at: string;
  created_by?: string;
  last_updated_at?: string;
  assigned_user?: string;
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
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

  const saveUpdate = async (updates: Partial<Candidate>) => {
    if (!candidate || saving) return;
    setSaving(true);
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: candidate.candidate_id, updates }),
      });
      setCandidate(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      alert('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('XÓA ỨNG VIÊN NÀY? Không thể hoàn tác!')) return;
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

  const steps = [
    { key: 'contacted', label: 'Mới', icon: 'circle', color: 'gray' },
    { key: 'interested', label: 'Quan tâm', icon: 'phone', color: 'amber' },
    { key: 'scheduled_for_interview', label: 'Đặt lịch PV', icon: 'calendar', color: 'sky' },
    { key: 'show_up_for_interview', label: 'Đi PV', icon: 'user-check', color: 'cyan' },
    { key: 'pass_interview', label: 'Đỗ PV', icon: 'check-circle', color: 'indigo' },
    { key: 'onboard', label: 'Nhận việc', icon: 'briefcase', color: 'emerald' },
    { key: 'reject_offer', label: 'Từ chối', icon: 'x-circle', color: 'red' },
    { key: 'unqualified', label: 'Không đạt', icon: 'x-circle', color: 'red' },
  ];

  const currentStepIndex = steps.reduce((max, step, idx) => 
    (candidate[step.key as keyof Candidate] ? idx : max), -1
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 text-center">
          <h1 className="text-5xl font-bold mb-3">{candidate.candidate_name}</h1>
          <p className="text-2xl opacity-90">Mã ứng viên: {candidate.candidate_id}</p>
        </div>

        <div className="p-10 space-y-10">

          {/* 1. Thông tin ứng tuyển */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2 inline-block">
              Thông tin ứng tuyển
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg">
              <div>
                <span className="font-medium text-gray-600">Dự án / Khách hàng:</span>
                <p className="mt-1 text-xl font-semibold text-blue-700">{candidate.project || '—'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Vị trí tuyển dụng:</span>
                <p className="mt-1 text-xl font-semibold text-indigo-700">{candidate.position || '—'}</p>
              </div>
            </div>
          </section>

          {/* 2. Phễu tuyển dụng – 1 hàng ngang đẹp lung linh */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-green-600 pb-2 inline-block">
              Quy trình tuyển dụng
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isFailed = step.key === 'reject_offer' || step.key === 'unqualified';
                const isCurrent = idx === currentStepIndex && isFailed ? false : idx === currentStepIndex;

                return (
                  <label
                    key={step.key}
                    className={`
                      flex items-center gap-3 px-6 py-4 rounded-2xl border-4 font-bold text-lg cursor-pointer transition-all
                      ${isActive && !isFailed ? `bg-${step.color}-100 border-${step.color}-600 text-${step.color}-900 shadow-lg scale-105` : ''}
                      ${isFailed && candidate[step.key as keyof Candidate] ? 'bg-red-100 border-red-600 text-red-900 shadow-lg' : ''}
                      ${!isActive ? 'bg-gray-50 border-gray-300 text-gray-500' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={!!candidate[step.key as keyof Candidate]}
                      onChange={(e) => saveUpdate({ [step.key]: e.target.checked })}
                      className="w-6 h-6 rounded"
                    />
                    <span>{step.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Lý do thất bại */}
            {(candidate.reject_offer || candidate.unqualified) && (
              <div className="mt-8 p-8 bg-red-50 border-2 border-red-300 rounded-2xl">
                <h3 className="text-2xl font-bold text-red-800 mb-6">Lý do không thành công</h3>
                {candidate.reject_offer && (
                  <div className="mb-4">
                    <label className="font-semibold text-red-700">Từ chối offer:</label>
                    <textarea
                      value={candidate.reason_rejected_offer || ''}
                      onChange={(e) => saveUpdate({ reason_rejected_offer: e.target.value })}
                      className="mt-2 w-full px-5 py-3 border-2 border-red-300 rounded-xl"
                      rows={3}
                      placeholder="Ghi rõ lý do..."
                    />
                  </div>
                )}
                {candidate.unqualified && (
                  <div>
                    <label className="font-semibold text-red-700">Không đủ điều kiện:</label>
                    <textarea
                      value={candidate.reason_unqualified || ''}
                      onChange={(e) => saveUpdate({ reason_unqualified: e.target.value })}
                      className="mt-2 w-full px-5 py-3 border-2 border-red-300 rounded-xl"
                      rows={3}
                      placeholder="Ghi rõ lý do..."
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 3. Thông tin ứng viên */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-purple-600 pb-2 inline-block">
              Thông tin cá nhân
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><span className="font-medium text-gray-600">SĐT:</span> <strong>{candidate.phone}</strong></div>
              <div><span className="font-medium text-gray-600">CMND/CCCD:</span> <strong>{candidate.id_card_number || '—'}</strong></div>
              <div><span className="font-medium text-gray-600">Ngày sinh:</span> <strong>{candidate.date_of_birth || '—'}</strong></div>
              <div><span className="font-medium text-gray-600">Năm sinh:</span> <strong>{candidate.birth_year || '—'}</strong></div>
              <div className="col-span-1 md:col-span-3">
                <span className="font-medium text-gray-600">Địa chỉ:</span>
                <p className="mt-1 font-semibold">
                  {candidate.address_street} - {candidate.address_ward} - {candidate.address_city}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Nguồn gốc ứng viên */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-orange-600 pb-2 inline-block">
              Nguồn ứng viên
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><span className="font-medium text-gray-600">Đơn vị tạo nguồn:</span> <strong>{candidate.data_source_dept || '—'}</strong></div>
              <div><span className="font-medium text-gray-600">Loại nguồn:</span> <strong>{candidate.data_source_type_group || '—'}</strong></div>
              <div><span className="font-medium text-gray-600">Nguồn cụ thể:</span> <strong>{candidate.data_source_type || '—'}</strong></div>
            </div>
          </section>

          {/* 5. Thông tin hệ thống */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-gray-600 pb-2 inline-block">
              Thông tin hệ thống
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-lg">
              <div><span className="font-medium text-gray-600">Tạo lúc:</span> <strong>{new Date(candidate.created_at).toLocaleString('vi-VN')}</strong></div>
              <div><span className="font-medium text-gray-600">Người tạo:</span> <strong>{candidate.created_by || '—'}</strong></div>
              <div><span className="font-medium text-gray-600">Cập nhật:</span> <strong>{candidate.last_updated_at ? new Date(candidate.last_updated_at).toLocaleString('vi-VN') : '—'}</strong></div>
              <div>
                <span className="font-medium text-gray-600">Phụ trách:</span>
                <input
                  type="text"
                  value={candidate.assigned_user || ''}
                  onChange={(e) => saveUpdate({ assigned_user: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border rounded-lg font-bold text-blue-700"
                  placeholder="Mã nhân viên phụ trách"
                />
              </div>
            </div>
          </section>

          {/* Nút hành động */}
          <div className="flex justify-between items-center pt-10 border-t-2 border-gray-200">
            <button
              onClick={() => router.push('/candidates')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
            >
              ← Quay lại danh sách
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
            >
              XÓA ỨNG VIÊN
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
