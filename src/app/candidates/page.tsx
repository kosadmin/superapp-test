'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  onboard?: boolean;
  pass_interview?: boolean;
  interested?: boolean;
  reject_offer?: boolean;
  unqualified?: boolean;
  position?: string;
  [key: string]: any;
}

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async (query: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          search: query,
          sort: 'newest'
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    fetchCandidates(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Đang tải danh sách ứng viên...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        Quản lý Ứng viên
      </h1>

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
        <p className="text-center text-gray-500 text-xl">Chưa có ứng viên nào</p>
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
                    {/* LOGIC SỬA ĐÂY - ƯU TIÊN THUA TRƯỚC, MÀU XÁM */}
                    {cand.reject_offer || cand.unqualified ? (
                      <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">Thua</span>
                    ) : cand.onboard ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">Onboard</span>
                    ) : cand.pass_interview ? (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">Pass</span>
                    ) : cand.interested ? (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Quan tâm</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">Mới</span>
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
