'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidate';

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  project?: string;
  position?: string;
  phone: string;
  id_card_number?: string;
  date_of_birth?: string; // Định dạng từ API: DD/MM/YYYY
  birth_year?: number;
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
  interview_date?: string; // Định dạng từ API: DD/MM/YYYY
  onboard_date?: string; // Định dạng từ API: DD/MM/YYYY
}

// HÀM CHUYỂN ĐỔI FORMAT NGÀY THÁNG: DD/MM/YYYY -> YYYY-MM-DD (format cho input type="date")
const formatDateToISO = (dateString: string | undefined): string => {
  if (!dateString) return '';
  // Nếu đã là YYYY-MM-DD thì trả về luôn
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  // Chuyển đổi từ DD/MM/YYYY
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // parts[0] = Day, parts[1] = Month, parts[2] = Year
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
};

// HÀM CHUYỂN ĐỔI NGƯỢC LẠI: YYYY-MM-DD -> DD/MM/YYYY (format để lưu vào backend)
const formatISOToDDMMYYYY = (isoString: string): string => {
    if (!isoString) return '';
    const parts = isoString.split('-');
    if (parts.length === 3) {
        // parts[0] = Year, parts[1] = Month, parts[2] = Day
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
}


export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  // State mới để giữ các thay đổi của form
  const [formData, setFormData] = useState<Partial<Candidate>>({}); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCandidate();
  }, [id]);

  // Đồng bộ dữ liệu ban đầu từ API vào formData
  useEffect(() => {
    if (candidate) {
        setFormData(candidate);
    }
  }, [candidate]);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCandidate(data.data);
      } else {
        alert('Không tìm thấy ứng viên');
        router.push('/candidates');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý thay đổi state cục bộ (KHÔNG GỬI API)
  const handleChange = (key: keyof Candidate, value: any) => {
    setFormData(prev => ({
        ...prev,
        [key]: value,
    }));
  };

  // HÀM XỬ LÝ LƯU THÔNG TIN (GỬI API)
  const handleSubmit = async () => {
    if (!candidate || saving) return;

    // Lọc ra các trường có thể cập nhật
    const updatesToSend = {
        candidate_name: formData.candidate_name,
        project: formData.project,
        position: formData.position,
        phone: formData.phone,
        id_card_number: formData.id_card_number,
        date_of_birth: formData.date_of_birth,
        address_street: formData.address_street,
        address_ward: formData.address_ward,
        address_city: formData.address_city,
        assigned_user: formData.assigned_user,
        reason_rejected_offer: formData.reason_rejected_offer,
        reason_unqualified: formData.reason_unqualified,
        interview_date: formData.interview_date,
        onboard_date: formData.onboard_date,
        
        // Các trường boolean (funnel steps)
        new: formData.new,
        interested: formData.interested,
        scheduled_for_interview: formData.scheduled_for_interview,
        show_up_for_interview: formData.show_up_for_interview,
        pass_interview: formData.pass_interview,
        onboard: formData.onboard,
        reject_offer: formData.reject_offer,
        unqualified: formData.unqualified,
    };
    
    setSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: candidate.candidate_id,
          updates: updatesToSend,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        // Cập nhật lại state chính (candidate) và formData sau khi lưu thành công
        setCandidate(prev => prev ? { ...prev, ...updatesToSend } : null);
        setFormData(prev => ({ ...prev, ...updatesToSend }));
        alert('Cập nhật thành công!');
      } else {
        alert('Lỗi khi lưu: ' + (data.message || 'Không rõ lỗi'));
      }
      
    } catch (err) {
      alert('Lỗi kết nối khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('XÓA ứng viên này? Không thể khôi phục!')) return;
    try {
      await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      alert('Đã xóa thành công');
      router.push('/candidates');
    } catch (err) {
      alert('Lỗi khi xóa');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Đang tải...</div>;
  if (!candidate) return null;

  // BỎ THUỘC TÍNH MÀU VÀ DÙNG MÀU CỐ ĐỊNH CHO TẤT CẢ CÁC BƯỚC THÀNH CÔNG
  const funnelSteps = [
    { key: 'new', label: 'Liên hệ'},
    { key: 'interested', label: 'Quan tâm'},
    { key: 'scheduled_for_interview', label: 'Đặt PV'},
    { key: 'show_up_for_interview', label: 'Đi PV'},
    { key: 'pass_interview', label: 'Đỗ PV'},
    { key: 'onboard', label: 'Nhận việc'},
    { key: 'reject_offer', label: 'Từ chối offer'},
    { key: 'unqualified', label: 'Không đạt'},
  ];
  
  // Màu sắc cố định cho các bước THÀNH CÔNG (từ 'new' đến 'onboard')
  const successColorClasses = 'bg-indigo-100 border-indigo-600 shadow-lg scale-105';
  // Màu sắc cố định cho các bước THẤT BẠI ('reject_offer', 'unqualified')
  const failColorClasses = 'bg-red-100 border-red-600 shadow-lg scale-105';
  const defaultClasses = 'bg-gray-50 border-gray-300';
  
  const getStepClasses = (stepKey: string, isActive: boolean) => {
    if (!isActive) return defaultClasses;
    
    if (stepKey === 'reject_offer' || stepKey === 'unqualified') {
        return failColorClasses;
    }
    return successColorClasses;
  };
    
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {saving && (
        <div className="fixed top-0 left-0 right-0 p-3 bg-green-500 text-white text-center font-bold z-50">
          Đang lưu dữ liệu...
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-10 text-center">
          {/* Cập nhật tên ứng viên theo formData */}
          <input
            type="text"
            value={formData.candidate_name || ''}
            onChange={(e) => handleChange('candidate_name', e.target.value)}
            className="text-5xl font-bold mb-3 text-white bg-transparent border-b border-white focus:outline-none focus:border-yellow-400 text-center w-full"
            placeholder="Nhập tên ứng viên..."
          />
          <p className="text-2xl opacity-95">Mã ứng viên: <span className="font-mono text-3xl">{candidate.candidate_id}</span></p>
        </div>

        <div className="p-10 space-y-10">

          {/* 1. Thông tin ứng tuyển */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin ứng tuyển</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-medium text-gray-700">Dự án / Khách hàng</label>
                <input
                  type="text"
                  value={formData.project || ''}
                  onChange={(e) => handleChange('project', e.target.value)}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                  placeholder="VD: VinFast Outsourcing"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Vị trí tuyển dụng</label>
                <input
                  type="text"
                  value={formData.position || ''}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                  placeholder="Công nhân sản xuất"
                />
              </div>
            </div>
          </section>

          {/* 2. Phễu tuyển dụng - 8 bước dàn đều 1 hàng */}
          <section>
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-b-2 border-indigo-200 pb-3">Quy trình tuyển dụng</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {funnelSteps.map((step) => (
                <div key={step.key} className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{step.label}</label>
                  <div className={`w-full h-16 rounded-xl border-4 flex items-center justify-center transition-all ${
                    getStepClasses(step.key, !!formData[step.key as keyof Candidate])
                  }`}>
                    <input
                      type="checkbox"
                      checked={!!formData[step.key as keyof Candidate]}
                      onChange={(e) => handleChange(step.key as keyof Candidate, e.target.checked)}
                      className="w-8 h-8 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Lý do thua nếu có */}
            {(formData.reject_offer || formData.unqualified) && (
              <div className="mt-8 p-6 bg-red-50 border-2 border-red-300 rounded-2xl">
                <h3 className="text-xl font-bold text-red-800 mb-4">Lý do không thành công</h3>
                {formData.reject_offer && (
                  <div>
                    <label className="font-medium text-red-700">Từ chối offer:</label>
                    <textarea
                      value={formData.reason_rejected_offer || ''}
                      onChange={(e) => handleChange('reason_rejected_offer', e.target.value)}
                      className="mt-2 w-full px-4 py-3 border border-red-300 rounded-lg"
                      rows={3}
                      placeholder="Lý do từ chối..."
                    />
                  </div>
                )}
                {formData.unqualified && (
                  <div className="mt-4">
                    <label className="font-medium text-red-700">Không đạt:</label>
                    <textarea
                      value={formData.reason_unqualified || ''}
                      onChange={(e) => handleChange('reason_unqualified', e.target.value)}
                      className="mt-2 w-full px-4 py-3 border border-red-300 rounded-lg"
                      rows={3}
                      placeholder="Lý do không đạt..."
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 3. THÔNG TIN NGÀY THÁNG BỔ SUNG */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Ngày quan trọng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Ngày phỏng vấn</label>
                <input
                  type="date"
                  // SỬ DỤNG format DD/MM/YYYY -> YYYY-MM-DD để hiển thị
                  value={formatDateToISO(formData.interview_date)}
                  onChange={(e) => {
                    // SỬ DỤNG format YYYY-MM-DD -> DD/MM/YYYY để lưu vào state cục bộ
                    const newDate = formatISOToDDMMYYYY(e.target.value);
                    handleChange('interview_date', newDate);
                  }}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Ngày nhận việc (Onboard)</label>
                <input
                  type="date"
                  // SỬ DỤNG format DD/MM/YYYY -> YYYY-MM-DD để hiển thị
                  value={formatDateToISO(formData.onboard_date)}
                  onChange={(e) => {
                    // SỬ DỤNG format YYYY-MM-DD -> DD/MM/YYYY để lưu vào state cục bộ
                    const newDate = formatISOToDDMMYYYY(e.target.value);
                    handleChange('onboard_date', newDate);
                  }}
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                />
              </div>
            </div>
          </section>

          {/* 4. Thông tin ứng viên */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Số điện thoại</label>
                <input value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">CMND/CCCD</label>
                <input value={formData.id_card_number || ''} onChange={(e) => handleChange('id_card_number', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Ngày sinh</label>
                <input 
                  type="date" 
                  // SỬ DỤNG format DD/MM/YYYY -> YYYY-MM-DD để hiển thị
                  value={formatDateToISO(formData.date_of_birth)} 
                  onChange={(e) => {
                    // SỬ DỤNG format YYYY-MM-DD -> DD/MM/YYYY để lưu vào state cục bộ
                    const newDate = formatISOToDDMMYYYY(e.target.value);
                    handleChange('date_of_birth', newDate);
                  }} 
                  className="mt-2 w-full px-5 py-3 border rounded-xl text-lg"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Năm sinh</label>
                <input value={formData.birth_year || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 border rounded-xl text-lg" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-lg font-medium text-gray-700">Địa chỉ</label>
                <input value={formData.address_street || ''} onChange={(e) => handleChange('address_street', e.target.value)} className="mt-2 w-full px-5 py-3 border rounded-xl mb-2 text-lg" placeholder="Đường..." />
                <div className="grid grid-cols-2 gap-4">
                  <input value={formData.address_ward || ''} onChange={(e) => handleChange('address_ward', e.target.value)} className="px-5 py-3 border rounded-xl text-lg" placeholder="Phường/Xã" />
                  <input value={formData.address_city || ''} onChange={(e) => handleChange('address_city', e.target.value)} className="px-5 py-3 border rounded-xl text-lg" placeholder="Tỉnh/Thành" />
                </div>
              </div>
            </div>
          </section>

          {/* 5. Nguồn gốc ứng viên (Read only) */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Nguồn gốc ứng viên</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Đơn vị tạo nguồn</label>
                <input value={candidate.data_source_dept || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Nhóm nguồn</label>
                <input value={candidate.data_source_type_group || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Nguồn cụ thể</label>
                <input value={candidate.data_source_type || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-50 border rounded-xl text-lg" />
              </div>
            </div>
          </section>

          {/* 6. Thông tin hệ thống */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-indigo-200 pb-3">Thông tin hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-lg font-medium text-gray-700">Ngày tạo</label>
                <input value={new Date(candidate.created_at).toLocaleString('vi-VN')} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Người tạo</label>
                <input value={candidate.created_by || ''} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Cập nhật lần cuối</label>
                <input value={candidate.last_updated_at ? new Date(candidate.last_updated_at).toLocaleString('vi-VN') : '—'} readOnly className="mt-2 w-full px-5 py-3 bg-gray-100 rounded-xl text-lg" />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700">Người phụ trách</label>
                <input
                  type="text"
                  value={formData.assigned_user || ''}
                  onChange={(e) => handleChange('assigned_user', e.target.value)}
                  className="mt-2 w-full px-5 py-3 border rounded-xl font-medium text-lg"
                  placeholder="Mã nhân viên phụ trách"
                />
              </div>
            </div>
          </section>

          {/* Nút hành động */}
          <div className="flex justify-between items-center pt-10 border-t-2 border-gray-200">
            <button
              onClick={() => router.push('/candidates')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
            >
              ← Quay lại danh sách
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={saving}
              className={`font-bold py-4 px-10 rounded-xl text-xl transition ${
                saving ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {saving ? 'Đang lưu...' : 'LƯU TẤT CẢ THAY ĐỔI'}
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl text-xl transition"
            >
              XÓA ỨNG VIÊN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
