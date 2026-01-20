'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';
const ITEMS_PER_PAGE = 50;

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

// --- ĐỊNH NGHĨA CẤU TRÚC CỘT ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'candidate_name', label: 'Họ tên', width: 180, visible: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true },
  { id: 'status', label: 'Trạng thái', width: 120, visible: true },
  { id: 'project', label: 'Dự án', width: 150, visible: true },
  { id: 'position', label: 'Vị trí', width: 150, visible: true },
  { id: 'company', label: 'Công ty', width: 150, visible: true },
  { id: 'interview_date', label: 'Ngày PV', width: 110, visible: true },
  { id: 'onboard_date', label: 'Ngày Onboard', width: 110, visible: true },
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

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  
  // States cho danh sách
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // States cho tùy chỉnh View
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // States cho chi tiết ứng viên
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load Cấu hình Table từ LocalStorage
  useEffect(() => {
    const savedCols = localStorage.getItem('table_columns_config');
    const savedFrozen = localStorage.getItem('table_frozen_count');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  const saveViewSettings = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('table_columns_config', JSON.stringify(newCols));
    localStorage.setItem('table_frozen_count', newFrozen.toString());
  };

  // 2. Fetch Danh sách
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

  // 3. Logic Tìm kiếm
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

  // 4. Logic Fetch Chi tiết
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

  // 5. Logic Xử lý Form chi tiết
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

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  // 6. Logic Table (Move, Toggle, Width, Freeze)
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    saveViewSettings(newCols, frozenCount);
  };

  const toggleColumn = (id: string) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    saveViewSettings(newCols, frozenCount);
  };

  const updateWidth = (id: string, width: number) => {
    const newCols = columns.map(col => col.id === id ? { ...col, width } : col);
    saveViewSettings(newCols, frozenCount);
  };

  const getFrozenStyle = (colId: string, index: number) => {
    if (index >= frozenCount) return {};
    let leftOffset = 0;
    for (let i = 0; i < index; i++) {
      if (columns[i].visible) leftOffset += columns[i].width;
    }
    return { position: 'sticky' as const, left: leftOffset, zIndex: 20 };
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm relative">
      
      {/* --- CỘT TRÁI: DANH SÁCH --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[350px]' : 'w-full'}`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Ứng viên ({filteredCandidates.length})</h1>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-3 py-1.5 rounded border text-xs font-medium transition ${showSettings ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >⚙️ Xem</button>
                <Link href="/dashboard" className="p-1.5 text-gray-400 hover:text-blue-600">✕</Link>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm tên, SĐT..."
              className="flex-1 px-3 py-2 border rounded-md outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!selectedId && <Link href="/candidates/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm</Link>}
          </div>
        </div>

        {/* --- TABLE AREA --- */}
        <div className="flex-1 overflow-auto relative">
          <table className="text-left border-separate border-spacing-0" style={{ width: 'max-content' }}>
            <thead className="bg-gray-100 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th 
                    key={col.id}
                    style={{ width: col.width, minWidth: col.width, ...getFrozenStyle(col.id, idx) }}
                    className="p-3 border-b border-r text-[10px] uppercase text-gray-600 bg-gray-100"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-100' : ''}`}
                >
                  {columns.map((col, idx) => col.visible && (
                    <td 
                      key={col.id}
                      style={{ ...getFrozenStyle(col.id, idx) }}
                      className="p-3 border-r whitespace-nowrap overflow-hidden text-ellipsis bg-inherit"
                    >
                      {renderCell(col.id, cand)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PHÂN TRANG --- */}
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
           <span className="text-[10px] text-gray-400 uppercase font-bold">Trang {currentPage}/{totalPages || 1}</span>
           <div className="flex gap-1">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">‹</button>
             <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">›</button>
           </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT --- */}
      {selectedId && (
        <div className="flex-1 flex flex-col bg-white shadow-2xl border-l z-40 animate-in slide-in-from-right duration-300">
           {detailLoading ? (
             <div className="flex-1 flex items-center justify-center italic text-gray-400">Đang tải chi tiết...</div>
           ) : formData && (
             <>
               {/* Header Detail */}
               <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
                    <div>
                        <h2 className="font-bold text-lg uppercase leading-none">{formData.candidate_name}</h2>
                        <span className="text-[10px] font-mono text-gray-400">{formData.candidate_id}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    className={`px-6 py-2 rounded-md font-bold transition ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' : 'bg-gray-200 text-gray-400'}`}
                  >
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
               </div>

               {/* Body Detail */}
               <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
                  
                  {/* STEPPER / FUNNEL */}
                  <section className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Tiến độ ứng tuyển</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {funnelSteps.map(step => (
                        <label key={step.key} className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition ${formData[step.key] ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'bg-white border-gray-200 text-gray-400'}`}>
                          <span className="text-[9px] mb-1">{step.label}</span>
                          <input type="checkbox" checked={!!formData[step.key]} onChange={(e) => handleChange(step.key, e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                        </label>
                      ))}
                    </div>
                  </section>

                  {/* THÔNG TIN CÔNG VIỆC */}
                  <section>
                    <h3 className="text-blue-600 font-bold mb-4 border-b pb-1 text-xs uppercase">Thông tin ứng tuyển</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] text-gray-400 uppercase">Dự án</label><input className="w-full p-2 border rounded mt-1" value={formData.project || ''} onChange={e => handleChange('project', e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase">Vị trí</label><input className="w-full p-2 border rounded mt-1" value={formData.position || ''} onChange={e => handleChange('position', e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase">Công ty</label><input className="w-full p-2 border rounded mt-1" value={formData.company || ''} onChange={e => handleChange('company', e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase">Nguồn dữ liệu</label><input className="w-full p-2 border rounded mt-1" value={formData.data_source_type || ''} onChange={e => handleChange('data_source_type', e.target.value)} /></div>
                    </div>
                  </section>

                  {/* THỜI GIAN QUAN TRỌNG */}
                  <section>
                    <h3 className="text-blue-600 font-bold mb-4 border-b pb-1 text-xs uppercase">Ngày quan trọng</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase">Ngày phỏng vấn</label>
                        <input type="date" className="w-full p-2 border rounded mt-1" value={formatDateToISO(formData.interview_date)} onChange={e => handleChange('interview_date', formatISOToDDMMYYYY(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase">Ngày nhận việc</label>
                        <input type="date" className="w-full p-2 border rounded mt-1" value={formatDateToISO(formData.onboard_date)} onChange={e => handleChange('onboard_date', formatISOToDDMMYYYY(e.target.value))} />
                      </div>
                    </div>
                  </section>

                  {/* THÔNG TIN CÁ NHÂN */}
                  <section>
                    <h3 className="text-blue-600 font-bold mb-4 border-b pb-1 text-xs uppercase">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] text-gray-400 uppercase">Số điện thoại</label><input className="w-full p-2 border rounded mt-1 font-bold text-blue-800" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase">Số CCCD</label><input className="w-full p-2 border rounded mt-1" value={formData.id_card_number || ''} onChange={e => handleChange('id_card_number', e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-400 uppercase">Ngày sinh</label><input className="w-full p-2 border rounded mt-1" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} /></div>
                      <div className="col-span-2"><label className="text-[10px] text-gray-400 uppercase">Địa chỉ đầy đủ</label><textarea className="w-full p-2 border rounded mt-1 h-20" value={formData.address_full || ''} onChange={e => handleChange('address_full', e.target.value)} /></div>
                    </div>
                  </section>
               </div>
             </>
           )}
        </div>
      )}

      {/* --- PANEL TÙY CHỈNH TABLE --- */}
      {showSettings && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-[100] border-l flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-bold">Cấu hình hiển thị</h3>
                <button onClick={() => setShowSettings(false)}>✕</button>
            </div>
            
            <div className="p-4 border-b space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Cố định cột (Freeze)</label>
                <div className="flex items-center gap-2">
                    <input type="number" min="0" max="5" value={frozenCount} onChange={(e) => saveViewSettings(columns, parseInt(e.target.value) || 0)} className="w-16 p-1 border rounded text-center text-sm" />
                    <span className="text-[11px] text-gray-500 italic">Số cột ghim trái</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Thứ tự & Ẩn hiện cột</label>
                {columns.map((col, idx) => (
                    <div key={col.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 border rounded text-[11px] bg-white">
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} />
                        <span className="flex-1 font-medium truncate">{col.label}</span>
                        <input type="number" value={col.width} onChange={(e) => updateWidth(col.id, parseInt(e.target.value) || 50)} className="w-12 p-0.5 border text-center text-[10px] rounded" />
                        <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveColumn(idx, 'up')} className="bg-gray-100 px-1 rounded hover:bg-gray-200">▲</button>
                            <button onClick={() => moveColumn(idx, 'down')} className="bg-gray-100 px-1 rounded hover:bg-gray-200">▼</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

// Hàm render ô dữ liệu
function renderCell(colId: string, cand: any) {
    switch (colId) {
        case 'candidate_name': return (
            <div>
                <div className="font-bold text-blue-900 leading-tight">{cand.candidate_name}</div>
                <div className="text-[9px] text-gray-400 font-mono italic">{cand.candidate_id}</div>
            </div>
        );
        case 'status': return <StatusBadge cand={cand} />;
        case 'interview_date': return <span className="text-blue-600 font-semibold">{cand.interview_date || '—'}</span>;
        case 'onboard_date': return <span className="text-emerald-600 font-semibold">{cand.onboard_date || '—'}</span>;
        default: return cand[colId] || <span className="text-gray-300">—</span>;
    }
}

// Badge Status
function StatusBadge({ cand }: { cand: any }) {
    if (cand.onboard) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold">ONBOARD</span>;
    if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold">LOẠI</span>;
    if (cand.pass_interview) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold">ĐỖ PV</span>;
    if (cand.show_up_for_interview) return <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-[9px] font-bold">THAM GIA PV</span>;
    if (cand.interested) return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-bold">QUAN TÂM</span>;
    return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px]">MỚI</span>;
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
