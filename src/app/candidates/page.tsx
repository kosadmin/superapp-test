'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { MASTER_DATA } from '@/constants/masterData';
import * as XLSX from 'xlsx';

const N8N_URL = 'https://n8n.koutsourcing.vn/webhook-test/candidatetest';
const ITEMS_PER_PAGE = 50;

// --- UTILS ---
// Hàm hỗ trợ lấy màu sắc ngẫu nhiên nhưng cố định cho từng nhãn
const getTagStyles = (tag: string) => {
  const colors = [
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  ];
  
  // Hash đơn giản để tag nào luôn ra màu đó
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};
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

// --- CONFIG ---
interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  sortable?: boolean; // Thêm cờ cho phép sort
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Các cột chính đều cho phép sort
  { id: 'tags', label: 'Nhãn', width: 150, visible: true, sortable: false },
  { id: 'candidate_name', label: 'Họ tên', width: 180, visible: true, sortable: true },
  { id: 'status', label: 'Trạng thái', width: 120, visible: true, sortable: true },
  { id: 'phone', label: 'Số điện thoại', width: 130, visible: true, sortable: true }, // Sort số điện thoại
  { id: 'project', label: 'Dự án', width: 150, visible: true, sortable: true },
  { id: 'position', label: 'Vị trí ứng tuyển', width: 150, visible: true, sortable: true },
  { id: 'company', label: 'Công ty', width: 150, visible: true, sortable: true },
  
  // Ngày tháng rất cần sort
  { id: 'interview_date', label: 'Ngày PV', width: 110, visible: true, sortable: true },
  { id: 'onboard_date', label: 'Ngày Onboard', width: 110, visible: true, sortable: true },
  { id: 'created_at', label: 'Ngày tạo', width: 140, visible: false, sortable: true },
  
  // Các cột khác
    { id: 'assigned_user', label: 'ID Nhân viên phụ trách', width: 120, visible: false, sortable: true },
  { id: 'assigned_user_name', label: 'Người phụ trách', width: 150, visible: true, sortable: true },
    { id: 'assigned_user_group', label: 'Nhóm phụ trách', width: 130, visible: false, sortable: true },
    { id: 'other_phone', label: 'Số điện thoại khác', width: 130, visible: false, sortable: true },
  { id: 'candidate_id', label: 'Mã UV', width: 120, visible: false, sortable: true },
  { id: 'id_card_number', label: 'CCCD', width: 130, visible: false, sortable: false }, // Thường không sort CCCD
  { id: 'id_card_issued_date', label: 'Ngày cấp CCCD', width: 130, visible: false, sortable: true },
{ id: 'id_card_issued_place', label: 'Nơi cấp CCCD', width: 150, visible: false, sortable: true },
  { id: 'attachment_url', label: 'File đính kèm', width: 120, visible: false, sortable: false },
  { id: 'date_of_birth', label: 'Ngày sinh', width: 100, visible: false, sortable: true },
  { id: 'birth_year', label: 'Năm sinh', width: 80, visible: false, sortable: true },
    { id: 'gender', label: 'Giới tính', width: 80, visible: false, sortable: true },
  { id: 'address_street', label: 'Số nhà/Tên đường', width: 150, visible: false, sortable: false },
  { id: 'address_ward', label: 'Phường/Xã', width: 120, visible: false, sortable: false },
  { id: 'address_city', label: 'Tỉnh/Thành phố', width: 120, visible: false, sortable: true },
  { id: 'address_full', label: 'Địa chỉ đầy đủ', width: 250, visible: false, sortable: false },
  { id: 'email', label: 'Email', width: 180, visible: false, sortable: true },
{ id: 'education_level', label: 'Trình độ học vấn', width: 150, visible: false, sortable: true },
  { id: 'experience_summary', label: 'Tóm tắt kinh nghiệm làm việc', width: 250, visible: false, sortable: false },
{ id: 'job_wish', label: 'Nguyện vọng công việc', width: 200, visible: false, sortable: false },
  { id: 'take_note', label: 'Ghi chú chăm sóc', width: 200, visible: false, sortable: false },
  { id: 'project_id', label: 'ID dự án', width: 120, visible: false, sortable: true },
  { id: 'project_type', label: 'Loại dự án', width: 120, visible: false, sortable: true },
  { id: 'department', label: 'Bộ phận ứng tuyển', width: 120, visible: false, sortable: true },
  { id: 'data_source_dept', label: 'Bộ phận tạo nguồn', width: 120, visible: false, sortable: true },
  { id: 'data_source_type_group', label: 'Nhóm nguồn', width: 120, visible: false, sortable: true },
  { id: 'data_source_type', label: 'Loại nguồn cụ thể', width: 100, visible: false, sortable: true },
  { id: 'created_by', label: 'Người tạo', width: 120, visible: false, sortable: true },
  { id: 'last_updated_at', label: 'Cập nhật cuối', width: 140, visible: false, sortable: true },
];

interface Candidate {
  candidate_id: string;
  candidate_name: string;
  phone: string;
  tags?: string;
  [key: string]: any;
}

// Định nghĩa kiểu Filter
interface FilterState {
  status: string;
  project: string;
  assigned_user: string;
  tags: string;
}

const funnelSteps = [
  { key: 'new', label: 'Mới' },
  { key: 'interested', label: 'Quan tâm' },
  { key: 'scheduled_for_interview', label: 'Đăng ký PV' },
  { key: 'show_up_for_interview', label: 'Tham gia PV' },
  { key: 'pass_interview', label: 'Đỗ PV' },
  { key: 'onboard', label: 'Nhận việc' },
  { key: 'reject_offer', label: 'Từ chối' },
  { key: 'unqualified', label: 'Không đạt' },
];

function CandidatesContent() {
  const { user_group, user_id, isLoading: isAuthLoading } = useAuth();
  const canEditSource = user_group?.toLowerCase() === 'admin';
  
  // Data States
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [listLoading, setListLoading] = useState(true);
  
  // View States
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [frozenCount, setFrozenCount] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Toggle thanh Filter

  // Filter & Sort States
  const [filters, setFilters] = useState<FilterState>({ status: '', project: '', assigned_user: '',tags: '' });
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  // Detail States
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Candidate | null>(null);
  const [originalData, setOriginalData] = useState<Candidate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- INIT CONFIG ---
  useEffect(() => {
    const savedCols = localStorage.getItem('table_columns_config');
    const savedFrozen = localStorage.getItem('table_frozen_count');
    if (savedCols) setColumns(JSON.parse(savedCols));
    if (savedFrozen) setFrozenCount(parseInt(savedFrozen));
  }, []);

  // --- API CALLS ---
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
      }
    } catch (err) { console.error(err); }
    finally { setListLoading(false); }
  };

  useEffect(() => { if (user_group && user_id) fetchAllCandidates(); }, [user_group, user_id, isAuthLoading]);

  useEffect(() => {
  setCurrentPage(1);
}, [search, filters]);

  // --- DATA PROCESSING (SEARCH -> FILTER -> SORT) ---
  const processedData = useMemo(() => {
    let result = [...allCandidates];

    // 1. Search
    if (search.trim()) {
      const lowerSearch = search.toLowerCase().trim();
      result = result.filter(cand => 
        cand.candidate_name?.toLowerCase().includes(lowerSearch) ||
        cand.phone?.includes(search) ||
        cand.candidate_id?.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Filter Nâng cao
    if (filters.status) {
        // Mapping trạng thái text sang key boolean
        const statusMap: Record<string, string> = {
            'Mới': 'new', 'Quan tâm': 'interested', 'Đăng ký PV': 'scheduled_for_interview',
            'Tham gia PV': 'show_up_for_interview', 'Đỗ PV': 'pass_interview', 'Nhận việc': 'onboard',
            'Từ chối': 'reject_offer', 'Không đạt': 'unqualified'
        };
        // Tìm key tương ứng hoặc check logic custom
        const key = Object.keys(statusMap).find(k => k === filters.status);
        if (key) {
             const mappedKey = statusMap[key];
             // Logic lọc: Nếu là "Mới" thì các field khác phải false, các trường hợp còn lại check true
             if(mappedKey === 'new') {
                 result = result.filter(c => !c.interested && !c.scheduled_for_interview && !c.show_up_for_interview && !c.pass_interview && !c.onboard && !c.reject_offer && !c.unqualified);
             } else {
                 result = result.filter(c => c[mappedKey]);
             }
        }
    }
    if (filters.project) {
        result = result.filter(c => c.project === filters.project);
    }
    if (filters.assigned_user) {
        result = result.filter(c => c.assigned_user_name === filters.assigned_user);
    }
if (filters.tags) {
        result = result.filter(c => {
            if (!c.tags) return false;
            const tagList = c.tags.split(',').map((t: string) => t.trim());
            return tagList.includes(filters.tags);
        });
    }
    // 3. Sorting
    if (sortConfig.key) {
        result.sort((a, b) => {
            const aValue = a[sortConfig.key!] || '';
            const bValue = b[sortConfig.key!] || '';
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [allCandidates, search, filters, sortConfig]);

  // --- PAGINATION ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

// --- HANDLE SORT CLICK ---
  const handleSort = (colId: string) => {
    setSortConfig(current => {
        // Nếu đang click vào cột hiện tại
        if (current.key === colId) {
            if (current.direction === 'asc') return { key: colId, direction: 'desc' }; // Asc -> Desc
            return { key: null, direction: 'asc' }; // Desc -> Reset (Không sort)
        }
        // Nếu click vào cột mới -> Mặc định Asc
        return { key: colId, direction: 'asc' };
    });
  };

  // --- UNIQUE OPTIONS FOR FILTERS ---
  const uniqueProjects = useMemo(() => Array.from(new Set(allCandidates.map(c => c.project).filter(Boolean))), [allCandidates]);
  const uniqueUsers = useMemo(() => Array.from(new Set(allCandidates.map(c => c.assigned_user_name).filter(Boolean))), [allCandidates]);
  const statusOptions = ['Mới', 'Quan tâm', 'Đăng ký PV', 'Tham gia PV', 'Đỗ PV', 'Nhận việc', 'Từ chối', 'Không đạt'];

  // --- DETAIL & SETTINGS LOGIC (Keep same) ---
  const saveViewSettings = (newCols: ColumnConfig[], newFrozen: number) => {
    setColumns(newCols);
    setFrozenCount(newFrozen);
    localStorage.setItem('table_columns_config', JSON.stringify(newCols));
    localStorage.setItem('table_frozen_count', newFrozen.toString());
  };

  const fetchDetail = async (id: string) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', id, user_group, user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setOriginalData(data.data);
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

    // Tính toán thông tin tự động
// --- TÌM ĐOẠN NÀY VÀ SỬA ---
// Tính toán thông tin tự động
const birthYear = formData?.date_of_birth ? formData.date_of_birth.split('-')[0] : '';


// Khai báo thêm biến này để tránh lỗi "readOnlyClass is not defined" ở phần JSX bên dưới
const readOnlyClass = "w-full p-2.5 border rounded-xl mt-1 bg-gray-50 text-gray-500";
  
const handleChange = (field: string, value: any) => {
  setFormData(prev => {
    if (!prev) return null;
    let newData = { ...prev, [field]: value };
if (field === 'date_of_birth') {
      newData.birth_year = value ? value.split('-')[0] : '';
    }

    const addressFields = ['address_street', 'address_ward', 'address_city'];
    if (addressFields.includes(field)) {
      // Chúng ta lấy giá trị mới nhất từ newData để ghép chuỗi
      const full = [newData.address_street, newData.address_ward, newData.address_city]
        .filter(Boolean)
        .join(' - ');
      newData.address_full = full;
    }
    const funnelSteps = [
      'new', 
      'interested', 
      'scheduled_for_interview', 
      'show_up_for_interview', 
      'pass_interview', 
      'onboard'
    ];

    if (funnelSteps.includes(field)) {
      const currentIndex = funnelSteps.indexOf(field);

      if (value === true) {
        // 1. Nếu CLICK CHỌN: Tích TRUE cho tất cả các bước TRƯỚC nó
        for (let i = 0; i < currentIndex; i++) {
          newData[funnelSteps[i] as keyof typeof newData] = true;
        }
      } else {
        // 2. Nếu BỎ CLICK: Tích FALSE cho tất cả các bước SAU nó
        // Vì nếu bạn chưa phỏng vấn thì không thể có chuyện đã pass hay onboard được
        for (let i = currentIndex + 1; i < funnelSteps.length; i++) {
          newData[funnelSteps[i] as keyof typeof newData] = false;
        }
      }
    }

    return newData;
  });
};
// --- LOGIC MỚI: Xử lý thay đổi Dự án (Yêu cầu 3) ---
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        project: val,
        // Tự động điền các trường ReadOnly dựa vào MasterData
        project_id: MASTER_DATA.projectIdMap[val] || '',
        project_type: MASTER_DATA.projectTypeMap[val] || '',
        company: MASTER_DATA.projectCompanyMap[val] || '',
      };
    });
  };

  // --- LOGIC MỚI: Xử lý Cascading Dropdown cho Nguồn (Yêu cầu 7) ---
  const handleSourceDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => prev ? { 
      ...prev, 
      data_source_dept: val, 
      data_source_type_group: '', // Reset cấp con
      data_source_type: ''        // Reset cấp cháu
    } : null);
  };

  const handleSourceGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => prev ? { 
      ...prev, 
      data_source_type_group: val, 
      data_source_type: ''        // Reset cấp cháu
    } : null);
  };
const handleSave = async () => {
  if (!formData) return;

  // --- YÊU CẦU 2 & 3: VALIDATION TRƯỚC KHI LƯU ---
  
  // Kiểm tra Ngày phỏng vấn
  if (formData.scheduled_for_interview && !formData.interview_date) {
    alert("Vui lòng nhập 'Ngày phỏng vấn' khi đã lên lịch hẹn!");
    return;
  }

  // Kiểm tra Ngày nhận việc
  if (formData.pass_interview && !formData.onboard_date) {
    alert("Vui lòng nhập 'Ngày nhận việc' khi ứng viên đã đỗ PV!");
    return;
  }

  // Kiểm tra Lý do từ chối Offer
  if (formData.reject_offer && !formData.reason_rejected_offer) {
    alert("Vui lòng chọn 'Lý do từ chối Offer'!");
    return;
  }

  // Kiểm tra Lý do không đạt
  if (formData.unqualified && !formData.reason_unqualified) {
    alert("Vui lòng chọn 'Lý do không đạt'!");
    return;
  }
  if (!formData) return;

  // --- BỔ SUNG VALIDATION ---
  if (!formData.candidate_name?.trim()) return alert('Họ tên không được để trống');
  if (!formData.phone?.trim()) return alert('Số điện thoại không được để trống');
  
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(formData.phone)) return alert('Số điện thoại phải đúng 10 chữ số');

  if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
    return alert('Email không đúng định dạng');
  }
  // --------------------------

  setIsSaving(true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update',user_group, user_id, id: formData.candidate_id, updates: formData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Lưu thành công!');
        setOriginalData(formData);
        fetchAllCandidates(); // Reload list to update sorted/filtered data
      }
    } catch { alert('Lỗi kết nối'); }
    finally { setIsSaving(false); }
  };

// Thêm vào trong component CandidatesContent
const [showSuggestions, setShowSuggestions] = useState(false);
const handleAddTag = (tag: string) => {
  if (!formData) return;
  const currentTags = formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [];
  if (!currentTags.includes(tag)) {
    const newTags = [...currentTags, tag].join(', ');
    handleChange('tags', newTags);
  }
};

const handleRemoveTag = (tagToRemove: string) => {
  if (!formData || !formData.tags) return;
  const newTags = formData.tags
    .split(',')
    .map((t: string) => t.trim())
    .filter((t: string) => t !== tagToRemove)
    .join(', ');
  handleChange('tags', newTags);
};

// --- LOGIC MỚI: Xử lý Xóa ứng viên ---
const handleDelete = async () => {
  if (!formData || !formData.candidate_id) return;

  // 1. Xác nhận trước khi xóa
  const confirmDelete = window.confirm(
    `Bạn có chắc chắn muốn xóa ứng viên "${formData.candidate_name}" không?\nHành động này không thể hoàn tác!`
  );
  if (!confirmDelete) return;

  setIsSaving(true); // Tận dụng state loading
  try {
    // 2. Gọi API
    const res = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'delete', // Action mới
        user_group, 
        user_id, 
        id: formData.candidate_id 
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert('Đã xóa ứng viên thành công!');
      
      // 3. Cập nhật State Frontend (Xóa khỏi danh sách mà không cần load lại trang)
      setAllCandidates(prev => prev.filter(c => c.candidate_id !== formData.candidate_id));
      
      // 4. Đóng cửa sổ chi tiết
      setSelectedId(null);
      setFormData(null);
    } else {
      alert('Xóa thất bại: ' + (data.message || 'Lỗi không xác định'));
    }
  } catch (err) {
    console.error(err);
    alert('Lỗi kết nối đến hệ thống');
  } finally {
    setIsSaving(false);
  }
};

  const handleExportExcel = () => {
  // 1. Lấy danh sách các cột đang hiển thị (visible)
  const visibleColumns = columns.filter(col => col.visible);

  // 2. Chuyển đổi dữ liệu từ processedData (dữ liệu đã Search + Filter + Sort)
  const exportData = processedData.map(cand => {
    const row: any = {};
    visibleColumns.forEach(col => {
      let value = cand[col.id];

      // Format dữ liệu đặc biệt cho Excel
      if (col.id === 'status') {
        // Tái hiện logic lấy text trạng thái
        if (cand.unqualified) value = 'KHÔNG ĐẠT';
        else if (cand.reject_offer) value = 'TỪ CHỐI';
        else if (cand.onboard) value = 'ĐÃ NHẬN VIỆC';
        else if (cand.pass_interview) value = 'ĐỖ PV';
        else if (cand.show_up_for_interview) value = 'THAM GIA PV';
        else if (cand.scheduled_for_interview) value = 'ĐĂNG KÝ PV';
        else if (cand.interested) value = 'QUAN TÂM';
        else value = 'MỚI';
      } 
      else if (col.id.includes('date') || col.id === 'created_at') {
        // Đảm bảo format ngày tháng dễ nhìn trong Excel
        value = value ? value : '';
      }

      row[col.label] = value || ''; // Key của object là tiêu đề cột
    });
    return row;
  });

  // 3. Tạo Workbook và Worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách ứng viên");

  // 4. Cấu hình độ rộng cột cơ bản (tùy chọn)
  const wscols = visibleColumns.map(col => ({ wch: col.width / 7 })); 
  worksheet['!cols'] = wscols;

  // 5. Xuất file
  const fileName = `Danh_sach_ung_vien_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
  const hasChanges = JSON.stringify(originalData) !== JSON.stringify(formData);

  const toggleColumn = (id: string) => {
    const newCols = columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col);
    saveViewSettings(newCols, frozenCount);
  };
  const updateWidth = (id: string, width: number) => {
    const newCols = columns.map(col => col.id === id ? { ...col, width } : col);
    saveViewSettings(newCols, frozenCount);
  };
  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...columns];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    saveViewSettings(newCols, frozenCount);
  };

  const getFrozenStyle = (colId: string, index: number) => {
    if (index >= frozenCount) return {};
    let leftOffset = 0;
    for (let i = 0; i < index; i++) {
      if (columns[i].visible) leftOffset += columns[i].width;
    }
    return { position: 'sticky' as const, left: leftOffset, zIndex: 20 };
  };

  if (isAuthLoading || listLoading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden text-sm p-4 gap-4">
      
      {/* --- DANH SÁCH --- */}
      <div className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all duration-500 overflow-hidden ${selectedId ? 'w-1/2' : 'w-full'}`}>
        
        {/* HEADER TOOLBAR */}
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-blue-700 uppercase tracking-tight">Quản lý Ứng viên</h1>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${showFilters ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                >
                  🔍 BỘ LỌC
                </button>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${showSettings ? 'bg-gray-200' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                >
                   ⚙️ CỘT
                </button>
<button 
  onClick={handleExportExcel}
  className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition flex items-center gap-1"
>
  📥 XUẤT EXCEL
</button>
                <Link href="/dashboard" className="p-1.5 text-gray-400 hover:text-red-500 transition">✕</Link>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT hoặc mã ứng viên..."
              className="flex-1 px-4 py-2 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {!selectedId && <Link href="/candidates/new" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition whitespace-nowrap">THÊM MỚI</Link>}
          </div>

          {/* FILTER BAR (Hiện ra khi bấm nút) */}
          {showFilters && (
             <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl grid grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Trạng thái</label>
                    <select 
                        className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Dự án</label>
                    <select 
                        className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        value={filters.project}
                        onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
                    >
                        <option value="">Tất cả dự án</option>
                        {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Người phụ trách</label>
                    <select 
                        className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
                        value={filters.assigned_user}
                        onChange={(e) => setFilters(prev => ({ ...prev, assigned_user: e.target.value }))}
                    >
                        <option value="">Tất cả nhân sự</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                 </div>
               <div>
      <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Nhãn</label>
      <select 
        className="w-full p-2 border rounded-lg text-sm outline-none focus:border-blue-500 bg-white"
        value={filters.tags}
        onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
      >
        <option value="">Tất cả nhãn</option>
        {MASTER_DATA.candidateTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
      </select>
    </div>
             </div>
          )}
        </div>

        {/* TABLE DATA */}
        <div className="flex-1 overflow-auto relative bg-white">
          <table className="text-left border-separate border-spacing-0 w-full">
       <thead className="bg-gray-50 sticky top-0 z-30 shadow-sm">
              <tr>
                {columns.map((col, idx) => col.visible && (
                  <th 
                    key={col.id}
                    // Thêm sự kiện onClick vào cả ô th
                    onClick={() => col.sortable && handleSort(col.id)}
                    style={{ width: col.width, minWidth: col.width, ...getFrozenStyle(col.id, idx) }}
                    className={`
                        p-3 border-b border-r text-[10px] uppercase font-bold text-gray-600 bg-gray-50 select-none transition-colors duration-150
                        ${col.sortable ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-700' : 'cursor-default'}
                    `}
                    title={col.sortable ? "Bấm để sắp xếp" : ""}
                  >
                    <div className="flex items-center justify-between gap-2">
                        <span>{col.label}</span>
                        
                        {/* Hiển thị Icon Sort */}
                        {col.sortable && (
                            <div className="flex flex-col text-[8px] leading-[6px]">
                                {/* Mũi tên lên: Active nếu sort key trùng và direction là asc, ngược lại màu xám nhạt */}
                                <span className={`${sortConfig.key === col.id && sortConfig.direction === 'asc' ? 'text-blue-600 font-bold scale-125' : 'text-gray-300'}`}>▲</span>
                                
                                {/* Mũi tên xuống: Active nếu sort key trùng và direction là desc */}
                                <span className={`${sortConfig.key === col.id && sortConfig.direction === 'desc' ? 'text-blue-600 font-bold scale-125' : 'text-gray-300'}`}>▼</span>
                            </div>
                        )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedData.map((cand) => (
                <tr 
                  key={cand.candidate_id} 
                  onClick={() => fetchDetail(cand.candidate_id)}
                  className={`cursor-pointer transition-colors ${selectedId === cand.candidate_id ? 'bg-blue-50' : 'hover:bg-gray-50 bg-white'}`}
                >
                  {columns.map((col, idx) => col.visible && (
                    <td 
                      key={col.id}
                      style={{ ...getFrozenStyle(col.id, idx) }}
                      className="p-3 border-r whitespace-nowrap overflow-hidden text-ellipsis bg-inherit"
                    >
                      {renderCell(col.id, cand)}
                    </td>
                  ))}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                  <tr>
                      <td colSpan={columns.filter(c => c.visible).length} className="p-8 text-center text-gray-400 italic">
                          Không tìm thấy dữ liệu phù hợp
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-3 border-t bg-white flex items-center justify-between">
           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
               Tổng: {processedData.length} ứng viên | Trang {currentPage}/{totalPages || 1}
           </span>
           <div className="flex gap-1">
             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">‹</button>
             <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-30 transition">›</button>
           </div>
        </div>
      </div>

      {/* --- CHI TIẾT --- */}
      {selectedId && (
        <div className="w-1/2 flex flex-col bg-white rounded-xl shadow-xl border overflow-hidden animate-in slide-in-from-right duration-500">
           {detailLoading ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="italic text-gray-400">Đang tải dữ liệu...</span>
             </div>
           ) : formData && (
             <>
               {/* Header Detail */}
               <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-200 rounded-full transition">✕</button>
                    <div>
<input 
      className="font-bold text-base uppercase text-blue-800 leading-none bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-600 outline-none w-full"
      value={formData.candidate_name} 
      onChange={(e) => handleChange('candidate_name', e.target.value)}
    />
    <span className="text-[12px] font-mono text-gray-400">{formData.candidate_id}</span>
</div>
                  </div>
                  <div className="flex gap-2">
{user_group?.toLowerCase() === 'admin' && (
  <button
    onClick={handleDelete}
    disabled={isSaving}
    className="px-4 py-2 rounded-xl font-bold transition border border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white hover:shadow-red-200 shadow-sm whitespace-nowrap"
  >
    🗑️ XÓA
  </button>
)}
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className={`px-6 py-2 rounded-xl font-bold transition shadow-lg ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                      </button>
                  </div>
               </div>

               {/* Body Detail */}
               <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 scrollbar-thin">
       <section className="relative">
  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-xl focus-within:border-pink-500 bg-white transition-all">
    {/* Danh sách nhãn đã chọn */}
    {formData.tags?.split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-pink-50 text-pink-600 rounded-md text-[10px] font-bold border border-pink-100">
        {tag}
        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 text-xs">×</button>
      </span>
    ))}

    {/* Input thêm tag */}
    <div className="relative flex-1 min-w-[120px]">
      <input 
        type="text"
        placeholder="Thêm nhãn..."
        className="w-full outline-none text-sm bg-transparent"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay để kịp nhận click vào gợi ý
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = (e.target as HTMLInputElement).value.trim();
            if (val) {
              handleAddTag(val);
              (e.target as HTMLInputElement).value = '';
            }
          }
        }}
      />

      {/* Dropdown Gợi ý */}
      {showSuggestions && (
        <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-white border rounded-lg shadow-xl p-1 animate-in fade-in slide-in-from-top-1">
          <p className="text-[9px] text-gray-400 font-bold px-2 py-1 uppercase">Gợi ý nhanh</p>
          {MASTER_DATA.candidateTags.map(sTag => (
            <button
              key={sTag}
              onClick={() => {
                handleAddTag(sTag);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-pink-50 hover:text-pink-600 rounded text-xs transition"
            >
              + {sTag}
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
</section>
                  {/* 1. FUNNEL */}
                  <section className="bg-white p-0 rounded-2xl">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-[0.2em] px-1">Tiến độ tuyển dụng (Phễu)</h3>
                    <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {funnelSteps.map(step => {
                        const isNegative = step.key === 'reject_offer' || step.key === 'unqualified';
                        const activeClass = isNegative
                            ? 'border-gray-500 bg-gray-500 text-white shadow-md font-bold ring-2 ring-gray-200' 
                            : 'border-blue-600 bg-blue-600 text-white shadow-md font-bold ring-2 ring-blue-100';
                        return (
                            <label key={step.key} className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all min-w-[90px] ${formData[step.key] ? activeClass : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                              <span className="text-[9px] mb-2 uppercase text-center leading-tight">{step.label}</span>
                              <input type="checkbox" checked={!!formData[step.key]} onChange={(e) => handleChange(step.key, e.target.checked)} className={`w-4 h-4 rounded-md focus:ring-offset-0 ${isNegative ? 'text-gray-600 focus:ring-gray-500' : 'text-blue-600 focus:ring-blue-500'}`} />
                            </label>
                        )
                      })}
                    </div>
                  </section>

                  {/* 2. THÔNG TIN LỊCH HẸN */}
                  <section>
                        <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-emerald-500 pl-3 text-xs uppercase tracking-wider">Thông tin lịch hẹn</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày phỏng vấn</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-emerald-50/30 focus:bg-white focus:border-emerald-500 transition" value={formData.interview_date|| ''} onChange={e => handleChange('interview_date', e.target.value)} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày nhận việc</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1 outline-none bg-emerald-50/30 focus:bg-white focus:border-emerald-500 transition" value={formData.onboard_date|| ''} onChange={e => handleChange('onboard_date', e.target.value)} /></div>
                            </div>
                            <div className="space-y-3">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do từ chối Offer</label><select 
            className="w-full p-2.5 border rounded-xl mt-1 text-sm outline-none bg-gray-50 focus:bg-white"
            value={formData.reason_rejected_offer || ''} 
            onChange={e => handleChange('reason_rejected_offer', e.target.value)}
        >
            <option value="">-- Chọn lý do --</option>
            {MASTER_DATA.rejectReasonsOffer.map(r => <option key={r} value={r}>{r}</option>)}
        </select></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lý do không đạt</label><select 
            className="w-full p-2.5 border rounded-xl mt-1 text-sm outline-none bg-gray-50 focus:bg-white"
            value={formData.reason_unqualified || ''} 
            onChange={e => handleChange('reason_unqualified', e.target.value)}
        >
            <option value="">-- Chọn lý do --</option>
            {MASTER_DATA.rejectReasonsUnqualified.map(r => <option key={r} value={r}>{r}</option>)}
        </select></div>
                            </div>
                        </div>
                  </section>

                  {/* 3. JOB INFO */}
<section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-blue-600 pl-3 text-xs uppercase tracking-wider">Thông tin tuyển dụng</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
    {/* DỰ ÁN (Select Box) */}
    <div className="col-span-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Dự án <span className="text-red-500">*</span></label>
      <select 
        className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" 
        value={formData.project || ''} 
        onChange={handleProjectChange} // Dùng hàm handle mới tạo
      >
        <option value="">-- Chọn dự án --</option>
        {MASTER_DATA.projects.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>

    {/* CÁC TRƯỜNG READ ONLY (Tự động điền) */}
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID Dự án</label>
        <input className={readOnlyClass} value={formData.project_id || ''} readOnly />
    </div>
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Loại dự án</label>
        <input className={readOnlyClass} value={formData.project_type || ''} readOnly />
    </div>
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Công ty</label>
        <input className={readOnlyClass} value={formData.company || ''} readOnly />
    </div>

    {/* Các trường nhập tay còn lại */}
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vị trí ứng tuyển</label>
        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.position || ''} onChange={e => handleChange('position', e.target.value)} />
    </div>
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bộ phận ứng tuyển</label>
        <input className="w-full p-2.5 border rounded-xl mt-1" value={formData.department || ''} onChange={e => handleChange('department', e.target.value)} />
    </div>
  </div>
</section>

                  {/* 4. PERSONAL INFO */}
         <section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin cá nhân</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
    {/* Thêm Giới tính */}
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Giới tính</label>
      <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.gender || ''} onChange={e => handleChange('gender', e.target.value)}>
        <option value="">-- Chọn giới tính --</option>
{MASTER_DATA.genders.map((item) => (
  <option key={item} value={item}>{item}</option>
))}
      </select>
    </div>
    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-700" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
        <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại khác</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-700" value={formData.other_phone || ''} onChange={e => handleChange('other_phone', e.target.value)} /></div>
        <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label><input className="w-full p-2.5 border rounded-xl mt-1 font-bold text-blue-700" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày sinh</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.date_of_birth || ''} onChange={e => handleChange('date_of_birth', e.target.value)} /></div>
<div>
    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Năm sinh</label>
    <input 
      className={readOnlyClass} 
      value={formData.birth_year || ''} 
      readOnly 
    />
</div>

      </div>
</section>

                          <section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Thông tin CCCD</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-4">

    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số CCCD</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_number || ''} onChange={e => handleChange('id_card_number', e.target.value)} /></div>
    <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày cấp CCCD</label><input type="date" className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_date|| ''} onChange={e => handleChange('id_card_issued_date', e.target.value)} /></div>
    <div className="col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nơi cấp CCCD</label><input className="w-full p-2.5 border rounded-xl mt-1" value={formData.id_card_issued_place || ''} onChange={e => handleChange('id_card_issued_place', e.target.value)} /></div>
    
  
  </div>
</section>

                          <section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-purple-500 pl-3 text-xs uppercase tracking-wider">Địa chỉ thường trú</h3>
  <div className="space-y-4">
                     {/* Địa chỉ chi tiết */}
    <div className="col-span-2 grid grid-cols-3 gap-3">
       <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số nhà / Tên đường</label><input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_street || ''} onChange={e => handleChange('address_street', e.target.value)} /></div>
       <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phường / Xã</label><input className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_ward || ''} onChange={e => handleChange('address_ward', e.target.value)} /></div>
          <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tỉnh / Thành phố</label>
      <select className="w-full p-2.5 border rounded-xl mt-1 text-sm" value={formData.address_city || ''} onChange={e => handleChange('address_city', e.target.value)}>
        <option value="">-- Chọn --</option>
{MASTER_DATA.cities.map((item) => (
  <option key={item} value={item}>{item}</option>
))}
      </select>
    </div>
    </div>
<input 
      type="text" 
      value={formData.address_full || ''} 
      readOnly 
      className={readOnlyClass} 
      placeholder="Địa chỉ hiển thị tự động" 
    />
  </div>
</section>

                 <section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-orange-500 pl-3 text-xs uppercase tracking-wider">Học vấn & Kinh nghiệp</h3>
  <div className="space-y-4">
<div>
  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Trình độ học vấn</label>
  <select 
    className="w-full p-2.5 border rounded-xl mt-1 bg-white" 
    value={formData.education_level || ''} 
    onChange={e => handleChange('education_level', e.target.value)}
  >
    <option value="">-- Chọn trình độ --</option>
    {MASTER_DATA.educationLevels.map(lvl => (
      <option key={lvl} value={lvl}>{lvl}</option>
    ))}
  </select>
</div>
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Tóm tắt kinh nghiệm làm việc</label>
      <textarea className="w-full p-3 border rounded-xl mt-1 h-24 outline-none focus:ring-2 focus:ring-blue-500" value={formData.experience_summary || ''} onChange={e => handleChange('experience_summary', e.target.value)} />
    </div>
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nguyện vọng công việc</label>
      <textarea className="w-full p-3 border rounded-xl mt-1 h-20 outline-none focus:ring-2 focus:ring-blue-500 text-blue-800" value={formData.job_wish || ''} onChange={e => handleChange('job_wish', e.target.value)} />
    </div>
            <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ghi chú chăm sóc</label>
      <textarea className="w-full p-3 border rounded-xl mt-1 h-24 outline-none focus:ring-2 focus:ring-blue-500" value={formData.take_note || ''} onChange={e => handleChange('take_note', e.target.value)} />
    </div>
  </div>
</section>


                                   {/* 5. SOURCE INFO */}
{/* 5. SOURCE INFO */}
<section>
  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-blue-600 pl-3 text-xs uppercase tracking-wider">Nguồn dữ liệu</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
    
    {/* 1. Bộ phận (Cấp 1) */}
    <div>
       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Bộ phận tạo nguồn</label>
       <select 
         // Logic disable: Nếu KHÔNG phải admin thì disable
         disabled={!canEditSource}
         className={`w-full p-2.5 border rounded-xl mt-1 ${!canEditSource ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
         value={formData.data_source_dept || ''} 
         onChange={handleSourceDeptChange}
       >
          <option value="">-- Chọn bộ phận --</option>
          {MASTER_DATA.sourceDepartments.map(d => <option key={d} value={d}>{d}</option>)}
       </select>
    </div>

    {/* 2. Nhóm nguồn (Cấp 2) */}
    <div>
       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nhóm nguồn</label>
       <select 
         // Logic disable: Không phải admin HOẶC chưa chọn cấp 1
         disabled={!canEditSource || !formData.data_source_dept} 
         className={`w-full p-2.5 border rounded-xl mt-1 ${(!canEditSource || !formData.data_source_dept) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
         value={formData.data_source_type_group || ''} 
         onChange={handleSourceGroupChange}
       >
          <option value="">-- Chọn nhóm --</option>
          {formData.data_source_dept && MASTER_DATA.sourceTypeGroupsByDept[formData.data_source_dept as keyof typeof MASTER_DATA.sourceTypeGroupsByDept]?.map(g => (
              <option key={g} value={g}>{g}</option>
          ))}
       </select>
    </div>

    {/* 3. Loại nguồn (Cấp 3) */}
    <div className="col-span-2">
       <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Loại nguồn cụ thể</label>
       <select 
         // Logic disable: Không phải admin HOẶC chưa chọn cấp 2
         disabled={!canEditSource || !formData.data_source_type_group}
         className={`w-full p-2.5 border rounded-xl mt-1 ${(!canEditSource || !formData.data_source_type_group) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
         value={formData.data_source_type || ''} 
         onChange={e => handleChange('data_source_type', e.target.value)}
       >
          <option value="">-- Chọn loại nguồn --</option>
          {formData.data_source_type_group && MASTER_DATA.sourceTypesByGroup[formData.data_source_type_group as keyof typeof MASTER_DATA.sourceTypesByGroup]?.map(t => (
              <option key={t} value={t}>{t}</option>
          ))}
       </select>
    </div>
  </div>

  <h3 className="text-gray-800 font-bold mb-5 border-l-4 border-gray-500 pl-3 text-xs uppercase tracking-wider">Người phụ trách (Read Only)</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID Nhân viên</label>
        <input className={readOnlyClass} value={formData.assigned_user || ''} readOnly />
    </div>
    <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Họ tên nhân viên</label>
        <input className={readOnlyClass} value={formData.assigned_user_name || ''} readOnly />
    </div>
    <div className="col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nhóm phụ trách</label>
        <input className={readOnlyClass} value={formData.assigned_user_group || ''} readOnly />
    </div>
  </div>
</section>

                                  <section>
  <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-blue-400 pl-3 text-xs uppercase tracking-wider">Tài liệu đính kèm</h3>
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt trước CCCD</label>
        {formData.id_card_front_img ? (
          <img src={formData.id_card_front_img} alt="CCCD Trước" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" />
        ) : (
          <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>
        )}
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Mặt sau CCCD</label>
        {formData.id_card_back_img ? (
          <img src={formData.id_card_back_img} alt="CCCD Sau" className="mt-2 w-full h-32 object-cover rounded-lg border shadow-sm" />
        ) : (
          <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">Chưa có ảnh</div>
        )}
      </div>
    </div>
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase">CV / File đính kèm</label>
      {formData.attachment_url ? (
        <a href={formData.attachment_url} target="_blank" className="mt-2 flex items-center gap-2 p-3 bg-white border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-50 transition font-bold">
          📄 XEM FILE ĐÍNH KÈM
        </a>
      ) : (
        <div className="mt-2 p-3 bg-gray-50 border border-dashed rounded-xl text-gray-400 text-center text-xs">Không có file</div>
      )}
    </div>
  </div>
</section>
                                  
                  {/* 6. SYSTEM INFO */}
                  <section>
                      <h3 className="text-gray-800 font-bold mb-4 border-l-4 border-gray-400 pl-3 text-xs uppercase tracking-wider">Thông tin hệ thống</h3>
                      <div className="space-y-3">
                          {['created_at', 'created_by', 'last_updated_at'].map(field => (
                              <div key={field}><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{DEFAULT_COLUMNS.find(c => c.id === field)?.label || field}</label><input className="w-full p-2.5 border rounded-xl mt-1 bg-white text-gray-500 text-xs" value={formData[field] || ''} readOnly /></div>
                          ))}
                      </div>
                  </section>
               </div>
             </>
           )}
        </div>
      )}

      {/* --- SETTINGS OVERLAY --- */}
      {showSettings && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-2xl z-[100] border rounded-2xl flex flex-col animate-in slide-in-from-right overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-bold uppercase text-xs tracking-widest">Cấu hình hiển thị</h3>
                <button onClick={() => setShowSettings(false)} className="hover:rotate-90 transition duration-200 text-xl">✕</button>
            </div>
            <div className="p-5 border-b space-y-3 bg-gray-50">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghim cột đầu tiên</label>
                <div className="flex items-center gap-3">
                    <input type="number" min="0" max="5" value={frozenCount} onChange={(e) => saveViewSettings(columns, parseInt(e.target.value) || 0)} className="w-20 p-2 border rounded-xl text-center font-bold text-blue-600 shadow-inner" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin">
                {columns.map((col, idx) => (
                    <div key={col.id} className={`flex items-center gap-3 p-2.5 border rounded-xl text-[11px] transition ${col.visible ? 'border-blue-100 bg-blue-50/30' : 'opacity-50 grayscale bg-gray-50'}`}>
                        <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} className="w-4 h-4 rounded text-blue-600" />
                        <span className="flex-1 font-bold text-gray-700 truncate">{col.label}</span>
                        <input type="number" value={col.width} onChange={(e) => updateWidth(col.id, parseInt(e.target.value) || 50)} className="w-12 p-1 border rounded text-[10px] text-center bg-white" />
                        <div className="flex flex-col gap-1">
                            <button onClick={() => moveColumn(idx, 'up')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-blue-600">▲</button>
                            <button onClick={() => moveColumn(idx, 'down')} className="bg-white border shadow-sm px-1.5 rounded-md hover:text-blue-600">▼</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}

function renderCell(colId: string, cand: any) {
    switch (colId) {
case 'tags':
  return (
    <div className="flex gap-1 flex-wrap max-w-[150px]">
      {cand.tags?.split(',').slice(0, 3).map((t: string) => {
        const tag = t.trim();
        const styles = getTagStyles(tag);
        return (
          <span 
            key={tag} 
            className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-tighter shadow-sm ${styles.bg} ${styles.text} ${styles.border}`}
          >
            {tag}
          </span>
        );
      })}
      {cand.tags?.split(',').length > 3 && (
        <span className="text-[9px] text-gray-400 font-bold">...</span>
      )}
    </div>
  );
        case 'candidate_name': return <div className="font-bold text-blue-900 leading-tight">{cand.candidate_name}</div>;
        case 'status': return <StatusBadge cand={cand} />;
        case 'interview_date': return <span className="text-blue-600 font-bold">{cand.interview_date || '—'}</span>;
        case 'onboard_date': return <span className="text-emerald-600 font-bold">{cand.onboard_date || '—'}</span>;
        case 'phone': return <span className="font-mono font-medium">{cand.phone}</span>;
        default: return <span className="text-gray-600">{cand[colId] || <span className="text-gray-200">—</span>}</span>;
    }
}

function StatusBadge({ cand }: { cand: any }) {
    const common = "px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter shadow-sm inline-block";
    if (cand.unqualified) return <span className={`${common} bg-gray-500 text-white`}>KHÔNG ĐẠT</span>;
    if (cand.reject_offer) return <span className={`${common} bg-gray-500 text-white`}>TỪ CHỐI</span>;
    if (cand.onboard) return <span className={`${common} bg-green-600 text-white`}>ĐÃ NHẬN VIỆC</span>;
    if (cand.pass_interview) return <span className={`${common} bg-blue-600 text-white`}>ĐỖ PV</span>;
    if (cand.show_up_for_interview) return <span className={`${common} bg-cyan-500 text-white`}>THAM GIA PV</span>;
    if (cand.scheduled_for_interview) return <span className={`${common} bg-red-500 text-white`}>ĐĂNG KÝ PV</span>;
    if (cand.interested) return <span className={`${common} bg-amber-500 text-white`}>QUAN TÂM</span>;
    return <span className={`${common} bg-gray-200 text-gray-500`}>MỚI</span>;
}

export default function CandidatesList() {
  return <ProtectedRoute><CandidatesContent /></ProtectedRoute>;
}
