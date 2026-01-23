// src/constants/masterData.ts

export const MASTER_DATA = {
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
  
  // Danh sách tỉnh thành (Bạn có thể thêm đầy đủ 63 tỉnh thành vào đây)
  cities: [
"An Giang",
"Bắc Ninh",
"Cà Mau",
"Cần Thơ",
"Cao Bằng​",
"Đà Nẵng",
"Đắk Lắk",
"Điện Biên",
"Đồng Nai",
"Đồng Tháp",
"Gia Lai",
"Hà Nội",
"Hà Tĩnh",
"Hải Phòng",
"Hồ Chí Minh",
"Huế",
"Hưng Yên",
"Khánh Hòa",
"Lai Châu",
"Lâm Đồng",
"Lạng Sơn",
"Lào Cai",
"Nghệ An",
"Ninh Bình",
"Phú Thọ",
"Quảng Ngãi",
"Quảng Ninh",
"Quảng Trị",
"Sơn La",
"Tây Ninh",
"Thái Nguyên",
"Thanh Hóa",
"Tuyên Quang",
"Vĩnh Long"
  ],

  
  // Giới tính (để đồng nhất)
  genders: ["Nam", "Nữ", "Khác"],

  // Danh sách bộ phận tạo nguồn
  sourceDepartments: [
    "Tuyển dụng",
    "Marketing",
    "Quản lý nguồn",
  ],

  // Danh sách Loại nguồn phụ thuộc vào Bộ phận
  // Key của object này phải trùng khớp với giá trị trong sourceDepartments
  sourceTypesByDept: {
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

export type SourceDeptType = keyof typeof MASTER_DATA.sourceTypesByDept;
