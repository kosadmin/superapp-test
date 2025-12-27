'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate'; // Đã thống nhất 1 URL điều hướng bằng action

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  onboard?: boolean;
  pass_interview?: boolean;
  show_up_for_interview?: boolean;
  scheduled_for_interview?: boolean;
  interested?: boolean;
  new?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  position?: string;
  project?: string;
  interview_date?: string;
  onboard_date?: string;
  created_at: string;
  [key: string]: any;
}

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  
  // States cho danh sách
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');

  // States cho Chi tiết (Detail)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Candidate | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Danh sách
  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setDataLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setCandidates(data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setDataLoading(false); }
  };

  useEffect(() => {
    if (user_group && user_id) fetchAllCandidates();
  }, [user_group, user_id, isAuthLoading]);

  // 2. Fetch Chi tiết khi chọn 1 ứng viên
  useEffect(() => {
    if (!selectedId) {
      setDetailData(null);
      return;
    }
    const loadDetail = async () => {
      setIsDetailLoading(true);
      try {
        const res = await fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', id: selectedId }),
        });
        const data = await res.json();
        if (data.success) setDetailData(data.data);
      } catch (err) { console.error(err); }
      finally { setIsDetailLoading(false); }
    };
    loadDetail();
  }, [selectedId]);

  // Search logic
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = allCandidates.filter(c => 
      c.candidate_name.toLowerCase().includes(lowerSearch) || c.phone.includes(search)
    );
    setCandidates(filtered);
  }, [search, allCandidates]);

  // Handle Update Detail
  const handleUpdateDetail = (field: keyof Candidate, value: any) => {
    setDetailData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveDetail = async () => {
    if (!detailData) return;
    setIsSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: detailData.candidate_id, updates: detailData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Lưu thành công!');
        // Cập nhật lại list nhỏ bên trái để đồng bộ status
        setAllCandidates(prev => prev.map(c => c.candidate_id === detailData.candidate_id ? detailData : c));
      }
    } catch (err) { alert('Lỗi lưu dữ liệu'); }
    finally { setIsSaving(false); }
  };

  if (isAuthLoading || dataLoading) return <div className="p-10 text-center text-xl">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* CỘT TRÁI: DANH SÁCH (40%) */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-white border-r shadow-xl z-10">
        <div className="p-4 border-b bg-slate-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xl text-slate-800">Ứng viên ({candidates.length})</h2>
            <Link href="/dashboard" className="text-xs text-blue-600">Dashboard</Link>
          </div>
          <input
            type="text"
            placeholder="Tìm tên, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {candidates.map((cand) => (
            <div
              key={cand.candidate_id}
              onClick={() => setSelectedId(cand.candidate_id)}
              className={`p-4 border-b cursor-pointer transition-all hover:bg-blue-50 ${
                selectedId === cand.candidate_id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-900">{cand.candidate_name}</span>
                <span className="text-[10px] text-gray-400 font-mono">#{cand.candidate_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{cand.phone}</span>
                <StatusBadge candidate={cand} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT (60%) */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {!selectedId ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <p className="text-lg">Chọn một ứng viên để xem chi tiết</p>
          </div>
        ) : isDetailLoading ? (
          <div className="h-full flex items-center justify-center">Đang tải chi tiết...</div>
        ) : detailData ? (
          <div className="p-8 max-w-4xl mx-auto">
            {/* Header Detail */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-800">{detailData.candidate_name}</h1>
                <p className="text-gray-500 font-medium">Cập nhật lần cuối: {detailData.last_updated_at ? new Date(detailData.last_updated_at).toLocaleDateString() : '---'}</p>
              </div>
              <button
                onClick={handleSaveDetail}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg transition disabled:bg-gray-400"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>

            {/* Quy trình nhanh */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Quy trình tuyển dụng</h3>
              <div className="grid grid-cols-4 gap-3">
                {['new', 'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard', 'reject_offer', 'unqualified'].map(step => (
                   <label key={step} className={`flex flex-col items-center p-3 rounded-2xl border cursor-pointer transition ${detailData[step] ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                      <input 
                        type="checkbox" className="hidden" 
                        checked={!!detailData[step]} 
                        onChange={(e) => handleUpdateDetail(step, e.target.checked)} 
                      />
                      <span className="text-[10px] font-bold text-center leading-tight">{translateStep(step)}</span>
                   </label>
                ))}
              </div>
            </div>

            {/* Form thông tin */}
            <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Dự án" value={detailData.project} onChange={(v) => handleUpdateDetail('project', v)} />
                <InputGroup label="Vị trí" value={detailData.position} onChange={(v) => handleUpdateDetail('position', v)} />
                <InputGroup label="Số điện thoại" value={detailData.phone} onChange={(v) => handleUpdateDetail('phone', v)} />
                <InputGroup label="Ngày phỏng vấn" type="date" value={formatToInputDate(detailData.interview_date)} onChange={(v) => handleUpdateDetail('interview_date', formatFromInputDate(v))} />
            </div>

            {/* Lý do thất bại (Nếu có) */}
            {(detailData.reject_offer || detailData.unqualified) && (
              <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-700 font-bold text-sm mb-2">Lý do từ chối / Không đạt:</p>
                <textarea 
                  className="w-full p-3 rounded-xl border border-red-200 focus:outline-red-400" 
                  rows={3}
                  value={detailData.reason_unqualified || detailData.reason_rejected_offer || ''}
                  onChange={(e) => handleUpdateDetail('reason_unqualified', e.target.value)}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Sub-components & Helpers
function StatusBadge({ candidate }: { candidate: Candidate }) {
  if (candidate.onboard) return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ONBOARD</span>;
  if (candidate.unqualified) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">LOẠI</span>;
  if (candidate.pass_interview) return <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">ĐỖ PV</span>;
  if (candidate.scheduled_for_interview) return <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">LỊCH PV</span>;
  return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">MỚI</span>;
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">{label}</label>
      <input 
        type={type} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-bold text-slate-700 focus:outline-none"
      />
    </div>
  );
}

const translateStep = (s: string) => {
    const map: any = { new: 'MỚI', interested: 'QUAN TÂM', scheduled_for_interview: 'LỊCH PV', show_up_for_interview: 'ĐI PV', pass_interview: 'ĐỖ PV', onboard: 'ONBOARD', reject_offer: 'TC OFFER', unqualified: 'LOẠI' };
    return map[s] || s;
}

const formatToInputDate = (d?: string) => {
    if(!d) return '';
    const parts = d.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
}
const formatFromInputDate = (d: string) => {
    if(!d) return '';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
}

export default function CandidatesPage() {
  return (
    <ProtectedRoute>
      <CandidatesContent />
    </ProtectedRoute>
  );
}
