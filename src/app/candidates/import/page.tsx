'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
    ArrowLeft, Download, UploadCloud, AlertCircle, 
    CheckCircle2, RefreshCcw, FileDown 
} from 'lucide-react'; // Thêm icon FileDown
import Link from 'next/link';
import { MASTER_DATA, API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function ImportCandidateContent() {
    const { user_id, user_group } = useAuth();
    
    const [importResults, setImportResults] = useState<any[]>([]); 
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{row: number, msg: string}[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    // Hàm Reset
    const handleReset = () => {
        setData([]);
        setErrors([]);
        setImportResults([]);
        setUploadStatus('idle');
        setFileInputKey(Date.now());
    };

    // Hàm xuất kết quả ra Excel
    const handleDownloadResults = () => {
        if (importResults.length === 0) return;

        // Map dữ liệu sang tiếng Việt cho đẹp
        const exportData = importResults.map(item => ({
            "Họ và tên": item.candidate_name,
            "Số điện thoại": item.phone,
            "Loại tác vụ": item.import_action === 'CREATE' ? 'Tạo mới' : (item.import_action === 'UPDATE' ? 'Cập nhật' : ''),
            "Trạng thái": item.import_status === 'Success' ? 'Thành công' : 'Thất bại',
            "Mã ứng viên": item.candidate_id || '',
            "Ghi chú / Lỗi": item.error || item.import_status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ket_qua_Import");
        XLSX.writeFile(wb, `Ket_qua_Import_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // 1. Hàm đọc file (Giữ nguyên)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 1 });
            validateExcelData(rawData);
        };
        reader.readAsBinaryString(file);
    };

    // 2. Validate (Giữ nguyên logic cũ của bạn)
    const validateExcelData = (rows: any[]) => {
        const errLog: { row: number, msg: string }[] = [];
        const validRows: any[] = [];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/; 
        const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;

        rows.forEach((row: any, index: number) => {
            const rowNum = index + 3; 
            const currentErrors: string[] = [];

            // Check Bắt buộc
            if (!row.candidate_name?.toString().trim()) currentErrors.push("Thiếu Họ tên");
            if (!row.phone?.toString().trim()) currentErrors.push("Thiếu Số điện thoại");
            if (!row.data_source_dept?.toString().trim()) currentErrors.push("Thiếu Bộ phận nguồn");
            if (!row.data_source_type_group?.toString().trim()) currentErrors.push("Thiếu Nhóm nguồn");
            if (!row.data_source_type?.toString().trim()) currentErrors.push("Thiếu Nguồn chi tiết");

            // Check Regex & Master Data
            if (row.phone && !phoneRegex.test(row.phone.toString().trim())) currentErrors.push("SĐT sai định dạng");
            if (row.gender && !MASTER_DATA.genders.includes(row.gender.trim())) currentErrors.push(`Giới tính sai`);
            if (row.address_city && !MASTER_DATA.cities.includes(row.address_city.trim())) currentErrors.push(`Tỉnh thành sai`);
            if (row.education_level && !MASTER_DATA.educationLevels.includes(row.education_level.trim())) currentErrors.push(`Học vấn sai`);
            if (row.project && !MASTER_DATA.projects.includes(row.project.trim())) currentErrors.push(`Dự án không tồn tại`);
            if (row.date_of_birth && !dateRegex.test(row.date_of_birth.toString().trim())) currentErrors.push(`Ngày sinh sai (YYYY-MM-DD)`);
            if (row.id_card_issued_date && !dateRegex.test(row.id_card_issued_date.toString().trim())) currentErrors.push(`Ngày cấp CCCD sai (YYYY-MM-DD)`);

            // Check Logic 3 lớp nguồn
            const dept = row.data_source_dept?.toString().trim();
            const group = row.data_source_type_group?.toString().trim();
            const type = row.data_source_type?.toString().trim();

            if (dept && group) {
                const validGroups = (MASTER_DATA as any).sourceTypeGroupsByDept[dept] || [];
                if (!validGroups.includes(group)) {
                    currentErrors.push(`Nhóm nguồn sai logic`);
                } else if (type) {
                    const validTypes = (MASTER_DATA as any).sourceTypesByGroup[group] || [];
                    if (!validTypes.includes(type)) currentErrors.push(`Nguồn chi tiết sai logic`);
                }
            }

            if (currentErrors.length > 0) {
                errLog.push({ row: rowNum, msg: currentErrors.join(" | ") });
            } else {
                validRows.push(row);
            }
        });

        setErrors(errLog);
        setData(validRows);
    };

    // 3. XỬ LÝ DỮ LIỆU & GỬI ĐI (Đã cập nhật Logic Mapping)
    const handlePushToN8N = async () => {
        if (errors.length > 0) return alert("Vui lòng sửa hết lỗi trước khi gửi!");
        setIsUploading(true);
        setImportResults([]);

        // --- BƯỚC PRE-PROCESSING: Map dữ liệu MasterData & Tính Năm sinh ---
        const enrichedData = data.map(row => {
            const newItem = { ...row };

            // 1. Tự động điền thông tin dự án
            if (newItem.project) {
                newItem.project_id = MASTER_DATA.projectIdMap[newItem.project] || '';
                newItem.project_type = MASTER_DATA.projectTypeMap[newItem.project] || '';
                newItem.company = MASTER_DATA.projectCompanyMap[newItem.project] || '';
            }

            // 2. Tính năm sinh (birth_year)
            if (newItem.date_of_birth) {
                // date_of_birth dạng YYYY-MM-DD -> lấy phần tử đầu tiên
                const year = newItem.date_of_birth.toString().split('-')[0];
                if (year && !isNaN(Number(year))) {
                    newItem.birth_year = year;
                }
            }

            return newItem;
        });

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
                    payload: enrichedData // Gửi mảng dữ liệu đã được làm giàu
                })
            });

            if (response.ok) {
                const resultData = await response.json();
                setImportResults(resultData);
                setUploadStatus('success');
                setData([]); 
            } else {
                setUploadStatus('error');
                alert("Có lỗi xảy ra từ phía Server n8n");
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
            <div className="max-w-5xl mx-auto">
                <Link href="/candidates" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-700">
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase">Import ứng viên</h1>
                            <p className="text-gray-500 text-sm">Hệ thống sẽ tự động tra cứu Mã dự án và tính Năm sinh.</p>
                        </div>
                        {(data.length > 0 || errors.length > 0) && (
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition"
                            >
                                <RefreshCcw className="w-4 h-4" /> RESET / CHỌN FILE KHÁC
                            </button>
                        )}
                    </div>

                    {/* Khu vực Upload & Download Template */}
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
                                key={fileInputKey}
                                type="file" 
                                onChange={handleFileUpload} 
                                accept=".xlsx, .xls" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                        </div>
                    </div>

                    {/* Hiển thị lỗi */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-200 shadow-inner">
                            <div className="flex items-center gap-2 text-red-700 font-black mb-4">
                                <AlertCircle className="w-5 h-5" /> PHÁT HIỆN {errors.length} DÒNG LỖI
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {errors.map((err, i) => (
                                    <div key={i} className="text-[12px] bg-white p-2 rounded border border-red-100 flex gap-2">
                                        <span className="font-bold text-red-600">Dòng {err.row}:</span>
                                        <span>{err.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hiển thị Ready */}
                    {data.length > 0 && errors.length === 0 && (
                        <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <span className="text-emerald-800 font-bold">File hợp lệ! Sẵn sàng xử lý {data.length} dòng.</span>
                        </div>
                    )}

                    {/* BẢNG KẾT QUẢ XỬ LÝ (MỚI) */}
                    {importResults.length > 0 && (
                        <div className="mt-8 border-t pt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" /> Kết quả xử lý hệ thống
                                </h2>
                                {/* NÚT DOWNLOAD KẾT QUẢ */}
                                <button 
                                    onClick={handleDownloadResults}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 shadow-md shadow-green-200 transition"
                                >
                                    <FileDown className="w-4 h-4" /> Tải kết quả (.xlsx)
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4">Họ tên</th>
                                            <th className="p-4">Loại tác vụ</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Mã UV / Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {importResults.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition">
                                                <td className="p-4 font-medium">{res.candidate_name}</td>
                                                <td className="p-4">
                                                    {res.import_action === 'CREATE' && <span className="text-blue-600 font-bold text-[11px] bg-blue-50 px-2 py-1 rounded">TẠO MỚI</span>}
                                                    {res.import_action === 'UPDATE' && <span className="text-orange-600 font-bold text-[11px] bg-orange-50 px-2 py-1 rounded">CẬP NHẬT</span>}
                                                </td>
                                                <td className="p-4">
                                                    {res.import_status === "Success" ? (
                                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-bold text-[11px]">THÀNH CÔNG</span>
                                                    ) : (
                                                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg font-bold text-[11px]">THẤT BẠI</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {res.import_status === "Success" ? (
                                                        <span className="font-mono font-bold text-gray-700">{res.candidate_id}</span>
                                                    ) : (
                                                        <span className="text-red-500 italic text-xs">{res.error}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Nút Submit */}
                    <div className="mt-8">
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
