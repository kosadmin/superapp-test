'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, UploadCloud, AlertCircle, CheckCircle2, RefreshCcw, FileDown } from 'lucide-react';
import Link from 'next/link';
import { MASTER_DATA, API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

function ImportCandidateContent() {
    const { user_id, user_group } = useAuth();

    const [importResults, setImportResults] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{ row: number; msg: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    const handleReset = () => {
        setData([]);
        setErrors([]);
        setImportResults([]);
        setUploadStatus('idle');
        setFileInputKey(Date.now());
    };

    const handleDownloadResults = () => {
        if (importResults.length === 0) return;
        const exportData = importResults.map(item => ({
            "Họ và tên": item.candidate_name,
            "Số điện thoại": item.phone,
            "Loại tác vụ": item.import_action === 'CREATE' ? 'Tạo mới' : (item.import_action === 'UPDATE' ? 'Cập nhật' : ''),
            "Trạng thái": item.import_status === 'Success' ? 'Thành công' : 'Thất bại',
            "Mã ứng viên": item.candidate_id || '',
            "Ghi chú / Lỗi": item.error || item.import_status,
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ket_qua_Import');
        XLSX.writeFile(wb, `Ket_qua_Import_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

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

    const validateExcelData = (rows: any[]) => {
        const errLog: { row: number; msg: string }[] = [];
        const validRows: any[] = [];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;

        rows.forEach((row: any, index: number) => {
            const rowNum = index + 3;
            const currentErrors: string[] = [];

            if (!row.candidate_name?.toString().trim()) currentErrors.push('Thiếu Họ tên');
            if (!row.phone?.toString().trim()) currentErrors.push('Thiếu Số điện thoại');
            if (!row.data_source_dept?.toString().trim()) currentErrors.push('Thiếu Bộ phận nguồn');
            if (!row.data_source_type_group?.toString().trim()) currentErrors.push('Thiếu Nhóm nguồn');
            if (!row.data_source_type?.toString().trim()) currentErrors.push('Thiếu Nguồn chi tiết');

            if (row.phone && !phoneRegex.test(row.phone.toString().trim())) currentErrors.push('SĐT sai định dạng');
            if (row.gender && !MASTER_DATA.genders.includes(row.gender.trim())) currentErrors.push('Giới tính sai');
            if (row.address_city && !MASTER_DATA.cities.includes(row.address_city.trim())) currentErrors.push('Tỉnh thành sai');
            if (row.education_level && !MASTER_DATA.educationLevels.includes(row.education_level.trim())) currentErrors.push('Học vấn sai');
            if (row.project && !MASTER_DATA.projects.includes(row.project.trim())) currentErrors.push('Dự án không tồn tại');
            if (row.date_of_birth && !dateRegex.test(row.date_of_birth.toString().trim())) currentErrors.push('Ngày sinh sai (YYYY-MM-DD)');
            if (row.id_card_issued_date && !dateRegex.test(row.id_card_issued_date.toString().trim())) currentErrors.push('Ngày cấp CCCD sai (YYYY-MM-DD)');

            const dept = row.data_source_dept?.toString().trim();
            const group = row.data_source_type_group?.toString().trim();
            const type = row.data_source_type?.toString().trim();
            if (dept && group) {
                const validGroups = (MASTER_DATA as any).sourceTypeGroupsByDept[dept] || [];
                if (!validGroups.includes(group)) {
                    currentErrors.push('Nhóm nguồn sai logic');
                } else if (type) {
                    const validTypes = (MASTER_DATA as any).sourceTypesByGroup[group] || [];
                    if (!validTypes.includes(type)) currentErrors.push('Nguồn chi tiết sai logic');
                }
            }

            if (currentErrors.length > 0) {
                errLog.push({ row: rowNum, msg: currentErrors.join(' | ') });
            } else {
                validRows.push(row);
            }
        });

        setErrors(errLog);
        setData(validRows);
    };

    const handlePushToN8N = async () => {
        if (errors.length > 0) return alert('Vui lòng sửa hết lỗi trước khi gửi!');
        setIsUploading(true);
        setImportResults([]);

        const enrichedData = data.map(row => {
            const newItem = { ...row };
            if (newItem.project) {
                newItem.project_id = MASTER_DATA.projectIdMap[newItem.project] || '';
                newItem.project_type = MASTER_DATA.projectTypeMap[newItem.project] || '';
                newItem.company = MASTER_DATA.projectCompanyMap[newItem.project] || '';
            }
            if (newItem.date_of_birth) {
                const year = newItem.date_of_birth.toString().split('-')[0];
                if (year && !isNaN(Number(year))) newItem.birth_year = year;
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
                    import_source: 'Excel_Web_CRM',
                    timestamp: new Date().toISOString(),
                    payload: enrichedData,
                }),
            });
            if (response.ok) {
                const resultData = await response.json();
                setImportResults(resultData);
                setUploadStatus('success');
                setData([]);
            } else {
                setUploadStatus('error');
                alert('Có lỗi xảy ra từ phía Server');
            }
        } catch (error) {
            setUploadStatus('error');
            alert('Lỗi kết nối: ' + error);
        } finally {
            setIsUploading(false);
        }
    };

    const hasFile = data.length > 0 || errors.length > 0;

    return (
        <div className="h-full bg-gray-100 overflow-hidden flex flex-col text-sm">

            {/* TOP BAR */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b">
                <div className="flex items-center gap-3">
                    <Link href="/candidates"
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                        </svg>
                    </Link>
                    <h1 className="font-black text-orange-700 uppercase tracking-tight text-sm">Import ứng viên</h1>
                    <span className="text-[10px] text-gray-400 font-medium">Hệ thống tự động tra cứu mã dự án & tính năm sinh</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasFile && (
                        <button onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border-red-200 transition">
                            <RefreshCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                    )}
                    {importResults.length > 0 && (
                        <button onClick={handleDownloadResults}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border-green-200 transition">
                            <FileDown className="w-3.5 h-3.5" /> Tải kết quả
                        </button>
                    )}
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">

                    {/* UPLOAD & TEMPLATE */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Tải file mẫu */}
                        <div className="bg-white rounded-xl border p-5 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Download className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bước 1</p>
                                <a href="/templates/mau_import_ung_vien.xlsx" download
                                    className="text-blue-600 font-bold hover:underline text-xs">
                                    Tải file mẫu chuẩn (.xlsx)
                                </a>
                            </div>
                        </div>

                        {/* Upload file */}
                        <div className="bg-white rounded-xl border-2 border-dashed border-orange-200 p-5 shadow-sm flex flex-col items-center justify-center gap-3 text-center relative hover:border-orange-400 hover:bg-orange-50/30 transition">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <UploadCloud className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bước 2</p>
                                <span className="text-orange-700 font-bold text-xs">Bấm để upload file data</span>
                            </div>
                            <input
                                key={fileInputKey}
                                type="file"
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* LỖI */}
                    {errors.length > 0 && (
                        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="font-black text-red-700 text-xs uppercase tracking-wide">Phát hiện {errors.length} dòng lỗi — Vui lòng sửa trước khi import</span>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                                {errors.map((err, i) => (
                                    <div key={i} className="text-[11px] bg-red-50 px-3 py-2 rounded-lg border border-red-100 flex gap-2">
                                        <span className="font-black text-red-600 whitespace-nowrap">Dòng {err.row}:</span>
                                        <span className="text-red-700">{err.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* READY */}
                    {data.length > 0 && errors.length === 0 && importResults.length === 0 && (
                        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm">
                            <div className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-black text-emerald-800 text-xs uppercase">File hợp lệ</p>
                                        <p className="text-emerald-600 text-[11px]">Sẵn sàng xử lý <span className="font-black">{data.length}</span> dòng dữ liệu</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePushToN8N}
                                    disabled={isUploading}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black text-white transition shadow-sm ${
                                        isUploading ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                                    }`}>
                                    {isUploading ? 'Đang xử lý...' : `Xác nhận import ${data.length} dòng`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* KẾT QUẢ */}
                    {importResults.length > 0 && (
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                                    <span className="font-black text-gray-800 text-xs uppercase tracking-wide">Kết quả xử lý — {importResults.length} bản ghi</span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-bold">
                                    <span className="text-emerald-600">
                                        ✓ {importResults.filter(r => r.import_status === 'Success').length} thành công
                                    </span>
                                    <span className="text-red-500">
                                        ✗ {importResults.filter(r => r.import_status !== 'Success').length} thất bại
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 border-b border-r text-[10px] uppercase font-black text-gray-500">Họ tên</th>
                                            <th className="p-3 border-b border-r text-[10px] uppercase font-black text-gray-500">Loại tác vụ</th>
                                            <th className="p-3 border-b border-r text-[10px] uppercase font-black text-gray-500">Trạng thái</th>
                                            <th className="p-3 border-b text-[10px] uppercase font-black text-gray-500">Mã UV / Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importResults.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition">
                                                <td className="p-3 border-b border-r font-medium text-gray-800 text-xs">{res.candidate_name}</td>
                                                <td className="p-3 border-b border-r">
                                                    {res.import_action === 'CREATE' && <span className="text-blue-600 font-black text-[9px] bg-blue-50 px-2 py-0.5 rounded uppercase">Tạo mới</span>}
                                                    {res.import_action === 'UPDATE' && <span className="text-orange-600 font-black text-[9px] bg-orange-50 px-2 py-0.5 rounded uppercase">Cập nhật</span>}
                                                </td>
                                                <td className="p-3 border-b border-r">
                                                    {res.import_status === 'Success'
                                                        ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black text-[9px] uppercase">Thành công</span>
                                                        : <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded font-black text-[9px] uppercase">Thất bại</span>
                                                    }
                                                </td>
                                                <td className="p-3 border-b">
                                                    {res.import_status === 'Success'
                                                        ? <span className="font-mono font-bold text-gray-700 text-xs">{res.candidate_id}</span>
                                                        : <span className="text-red-500 italic text-[11px]">{res.error}</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default function ImportCandidatePage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <ImportCandidateContent />
            </AppLayout>
        </ProtectedRoute>
    );
}
