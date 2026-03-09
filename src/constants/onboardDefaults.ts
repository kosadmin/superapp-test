// constants/onboardDefaults.ts
// Chỉnh sửa file này khi cần thay đổi người phụ trách mặc định lúc onboard

// --- Người phụ trách 247 (cố định, không phụ thuộc project) ---
const DEFAULT_247 = {
  assigned_247_user:       'KOSHO0006',
  assigned_247_user_name:  'Khiếu Thị Bích Lệ',
  assigned_247_user_group: 'manager',
};

// --- Người phụ trách Adminonsite (theo từng project) ---
const ADMINONSITE_BY_PROJECT: Record<string, { assigned_adminonsite_user: string; assigned_adminonsite_user_name: string; assigned_adminonsite_user_group: string }> = {
  'LG Display Outsourcing': {
    assigned_adminonsite_user:       'KOSHO0134',
    assigned_adminonsite_user_name:  'Nguyễn Văn Sơn',
    assigned_adminonsite_user_group: 'adminonsite',
  },
  'Fairmont Outsourcing': {
    assigned_adminonsite_user:       'KOSHO0059',
    assigned_adminonsite_user_name:  'Ngô Thị Thu Huyền',
    assigned_adminonsite_user_group: 'c&b',
  },
};

// --- Hàm chính: gọi từ candidate_page khi onboard = true ---
export const getOnboardAssignments = (project: string) => {
  const adminonsite = ADMINONSITE_BY_PROJECT[project] ?? {
    assigned_adminonsite_user:       '',
    assigned_adminonsite_user_name:  '',
    assigned_adminonsite_user_group: '',
  };

  return {
    ...adminonsite,
    ...DEFAULT_247,
  };
};
