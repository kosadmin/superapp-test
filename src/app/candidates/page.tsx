'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

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
  [key: string]: any;
}

// --- UTILS FORMAT DATE ---
const formatDateToISO = (dateString: string | undefined): string => {
  if (!dateString) return '';
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
  const parts = dateString.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return '';
};

const formatISOToDDMMYYYY = (isoString: string): string => {
  if (!isoString) return '';
  const parts = isoString.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return '';
};

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();

  // Danh sách
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Chi tiết
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setListLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setCandidates(data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  const fetchDetail = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id ,user_group}),
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setOriginalData(data.data);
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

useEffect(() => {
  // 1. Nếu không có nội dung search, hiển thị toàn bộ danh sách gốc
  if (!search.trim()) {
    setCandidates(allCandidates);
    return;
  }

  const lowerSearch = search.toLowerCase().trim();

  // 2. Lọc an toàn
  const filtered = allCandidates.filter(c => {
    const nameMatch = c.candidate_name ? c.candidate_name.toLowerCase().includes(lowerSearch) : false;
    const phoneMatch = c.phone ? c.phone.includes(lowerSearch) : false;
    
    return nameMatch || phoneMatch;
  });

  setCandidates(filtered);
}, [search, allCandidates]);

  const handleChange = (field: keyof Candidate, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const handleSave = async () => {
    if (!formData || !hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: formData.candidate_id, updates: formData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Lưu thành công!');
        setOriginalData(formData);
        fetchAllCandidates(); // Cập nhật lại status ở bảng bên trái
      }
    } catch { alert('Lỗi kết nối'); }
    finally { setIsSaving(false); }
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center text-xl">Đang tải dữ liệu...</div>;

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
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      {/* --- CỘT TRÁI: DANH SÁCH --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[400px]' : 'w-full'}`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Quản lý Ứng viên</h1>
            <Link href="/dashboard" className="text-blue-500 hover:underline">← Dashboard</Link>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc SĐT..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Link href="/candidates/new" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">+ Thêm</Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 shadow-sm">
              <tr>
                <th className="p-3 border-b">Họ tên</th>
                {!selectedId && <th className="p-3 border-b">SĐT</th>}
                {!selectedId && <th className="p-3 border-b">Vị trí</th>}
                <th className="p-3 border-b text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer hover:bg-blue-50 border-b ${selectedId === cand.candidate_id ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-3 font-medium">
                    <div>{cand.candidate_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{cand.candidate_id}</div>
                  </td>
                  {!selectedId && <td className="p-3">{cand.phone}</td>}
                  {!selectedId && <td className="p-3">{cand.position || '—'}</td>}
                  <td className="p-3 text-center">
                    <StatusBadge cand={cand} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT ĐẦY ĐỦ --- */}
      <div className={`flex-1 flex flex-col bg-gray-100 transition-all duration-300 ${selectedId ? 'translate-x-0' : 'translate-x-full hidden'}`}>
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center text-lg">Đang tải chi tiết...</div>
        ) : formData && (
          <>
            {/* Header Toolbar */}
            <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded-full text-xl" title="Đóng">✕</button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{formData.candidate_name}</h2>
                  <p className="text-xs font-mono text-gray-500">Mã UV: {formData.candidate_id}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`px-6 py-2 rounded-lg font-bold shadow-md transition ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>

            {/* Scroll Area Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
              {/* PHỄU QUY TRÌNH */}
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quy trình tuyển dụng</h3>
                <div className="grid grid-cols-4 gap-3">
                  {funnelSteps.map(step => (
                    <label key={step.key} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData[step.key] ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                      <span className="text-[10px] mb-1">{step.label}</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={!!formData[step.key]} 
                        onChange={(e) => handleChange(step.key, e.target.checked)}
                      />
                    </label>
                  ))}
                </div>

                {/* Lý do thất bại */}
                {(formData.reject_offer || formData.unqualified) && (
                  <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 space-y-3">
                    {formData.reject_offer && (
                      <div>
                        <label className="text-xs font-bold text-red-700 uppercase">Lý do từ chối offer</label>
                        <textarea className="w-full mt-1 p-2 border rounded-lg text-sm" rows={2} value={formData.reason_rejected_offer || ''} onChange={(e) => handleChange('reason_rejected_offer', e.target.value)} />
                      </div>
                    )}
                    {formData.unqualified && (
                      <div>
                        <label className="text-xs font-bold text-red-700 uppercase">Lý do không đạt</label>
                        <textarea className="w-full mt-1 p-2 border rounded-lg text-sm" rows={2} value={formData.reason_unqualified || ''} onChange={(e) => handleChange('reason_unqualified', e.target.value)} />
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* THÔNG TIN TUYỂN DỤNG & NGÀY THÁNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                  <h3 className="font-bold text-blue-800 border-b pb-2">Thông tin ứng tuyển</h3>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Dự án / Khách hàng</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded-lg" value={formData.project || ''} onChange={(e) => handleChange('project', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Vị trí tuyển dụng</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded-lg" value={formData.position || ''} onChange={(e) => handleChange('position', e.target.value)} />
                  </div>
                </section>

                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                  <h3 className="font-bold text-blue-800 border-b pb-2">Ngày quan trọng</h3>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Ngày phỏng vấn</label>
                    <input type="date" className="w-full mt-1 p-2 border rounded-lg" value={formatDateToISO(formData.interview_date)} onChange={(e) => handleChange('interview_date', formatISOToDDMMYYYY(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Ngày nhận việc</label>
                    <input type="date" className="w-full mt-1 p-2 border rounded-lg" value={formatDateToISO(formData.onboard_date)} onChange={(e) => handleChange('onboard_date', formatISOToDDMMYYYY(e.target.value))} />
                  </div>
                </section>
              </div>

              {/* THÔNG TIN CÁ NHÂN */}
              <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-bold text-blue-800 border-b pb-2">Thông tin cá nhân</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Số điện thoại</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded-lg" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">CMND/CCCD</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded-lg" value={formData.id_card_number || ''} onChange={(e) => handleChange('id_card_number', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Ngày sinh</label>
                    <input type="date" className="w-full mt-1 p-2 border rounded-lg" value={formatDateToISO(formData.date_of_birth)} onChange={(e) => handleChange('date_of_birth', formatISOToDDMMYYYY(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Địa chỉ</label>
                  <input type="text" className="w-full mt-1 p-2 border rounded-lg mb-2" placeholder="Đường..." value={formData.address_street || ''} onChange={(e) => handleChange('address_street', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" className="p-2 border rounded-lg" placeholder="Phường/Xã" value={formData.address_ward || ''} onChange={(e) => handleChange('address_ward', e.target.value)} />
                    <input type="text" className="p-2 border rounded-lg" placeholder="Tỉnh/Thành" value={formData.address_city || ''} onChange={(e) => handleChange('address_city', e.target.value)} />
                  </div>
                </div>
              </section>

              {/* NGUỒN GỐC (READ-ONLY) */}
              <section className="bg-gray-50 p-5 rounded-2xl border border-dashed border-gray-300 space-y-4">
                <h3 className="font-bold text-gray-600 border-b pb-2">Nguồn gốc ứng viên</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Đơn vị nguồn</label>
                    <input readOnly className="w-full mt-1 p-2 bg-white border rounded-lg text-gray-500" value={formData.data_source_dept || ''} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nhóm nguồn</label>
                    <input readOnly className="w-full mt-1 p-2 bg-white border rounded-lg text-gray-500" value={formData.data_source_type_group || ''} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nguồn cụ thể</label>
                    <input readOnly className="w-full mt-1 p-2 bg-white border rounded-lg text-gray-500" value={formData.data_source_type || ''} />
                  </div>
                </div>
              </section>

              {/* HỆ THỐNG */}
              <section className="bg-gray-100 p-5 rounded-2xl space-y-4">
                <h3 className="font-bold text-gray-600 border-b border-gray-300 pb-2">Thông tin hệ thống</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                  <div>
                    <label className="font-bold text-gray-400 uppercase">Ngày tạo</label>
                    <div className="mt-1 p-2 bg-white rounded border">{new Date(formData.created_at).toLocaleString('vi-VN')}</div>
                  </div>
                  <div>
                    <label className="font-bold text-gray-400 uppercase">Người tạo</label>
                    <div className="mt-1 p-2 bg-white rounded border">{formData.created_by || '—'}</div>
                  </div>
                  <div>
                    <label className="font-bold text-gray-400 uppercase">Cập nhật cuối</label>
                    <div className="mt-1 p-2 bg-white rounded border">{formData.last_updated_at ? new Date(formData.last_updated_at).toLocaleString('vi-VN') : '—'}</div>
                  </div>
                  <div>
                    <label className="font-bold text-gray-400 uppercase">Người phụ trách</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded bg-white font-bold text-blue-700" value={formData.assigned_user || ''} onChange={(e) => handleChange('assigned_user', e.target.value)} />
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component hiển thị Badge trạng thái (Giữ nguyên logic màu sắc cũ)
function StatusBadge({ cand }: { cand: Candidate }) {
  if (cand.reject_offer) return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-[10px] font-bold">Từ chối Offer</span>;
  if (cand.unqualified) return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-[10px] font-bold">Không đạt</span>;
  if (cand.onboard) return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[10px] font-bold">Nhận việc</span>;
  if (cand.pass_interview) return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-[10px] font-bold">Đỗ PV</span>;
  if (cand.show_up_for_interview) return <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-[10px] font-bold">Tham gia PV</span>;
  if (cand.scheduled_for_interview) return <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-[10px] font-bold">Đăng ký PV</span>;
  if (cand.interested) return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[10px] font-bold">Quan tâm</span>;
  return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-[10px] font-medium">Mới</span>;
}

export default function CandidatesList() {
  return (
    <ProtectedRoute>
      <CandidatesContent />
    </ProtectedRoute>
  );
}
