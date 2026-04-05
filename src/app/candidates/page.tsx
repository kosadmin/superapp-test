'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MASTER_DATA } from '@/constants/masterData';
import { API_CONFIG } from '@/constants/masterData';
import * as XLSX from 'xlsx';
import { getOnboardAssignments } from '@/constants/onboardDefaults';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProjectOption {
  project_id: string;
  project: string;
  project_type: string;
  company: string;
  department: string | null;
  position: string | null;
}

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

// --- CONFIG ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  sortable?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tags', label: 'Nhãn', width: 150, visible: true, sortable: false },
  { id: 'candidate_name', label: 'Họ tên', width: 180, visible: true, sortable: true },
  { id: 'status', label: 'Trạng thái', width: 120, visible: true, sortable: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true, sortable: true },
  { id: 'project', label: 'Dự án', width: 150, visible: true, sortable: true },
  { id: 'position', label: 'Vị trí ứng tuyển', width: 150, visible: true, sortable: true },
  { id: 'company', label: 'Công ty', width: 150, visible: true, sortable: true },
  { id: 'interview_date', label: 'Ngày Phỏng vấn', width: 110, visible: true, sortable: true },
  { id: 'onboard_date', label: 'Ngày Nhận việc', width: 110, visible: true, sortable: true },
  { id: 'created_at', label: 'Ngày tạo', width: 140, visible: false, sortable: true },
  { id: 'assigned_user', label: 'ID Nhân viên phụ trách', width: 120, visible: false, sortable: true },
  { id: 'assigned_user_name', label: 'Người phụ trách', width: 150, visible: true, sortable: true },
  { id: 'assigned_user_group', label: 'Nhóm phụ trách', width: 130, visible: false, sortable: true },
  { id: 'other_phone', label: 'Số điện thoại khác', width: 130, visible: false, sortable: true },
  { id: 'candidate_id', label: 'Mã UV', width: 120, visible: false, sortable: true },
  { id: 'id_card_number', label: 'CCCD', width: 130, visible: false, sortable: false },
  { id: 'id_card_issued_date', label: 'Ngày cấp CCCD', width: 130, visible: false, sortable: true },
  { id: 'id_card_issued_place', label: 'Nơi cấp CCCD', width: 150, visible: false, sortable: true },
  { id: 'attachment_url', label: 'File đính kèm', width: 120, visible: false, sortable: false },
  { id: 'date_of_birth', label: 'Ngày sinh', width: 100, visible: false, sortable: true },
  { id: 'birth_year', label: 'Năm sinh', width: 80, visible: false, sortable: true },
  { id: 'gender', label: 'Giới tính', width: 80, visible: false, sortable: true },
  { id: 'address_street', label: 'Số nhà/Tên đường', width: 150, visible: false, sortable: false },
  { id: 'address_ward', label: 'Phường/Xã', width: 120, visible: false, sortable: false },
  { id: 'address_city', label: 'Tỉnh/Thành phố', width: 120, visible: false, sortable: true },
  { id: 'address_full', label: 'Địa chỉ đầy đủ', width: 250, visible: false, sortable: false },
  { id: 'email', label: 'Email', width: 180, visible: false, sortable: true },
  { id: 'education_level', label: 'Trình độ học vấn', width: 150, visible: false, sortable: true },
  { id: 'experience_summary', label: 'Tóm tắt kinh nghiệm làm việc', width: 250, visible: false, sortable: false },
  { id: 'job_wish', label: 'Nguyện vọng công việc', width: 200, visible: false, sortable: false },
  { id: 'take_note', label: 'Ghi chú chăm sóc', width: 200, visible: false, sortable: false },
  { id: 'project_id', label: 'ID dự án', width: 120, visible: false, sortable: true },
  { id: 'project_type', label: 'Loại dự án', width: 120, visible: false, sortable: true },
  { id: 'department', label: 'Bộ phận ứng tuyển', width: 120, visible: false, sortable: true },
  { id: 'data_source_dept', label: 'Bộ phận tạo nguồn', width: 120, visible: false, sortable: true },
  { id: 'data_source_type_group', label: 'Nhóm nguồn', width: 120, visible: false, sortable: true },
  { id: 'data_source_type', label: 'Loại nguồn cụ thể', width: 100, visible: false, sortable: true },
  { id: 'created_by', label: 'Người tạo', width: 120, visible: false, sortable: true },
  { id: 'last_updated_at', label: 'Cập nhật cuối', width: 140, visible: false, sortable: true },
];

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  tags?: string;
  [key: string]: any;
}

// --- MULTI-SELECT FILTER STATE ---
// Các trường multi-select dùng string[] thay vì string
interface FilterState {
  status: string[];      // multi
  project: string[];     // multi
  assigned_user: string[]; // multi
  tags: string[];        // multi
  interview_from: string;
  interview_to: string;
  onboard_from: string;
  onboard_to: string;
}

const DEFAULT_FILTERS: FilterState = {
  status: [], project: [], assigned_user: [], tags: [],
  interview_from: '', interview_to: '',
  onboard_from: '', onboard_to: '',
};

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

// --- MULTI-SELECT CHECKBOX COMPONENT ---
function MultiCheckList({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div>
      <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">{label}</label>
      <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin pr-1">
        {options.map(opt => (
          <label key={opt} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${selected.includes(opt) ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="w-3 h-3 rounded text-orange-500 accent-orange-500"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
function FilterPopup({ open, onClose, onApply, initial, statusOptions, uniqueProjects, uniqueUsers }: {
  open: boolean;
  onClose: () => void;
  onApply: (f: FilterState) => void;
  initial: FilterState;
  statusOptions: string[];
  uniqueProjects: string[];
  uniqueUsers: string[];
}) {
  const [local, setLocal] = useState<FilterState>(initial);
  const set = (patch: Partial<FilterState>) => setLocal(prev => ({ ...prev, ...patch }));

  useEffect(() => { if (open) setLocal(initial); }, [open]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const toggle = (field: 'status' | 'project' | 'assigned_user' | 'tags', val: string) => {
    const cur = local[field] as string[];
    set({ [field]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
  };

  const Chip = ({ field, val }: { field: 'status' | 'project' | 'assigned_user' | 'tags'; val: string }) => {
    const active = (local[field] as string[]).includes(val);
    return (
      <button onClick={() => toggle(field, val)}
        className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition text-left ${active ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
        {val}
      </button>
    );
  };

  const activeCount = local.status.length + local.project.length + local.assigned_user.length + local.tags.length +
    [local.interview_from, local.interview_to, local.onboard_from, local.onboard_to].filter(Boolean).length;

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[65vh] flex flex-col">

        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-600 rounded-t-2xl flex-shrink-0">
          <span className="text-white font-black text-sm">Bộ lọc</span>
          <button onClick={onClose} className="text-orange-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</p>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(s => <Chip key={s} field="status" val={s} />)}
            </div>
          </div>

          {uniqueProjects.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dự án</p>
              <div className="grid grid-cols-2 gap-2">
                {uniqueProjects.map(p => <Chip key={p} field="project" val={p} />)}
              </div>
            </div>
          )}

          {uniqueUsers.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Người phụ trách</p>
              <div className="grid grid-cols-2 gap-2">
                {uniqueUsers.map(u => <Chip key={u} field="assigned_user" val={u} />)}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ngày phỏng vấn</p>
            <div className="flex items-center gap-2">
              <input type="date" value={local.interview_from}
                onChange={e => set({ interview_from: e.target.value })}
                className="flex-1 p-2 border rounded-xl text-xs outline-none focus:border-orange-400 bg-white" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={local.interview_to}
                onChange={e => set({ interview_to: e.target.value })}
                className="flex-1 p-2 border rounded-xl text-xs outline-none focus:border-orange-400 bg-white" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ngày nhận việc</p>
            <div className="flex items-center gap-2">
              <input type="date" value={local.onboard_from}
                onChange={e => set({ onboard_from: e.target.value })}
                className="flex-1 p-2 border rounded-xl text-xs outline-none focus:border-orange-400 bg-white" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={local.onboard_to}
                onChange={e => set({ onboard_to: e.target.value })}
                className="flex-1 p-2 border rounded-xl text-xs outline-none focus:border-orange-400 bg-white" />
            </div>
          </div>

        </div>

        <div className="px-4 pb-4 pt-3 border-t flex gap-2 flex-shrink-0">
          <button onClick={() => setLocal(DEFAULT_FILTERS)}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition">
            Xóa tất cả
          </button>
          <button onClick={() => { onApply(local); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition">
            LỌC{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  const canEditSource = user_group?.toLowerCase() === 'admin';

  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [supabaseProjects, setSupabaseProjects] = useState<ProjectOption[]>([]);

useEffect(() => {
  supabase
    .from('projects')
    .select('project_id, project, project_type, company, department, position')
    .eq('status', 'Đang tuyển')
    .order('project', { ascending: true })
    .then(({ data }) => setSupabaseProjects((data as ProjectOption[]) || []));
}, []);

  const readOnlyClass = "w-full p-2.5 border rounded-xl mt-1 bg-gray-50 text-gray-500";

  useEffect(() => {
    const savedCols = localStorage.getItem('table_columns_config');
    const savedFrozen = localStorage.getItem('table_frozen_count');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setListLoading(true);
    try {
      const res = await fetch(API_CONFIG.CANDIDATE_URL, {
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
  useEffect(() => { setCurrentPage(1); }, [search, filters]);
  // Đọc ?project=... từ URL khi trang load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get('project');
    if (projectParam) {
      setFilters(prev => ({ ...prev, project: [decodeURIComponent(projectParam)] }));
    }
  }, []);

  const processedData = useMemo(() => {
    let result = [...allCandidates];

if (search.trim()) {
  const s = search.toLowerCase().trim();
  result = result.filter(c =>
    (c.candidate_name ? String(c.candidate_name).toLowerCase().includes(s) : false) ||
    (c.phone ? String(c.phone).includes(search) : false) ||
    (c.candidate_id ? String(c.candidate_id).toLowerCase().includes(s) : false)
  );
}

    // Multi-select status filter
    if (filters.status.length > 0) {
      const statusMap: Record<string, string> = {
        'Mới': 'new', 'Quan tâm': 'interested', 'Đăng ký PV': 'scheduled_for_interview',
        'Tham gia PV': 'show_up_for_interview', 'Đỗ PV': 'pass_interview', 'Nhận việc': 'onboard',
        'Từ chối': 'reject_offer', 'Không đạt': 'unqualified',
      };
      result = result.filter(c =>
        filters.status.some(sel => {
          const mappedKey = statusMap[sel];
          if (mappedKey === 'new') return !c.interested && !c.scheduled_for_interview && !c.show_up_for_interview && !c.pass_interview && !c.onboard && !c.reject_offer && !c.unqualified;
          return c[mappedKey];
        })
      );
    }

    // Multi-select project
    if (filters.project.length > 0)
      result = result.filter(c => filters.project.includes(c.project));

    // Multi-select assigned_user
    if (filters.assigned_user.length > 0)
      result = result.filter(c => filters.assigned_user.includes(c.assigned_user_name));

// Thay đoạn filter tags cũ
if (filters.tags.length > 0) {
  result = result.filter(c => {
    if (!c.tags) return false;
    const tagList = String(c.tags).split(',').map((t: string) => t.trim()); // ✅ ép về string
    return filters.tags.some(sel => tagList.includes(sel));
  });
}

    if (filters.interview_from) result = result.filter(c => c.interview_date && c.interview_date >= filters.interview_from);
    if (filters.interview_to) result = result.filter(c => c.interview_date && c.interview_date <= filters.interview_to);
    if (filters.onboard_from) result = result.filter(c => c.onboard_date && c.onboard_date >= filters.onboard_from);
    if (filters.onboard_to) result = result.filter(c => c.onboard_date && c.onboard_date <= filters.onboard_to);

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
  const uniqueUsers = useMemo(() => Array.from(new Set(allCandidates.map(c => c.assigned_user_name).filter(Boolean))), [allCandidates]);
  const statusOptions = ['Mới', 'Quan tâm', 'Đăng ký PV', 'Tham gia PV', 'Đỗ PV', 'Nhận việc', 'Từ chối', 'Không đạt'];

  const saveViewSettings = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('table_columns_config', JSON.stringify(newCols));
    localStorage.setItem('table_frozen_count', newFrozen.toString());
  };

const fetchDetail = async (id: string) => {
  if (selectedId === id) {
    setMobileShowDetail(true); // tap lại → mở lên
    return;
  }
  setSelectedId(id);
  setMobileShowDetail(true);
  setDetailLoading(true);
  try {
    const res = await fetch(API_CONFIG.CANDIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', id, user_group, user_id }),
    });
    const data = await res.json();
    if (data.success) { setFormData(data.data); setOriginalData(data.data); }
  } catch (err) { console.error(err); }
  finally { setDetailLoading(false); }
};

  const birthYear = formData?.date_of_birth ? formData.date_of_birth.split('-')[0] : '';

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      let newData = { ...prev, [field]: value };
      if (field === 'date_of_birth') newData.birth_year = value ? value.split('-')[0] : '';
      const addressFields = ['address_street', 'address_ward', 'address_city'];
      if (addressFields.includes(field)) {
        newData.address_full = [newData.address_street, newData.address_ward, newData.address_city].filter(Boolean).join(' - ');
      }
      const funnelKeys = ['new', 'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard'];
      if (funnelKeys.includes(field)) {
        const idx = funnelKeys.indexOf(field);
        if (value === true) { for (let i = 0; i < idx; i++) newData[funnelKeys[i]] = true; }
        else { for (let i = idx + 1; i < funnelKeys.length; i++) newData[funnelKeys[i]] = false; }
      }
          if (field === 'onboard' && value === true) {
      newData.reject_offer = false;
      newData.unqualified  = false;
    }
    if (field === 'reject_offer' && value === true) {
      newData.onboard     = false;
      newData.unqualified = false;
    }
    if (field === 'unqualified' && value === true) {
      newData.onboard      = false;
      newData.reject_offer = false;
    }
      if (field === 'onboard' || (field === 'onboard_date' && newData.onboard)) {
        if (newData.onboard && newData.onboard_date) {
          const base = new Date(newData.onboard_date);
          const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().split('T')[0]; };
          newData.on_job_1_day_date = addDays(base, 1);
          newData.on_job_3_day_date = addDays(base, 3);
          newData.on_job_7_day_date = addDays(base, 7);
          newData.on_job_30_day_date = addDays(base, 30);
          newData.on_job_1_day = false; newData.on_job_3_day = false; newData.on_job_7_day = false; newData.on_job_30_day = false;
          newData.eligible_for_acceptance = false; newData.is_still_working_247 = true; newData.is_still_working_official = true;
          Object.assign(newData, getOnboardAssignments(newData.project || ''));
} else if (field === 'onboard' && !newData.onboard) {
  newData.on_job_1_day_date = ''; newData.on_job_3_day_date = ''; newData.on_job_7_day_date = ''; newData.on_job_30_day_date = '';
  newData.on_job_1_day = false; newData.on_job_3_day = false; newData.on_job_7_day = false; newData.on_job_30_day = false;
  newData.eligible_for_acceptance = false; newData.is_still_working_247 = false; newData.is_still_working_official = false;
  // THAY Object.assign bằng reset thủ công
  newData.assigned_adminonsite_user = '';
  newData.assigned_adminonsite_user_name = '';
  newData.assigned_adminonsite_user_group = '';
  newData.assigned_247_user = '';
  newData.assigned_247_user_name = '';
  newData.assigned_247_user_group = '';
}
      }
      return newData;
    });
  };

const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const val = e.target.value;
  const found = supabaseProjects.find(p => p.project === val);
  setFormData(prev => prev ? {
    ...prev,
    project:      val,
    project_id:   found?.project_id   || '',
    project_type: found?.project_type || '',
    company:      found?.company      || '',
    department:   found?.department   || prev.department,
    position:     '',
  } : null);
};

  const handleSourceDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => prev ? { ...prev, data_source_dept: val, data_source_type_group: '', data_source_type: '' } : null);
  };

  const handleSourceGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => prev ? { ...prev, data_source_type_group: val, data_source_type: '' } : null);
  };

  const handleSave = async () => {
    if (!formData) return;
    if (formData.scheduled_for_interview && !formData.interview_date) return alert("Vui lòng nhập 'Ngày phỏng vấn' khi đã lên lịch hẹn!");
    if (formData.pass_interview && !formData.onboard_date) return alert("Vui lòng nhập 'Ngày nhận việc' khi ứng viên đã đỗ PV!");
    if (formData.reject_offer && !formData.reason_rejected_offer) return alert("Vui lòng chọn 'Lý do từ chối Offer'!");
    if (formData.unqualified && !formData.reason_unqualified) return alert("Vui lòng chọn 'Lý do không đạt'!");
if (!String(formData.candidate_name || '').trim()) return alert('Họ tên không được để trống');
if (!String(formData.phone || '').trim()) return alert('Số điện thoại không được để trống');
if (!/^0\d{9}$/.test(String(formData.phone || ''))) return alert('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0');
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) return alert('Email không đúng định dạng');
    setIsSaving(true);
    try {
      const res = await fetch(API_CONFIG.CANDIDATE_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', user_group, user_id, id: formData.candidate_id, updates: formData }),
      });
      const data = await res.json();
      if (data.success) { alert('Lưu thành công!'); setOriginalData(formData); }
    } catch { alert('Lỗi kết nối'); }
    finally { setIsSaving(false); }
  };

  const handleAddTag = (tag: string) => {
    if (!formData) return;
const current = formData.tags ? String(formData.tags).split(',').map((t: string) => t.trim()) : [];
    if (!current.includes(tag)) handleChange('tags', [...current, tag].join(', '));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!formData || !formData.tags) return;
handleChange('tags', String(formData.tags).split(',').map((t: string) => t.trim()).filter((t: string) => t !== tagToRemove).join(', '));
  };

  const handleDelete = async () => {
    if (!formData) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ứng viên "${formData.candidate_name}" không?\nHành động này không thể hoàn tác!`)) return;
    setIsSaving(true);
    try {
      const res = await fetch(API_CONFIG.CANDIDATE_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', user_group, user_id, id: formData.candidate_id }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã xóa ứng viên thành công!');
        setAllCandidates(prev => prev.filter(c => c.candidate_id !== formData.candidate_id));
        setSelectedId(null); setFormData(null);
      } else alert('Xóa thất bại: ' + (data.message || 'Lỗi không xác định'));
    } catch { alert('Lỗi kết nối đến hệ thống'); }
    finally { setIsSaving(false); }
  };

  const handleExportExcel = () => {
    const visCols = columns.filter(c => c.visible);
    const exportData = processedData.map(cand => {
      const row: any = {};
      visCols.forEach(col => {
        let value = cand[col.id];
        if (col.id === 'status') {
          if (cand.unqualified) value = 'KHÔNG ĐẠT';
          else if (cand.reject_offer) value = 'TỪ CHỐI';
          else if (cand.onboard) value = 'ĐÃ NHẬN VIỆC';
          else if (cand.pass_interview) value = 'ĐỖ PV';
          else if (cand.show_up_for_interview) value = 'THAM GIA PV';
          else if (cand.scheduled_for_interview) value = 'ĐĂNG KÝ PV';
          else if (cand.interested) value = 'QUAN TÂM';
          else value = 'MỚI';
        }
        row[col.label] = value || '';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách ứng viên');
    ws['!cols'] = visCols.map(c => ({ wch: c.width / 7 }));
    XLSX.writeFile(wb, `Danh_sach_ung_vien_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const activeFilterCount =
    filters.status.length + filters.project.length + filters.assigned_user.length + filters.tags.length +
    [filters.interview_from, filters.interview_to, filters.onboard_from, filters.onboard_to].filter(Boolean).length;

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

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

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
<div className="flex h-full bg-gray-100 overflow-hidden text-xs sm:text-sm p-2 sm:p-4 gap-3">

    {/* FILTER SIDEBAR — chỉ hiện trên desktop */}
    <div className={`hidden sm:flex flex-shrink-0 flex-col bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${showFilters ? 'w-56' : 'w-0 border-0'}`}>
      {showFilters && (
        <>
          <div className="p-3 border-b bg-orange-600 flex items-center justify-between">
            <span className="text-white font-black text-[10px] uppercase tracking-widest">Bộ lọc</span>
            <button onClick={resetFilters} className="text-[9px] font-bold text-orange-200 hover:text-white underline">Xóa tất cả</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            <MultiCheckList label="Trạng thái" options={statusOptions} selected={filters.status}
              onChange={val => setFilters(prev => ({ ...prev, status: val }))} />
            <MultiCheckList label="Dự án" options={uniqueProjects as string[]} selected={filters.project}
              onChange={val => setFilters(prev => ({ ...prev, project: val }))} />
            <MultiCheckList label="Người phụ trách" options={uniqueUsers as string[]} selected={filters.assigned_user}
              onChange={val => setFilters(prev => ({ ...prev, assigned_user: val }))} />
            <MultiCheckList label="Nhãn" options={MASTER_DATA.candidateTags} selected={filters.tags}
              onChange={val => setFilters(prev => ({ ...prev, tags: val }))} />
            <div className="border-t pt-3 space-y-3">
              <p className="text-[10px] uppercase font-black text-orange-600">Lọc theo ngày</p>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Ngày Phỏng vấn</label>
                <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500 mb-1"
                  value={filters.interview_from} onChange={e => setFilters(prev => ({ ...prev, interview_from: e.target.value }))} />
                <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500"
                  value={filters.interview_to} onChange={e => setFilters(prev => ({ ...prev, interview_to: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Ngày Nhận việc</label>
                <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500 mb-1"
                  value={filters.onboard_from} onChange={e => setFilters(prev => ({ ...prev, onboard_from: e.target.value }))} />
                <input type="date" className="w-full p-1 border rounded-md text-[10px] outline-none bg-white focus:border-orange-500"
                  value={filters.onboard_to} onChange={e => setFilters(prev => ({ ...prev, onboard_to: e.target.value }))} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>


      {/* DANH SÁCH */}
      <div className="flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden flex-1">

        {/* TOOLBAR */}
           <div className="p-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT hoặc mã ứng viên..."
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none transition text-xs sm:text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
        {/* Nút Lọc */}
<button
  onClick={() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      setShowFilters(v => !v);
    } else {
      setShowPopup(true);
    }
  }}
  className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold transition
    ${showFilters ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
  <span className="hidden sm:inline">Lọc</span>
  {activeFilterCount > 0 && (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
      {activeFilterCount}
    </span>
  )}
</button>

{/* Nút Cột */}
<button onClick={() => setShowSettings(!showSettings)}
  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold transition
    ${showSettings ? 'bg-orange-500 text-white border-orange-500' : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
  <span className="hidden sm:inline">Cột</span>
</button>

{/* Xuất Excel — ẩn trên mobile */}
<button onClick={handleExportExcel}
  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
  Xuất
</button>

{/* Import — ẩn trên mobile */}
<Link href="/candidates/import"
  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
  Import
</Link>

{/* Thêm mới */}
{!selectedId && (
  <Link href="/candidates/new"
    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 border-orange-600 transition">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span className="hidden sm:inline">Thêm mới</span>
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
                    <td key={col.id} style={getFrozenStyle(col.id, idx)}
                      className="p-3 border-r border-b whitespace-nowrap overflow-hidden text-ellipsis bg-inherit">
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

        {/* PAGINATION */}
        <div className="p-3 border-t bg-white flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-widest">
  <span className="sm:hidden">{processedData.length} UV | {currentPage}/{totalPages || 1}</span>
  <span className="hidden sm:inline">Tổng: {processedData.length} ứng viên | Trang {currentPage}/{totalPages || 1}</span>
</span>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">‹</button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">›</button>
          </div>
        </div>
      </div>

      {/* CHI TIẾT */}
      {selectedId && (
        <div className={`
  fixed inset-0 z-50 flex flex-col bg-white
  sm:relative sm:inset-auto sm:z-auto sm:w-1/2 sm:flex-shrink-0 sm:rounded-xl sm:shadow-xl sm:border
  transition-transform duration-300
  ${mobileShowDetail ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'}
`}>
          {detailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="italic text-gray-400">Đang tải dữ liệu...</span>
            </div>
          ) : formData && (
            <>
              {/* Header Detail */}
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
                  <div>
                    <input
                      className="font-bold text-base uppercase text-orange-800 leading-none bg-transparent border-b border-transparent hover:border-orange-300 focus:border-orange-600 outline-none w-full"
                      value={formData.candidate_name}
                      onChange={e => handleChange('candidate_name', e.target.value)}
                    />
                    <span className="text-[12px] font-mono text-gray-400">{formData.candidate_id}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user_group?.toLowerCase() === 'admin' && (
                    <button onClick={handleDelete} disabled={isSaving}
                      className="px-4 py-2 rounded-xl font-bold transition border border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white shadow-sm whitespace-nowrap">
                      🗑️ XÓA
                    </button>
                  )}
                  <button onClick={handleSave} disabled={isSaving || !hasChanges}
                    className={`px-6 py-2 rounded-xl font-bold transition shadow-lg ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    <span className="sm:hidden">{isSaving ? '...' : 'Lưu'}</span>
                    <span className="hidden sm:inline">{isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}</span>
                  </button>
                </div>
              </div>

              {/* Body Detail */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 sm:space-y-8 pb-24 scrollbar-thin">

                {/* TAGS */}
                <section className="relative">
                  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-xl focus-within:border-orange-500 bg-white transition-all">
                    {formData.tags?.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 text-xs">×</button>
                      </span>
                    ))}
                    <div className="relative flex-1 min-w-[120px]">
                      <input type="text" placeholder="Thêm nhãn..." className="w-full outline-none text-sm bg-transparent"
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
                          {MASTER_DATA.candidateTags.map(sTag => (
                            <button key={sTag} onClick={() => { handleAddTag(sTag); setShowSuggestions(false); }}
                              className="w-full text-left px-3 py-1.5 hover:bg-orange-50 hover:text-orange-600 rounded text-xs transition">
                              + {sTag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

{/* FUNNEL */}
<section className="bg-white rounded-2xl">
  <h3 className="text-[10px] font-black text-orange-400 uppercase mb-4 tracking-[0.2em] px-1">
    Tiến độ tuyển dụng
  </h3>

  {/* Stepper giống trang tạo mới */}
  <div className="relative overflow-x-auto pb-1">
    {/* Background line */}
    <div className="hidden sm:block absolute h-0.5 bg-gray-200 z-0"
      style={{ top: '20px', left: '4%', right: '4%' }} />
    {/* Active orange line — tính từ bước chính cuối active */}
    {(() => {
      const mainKeys = ['new','interested','scheduled_for_interview','show_up_for_interview','pass_interview','onboard'];
      let lastIdx = -1;
      for (let i = mainKeys.length - 1; i >= 0; i--) {
        if (formData[mainKeys[i]]) { lastIdx = i; break; }
      }
      const totalSteps = 8; // 6 main + divider + 2 neg = 8 slots
      const lineW = lastIdx <= 0 ? '0%' : `${(lastIdx / (totalSteps - 1)) * 88}%`;
      return (
        <div className="hidden sm:block absolute h-0.5 bg-orange-500 z-0 transition-all duration-300"
          style={{ top: '20px', left: '4%', width: lineW }} />
      );
    })()}

    <div className="grid grid-cols-4 sm:flex sm:items-start gap-y-4 sm:gap-0 sm:justify-between relative z-10">
      {[
        { key: 'new',                     label: 'Mới',         locked: true,  isNeg: false },
        { key: 'interested',              label: 'Quan tâm',    locked: false, isNeg: false },
        { key: 'scheduled_for_interview', label: 'Đăng ký PV',  locked: false, isNeg: false },
        { key: 'show_up_for_interview',   label: 'Tham gia PV', locked: false, isNeg: false },
        { key: 'pass_interview',          label: 'Đỗ PV',       locked: false, isNeg: false },
        { key: 'onboard',                 label: 'Nhận việc',   locked: false, isNeg: false },
        { key: 'reject_offer',            label: 'Từ chối',     locked: false, isNeg: true  },
        { key: 'unqualified',             label: 'Không đạt',   locked: false, isNeg: true  },
      ].map((step, i) => {
        const active = !!formData[step.key];
        const showDivider = step.isNeg && i === 6;
        return (
          <React.Fragment key={step.key}>
            {showDivider && (
              <div className="hidden sm:flex items-center self-start pt-4">
                <div className="w-px h-6 bg-gray-200 mx-1" />
              </div>
            )}
            <button
              type="button"
              disabled={step.locked}
              onClick={() => !step.locked && handleChange(step.key, !active)}
              className="flex flex-col items-center gap-1.5 sm:flex-1 group focus:outline-none min-w-0"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-sm
                ${active && !step.isNeg ? 'bg-orange-500 border-orange-500 text-white shadow-orange-100' : ''}
                ${active && step.isNeg  ? 'bg-gray-500 border-gray-500 text-white shadow-gray-100' : ''}
                ${!active && !step.locked ? 'bg-white border-gray-300 text-gray-400 group-hover:border-orange-400 group-hover:text-orange-400' : ''}
                ${step.locked ? 'cursor-default' : 'cursor-pointer'}`}>
                {active
                  ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  : <span className="text-xs font-black">{step.isNeg ? '✕' : i + 1}</span>
                }
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight transition-colors px-0.5
                ${active && !step.isNeg ? 'text-orange-600' : ''}
                ${active && step.isNeg  ? 'text-gray-600'   : ''}
                ${!active               ? 'text-gray-400 group-hover:text-gray-500' : ''}`}>
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  </div>

  {/* Conditional fields bên dưới phễu */}
  {(formData.scheduled_for_interview || formData.pass_interview || formData.reject_offer || formData.unqualified) && (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {formData.scheduled_for_interview && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày phỏng vấn</label>
          <input type="date" value={formData.interview_date || ''} onChange={e => handleChange('interview_date', e.target.value)}
            className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:border-orange-400 bg-white" />
        </div>
      )}
      {formData.pass_interview && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày nhận việc</label>
          <input type="date" value={formData.onboard_date || ''} onChange={e => handleChange('onboard_date', e.target.value)}
            className="w-full p-2.5 border rounded-xl mt-1 outline-none focus:border-orange-400 bg-white" />
        </div>
      )}
      {formData.reject_offer && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do từ chối offer</label>
          <select value={formData.reason_rejected_offer || ''} onChange={e => handleChange('reason_rejected_offer', e.target.value)}
            className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-white">
            <option value="">-- Chọn lý do --</option>
            {MASTER_DATA.rejectReasonsOffer.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
      {formData.unqualified && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do không đạt</label>
          <select value={formData.reason_unqualified || ''} onChange={e => handleChange('reason_unqualified', e.target.value)}
            className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-white">
            <option value="">-- Chọn lý do --</option>
            {MASTER_DATA.rejectReasonsUnqualified.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}
    </div>
  )}
</section>

                {/* TUYỂN DỤNG */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-orange-600 pl-3 text-xs uppercase tracking-wider">Thông tin tuyển dụng</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dự án <span className="text-red-500">*</span></label>
<select
  className="w-full p-2.5 border rounded-xl mt-1 font-bold text-orange-900 focus:ring-2 focus:ring-orange-500 outline-none"
  value={formData.project || ''}
  onChange={handleProjectChange}
>
  <option value="">-- Chọn dự án --</option>
  {supabaseProjects.map(p => (
    <option key={p.project_id} value={p.project}>{p.project}</option>
  ))}
</select>
                    </div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID Dự án</label><input className={readOnlyClass} value={formData.project_id || ''} readOnly /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Loại dự án</label><input className={readOnlyClass} value={formData.project_type || ''} readOnly /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Công ty</label><input className={readOnlyClass} value={formData.company || ''} readOnly /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vị trí ứng tuyển</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.position || ''} onChange={e => handleChange('position', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bộ phận ứng tuyển</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.department || ''} onChange={e => handleChange('department', e.target.value)} /></div>
                  </div>
                </section>

                {/* CÁ NHÂN */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin cá nhân</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Giới tính</label>
                      <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.gender || ''} onChange={e => handleChange('gender', e.target.value)}>
                        <option value="">-- Chọn giới tính --</option>
                        {MASTER_DATA.genders.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-orange-700" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại khác</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-orange-700" value={formData.other_phone || ''} onChange={e => handleChange('other_phone', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-orange-700" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày sinh</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Năm sinh</label><input className={readOnlyClass} value={formData.birth_year || ''} readOnly /></div>
                  </div>
                </section>

                {/* CCCD */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin CCCD</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số CCCD</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_number || ''} onChange={e => handleChange('id_card_number', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày cấp CCCD</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_date || ''} onChange={e => handleChange('id_card_issued_date', e.target.value)} /></div>
                    <div className="col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nơi cấp CCCD</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_place || ''} onChange={e => handleChange('id_card_issued_place', e.target.value)} /></div>
                  </div>
                </section>

                {/* ĐỊA CHỈ */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Địa chỉ thường trú</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số nhà / Tên đường</label><input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_street || ''} onChange={e => handleChange('address_street', e.target.value)} /></div>
                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phường / Xã</label><input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_ward || ''} onChange={e => handleChange('address_ward', e.target.value)} /></div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tỉnh / Thành phố</label>
                        <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_city || ''} onChange={e => handleChange('address_city', e.target.value)}>
                          <option value="">-- Chọn --</option>
                          {MASTER_DATA.cities.map(item => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </div>
                    </div>
                    <input type="text" value={formData.address_full || ''} readOnly className={readOnlyClass} placeholder="Địa chỉ hiển thị tự động" />
                  </div>
                </section>

                {/* HỌC VẤN */}
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
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tóm tắt kinh nghiệm làm việc</label><textarea className="w-full p-3 border rounded-xl mt-1 h-24 outline-none focus:ring-2 focus:ring-orange-500" value={formData.experience_summary || ''} onChange={e => handleChange('experience_summary', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nguyện vọng công việc</label><textarea className="w-full p-3 border rounded-xl mt-1 h-20 outline-none focus:ring-2 focus:ring-orange-500 text-orange-800" value={formData.job_wish || ''} onChange={e => handleChange('job_wish', e.target.value)} /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ghi chú chăm sóc</label><textarea className="w-full p-3 border rounded-xl mt-1 h-24 outline-none focus:ring-2 focus:ring-orange-500" value={formData.take_note || ''} onChange={e => handleChange('take_note', e.target.value)} /></div>
                  </div>
                </section>

                {/* NGUỒN */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-orange-600 pl-3 text-xs uppercase tracking-wider">Nguồn dữ liệu</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bộ phận tạo nguồn</label>
                      <select disabled={!canEditSource} className={`w-full p-2.5 border rounded-xl mt-1 ${!canEditSource ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} value={formData.data_source_dept || ''} onChange={handleSourceDeptChange}>
                        <option value="">-- Chọn bộ phận --</option>
                        {MASTER_DATA.sourceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nhóm nguồn</label>
                      <select disabled={!canEditSource || !formData.data_source_dept} className={`w-full p-2.5 border rounded-xl mt-1 ${(!canEditSource || !formData.data_source_dept) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} value={formData.data_source_type_group || ''} onChange={handleSourceGroupChange}>
                        <option value="">-- Chọn nhóm --</option>
                        {formData.data_source_dept && MASTER_DATA.sourceTypeGroupsByDept[formData.data_source_dept as keyof typeof MASTER_DATA.sourceTypeGroupsByDept]?.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Loại nguồn cụ thể</label>
                      <select disabled={!canEditSource || !formData.data_source_type_group} className={`w-full p-2.5 border rounded-xl mt-1 ${(!canEditSource || !formData.data_source_type_group) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`} value={formData.data_source_type || ''} onChange={e => handleChange('data_source_type', e.target.value)}>
                        <option value="">-- Chọn loại nguồn --</option>
                        {formData.data_source_type_group && MASTER_DATA.sourceTypesByGroup[formData.data_source_type_group as keyof typeof MASTER_DATA.sourceTypesByGroup]?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-gray-500 pl-3 text-xs uppercase tracking-wider">Người phụ trách (Read Only)</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID Nhân viên</label><input className={readOnlyClass} value={formData.assigned_user || ''} readOnly /></div>
                    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Họ tên nhân viên</label><input className={readOnlyClass} value={formData.assigned_user_name || ''} readOnly /></div>
                    <div className="col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nhóm phụ trách</label><input className={readOnlyClass} value={formData.assigned_user_group || ''} readOnly /></div>
                  </div>
                </section>

                {/* TÀI LIỆU */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-orange-400 pl-3 text-xs uppercase tracking-wider">Tài liệu đính kèm</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt trước CCCD</label>
                        {formData.id_card_front_img ? <img src={formData.id_card_front_img} alt="CCCD Trước" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" /> : <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt sau CCCD</label>
                        {formData.id_card_back_img ? <img src={formData.id_card_back_img} alt="CCCD Sau" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" /> : <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">CV / File đính kèm</label>
                      {formData.attachment_url ? <a href={formData.attachment_url} target="_blank" className="mt-2 flex items-center gap-2 p-3 bg-white border border-orange-200 rounded-xl text-orange-600 hover:bg-orange-50 transition font-bold">📄 XEM FILE ĐÍNH KÈM</a> : <div className="mt-2 p-3 bg-gray-50 border border-dashed rounded-xl text-gray-400 text-center text-xs">Không có file</div>}
                    </div>
                  </div>
                </section>

                {/* HỆ THỐNG */}
                <section>
                  <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-gray-400 pl-3 text-xs uppercase tracking-wider">Thông tin hệ thống</h3>
                  <div className="space-y-3">
                    {['created_at', 'created_by', 'last_updated_at'].map(field => (
                      <div key={field}><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{DEFAULT_COLUMNS.find(c => c.id === field)?.label || field}</label><input className="w-full p-2.5 border rounded-xl mt-1 bg-white text-gray-500 text-xs" value={formData[field] || ''} readOnly /></div>
                    ))}
                  </div>
                </section>

              </div>
            </>
          )}
        </div>
      )}
<FilterPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        onApply={setFilters}
        initial={filters}
        statusOptions={statusOptions}
        uniqueProjects={uniqueProjects as string[]}
        uniqueUsers={uniqueUsers as string[]}
      />

      {/* SETTINGS OVERLAY */}
      {showSettings && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-2xl z-[100] border rounded-2xl flex flex-col animate-in slide-in-from-right overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-orange-600 text-white">
            <h3 className="font-bold uppercase text-xs tracking-widest">Cấu hình hiển thị</h3>
            <button onClick={() => setShowSettings(false)} className="hover:rotate-90 transition duration-200 text-xl">✕</button>
          </div>
          <div className="p-5 border-b bg-gray-50">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ghim cột đầu tiên</label>
            <input type="number" min="0" max="5" value={frozenCount} onChange={e => saveViewSettings(columns, parseInt(e.target.value) || 0)}
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

function renderCell(colId: string, cand: any) {
  switch (colId) {
    case 'tags':
      return (
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {cand.tags?.split(',').slice(0, 3).map((t: string) => {
            const tag = t.trim();
            const s = getTagStyles(tag);
            return <span key={tag} className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-tighter shadow-sm ${s.bg} ${s.text} ${s.border}`}>{tag}</span>;
          })}
          {(cand.tags?.split(',').length ?? 0) > 3 && <span className="text-[9px] text-gray-400 font-bold">...</span>}
        </div>
      );
    case 'candidate_name': return <div className="font-bold text-orange-900 leading-tight">{cand.candidate_name}</div>;
    case 'status': return <StatusBadge cand={cand} />;
    case 'interview_date': return <span className="text-orange-600 font-bold">{cand.interview_date || '—'}</span>;
    case 'onboard_date': return <span className="text-emerald-600 font-bold">{cand.onboard_date || '—'}</span>;
    case 'phone': return <span className="font-mono font-medium">{cand.phone}</span>;
    default: return <span className="text-gray-600">{cand[colId] || <span className="text-gray-200">—</span>}</span>;
  }
}

function StatusBadge({ cand }: { cand: any }) {
  const common = "px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter shadow-sm inline-block";
  if (cand.unqualified) return <span className={`${common} bg-gray-500 text-white`}>KHÔNG ĐẠT</span>;
  if (cand.reject_offer) return <span className={`${common} bg-gray-500 text-white`}>TỪ CHỐI</span>;
  if (cand.onboard) return <span className={`${common} bg-green-600 text-white`}>ĐÃ NHẬN VIỆC</span>;
  if (cand.pass_interview) return <span className={`${common} bg-orange-600 text-white`}>ĐỖ PV</span>;
  if (cand.show_up_for_interview) return <span className={`${common} bg-cyan-500 text-white`}>THAM GIA PV</span>;
  if (cand.scheduled_for_interview) return <span className={`${common} bg-red-500 text-white`}>ĐĂNG KÝ PV</span>;
  if (cand.interested) return <span className={`${common} bg-amber-500 text-white`}>QUAN TÂM</span>;
  return <span className={`${common} bg-gray-200 text-gray-500`}>MỚI</span>;
}

export default function CandidatesList() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <CandidatesContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
