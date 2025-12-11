'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

export default function CandidateDetail() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(N8N_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'get', id }),
    }).then(r => r.json()).then(data => {
      if (data.success) setCandidate(data.data);
    });
  }, [id]);

  const handleUpdate = async (updates) => {
    await fetch(N8N_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', id, updates }),
    });
    // Refresh or redirect
  };

  const handleDelete = async () => {
    await fetch(N8N_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
    });
    router.push('/candidates');
  };

  if (!candidate) return <div>Đang tải...</div>;

  return (
    <div>
      <h1>{candidate.candidate_name}</h1>
      {/* Form sửa: input với value từ candidate, onChange update state, submit call handleUpdate */}
      {/* Checkbox cho các bước phễu: contacted,... onboard */}
      {/* Nếu tick reject/unqualified: input lý do */}
      <button onClick={handleDelete}>Xóa</button>
    </div>
  );
}
