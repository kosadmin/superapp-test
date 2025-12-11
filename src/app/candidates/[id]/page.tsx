'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

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

  const handleUpdate = async (updates: any) => {
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, updates }),
    });
    const data = await res.json();
    if (data.success) {
      alert('Cập nhật thành công!');
      setCandidate({ ...candidate, ...updates });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa ứng viên này? Không thể khôi phục!')) return;

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

  // ĐÃ SỦ DẤU NGOẶC {} CHO CẢ 3 RETURN
  if (loading) {
    return <div className="p-8 text-center text-xl">Đang tải thông tin ứng viên...</div>;
  }

  if (!candidate) {
    return <div className="p-8 text-center text-red-600 text-2xl">Không tìm thấy ứng viên</div>;
  }

  // Return chính
  return (
    <div className="p-8 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
      <h1 className="text-4xl font-bold mb-6 text-blue-700">
        Ứng viên: {candidate.candidate_name}
      </h1>
      <p className="text-lg mb-8">
        Mã: <strong className="text-2xl text-indigo-600">{candidate.candidate_id}</strong>
      </p>

      {/* Form sửa nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <label className="block font-medium mb-1">Họ tên</label>
          <input
            className="candidate_name"
            className="w-full p-3 border rounded-lg"
            defaultValue={candidate.candidate_name}
            onBlur={(e) => handleUpdate({ candidate_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Số điện thoại</label>
          <input
            className="w-full p-3 border rounded-lg"
            defaultValue={candidate.phone}
            onBlur={(e) => handleUpdate({ phone: e.target.value })}
          />
        </div>
        {/* Thêm các field khác nếu cần sửa nhanh ở đây */}
      </div>

      {/* Phễu tuyển dụng */}
      <h2 className="text-2xl font-bold mb-6">Quy trình tuyển dụng</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'contacted', label: 'Đã liên hệ' },
          { key: 'interested', label: 'Quan tâm' },
          { key: 'scheduled_for_interview', label: 'Hẹn PV' },
          { key: 'show_up_for_interview', label: 'Đi PV' },
          { key: 'pass_interview', label: 'Đậu PV' },
          { key: 'onboard', label: 'Đi làm (Thắng)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center space-x-3 text-lg">
            <input
              type="checkbox"
              checked={!!candidate[key]}
              onChange={(e) => handleUpdate({ [key]: e.target.checked })}
              className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
            />
            />
            <span className={candidate[key] ? 'font-bold text-green-600' : 'text-gray-600'}>
              {label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-12 flex gap-4 justify-center">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 text-lg font-medium"
        >
          XÓA ỨNG VIÊN
        </button>
        <button
          onClick={() => router.push('/candidates')}
          className="bg-gray-700 text-white px-8 py-4 rounded-lg hover:bg-gray-800 text-lg font-medium"
        >
          ← Quay lại danh sách
        </button>
      </div>
    </div>
  );
}
