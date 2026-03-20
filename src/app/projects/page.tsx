'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  project_type: 'Recruiting' | 'Outsourcing' | string;
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

// Màu & icon ribbon theo nội dung tag — thêm tag mới vào đây tùy nhu cầu
const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-red-500 text-white',
  'Ưu tiên':    'bg-orange-500 text-white',
  'Mới':        'bg-blue-500 text-white',
  'Thưởng lớn': 'bg-amber-500 text-white',
  'VIP':        'bg-purple-600 text-white',
};
const TAG_ICONS: Record<string, string> = {
  'Tuyển gấp':  '🔥',
  'Hot':        '🔥',
  'Ưu tiên':    '⚡',
  'Mới':        '✨',
  'Thưởng lớn': '🎁',
  'VIP':        '👑',
};

// Lấy tag đầu tiên có config, hoặc tag đầu tiên bất kỳ
function getFirstTag(tags: string | null): string | null {
  if (!tags) return null;
  const list = tags.split(',').map(t => t.trim()).filter(Boolean);
  return list.find(t => TAG_COLORS[t]) ?? list[0] ?? null;
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'THU NHẬP: THỎA THUẬN';
  const fmt = (n: number) => n >= 1000
    ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} TỶ`
    : `${n} TRIỆU`;
  if (min && max) return `THU NHẬP ${fmt(min)} ĐẾN ${fmt(max)} / THÁNG`;
  if (min) return `THU NHẬP TỪ ${fmt(min)} / THÁNG`;
  return `THU NHẬP ĐẾN ${fmt(max!)} / THÁNG`;
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const status    = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const type      = typeConfig[project.project_type] ?? typeConfig['Outsourcing'];
  const tag       = getFirstTag(project.tags);
  const tagColor  = tag ? (TAG_COLORS[tag] ?? 'bg-gray-700 text-white') : null;
  const tagIcon   = tag ? (TAG_ICONS[tag]  ?? '🏷️') : null;

  const positions = project.position
    ? project.position.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <Link
      href={`/projects/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200 overflow-hidden"
    >
      {/* Ribbon tag — chỉ hiện khi có tag */}
      {tag && tagColor && (
        <div className="absolute top-0 right-0 z-10">
          <div className={`${tagColor} text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-wide`}>
            {tagIcon} {tag}
          </div>
        </div>
      )}

      {/* Logo + tên dự án */}
      <div className="p-4 pb-3 flex gap-3 items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
          {project.icon_job ? (
            <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-xl">{project.project_type === 'Recruiting' ? '🏭' : '🏢'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-orange-700 transition-colors">
            {project.project}
          </h3>
          <p className="text-orange-600 font-semibold text-[11px] uppercase tracking-wide mt-1 truncate">
            {project.company}
          </p>
          <p className="text-gray-400 text-[11px] mt-0.5">{project.address_city}</p>
        </div>
      </div>

      {/* Vị trí — full text, không cắt, chữ to nổi bật */}
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

      {/* Lương — uppercase, nổi bật */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2.5">
          <span className="text-sm">💰</span>
          <span className="text-blue-700 font-black text-[11px] tracking-wide leading-tight">
            {formatSalary(project.salary_min, project.salary_max)}
          </span>
        </div>
      </div>

      {/* Highlight — ngay dưới lương, không khoảng trắng thừa */}
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
      <div className="px-4 py-3">
        <div className="h-9 bg-blue-50 rounded-xl" />
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

// ── Filter Drawer ──────────────────────────────────────────────────────────
interface FilterDrawerProps {
  open: boolean; onClose: () => void;
  filterStatus: string; setFilterStatus: (v: string) => void;
  filterType: string;   setFilterType:   (v: string) => void;
  filterCity: string;   setFilterCity:   (v: string) => void;
  sortBy: string;       setSortBy:       (v: string) => void;
  cities: string[];
  activeFilters: number;
  onReset: () => void;
}

function FilterDrawer({
  open, onClose,
  filterStatus, setFilterStatus,
  filterType,   setFilterType,
  filterCity,   setFilterCity,
  sortBy,       setSortBy,
  cities, activeFilters, onReset,
}: FilterDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside đóng panel trên PC
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Khóa scroll khi mở trên mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const FilterContent = () => (
    <div className="space-y-5 p-4">
      {/* Sắp xếp */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sắp xếp</p>
        {[
          { value: 'newest',      label: 'Mới nhất' },
          { value: 'salary_high', label: 'Lương cao nhất' },
          { value: 'salary_low',  label: 'Lương thấp nhất' },
        ].map(opt => (
          <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[12px] transition ${sortBy === opt.value ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <input type="radio" name="sort" checked={sortBy === opt.value} onChange={() => setSortBy(opt.value)} className="accent-orange-500" />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Trạng thái */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trạng thái</p>
        {Object.keys(statusConfig).map(s => (
          <label key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[12px] transition ${filterStatus === s ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <input type="radio" name="status" checked={filterStatus === s} onChange={() => setFilterStatus(filterStatus === s ? '' : s)} className="accent-orange-500" />
            {s}
          </label>
        ))}
      </div>

      {/* Loại dự án */}
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Loại dự án</p>
        {['Recruiting', 'Outsourcing'].map(t => (
          <label key={t} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[12px] transition ${filterType === t ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <input type="radio" name="type" checked={filterType === t} onChange={() => setFilterType(filterType === t ? '' : t)} className="accent-orange-500" />
            {t}
          </label>
        ))}
      </div>

      {/* Tỉnh thành */}
      {cities.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tỉnh / Thành phố</p>
          <div className="max-h-40 overflow-y-auto">
            {cities.map(c => (
              <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[12px] transition ${filterCity === c ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="city" checked={filterCity === c} onChange={() => setFilterCity(filterCity === c ? '' : c)} className="accent-orange-500" />
                {c}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── MOBILE: bottom sheet ── */}
      <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
            <span className="font-black text-sm">Bộ lọc & Sắp xếp</span>
            {activeFilters > 0 && (
              <button onClick={onReset} className="text-xs text-orange-500 font-bold">Xóa tất cả</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <FilterContent />
          </div>
          <div className="p-4 border-t flex-shrink-0">
            <button onClick={onClose} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl text-sm hover:bg-orange-700 transition">
              Áp dụng{activeFilters > 0 ? ` (${activeFilters} bộ lọc)` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── PC: dropdown panel ── */}
      <div ref={panelRef} className="hidden sm:block absolute top-[56px] right-4 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-orange-600 flex-shrink-0">
          <span className="text-white font-black text-[10px] uppercase tracking-widest">Bộ lọc & Sắp xếp</span>
          {activeFilters > 0 && (
            <button onClick={onReset} className="text-orange-200 text-[10px] font-bold hover:text-white underline">Xóa tất cả</button>
          )}
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <FilterContent />
        </div>
      </div>
    </>
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
  const [showFilters, setShowFilters]   = useState(false);

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

    // Dự án có tag → lên đầu; trong mỗi nhóm sort theo tiêu chí
    result.sort((a, b) => {
      const aPin = getFirstTag(a.tags) ? 1 : 0;
      const bPin = getFirstTag(b.tags) ? 1 : 0;
      if (bPin !== aPin) return bPin - aPin;
      if (sortBy === 'salary_high') return (b.salary_max ?? 0) - (a.salary_max ?? 0);
      if (sortBy === 'salary_low')  return (a.salary_min ?? 0) - (b.salary_min ?? 0);
      return 0;
    });

    return result;
  }, [projects, search, filterStatus, filterType, filterCity, sortBy]);

  const activeFilters = [filterStatus, filterType, filterCity].filter(Boolean).length;
  const resetFilters  = () => { setFilterStatus(''); setFilterType(''); setFilterCity(''); };

  return (
    <div className="relative flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* TOOLBAR */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
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
              className="w-full pl-9 pr-3 py-2 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-400 outline-none text-sm transition"
            />
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
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

      {/* FILTER DRAWER */}
      <FilterDrawer
        open={showFilters}           onClose={() => setShowFilters(false)}
        filterStatus={filterStatus}  setFilterStatus={setFilterStatus}
        filterType={filterType}      setFilterType={setFilterType}
        filterCity={filterCity}      setFilterCity={setFilterCity}
        sortBy={sortBy}              setSortBy={setSortBy}
        cities={cities}              activeFilters={activeFilters}
        onReset={resetFilters}
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
