// Định nghĩa cấu trúc cho đối tượng nguồn dữ liệu để tránh lỗi Index Signature
interface MasterDataType {
  projects: string[];
  projectCompanyMap: Record<string, string>;
  cities: string[];
  genders: string[];
  sourceDepartments: string[];
  sourceTypeGroupsByDept: {
    [key: string]: string[] | undefined; // Cho phép truy cập bằng key string bất kỳ
    "Marketing": string[];
    "Tuyển dụng": string[];
    "Quản lý nguồn": string[];
  };
sourceTypesByGroup: {
    [key: string]: string[] | undefined;
  };
}

export const MASTER_DATA: MasterDataType = {
  // Danh sách dự án
  projects: [
    "Brother Tuyển dụng",
    "Sumidenso Tuyển dụng",
    "Tinh Lợi Tuyển dụng",
    "Crystal Sweater Tuyển dụng",
    "Heesung Tuyển dụng",
    "Canon Tuyển dụng",
    "Pegatron Tuyển dụng",
    "Taishodo Tuyển dụng",
    "Meiko Tuyển dụng",
    "Yazaki Tuyển dụng",
    "ShinEtsu Tuyển dụng",
    "Stavian Packaging Tuyển dụng",
    "Stavian Tissue Tuyển dụng",
    "LG Display Outsourcing",
    "VinFast Test xe Outsourcing",
    "ORPC Outsourcing",
    "Michang Outsourcing",
    "Nissin Outsourcing",
    "Kennametal Outsourcing",
    "Fairmont Outsourcing",
    "DH Vina Outsourcing"
  ],

  // --- THÊM PHẦN MAPPING NÀY ---
  projectCompanyMap: {
    "Brother Tuyển dụng": "Brother - Hải Dương",
    "Sumidenso Tuyển dụng": "Sumidenso - Hải Dương",
    "Tinh Lợi Tuyển dụng": "Tinh Lợi - Hải Dương",
    "Crystal Sweater Tuyển dụng": "Crystal Sweater - Hải Phòng",
    "Heesung Tuyển dụng": "Heesung - Hải Dương",
    "Canon Tuyển dụng": "Canon - Hưng Yên",
    "Pegatron Tuyển dụng": "Pegatron - Hải Phòng",
    "Taishodo Tuyển dụng": "Taishodo - Hải Dương",
    "Meiko Tuyển dụng": "Meiko - Hà Nội",
    "Yazaki Tuyển dụng": "Yazaki - Hải Phòng",
    "ShinEtsu Tuyển dụng": "ShinEtsu - Quảng Ninh",
    "Stavian Packaging Tuyển dụng": "Stavian Packaging - Hưng Yên",
    "Stavian Tissue Tuyển dụng": "Stavian Tissue - Hưng Yên",
    "LG Display Outsourcing": "LG Display - Hải Phòng",
    "VinFast Test xe Outsourcing": "VinFast - Hải Phòng",
    "ORPC Outsourcing": "ORPC - Hải Phòng",
    "Michang Outsourcing": "Michang - Hải Phòng",
    "Nissin Outsourcing": "Nissin - Hòa Bình",
    "Kennametal Outsourcing": "Kennametal - Hà Nội",
    "Fairmont Outsourcing": "Fairmont - Hà Nội",
    "DH Vina Outsourcing": "DH Vina - Hải Phòng"
  },

  // Danh sách tỉnh thành
  cities: [
    "An Giang", "Bắc Ninh", "Cà Mau", "Cần Thơ", "Cao Bằng​", "Đà Nẵng",
    "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội",
    "Hà Tĩnh", "Hải Phòng", "Hồ Chí Minh", "Huế", "Hưng Yên", "Khánh Hòa",
    "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Nghệ An", "Ninh Bình",
    "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
    "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long"
  ],

  // Giới tính
  genders: ["Nam", "Nữ", "Khác"],

  // Danh sách bộ phận tạo nguồn
  sourceDepartments: [
    "Tuyển dụng",
    "Marketing",
    "Quản lý nguồn",
  ],

  // Danh sách Loại nguồn phụ thuộc vào Bộ phận
  sourceTypeGroupsByDept: {
    "Marketing": [
      "Ads",
      "Tiktok Organic",
      "MKT Organic"
    ],
    "Tuyển dụng": [
      "Seeding"
    ],
    "Quản lý nguồn": [
      "Vendor/CTV",
      "Offline"
    ]
  },
  sourceTypesByGroup: {
    "Ads": ["Facebook Ads", "Tiktok Ads", "Zalo Ads"],
    "Tiktok Organic": ["Tiktok Video", "Tiktok Live", "Tiktok Inbox"],
    "MKT Organic": ["Hotline", "Zalo OA", "Website", "Group Facebook","Social khác"],
    "Seeding": ["Seeding thường", "Seeding tự động"],
    "Vendor/CTV": ["CTV cá nhân", "Vendor"],
    "Offline": ["Trường học", "Sự kiện tuyển dụng", "Cơ quan địa phương"]
  }
};

// Export Type để sử dụng ở các file khác nếu cần
export type SourceDeptType = keyof typeof MASTER_DATA.sourceTypeGroupsByDept;
