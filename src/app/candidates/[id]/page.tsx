'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';
const AUTH_URL = 'https://n8n.koutsourcing.vn/webhook/auth'; // webhook verify

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  project?: string;
  position?: string;
  phone: string;
  id_card_number?: string;
  date_of_birth?: string;
  address_street?: string;
  address_ward?: string;
  address_city?: string;
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
  created_at: string;
  created_by?: string;
  last_updated_at?: string;
  assigned_user?: string;
  reason_rejected_offer?: string;
  reason_unqualified?: string;
  interview_date?: string;
  onboard_date?: string;
}

// Format ngày
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

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // KIỂM TRA ĐĂNG NHẬP TRƯỚC KHI LẤY DATA
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const isLoggedIn = await checkAuth();
      if (!isLoggedIn) {
        localStorage.removeItem('token');
        router.replace('/login?redirect=' + encodeURIComponent(`/candidates/${id}`));
        return;
      }

      // Nếu đã đăng nhập → mới được lấy data
      if (!id) return;
      fetchCandidate();
    };
    init();
  }, [id, router]);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const cand = data.data;
        setOriginalData(cand);
        setFormData(cand);
      } else {
        alert('Không tìm thấy ứng viên');
        router.push('/candidates');
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Đang kiểm tra đăng nhập...</div>;
  if (!formData) return null;

  const handleChange = (field: keyof Candidate, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const handleSave = async () => {
    if (!formData || !hasChanges) return;
    setIsSaving(true);
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: formData.candidate_id,
          updates: formData,
        }),
      });
      alert('Đã lưu thành công!');
      setOriginalData(formData);
    } catch {
      alert('Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('XÓA ứng viên? Không thể khôi phục!')) return;
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      alert('Đã xóa thành công');
      router.push('/candidates');
    } catch {
      alert('Lỗi khi xóa');
    }
  };

  const funnelSteps = [
    { key: 'new', label: 'Mới' },
    { key: 'interested', label: 'Quan tâm' },
    { key: 'scheduled_for_interview', label: 'Đặt PV' },
    { key: 'show_up_for_interview', label: 'Đi PV' },
    { key: 'pass_interview', label: 'Đỗ PV' },
    { key: 'onboard', label: 'Nhận việc' },
    { key: 'reject_offer', label: 'Từ chối offer' },
    { key: 'unqualified', label: 'Không đạt' },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 text-center rounded-t-3xl mb-8 shadow-lg">
        <h1 className="text-5xl font-bold mb-4">{formData.candidate_name}</h1>
        <p className="text-2xl">Mã UV: <span className="font-mono text-4xl">{formData.candidate_id}</span></p>
      </div>

      <div className="flex justify-end gap-6 mb-8">
        <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl text-xl">
          XÓA ỨNG VIÊN
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`py-4 px-12 rounded-xl text-xl font-bold ${hasChanges ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-200'}`}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Các phần còn lại giữ nguyên như bạn đã có */}
      {/* (Phễu, thông tin, ngày tháng, v.v.) */}
      {/* ... giữ nguyên phần giao diện bạn đã làm đẹp rồi ... */}
    </div>
  );
}
