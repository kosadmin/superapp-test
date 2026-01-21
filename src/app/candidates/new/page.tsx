import React, { useState } from 'react';
import { 
  UserPlus, 
  Phone, 
  IdCard, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook/candidate';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [form, setForm] = useState({
    candidate_name: '',
    phone: '',
    id_card_number: '',
    date_of_birth: '',
    address_street: '',
    address_ward: '',
    address_city: '',
    project: '',
    position: '',
    company: '',
    data_source_type: '',
    assigned_user: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setStatus('success');
        // Reset form sau khi gửi thành công nếu muốn
        // setForm({...initialState});
      } else {
        throw new Error('Gửi dữ liệu thất bại');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại danh sách
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-blue-600" />
              Tạo Mới Ứng Viên
            </h1>
            <p className="text-gray-500 mt-1">Nhập thông tin chi tiết của ứng viên mới vào hệ thống.</p>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Ứng viên đã được tạo thành công!</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Thông tin cá nhân */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
              <span className="bg-blue-100 text-blue-600 p-1 rounded-md"><UserPlus className="w-4 h-4" /></span>
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}><UserPlus className="w-4 h-4 text-gray-400" /> Họ và tên *</label>
                <input required type="text" name="candidate_name" value={form.candidate_name} onChange={handleChange} placeholder="VD: Nguyễn Văn A" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}><Phone className="w-4 h-4 text-gray-400" /> Số điện thoại *</label>
                <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="09xxxxxxxx" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}><IdCard className="w-4 h-4 text-gray-400" /> Số CCCD</label>
                <input type="text" name="id_card_number" value={form.id_card_number} onChange={handleChange} placeholder="Nhập số CCCD" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}><Calendar className="w-4 h-4 text-gray-400" /> Ngày sinh</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Địa chỉ */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
              <span className="bg-emerald-100 text-emerald-600 p-1 rounded-md"><MapPin className="w-4 h-4" /></span>
              Địa chỉ liên lạc
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className={labelClass}>Đường / Số nhà</label>
                <input type="text" name="address_street" value={form.address_street} onChange={handleChange} placeholder="Tên đường..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phường / Xã</label>
                <input type="text" name="address_ward" value={form.address_ward} onChange={handleChange} placeholder="Phường/Xã..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Thành phố / Tỉnh</label>
                <input type="text" name="address_city" value={form.address_city} onChange={handleChange} placeholder="Tỉnh/TP..." className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section: Công việc & Nguồn */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
              <span className="bg-purple-100 text-purple-600 p-1 rounded-md"><Briefcase className="w-4 h-4" /></span>
              Thông tin tuyển dụng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Dự án</label>
                <input type="text" name="project" value={form.project} onChange={handleChange} placeholder="VD: Dự án Samsung" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vị trí ứng tuyển</label>
                <input type="text" name="position" value={form.position} onChange={handleChange} placeholder="VD: Công nhân sản xuất" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Công ty</label>
                <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Tên công ty" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nguồn ứng viên</label>
                <select name="data_source_type" value={form.data_source_type} onChange={handleChange} className={inputClass}>
                  <option value="">-- Chọn nguồn --</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Zalo">Zalo</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Người giới thiệu</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Nhân viên phụ trách</label>
                <input type="text" name="assigned_user" value={form.assigned_user} onChange={handleChange} placeholder="Tên nhân viên phụ trách" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu ứng viên
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
