'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';
const ITEMS_PER_PAGE = 50;

// --- CẤU HÌNH CỘT MẶC ĐỊNH ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'candidate_name', label: 'Họ tên', width: 200, visible: true },
  { id: 'status', label: 'Trạng thái', width: 120, visible: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true },
  { id: 'project', label: 'Dự án', width: 150, visible: true },
  { id: 'position', label: 'Vị trí', width: 150, visible: true },
  { id: 'interview_date', label: 'Ngày PV', width: 110, visible: true },
  { id: 'onboard_date', label: 'Ngày Onboard', width: 110, visible: true },
  { id: 'company', label: 'Công ty', width: 150, visible: true },
  { id: 'id_card_number', label: 'CCCD', width: 130, visible: true },
  { id: 'date_of_birth', label: 'Ngày sinh', width: 100, visible: true },
  { id: 'address_full', label: 'Địa chỉ', width: 250, visible: true },
  { id: 'data_source_type', label: 'Nguồn', width: 100, visible: true },
  { id: 'assigned_user_name', label: 'Người phụ trách', width: 150, visible: true },
];

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  [key: string]: any;
}

// --- UTILS ---
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
  
  // States Danh sách
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // States Tùy chỉnh View
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // States Chi tiết (Phần bạn cần giữ lại)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load Settings
  useEffect(() => {
    const savedCols = localStorage.getItem('table_config_v2');
    const savedFrozen = localStorage.getItem('table_frozen_v2');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  const saveConfig = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('table_config_v2', JSON.stringify(newCols));
    localStorage.setItem('table_frozen_v2', newFrozen.toString());
  };

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setListLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', sort: 'newest', user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setFilteredCandidates(data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase().trim();
    const filtered = allCandidates.filter(cand => 
      cand.candidate_name.toLowerCase().includes(lowerSearch) ||
      cand.phone.includes(search) ||
      cand.candidate_id.toLowerCase().includes(lowerSearch)
    );
    setFilteredCandidates(filtered);
    setCurrentPage(1);
  }, [search, allCandidates]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);

  // --- LOGIC CHI TIẾT (COPIED TỪ CODE CŨ CỦA BẠN) ---
  const fetchDetail = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id, user_group }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setOriginalData(data.data);
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!formData) return;
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

  const funnelSteps = [
    { key: 'new', label: 'Mới' },
    { key: 'interested', label: 'Quan tâm' },
    { key: 'scheduled_for_interview', label: 'Đặt PV' },
    { key: 'show_up_for_interview', label: 'Đi PV' },
    { key: 'pass_interview', label: 'Đỗ PV' },
    { key: 'onboard', label: 'Nhận việc' },
    { key: 'reject_offer', label: 'Từ chối' },
    { key: 'unqualified', label: 'Không đạt' },
  ];

  // Helper cho Sticky Column
  const getFrozenStyle = (index: number) => {
    if (index >= frozenCount) return {};
    let leftOffset = 0;
    for (let i = 0; i < index; i++) {
      if (columns[i].visible) leftOffset += columns[i].width;
    }
    return { position: 'sticky' as const, left: leftOffset, zIndex: 20 };
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      
      {/* --- CỘT TRÁI: DANH SÁCH --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[350px]' : 'w-full'}`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Ứng viên ({filteredCandidates.length})</h1>
            <div className="flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 border rounded bg-gray-50 hover:bg-gray-100">⚙️</button>
                <Link href="/dashboard" className="p-2 text-blue-500 hover:underline">← Dashboard</Link>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm tên, SĐT..."
              className="flex-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* NÚT THÊM MỚI ĐÃ QUAY TRỞ LẠI */}
            <Link href="/candidates/new" className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700">+ Thêm</Link>
          </div>
        </div>

        {/* TABLE AREA */}
        <div className="flex-1 overflow-auto relative border-b">
          <table className="text-left border-separate border-spacing-0" style={{ width: 'max-content' }}>
            <thead className="bg-gray-50 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th key={col.id} style={{ width: col.width, minWidth: col.width, ...getFrozenStyle(idx) }} className="p-3 border-b border-r text-[10px] uppercase text-gray-500 bg-gray-50 font-bold">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((cand) => (
                <tr key={cand.candidate_id} onClick={() => fetchDetail(cand.candidate_id)} className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-50' : ''}`}>
                  {columns.map((col, idx) => col.visible && (
                    <td key={col.id} style={{ ...getFrozenStyle(idx) }} className={`p-3 border-b border-r whitespace-nowrap overflow-hidden bg-inherit`}>
                      {col.id === 'status' ? <StatusBadge cand={cand} /> : 
                       col.id === 'candidate_name' ? <div className="font-bold text-blue-900">{cand.candidate_name}</div> :
                       cand[col.id] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="p-3 bg-white flex items-center justify-between border-t shadow-inner">
           <span className="text-xs text-gray-400">Trang {currentPage} / {totalPages || 1}</span>
           <div className="flex gap-1">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-30">Trước</button>
             <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-30">Sau</button>
           </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT (FULL FORM CỦA BẠN) --- */}
      <div className={`flex-1 flex flex-col bg-gray-100 transition-all duration-300 ${selectedId ? 'translate-x-0' : 'translate-x-full hidden'}`}>
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center text-lg italic text-gray-400">Đang tải...</div>
        ) : formData && (
          <>
            <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-40 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 rounded-full text-xl">✕</button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{formData.candidate_name}</h2>
                  <p className="text-xs font-mono text-gray-400">Mã UV: {formData.candidate_id}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!formData || isSaving}
                className={`px-6 py-2 rounded-lg font-bold shadow-md transition ${isSaving ? 'bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-20">
                {/* SECTION 1: QUY TRÌNH (BẢN GỐC CỦA BẠN) */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Quy trình tuyển dụng</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {funnelSteps.map(step => (
                            <label key={step.key} className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData[step.key] ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                              <span className="text-[10px] mb-1">{step.label}</span>
                              <input type="checkbox" className="w-5 h-5" checked={!!formData[step.key]} onChange={(e) => handleChange(step.key, e.target.checked)} />
                            </label>
                        ))}
                    </div>
                </section>

                {/* SECTION 2: THÔNG TIN ỨNG TUYỂN */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Thông tin ứng tuyển</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Dự án</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.project || ''} onChange={(e) => handleChange('project', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Vị trí</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.position || ''} onChange={(e) => handleChange('position', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Công ty</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.company || ''} onChange={(e) => handleChange('company', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Phòng ban</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.department || ''} onChange={(e) => handleChange('department', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs text-gray-400">Nguồn dữ liệu</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.data_source_type || ''} onChange={(e) => handleChange('data_source_type', e.target.value)} /></div>
                    </div>
                </section>

                {/* SECTION 3: NGÀY QUAN TRỌNG */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Ngày & Kết quả</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Ngày phỏng vấn</label><input type="date" className="w-full p-2 bg-gray-50 border rounded-md" value={formatDateToISO(formData.interview_date)} onChange={(e) => handleChange('interview_date', formatISOToDDMMYYYY(e.target.value))} /></div>
                        <div><label className="text-xs text-gray-400">Ngày nhận việc</label><input type="date" className="w-full p-2 bg-gray-50 border rounded-md" value={formatDateToISO(formData.onboard_date)} onChange={(e) => handleChange('onboard_date', formatISOToDDMMYYYY(e.target.value))} /></div>
                        <div className="col-span-2"><label className="text-xs text-gray-400">Lý do (Không đạt/Từ chối)</label><textarea className="w-full p-2 bg-gray-50 border rounded-md" rows={2} value={formData.reason_unqualified || formData.reason_rejected_offer || ''} onChange={(e) => handleChange('reason_unqualified', e.target.value)} /></div>
                    </div>
                </section>

                {/* SECTION 4: CÁ NHÂN */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs text-gray-400">Số điện thoại</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Số CCCD</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.id_card_number || ''} onChange={(e) => handleChange('id_card_number', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Ngày sinh</label><input className="w-full p-2 bg-gray-50 border rounded-md" placeholder="DD/MM/YYYY" value={formData.date_of_birth || ''} onChange={(e) => handleChange('date_of_birth', e.target.value)} /></div>
                        <div><label className="text-xs text-gray-400">Thành phố</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.address_city || ''} onChange={(e) => handleChange('address_city', e.target.value)} /></div>
                        <div className="col-span-2"><label className="text-xs text-gray-400">Địa chỉ đầy đủ</label><input className="w-full p-2 bg-gray-50 border rounded-md" value={formData.address_full || ''} onChange={(e) => handleChange('address_full', e.target.value)} /></div>
                    </div>
                </section>
            </div>
          </>
        )}
      </div>

      {/* --- PANEL CẤU HÌNH CỘT (OVERLAY) --- */}
      {showSettings && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-[100] border-l flex flex-col p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Cấu hình hiển thị</h3>
                <button onClick={() => setShowSettings(false)} className="text-2xl">✕</button>
            </div>
            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Số cột cố định (Freeze)</label>
                <input type="number" min="0" max="5" value={frozenCount} onChange={(e) => saveConfig(columns, parseInt(e.target.value))} className="w-full p-2 border rounded" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ẩn hiện & Độ rộng cột</label>
                {columns.map((col, idx) => (
                    <div key={col.id} className="flex items-center gap-2 p-2 border rounded text-xs bg-gray-50">
                        <input type="checkbox" checked={col.visible} onChange={() => {
                            const newCols = columns.map(c => c.id === col.id ? {...c, visible: !c.visible} : c);
                            saveConfig(newCols, frozenCount);
                        }} />
                        <span className="flex-1 truncate">{col.label}</span>
                        <input type="number" value={col.width} className="w-14 p-1 border text-center" onChange={(e) => {
                            const newCols = columns.map(c => c.id === col.id ? {...c, width: parseInt(e.target.value)} : c);
                            saveConfig(newCols, frozenCount);
                        }} />
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

// Badge Status
function StatusBadge({ cand }: { cand: any }) {
  if (cand.reject_offer) return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-[10px] font-bold">Từ chối</span>;
  if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-bold">Loại</span>;
  if (cand.onboard) return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-[10px] font-bold">Nhận việc</span>;
  if (cand.pass_interview) return <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-[10px] font-bold">Đỗ PV</span>;
  return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-[10px] font-medium">Mới</span>;
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
