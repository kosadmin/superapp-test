'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────
interface ProjectDetail {
  id: number;
  project_id: string;
  project: string;
  project_type: string;
  company: string;
  address_city: string;
  address_specific: string | null;
  adress_full: string | null;
  map_link: string | null;
  icon_job: string | null;
  department: string | null;
  position: string | null;
  hiring_form: string | null;
  job_type: string | null;
  headcount: number | null;
  highlight_info: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_detail: string | null;
  probation_salary: string | null;
  work_environment: string | null;
  work_schedule: string | null;
  deploy_start: string | null;
  deploy_end: string | null;
  interview_process: string | null;
  register_process: string | null;
  pickup_support: string | null;
  probation_info: string | null;
  warranty_period: string | null;
  gender_required: string | null;
  age_min: number | null;
  age_max: number | null;
  education_required: string | null;
  experience_required: string | null;
  appearance_required: string | null;
  skill_required: string | null;
  rehire_accepted: string | null;
  interview_docs: string | null;
  onboard_docs: string | null;
  benefit_meal: string | null;
  benefit_transport: string | null;
  benefit_dormitory: string | null;
  benefit_equipment: string | null;
  benefit_specific: string | null;
  job_description: string | null;
  manager_user: string | null;
  manager_user_id: string | null;
  status: string;
  privacy: string | null;
  tags: string | null;
  created_by: string | null;
  created_at: string | null;
  last_updated_at: string | null;
  note: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const statusConfig: Record<string, { color: string; dot: string }> = {
  'Đang tuyển': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Tạm dừng':   { color: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'  },
  'Hoàn thành': { color: 'bg-blue-50 text-blue-700 border-blue-200',           dot: 'bg-blue-500'   },
  'Hủy':        { color: 'bg-gray-100 text-gray-500 border-gray-200',          dot: 'bg-gray-400'   },
};

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Thỏa thuận';
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n%1000===0?0:1)} tỷ` : `${n} triệu`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

// ── Sub-components ─────────────────────────────────────────────────────────

// Row trong bảng thông tin — label cam, value đen
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wide leading-relaxed">{label}</span>
      <span className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{value}</span>
    </div>
  );
}

// Card section wrapper
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-orange-500">{icon}</span>
        <h2 className="font-bold text-gray-800 text-sm tracking-wide">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// Metric pill ở header
function MetricPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value || value === '—') return null;
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-4 py-2.5 min-w-0">
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className="text-[13px] font-bold text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

// Benefit item
function BenefitItem({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide">{label}</p>
        <p className="text-[13px] text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// Requirement item
function ReqItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-orange-500 text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-[13px] text-gray-700 mt-0.5 font-medium">{value || 'Không yêu cầu'}</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function ProjectDetailContent() {
  const { project_id } = useParams<{ project_id: string }>();
  const router = useRouter();
  const { user_group } = useAuth();
  const isAdmin = user_group?.toLowerCase() === 'admin';

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!project_id) return;
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase
        .from('projects')
        .select('*')
        .eq('project_id', project_id)
        .single();
      if (e || !data) setError('Không tìm thấy dự án.');
      else setProject(data);
      setLoading(false);
    })();
  }, [project_id]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center gap-3 text-gray-400">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      Đang tải...
    </div>
  );

  if (error || !project) return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <span className="text-4xl">😕</span>
      <p className="font-bold">{error ?? 'Không tìm thấy dự án'}</p>
      <Link href="/projects" className="text-orange-500 text-sm underline">← Quay lại danh sách</Link>
    </div>
  );

  const status = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const positions = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];
  const ageRange = project.age_min && project.age_max
    ? `${project.age_min} - ${project.age_max}`
    : project.age_min ? `Từ ${project.age_min}` : project.age_max ? `Đến ${project.age_max}` : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">

      {/* ── ACTION BAR ── */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-2.5 flex items-center gap-2 flex-wrap">
        <Link href="/projects" className="flex items-center gap-1 text-gray-400 hover:text-orange-500 text-xs font-bold transition mr-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Dự án
        </Link>

        <div className="flex-1" />

        <Link href="/projects/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
          + Thêm dự án
        </Link>
        {isAdmin && (
          <Link href={`/projects/${project.project_id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 border-orange-500 transition">
            ✏️ Sửa dự án
          </Link>
        )}
        <Link href={`/candidates/new?project=${encodeURIComponent(project.project)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 border-orange-600 transition">
          + Thêm ứng viên
        </Link>
        <Link href={`/candidates?project=${encodeURIComponent(project.project)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold bg-white hover:bg-orange-50 text-gray-600 border-gray-200 transition">
          Danh sách ứng viên
        </Link>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-4">

          {/* ── HEADER CARD ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">

            {/* Top: logo + tên + status */}
            <div className="flex gap-4 items-start mb-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                {project.icon_job
                  ? <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1.5" />
                  : <span className="text-2xl">{project.project_type === 'Recruiting' ? '🏭' : '🏢'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="font-black text-gray-900 text-xl leading-tight">{project.project}</h1>
                    {positions.length > 0 && (
                      <p className="text-orange-600 font-semibold text-sm mt-1">
                        {positions.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${status.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />{project.status}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="text-gray-500 text-[12px]">
                    {[project.adress_full || project.address_specific, project.address_city].filter(Boolean).join(', ')}
                  </span>
                  {project.map_link && (
                    <a href={project.map_link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-bold ml-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      Xem bản đồ
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Highlight */}
            {project.highlight_info && (
              <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <span>🎁</span>
                <p className="text-amber-700 font-bold text-[13px]">{project.highlight_info}</p>
              </div>
            )}

            {/* Metric pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricPill icon="💰" label="Thu nhập" value={`${formatSalary(project.salary_min, project.salary_max)} triệu`} />
              <MetricPill icon="📋" label="Loại hình" value={project.hiring_form ?? '—'} />
              <MetricPill icon="💳" label="Trả lương" value={project.job_type ?? '—'} />
              <MetricPill icon="👥" label="Cần tuyển" value={project.headcount ? `${project.headcount} người` : '—'} />
            </div>

            {/* Tags */}
            {project.tags && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] font-bold">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* ── BODY: 2 columns on desktop ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LEFT — 2/3 */}
            <div className="lg:col-span-2 space-y-4">

              {/* Thông tin chi tiết */}
              <Section title="Thông tin chi tiết tuyển dụng" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              }>
                <InfoRow label="Mô tả công việc" value={project.job_description} />
                <InfoRow label="Bộ phận" value={project.department} />
                <InfoRow label="Thời gian làm việc" value={project.work_schedule} />
                <InfoRow label="Môi trường làm việc" value={project.work_environment} />
                <InfoRow label="Loại dự án" value={project.project_type} />
                <InfoRow label="Triển khai" value={
                  project.deploy_start || project.deploy_end
                    ? `${formatDate(project.deploy_start)} → ${formatDate(project.deploy_end)}`
                    : null
                } />
              </Section>

              {/* Quy trình */}
              <Section title="Quy trình tuyển dụng" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              }>
                <InfoRow label="Quy trình ĐK PV / nhận việc" value={project.register_process} />
                <InfoRow label="Quy trình phỏng vấn" value={project.interview_process} />
                <InfoRow label="Đầu mối đón / hỗ trợ" value={project.pickup_support} />
                <InfoRow label="Quy trình đào tạo" value={project.probation_info} />
                <InfoRow label="Thời hạn bảo hành" value={project.warranty_period} />
              </Section>

              {/* Lương */}
              <Section title="Thông tin lương" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              }>
                <InfoRow label="Thu nhập" value={`${formatSalary(project.salary_min, project.salary_max)} triệu / tháng`} />
                <InfoRow label="Chi tiết lương" value={project.salary_detail} />
                <InfoRow label="Lương thử việc" value={project.probation_salary} />
              </Section>

              {/* Hồ sơ */}
              <Section title="Hồ sơ yêu cầu" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              }>
                <InfoRow label="Khi đi phỏng vấn" value={project.interview_docs} />
                <InfoRow label="Khi đi làm" value={project.onboard_docs} />
              </Section>

            </div>

            {/* RIGHT — 1/3 */}
            <div className="space-y-4">

              {/* Company info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <div className="w-16 h-16 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden mx-auto mb-3">
                  {project.icon_job
                    ? <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1.5" />
                    : <span className="text-3xl">{project.project_type === 'Recruiting' ? '🏭' : '🏢'}</span>}
                </div>
                <p className="font-black text-gray-800 text-sm">{project.company}</p>
                <p className="text-gray-400 text-[11px] mt-0.5">{project.address_city}</p>
                {project.manager_user && (
                  <div className="mt-3 pt-3 border-t border-gray-50 text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quản lý dự án</p>
                    <p className="text-[13px] font-bold text-gray-700">{project.manager_user}</p>
                    {project.project_id && <p className="text-[10px] font-mono text-gray-300 mt-0.5">{project.project_id}</p>}
                  </div>
                )}
              </div>

              {/* Yêu cầu */}
              <Section title="Yêu cầu công việc" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              }>
                <ReqItem icon="⚤" label="Giới tính" value={project.gender_required} />
                <ReqItem icon="🎂" label="Tuổi" value={ageRange} />
                <ReqItem icon="🎓" label="Học vấn" value={project.education_required} />
                <ReqItem icon="💼" label="Kinh nghiệm" value={project.experience_required} />
                <ReqItem icon="👤" label="Ngoại hình / Thể chất" value={project.appearance_required} />
                <ReqItem icon="⚙️" label="Kỹ năng" value={project.skill_required} />
                <ReqItem icon="🔄" label="Tái tuyển dụng" value={project.rehire_accepted} />
              </Section>

              {/* Quyền lợi */}
              <Section title="Quyền lợi" icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>
              }>
                <BenefitItem icon="🍽️" label="Bữa ăn" value={project.benefit_meal} />
                <BenefitItem icon="🚌" label="Xe đưa đón" value={project.benefit_transport} />
                <BenefitItem icon="🏠" label="Ký túc xá" value={project.benefit_dormitory} />
                <BenefitItem icon="🔧" label="Trang thiết bị" value={project.benefit_equipment} />
                <BenefitItem icon="⭐" label="Quyền lợi khác" value={project.benefit_specific} />
              </Section>

            </div>
          </div>

          {/* ── SYSTEM INFO (admin only) ── */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thông tin hệ thống</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-[12px]">
                {[
                  ['Người tạo', project.created_by],
                  ['Ngày tạo', formatDate(project.created_at?.split('T')[0] ?? null)],
                  ['Cập nhật cuối', formatDate(project.last_updated_at?.split('T')[0] ?? null)],
                  ['Quyền riêng tư', project.privacy],
                ].map(([lbl, val]) => val ? (
                  <div key={lbl as string}>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">{lbl}</p>
                    <p className="text-gray-600 mt-0.5">{val}</p>
                  </div>
                ) : null)}
              </div>
              {project.note && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ghi chú nội bộ</p>
                  <p className="text-gray-600 text-[12px] whitespace-pre-line">{project.note}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ProjectDetailContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
