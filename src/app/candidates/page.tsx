// Trang /candidates/page.tsx (CandidatesList) - ĐÃ CẬP NHẬT
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

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
  [key: string]: any;
}

// Tách logic chính ra khỏi ProtectedRoute để sử dụng Context
function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth(); // Lấy user_group & user_id

  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState('');

  // HÀM GỌI N8N ĐỂ LẤY DANH SÁCH ỨNG VIÊN
  const fetchAllCandidates = async () => {
    if (isAuthLoading || !user_group || !user_id) return; // Chờ Auth xong

    setDataLoading(true);
    try {
      // GỬI KÈM user_group VÀ user_id VÀO BODY
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          sort: 'newest',
          user_group: user_group,
          user_id: user_id, 
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

  // CHỈ GỌI N8N 1 LẦN KHI VÀO TRANG, VÀ KHI user_group/user_id đã có
  useEffect(() => {
    if (user_group && user_id) {
      fetchAllCandidates();
    }
  }, [user_group, user_id, isAuthLoading]); // Phụ thuộc vào user_group và user_id

  // Search realtime trên dữ liệu đã load
  useEffect(() => {
    if (!search.trim()) {
      setCandidates(allCandidates);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = allCandidates.filter(cand => {
      return (
        cand.candidate_name.toLowerCase().includes(lowerSearch) ||
        cand.phone.includes(search)
      );
    });
    setCandidates(filtered);
  }, [search, allCandidates]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Hiển thị loading: Chờ Auth hoặc Chờ Data
  if (isAuthLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        {isAuthLoading ? 'Đang kiểm tra quyền...' : 'Đang tải danh sách ứng viên...'}
      </div>
    );
  }
  
  // Logic hiển thị chính
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        Quản lý Ứng viên (Nhóm: {user_group} - ID: {user_id})
      </h1>

      {/* TẠM THỜI CHƯA LỌC QUYỀN NÚT TẠO MỚI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc số điện thoại..."
          value={search}
          onChange={handleSearch}
          className="w-full md:w-96 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />

        <Link
          href="/candidates/new"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition shadow-lg"
        >
          + Tạo ứng viên mới
        </Link>
      </div>

      {candidates.length === 0 ? (
        <p className="text-center text-gray-500 text-xl">
          {search ? 'Không tìm thấy ứng viên nào' : 'Chưa có ứng viên nào'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Mã UV</th>
                <th className="px-6 py-4 text-left">Họ tên</th>
                <th className="px-6 py-4 text-left">Số điện thoại</th>
                <th className="px-6 py-4 text-left">Vị trí</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand) => (
                <tr key={cand.candidate_id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cand.candidate_id}</td>
                  <td className="px-6 py-4">{cand.candidate_name}</td>
                  <td className="px-6 py-4">{cand.phone}</td>
                  <td className="px-6 py-4">{cand.position || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    {cand.reject_offer ? (
                      <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">Từ chối Offer</span>
                    ) : cand.unqualified ? (
                      <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">Không đạt</span>
                    ) : cand.onboard ? (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">Nhận việc</span>
                    ) : cand.pass_interview ? (
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">Đỗ PV</span>
                    ) : cand.show_up_for_interview ? (
                      <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-bold">Tham gia PV</span>
                    ) : cand.scheduled_for_interview ? (
                      <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-bold">Đăng ký PV</span>
                    ) : cand.interested ? (
                      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">Quan tâm</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">Mới</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/candidates/${cand.candidate_id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Xem &amp; Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-gray-600 hover:underline">
          ← Quay lại Dashboard
        </Link>
      </div>
    </div>
  );
}


export default function CandidatesList() {
  return (
    <ProtectedRoute>
      <CandidatesContent />
    </ProtectedRoute>
  );
}
