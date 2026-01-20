'use client';

import { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';
const ITEMS_PER_PAGE = 50;

// --- INTERFACE ---
interface Candidate {
  row_number?: number;
  candidate_id: string;
  candidate_name: string;
  phone: string;
  id_card_number?: string;
  date_of_birth?: string;
  birth_year?: number;
  address_full?: string;
  address_street?: string;
  address_ward?: string;
  address_city?: string;
  project?: string;
  project_id?: string;
  project_type?: string;
  position?: string;
  company?: string;
  department?: string;
  data_source_dept?: string;
  data_source_type_group?: string;
  data_source_type?: string;
  new?: boolean;
  interested?: boolean;
  scheduled_for_interview?: boolean;
  show_up_for_interview?: boolean;
  pass_interview?: boolean;
  onboard?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  interview_date?: string;
  onboard_date?: string;
  reason_rejected_offer?: string;
  reason_unqualified?: string;
  assigned_user_name?: string;
  [key: string]: any;
}

// --- UTILS ---
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

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // Chi tiết
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return;
    setListLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', sort: 'newest', user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setAllCandidates(data.data || []);
        setFilteredCandidates(data.data || []);
      }
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

  // Logic tìm kiếm & reset trang
  useEffect(() => {
    const lowerSearch = search.toLowerCase().trim();
    const filtered = allCandidates.filter(cand => 
      cand.candidate_name.toLowerCase().includes(lowerSearch) ||
      cand.phone.includes(search) ||
      cand.candidate_id.toLowerCase().includes(lowerSearch)
    );
    setFilteredCandidates(filtered);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  }, [search, allCandidates]);

  // Tính toán dữ liệu phân trang
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);

  const fetchDetail = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id, user_group }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setOriginalData(data.data);
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: formData.candidate_id, updates: formData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Lưu thành công!');
        setOriginalData(formData);
        fetchAllCandidates();
      }
    } catch { alert('Lỗi kết nối'); }
    finally { setIsSaving(false); }
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      {/* --- CỘT TRÁI: DANH SÁCH (Có cuộn ngang & Phân trang) --- */}
      <div className={`flex flex-col border-r bg-white transition-all duration-300 ${selectedId ? 'w-1/3 min-w-[350px]' : 'w-full'}`}>
        <div className="p-4 border-b bg-white z-20">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700">Ứng viên ({filteredCandidates.length})</h1>
            <Link href="/dashboard" className="text-blue-500 hover:underline text-xs">← Quay lại</Link>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm tên, SĐT, mã UV..."
              className="flex-1 px-3 py-2 border rounded-md outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!selectedId && <Link href="/candidates/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Thêm mới</Link>}
          </div>
        </div>

        {/* Khu vực Bảng có cuộn ngang */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
              <tr className="text-gray-600 uppercase text-[10px] tracking-wider">
                <th className="p-3 border-b sticky left-0 bg-gray-100 z-20">Họ tên</th>
                <th className="p-3 border-b">Trạng thái</th>
                <th className="p-3 border-b">Số điện thoại</th>
                <th className="p-3 border-b">Dự án</th>
                <th className="p-3 border-b">Vị trí</th>
                <th className="p-3 border-b">Công ty</th>
                <th className="p-3 border-b">Ngày PV</th>
                <th className="p-3 border-b">Ngày Onboard</th>
                <th className="p-3 border-b">CCCD</th>
                <th className="p-3 border-b">Ngày sinh</th>
                <th className="p-3 border-b">Địa chỉ</th>
                <th className="p-3 border-b">Nguồn</th>
                <th className="p-3 border-b">Người phụ trách</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-100' : ''}`}
                >
                  <td className="p-3 font-semibold sticky left-0 bg-white group-hover:bg-blue-50 z-10 whitespace-nowrap border-r">
                    <div>{cand.candidate_name}</div>
                    <div className="text-[9px] text-gray-400 font-mono">{cand.candidate_id}</div>
                  </td>
                  <td className="p-3 text-center whitespace-nowrap"><StatusBadge cand={cand} /></td>
                  <td className="p-3 whitespace-nowrap">{cand.phone}</td>
                  <td className="p-3 whitespace-nowrap">{cand.project || '—'}</td>
                  <td className="p-3 whitespace-nowrap">{cand.position || '—'}</td>
                  <td className="p-3 whitespace-nowrap">{cand.company || '—'}</td>
                  <td className="p-3 whitespace-nowrap text-blue-600 font-medium">{cand.interview_date || '—'}</td>
                  <td className="p-3 whitespace-nowrap text-green-600 font-medium">{cand.onboard_date || '—'}</td>
                  <td className="p-3 whitespace-nowrap">{cand.id_card_number || '—'}</td>
                  <td className="p-3 whitespace-nowrap">{cand.date_of_birth || '—'}</td>
                  <td className="p-3 max-w-xs truncate">{cand.address_full || '—'}</td>
                  <td className="p-3 whitespace-nowrap text-gray-500">{cand.data_source_type || '—'}</td>
                  <td className="p-3 whitespace-nowrap italic text-gray-500">{cand.assigned_user_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && <div className="p-10 text-center text-gray-400 italic">Không có dữ liệu</div>}
        </div>

        {/* Bộ điều khiển Phân trang */}
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Hiển thị {Math.min(filteredCandidates.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} - {Math.min(filteredCandidates.length, currentPage * ITEMS_PER_PAGE)} trên tổng {filteredCandidates.length}
          </span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-xs"
            >Trước</button>
            <div className="px-3 py-1 text-xs font-bold">Trang {currentPage} / {totalPages || 1}</div>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-xs"
            >Sau</button>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: CHI TIẾT --- */}
      {selectedId && formData && (
        <div className="flex-1 flex flex-col bg-white shadow-2xl border-l z-30">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
              <h2 className="font-bold text-lg uppercase">{formData.candidate_name}</h2>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || JSON.stringify(originalData) === JSON.stringify(formData)}
              className="bg-green-600 text-white px-6 py-2 rounded-md font-bold hover:bg-green-700 disabled:bg-gray-300"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
             {/* Nội dung chi tiết giữ nguyên như bản trước để tiết kiệm diện tích */}
             <section>
                <h3 className="text-blue-600 font-bold mb-4 border-b pb-1">THÔNG TIN CHUNG</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] text-gray-400">SĐT</label><input className="w-full p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                   <div><label className="text-[10px] text-gray-400">CCCD</label><input className="w-full p-2 border rounded" value={formData.id_card_number || ''} onChange={e => setFormData({...formData, id_card_number: e.target.value})} /></div>
                   <div><label className="text-[10px] text-gray-400">Dự án</label><input className="w-full p-2 border rounded" value={formData.project || ''} onChange={e => setFormData({...formData, project: e.target.value})} /></div>
                   <div><label className="text-[10px] text-gray-400">Vị trí</label><input className="w-full p-2 border rounded" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} /></div>
                </div>
             </section>
             
             <section>
                <h3 className="text-blue-600 font-bold mb-4 border-b pb-1">TIẾN ĐỘ</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] text-gray-400">Ngày phỏng vấn</label><input type="date" className="w-full p-2 border rounded" value={formatDateToISO(formData.interview_date)} onChange={e => setFormData({...formData, interview_date: formatISOToDDMMYYYY(e.target.value)})} /></div>
                   <div><label className="text-[10px] text-gray-400">Ngày nhận việc</label><input type="date" className="w-full p-2 border rounded" value={formatDateToISO(formData.onboard_date)} onChange={e => setFormData({...formData, onboard_date: formatISOToDDMMYYYY(e.target.value)})} /></div>
                </div>
             </section>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge Status
function StatusBadge({ cand }: { cand: Candidate }) {
  if (cand.onboard) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">ONBOARD</span>;
  if (cand.unqualified) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">LOẠI</span>;
  if (cand.pass_interview) return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">PASS PV</span>;
  if (cand.show_up_for_interview) return <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-bold">ĐÃ PV</span>;
  if (cand.interested) return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold">QUAN TÂM</span>;
  return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px]">MỚI</span>;
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
