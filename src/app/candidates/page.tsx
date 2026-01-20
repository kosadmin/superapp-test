'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';
const ITEMS_PER_PAGE = 50;

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

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // --- STATE TÙY CHỈNH CHẾ ĐỘ XEM ---
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Load settings từ localStorage
  useEffect(() => {
    const savedCols = localStorage.getItem('table_columns_config');
    const savedFrozen = localStorage.getItem('table_frozen_count');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  // Save settings
  const saveViewSettings = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('table_columns_config', JSON.stringify(newCols));
    localStorage.setItem('table_frozen_count', newFrozen.toString());
  };

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

  // --- LOGIC XỬ LÝ CỘT ---
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

  // Tính toán vị trí "Left" cho các cột bị Freeze
  const getFrozenStyle = (colId: string, index: number) => {
    if (index >= frozenCount) return {};
    
    let leftOffset = 0;
    for (let i = 0; i < index; i++) {
      if (columns[i].visible) leftOffset += columns[i].width;
    }

    return {
      position: 'sticky' as const,
      left: leftOffset,
      zIndex: 20,
    };
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm relative">
      
      {/* --- CỘT DANH SÁCH --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[350px]' : 'w-full'}`}>
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Quản lý Ứng viên</h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded border transition ${showSettings ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    title="Tùy chỉnh chế độ xem"
                >
                    ⚙️ Chế độ xem
                </button>
                <Link href="/dashboard" className="p-2 text-gray-500 hover:text-blue-600">✕</Link>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              className="flex-1 px-3 py-2 border rounded-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* --- TABLE AREA --- */}
        <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-300">
          <table className="text-left border-separate border-spacing-0" style={{ width: 'max-content' }}>
            <thead className="bg-gray-100 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th 
                    key={col.id}
                    style={{ 
                        width: col.width, 
                        minWidth: col.width,
                        ...getFrozenStyle(col.id, idx)
                    }}
                    className={`p-3 border-b border-r text-[10px] uppercase text-gray-600 bg-gray-100`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => setSelectedId(cand.candidate_id)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-100' : ''}`}
                >
                  {columns.map((col, idx) => col.visible && (
                    <td 
                      key={col.id}
                      style={{ ...getFrozenStyle(col.id, idx) }}
                      className={`p-3 border-r whitespace-nowrap overflow-hidden text-ellipsis bg-inherit`}
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
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between z-40">
           <span className="text-[11px] text-gray-500 font-medium uppercase">Tổng: {filteredCandidates.length} ứng viên</span>
           <div className="flex gap-1">
             <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="px-2 py-1 border rounded bg-white">‹</button>
             <span className="px-3 py-1 text-xs">Trang {currentPage} / {totalPages || 1}</span>
             <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="px-2 py-1 border rounded bg-white">›</button>
           </div>
        </div>
      </div>

      {/* --- PANEL TÙY CHỈNH (SETTINGS OVERLAY) --- */}
      {showSettings && (
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl z-[100] border-l flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold">Cấu hình hiển thị</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400">✕</button>
            </div>
            
            <div className="p-4 border-b space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase">Cố định cột (Freeze)</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        min="0" max="5"
                        value={frozenCount}
                        onChange={(e) => saveViewSettings(columns, parseInt(e.target.value) || 0)}
                        className="w-16 p-1 border rounded text-center"
                    />
                    <span className="text-xs text-gray-500">Số cột đầu tiên muốn ghim</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Thứ tự & Ẩn hiện</label>
                {columns.map((col, idx) => (
                    <div key={col.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 border rounded text-[11px]">
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} />
                        <span className="flex-1 font-medium truncate">{col.label}</span>
                        <input 
                            type="number" 
                            value={col.width} 
                            onChange={(e) => updateWidth(col.id, parseInt(e.target.value) || 50)}
                            className="w-12 p-0.5 border text-center text-[10px]"
                        />
                        <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveColumn(idx, 'up')} className="bg-gray-100 hover:bg-gray-200 px-1 rounded">▲</button>
                            <button onClick={() => moveColumn(idx, 'down')} className="bg-gray-100 hover:bg-gray-200 px-1 rounded">▼</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-50 text-[10px] text-gray-400 italic text-center">
                Mọi thay đổi sẽ được tự động lưu vào trình duyệt của bạn.
            </div>
        </div>
      )}

      {/* --- CHI TIẾT --- */}
      {selectedId && <CandidateDetail id={selectedId} onClose={() => setSelectedId(null)} onUpdate={fetchAllCandidates} />}
    </div>
  );
}

// Hàm render dữ liệu theo ID cột
function renderCell(colId: string, cand: any) {
    switch (colId) {
        case 'candidate_name': return <span className="font-bold text-blue-900">{cand.candidate_name}</span>;
        case 'status': return <StatusBadge cand={cand} />;
        case 'interview_date': return <span className="text-blue-600 font-medium">{cand.interview_date}</span>;
        case 'onboard_date': return <span className="text-emerald-600 font-medium">{cand.onboard_date}</span>;
        default: return cand[colId] || <span className="text-gray-300">—</span>;
    }
}

// Badge Status
function StatusBadge({ cand }: { cand: any }) {
    if (cand.onboard) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[9px] font-bold">ONBOARD</span>;
    if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold">LOẠI</span>;
    if (cand.pass_interview) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold">PASS PV</span>;
    return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px]">MỚI</span>;
}

// Component Chi tiết (Tách ra cho gọn)
function CandidateDetail({ id, onClose, onUpdate }: { id: string, onClose: () => void, onUpdate: () => void }) {
    return (
        <div className="flex-1 flex flex-col bg-white shadow-2xl border-l z-50 animate-in slide-in-from-right">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold">CHI TIẾT ỨNG VIÊN: {id}</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            <div className="p-10 text-center text-gray-400 italic">
                (Phần nội dung chỉnh sửa chi tiết giữ nguyên như bản trước của bạn)
                <br/>
                <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Đóng xem chi tiết</button>
            </div>
        </div>
    );
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
