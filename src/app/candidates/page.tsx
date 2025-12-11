'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate'; // Webhook mới

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async (query = '') => {
    setLoading(true);
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', search: query, sort: 'newest' }),
    });
    const data = await res.json();
    if (data.success) setCandidates(data.data);
    setLoading(false);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchCandidates(e.target.value);
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Danh sách ứng viên</h1>
      <input
        type="text"
        placeholder="Tìm theo tên/số điện thoại"
        value={search}
        onChange={handleSearch}
        className="mb-4 p-2 border w-full max-w-md"
      />
      <Link href="/candidates/new" className="bg-blue-600 text-white p-2 rounded">Tạo mới</Link>
      <table className="w-full mt-4 border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((cand) => (
            <tr key={cand.candidate_id}>
              <td>{cand.candidate_id}</td>
              <td>{cand.candidate_name}</td>
              <td>{cand.phone}</td>
              <td>{cand.onboard ? 'Onboard' : cand.pass_interview ? 'Pass' : 'Processing'}</td>
              <td>
                <Link href={`/candidates/${cand.candidate_id}`}>Xem/Sửa</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
