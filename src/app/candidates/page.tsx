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
  // ... (các fields khác giữ nguyên)
  [key: string]: any;
}

// --- UTILS FORMAT DATE (Giữ nguyên) ---
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
        body: JSON.stringify({ 
            action: 'list', 
            sort: 'newest', // Thêm sort giống bản gốc
            user_group, 
            user_id 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setCandidates(data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

  // --- CẬP NHẬT: LOGIC TÌM KIẾM GIỐNG BẢN GỐC ---
  useEffect(() => {
    if (!search.trim()) {
      setCandidates(allCandidates);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = allCandidates.filter(cand => {
      return (
        cand.candidate_name.toLowerCase().includes(lowerSearch) ||
        cand.phone.includes(search)
      );
    });
    setCandidates(filtered);
  }, [search, allCandidates]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  // ----------------------------------------------

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
        fetchAllCandidates();
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
              placeholder="Tìm theo tên hoặc số điện thoại..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={handleSearch} // Sử dụng hàm handleSearch
            />
            <Link href="/candidates/new" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">+ Thêm</Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {candidates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'Không tìm thấy ứng viên nào' : 'Chưa có ứng viên nào'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
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
          )}
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT ĐẦY ĐỦ (Giữ nguyên) --- */}
      <div className={`flex-1 flex flex-col bg-gray-100 transition-all duration-300 ${selectedId ? 'translate-x-0' : 'translate-x-full hidden'}`}>
         {/* ... (Phần UI detail giữ nguyên như code bạn gửi) ... */}
         {detailLoading ? (
          <div className="flex-1 flex items-center justify-center text-lg">Đang tải chi tiết...</div>
        ) : formData && (
          <>
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
            {/* ... rest of detail UI ... */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
                {/* Sao chép toàn bộ các section từ code cũ của bạn vào đây */}
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
                </section>
                {/* Thêm các section: Thông tin ứng tuyển, Ngày quan trọng, Thông tin cá nhân... */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Badge Status (Giữ nguyên logic màu sắc của bạn)
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
