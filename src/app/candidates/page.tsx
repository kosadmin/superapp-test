'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

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
  assigned_user?: string;
  [key: string]: any;
}

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();

  // States cho danh sách
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');

  // States cho chi tiết (Bên phải)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Lấy danh sách ứng viên
  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setListLoading(true);
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
    finally { setListLoading(false); }
  };

  // 2. Lấy chi tiết khi click vào ứng viên
  const fetchDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id }),
      });
      const data = await res.json();
      if (data.success) setDetailData(data.data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => {
    if (user_group && user_id) fetchAllCandidates();
  }, [user_group, user_id, isAuthLoading]);

  // Search logic
  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    const filtered = allCandidates.filter(cand => 
      cand.candidate_name.toLowerCase().includes(lowerSearch) || cand.phone.includes(search)
    );
    setCandidates(filtered);
  }, [search, allCandidates]);

  // Xử lý thay đổi dữ liệu chi tiết
  const handleDetailChange = (field: keyof Candidate, value: any) => {
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
        alert('Cập nhật thành công!');
        fetchAllCandidates(); // Refresh lại danh sách bên trái để cập nhật status
      }
    } catch (err) { alert('Lỗi lưu dữ liệu'); }
    finally { setIsSaving(false); }
  };

  if (isAuthLoading) return <div className="h-screen flex items-center justify-center">Đang xác thực...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* CỘT TRÁI: DANH SÁCH */}
      <div className={`flex-1 flex flex-col min-w-[400px] border-r bg-white ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-800">Ứng viên ({candidates.length})</h1>
            <Link href="/dashboard" className="text-xs text-gray-500 hover:underline">← Dashboard</Link>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Link href="/candidates/new" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700">
              + Thêm
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-10 text-center text-gray-400">Đang tải danh sách...</div>
          ) : candidates.map(cand => (
            <div 
              key={cand.candidate_id}
              onClick={() => fetchDetail(cand.candidate_id)}
              className={`p-4 border-b cursor-pointer transition-all hover:bg-blue-50 ${selectedId === cand.candidate_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-800">{cand.candidate_name}</span>
                <span className="text-[10px] font-mono text-gray-400">{cand.candidate_id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{cand.phone}</span>
                <StatusBadge cand={cand} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT */}
      <div className={`flex-[1.5] bg-gray-50 flex flex-col ${!selectedId ? 'hidden lg:flex items-center justify-center text-gray-400' : 'flex'}`}>
        {!selectedId ? (
          <div className="text-center">
            <div className="text-6xl mb-4">👤</div>
            <p>Chọn một ứng viên để xem chi tiết</p>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center">Đang tải dữ liệu...</div>
        ) : detailData && (
          <>
            {/* Header Detail */}
            <div className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{detailData.candidate_name}</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{detailData.candidate_id}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-2 bg-gray-200 rounded-lg text-sm"
                >Đóng</button>
                <button 
                  onClick={handleSaveDetail}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* 1. Phễu trạng thái */}
              <section className="bg-white p-4 rounded-xl shadow-sm border">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Tiến độ tuyển dụng</h3>
                <div className="grid grid-cols-4 gap-3">
                  {['new', 'interested', 'scheduled_for_interview', 'show_up_for_interview', 'pass_interview', 'onboard', 'reject_offer', 'unqualified'].map(step => (
                    <button
                      key={step}
                      onClick={() => handleDetailChange(step as keyof Candidate, !detailData[step])}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold border-2 transition-all ${detailData[step] ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                    >
                      {step.replace(/_/g, ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              {/* 2. Thông tin chính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <h3 className="font-bold text-blue-800 border-b pb-2">Thông tin ứng tuyển</h3>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Dự án</label>
                    <input 
                      type="text" value={detailData.project || ''} 
                      onChange={(e) => handleDetailChange('project', e.target.value)}
                      className="w-full mt-1 p-2 border-b focus:border-blue-500 outline-none font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Vị trí</label>
                    <input 
                      type="text" value={detailData.position || ''} 
                      onChange={(e) => handleDetailChange('position', e.target.value)}
                      className="w-full mt-1 p-2 border-b focus:border-blue-500 outline-none font-medium" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">Ngày PV</label>
                      <input 
                        type="text" value={detailData.interview_date || ''} 
                        onChange={(e) => handleDetailChange('interview_date', e.target.value)}
                        className="w-full mt-1 p-2 border-b outline-none font-medium" 
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase">Ngày Onboard</label>
                      <input 
                        type="text" value={detailData.onboard_date || ''} 
                        onChange={(e) => handleDetailChange('onboard_date', e.target.value)}
                        className="w-full mt-1 p-2 border-b outline-none font-medium" 
                        placeholder="DD/MM/YYYY"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <h3 className="font-bold text-blue-800 border-b pb-2">Thông tin cá nhân</h3>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Số điện thoại</label>
                    <input 
                      type="text" value={detailData.phone || ''} 
                      onChange={(e) => handleDetailChange('phone', e.target.value)}
                      className="w-full mt-1 p-2 border-b outline-none font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Người phụ trách</label>
                    <input 
                      type="text" value={detailData.assigned_user || ''} 
                      onChange={(e) => handleDetailChange('assigned_user', e.target.value)}
                      className="w-full mt-1 p-2 border-b outline-none font-medium" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nguồn gốc</label>
                    <p className="mt-1 text-sm text-slate-600 font-medium">
                      {detailData.data_source_type_group} - {detailData.data_source_type}
                    </p>
                  </div>
                </section>
              </div>

              {/* 3. Ghi chú lý do nếu thất bại */}
              {(detailData.reject_offer || detailData.unqualified) && (
                <section className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4">
                  <h3 className="font-bold text-red-700">Lý do thất bại</h3>
                  <textarea 
                    className="w-full p-4 border rounded-xl outline-none" 
                    rows={3}
                    placeholder="Nhập lý do chi tiết..."
                    value={detailData.reason_unqualified || detailData.reason_rejected_offer || ''}
                    onChange={(e) => handleDetailChange(detailData.unqualified ? 'reason_unqualified' : 'reason_rejected_offer', e.target.value)}
                  />
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Component nhỏ hiển thị Badge trạng thái
function StatusBadge({ cand }: { cand: Candidate }) {
  if (cand.onboard) return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold uppercase">Nhận việc</span>;
  if (cand.unqualified) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">Không đạt</span>;
  if (cand.pass_interview) return <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold uppercase">Đỗ PV</span>;
  if (cand.scheduled_for_interview) return <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-1 rounded font-bold uppercase">Lịch PV</span>;
  return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold uppercase">Mới</span>;
}

export default function CandidatesList() {
  return (
    <ProtectedRoute>
      <CandidatesContent />
    </ProtectedRoute>
  );
}
