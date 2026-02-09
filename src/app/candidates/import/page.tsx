'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, UploadCloud, AlertCircle, CheckCircle2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { MASTER_DATA, API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function ImportCandidateContent() {
    // Lấy thông tin user từ Auth
    const { user_id, user_group } = useAuth();
    const [importResults, setImportResults] = useState<any[]>([]); // Lưu kết quả trả về từ n8n
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{row: number, msg: string}[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    
    // Thêm key cho input để có thể reset
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    // Hàm Reset trạng thái
const handleReset = () => {
    setData([]);
    setErrors([]);
    setImportResults([]); // Thêm dòng này
    setUploadStatus('idle');
    setFileInputKey(Date.now());
};

    // 1. Hàm đọc file
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // Đọc từ dòng 2 (index 1) để lấy header làm key cho object
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 1 });
            validateExcelData(rawData);
        };
        reader.readAsBinaryString(file);
    };

    // 2. Logic Validation mới
 const validateExcelData = (rows: any[]) => {
        const errLog: { row: number, msg: string }[] = [];
        const validRows: any[] = [];
        
        // Regex định dạng chuẩn
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
        const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;

        rows.forEach((row: any, index: number) => {
            const rowNum = index + 3; // Dòng thực tế trong Excel
            const currentErrors: string[] = [];

            // --- NHÓM 1: BẮT BUỘC ĐIỀN (KHÔNG ĐƯỢC TRỐNG) ---
            if (!row.candidate_name?.toString().trim()) currentErrors.push("Thiếu Họ tên");
            if (!row.phone?.toString().trim()) currentErrors.push("Thiếu Số điện thoại");
            if (!row.data_source_dept?.toString().trim()) currentErrors.push("Thiếu Bộ phận nguồn");
            if (!row.data_source_type_group?.toString().trim()) currentErrors.push("Thiếu Nhóm nguồn");
            if (!row.data_source_type?.toString().trim()) currentErrors.push("Thiếu Nguồn chi tiết");

            // --- NHÓM 2: CÓ THỂ TRỐNG, NHƯNG NẾU ĐIỀN THÌ PHẢI ĐÚNG ---
            
            // Validate SĐT (Nếu có)
            if (row.phone && !phoneRegex.test(row.phone.toString().trim())) {
                currentErrors.push("SĐT không đúng định dạng (10 chữ số, bắt đầu từ 0)");
            }

            // Validate Giới tính
            if (row.gender && !MASTER_DATA.genders.includes(row.gender.trim())) {
                currentErrors.push(`Giới tính "${row.gender}" không đúng danh mục`);
            }

            // Validate Tỉnh thành
            if (row.address_city && !MASTER_DATA.cities.includes(row.address_city.trim())) {
                currentErrors.push(`Tỉnh thành "${row.address_city}" không hợp lệ`);
            }

            // Validate Trình độ học vấn
            if (row.education_level && !MASTER_DATA.educationLevels.includes(row.education_level.trim())) {
                currentErrors.push(`Học vấn "${row.education_level}" không đúng danh mục`);
            }

            // Validate Dự án
            if (row.project && !MASTER_DATA.projects.includes(row.project.trim())) {
                currentErrors.push(`Dự án "${row.project}" không tồn tại`);
            }

            // Validate Ngày sinh (YYYY-MM-DD)
            if (row.date_of_birth && !dateRegex.test(row.date_of_birth.toString().trim())) {
                currentErrors.push(`Ngày sinh "${row.date_of_birth}" sai định dạng YYYY-MM-DD`);
            }

            // Validate Ngày cấp CCCD (YYYY-MM-DD)
            if (row.id_card_issued_date && !dateRegex.test(row.id_card_issued_date.toString().trim())) {
                currentErrors.push(`Ngày cấp CCCD "${row.id_card_issued_date}" sai định dạng YYYY-MM-DD`);
            }

            // --- NHÓM 3: VALIDATION 3 LỚP CHO NGUỒN (VÌ BẮT BUỘC NÊN PHẢI CHECK KHỚP NHAU) ---
            const dept = row.data_source_dept?.toString().trim();
            const group = row.data_source_type_group?.toString().trim();
            const type = row.data_source_type?.toString().trim();

            if (dept && group) {
                const validGroups = (MASTER_DATA as any).sourceTypeGroupsByDept[dept] || [];
                if (!validGroups.includes(group)) {
                    currentErrors.push(`Nhóm "${group}" không thuộc Bộ phận "${dept}"`);
                } else if (type) {
                    const validTypes = (MASTER_DATA as any).sourceTypesByGroup[group] || [];
                    if (!validTypes.includes(type)) {
                        currentErrors.push(`Nguồn "${type}" không thuộc Nhóm "${group}"`);
                    }
                }
            }

            // Tổng hợp lỗi
            if (currentErrors.length > 0) {
                errLog.push({ row: rowNum, msg: currentErrors.join(" | ") });
            } else {
                validRows.push(row);
            }
        });

        setErrors(errLog);
        setData(validRows);
    };
    
 const handlePushToN8N = async () => {
    if (errors.length > 0) return alert("Vui lòng sửa hết lỗi trước khi gửi!");
    setIsUploading(true);
    setImportResults([]); // Xóa kết quả cũ nếu có

    try {
        const response = await fetch(API_CONFIG.CANDIDATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'import',
                user_id,
                user_group,
                import_source: "Excel_Web_CRM",
                timestamp: new Date().toISOString(),
                payload: data
            })
        });

        if (response.ok) {
            const resultData = await response.json(); // Nhận danh sách kết quả từ n8n
            setImportResults(resultData); // Lưu vào biến để hiển thị
            setUploadStatus('success');
            // Không nên handleReset() ngay để người dùng còn xem kết quả
            setData([]); // Xóa dữ liệu chờ để tránh bấm gửi lại
        } else {
            setUploadStatus('error');
            alert("Có lỗi xảy ra trong quá trình xử lý trên máy chủ.");
        }
    } catch (error) {
        setUploadStatus('error');
        alert("Lỗi kết nối: " + error);
    } finally {
        setIsUploading(false);
    }
};

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/candidates" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase">Import ứng viên</h1>
                            <p className="text-gray-500 text-sm">Vui lòng kiểm tra kỹ định dạng ngày và danh mục MasterData</p>
                        </div>
                        {/* NÚT RESET */}
                        {(data.length > 0 || errors.length > 0) && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition"
                            >
                                <RefreshCcw className="w-4 h-4" /> RESET / CHỌN FILE KHÁC
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center">
                            <Download className="w-8 h-8 text-blue-500 mb-3" />
                            <a href="/templates/mau_import_ung_vien.xlsx" download className="text-blue-600 font-bold hover:underline text-sm">
                                TẢI FILE MẪU CHUẨN
                            </a>
                        </div>

                        <div className="border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center text-center relative">
                            <UploadCloud className="w-8 h-8 text-emerald-500 mb-3" />
                            <span className="text-emerald-700 font-bold text-sm">BẤM ĐỂ UP FILE DATA</span>
                            <input 
                                key={fileInputKey} // Key để reset input
                                type="file" 
                                onChange={handleFileUpload} 
                                accept=".xlsx, .xls" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                        </div>
                    </div>

                    {/* Hiển thị lỗi chi tiết */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-200 shadow-inner">
                            <div className="flex items-center gap-2 text-red-700 font-black mb-4">
                                <AlertCircle className="w-5 h-5" /> PHÁT HIỆN {errors.length} DÒNG LỖI
                            </div>
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {errors.map((err, i) => (
                                    <div key={i} className="text-[13px] bg-white p-3 rounded-xl border border-red-100 shadow-sm flex gap-3">
                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold h-fit">Dòng {err.row}</span>
                                        <span className="text-red-600 font-medium">{err.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hiển thị thành công */}
                    {data.length > 0 && errors.length === 0 && (
                        <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <span className="text-emerald-800 font-bold">File hợp lệ! Sẵn sàng import {data.length} ứng viên.</span>
                        </div>
                    )}
{/* BẢNG HIỂN THỊ KẾT QUẢ SAU KHI IMPORT */}
{importResults.length > 0 && (
    <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-black text-slate-800 mb-4 uppercase flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" /> Kết quả xử lý hệ thống
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold">
                    <tr>
                        <th className="p-4">Họ tên</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Mã UV / Ghi chú</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {importResults.map((res, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition">
                            <td className="p-4 font-medium">{res.candidate_name}</td>
                            <td className="p-4">
                                {res.import_status === "Success" ? (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-bold text-[11px]">THÀNH CÔNG</span>
                                ) : (
                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg font-bold text-[11px]">THẤT BẠI</span>
                                )}
                            </td>
                            <td className="p-4">
                                {res.import_status === "Success" ? (
                                    <span className="text-blue-600 font-mono font-bold">{res.candidate_id}</span>
                                ) : (
                                    <span className="text-red-500 italic text-xs">{res.error}</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <p className="text-gray-400 text-[11px] mt-4 italic">* Hệ thống đã tự động bỏ qua các dòng lỗi và cập nhật các dòng thành công.</p>
    </div>
)}
                    <button
                        onClick={handlePushToN8N}
                        disabled={data.length === 0 || errors.length > 0 || isUploading}
                        className={`w-full py-4 rounded-2xl font-black text-white transition-all ${
                            isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]'
                        } disabled:opacity-50 disabled:shadow-none`}
                    >
                        {isUploading ? 'ĐANG ĐẨY DỮ LIỆU LÊN HỆ THỐNG...' : 'XÁC NHẬN IMPORT NGAY'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ImportCandidatePage() {
    return (
        <ProtectedRoute>
            <ImportCandidateContent />
        </ProtectedRoute>
    );
}
