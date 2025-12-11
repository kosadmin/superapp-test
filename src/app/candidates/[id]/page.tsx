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
  date_of_birth?: string; // Định dạng từ API: DD/MM/YYYY
  birth_year?: number;
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
}

// HÀM CHUYỂN ĐỔI FORMAT NGÀY THÁNG
const formatDateToISO = (dateString: string | undefined): string => {
  if (!dateString) return '';
  // Kiểm tra nếu nó đã là YYYY-MM-DD (format ISO)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  // Chuyển đổi từ DD/MM/YYYY sang YYYY-MM-DD
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // parts[0] = Day, parts[1] = Month, parts[2] = Year
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
};

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
    if (!confirm('XÓA ứng viên này? Không thể khôi phục!')) return;
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

  const funnelSteps = [
    { key: 'new', label: 'Liên hệ', color: 'blue' },
    { key: 'interested', label: 'Quan tâm', color: 'yellow' },
    { key: 'scheduled_for_interview', label: 'Đặt PV', color: 'purple' },
    { key: 'show_up_for_interview', label: 'Đi PV', color: 'orange' },
    { key: 'pass_interview', label: 'Đỗ PV', color: 'emerald' },
    { key: 'onboard', label: 'Nhận việc', color: 'green' },
    { key: 'reject_offer', label: 'Từ chối offer', color: 'red' },
    { key: 'unqualified', label: 'Không đạt', color: 'red' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 text-center">
          <h1 className="text-5xl font-bold mb-3">{candidate.candidate_name}</h1>
          <p className="text-2xl opacity-95">Mã ứng viên: <span className="font-mono text-3xl">{candidate.candidate_id}</span></p>
        </div>

        <div className="p-10 space-y-10">

          {/* 1. Thông tin ứng tuyển */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin ứng tuyển</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700">Dự án / Khách hàng</label>
                <input
                  type="text"
                  value={candidate.project || ''}
                  onChange={(e) => saveUpdate({ project: e.target.value })}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                  placeholder="VD: VinFast Outsourcing"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Vị trí tuyển dụng</label>
                <input
                  type="text"
                  value={candidate.position || ''}
                  onChange={(e) => saveUpdate({ position: e.target.value })}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                  placeholder="Công nhân sản xuất"
                />
              </div>
            </div>
          </section>

          {/* 2. Phễu tuyển dụng - 8 bước dàn đều 1 hàng */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-indigo-200 pb-3">Quy trình tuyển dụng</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {funnelSteps.map((step) => (
                <div key={step.key} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{step.label}</label>
                  <div className={`w-full h-16 rounded-xl border-4 flex items-center justify-center transition-all ${
                    candidate[step.key as keyof Candidate]
                      ? `bg-${step.color}-100 border-${step.color}-600 shadow-lg scale-105`
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={!!candidate[step.key as keyof Candidate]}
                      onChange={(e) => saveUpdate({ [step.key]: e.target.checked })}
                      className="w-8 h-8 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Lý do thua nếu có */}
            {(candidate.reject_offer || candidate.unqualified) && (
              <div className="mt-8 p-6 bg-red-50 border-2 border-red-300 rounded-2xl">
                <h3 className="text-xl font-bold text-red-800 mb-4">Lý do không thành công</h3>
                {candidate.reject_offer && (
                  <div>
                    <label className="font-medium text-red-700">Từ chối offer:</label>
                    <textarea
                      value={candidate.reason_rejected_offer || ''}
                      onChange={(e) => saveUpdate({ reason_rejected_offer: e.target.value })}
                      className="mt-2 w-full px-4 py-3 border border-red-300 rounded-lg"
                      rows={3}
                      placeholder="Lý do từ chối..."
                    />
                  </div>
                )}
                {candidate.unqualified && (
                  <div className="mt-4">
                    <label className="font-medium text-red-700">Không đạt:</label>
                    <textarea
                      value={candidate.reason_unqualified || ''}
                      onChange={(e) => saveUpdate({ reason_unqualified: e.target.value })}
                      className="mt-2 w-full px-4 py-3 border border-red-300 rounded-lg"
                      rows={3}
                      placeholder="Lý do không đạt..."
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 3. Thông tin ứng viên */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin ứng viên</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Số điện thoại</label>
                <input value={candidate.phone} onChange={(e) => saveUpdate({ phone: e.target.value })} className="mt-2 w-full px-5 py-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">CMND/CCCD</label>
                <input value={candidate.id_card_number || ''} onChange={(e) => saveUpdate({ id_card_number: e.target.value })} className="mt-2 w-full px-5 py-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Ngày sinh</label>
                {/* ĐÃ SỬA: Dùng formatDateToISO để chuyển đổi định dạng ngày tháng */}
                <input 
                  type="date" 
                  value={formatDateToISO(candidate.date_of_birth)} 
                  onChange={(e) => {
                    // Khi người dùng thay đổi, bạn có thể lưu lại giá trị YYYY-MM-DD
                    // và xử lý việc chuyển đổi ngược lại (nếu API backend yêu cầu DD/MM/YYYY để lưu)
                    // Ở đây, tôi giả định API có thể chấp nhận YYYY-MM-DD hoặc bạn cần chuyển đổi trước khi gọi saveUpdate.
                    // Nếu API backend chỉ chấp nhận DD/MM/YYYY, bạn cần chuyển đổi e.target.value về DD/MM/YYYY:
                    const [year, month, day] = e.target.value.split('-');
                    const newDate = day && month && year ? `${day}/${month}/${year}` : '';
                    saveUpdate({ date_of_birth: newDate });
                  }} 
                  className="mt-2 w-full px-5 py-3 border rounded-xl" 
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Năm sinh</label>
                <input value={candidate.birth_year || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 border rounded-xl" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-lg font-medium text-gray-700">Địa chỉ</label>
                <input value={candidate.address_street || ''} onChange={(e) => saveUpdate({ address_street: e.target.value })} className="mt-2 w-full px-5 py-3 border rounded-xl mb-2" placeholder="Đường..." />
                <div className="grid grid-cols-2 gap-4">
                  <input value={candidate.address_ward || ''} onChange={(e) => saveUpdate({ address_ward: e.target.value })} className="px-5 py-3 border rounded-xl" placeholder="Phường/Xã" />
                  <input value={candidate.address_city || ''} onChange={(e) => saveUpdate({ address_city: e.target.value })} className="px-5 py-3 border rounded-xl" placeholder="Tỉnh/Thành" />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Nguồn gốc ứng viên */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Nguồn gốc ứng viên</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Đơn vị tạo nguồn</label>
                <input value={candidate.data_source_dept || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Nhóm nguồn</label>
                <input value={candidate.data_source_type_group || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Nguồn cụ thể</label>
                <input value={candidate.data_source_type || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl" />
              </div>
            </div>
          </section>

          {/* 5. Thông tin hệ thống */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600">Ngày tạo</label>
                <input value={new Date(candidate.created_at).toLocaleString('vi-VN')} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Người tạo</label>
                <input value={candidate.created_by || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Cập nhật lần cuối</label>
                <input value={candidate.last_updated_at ? new Date(candidate.last_updated_at).toLocaleString('vi-VN') : '—'} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Người phụ trách</label>
                <input
                  type="text"
                  value={candidate.assigned_user || ''}
                  onChange={(e) => saveUpdate({ assigned_user: e.target.value })}
                  className="mt-2 w-full px-5 py-3 border rounded-xl font-medium"
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
