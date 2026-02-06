'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { MASTER_DATA } from '@/constants/masterData';
import { API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function ImportCandidateContent() {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{row: number, msg: string}[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // 1. Hàm đọc và Validate file
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            /* Bỏ qua dòng 1 (hướng dẫn), Dòng 2 là Header. 
               range: 1 có nghĩa là bắt đầu đọc từ dòng thứ 2 (index 1) của Excel làm tiêu đề.
            */
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 1 });
            validateExcelData(rawData);
        };
        reader.readAsBinaryString(file);
    };

    // 2. Logic Validation chi tiết
    const validateExcelData = (rows: any[]) => {
        const errLog: {row: number, msg: string}[] = [];
        const validRows: any[] = [];

        rows.forEach((row: any, index: number) => {
            const rowNum = index + 3; // Dòng thực tế trong Excel (vì bỏ qua 2 dòng đầu)
            const currentErrors: string[] = [];

            // Check trường bắt buộc
            if (!row.candidate_name) currentErrors.push("Thiếu Họ tên");
            if (!row.phone) currentErrors.push("Thiếu Số điện thoại");
            if (!row.project) currentErrors.push("Thiếu Dự án");

            // Check Regex SĐT & Email
            const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
            if (row.phone && !phoneRegex.test(String(row.phone))) {
                currentErrors.push("SĐT không đúng định dạng (10 số)");
            }
            if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                currentErrors.push("Email không hợp lệ");
            }

            // Check Validation 3 lớp (Bộ phận -> Nhóm -> Loại)
            const dept = row.data_source_dept;
            const group = row.data_source_type_group;
            const type = row.data_source_type;

            if (dept) {
                const validGroups = (MASTER_DATA as any).sourceTypeGroupsByDept[dept] || [];
                if (!validGroups.includes(group)) {
                    currentErrors.push(`Nhóm nguồn "${group}" không thuộc Bộ phận "${dept}"`);
                } else {
                    const validTypes = (MASTER_DATA as any).sourceTypesByGroup[group] || [];
                    if (type && !validTypes.includes(type)) {
                        currentErrors.push(`Loại nguồn "${type}" không thuộc Nhóm "${group}"`);
                    }
                }
            }

            if (currentErrors.length > 0) {
                errLog.push({ row: rowNum, msg: currentErrors.join(", ") });
            } else {
                validRows.push(row);
            }
        });

        setErrors(errLog);
        setData(validRows);
    };

    // 3. Gửi đi Webhook n8n
    const handlePushToN8N = async () => {
        if (errors.length > 0) return alert("Cần sửa hết lỗi trong file trước khi đẩy hệ thống!");
        
        setIsUploading(true);
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
            const result = await response.json();
            setUploadStatus('success');
            alert(`Thành công! Đã xử lý ${data.length} dòng.`);
            setData([]); 
        } else {
            setUploadStatus('error');
            alert("Có lỗi xảy ra khi gửi dữ liệu sang n8n");
        }
    } catch (error) {
        setUploadStatus('error');
        console.error("Lỗi kết nối:", error);
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
                    <h1 className="text-2xl font-black mb-2 text-slate-800">IMPORT DỮ LIỆU ỨNG VIÊN</h1>
                    <p className="text-gray-500 mb-8">Tải lên file Excel để thêm ứng viên hàng loạt vào hệ thống.</p>

                    {/* Step 1: Download Template */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <Download className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold mb-1">1. Tải file mẫu</h3>
                            <p className="text-xs text-gray-400 mb-4">Sử dụng file chuẩn để tránh lỗi định dạng</p>
                            <a href="/templates/mau_import_ung_vien.xlsx" download className="text-blue-600 font-bold text-sm hover:underline">TẢI FILE MẪU .XLSX</a>
                        </div>

                        {/* Step 2: Upload File */}
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center relative">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold mb-1">2. Up file dữ liệu</h3>
                            <p className="text-xs text-gray-400 mb-4">Kéo thả hoặc bấm để chọn file</p>
                            <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    {/* Result & Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-100">
                            <div className="flex items-center gap-2 text-red-700 font-bold mb-4">
                                <AlertCircle className="w-5 h-5" /> Phát hiện {errors.length} dòng dữ liệu lỗi
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {errors.map((err, i) => (
                                    <div key={i} className="text-sm text-red-600 bg-white p-2 rounded-lg border border-red-50">
                                        <strong>Dòng {err.row}:</strong> {err.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.length > 0 && errors.length === 0 && (
                        <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-5 h-5" /> File hợp lệ! Sẵn sàng import {data.length} ứng viên.
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handlePushToN8N}
                        disabled={data.length === 0 || errors.length > 0 || isUploading}
                        className={`w-full py-4 rounded-2xl font-black text-white transition shadow-lg ${
                            isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                    >
                        {isUploading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN PUSH DỮ LIỆU'}
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
