'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

export default function CandidateDetail() {
  const { id } = useParams() as { id: string };
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', id }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setCandidate(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ĐÃ FIX: thêm kiểu cho tham số
  const handleUpdate = async (updates: any) => {
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, updates }),
    });
    const data = await res.json();
    if (data.success) {
      alert('Cập nhật thành công!');
      // Cập nhật lại state
      setCandidate({ ...candidate, ...updates });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa ứng viên này?')) return;

    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/candidates');
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải thông tin ứng viên...</div>;
  if (!candidate) return <div className="p-8 text-center text-red-600">Không tìm thấy ứng viên</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ứng viên: {candidate.candidate_name}</h1>
      <p className="text-lg mb-8">Mã: <strong>{candidate.candidate_id}</strong></p>

      {/* Ví dụ form đơn giản để sửa */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <input
          className="p-2 border rounded"
          placeholder="Tên"
          defaultValue={candidate.candidate_name}
          onBlur={(e) => handleUpdate({ candidate_name: e.target.value })}
        />
        <input
          className="p-2 border rounded"
          placeholder="SĐT"
          defaultValue={candidate.phone}
          onBlur={(e) => handleUpdate({ phone: e.target.value })}
        />
        {/* Thêm các field khác tương tự */}
      </div>

      {/* Các bước phễu */}
      <h2 className="text-2xl mb-4">Quy trình tuyển dụng</h2>
      <div className="space-y-3">
        {['contacted', 'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard'].map(step) => {
          const label = {
            contacted: 'Đã liên hệ',
            interested: 'Quan tâm',
            scheduled_for_interview: 'Hẹn phỏng vấn',
            show_up_for_interview: 'Đi phỏng vấn',
            pass_interview: 'Đậu phỏng vấn',
            onboard: 'Đi làm'
          }[step];

          return (
            <label key={step} className="flex items-center text-lg">
              <input
                type="checkbox"
                checked={!!candidate[step]}
                onChange={(e) => handleUpdate({ [step]: e.target.checked })}
                className="mr-3 w-5 h-5"
              />
              <span className={candidate[step] ? 'text-green-600 font-medium' : ''}>
                {label}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
        >
          Xóa ứng viên
        </button>
        <button
          onClick={() => router.push('/candidates')}
          className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
      </div>
    </div>
  );
}
