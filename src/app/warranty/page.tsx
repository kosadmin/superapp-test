'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MASTER_DATA } from '@/constants/masterData';
import { API_CONFIG } from '@/constants/masterData';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 50;

// --- UTILS ---
const getTagStyles = (tag: string) => {
  const colors = [
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  ];
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// --- CONFIG ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  sortable?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tags_warranty', label: 'Nhãn', width: 150, visible: true, sortable: false },
  { id: 'candidate_name', label: 'Họ tên', width: 180, visible: true, sortable: true },
  { id: 'status', label: 'Trạng thái', width: 140, visible: true, sortable: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true, sortable: true },
  { id: 'project', label: 'Dự án', width: 150, visible: true, sortable: true },
  { id: 'position', label: 'Vị trí', width: 150, visible: true, sortable: true },
  { id: 'onboard_date', label: 'Ngày Onboard', width: 120, visible: true, sortable: true },
  { id: 'assigned_247_user_name', label: 'Người phụ trách (247)', width: 160, visible: true, sortable: true },
  { id: 'on_job_1_day_date', label: 'Ngày 1 ngày', width: 110, visible: false, sortable: true },
  { id: 'on_job_3_day_date', label: 'Ngày 3 ngày', width: 110, visible: false, sortable: true },
  { id: 'on_job_7_day_date', label: 'Ngày 7 ngày', width: 110, visible: false, sortable: true },
  { id: 'on_job_30_day_date', label: 'Ngày 30 ngày', width: 110, visible: false, sortable: true },
  { id: 'eligible_for_acceptance', label: 'Đủ điều kiện nghiệm thu', width: 150, visible: false, sortable: true },
  { id: 'is_still_working_247', label: 'Còn làm (247)', width: 120, visible: false, sortable: true },
  { id: 'is_still_working_official', label: 'Còn làm (Official)', width: 130, visible: false, sortable: true },
  { id: 'resigned_date_247', label: 'Ngày nghỉ (247)', width: 120, visible: false, sortable: true },
  { id: 'resigned_date_official', label: 'Ngày nghỉ (Official)', width: 130, visible: false, sortable: true },
  { id: 'candidate_id', label: 'Mã UV', width: 120, visible: false, sortable: true },
  { id: 'assigned_user_name', label: 'NV phụ trách (tuyển dụng)', width: 170, visible: false, sortable: true },
  { id: 'company', label: 'Công ty', width: 150, visible: false, sortable: true },
  { id: 'gender', label: 'Giới tính', width: 80, visible: false, sortable: true },
  { id: 'date_of_birth', label: 'Ngày sinh', width: 100, visible: false, sortable: true },
  { id: 'address_city', label: 'Tỉnh/Thành phố', width: 120, visible: false, sortable: true },
  { id: 'created_at', label: 'Ngày tạo', width: 140, visible: false, sortable: true },
  { id: 'last_updated_at', label: 'Cập nhật cuối', width: 140, visible: false, sortable: true },
];

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  tags_warranty?: string;
  [key: string]: any;
}

interface FilterState {
  status: string;
  project: string;
  assigned_247_user: string;
  tags: string;
  onboard_from: string;
  onboard_to: string;
  on_job_1_day_from: string;
  on_job_1_day_to: string;
  on_job_3_day_from: string;
  on_job_3_day_to: string;
  on_job_7_day_from: string;
  on_job_7_day_to: string;
  on_job_30_day_from: string;
  on_job_30_day_to: string;
  resigned_date_from: string;
  resigned_date_to: string;
  is_still_working_247: string;
  is_still_working_official: string;
}

const warrantyFunnelSteps = [
  { key: 'onboard', label: 'Onboard' },
  { key: 'on_job_1_day', label: 'Đã làm 1 ngày' },
  { key: 'on_job_3_day', label: 'Đã làm 3 ngày' },
  { key: 'on_job_7_day', label: 'Đã làm 7 ngày' },
  { key: 'on_job_30_days', label: 'Đã làm 30 ngày' },
];

function WarrantyContent() {
  const { name, user_group, user_id, isLoading: isAuthLoading } = useAuth();

  const userGroupLower = user_group?.toLowerCase() ?? '';
  const can247Edit = userGroupLower === '247' || userGroupLower === 'admin' || userGroupLower === 'manager';
  const canOnsiteEdit = userGroupLower === 'adminonsite' || userGroupLower === 'admin' || userGroupLower === 'manager' || userGroupLower === 'c&b';

  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    status: '', project: '', assigned_247_user: '', tags: '',
    onboard_from: '', onboard_to: '',
    on_job_1_day_from: '', on_job_1_day_to: '',
    on_job_3_day_from: '', on_job_3_day_to: '',
    on_job_7_day_from: '', on_job_7_day_to: '',
    on_job_30_day_from: '', on_job_30_day_to: '',
    resigned_date_from: '', resigned_date_to: '',
    is_still_working_247: '', is_still_working_official: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const readOnlyClass = "w-full p-2.5 border rounded-xl mt-1 bg-gray-50 text-gray-500 text-sm cursor-not-allowed";

  useEffect(() => {
    const savedCols = localStorage.getItem('warranty_table_columns_config');
    const savedFrozen = localStorage.getItem('warranty_table_frozen_count');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id|| !name) return;
    setListLoading(true);
    try {
      const res = await fetch(API_CONFIG.WARRANTY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', sort: 'newest', user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) setAllCandidates(data.data || []);
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id && name) fetchAllCandidates(); }, [user_group, user_id, name,isAuthLoading]);
  useEffect(() => { setCurrentPage(1); }, [search, filters]);

  const processedData = useMemo(() => {
    let result = [...allCandidates];

    if (search.trim()) {
      const lowerSearch = search.toLowerCase().trim();
      result = result.filter(c =>
        c.candidate_name?.toLowerCase().includes(lowerSearch) ||
        c.phone?.includes(search) ||
        c.candidate_id?.toLowerCase().includes(lowerSearch)
      );
    }

    if (filters.status) {
      const statusMap: Record<string, string> = {
        'Onboard': 'onboard', 'Đã làm 1 ngày': 'on_job_1_day',
        'Đã làm 3 ngày': 'on_job_3_day', 'Đã làm 7 ngày': 'on_job_7_day',
        'Đã làm 30 ngày': 'on_job_30_days',
      };
      const mappedKey = statusMap[filters.status];
      if (mappedKey) result = result.filter(c => c[mappedKey] === true || c[mappedKey] === 'TRUE');
    }

    if (filters.project) result = result.filter(c => c.project === filters.project);
    if (filters.assigned_247_user) result = result.filter(c => c.assigned_247_user_name === filters.assigned_247_user);
    if (filters.tags) {
      result = result.filter(c => {
        if (!c.tags_warranty) return false;
        return c.tags_warranty.split(',').map((t: string) => t.trim()).includes(filters.tags);
      });
    }
    if (filters.is_still_working_247) {
      const val = filters.is_still_working_247 === 'true';
      result = result.filter(c => Boolean(c.is_still_working_247 === true || c.is_still_working_247 === 'TRUE') === val);
    }
    if (filters.is_still_working_official) {
      const val = filters.is_still_working_official === 'true';
      result = result.filter(c => Boolean(c.is_still_working_official === true || c.is_still_working_official === 'TRUE') === val);
    }

    const applyDateRange = (arr: Candidate[], field: string, from: string, to: string) => {
      if (from) arr = arr.filter(c => c[field] && c[field] >= from);
      if (to) arr = arr.filter(c => c[field] && c[field] <= to);
      return arr;
    };
    result = applyDateRange(result, 'onboard_date', filters.onboard_from, filters.onboard_to);
    result = applyDateRange(result, 'on_job_1_day_date', filters.on_job_1_day_from, filters.on_job_1_day_to);
    result = applyDateRange(result, 'on_job_3_day_date', filters.on_job_3_day_from, filters.on_job_3_day_to);
    result = applyDateRange(result, 'on_job_7_day_date', filters.on_job_7_day_from, filters.on_job_7_day_to);
    result = applyDateRange(result, 'on_job_30_day_date', filters.on_job_30_day_from, filters.on_job_30_day_to);

    if (filters.resigned_date_from || filters.resigned_date_to) {
      result = result.filter(c => {
        const earliest = [c.resigned_date_247 || '', c.resigned_date_official || ''].filter(Boolean).sort()[0] || '';
        if (!earliest) return false;
        if (filters.resigned_date_from && earliest < filters.resigned_date_from) return false;
        if (filters.resigned_date_to && earliest > filters.resigned_date_to) return false;
        return true;
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aV = a[sortConfig.key!] || '';
        const bV = b[sortConfig.key!] || '';
        if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allCandidates, search, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(start, start + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  const handleSort = (colId: string) => {
    setSortConfig(cur => {
      if (cur.key === colId) {
        if (cur.direction === 'asc') return { key: colId, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key: colId, direction: 'asc' };
    });
  };

  const uniqueProjects = useMemo(() => Array.from(new Set(allCandidates.map(c => c.project).filter(Boolean))), [allCandidates]);
  const unique247Users = useMemo(() => Array.from(new Set(allCandidates.map(c => c.assigned_247_user_name).filter(Boolean))), [allCandidates]);
  const warrantyStatusOptions = warrantyFunnelSteps.map(s => s.label);

  const saveViewSettings = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('warranty_table_columns_config', JSON.stringify(newCols));
    localStorage.setItem('warranty_table_frozen_count', newFrozen.toString());
  };

  const fetchDetail = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(API_CONFIG.WARRANTY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id, user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) { setFormData(data.data); setOriginalData(data.data); }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      let d = { ...prev, [field]: value };

      const funnel = ['onboard', 'on_job_1_day', 'on_job_3_day', 'on_job_7_day', 'on_job_30_days'];
      if (funnel.includes(field)) {
        const idx = funnel.indexOf(field);
        if (value === true) { for (let i = 0; i < idx; i++) d[funnel[i]] = true; }
        else { for (let i = idx + 1; i < funnel.length; i++) d[funnel[i]] = false; }
      }
// Sync 247 → Official nếu project_type là Recruiting
const recruitingFields: Record<string, string> = {
  is_still_working_247: 'is_still_working_official',
  resigned_date_247: 'resigned_date_official',
  reason_resigned_247: 'reason_resigned_official',
};
if (d.project_type === 'Recruiting' && recruitingFields[field]) {
  d[recruitingFields[field]] = value;
}
      if (field === 'date_of_birth') d.birth_year = value ? value.split('-')[0] : '';

      if (['address_street', 'address_ward', 'address_city'].includes(field)) {
        d.address_full = [d.address_street, d.address_ward, d.address_city].filter(Boolean).join(' - ');
      }

      return d;
    });
  };

  const handleAddTag = (tag: string) => {
    if (!formData) return;
    const current = formData.tags_warranty ? formData.tags_warranty.split(',').map((t: string) => t.trim()) : [];
    if (!current.includes(tag)) handleChange('tags_warranty', [...current, tag].join(', '));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!formData || !formData.tags_warranty) return;
    handleChange('tags_warranty', formData.tags_warranty.split(',').map((t: string) => t.trim()).filter((t: string) => t !== tagToRemove).join(', '));
  };

  const handleSave = async () => {
    if (!formData) return;
    if (!formData.candidate_name?.trim()) return alert('Họ tên không được để trống');
    if (!formData.phone?.trim()) return alert('Số điện thoại không được để trống');
    if (!/^0\d{9}$/.test(formData.phone)) return alert('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0');
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) return alert('Email không đúng định dạng');
    // Validation nghỉ việc
const stillWorking247 = formData.is_still_working_247 === true || formData.is_still_working_247 === 'TRUE';
const stillWorkingOfficial = formData.is_still_working_official === true || formData.is_still_working_official === 'TRUE';

if (!stillWorking247) {
  if (!formData.resigned_date_247?.trim()) return alert('Vui lòng nhập Ngày nghỉ (247)');
  if (!formData.reason_resigned_247?.trim()) return alert('Vui lòng nhập Lý do nghỉ (247)');
}
if (!stillWorkingOfficial) {
  if (!formData.resigned_date_official?.trim()) return alert('Vui lòng nhập Ngày nghỉ (Official)');
  if (!formData.reason_resigned_official?.trim()) return alert('Vui lòng nhập Lý do nghỉ (Official)');
}

// Cảnh báo nếu đang làm việc nhưng vẫn còn ngày/lý do nghỉ chưa xóa
if (stillWorking247 && (formData.resigned_date_247 || formData.reason_resigned_247)) {
  const ok = window.confirm('⚠️ Ứng viên đang được đánh dấu Còn làm (247) nhưng vẫn còn Ngày nghỉ / Lý do nghỉ. Bạn có muốn lưu không?');
  if (!ok) return;
}
if (stillWorkingOfficial && (formData.resigned_date_official || formData.reason_resigned_official)) {
  const ok = window.confirm('⚠️ Ứng viên đang được đánh dấu Còn làm (Official) nhưng vẫn còn Ngày nghỉ / Lý do nghỉ. Bạn có muốn lưu không?');
  if (!ok) return;
}
    setIsSaving(true);
    try {
      const res = await fetch(API_CONFIG.WARRANTY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', name, user_group, user_id, id: formData.candidate_id, updates: formData }),
      });
      const data = await res.json();
      if (data.success) { alert('Lưu thành công!'); setOriginalData(formData); fetchAllCandidates(); }
    } catch { alert('Lỗi kết nối'); }
    finally { setIsSaving(false); }
  };

  const handleRenew = async () => {
  if (!formData) return;
  const confirm = window.confirm(`Xác nhận khai thác lại ứng viên "${formData.candidate_name}"?`);
  if (!confirm) return;
 setIsRenewing(true);
  try {
    const res = await fetch(API_CONFIG.WARRANTY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'renew', name, user_group, user_id, id: formData.candidate_id, updates: formData }),
    });
    const data = await res.json();
    if (data.success) alert('Đã gửi yêu cầu khai thác lại thành công!');
    else alert('Thất bại: ' + (data.message || 'Lỗi không xác định'));
  } catch { alert('Lỗi kết nối'); }
  finally { setIsRenewing(false); }
};
  
  const handleExportExcel = () => {
    const visCols = columns.filter(c => c.visible);
    const exportData = processedData.map(cand => {
      const row: any = {};
      visCols.forEach(col => {
        row[col.label] = col.id === 'status' ? getWarrantyStatus(cand) : (cand[col.id] || '');
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách bảo hành');
    ws['!cols'] = visCols.map(c => ({ wch: c.width / 7 }));
    XLSX.writeFile(wb, `Bao_hanh_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const toggleColumn = (id: string) => saveViewSettings(columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c), frozenCount);
  const updateWidth = (id: string, width: number) => saveViewSettings(columns.map(c => c.id === id ? { ...c, width } : c), frozenCount);
  const moveColumn = (index: number, dir: 'up' | 'down') => {
    const arr = [...columns];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    saveViewSettings(arr, frozenCount);
  };

  const getFrozenStyle = (colId: string, index: number) => {
    if (index >= frozenCount) return {};
    let left = 0;
    for (let i = 0; i < index; i++) { if (columns[i].visible) left += columns[i].width; }
    return { position: 'sticky' as const, left, zIndex: 20 };
  };

  const resetFilters = () => setFilters({
    status: '', project: '', assigned_247_user: '', tags: '',
    onboard_from: '', onboard_to: '',
    on_job_1_day_from: '', on_job_1_day_to: '',
    on_job_3_day_from: '', on_job_3_day_to: '',
    on_job_7_day_from: '', on_job_7_day_to: '',
    on_job_30_day_from: '', on_job_30_day_to: '',
    resigned_date_from: '', resigned_date_to: '',
    is_still_working_247: '', is_still_working_official: '',
  });

  // Đếm số filter đang active để hiển thị badge
  const activeFilterCount = [
    filters.status, filters.project, filters.assigned_247_user, filters.tags,
    filters.is_still_working_247, filters.is_still_working_official,
    filters.onboard_from, filters.onboard_to,
    filters.on_job_1_day_from, filters.on_job_1_day_to,
    filters.on_job_3_day_from, filters.on_job_3_day_to,
    filters.on_job_7_day_from, filters.on_job_7_day_to,
    filters.on_job_30_day_from, filters.on_job_30_day_to,
    filters.resigned_date_from, filters.resigned_date_to,
  ].filter(Boolean).length;

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden text-sm p-4 gap-3">

      {/* FILTER SIDEBAR */}
      <div className={`flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${showFilters ? 'w-56' : 'w-0 border-0'}`}>
        {showFilters && (
          <>
            <div className="p-3 border-b bg-orange-600 flex items-center justify-between">
              <span className="text-white font-black text-[10px] uppercase tracking-widest">Bộ lọc</span>
              <button onClick={resetFilters} className="text-[9px] font-bold text-orange-200 hover:text-white underline">Xóa tất cả</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">

              {/* Trạng thái */}
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Trạng thái</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {warrantyStatusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Dự án */}
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Dự án</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.project} onChange={e => setFilters(prev => ({ ...prev, project: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Phụ trách 247 */}
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Phụ trách (247)</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.assigned_247_user} onChange={e => setFilters(prev => ({ ...prev, assigned_247_user: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {unique247Users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Nhãn */}
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Nhãn</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.tags} onChange={e => setFilters(prev => ({ ...prev, tags: e.target.value }))}>
                  <option value="">Tất cả</option>
                  {MASTER_DATA.warrantyTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Tình trạng làm việc */}
              <div className="border-t pt-3">
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Tình trạng (247)</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.is_still_working_247} onChange={e => setFilters(prev => ({ ...prev, is_still_working_247: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="true">Còn làm</option>
                  <option value="false">Đã nghỉ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Tình trạng (Official)</label>
                <select className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white focus:border-orange-500"
                  value={filters.is_still_working_official} onChange={e => setFilters(prev => ({ ...prev, is_still_working_official: e.target.value }))}>
                  <option value="">Tất cả</option>
                  <option value="true">Còn làm</option>
                  <option value="false">Đã nghỉ</option>
                </select>
              </div>

              {/* Lọc theo ngày */}
              <div className="border-t pt-3 space-y-3">
                <p className="text-[10px] uppercase font-black text-orange-600">Lọc theo ngày</p>
                {[
                  { label: 'Onboard', f: 'onboard_from', t: 'onboard_to' },
                  { label: 'On-job 1 ngày', f: 'on_job_1_day_from', t: 'on_job_1_day_to' },
                  { label: 'On-job 3 ngày', f: 'on_job_3_day_from', t: 'on_job_3_day_to' },
                  { label: 'On-job 7 ngày', f: 'on_job_7_day_from', t: 'on_job_7_day_to' },
                  { label: 'On-job 30 ngày', f: 'on_job_30_day_from', t: 'on_job_30_day_to' },
                  { label: 'Ngày nghỉ', f: 'resigned_date_from', t: 'resigned_date_to' },
                ].map(({ label, f, t }) => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">{label}</label>
                    <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500 mb-1"
                      value={(filters as any)[f]} onChange={e => setFilters(prev => ({ ...prev, [f]: e.target.value }))} />
                    <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500"
                      value={(filters as any)[t]} onChange={e => setFilters(prev => ({ ...prev, [t]: e.target.value }))} />
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
      </div>

      {/* DANH SÁCH */}
      <div className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${selectedId ? 'flex-1' : 'flex-1'}`}>

<div className="p-3 border-b bg-white">
  <div className="flex items-center gap-2">
    {/* Thanh tìm kiếm */}
    <input
      type="text"
      placeholder="Tìm theo tên, SĐT hoặc mã ứng viên..."
      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    {/* Nút Bộ lọc */}
    <button onClick={() => setShowFilters(!showFilters)}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition
        ${showFilters ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
      </svg>
      Lọc
      {activeFilterCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </button>

    {/* Nút Cột */}
    <button onClick={() => setShowSettings(!showSettings)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition
        ${showSettings ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
      Cột
    </button>

    {/* Nút Xuất Excel */}
    <button onClick={handleExportExcel}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Xuất
    </button>
{canOnsiteEdit && (
  <Link href="/warranty/import"
    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    Import thông tin
  </Link>
)}
    <Link href="/dashboard" className="p-2 text-gray-300 hover:text-red-400 transition">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </Link>
  </div>
</div>

        {/* TABLE */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="text-left border-separate border-spacing-0 w-full">
            <thead className="bg-gray-50 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th key={col.id} onClick={() => col.sortable && handleSort(col.id)}
                    style={{ width: col.width, minWidth: col.width, ...getFrozenStyle(col.id, idx) }}
                    className={`p-3 border-b border-r text-[10px] uppercase font-bold text-gray-600 bg-gray-50 select-none ${col.sortable ? 'cursor-pointer hover:bg-orange-50 hover:text-orange-700' : 'cursor-default'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <div className="flex flex-col text-[8px] leading-[6px]">
                          <span className={sortConfig.key === col.id && sortConfig.direction === 'asc' ? 'text-orange-600 font-bold' : 'text-gray-300'}>▲</span>
                          <span className={sortConfig.key === col.id && sortConfig.direction === 'desc' ? 'text-orange-600 font-bold' : 'text-gray-300'}>▼</span>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(cand => (
                <tr key={cand.candidate_id} onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer transition-colors ${selectedId === cand.candidate_id ? 'bg-orange-50' : 'hover:bg-gray-50 bg-white'}`}>
                  {columns.map((col, idx) => col.visible && (
                    <td key={col.id} style={getFrozenStyle(col.id, idx)} className="p-3 border-r border-b whitespace-nowrap overflow-hidden text-ellipsis bg-inherit">
                      {renderCell(col.id, cand)}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr><td colSpan={columns.filter(c => c.visible).length} className="p-8 text-center text-gray-400 italic">Không tìm thấy dữ liệu phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t flex items-center justify-between text-xs">
            <span className="text-gray-500">Hiển thị {paginatedData.length} / {processedData.length} bản ghi</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">◀</button>
              <span className="px-3 py-1 bg-orange-600 text-white rounded-lg font-bold">{currentPage}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50">▶</button>
            </div>
          </div>
        )}
      </div>

      {/* PANEL CHI TIẾT */}
      {selectedId && (
        <div className="flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden w-1/2 flex-shrink-0">
          {detailLoading
            ? <div className="flex-1 flex items-center justify-center text-gray-400 italic">Đang tải...</div>
            : formData && (
              <>
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedId(null); setFormData(null); }} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
                    <div>
                      <input className="font-bold text-base uppercase text-orange-800 leading-none bg-transparent border-b border-transparent hover:border-orange-300 focus:border-orange-600 outline-none w-full"
                        value={formData.candidate_name} onChange={e => handleChange('candidate_name', e.target.value)} />
                      <span className="text-[12px] font-mono text-gray-400">{formData.candidate_id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2"><button  onClick={handleRenew}  disabled={isRenewing}
  className="px-4 py-2 rounded-xl font-bold transition border border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white hover:shadow-amber-100 shadow-sm whitespace-nowrap"
>{isRenewing ? '⏳ ĐANG GỬI...' : 'KHAI THÁC LẠI'}</button>
                  <button onClick={handleSave} disabled={isSaving || !hasChanges}
                    className={`px-6 py-2 rounded-xl font-bold transition shadow-lg ${hasChanges ? 'bg-orange-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                  </button></div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 scrollbar-thin">

                  {/* TAGS WARRANTY */}
                  <section>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-xl focus-within:border-pink-500 bg-white transition-all">
                      {formData.tags_warranty?.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 rounded-md text-[10px] font-bold border border-pink-100">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 text-xs">×</button>
                        </span>
                      ))}
                      <div className="relative flex-1 min-w-[120px]">
                        <input type="text" placeholder="Thêm nhãn bảo hành..." className="w-full outline-none text-sm bg-transparent"
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) { handleAddTag(val); (e.target as HTMLInputElement).value = ''; }
                            }
                          }}
                        />
                        {showSuggestions && (
                          <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-xl p-1">
                            <p className="text-[9px] text-gray-400 font-bold px-2 py-1 uppercase">Gợi ý nhanh</p>
                            {MASTER_DATA.warrantyTags.map(sTag => (
                              <button key={sTag} onClick={() => { handleAddTag(sTag); setShowSuggestions(false); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-pink-50 hover:text-pink-600 rounded text-xs transition">
                                + {sTag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* 1. PHỄU BẢO HÀNH */}
                  <section>
                    <h3 className="text-[10px] font-black text-orange-500 uppercase mb-3 tracking-[0.2em]">Phễu bảo hành</h3>
                    <div className="flex items-stretch gap-2 pb-2 scrollbar-thin overflow-x-auto">
                      {warrantyFunnelSteps.map(step => {
                        const isActive = formData[step.key] === true || formData[step.key] === 'TRUE';
                        return (
                          <label key={step.key} className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all min-w-[100px] ${isActive ? 'border-orange-600 bg-orange-600 text-white shadow-md font-bold ring-2 ring-orange-100' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                            <span className="text-[9px] mb-2 uppercase text-center leading-tight">{step.label}</span>
                            <input type="checkbox" checked={isActive} onChange={e => handleChange(step.key, e.target.checked)} className="w-4 h-4 rounded-md text-orange-600 focus:ring-orange-500 focus:ring-offset-0" />
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  {/* 2. ELIGIBLE FOR ACCEPTANCE */}
                  <section>
                    <div
                      onClick={() => handleChange('eligible_for_acceptance', !(formData.eligible_for_acceptance === true || formData.eligible_for_acceptance === 'TRUE'))}
                      className={`cursor-pointer w-full p-4 rounded-2xl border-2 text-center transition-all font-black text-sm uppercase tracking-widest select-none
                        ${(formData.eligible_for_acceptance === true || formData.eligible_for_acceptance === 'TRUE')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:border-gray-400'}`}>
                      {(formData.eligible_for_acceptance === true || formData.eligible_for_acceptance === 'TRUE')
                        ? '✅ ĐỦ ĐIỀU KIỆN NGHIỆM THU'
                        : '○ Chưa đủ điều kiện nghiệm thu — Bấm để xác nhận'}
                    </div>
                  </section>

                  {/* 3. CHĂM SÓC THEO MỐC */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-orange-400 pl-3 text-xs uppercase tracking-wider">Chăm sóc theo mốc thời gian</h3>
                    <div className="space-y-3">
                      {[
                        { label: '1 Ngày', dateKey: 'on_job_1_day_date', resultKey: 'on_job_1_day_call_result' },
                        { label: '3 Ngày', dateKey: 'on_job_3_day_date', resultKey: 'on_job_3_day_call_result' },
                        { label: '7 Ngày', dateKey: 'on_job_7_day_date', resultKey: 'on_job_7_day_call_result' },
                        { label: '30 Ngày', dateKey: 'on_job_30_day_date', resultKey: 'on_job_30_day_call_result' },
                      ].map(({ label, dateKey, resultKey }) => (
                        <div key={dateKey} className="grid grid-cols-3 gap-3 items-start p-3 bg-gray-50 rounded-xl border">
                          <div className="flex items-center h-full">
                            <span className="text-xs font-bold text-gray-600 uppercase">Mốc {label}</span>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày (Read Only)</label>
                            <input className={readOnlyClass} value={formData[dateKey] || ''} readOnly />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Kết quả cuộc gọi</label>
                            <select className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:border-orange-500 bg-white text-sm"
                              value={formData[resultKey] || ''} onChange={e => handleChange(resultKey, e.target.value)}>
                              <option value="">-- Chọn kết quả --</option>
                              {MASTER_DATA.callResults.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ghi chú cuộc gọi (247)</label>
                      <textarea className="w-full p-3 border rounded-xl mt-1 h-20 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        value={formData['247_call_note'] || ''} onChange={e => handleChange('247_call_note', e.target.value)} placeholder="Ghi chú..." />
                    </div>
                  </section>

                  {/* 4. TÌNH TRẠNG NGHỈ VIỆC */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-red-400 pl-3 text-xs uppercase tracking-wider">Tình trạng nghỉ việc</h3>
                    <div className="grid grid-cols-2 gap-4">

                      {/* Cột 247 */}
                      <div className={`space-y-3 p-4 rounded-xl border ${can247Edit ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest">247 — Xác nhận</h4>
                          {!can247Edit && <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-bold">Chỉ xem</span>}
                        </div>
                        <div
                          onClick={() => can247Edit && handleChange('is_still_working_247', !(formData.is_still_working_247 === true || formData.is_still_working_247 === 'TRUE'))}
                          className={`w-full p-3 rounded-xl border-2 text-center transition-all font-bold text-xs uppercase select-none
                            ${!can247Edit ? 'cursor-not-allowed' : 'cursor-pointer'}
                            ${(formData.is_still_working_247 === true || formData.is_still_working_247 === 'TRUE') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-300 text-red-600'}`}>
                          {(formData.is_still_working_247 === true || formData.is_still_working_247 === 'TRUE') ? '✅ Còn đang làm việc' : '❌ Đã nghỉ việc'}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày nghỉ (247)</label>
                          <input type="date" disabled={!can247Edit}
                            className={`w-full p-2.5 border rounded-xl mt-1 outline-none ${can247Edit ? 'focus:border-orange-400 bg-white' : 'bg-gray-100 cursor-not-allowed text-gray-500'}`}
                            value={formData.resigned_date_247 || ''} onChange={e => handleChange('resigned_date_247', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do nghỉ (247)</label>
                          <select disabled={!can247Edit}
                            className={`w-full p-2.5 border rounded-xl mt-1 text-sm ${can247Edit ? 'bg-white' : 'bg-gray-100 cursor-not-allowed text-gray-500'}`}
                            value={formData.reason_resigned_247 || ''} onChange={e => handleChange('reason_resigned_247', e.target.value)}>
                            <option value="">-- Chọn lý do --</option>
                            {MASTER_DATA.resignReasons.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Cột Official */}
                      <div className={`space-y-3 p-4 rounded-xl border ${canOnsiteEdit ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Official — Xác nhận</h4>
                          {!canOnsiteEdit && <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-bold">Chỉ xem</span>}
                        </div>
                        <div
                          onClick={() => canOnsiteEdit && handleChange('is_still_working_official', !(formData.is_still_working_official === true || formData.is_still_working_official === 'TRUE'))}
                          className={`w-full p-3 rounded-xl border-2 text-center transition-all font-bold text-xs uppercase select-none
                            ${!canOnsiteEdit ? 'cursor-not-allowed' : 'cursor-pointer'}
                            ${(formData.is_still_working_official === true || formData.is_still_working_official === 'TRUE') ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-300 text-red-600'}`}>
                          {(formData.is_still_working_official === true || formData.is_still_working_official === 'TRUE') ? '✅ Còn đang làm việc' : '❌ Đã nghỉ việc'}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày nghỉ (Official)</label>
                          <input type="date" disabled={!canOnsiteEdit}
                            className={`w-full p-2.5 border rounded-xl mt-1 outline-none ${canOnsiteEdit ? 'focus:border-blue-400 bg-white' : 'bg-gray-100 cursor-not-allowed text-gray-500'}`}
                            value={formData.resigned_date_official || ''} onChange={e => handleChange('resigned_date_official', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do nghỉ (Official)</label>
                          <select disabled={!canOnsiteEdit}
                            className={`w-full p-2.5 border rounded-xl mt-1 text-sm ${canOnsiteEdit ? 'bg-white' : 'bg-gray-100 cursor-not-allowed text-gray-500'}`}
                            value={formData.reason_resigned_official || ''} onChange={e => handleChange('reason_resigned_official', e.target.value)}>
                            <option value="">-- Chọn lý do --</option>
                            {MASTER_DATA.resignReasons.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </div>

                    </div>
                  </section>

                  {/* 5. THÔNG TIN TUYỂN DỤNG — CHỈ XEM */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-blue-600 pl-3 text-xs uppercase tracking-wider">
                      Thông tin tuyển dụng <span className="text-gray-400 font-normal normal-case text-[10px]">(chỉ xem)</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dự án</label>
                        <input className={readOnlyClass} value={formData.project || ''} readOnly />
                      </div>
                      {[
                        { key: 'project_id', label: 'ID Dự án' },
                        { key: 'project_type', label: 'Loại dự án' },
                        { key: 'company', label: 'Công ty' },
                        { key: 'position', label: 'Vị trí' },
                        { key: 'onboard_date', label: 'Ngày onboard' },
                        { key: 'department', label: 'Bộ phận ứng tuyển' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
                          <input className={readOnlyClass} value={formData[key] || ''} readOnly />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 6. NGƯỜI PHỤ TRÁCH */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-gray-500 pl-3 text-xs uppercase tracking-wider">Người phụ trách</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {[
                        { key: 'assigned_user_name', label: 'NV phụ trách (Tuyển dụng)' },
                        { key: 'assigned_user_group', label: 'Nhóm phụ trách (Tuyển dụng)' },
                        { key: 'assigned_247_user_name', label: 'NV phụ trách (247)' },
                        { key: 'assigned_247_user_group', label: 'Nhóm phụ trách (247)' },
                        { key: 'assigned_adminonsite_user_name', label: 'NV phụ trách (Admin Onsite)' },
                        { key: 'assigned_adminonsite_user_group', label: 'Nhóm phụ trách (Admin Onsite)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
                          <input className={readOnlyClass} value={formData[key] || ''} readOnly />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 7. THÔNG TIN CÁ NHÂN */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Giới tính</label>
                        <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.gender || ''} onChange={e => handleChange('gender', e.target.value)}>
                          <option value="">-- Chọn --</option>
                          {MASTER_DATA.genders.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
                        <input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-700" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại khác</label>
                        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.other_phone || ''} onChange={e => handleChange('other_phone', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày sinh</label>
                        <input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Năm sinh</label>
                        <input className={readOnlyClass} value={formData.birth_year || ''} readOnly />
                      </div>
                    </div>
                  </section>

                  {/* 8. CCCD */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin CCCD</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số CCCD</label>
                        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_number || ''} onChange={e => handleChange('id_card_number', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày cấp</label>
                        <input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_date || ''} onChange={e => handleChange('id_card_issued_date', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nơi cấp</label>
                        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_place || ''} onChange={e => handleChange('id_card_issued_place', e.target.value)} />
                      </div>
                    </div>
                  </section>

                  {/* 9. ĐỊA CHỈ */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Địa chỉ thường trú</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số nhà / Tên đường</label>
                          <input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_street || ''} onChange={e => handleChange('address_street', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phường / Xã</label>
                          <input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_ward || ''} onChange={e => handleChange('address_ward', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tỉnh / TP</label>
                          <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_city || ''} onChange={e => handleChange('address_city', e.target.value)}>
                            <option value="">-- Chọn --</option>
                            {MASTER_DATA.cities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <input type="text" value={formData.address_full || ''} readOnly className={readOnlyClass} placeholder="Địa chỉ hiển thị tự động" />
                    </div>
                  </section>

                  {/* 10. HỌC VẤN */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-orange-500 pl-3 text-xs uppercase tracking-wider">Học vấn & Kinh nghiệm</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Trình độ học vấn</label>
                        <select className="w-full p-2.5 border rounded-xl mt-1 bg-white" value={formData.education_level || ''} onChange={e => handleChange('education_level', e.target.value)}>
                          <option value="">-- Chọn trình độ --</option>
                          {MASTER_DATA.educationLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tóm tắt kinh nghiệm</label>
                        <textarea className="w-full p-3 border rounded-xl mt-1 h-24 outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.experience_summary || ''} onChange={e => handleChange('experience_summary', e.target.value)} />
                      </div>
                    </div>
                  </section>

                  {/* 11. TÀI LIỆU */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-blue-400 pl-3 text-xs uppercase tracking-wider">Tài liệu đính kèm</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt trước CCCD</label>
                          {formData.id_card_front_img
                            ? <img src={formData.id_card_front_img} alt="CCCD Trước" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" />
                            : <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt sau CCCD</label>
                          {formData.id_card_back_img
                            ? <img src={formData.id_card_back_img} alt="CCCD Sau" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" />
                            : <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">CV / File đính kèm</label>
                        {formData.attachment_url
                          ? <a href={formData.attachment_url} target="_blank" className="mt-2 flex items-center gap-2 p-3 bg-white border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 transition font-bold">📄 XEM FILE ĐÍNH KÈM</a>
                          : <div className="mt-2 p-3 bg-gray-50 border border-dashed rounded-xl text-gray-400 text-center text-xs">Không có file</div>}
                      </div>
                    </div>
                  </section>

                  {/* 12. HỆ THỐNG */}
                  <section>
                    <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-gray-400 pl-3 text-xs uppercase tracking-wider">Thông tin hệ thống</h3>
                    <div className="space-y-3">
                      {[{ key: 'created_at', label: 'Ngày tạo' }, { key: 'created_by', label: 'Người tạo' }, { key: 'last_updated_at', label: 'Cập nhật cuối' }].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
                          <input className="w-full p-2.5 border rounded-xl mt-1 bg-white text-gray-500 text-xs" value={formData[key] || ''} readOnly />
                        </div>
                      ))}
                    </div>
                  </section>

                </div>
              </>
            )
          }
        </div>
      )}

      {/* SETTINGS OVERLAY */}
      {showSettings && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-2xl z-[100] border rounded-2xl flex flex-col animate-in slide-in-from-right overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-orange-600 text-white">
            <h3 className="font-bold uppercase text-xs tracking-widest">Cấu hình hiển thị</h3>
            <button onClick={() => setShowSettings(false)} className="hover:rotate-90 transition duration-200 text-xl">✕</button>
          </div>
          <div className="p-5 border-b bg-gray-50">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ghim cột đầu tiên</label>
            <input type="number" min="0" max="5" value={frozenCount}
              onChange={e => saveViewSettings(columns, parseInt(e.target.value) || 0)}
              className="w-20 p-2 border rounded-xl text-center font-bold text-orange-600 shadow-inner" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin">
            {columns.map((col, idx) => (
              <div key={col.id} className={`flex items-center gap-3 p-2.5 border rounded-xl text-[11px] transition ${col.visible ? 'border-orange-100 bg-orange-50/30' : 'opacity-50 grayscale bg-gray-50'}`}>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} className="w-4 h-4 rounded text-orange-600" />
                <span className="flex-1 font-bold text-gray-700 truncate">{col.label}</span>
                <input type="number" value={col.width} onChange={e => updateWidth(col.id, parseInt(e.target.value) || 50)} className="w-12 p-1 border rounded text-[10px] text-center bg-white" />
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveColumn(idx, 'up')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-orange-600">▲</button>
                  <button onClick={() => moveColumn(idx, 'down')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-orange-600">▼</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- HELPERS ---
function getWarrantyStatus(cand: any): string {
  const isTrue = (v: any) => v === true || v === 'TRUE';
  if (isTrue(cand.on_job_30_days)) return 'Đã làm 30 ngày';
  if (isTrue(cand.on_job_7_day)) return 'Đã làm 7 ngày';
  if (isTrue(cand.on_job_3_day)) return 'Đã làm 3 ngày';
  if (isTrue(cand.on_job_1_day)) return 'Đã làm 1 ngày';
  if (isTrue(cand.onboard)) return 'Onboard';
  return '—';
}

function renderCell(colId: string, cand: any) {
  const isTrue = (v: any) => v === true || v === 'TRUE';
  switch (colId) {
    case 'tags_warranty':
      return (
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {cand.tags_warranty?.split(',').slice(0, 3).map((t: string) => {
            const tag = t.trim();
            const s = getTagStyles(tag);
            return <span key={tag} className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-tighter shadow-sm ${s.bg} ${s.text} ${s.border}`}>{tag}</span>;
          })}
          {(cand.tags_warranty?.split(',').length ?? 0) > 3 && <span className="text-[9px] text-gray-400 font-bold">...</span>}
        </div>
      );
    case 'candidate_name': return <div className="font-bold text-orange-900 leading-tight">{cand.candidate_name}</div>;
    case 'status': return <WarrantyStatusBadge cand={cand} />;
    case 'onboard_date': return <span className="text-orange-600 font-bold">{cand.onboard_date || '—'}</span>;
    case 'phone': return <span className="font-mono font-medium">{cand.phone}</span>;
    case 'eligible_for_acceptance': return isTrue(cand.eligible_for_acceptance)
      ? <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-100 text-blue-700">ĐỦ ĐIỀU KIỆN</span>
      : <span className="text-gray-300 text-[9px]">—</span>;
    case 'is_still_working_247': return isTrue(cand.is_still_working_247)
      ? <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-green-100 text-green-700">Còn làm</span>
      : <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-600">Đã nghỉ</span>;
    case 'is_still_working_official': return isTrue(cand.is_still_working_official)
      ? <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-green-100 text-green-700">Còn làm</span>
      : <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-600">Đã nghỉ</span>;
    default: return <span className="text-gray-600">{cand[colId] || <span className="text-gray-200">—</span>}</span>;
  }
}

function WarrantyStatusBadge({ cand }: { cand: any }) {
  const common = "px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter shadow-sm inline-block";
  const status = getWarrantyStatus(cand);
  const colorMap: Record<string, string> = {
    'Đã làm 30 ngày': 'bg-orange-700 text-white',
    'Đã làm 7 ngày': 'bg-orange-500 text-white',
    'Đã làm 3 ngày': 'bg-teal-500 text-white',
    'Đã làm 1 ngày': 'bg-cyan-500 text-white',
    'Onboard': 'bg-blue-500 text-white',
    '—': 'bg-gray-200 text-gray-500',
  };
  return <span className={`${common} ${colorMap[status] || 'bg-gray-200 text-gray-500'}`}>{status.toUpperCase()}</span>;
}

export default function WarrantyPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <WarrantyContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
