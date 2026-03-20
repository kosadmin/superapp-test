'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// ── Supabase client ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  id: number;
  project_id: string;
  project: string;
  project_type: string;
  company: string;
  address_city: string;
  position: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  highlight_info: string | null;
  headcount: number | null;
  icon_job: string | null;
  tags: string | null;
  hiring_form: string | null;
  deploy_start: string | null;
  deploy_end: string | null;
}

// ── Config ─────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  'Đang tuyển': { label: 'Đang tuyển', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Tạm dừng':   { label: 'Tạm dừng',  color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'  },
  'Hoàn thành': { label: 'Hoàn thành',color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500'   },
  'Hủy':        { label: 'Hủy',       color: 'bg-gray-100 text-gray-500 border-gray-200',          dot: 'bg-gray-400'   },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  'Recruiting':  { label: 'Recruiting',  color: 'bg-orange-100 text-orange-700' },
  'Outsourcing': { label: 'Outsourcing', color: 'bg-purple-100 text-purple-700' },
};

// Tag màu — không dùng icon
// "Tuyển gấp" luôn được ưu tiên đẩy lên đầu trong sort
const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-rose-400 text-white',
  'Ưu tiên':    'bg-orange-500 text-white',
  'Mới':        'bg-blue-500 text-white',
  'Thưởng lớn': 'bg-amber-500 text-white',
  'VIP':        'bg-purple-600 text-white',
};

// Màu fallback cho tag không có trong config — xoay vòng
const FALLBACK_COLORS = [
  'bg-teal-500 text-white',
  'bg-cyan-600 text-white',
  'bg-indigo-500 text-white',
  'bg-pink-500 text-white',
  'bg-lime-600 text-white',
];
function tagColor(tag: string): string {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag];
  const idx = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[idx];
}

// Lấy tag ribbon ưu tiên: "Tuyển gấp" trước, sau đó tag có config, rồi tag đầu tiên
function getRibbonTag(tags: string | null): string | null {
  if (!tags) return null;
  const list = tags.split(',').map(t => t.trim()).filter(Boolean);
  if (list.includes('Tuyển gấp')) return 'Tuyển gấp';
  const withConfig = list.find(t => TAG_COLORS[t]);
  return withConfig ?? list[0] ?? null;
}

// Ưu tiên sort: "Tuyển gấp" = 2, có tag khác = 1, không tag = 0
function tagPriority(tags: string | null): number {
  if (!tags) return 0;
  const list = tags.split(',').map(t => t.trim());
  if (list.includes('Tuyển gấp')) return 2;
  if (list.some(t => t)) return 1;
  return 0;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'THU NHẬP: THỎA THUẬN';
  const fmt = (n: number) => n >= 1000
    ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} TỶ`
    : `${n}`;
  if (min && max) return `THU NHẬP ${fmt(min)} - ${fmt(max)} TRIỆU / THÁNG`;
  if (min) return `THU NHẬP TỪ ${fmt(min)} TRIỆU / THÁNG`;
  return `THU NHẬP ĐẾN ${fmt(max!)} TRIỆU / THÁNG`;
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const status    = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const type      = typeConfig[project.project_type] ?? typeConfig['Outsourcing'];
  const ribbon    = getRibbonTag(project.tags);
  const positions = project.position
    ? project.position.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <Link
      href={`/projects/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200 overflow-hidden"
    >
      {/* Ribbon — chỉ text, không icon */}
      {ribbon && (
        <div className="absolute top-0 right-0 z-10">
          <div className={`${tagColor(ribbon)} text-[8px] font-black px-2 py-0.5 rounded-bl-lg tracking-wide`}>
            {ribbon}
          </div>
        </div>
      )}

      {/* Logo + tên */}
      <div className="p-4 pb-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
          {project.icon_job ? (
            <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-xl">{project.project_type === 'Recruiting' ? '🏭' : '🏢'}</span>
          )}
        </div>
        {/* pr đủ rộng để tên không chạy vào vùng ribbon */}
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-orange-700 transition-colors">
            {project.project}
          </h3>
          <p className="text-orange-600 font-semibold text-[11px] uppercase tracking-wide mt-1 truncate">
            {project.company}
          </p>
          <p className="text-gray-400 text-[11px] mt-0.5">{project.address_city}</p>
        </div>
      </div>

      {/* Vị trí — full text, chữ to */}
      {positions.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-col gap-1.5">
            {positions.map((pos, i) => (
              <span key={i} className="inline-flex items-start gap-2 text-gray-800 font-bold text-[13px] leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-[5px]" />
                <span>{pos}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 border-t border-gray-100" />

      {/* Lương */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2.5">
          <span className="text-sm">💰</span>
          <span className="text-blue-700 font-black text-[11px] tracking-wide">
            {formatSalary(project.salary_min, project.salary_max)}
          </span>
        </div>
      </div>

      {/* Highlight — ngay dưới lương */}
      {project.highlight_info && (
        <div className="px-4 pb-3">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-[10px] font-bold line-clamp-2">🎁 {project.highlight_info}</p>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${type.color}`}>
            {type.label}
          </span>
          {project.headcount && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500">
              👥 {project.headcount}
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono text-gray-300 flex-shrink-0">{project.project_id}</span>
      </div>
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="mx-4 border-t border-gray-100" />
      <div className="px-4 py-3"><div className="h-9 bg-blue-50 rounded-xl" /></div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

// ── Filter Sidebar (PC) — đổ từ phải sang như trang candidate ─────────────
interface FilterSidebarProps {
  show: boolean;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterType: string;   setFilterType:   (v: string) => void;
  filterCity: string;   setFilterCity:   (v: string) => void;
  sortBy: string;       setSortBy:       (v: string) => void;
  cities: string[];
  onReset: () => void;
}

function FilterSidebar({
  show,
  filterStatus, setFilterStatus,
  filterType,   setFilterType,
  filterCity,   setFilterCity,
  sortBy,       setSortBy,
  cities, onReset,
}: FilterSidebarProps) {
  return (
    <div className={`hidden sm:flex flex-col flex-shrink-0 bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${show ? 'w-56' : 'w-0 border-0'}`}>
      {show && (
        <>
          <div className="p-3 border-b bg-orange-600 flex items-center justify-between flex-shrink-0">
            <span className="text-white font-black text-[10px] uppercase tracking-widest">Bộ lọc</span>
            <button onClick={onReset} className="text-[9px] font-bold text-orange-200 hover:text-white underline">Xóa tất cả</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">

            {/* Sắp xếp */}
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Sắp xếp</label>
              <div className="space-y-1">
                {[
                  { value: 'newest',      label: 'Mới nhất' },
                  { value: 'salary_high', label: 'Lương cao nhất' },
                  { value: 'salary_low',  label: 'Lương thấp nhất' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${sortBy === opt.value ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <input type="radio" name="sort" checked={sortBy === opt.value} onChange={() => setSortBy(opt.value)} className="accent-orange-500 w-3 h-3" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Trạng thái</label>
              <div className="space-y-1">
                {Object.keys(statusConfig).map(s => (
                  <label key={s} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${filterStatus === s ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={filterStatus === s} onChange={() => setFilterStatus(filterStatus === s ? '' : s)} className="w-3 h-3 rounded accent-orange-500" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            {/* Loại dự án */}
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Loại dự án</label>
              <div className="space-y-1">
                {['Recruiting', 'Outsourcing'].map(t => (
                  <label key={t} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${filterType === t ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={filterType === t} onChange={() => setFilterType(filterType === t ? '' : t)} className="w-3 h-3 rounded accent-orange-500" />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            {/* Tỉnh thành */}
            {cities.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-black text-gray-400 mb-1.5 block">Tỉnh / Thành phố</label>
                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                  {cities.map(c => (
                    <label key={c} className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] transition ${filterCity === c ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={filterCity === c} onChange={() => setFilterCity(filterCity === c ? '' : c)} className="w-3 h-3 rounded accent-orange-500" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}

// ── Filter Popup (Mobile) ──────────────────────────────────────────────────
interface FilterPopupProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: { status: string; type: string; city: string; sort: string }) => void;
  initial: { status: string; type: string; city: string; sort: string };
  cities: string[];
}

function FilterPopup({ open, onClose, onApply, initial, cities }: FilterPopupProps) {
  const [localStatus, setLocalStatus] = useState(initial.status);
  const [localType,   setLocalType]   = useState(initial.type);
  const [localCity,   setLocalCity]   = useState(initial.city);
  const [localSort,   setLocalSort]   = useState(initial.sort);

  // Sync khi mở popup
  useEffect(() => {
    if (open) {
      setLocalStatus(initial.status);
      setLocalType(initial.type);
      setLocalCity(initial.city);
      setLocalSort(initial.sort);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const activeCount = [localStatus, localType, localCity].filter(Boolean).length;

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-600 rounded-t-2xl flex-shrink-0">
          <span className="text-white font-black text-sm">Bộ lọc & Sắp xếp</span>
          <button onClick={onClose} className="text-orange-200 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Sắp xếp */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sắp xếp</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'newest',      label: 'Mới nhất' },
                { value: 'salary_high', label: 'Lương cao' },
                { value: 'salary_low',  label: 'Lương thấp' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setLocalSort(opt.value)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition ${localSort === opt.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(statusConfig).map(s => (
                <button key={s} onClick={() => setLocalStatus(localStatus === s ? '' : s)}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition text-left ${localStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Loại dự án */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Loại dự án</p>
            <div className="grid grid-cols-2 gap-2">
              {['Recruiting', 'Outsourcing'].map(t => (
                <button key={t} onClick={() => setLocalType(localType === t ? '' : t)}
                  className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition ${localType === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tỉnh thành */}
          {cities.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tỉnh / Thành phố</p>
              <div className="grid grid-cols-2 gap-2">
                {cities.map(c => (
                  <button key={c} onClick={() => setLocalCity(localCity === c ? '' : c)}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition text-left ${localCity === c ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-4 pb-4 pt-3 border-t flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setLocalStatus(''); setLocalType(''); setLocalCity(''); setLocalSort('newest'); }}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition"
          >
            Xóa tất cả
          </button>
          <button
            onClick={() => { onApply({ status: localStatus, type: localType, city: localCity, sort: localSort }); onClose(); }}
            className="flex-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition"
          >
            LỌC{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
function ProjectsContent() {
  const [projects, setProjects]         = useState<Project[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterCity, setFilterCity]     = useState('');
  const [sortBy, setSortBy]             = useState('newest');
  const [showFilters, setShowFilters]   = useState(false);  // PC sidebar
  const [showPopup, setShowPopup]       = useState(false);  // Mobile popup

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from('projects')
          .select(`
            id, project_id, project, project_type, company, address_city,
            position, job_type, salary_min, salary_max, status,
            highlight_info, headcount, icon_job, tags, hiring_form,
            deploy_start, deploy_end
          `)
          .order('created_at', { ascending: false });
        if (sbError) throw sbError;
        setProjects(data || []);
      } catch {
        setError('Không thể tải danh sách dự án. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cities = useMemo(() =>
    Array.from(new Set(projects.map(p => p.address_city).filter(Boolean))).sort(),
    [projects]
  );

  const filtered = useMemo(() => {
    let result = [...projects];
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.project?.toLowerCase().includes(s) ||
        p.company?.toLowerCase().includes(s) ||
        p.project_id?.toLowerCase().includes(s) ||
        p.position?.toLowerCase().includes(s) ||
        p.address_city?.toLowerCase().includes(s)
      );
    }
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterType)   result = result.filter(p => p.project_type === filterType);
    if (filterCity)   result = result.filter(p => p.address_city === filterCity);

    result.sort((a, b) => {
      const aPri = tagPriority(a.tags);
      const bPri = tagPriority(b.tags);
      if (bPri !== aPri) return bPri - aPri;
      if (sortBy === 'salary_high') return (b.salary_max ?? 0) - (a.salary_max ?? 0);
      if (sortBy === 'salary_low')  return (a.salary_min ?? 0) - (b.salary_min ?? 0);
      return 0;
    });
    return result;
  }, [projects, search, filterStatus, filterType, filterCity, sortBy]);

  const activeFilters = [filterStatus, filterType, filterCity].filter(Boolean).length;
  const resetFilters  = () => { setFilterStatus(''); setFilterType(''); setFilterCity(''); setSortBy('newest'); };

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden text-sm p-4 gap-3">

      {/* PC SIDEBAR — đổ từ phải sang giống candidate */}
      <FilterSidebar
        show={showFilters}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterType={filterType}     setFilterType={setFilterType}
        filterCity={filterCity}     setFilterCity={setFilterCity}
        sortBy={sortBy}             setSortBy={setSortBy}
        cities={cities}             onReset={resetFilters}
      />

      {/* MAIN COLUMN */}
      <div className="flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden flex-1">

        {/* TOOLBAR */}
        <div className="p-3 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm dự án, công ty, tỉnh thành..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none transition text-sm"
              />
            </div>

            {/* Nút Lọc — PC mở sidebar, mobile mở popup */}
            <button
              onClick={() => {
                if (window.innerWidth >= 640) setShowFilters(v => !v);
                else setShowPopup(true);
              }}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition
                ${showFilters || activeFilters > 0
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white hover:bg-orange-50 text-gray-600 border-gray-200'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Lọc
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 border-orange-600 transition whitespace-nowrap"
            >
              + Thêm dự án
            </Link>
          </div>

          {!loading && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
              {filtered.length} dự án{search || activeFilters ? ` (lọc từ ${projects.length})` : ''}
            </p>
          )}
        </div>

        {/* GRID */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center">
              {error}
              <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
            </div>
          )}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <span className="text-5xl mb-4">🔍</span>
              <p className="font-bold text-sm">Không tìm thấy dự án phù hợp</p>
              <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE POPUP */}
      <FilterPopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        onApply={({ status, type, city, sort }) => {
          setFilterStatus(status);
          setFilterType(type);
          setFilterCity(city);
          setSortBy(sort);
        }}
        initial={{ status: filterStatus, type: filterType, city: filterCity, sort: sortBy }}
        cities={cities}
      />
    </div>
  );
}

export default function ProjectsList() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ProjectsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
