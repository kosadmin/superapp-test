// Định nghĩa cấu trúc cho đối tượng nguồn dữ liệu để tránh lỗi Index Signature
interface MasterDataType {
  projects: string[];
  cities: string[];
  genders: string[];
  sourceDepartments: string[];
  sourceTypeGroupsByDept: {
    [key: string]: string[] | undefined; // Cho phép truy cập bằng key string bất kỳ
    "Marketing": string[];
    "Tuyển dụng": string[];
    "Quản lý nguồn": string[];
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
  }
};

// Export Type để sử dụng ở các file khác nếu cần
export type SourceDeptType = keyof typeof MASTER_DATA.sourceTypeGroupsByDept;
