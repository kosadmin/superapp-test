'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { X, Save, Trash2, Calendar, User, MapPin, Briefcase } from 'lucide-react'; // Cần cài lucide-react hoặc dùng icon khác

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  position?: string;
  project?: string;
  onboard?: boolean;
  pass_interview?: boolean;
  show_up_for_interview?: boolean;
  scheduled_for_interview?: boolean;
  interested?: boolean;
  new?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  interview_date?: string;
  onboard_date?: string;
  created_at: string;
  [key: string]: any;
}

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setDataLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          user_group,
          user_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setCandidates(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user_group && user_id) fetchAllCandidates();
  }, [user_group, user_id, isAuthLoading]);

  useEffect(() => {
    const filtered = allCandidates.filter(cand =>
      cand.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      cand.phone.includes(search)
    );
    setCandidates(filtered);
  }, [search, allCandidates]);

  const handleUpdateField = (field: keyof Candidate, value: any) => {
    if (!selectedCandidate) return;
    setSelectedCandidate({ ...selectedCandidate, [field]: value });
  };

  const handleSaveDetail = async () => {
    if (!selectedCandidate) return;
    setIsSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: selectedCandidate.candidate_id,
          updates: selectedCandidate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã cập nhật!');
        // Cập nhật lại list local để không cần reload trang
        setAllCandidates(prev => prev.map(c => c.candidate_id === selectedCandidate.candidate_id ? selectedCandidate : c));
      }
    } catch (err) {
      alert('Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isAuthLoading || dataLoading) return <div className="h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* PHẦN 1: DANH SÁCH (Bên trái) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedCandidate ? 'mr-[450px]' : ''}`}>
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Quản lý Ứng viên</h1>
            <p className="text-xs text-slate-500">Nhóm: {user_group} | ID: {user_id}</p>
          </div>
          <Link href="/candidates/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Thêm mới
          </Link>
        </header>

        <div className="p-4 border-b bg-white">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-3">
            {candidates.map((cand) => (
              <div
                key={cand.candidate_id}
                onClick={() => setSelectedCandidate(cand)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCandidate?.candidate_id === cand.candidate_id 
                  ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400' 
                  : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{cand.candidate_name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{cand.phone} • {cand.position || 'Chưa có vị trí'}</p>
                  </div>
                  <StatusBadge cand={cand} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PHẦN 2: CHI TIẾT (Side Panel bên phải) */}
      {selectedCandidate && (
        <div className="fixed right-0 top-0 h-screen w-[450px] bg-white shadow-2xl border-l flex flex-col z-50 animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Chi tiết ứng viên</h2>
              <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">ID: {selectedCandidate.candidate_id}</span>
            </div>
            <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-200 rounded-full transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Trạng thái Phễu */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quy trình tuyển dụng</p>
              <div className="grid grid-cols-2 gap-2">
                {['new', 'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard', 'reject_offer', 'unqualified'].map(step => (
                  <label key={step} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${selectedCandidate[step] ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="checkbox" 
                      checked={!!selectedCandidate[step]} 
                      onChange={(e) => handleUpdateField(step, e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-xs capitalize">{step.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Thông tin chính */}
            <div className="space-y-4">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thông tin cá nhân</p>
               <InputGroup label="Họ tên" value={selectedCandidate.candidate_name} onChange={(v) => handleUpdateField('candidate_name', v)} />
               <InputGroup label="Số điện thoại" value={selectedCandidate.phone} onChange={(v) => handleUpdateField('phone', v)} />
               <div className="grid grid-cols-2 gap-4">
                 <InputGroup type="date" label="Ngày phỏng vấn" value={formatDateForInput(selectedCandidate.interview_date)} onChange={(v) => handleUpdateField('interview_date', formatToDDMMYYYY(v))} />
                 <InputGroup type="date" label="Ngày nhận việc" value={formatDateForInput(selectedCandidate.onboard_date)} onChange={(v) => handleUpdateField('onboard_date', formatToDDMMYYYY(v))} />
               </div>
               <InputGroup label="Dự án" value={selectedCandidate.project} onChange={(v) => handleUpdateField('project', v)} />
               <InputGroup label="Vị trí" value={selectedCandidate.position} onChange={(v) => handleUpdateField('position', v)} />
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button
              onClick={handleSaveDetail}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Save size={18} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components giúp code sạch hơn
function StatusBadge({ cand }: { cand: Candidate }) {
  if (cand.onboard) return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Nhận việc</span>;
  if (cand.pass_interview) return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Đỗ PV</span>;
  if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Loại</span>;
  return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase">Mới</span>;
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 mb-1 ml-1">{label}</label>
      <input 
        type={type}
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

// Helpers chuyển đổi ngày tháng
const formatDateForInput = (v: string | undefined) => {
  if (!v) return "";
  const parts = v.split('/');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : v;
};
const formatToDDMMYYYY = (v: string) => {
  if (!v) return "";
  const parts = v.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : v;
};

export default function CandidatesList() {
  return (
    <ProtectedRoute>
      <CandidatesContent />
    </ProtectedRoute>
  );
}
