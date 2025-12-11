'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

export default function NewCandidate() {
  const [form, setForm] = useState({ candidate_name: '', phone: '', /* thêm các field khác */ });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    });
    const data = await res.json();
    if (data.success) router.push(`/candidates/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Tên ứng viên"
        value={form.candidate_name}
        onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
      />
      {/* Thêm input cho tất cả field khác, boolean dùng checkbox */}
      <button type="submit">Tạo</button>
    </form>
  );
}
