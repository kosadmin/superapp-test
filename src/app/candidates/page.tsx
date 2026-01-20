'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';
const ITEMS_PER_PAGE = 50;

// --- INTERFACES ---
interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  visible: boolean;
  order: number;
}

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  [key: string]: any;
}

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  
  // Data States
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // UI States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [frozenCount, setFrozenCount] = useState(1); // Mặc định cố định 1 cột đầu

  // --- CẤU HÌNH CỘT (Khởi tạo) ---
  const [columnSettings, setColumnSettings] = useState<ColumnConfig[]>([
    { key: 'candidate_name', label: 'Họ tên', width: 200, visible: true, order: 1 },
    { key: 'status', label: 'Trạng thái', width: 120, visible: true, order: 2 },
    { key: 'phone', label: 'Số điện thoại', width: 150, visible: true, order: 3 },
    { key: 'project', label: 'Dự án', width: 180, visible: true, order: 4 },
    { key: 'position', label: 'Vị trí', width: 150, visible: true, order: 5 },
    { key: 'company', label: 'Công ty', width: 150, visible: true, order: 6 },
    { key: 'interview_date', label: 'Ngày PV', width: 120, visible: true, order: 7 },
    { key: 'onboard_date', label: 'Ngày Onboard', width: 120, visible: true, order: 8 },
    { key: 'id_card_number', label: 'CCCD', width: 150, visible: true, order: 9 },
    { key: 'date_of_birth', label: 'Ngày sinh', width: 120, visible: true, order: 10 },
    { key: 'address_full', label: 'Địa chỉ', width: 300, visible: true, order: 11 },
    { key: 'data_source_type', label: 'Nguồn', width: 120, visible: true, order: 12 },
    { key: 'assigned_user_name', label: 'Người phụ trách', width: 150, visible: true, order: 13 },
  ]);

  // Lưu/Tải cấu hình từ LocalStorage để không bị mất khi F5
  useEffect(() => {
    const saved = localStorage.getItem('candidate_column_settings');
    const savedFrozen = localStorage.getItem('candidate_frozen_count');
    if (saved) setColumnSettings(JSON.parse(saved));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  const saveSettings = (newSettings: ColumnConfig[], newFrozen: number) => {
    setColumnSettings(newSettings);
    setFrozenCount(newFrozen);
    localStorage.setItem('candidate_column_settings', JSON.stringify(newSettings));
    localStorage.setItem('candidate_frozen_count', newFrozen.toString());
  };

  // Fetch Data
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

  // Search logic
  useEffect(() => {
    const lowerSearch = search.toLowerCase().trim();
    const filtered = allCandidates.filter(cand => 
      cand.candidate_name?.toLowerCase().includes(lowerSearch) ||
      cand.phone?.includes(search) ||
      cand.candidate_id?.toLowerCase().includes(lowerSearch)
    );
    setFilteredCandidates(filtered);
    setCurrentPage(1);
  }, [search, allCandidates]);

  // Các cột hiển thị sau khi đã lọc visible và sắp xếp theo order
  const visibleColumns = useMemo(() => {
    return [...columnSettings]
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order);
  }, [columnSettings]);

  // Tính toán vị trí "Left" cho các cột được Freeze
  const getStickyLeft = (index: number) => {
    if (index >= frozenCount) return undefined;
    let left = 0;
    for (let i = 0; i < index; i++) {
      left += visibleColumns[i].width;
    }
    return left;
  };

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      {/* --- DANH SÁCH --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[350px]' : 'w-full'}`}>
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Ứng viên</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border transition"
              >
                ⚙️ Tùy chỉnh hiển thị
              </button>
              <Link href="/dashboard" className="text-blue-500 hover:underline text-xs mt-1">← Quay lại</Link>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="flex-1 px-3 py-2 border rounded-md outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* --- TABLE AREA --- */}
        <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-300">
          <table className="text-left border-collapse table-fixed" style={{ width: visibleColumns.reduce((sum, c) => sum + c.width, 0) }}>
            <thead className="bg-gray-100 sticky top-0 z-30 shadow-sm">
              <tr>
                {visibleColumns.map((col, idx) => {
                  const isFrozen = idx < frozenCount;
                  return (
                    <th 
                      key={col.key}
                      style={{ 
                        width: col.width,
                        left: getStickyLeft(idx),
                        position: isFrozen ? 'sticky' : 'relative',
                        zIndex: isFrozen ? 40 : 10
                      }}
                      className={`p-3 border-b text-[10px] uppercase text-gray-500 tracking-wider bg-gray-100 ${isFrozen ? 'border-r-2 border-r-blue-200' : ''}`}
                    >
                      {col.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => setSelectedId(cand.candidate_id)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-100' : ''}`}
                >
                  {visibleColumns.map((col, idx) => {
                    const isFrozen = idx < frozenCount;
                    return (
                      <td 
                        key={col.key}
                        style={{ 
                          width: col.width,
                          left: getStickyLeft(idx),
                          position: isFrozen ? 'sticky' : 'relative',
                          zIndex: isFrozen ? 35 : 1
                        }}
                        className={`p-3 whitespace-nowrap overflow-hidden text-ellipsis bg-inherit ${isFrozen ? 'border-r-2 border-r-blue-50 font-semibold' : ''}`}
                      >
                        {renderCell(cand, col.key)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION --- */}
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-[11px] text-gray-500">Tổng: {filteredCandidates.length}</div>
            <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">‹</button>
                <span className="py-1">Trang {currentPage}</span>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">›</button>
            </div>
        </div>
      </div>

      {/* --- MODAL TÙY CHỈNH --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
              <h2 className="font-bold text-lg">Tùy chỉnh chế độ xem bảng</h2>
              <button onClick={() => setShowSettings(false)} className="text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6 flex items-center gap-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                 <label className="font-bold text-gray-700">Số cột cố định (Freeze):</label>
                 <input 
                   type="number" min="0" max="5" 
                   value={frozenCount} 
                   onChange={(e) => setFrozenCount(parseInt(e.target.value) || 0)}
                   className="w-16 p-1 border rounded text-center"
                 />
                 <span className="text-xs text-gray-500">(Cố định từ trái sang phải)</span>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 border-b">
                    <th className="pb-2">Hiện</th>
                    <th className="pb-2">Tên cột</th>
                    <th className="pb-2">Độ rộng (px)</th>
                    <th className="pb-2">Thứ tự</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {columnSettings.sort((a,b) => a.order - b.order).map((col, idx) => (
                    <tr key={col.key} className="hover:bg-gray-50">
                      <td className="py-2">
                        <input 
                          type="checkbox" checked={col.visible}
                          onChange={(e) => {
                            const newSet = [...columnSettings];
                            newSet.find(c => c.key === col.key)!.visible = e.target.checked;
                            setColumnSettings(newSet);
                          }}
                        />
                      </td>
                      <td className="py-2 font-medium">{col.label}</td>
                      <td className="py-2">
                        <input 
                          type="number" value={col.width}
                          onChange={(e) => {
                            const newSet = [...columnSettings];
                            newSet.find(c => c.key === col.key)!.width = parseInt(e.target.value) || 50;
                            setColumnSettings(newSet);
                          }}
                          className="w-20 p-1 border rounded text-sm"
                        />
                      </td>
                      <td className="py-2">
                         <div className="flex gap-1">
                            <button onClick={() => moveColumn(idx, 'up')} className="px-2 bg-gray-100 rounded">↑</button>
                            <button onClick={() => moveColumn(idx, 'down')} className="px-2 bg-gray-100 rounded">↓</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-600">Hủy</button>
              <button 
                onClick={() => {
                   saveSettings(columnSettings, frozenCount);
                   setShowSettings(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Áp dụng & Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper di chuyển thứ tự cột
  function moveColumn(index: number, direction: 'up' | 'down') {
    const newSettings = [...columnSettings].sort((a,b) => a.order - b.order);
    if (direction === 'up' && index > 0) {
      [newSettings[index].order, newSettings[index-1].order] = [newSettings[index-1].order, newSettings[index].order];
    } else if (direction === 'down' && index < newSettings.length - 1) {
      [newSettings[index].order, newSettings[index+1].order] = [newSettings[index+1].order, newSettings[index].order];
    }
    setColumnSettings(newSettings);
  }

  // Helper render dữ liệu từng ô
  function renderCell(cand: Candidate, key: string) {
    const val = cand[key];
    if (key === 'candidate_name') return (
      <div>
        <div className="font-bold text-blue-800">{val}</div>
        <div className="text-[9px] text-gray-400 font-mono">{cand.candidate_id}</div>
      </div>
    );
    if (key === 'status') return <StatusBadge cand={cand} />;
    if (key === 'interview_date') return <span className="text-blue-600 font-medium">{val || '—'}</span>;
    if (key === 'onboard_date') return <span className="text-green-600 font-medium">{val || '—'}</span>;
    return val || '—';
  }
}

// Badge Status (giữ nguyên logic cũ)
function StatusBadge({ cand }: { cand: any }) {
  if (cand.onboard) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">ONBOARD</span>;
  if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">LOẠI</span>;
  if (cand.pass_interview) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">PASS PV</span>;
  if (cand.show_up_for_interview) return <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold">ĐÃ PV</span>;
  return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px]">MỚI</span>;
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
