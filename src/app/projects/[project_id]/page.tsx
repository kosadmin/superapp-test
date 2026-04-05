'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  company_intro: string | null;          // ← thêm mới
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

const TAG_COLORS: Record<string, string> = {
  'Tuyển gấp':  'bg-red-500 text-white',
  'Hot':        'bg-rose-400 text-white',
  'Ưu tiên':    'bg-orange-500 text-white',
  'Mới':        'bg-blue-500 text-white',
  'Thưởng lớn': 'bg-amber-500 text-white',
  'VIP':        'bg-purple-600 text-white',
};
const FALLBACK_TAG_COLORS = ['bg-teal-500 text-white','bg-cyan-600 text-white','bg-indigo-500 text-white','bg-pink-500 text-white'];
const tagColor = (t: string) => TAG_COLORS[t] ?? FALLBACK_TAG_COLORS[t.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%FALLBACK_TAG_COLORS.length];

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Thỏa thuận';
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n%1000===0?0:1)} tỷ` : `${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} triệu / tháng`;
  if (min) return `Từ ${fmt(min)} triệu / tháng`;
  return `Đến ${fmt(max!)} triệu / tháng`;
}

function formatSalaryShort(min: number | null, max: number | null): string {
  if (!min && !max) return 'Thỏa thuận';
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(n%1000===0?0:1)} tỷ` : `${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} triệu`;
  if (min) return `Từ ${fmt(min)} triệu`;
  return `Đến ${fmt(max!)} triệu`;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const p = d.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IconDoc = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const IconProcess = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
  </svg>
);
const IconMoney = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);
const IconShield = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);
const IconGift = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
  </svg>
);
const IconFolder = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
  </svg>
);
const IconNote = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold text-orange-500 uppercase tracking-wide leading-relaxed">{label}</span>
      <span className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{value}</span>
    </div>
  );
}

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

// ── ReqItem: ẩn hoàn toàn khi không có giá trị ──────────────────────────
function ReqItem({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;                       // ← ẩn thay vì "Không yêu cầu"
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-orange-500 text-sm">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-[13px] text-gray-700 mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

// Map card
function MapCard({ mapLink, address }: { mapLink: string; address: string }) {
  return (
    <a href={mapLink} target="_blank" rel="noopener noreferrer"
      className="group block relative rounded-xl overflow-hidden border border-gray-100 hover:border-orange-300 transition-all mb-3">
      <div className="h-28 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="28" x2="200" y2="28" stroke="#64748b" strokeWidth="0.5"/>
          <line x1="0" y1="56" x2="200" y2="56" stroke="#64748b" strokeWidth="0.5"/>
          <line x1="0" y1="84" x2="200" y2="84" stroke="#64748b" strokeWidth="0.5"/>
          <line x1="50" y1="0" x2="50" y2="112" stroke="#64748b" strokeWidth="0.5"/>
          <line x1="100" y1="0" x2="100" y2="112" stroke="#64748b" strokeWidth="0.5"/>
          <line x1="150" y1="0" x2="150" y2="112" stroke="#64748b" strokeWidth="0.5"/>
          <path d="M0 70 Q60 65 100 56 T200 48" stroke="#94a3b8" strokeWidth="2" fill="none"/>
          <path d="M40 0 Q45 40 50 56 T55 112" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
          <path d="M120 0 L118 112" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
          <rect x="55" y="30" width="30" height="20" fill="#bbf7d0" rx="2"/>
          <rect x="90" y="60" width="25" height="15" fill="#bfdbfe" rx="2"/>
          <rect x="125" y="35" width="35" height="18" fill="#fed7aa" rx="2"/>
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <div className="w-7 h-7 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div className="w-1 h-2 bg-red-500 mx-auto"/>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-orange-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            Mở Google Maps ↗
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white">
        <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        <span className="text-[11px] text-gray-600 truncate">{address}</span>
      </div>
    </a>
  );
}

// Action dropdown menu
function ActionMenu({ project, isPrivileged }: { project: ProjectDetail; isPrivileged: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    { label: '+ Thêm dự án',         href: '/projects/new' },
    ...(isPrivileged ? [{ label: '+ Sửa dự án', href: `/projects/${project.project_id}/edit` }] : []),
    // ← truyền project_id để trang thêm ứng viên tự động fill dữ liệu
    { label: '+ Thêm ứng viên',       href: `/candidates/new?project_id=${project.project_id}` },
    { label: '+ Danh sách ứng viên',  href: `/candidates?project=${encodeURIComponent(project.project)}` },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition
          ${open ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'}`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Thao tác</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
          {items.map(item => (
            <Link key={item.href} href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function ProjectDetailContent() {
  const { project_id } = useParams<{ project_id: string }>();
  const { user_group } = useAuth();
  const isPrivileged = ['admin', 'manager'].includes(user_group?.toLowerCase() ?? '');

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!project_id) return;
    (async () => {
      setLoading(true);
      const { data, error: e } = await supabase.from('projects').select('*').eq('project_id', project_id).single();
      if (e || !data) setError('Không tìm thấy dự án.');
      else setProject(data);
      setLoading(false);
    })();
  }, [project_id]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center gap-3 text-gray-400 bg-gray-50">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
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

  const status      = statusConfig[project.status] ?? statusConfig['Đang tuyển'];
  const positions   = project.position?.split(',').map(p => p.trim()).filter(Boolean) ?? [];
  const addressFull = project.adress_full || project.address_city;
  const ageLabel    = project.age_min && project.age_max ? `${project.age_min} – ${project.age_max}`
    : project.age_min ? `Từ ${project.age_min}` : project.age_max ? `Đến ${project.age_max}` : null;

  const tagList = project.tags?.split(',').map(t => t.trim()).filter(Boolean) ?? [];

  const benefitItems = [
    { key: 'meal',      label: 'Bữa ăn',        value: project.benefit_meal },
    { key: 'transport', label: 'Xe đưa đón',     value: project.benefit_transport },
    { key: 'dorm',      label: 'Ký túc xá',      value: project.benefit_dormitory },
    { key: 'equip',     label: 'Trang thiết bị', value: project.benefit_equipment },
  ].filter(b => b.value);

  // ── Sections ────────────────────────────────────────────────────────────

  // ① "Thông tin công việc" (đổi từ "Thông tin chi tiết tuyển dụng")
  const SectionDetail = (
    <Section title="Thông tin công việc" icon={<IconDoc/>}>
      {isPrivileged && <InfoRow label="Loại công việc" value={project.job_type}/>}
      {isPrivileged && <InfoRow label="Loại dự án"     value={project.project_type}/>}
      <InfoRow label="Giới thiệu công ty"   value={project.company_intro}/>  {/* ← thêm mới */}
      <InfoRow label="Mô tả công việc"      value={project.job_description}/>
      <InfoRow label="Bộ phận"              value={project.department}/>
      <InfoRow label="Thời gian làm việc"   value={project.work_schedule}/>
      <InfoRow label="Môi trường làm việc"  value={project.work_environment}/>
      <InfoRow label="Triển khai" value={
        project.deploy_start || project.deploy_end
          ? `${formatDate(project.deploy_start)} → ${formatDate(project.deploy_end)}`
          : null
      }/>
    </Section>
  );

  const SectionSalary = (
    <Section title="Thông tin lương" icon={<IconMoney/>}>
      <InfoRow label="Thu nhập"       value={formatSalary(project.salary_min, project.salary_max)}/>
      <InfoRow label="Chi tiết lương" value={project.salary_detail}/>
      <InfoRow label="Lương thử việc" value={project.probation_salary}/>
    </Section>
  );

  // ② "Chi tiết quyền lợi" (đổi từ "Quyền lợi chi tiết")
  const SectionBenefit = (
    <Section title="Quyền lợi" icon={<IconGift/>}>
      {benefitItems.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
          {benefitItems.map(b => (
            <span key={b.key} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
              <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
              </span>
              {b.label}
            </span>
          ))}
        </div>
      )}
      {project.benefit_specific && (
        <div className={benefitItems.length > 0 ? 'pt-2 border-t border-gray-50' : ''}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Chi tiết quyền lợi</p>
          <div
            className="text-[13px] text-gray-700 leading-relaxed prose prose-sm prose-a:text-orange-500 prose-a:font-bold max-w-none"
            dangerouslySetInnerHTML={{ __html: project.benefit_specific }}
          />
        </div>
      )}
      {benefitItems.length === 0 && !project.benefit_specific && (
        <p className="text-[12px] text-gray-400 italic">Chưa có thông tin</p>
      )}
    </Section>
  );

  // ③ "Yêu cầu công việc" — ReqItem ẩn hoàn toàn khi null (không hiện "Không yêu cầu")
  const SectionRequire = (
    <Section title="Yêu cầu công việc" icon={<IconShield/>}>
      <ReqItem icon="⚤" label="Giới tính" value={project.gender_required}/>
      <ReqItem icon={
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0113 0"/></svg>
      } label="Độ tuổi" value={ageLabel}/>
      <ReqItem icon="🎓" label="Học vấn"                value={project.education_required}/>
      <ReqItem icon="💼" label="Kinh nghiệm"            value={project.experience_required}/>
      <ReqItem icon="👤" label="Ngoại hình / Thể chất"  value={project.appearance_required}/>
      <ReqItem icon="⚙️" label="Kỹ năng"               value={project.skill_required}/>
      <ReqItem icon="🔄" label="Tái tuyển dụng"         value={project.rehire_accepted}/>
    </Section>
  );

  // ④ "Hồ sơ cần chuẩn bị" (đổi từ "Hồ sơ yêu cầu")
  const SectionDocs = (
    <Section title="Hồ sơ cần chuẩn bị" icon={<IconFolder/>}>
      <InfoRow label="Khi đi phỏng vấn" value={project.interview_docs}/>
      <InfoRow label="Khi đi làm"       value={project.onboard_docs}/>
    </Section>
  );

  // ⑤ Labels ngắn gọn cho quy trình
  const SectionProcess = (
    <Section title="Quy trình tuyển dụng" icon={<IconProcess/>}>
      <InfoRow label="Đăng ký & Chốt danh sách" value={project.register_process}/>
      <InfoRow label="Phỏng vấn & Nhận việc"    value={project.interview_process}/>
      <InfoRow label="Đầu mối đón / hỗ trợ"     value={project.pickup_support}/>
      <InfoRow label="Thử việc"                 value={project.probation_info}/>
      <InfoRow label="Thời hạn bảo hành"        value={project.warranty_period}/>
    </Section>
  );

  const SectionNote = project.note ? (
    <Section title="Ghi chú khác" icon={<IconNote/>}>
      <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{project.note}</p>
    </Section>
  ) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">

      {/* ACTION BAR */}
      <div className="flex-shrink-0 bg-white border-b px-4 py-2.5 flex items-center gap-2">
        <Link href="/projects" className="flex items-center gap-1 text-gray-400 hover:text-orange-500 text-xs font-bold transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          <span className="hidden sm:inline">Dự án</span>
        </Link>
        <div className="flex-1"/>
        <ActionMenu project={project} isPrivileged={isPrivileged}/>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 space-y-4">

          {/* HEADER CARD */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">

            {/* Tags + Status */}
            {(tagList.length > 0 || project.status) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border ${status.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}/>{project.status}
                </span>
                {tagList.map(tag => (
                  <span key={tag} className={`${tagColor(tag)} text-[11px] font-black px-3 py-1 rounded-lg tracking-wide shadow-sm`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Logo + tên */}
            <div className="flex gap-4 items-start mb-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
                {project.icon_job
                  ? <img src={project.icon_job} alt={project.company} className="w-full h-full object-contain p-1.5"/>
                  : <span className="text-2xl">{project.project_type === 'Recruiting' ? '🏭' : '🏢'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-black text-gray-900 text-xl leading-tight">{project.project}</h1>
                {positions.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                    {positions.map((pos, i) => (
                      <span key={i} className="text-orange-600 font-semibold text-sm whitespace-nowrap">{pos}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-1.5 mb-4">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/>
              </svg>
              <span className="text-gray-500 text-[12px]">{addressFull}</span>
            </div>

            {/* Metric pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(project.salary_min || project.salary_max) && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <span className="text-base flex-shrink-0">💰</span>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Thu nhập</p>
                    <p className="text-[12px] font-bold text-gray-800 leading-snug">{formatSalaryShort(project.salary_min, project.salary_max)}</p>
                  </div>
                </div>
              )}
              {project.hiring_form && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <span className="text-base flex-shrink-0">📋</span>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Hình thức</p>
                    <p className="text-[12px] font-bold text-gray-800 leading-snug">{project.hiring_form}</p>
                  </div>
                </div>
              )}
              {ageLabel && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <span className="text-base flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0113 0"/></svg>
                  </span>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Độ tuổi</p>
                    <p className="text-[12px] font-bold text-gray-800 leading-snug">{ageLabel}</p>
                  </div>
                </div>
              )}
              {isPrivileged && project.headcount && (
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2.5">
                  <span className="text-base flex-shrink-0">👥</span>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Cần tuyển</p>
                    <p className="text-[12px] font-bold text-gray-800 leading-snug">{project.headcount} người</p>
                  </div>
                </div>
              )}
            </div>

            {/* Highlight */}
            {project.highlight_info && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <span>🎁</span>
                <p className="text-amber-700 font-bold text-[13px]">{project.highlight_info}</p>
              </div>
            )}
          </div>

          {/* ── PC LAYOUT ── */}
          <div className="hidden lg:grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              {SectionDetail}
              {SectionSalary}
              {SectionProcess}
              {SectionNote}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                {project.map_link
                  ? <MapCard mapLink={project.map_link} address={addressFull || project.address_city}/>
                  : (
                    <div className="mb-3 pb-3 border-b border-gray-50">
                      <p className="font-black text-gray-800 text-sm">{project.company}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">{project.address_city}</p>
                    </div>
                  )
                }
                {isPrivileged && project.manager_user && (
                  <div className="mt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quản lý dự án</p>
                    <p className="text-[13px] font-bold text-gray-700">{project.manager_user}</p>
                  </div>
                )}
              </div>
              {SectionBenefit}
              {SectionRequire}
              {SectionDocs}
            </div>
          </div>

          {/* ── MOBILE LAYOUT ── */}
          <div className="lg:hidden space-y-4">
            {project.map_link && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <MapCard mapLink={project.map_link} address={addressFull || project.address_city}/>
              </div>
            )}
            {SectionDetail}
            {SectionSalary}
            {SectionBenefit}
            {SectionRequire}
            {SectionDocs}
            {SectionProcess}
            {SectionNote}
          </div>

          {/* SYSTEM INFO */}
          {isPrivileged && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thông tin hệ thống</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-[12px]">
                {([
                  ['Người tạo',     project.created_by],
                  ['Ngày tạo',      formatDate(project.created_at?.split('T')[0] ?? null)],
                  ['Cập nhật cuối', formatDate(project.last_updated_at?.split('T')[0] ?? null)],
                  ['Quyền riêng tư',project.privacy],
                ] as [string, string | null][]).map(([lbl, val]) => val && val !== '—' ? (
                  <div key={lbl}>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wide">{lbl}</p>
                    <p className="text-gray-600 mt-0.5">{val}</p>
                  </div>
                ) : null)}
              </div>
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
