'use client';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SETUP:
 *  - Thêm vào .env.local:
 *      NEXT_PUBLIC_GAS_CANDIDATES_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
 *
 *  - Điều hướng từ trang dự án:
 *      href="/candidates/new?project_id=<project_id>"
 *    → Trang sẽ tự fetch dữ liệu dự án từ Supabase và auto-fill các trường tương ứng.
 *
 *  - Vị trí ứng tuyển: tự động chuyển thành dropdown khi dự án có danh sách vị trí.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { MASTER_DATA } from '@/constants/masterData';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GAS_URL = process.env.NEXT_PUBLIC_GAS_CANDIDATES_URL ?? '';

// ── Types ──────────────────────────────────────────────────────────────────
interface CandidateForm {
  candidate_name: string;
  phone: string;
  other_phone: string;
  gender: string;
  email: string;
  id_card_number: string;
  id_card_issued_date: string;
  id_card_issued_place: string;
  date_of_birth: string;
  address_street: string;
  address_ward: string;
  address_city: string;
  education_level: string;
  experience_summary: string;
  job_wish: string;
  take_note: string;
  project: string;
  project_id: string;
  project_type: string;
  position: string;
  company: string;
  department: string;
  data_source_dept: string;
  data_source_type_group: string;
  data_source_type: string;
  assigned_user: string;
  assigned_user_name: string;
  assigned_user_group: string;
  // Tiến độ tuyển dụng
  new: boolean;
  interested: boolean;
  scheduled_for_interview: boolean;
  show_up_for_interview: boolean;
  pass_interview: boolean;
  onboard: boolean;
  reject_offer: boolean;
  unqualified: boolean;
  interview_date: string;
  onboard_date: string;
  reason_rejected_offer: string;
  reason_unqualified: string;
}

interface FormErrors { [key: string]: string | undefined; }

interface ProjectOption {
  project_id: string;
  project: string;
  project_type: string;
  company: string;
  department: string | null;
  position: string | null;
}

// ── Funnel config ──────────────────────────────────────────────────────────
const MAIN_STEPS = [
  { key: 'new',                    label: 'Mới',          locked: true },
  { key: 'interested',             label: 'Quan tâm',     locked: false },
  { key: 'scheduled_for_interview',label: 'Đăng ký PV',   locked: false },
  { key: 'show_up_for_interview',  label: 'Tham gia PV',  locked: false },
  { key: 'pass_interview',         label: 'Đỗ PV',        locked: false },
  { key: 'onboard',                label: 'Nhận việc',    locked: false },
] as const;

const NEG_STEPS = [
  { key: 'reject_offer', label: 'Từ chối' },
  { key: 'unqualified',  label: 'Không đạt' },
] as const;

// ── Inner form ─────────────────────────────────────────────────────────────
function NewCandidateForm() {
  const { name, user_id, user_group } = useAuth();
  const searchParams = useSearchParams();

  const [loading, setLoading]                   = useState(false);
  const [errors, setErrors]                     = useState<FormErrors>({});
  const [supabaseProjects, setSupabaseProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading]   = useState(true);

  const [form, setForm] = useState<CandidateForm>({
    candidate_name: '', phone: '', other_phone: '', gender: '', email: '',
    id_card_number: '', id_card_issued_date: '', id_card_issued_place: '',
    date_of_birth: '', address_street: '', address_ward: '', address_city: '',
    education_level: '', experience_summary: '', job_wish: '', take_note: '',
    project: '', project_id: '', project_type: '', position: '', company: '', department: '',
    data_source_dept: '', data_source_type_group: '', data_source_type: '',
    assigned_user: '', assigned_user_name: '', assigned_user_group: '',
    // Funnel — new luôn true
    new: true,
    interested: false, scheduled_for_interview: false,
    show_up_for_interview: false, pass_interview: false,
    onboard: false, reject_offer: false, unqualified: false,
    interview_date: '', onboard_date: '',
    reason_rejected_offer: '', reason_unqualified: '',
  });

  // ── Load dự án từ Supabase ─────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('projects')
      .select('project_id, project, project_type, company, department, position')
      .eq('status', 'Đang tuyển')
      .order('project', { ascending: true })
      .then(({ data }) => {
        setSupabaseProjects((data as ProjectOption[]) || []);
        setProjectsLoading(false);
      });
  }, []);

  // ── Auto-fill từ URL param ?project_id=... ─────────────────────────────
  useEffect(() => {
    if (projectsLoading) return;
    const projectIdParam = searchParams.get('project_id');
    if (!projectIdParam) return;
    const found = supabaseProjects.find(p => p.project_id === projectIdParam);
    if (!found) return;
    setForm(prev => ({
      ...prev,
      project:      found.project,
      project_id:   found.project_id,
      project_type: found.project_type || '',
      company:      found.company || '',
      department:   found.department || '',
      position:     '',
    }));
  }, [projectsLoading, supabaseProjects, searchParams]);

  // ── Sync người phụ trách ───────────────────────────────────────────────
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      assigned_user:       user_id    ? String(user_id)    : prev.assigned_user,
      assigned_user_name:  name       ? String(name)       : prev.assigned_user_name,
      assigned_user_group: user_group ? String(user_group) : prev.assigned_user_group,
    }));
  }, [user_id, name, user_group]);

  // ── Derived values ─────────────────────────────────────────────────────
  const selectedProject    = supabaseProjects.find(p => p.project === form.project);
  const availablePositions = selectedProject?.position
    ?.split(',').map(p => p.trim()).filter(Boolean) ?? [];

  const availableSourceTypeGroups = form.data_source_dept
    ? (MASTER_DATA.sourceTypeGroupsByDept as Record<string, string[]>)[form.data_source_dept] || []
    : [];
  const availableSourceTypes = form.data_source_type_group
    ? (MASTER_DATA.sourceTypesByGroup as Record<string, string[]>)[form.data_source_type_group] || []
    : [];

  const birthYear   = form.date_of_birth ? form.date_of_birth.split('-')[0] : '';
  const addressFull = [form.address_street, form.address_ward, form.address_city].filter(Boolean).join(' - ');

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = (field: keyof CandidateForm, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value } as CandidateForm;

      // Project auto-fill
      if (field === 'project') {
        const found = supabaseProjects.find(p => p.project === (value as string));
        next.project_type = found?.project_type || '';
        next.project_id   = found?.project_id   || '';
        next.company      = found?.company       || '';
        next.department   = found?.department    || '';
        next.position     = '';
      }

      // Source cascade reset
      if (field === 'data_source_dept') {
        next.data_source_type_group = '';
        next.data_source_type       = '';
      } else if (field === 'data_source_type_group') {
        next.data_source_type = '';
      }

      // Funnel cascade logic
      const mainKeys: Array<keyof CandidateForm> = [
        'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard',
      ];
      if (mainKeys.includes(field as keyof CandidateForm)) {
        const idx = mainKeys.indexOf(field as keyof CandidateForm);
        if (value === true) {
          // Tick bước sau → tự tick hết bước trước
          for (let i = 0; i < idx; i++) (next as any)[mainKeys[i]] = true;
          // Untick 2 kết quả tiêu cực nếu tick onboard
          if (field === 'onboard') { next.reject_offer = false; next.unqualified = false; }
        } else {
          // Untick bước trước → tự untick hết bước sau
          for (let i = idx + 1; i < mainKeys.length; i++) (next as any)[mainKeys[i]] = false;
        }
      }

      // Negative outcomes: loại trừ lẫn nhau với nhau và với onboard
      if (field === 'reject_offer' && value === true) { next.onboard = false; next.unqualified = false; }
      if (field === 'unqualified'  && value === true) { next.onboard = false; next.reject_offer = false; }

      return next;
    });

    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: undefined }));
    if (field === 'phone' && value && !/^0\d{9}$/.test(value as string))
      setErrors(prev => ({ ...prev, phone: 'SĐT phải có 10 chữ số và bắt đầu bằng 0' }));
    if (field === 'email' && value && !/\S+@\S+\.\S+/.test(value as string))
      setErrors(prev => ({ ...prev, email: 'Email không đúng định dạng' }));
  };

  const validateForm = () => {
    const e: FormErrors = {};
    if (!form.candidate_name.trim())     e.candidate_name         = 'Họ tên là bắt buộc';
    if (!form.phone.trim())              e.phone                  = 'Số điện thoại là bắt buộc';
    else if (!/^0\d{9}$/.test(form.phone)) e.phone               = 'SĐT phải có 10 chữ số và bắt đầu bằng 0';
    if (!form.data_source_dept)          e.data_source_dept       = 'Vui lòng chọn Bộ phận tạo nguồn';
    if (!form.data_source_type_group)    e.data_source_type_group = 'Vui lòng chọn Nhóm nguồn';
    if (!form.data_source_type)          e.data_source_type       = 'Vui lòng chọn Loại nguồn cụ thể';
    // Funnel validation
    if (form.scheduled_for_interview && !form.interview_date)
      e.interview_date = 'Vui lòng nhập ngày phỏng vấn';
    if (form.pass_interview && !form.onboard_date)
      e.onboard_date = 'Vui lòng nhập ngày nhận việc khi đỗ PV';
    if (form.reject_offer && !form.reason_rejected_offer)
      e.reason_rejected_offer = 'Vui lòng chọn lý do từ chối';
    if (form.unqualified && !form.reason_unqualified)
      e.reason_unqualified = 'Vui lòng chọn lý do không đạt';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit → Google Apps Script (Cách 1: bỏ Content-Type để tránh CORS) ─
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    if (!GAS_URL) { alert('Chưa cấu hình NEXT_PUBLIC_GAS_CANDIDATES_URL'); return; }

    setLoading(true);
    const now = new Date().toISOString();
    try {
      const payload = {
        created_by_name:  name       || 'unknown',
        created_by_id:    user_id    || 'unknown',
        created_by_group: user_group || 'unknown',
        ...form,
        birth_year:       birthYear,
        address_full:     addressFull,
        contacted:        true,
        // Timestamps & creator
        created_at:       now,
        last_updated_at:  now,
        created_by:       user_id ? String(user_id) : '',
      };

      const res = await fetch(GAS_URL, {
        method: 'POST',
        // Không set Content-Type → tránh CORS preflight với GAS
        body: JSON.stringify(payload),
      });

      let success = false;
      try {
        const data = await res.json();
        success = !!data?.success;
        if (!success) throw new Error(data?.error || 'Lỗi từ server');
      } catch {
        success = true;
      }

      if (success) {
        alert('Tạo ứng viên thành công!');
        window.location.href = '/candidates';
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi khi gửi dữ liệu: ' + (err instanceof Error ? err.message : 'Không xác định'));
    } finally {
      setLoading(false);
    }
  };

  // ── Style helpers ──────────────────────────────────────────────────────
  const inp = (field: keyof CandidateForm) =>
    `w-full p-2.5 border rounded-xl mt-1 text-sm outline-none transition focus:bg-white ${
      errors[field as string]
        ? 'border-red-400 focus:border-red-500 bg-red-50/30'
        : 'border-gray-200 focus:border-orange-400 bg-white'
    }`;
  const ro  = 'w-full p-2.5 border rounded-xl mt-1 bg-gray-50 text-gray-500 text-sm cursor-not-allowed';
  const lbl = 'text-[10px] font-bold text-gray-400 uppercase ml-1';
  const err = 'text-red-500 text-[10px] mt-0.5 ml-1 font-medium';

  const SectionHeader = ({ color, label }: { color: string; label: string }) => (
    <h3 className={`font-bold mb-4 border-l-4 pl-3 text-xs uppercase tracking-wider text-gray-800 ${color}`}>{label}</h3>
  );

  // ── Funnel Step Component ──────────────────────────────────────────────
  const FunnelStepper = () => {
    // Tất cả các bước gộp thành 1 hàng: 6 bước chính + 2 kết quả tiêu cực
    const ALL_STEPS = [
      ...MAIN_STEPS.map((s, i) => ({ ...s, index: i, isNeg: false })),
      ...NEG_STEPS.map(s => ({ key: s.key, label: s.label, locked: false, index: -1, isNeg: true })),
    ];

    // Tính chiều rộng đường cam: dựa trên bước chính cuối cùng đang active
    const mainKeys = ['new','interested','scheduled_for_interview','show_up_for_interview','pass_interview','onboard'];
    let lastActiveMainIdx = -1;
    for (let i = mainKeys.length - 1; i >= 0; i--) {
      if (!!(form as any)[mainKeys[i]]) { lastActiveMainIdx = i; break; }
    }
    // 6 bước chính chiếm 6/8 = 75% chiều rộng tổng (8 bước)
    const lineWidth = lastActiveMainIdx <= 0
      ? '0%'
      : `${(lastActiveMainIdx / (ALL_STEPS.length - 1)) * 88}%`;

    return (
      <div>
        {/* Stepper */}
        <div className="relative overflow-x-auto pb-1">
          {/* Connecting line background */}
          <div className="hidden sm:block absolute h-0.5 bg-gray-200 z-0" style={{ top: '20px', left: '4%', right: '4%' }} />
          {/* Active line overlay (chỉ phủ phần bước chính) */}
          <div
            className="hidden sm:block absolute h-0.5 bg-orange-500 z-0 transition-all duration-300"
            style={{ top: '20px', left: '4%', width: lineWidth }}
          />

          <div className="grid grid-cols-4 sm:flex sm:items-start gap-y-4 sm:gap-0 sm:justify-between relative z-10">
            {ALL_STEPS.map((step, i) => {
              const active   = !!(form as any)[step.key];
              const isLocked = step.locked;
              const isNeg    = step.isNeg;
              // Dấu phân cách giữa bước chính cuối và kết quả tiêu cực
              const showDivider = isNeg && i === MAIN_STEPS.length;

              return (
                <React.Fragment key={step.key}>
                  {showDivider && (
                    <div className="hidden sm:flex items-center self-start pt-4">
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => !isLocked && handleChange(step.key as keyof CandidateForm, !active)}
                    className="flex flex-col items-center gap-1.5 sm:flex-1 group focus:outline-none min-w-0"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 shadow-sm
                      ${active && !isNeg  ? 'bg-orange-500 border-orange-500 text-white shadow-orange-100' : ''}
                      ${active && isNeg   ? 'bg-gray-500 border-gray-500 text-white shadow-gray-100' : ''}
                      ${!active && !isLocked ? 'bg-white border-gray-300 text-gray-400 group-hover:border-orange-400 group-hover:text-orange-400' : ''}
                      ${!active && isNeg  ? 'bg-white border-gray-300 text-gray-400 group-hover:border-gray-500 group-hover:text-gray-500' : ''}
                      ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                      {active ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      ) : (
                        <span className="text-xs font-black">{isNeg ? (i === MAIN_STEPS.length ? '✕' : '✕') : i + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold text-center leading-tight transition-colors px-0.5
                      ${active && !isNeg ? 'text-orange-600' : ''}
                      ${active && isNeg  ? 'text-gray-600' : ''}
                      ${!active          ? 'text-gray-400 group-hover:text-gray-500' : ''}`}>
                      {step.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Conditional date & reason fields */}
        {(form.scheduled_for_interview || form.pass_interview || form.reject_offer || form.unqualified) && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {form.scheduled_for_interview && (
              <div>
                <label className={lbl}>Ngày phỏng vấn <span className="text-red-500">*</span></label>
                <input type="date" value={form.interview_date}
                  onChange={e => handleChange('interview_date', e.target.value)}
                  className={inp('interview_date')} />
                {errors.interview_date && <p className={err}>{errors.interview_date}</p>}
              </div>
            )}
            {form.pass_interview && (
              <div>
                <label className={lbl}>Ngày nhận việc <span className="text-red-500">*</span></label>
                <input type="date" value={form.onboard_date}
                  onChange={e => handleChange('onboard_date', e.target.value)}
                  className={inp('onboard_date')} />
                {errors.onboard_date && <p className={err}>{errors.onboard_date}</p>}
              </div>
            )}
            {form.reject_offer && (
              <div>
                <label className={lbl}>Lý do từ chối offer <span className="text-red-500">*</span></label>
                <select value={form.reason_rejected_offer}
                  onChange={e => handleChange('reason_rejected_offer', e.target.value)}
                  className={inp('reason_rejected_offer')}>
                  <option value="">-- Chọn lý do --</option>
                  {MASTER_DATA.rejectReasonsOffer.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.reason_rejected_offer && <p className={err}>{errors.reason_rejected_offer}</p>}
              </div>
            )}
            {form.unqualified && (
              <div>
                <label className={lbl}>Lý do không đạt <span className="text-red-500">*</span></label>
                <select value={form.reason_unqualified}
                  onChange={e => handleChange('reason_unqualified', e.target.value)}
                  className={inp('reason_unqualified')}>
                  <option value="">-- Chọn lý do --</option>
                  {MASTER_DATA.rejectReasonsUnqualified.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.reason_unqualified && <p className={err}>{errors.reason_unqualified}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-100 overflow-hidden flex flex-col text-sm">

      {/* TOP BAR */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.history.back()}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 className="font-black text-orange-700 uppercase tracking-tight text-sm">Tạo mới ứng viên</h1>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => window.history.back()}
            className="px-3 sm:px-4 py-2 rounded-xl border text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition">
            <span className="sm:hidden">Hủy</span>
            <span className="hidden sm:inline">Hủy bỏ</span>
          </button>
          <button type="submit" form="new-candidate-form" disabled={loading}
            className="px-4 sm:px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300 shadow-sm shadow-orange-200 transition flex items-center gap-1.5">
            {loading ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.21-8.58"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
            )}
            <span className="sm:hidden">{loading ? '...' : 'Lưu'}</span>
            <span className="hidden sm:inline">{loading ? 'Đang lưu...' : 'Lưu ứng viên'}</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-4">
        <form id="new-candidate-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* ── CỘT TRÁI ── */}
            <div className="space-y-4">

              {/* THÔNG TIN CÁ NHÂN */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-purple-500" label="Thông tin cá nhân" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="col-span-2">
                    <label className={lbl}>Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" value={form.candidate_name} onChange={e => handleChange('candidate_name', e.target.value)}
                      className={inp('candidate_name')} placeholder="Nguyễn Văn A" />
                    {errors.candidate_name && <p className={err}>{errors.candidate_name}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Giới tính</label>
                    <select value={form.gender} onChange={e => handleChange('gender', e.target.value)} className={inp('gender')}>
                      <option value="">-- Chọn --</option>
                      {MASTER_DATA.genders.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Ngày sinh</label>
                    <input type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} className={inp('date_of_birth')} />
                  </div>
                  <div>
                    <label className={lbl}>Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                      className={inp('phone')} placeholder="090..." />
                    {errors.phone && <p className={err}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Số điện thoại khác</label>
                    <input type="text" value={form.other_phone} onChange={e => handleChange('other_phone', e.target.value)}
                      className={inp('other_phone')} placeholder="090..." />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Email</label>
                    <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                      className={inp('email')} placeholder="example@gmail.com" />
                    {errors.email && <p className={err}>{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* CCCD */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-purple-400" label="Thông tin CCCD" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className={lbl}>Số CCCD</label>
                    <input type="text" value={form.id_card_number} onChange={e => handleChange('id_card_number', e.target.value)} className={inp('id_card_number')} />
                  </div>
                  <div>
                    <label className={lbl}>Ngày cấp</label>
                    <input type="date" value={form.id_card_issued_date} onChange={e => handleChange('id_card_issued_date', e.target.value)} className={inp('id_card_issued_date')} />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Nơi cấp</label>
                    <input type="text" value={form.id_card_issued_place} onChange={e => handleChange('id_card_issued_place', e.target.value)} className={inp('id_card_issued_place')} />
                  </div>
                </div>
              </div>

              {/* ĐỊA CHỈ */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-emerald-500" label="Địa chỉ thường trú" />
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>Số nhà / Tên đường</label>
                      <input type="text" value={form.address_street} onChange={e => handleChange('address_street', e.target.value)} className={inp('address_street')} />
                    </div>
                    <div>
                      <label className={lbl}>Phường / Xã</label>
                      <input type="text" value={form.address_ward} onChange={e => handleChange('address_ward', e.target.value)} className={inp('address_ward')} />
                    </div>
                    <div>
                      <label className={lbl}>Tỉnh / Thành phố</label>
                      <select value={form.address_city} onChange={e => handleChange('address_city', e.target.value)} className={inp('address_city')}>
                        <option value="">-- Chọn --</option>
                        {MASTER_DATA.cities.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Địa chỉ đầy đủ (Tự động)</label>
                    <input type="text" value={addressFull} readOnly className={ro} placeholder="Tự động ghép từ các ô trên" />
                  </div>
                </div>
              </div>

            </div>

            {/* ── CỘT PHẢI ── */}
            <div className="space-y-4">

              {/* HỌC VẤN & KINH NGHIỆM */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-orange-500" label="Học vấn & Kinh nghiệm" />
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Trình độ học vấn</label>
                    <select value={form.education_level} onChange={e => handleChange('education_level', e.target.value)} className={inp('education_level')}>
                      <option value="">-- Chọn trình độ --</option>
                      {MASTER_DATA.educationLevels.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Tóm tắt kinh nghiệm làm việc</label>
                    <textarea rows={3} value={form.experience_summary} onChange={e => handleChange('experience_summary', e.target.value)}
                      className={inp('experience_summary')} placeholder="Các công ty đã làm, vị trí đảm nhiệm..." />
                  </div>
                  <div>
                    <label className={lbl}>Nguyện vọng công việc</label>
                    <textarea rows={2} value={form.job_wish} onChange={e => handleChange('job_wish', e.target.value)}
                      className={inp('job_wish')} placeholder="Mong muốn về lương, môi trường..." />
                  </div>
                  <div>
                    <label className={lbl}>Ghi chú chăm sóc</label>
                    <textarea rows={2} value={form.take_note} onChange={e => handleChange('take_note', e.target.value)}
                      className={inp('take_note')} placeholder="Ghi chú về cách chăm sóc, mốc chăm sóc..." />
                  </div>
                </div>
              </div>

              {/* PHÂN LOẠI TUYỂN DỤNG */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-orange-600" label="Phân loại tuyển dụng" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                  {/* Chọn dự án */}
                  <div className="col-span-2">
                    <label className={lbl}>Dự án</label>
                    <select value={form.project} onChange={e => handleChange('project', e.target.value)}
                      className={inp('project')} disabled={projectsLoading}>
                      <option value="">
                        {projectsLoading ? 'Đang tải danh sách...' : '-- Chọn dự án --'}
                      </option>
                      {supabaseProjects.map(p => (
                        <option key={p.project_id} value={p.project}>{p.project}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Loại dự án (Tự động)</label>
                    <input type="text" value={form.project_type} readOnly className={ro} placeholder="Tự động" />
                  </div>
                  <div>
                    <label className={lbl}>ID Dự án (Tự động)</label>
                    <input type="text" value={form.project_id} readOnly className={ro} placeholder="Tự động" />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Công ty (Tự động)</label>
                    <input type="text" value={form.company} readOnly className={ro} placeholder="Tự động" />
                  </div>

                  {/* Vị trí ứng tuyển */}
                  <div>
                    <label className={lbl}>Vị trí ứng tuyển</label>
                    {availablePositions.length > 0 ? (
                      <select value={form.position} onChange={e => handleChange('position', e.target.value)} className={inp('position')}>
                        <option value="">-- Chọn vị trí --</option>
                        {availablePositions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" value={form.position} onChange={e => handleChange('position', e.target.value)}
                        className={inp('position')} placeholder={form.project ? 'Nhập vị trí' : 'Chọn dự án trước'} />
                    )}
                  </div>

                  <div>
                    <label className={lbl}>Bộ phận ứng tuyển</label>
                    <input type="text" value={form.department} onChange={e => handleChange('department', e.target.value)}
                      className={inp('department')} />
                  </div>
                </div>
              </div>

              {/* TIẾN ĐỘ TUYỂN DỤNG */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-amber-500" label="Tiến độ tuyển dụng" />
                <FunnelStepper />
              </div>

              {/* NGUỒN & PHỤ TRÁCH */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader color="border-pink-500" label="Nguồn dữ liệu & Phụ trách" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className={lbl}>Bộ phận tạo nguồn <span className="text-red-500">*</span></label>
                    <select value={form.data_source_dept} onChange={e => handleChange('data_source_dept', e.target.value)} className={inp('data_source_dept')}>
                      <option value="">-- Chọn bộ phận --</option>
                      {MASTER_DATA.sourceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.data_source_dept && <p className={err}>{errors.data_source_dept}</p>}
                  </div>
                  <div>
                    <label className={lbl}>Nhóm nguồn <span className="text-red-500">*</span></label>
                    <select value={form.data_source_type_group} onChange={e => handleChange('data_source_type_group', e.target.value)}
                      className={inp('data_source_type_group')} disabled={!form.data_source_dept}>
                      <option value="">-- Chọn nhóm --</option>
                      {availableSourceTypeGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {errors.data_source_type_group && <p className={err}>{errors.data_source_type_group}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Loại nguồn cụ thể <span className="text-red-500">*</span></label>
                    <select value={form.data_source_type} onChange={e => handleChange('data_source_type', e.target.value)}
                      className={inp('data_source_type')} disabled={!form.data_source_type_group}>
                      <option value="">-- Chọn nguồn --</option>
                      {availableSourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.data_source_type && <p className={err}>{errors.data_source_type}</p>}
                  </div>

                  <div className="col-span-2 border-t pt-3 mt-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Người phụ trách (Tự động)</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <label className={lbl}>ID Nhân viên</label>
                        <input type="text" value={form.assigned_user} readOnly className={ro} />
                      </div>
                      <div>
                        <label className={lbl}>Họ tên nhân viên</label>
                        <input type="text" value={form.assigned_user_name} readOnly className={ro} />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>Nhóm phụ trách</label>
                        <input type="text" value={form.assigned_user_group} readOnly className={ro} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Wrapper với Suspense ───────────────────────────────────────────────────
export default function NewCandidate() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
            Đang tải...
          </div>
        }>
          <NewCandidateForm />
        </Suspense>
      </AppLayout>
    </ProtectedRoute>
  );
}
