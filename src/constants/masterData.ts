// Định nghĩa cấu trúc cho đối tượng nguồn dữ liệu để tránh lỗi Index Signature
interface MasterDataType {
  projects: string[];
      projectTypeMap: Record<string, string>;
    projectIdMap: Record<string, string>;
  projectCompanyMap: Record<string, string>;
  cities: string[];
  genders: string[];
educationLevels: string[];
  sourceDepartments: string[];
  rejectReasonsOffer: string[];     
  rejectReasonsUnqualified: string[];
  candidateTags: string[];
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
    "Canon Tuyển dụng",
    "Crystal Sweater Tuyển dụng",
    "Heesung Tuyển dụng",
    "Meiko Tuyển dụng",
    "Pegatron Tuyển dụng",
    "ShinEtsu Tuyển dụng",
    "Stavian Packaging Tuyển dụng",
    "Stavian Tissue Tuyển dụng",
    "Sumidenso Tuyển dụng",
    "Taishodo Tuyển dụng",
    "Tinh Lợi Tuyển dụng",
    "Yazaki Tuyển dụng",
    "DH Vina Outsourcing",
    "Fairmont Outsourcing",
    "Kennametal Outsourcing",
    "LG Display Outsourcing",
    "Michang Outsourcing",
    "Nissin Outsourcing",
    "ORPC Outsourcing",
    "VinFast Outsourcing",
    "VinFast Test xe Outsourcing"
  ],

  projectIdMap: {
    "Brother Tuyển dụng": "Recruit_BRO",
    "Sumidenso Tuyển dụng": "Recruit_SUMI",
    "Tinh Lợi Tuyển dụng": "Recruit_TINHLOI",
    "Crystal Sweater Tuyển dụng": "Recruit_CSVL",
    "Heesung Tuyển dụng": "Recruit_HEESUNG",
    "Canon Tuyển dụng": "Recruit_CANON",
    "Pegatron Tuyển dụng": "Recruit_PEGATRON",
    "Taishodo Tuyển dụng": "Recruit_TAISHODO",
    "Meiko Tuyển dụng": "Recruit_MEIKO",
    "Yazaki Tuyển dụng": "Recruit_YAZAKI",
    "ShinEtsu Tuyển dụng": "Recruit_SHINETSU",
    "Stavian Packaging Tuyển dụng": "Recruit_STAPACK",
    "Stavian Tissue Tuyển dụng": "Recruit_STATIS",
    "LG Display Outsourcing": "OS_LGD",
    "VinFast Test xe Outsourcing": "OS_VFTEST",
    "ORPC Outsourcing": "OS_ORPC",
    "Michang Outsourcing": "OS_MICHANG",
    "Nissin Outsourcing": "OS_NISSIN",
    "Kennametal Outsourcing": "OS_KENNA",
    "Fairmont Outsourcing": "OS_FAIRMONT",
    "DH Vina Outsourcing": "OS_DHVINA",
        "VinFast Outsourcing": "OS_VinFast"
  },
  projectTypeMap: {
    "Brother Tuyển dụng": "Recruiting",
    "Sumidenso Tuyển dụng": "Recruiting",
    "Tinh Lợi Tuyển dụng": "Recruiting",
    "Crystal Sweater Tuyển dụng": "Recruiting",
    "Heesung Tuyển dụng": "Recruiting",
    "Canon Tuyển dụng": "Recruiting",
    "Pegatron Tuyển dụng": "Recruiting",
    "Taishodo Tuyển dụng": "Recruiting",
    "Meiko Tuyển dụng": "Recruiting",
    "Yazaki Tuyển dụng": "Recruiting",
    "ShinEtsu Tuyển dụng": "Recruiting",
    "Stavian Packaging Tuyển dụng": "Recruiting",
    "Stavian Tissue Tuyển dụng": "Recruiting",
    "LG Display Outsourcing": "Outsourcing",
    "VinFast Test xe Outsourcing": "Outsourcing",
    "ORPC Outsourcing": "Outsourcing",
    "Michang Outsourcing": "Outsourcing",
    "Nissin Outsourcing": "Outsourcing",
    "Kennametal Outsourcing": "Outsourcing",
    "Fairmont Outsourcing": "Outsourcing",
    "DH Vina Outsourcing": "Outsourcing",
        "VinFast Outsourcing": "Outsourcing"
  },
  // --- THÊM PHẦN MAPPING NÀY ---
  projectCompanyMap: {
    "Brother Tuyển dụng": "Brother - Hải Dương",
    "Sumidenso Tuyển dụng": "Sumidenso - Hải Dương",
    "Tinh Lợi Tuyển dụng": "Tinh Lợi - Hải Dương",
    "Crystal Sweater Tuyển dụng": "Crystal Sweater - Hải Phòng",
    "Heesung Tuyển dụng": "Heesung - Hải Phòng",
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
    "DH Vina Outsourcing": "DH Vina - Hải Phòng",
        "VinFast Outsourcing": "VinFast - Hải Phòng"
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

    // Trình độ học vấn
  educationLevels: ["PTCS", "PTTH", "Trung cấp", "Cao đẳng", "Đại học","Thạc sĩ","Tiến sĩ"],

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
      "MKT Organic khác"
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
    "MKT Organic khác": ["Hotline", "Zalo OA", "Website", "Group Facebook","Social khác"],
    "Seeding": ["Seeding thường", "Seeding tự động"],
    "Vendor/CTV": ["CTV cá nhân", "Vendor"],
    "Offline": ["Trường học", "Sự kiện tuyển dụng", "Cơ quan địa phương"]
  },
  rejectReasonsOffer: [
    "Lương thấp",
    "Đã có việc khác",
    "Không có nhu cầu",
      "Công việc không phù hợp",
    "Xa nhà, không có xe đón",
    "Lý do cá nhân",
    "Không muốn qua bên thứ 3 / nhà thầu",
    "Khác"
  ],
  rejectReasonsUnqualified: [
    "Không đạt về trình độ",
    "Không đạt về sức khỏe",
    "Thái độ không tốt",
    "Hồ sơ giả mạo",
        "Không gọi được quá nhiều lần",
    "Không thuộc địa điểm được phép tuyển",
    "Không thuộc độ tuổi được phép tuyển",
    "Khác"
  ],
  candidateTags: [
    "Ưu tiên",
    "Ra tết",
    "Chưa liên lạc được",
    "Sai số",
    "Đăng ký KTX",
    "Đăng ký tuyến xe"
  ]
};

// Export Type để sử dụng ở các file khác nếu cần
export type SourceDeptType = keyof typeof MASTER_DATA.sourceTypeGroupsByDept;
