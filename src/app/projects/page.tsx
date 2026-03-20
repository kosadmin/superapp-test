'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// ── Supabase client (dùng anon key, bảo mật qua RLS sau) ──────────────────
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

// ── Helpers ────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  'Đang tuyển':  { label: 'Đang tuyển',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Tạm dừng':    { label: 'Tạm dừng',    color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'  },
  'Hoàn thành':  { label: 'Hoàn thành',  color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500'   },
  'Hủy':         { label: 'Hủy',         color: 'bg-gray-100 text-gray-500 border-gray-200',          dot: 'bg-gray-400'   },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  'Recruiting':  { label: 'Recruiting',  color: 'bg-orange-100 text-orange-700' },
  'Outsourcing': { label: 'Outsourcing', color: 'bg-purple-100 text-purple-700' },
};

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Thỏa thuận';
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}B` : `${n}Tr`;
  if (min && max) return `${fmt(min)} – ${fmt(max)} / tháng`;
  if (min) return `Từ ${fmt(min)} / tháng`;
  return `Đến ${fmt(max!)} / tháng`;
}

// ── Project Card ───────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const status = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const type   = typeConfig[project.project_type] ?? typeConfig['Outsourcing'];
  const isUrgent = project.status === 'Đang tuyển';

  return (
    <Link
      href={`/projects/${project.project_id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Urgent ribbon */}
      {isUrgent && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl flex items-center gap-1 tracking-wide">
            🔥 Tuyển gấp
          </div>
        </div>
      )}

      {/* Card top: logo + tên */}
      <div className="p-4 pb-3 flex gap-3 items-start">
        {/* Logo / Icon */}
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

      {/* Position tags */}
      {project.position && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1">
            {project.position.split(',').slice(0, 2).map((pos, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] rounded-md border border-gray-100 truncate max-w-[140px]">
                {pos.trim()}
              </span>
            ))}
            {project.position.split(',').length > 2 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded-md border border-gray-100">
                +{project.position.split(',').length - 2}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Highlight info */}
      {project.highlight_info && (
        <div className="mx-4 mb-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-amber-700 text-[10px] font-bold line-clamp-1">🎁 {project.highlight_info}</p>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-gray-50" />

      {/* Salary */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-3 py-2">
          <span className="text-sm">💰</span>
          <span className="text-blue-700 font-bold text-[11px]">
            {formatSalary(project.salary_min, project.salary_max)}
          </span>
        </div>
      </div>

      {/* Footer: badges + ID */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Status */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {/* Type */}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${type.color}`}>
            {type.label}
          </span>
          {/* Headcount */}
          {project.headcount && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500">
              👥 {project.headcount}
            </span>
          )}
        </div>
        {/* Project ID */}
        <span className="text-[9px] font-mono text-gray-300 flex-shrink-0">{project.project_id}</span>
      </div>
    </Link>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-1">
        <div className="h-5 bg-gray-100 rounded-md w-24" />
        <div className="h-5 bg-gray-100 rounded-md w-20" />
      </div>
      <div className="mx-4 mb-3 h-7 bg-amber-50 rounded-lg" />
      <div className="mx-4 border-t border-gray-50" />
      <div className="px-4 py-3">
        <div className="h-8 bg-blue-50 rounded-xl" />
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function ProjectsContent() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterCity, setFilterCity]       = useState('');
  const [sortBy, setSortBy]               = useState<'newest' | 'salary_high' | 'salary_low'>('newest');

  // ── Fetch từ Supabase ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
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
      } catch (err: any) {
        console.error(err);
        setError('Không thể tải danh sách dự án. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // ── Filter & Sort ─────────────────────────────────────────────────────────
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

    if (sortBy === 'salary_high') result.sort((a, b) => (b.salary_max ?? 0) - (a.salary_max ?? 0));
    if (sortBy === 'salary_low')  result.sort((a, b) => (a.salary_min ?? 0) - (b.salary_min ?? 0));

    return result;
  }, [projects, search, filterStatus, filterType, filterCity, sortBy]);

  const activeFilters = [filterStatus, filterType, filterCity].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* ── HEADER / TOOLBAR ─────────────────────────────────────────────── */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
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

          {/* Filter: Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 text-gray-600"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.keys(statusConfig).map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Filter: Type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 text-gray-600"
          >
            <option value="">Tất cả loại</option>
            <option value="Recruiting">Recruiting</option>
            <option value="Outsourcing">Outsourcing</option>
          </select>

          {/* Filter: City */}
          <select
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 text-gray-600"
          >
            <option value="">Tất cả tỉnh thành</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-orange-400 text-gray-600"
          >
            <option value="newest">Mới nhất</option>
            <option value="salary_high">Lương cao nhất</option>
            <option value="salary_low">Lương thấp nhất</option>
          </select>

          {/* Clear filters */}
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterStatus(''); setFilterType(''); setFilterCity(''); }}
              className="relative px-3 py-2 rounded-lg border text-xs font-bold bg-orange-500 text-white border-orange-500"
            >
              Xóa lọc
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilters}
              </span>
            </button>
          )}

          {/* Add new */}
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 border-orange-600 transition ml-auto"
          >
            + Thêm dự án
          </Link>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
            {filtered.length} dự án{search || activeFilters ? ` (lọc từ ${projects.length})` : ''}
          </p>
        )}
      </div>

      {/* ── GRID ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm text-center">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-bold">Thử lại</button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-bold text-sm">Không tìm thấy dự án phù hợp</p>
            <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        {/* Cards grid — 3 cột PC, 2 cột tablet, 1 cột mobile */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────
export default function ProjectsList() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ProjectsContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
