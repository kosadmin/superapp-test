'use client';

import { useState, useEffect, useMemo } from 'react';
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

// Hàm lấy trạng thái ưu tiên cao nhất (để dùng cho việc Sort và Filter)
const getCandidateStatusKey = (cand: any) => {
    if (cand.onboard) return 'onboard';
    if (cand.unqualified) return 'unqualified';
    if (cand.reject_offer) return 'reject_offer';
    if (cand.pass_interview) return 'pass_interview';
    if (cand.show_up_for_interview) return 'show_up_for_interview';
    if (cand.scheduled_for_interview) return 'scheduled_for_interview';
    if (cand.interested) return 'interested';
    return 'new';
};

// --- ĐỊNH NGHĨA CẤU TRÚC CỘT ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  sortable?: boolean; // Thêm cờ cho phép sort
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'candidate_name', label: 'Họ tên', width: 180, visible: true, sortable: true },
  { id: 'status', label: 'Trạng thái', width: 120, visible: true, sortable: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true, sortable: true },
  { id: 'project', label: 'Dự án', width: 150, visible: true, sortable: true },
  { id: 'position', label: 'Vị trí', width: 150, visible: true, sortable: true },
  { id: 'company', label: 'Công ty', width: 150, visible: true, sortable: true },
  { id: 'interview_date', label: 'Ngày PV', width: 110, visible: true, sortable: true },
  { id: 'onboard_date', label: 'Ngày Onboard', width: 110, visible: true, sortable: true },
  { id: 'assigned_user_name', label: 'Người phụ trách', width: 150, visible: true, sortable: true },
  { id: 'data_source_type', label: 'Nguồn', width: 100, visible: false, sortable: true },
  { id: 'candidate_id', label: 'Mã UV', width: 120, visible: false, sortable: true },
  { id: 'id_card_number', label: 'CCCD', width: 130, visible: false },
  { id: 'date_of_birth', label: 'Ngày sinh', width: 100, visible: false },
  { id: 'birth_year', label: 'Năm sinh', width: 80, visible: false, sortable: true },
  { id: 'address_street', label: 'Số nhà/Tên đường', width: 150, visible: false },
  { id: 'address_ward', label: 'Phường/Xã', width: 120, visible: false },
  { id: 'address_city', label: 'Tỉnh/Thành', width: 120, visible: false, sortable: true },
  { id: 'address_full', label: 'Địa chỉ đầy đủ', width: 250, visible: false },
  { id: 'project_id', label: 'Mã dự án', width: 120, visible: false },
  { id: 'project_type', label: 'Loại dự án', width: 120, visible: false, sortable: true },
  { id: 'department', label: 'Phòng ban', width: 120, visible: false },
  { id: 'created_at', label: 'Ngày tạo', width: 140, visible: false, sortable: true },
  { id: 'created_by', label: 'Người tạo', width: 120, visible: false },
  { id: 'last_updated_at', label: 'Cập nhật cuối', width: 140, visible: false, sortable: true },
];

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  [key: string]: any;
}

// Danh sách trạng thái dùng cho Filter Dropdown
const funnelSteps = [
  { key: 'new', label: 'Mới' },
  { key: 'interested', label: 'Quan tâm' },
  { key: 'scheduled_for_interview', label: 'Đăng ký PV' },
  { key: 'show_up_for_interview', label: 'Tham gia PV' },
  { key: 'pass_interview', label: 'Đỗ PV' },
  { key: 'onboard', label: 'Nhận việc' },
  { key: 'reject_offer', label: 'Từ chối' },
  { key: 'unqualified', label: 'Không đạt' },
];

export default function CandidatesList() {
    return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  
  // Data States
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  
  // View States
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Toggle Filter Bar

  // Filter & Sort States
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState({
      status: '',
      project: '',
      source: '',
      dateFrom: '',
      dateTo: ''
  });

  // Detail States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load Config
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

  // 2. Fetch Data
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
      if (data.success) setAllCandidates(data.data || []);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

  // 3. Logic Xử lý Dữ liệu (Search -> Filter -> Sort)
  const processedData = useMemo(() => {
    let result = [...allCandidates];

    // A. Search Text
    if (search.trim()) {
        const lowerSearch = search.toLowerCase().trim();
        result = result.filter(cand => 
            cand.candidate_name?.toLowerCase().includes(lowerSearch) ||
            cand.phone?.includes(lowerSearch) ||
            cand.candidate_id?.toLowerCase().includes(lowerSearch)
        );
    }

    // B. Filters
    if (filters.status) {
        result = result.filter(cand => getCandidateStatusKey(cand) === filters.status);
    }
    if (filters.project) {
        result = result.filter(cand => cand.project?.toLowerCase().includes(filters.project.toLowerCase()));
    }
    if (filters.source) {
        result = result.filter(cand => cand.data_source_type?.toLowerCase().includes(filters.source.toLowerCase()));
    }
    // Filter Date Range (Interview Date)
    if (filters.dateFrom) {
        result = result.filter(cand => {
            const d = formatDateToISO(cand.interview_date);
            return d >= filters.dateFrom;
        });
    }
    if (filters.dateTo) {
        result = result.filter(cand => {
            const d = formatDateToISO(cand.interview_date);
            return d <= filters.dateTo;
        });
    }

    // C. Sorting
    if (sortConfig) {
        result.sort((a, b) => {
            let valA, valB;

            // Xử lý trường hợp đặc biệt: Status
            if (sortConfig.key === 'status') {
                valA = getCandidateStatusKey(a);
                valB = getCandidateStatusKey(b);
            } else {
                valA = a[sortConfig.key];
                valB = b[sortConfig.key];
            }

            // Xử lý null/undefined
            if (!valA) return 1;
            if (!valB) return -1;

            // So sánh
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [allCandidates, search, filters, sortConfig]);

  // Pagination Logic
  useEffect(() => { setCurrentPage(1); }, [search, filters, sortConfig]); // Reset về trang 1 khi filter/sort
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);
  
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  // 4. Handlers
  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
      setFilters({ status: '', project: '', source: '', dateFrom: '', dateTo: '' });
      setSearch('');
  };

  // ... (Giữ nguyên các hàm fetchDetail, handleChange, handleSave, moveColumn, toggleColumn...)
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

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

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
    for (let i = 0; i < index; i++) { if (columns[i].visible) leftOffset += columns[i].width; }
    return { position: 'sticky' as const, left: leftOffset, zIndex: 20 };
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-sm p-4 gap-4">
      {/* --- CỘT TRÁI --- */}
      <div className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all duration-500 overflow-hidden ${selectedId ? 'w-1/2' : 'w-full'}`}>
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700 uppercase tracking-tight">Quản lý Ứng viên</h1>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${showFilters ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                    🔍 Bộ lọc {Object.values(filters).some(x => x) && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${showSettings ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}`}
                >⚙️ Cột</button>
                <Link href="/dashboard" className="p-1.5 text-gray-400 hover:text-red-500 transition">✕</Link>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT hoặc mã ứng viên..."
              className="flex-1 px-4 py-2 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!selectedId && <Link href="/candidates/new" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition whitespace-nowrap">THÊM MỚI</Link>}
          </div>

          {/* --- FILTER BAR (Collapsible) --- */}
          {showFilters && (
              <div className="mt-3 p-3 bg-gray-50 border rounded-xl grid grid-cols-5 gap-3 animate-in slide-in-from-top-2 duration-200">
                  <select 
                    className="p-2 border rounded-lg text-xs outline-none focus:border-blue-500"
                    value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                      <option value="">-- Tất cả trạng thái --</option>
                      {funnelSteps.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <input 
                    placeholder="Lọc theo Dự án..." 
                    className="p-2 border rounded-lg text-xs outline-none focus:border-blue-500"
                    value={filters.project} onChange={(e) => handleFilterChange('project', e.target.value)}
                  />
                   <input 
                    placeholder="Lọc theo Nguồn..." 
                    className="p-2 border rounded-lg text-xs outline-none focus:border-blue-500"
                    value={filters.source} onChange={(e) => handleFilterChange('source', e.target.value)}
                  />
                  <div className="flex items-center gap-1 col-span-2">
                      <input type="date" className="p-2 border rounded-lg text-xs w-full" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} title="Ngày PV từ" />
                      <span className="text-gray-400">-</span>
                      <input type="date" className="p-2 border rounded-lg text-xs w-full" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} title="Ngày PV đến" />
                  </div>
                  <button onClick={clearFilters} className="col-span-5 text-xs text-red-500 hover:underline text-right italic">Xóa bộ lọc</button>
              </div>
          )}
        </div>

        {/* --- TABLE AREA --- */}
        <div className="flex-1 overflow-auto relative bg-white">
          <table className="text-left border-separate border-spacing-0 w-full">
            <thead className="bg-gray-50 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th 
                    key={col.id}
                    style={{ width: col.width, minWidth: col.width, ...getFrozenStyle(col.id, idx) }}
                    className={`p-3 border-b border-r text-[10px] uppercase font-bold text-gray-600 bg-gray-50 select-none ${col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className="flex items-center justify-between">
                        {col.label}
                        {col.sortable && sortConfig?.key === col.id && (
                            <span className="text-blue-600">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                        {col.sortable && sortConfig?.key !== col.id && (
                            <span className="text-gray-300 opacity-0 group-hover:opacity-100">↕</span>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-50' : 'hover:bg-gray-50 bg-white'}`}
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
              {paginatedData.length === 0 && (
                  <tr><td colSpan={columns.filter(c=>c.visible).length} className="p-8 text-center text-gray-400 italic">Không tìm thấy dữ liệu phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PHÂN TRANG --- */}
        <div className="p-3 border-t bg-white flex items-center justify-between">
           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
               Hiển thị: {paginatedData.length} / Tổng: {processedData.length} ứng viên | Trang {currentPage}/{totalPages || 1}
           </span>
           <div className="flex gap-1">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">‹</button>
             <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">›</button>
           </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT --- */}
      {selectedId && (
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-xl border overflow-hidden animate-in slide-in-from-right duration-500">
           {detailLoading ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="italic text-gray-400">Đang tải dữ liệu...</span>
             </div>
           ) : formData && (
             <>
               {/* Header Detail */}
               <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
                    <div>
                        <h2 className="font-bold text-lg uppercase text-blue-800 leading-none">{formData.candidate_name}</h2>
                        <span className="text-[10px] font-mono text-gray-400">{formData.candidate_id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={`px-6 py-2 rounded-xl font-bold transition shadow-lg ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                      </button>
                  </div>
               </div>

               {/* Body Detail */}
               <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 scrollbar-thin">
                  {/* ... (Giữ nguyên phần Detail như cũ) ... */}
                  
                  {/* 1. FUNNEL */}
                  <section className="bg-white p-0 rounded-2xl">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-[0.2em] px-1">Tiến độ tuyển dụng (Phễu)</h3>
                    <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {funnelSteps.map(step => {
                        const isNegative = step.key === 'reject_offer' || step.key === 'unqualified';
                        const activeClass = isNegative
                            ? 'border-gray-500 bg-gray-500 text-white shadow-md font-bold ring-2 ring-gray-200' 
                            : 'border-blue-600 bg-blue-600 text-white shadow-md font-bold ring-2 ring-blue-100'; 
                        
                        return (
                            <label key={step.key} className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all min-w-[90px] ${formData[step.key] ? activeClass : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                              <span className="text-[9px] mb-2 uppercase text-center leading-tight">{step.label}</span>
                              <input type="checkbox" checked={!!formData[step.key]} onChange={(e) => handleChange(step.key, e.target.checked)} className={`w-4 h-4 rounded-md focus:ring-offset-0 ${isNegative ? 'text-gray-600 focus:ring-gray-500' : 'text-blue-600 focus:ring-blue-500'}`} />
                            </label>
                        )
                      })}
                    </div>
                  </section>

                  {/* 2. NGÀY QUAN TRỌNG */}
                  <section>
                        <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-emerald-500 pl-3 text-xs uppercase tracking-wider">Thông tin quan trọng</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày phỏng vấn</label>
                                    <input type="date" className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-emerald-50/30 focus:bg-white focus:border-emerald-500 transition" value={formatDateToISO(formData.interview_date)} onChange={e => handleChange('interview_date', formatISOToDDMMYYYY(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày nhận việc (Onboard)</label>
                                    <input type="date" className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-emerald-50/30 focus:bg-white focus:border-emerald-500 transition" value={formatDateToISO(formData.onboard_date)} onChange={e => handleChange('onboard_date', formatISOToDDMMYYYY(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do từ chối Offer</label>
                                    <input className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-gray-50 focus:bg-white focus:border-gray-500 transition placeholder:text-gray-300 text-sm" placeholder="..." value={formData.reason_rejected_offer || ''} onChange={e => handleChange('reason_rejected_offer', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do không đạt (Loại)</label>
                                    <input className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-gray-50 focus:bg-white focus:border-gray-500 transition placeholder:text-gray-300 text-sm" placeholder="..." value={formData.reason_unqualified || ''} onChange={e => handleChange('reason_unqualified', e.target.value)} />
                                </div>
                            </div>
                        </div>
                  </section>

                  {/* 3. THÔNG TIN CÔNG VIỆC */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-blue-600 pl-3 text-xs uppercase tracking-wider">Thông tin hồ sơ & Công việc</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {['project', 'project_id', 'project_type', 'position', 'company', 'department', 'data_source_dept', 'data_source_type_group', 'data_source_type', 'assigned_user_name', 'assigned_user_group'].map(field => (
                        <div key={field}>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{DEFAULT_COLUMNS.find(c => c.id === field)?.label || field}</label>
                          <input className="w-full p-2.5 border rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white transition" value={formData[field] || ''} onChange={e => handleChange(field, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 4. THÔNG TIN CÁ NHÂN */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin cá nhân & Địa chỉ</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-700" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số CCCD</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_number || ''} onChange={e => handleChange('id_card_number', e.target.value)} /></div>
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày sinh</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} /></div>
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Năm sinh</label><input type="number" className="w-full p-2.5 border rounded-xl mt-1" value={formData.birth_year || ''} onChange={e => handleChange('birth_year', e.target.value)} /></div>
                      
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                          <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Đường/Số nhà</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.address_street || ''} onChange={e => handleChange('address_street', e.target.value)} /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phường/Xã</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.address_ward || ''} onChange={e => handleChange('address_ward', e.target.value)} /></div>
                          <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tỉnh/Thành</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.address_city || ''} onChange={e => handleChange('address_city', e.target.value)} /></div>
                      </div>
                      <div className="col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Địa chỉ đầy đủ</label><textarea className="w-full p-3 border rounded-xl mt-1 h-20 outline-none focus:ring-2 focus:ring-blue-500" value={formData.address_full || ''} onChange={e => handleChange('address_full', e.target.value)} /></div>
                    </div>
                  </section>

                   {/* 5. HỆ THỐNG */}
                  <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-gray-400 pl-3 text-xs uppercase tracking-wider">Thông tin hệ thống</h3>
                      <div className="space-y-3">
                          {['created_at', 'created_by', 'last_updated_at'].map(field => (
                              <div key={field}>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{DEFAULT_COLUMNS.find(c => c.id === field)?.label || field}</label>
                                  <input className="w-full p-2.5 border rounded-xl mt-1 bg-white text-gray-500 text-xs" value={formData[field] || ''} readOnly />
                              </div>
                          ))}
                      </div>
                  </section>
               </div>
             </>
           )}
        </div>
      )}

      {/* --- PANEL CẤU HÌNH --- */}
      {showSettings && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-2xl z-[100] border rounded-2xl flex flex-col animate-in slide-in-from-right overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-bold uppercase text-xs tracking-widest">Cấu hình hiển thị</h3>
                <button onClick={() => setShowSettings(false)} className="hover:rotate-90 transition duration-200 text-xl">✕</button>
            </div>
            
            <div className="p-5 border-b space-y-3 bg-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghim cột đầu tiên (Freeze)</label>
                <div className="flex items-center gap-3">
                    <input type="number" min="0" max="5" value={frozenCount} onChange={(e) => saveViewSettings(columns, parseInt(e.target.value) || 0)} className="w-20 p-2 border rounded-xl text-center font-bold text-blue-600 shadow-inner" />
                    <span className="text-[11px] text-gray-500 italic">Cố định n cột bên trái</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin">
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-3 ml-1 tracking-widest">Danh sách & Thứ tự cột</label>
                {columns.map((col, idx) => (
                    <div key={col.id} className={`flex items-center gap-3 p-2.5 border rounded-xl text-[11px] transition ${col.visible ? 'border-blue-100 bg-blue-50/30' : 'opacity-50 grayscale bg-gray-50'}`}>
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} className="w-4 h-4 rounded text-blue-600" />
                        <span className="flex-1 font-bold text-gray-700 truncate">{col.label}</span>
                        <input type="number" value={col.width} onChange={(e) => updateWidth(col.id, parseInt(e.target.value) || 50)} className="w-12 p-1 border rounded text-[10px] text-center bg-white" />
                        <div className="flex flex-col gap-1">
                            <button onClick={() => moveColumn(idx, 'up')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-blue-600">▲</button>
                            <button onClick={() => moveColumn(idx, 'down')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-blue-600">▼</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

// --- HÀM RENDER Ô DỮ LIỆU ---
function renderCell(colId: string, cand: any) {
    switch (colId) {
        case 'candidate_name': return <div className="font-bold text-blue-900 leading-tight">{cand.candidate_name}</div>;
        case 'status': return <StatusBadge cand={cand} />;
        case 'interview_date': return <span className="text-blue-600 font-bold">{cand.interview_date || '—'}</span>;
        case 'onboard_date': return <span className="text-emerald-600 font-bold">{cand.onboard_date || '—'}</span>;
        case 'phone': return <span className="font-mono font-medium">{cand.phone}</span>;
        default: return <span className="text-gray-600">{cand[colId] || <span className="text-gray-200">—</span>}</span>;
    }
}

// Badge Status
function StatusBadge({ cand }: { cand: any }) {
    const common = "px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter shadow-sm inline-block";
    const statusKey = getCandidateStatusKey(cand);

    const map: {[key:string]: any} = {
        'unqualified': <span className={`${common} bg-gray-500 text-white`}>KHÔNG ĐẠT</span>,
        'reject_offer': <span className={`${common} bg-gray-500 text-white`}>TỪ CHỐI</span>,
        'onboard': <span className={`${common} bg-green-600 text-white`}>ĐÃ NHẬN VIỆC</span>,
        'pass_interview': <span className={`${common} bg-blue-600 text-white`}>ĐỖ PV</span>,
        'show_up_for_interview': <span className={`${common} bg-cyan-500 text-white`}>THAM GIA PV</span>,
        'scheduled_for_interview': <span className={`${common} bg-red-500 text-white`}>ĐĂNG KÝ PV</span>,
        'interested': <span className={`${common} bg-amber-500 text-white`}>QUAN TÂM</span>,
        'new': <span className={`${common} bg-gray-200 text-gray-500`}>MỚI</span>
    };
    return map[statusKey] || map['new'];
}
