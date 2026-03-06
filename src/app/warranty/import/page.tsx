'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, UploadCloud, AlertCircle, CheckCircle2, RefreshCcw, FileDown } from 'lucide-react';
import Link from 'next/link';
import { MASTER_DATA, API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// Các giá trị hợp lệ cho is_still_working
const BOOL_TRUE_VALUES = ['true', '1', 'có', 'còn làm', 'yes'];
const BOOL_FALSE_VALUES = ['false', '0', 'không', 'đã nghỉ', 'no'];

function ImportWarrantyResignContent() {
    const { user_id, user_group } = useAuth();

    const [importResults, setImportResults] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{ row: number; msg: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    // Reset
    const handleReset = () => {
        setData([]);
        setErrors([]);
        setImportResults([]);
        setUploadStatus('idle');
        setFileInputKey(Date.now());
    };

    // Xuất kết quả
    const handleDownloadResults = () => {
        if (importResults.length === 0) return;
        const exportData = importResults.map(item => ({
            "Mã ứng viên": item.candidate_id,
            "Họ và tên": item.candidate_name || '',
            "Trạng thái": item.import_status === 'Success' ? 'Thành công' : 'Thất bại',
            "Ghi chú / Lỗi": item.error || item.import_status,
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ket_qua_Import');
        XLSX.writeFile(wb, `Ket_qua_Import_BaoHanh_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Xuất file mẫu
{/* Tải file mẫu — đổi button thành link tĩnh */}
<a href="/templates/mau_import_nghi_viec.xlsx" download
    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-orange-300 hover:bg-orange-50/30 transition group">
    <Download className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
    <span className="text-orange-600 font-bold text-sm">TẢI FILE MẪU CHUẨN</span>
    <span className="text-gray-400 text-xs mt-1">mau_import_nghi_viec.xlsx</span>
</a>

    // Đọc & validate file
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            // range: 1 → bỏ dòng đầu (mô tả), lấy từ dòng 2 trở đi
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 2 });
            validateData(rawData);
        };
        reader.readAsBinaryString(file);
    };

const validateData = (rows: any[]) => {
    const errLog: { row: number; msg: string }[] = [];
    const validRows: any[] = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    rows.forEach((row: any, index: number) => {
        const rowNum = index + 3;
        const errs: string[] = [];

        // 1. candidate_id bắt buộc
        if (!row.candidate_id?.toString().trim()) {
            errs.push('Thiếu candidate_id');
        }

        // 2. Parse is_still_working_official
        let isStillWorking: boolean | undefined;
        if (row.is_still_working_official !== undefined && row.is_still_working_official !== '') {
            const val = String(row.is_still_working_official).toLowerCase().trim();
            if (BOOL_TRUE_VALUES.includes(val)) isStillWorking = true;
            else if (BOOL_FALSE_VALUES.includes(val)) isStillWorking = false;
            else errs.push('is_still_working_official phải là true hoặc false');
        }

        // 3. Nếu đã nghỉ (false) thì ngày + lý do bắt buộc
        if (isStillWorking === false) {
            if (!row.resigned_date_official?.toString().trim()) {
                errs.push('Đã nghỉ nhưng thiếu resigned_date_official');
            }
            if (!row.reason_resigned_official?.toString().trim()) {
                errs.push('Đã nghỉ nhưng thiếu reason_resigned_official');
            }
        }

        // 4. Validate định dạng ngày
        if (row.resigned_date_official && !dateRegex.test(String(row.resigned_date_official).trim())) {
            errs.push('resigned_date_official sai định dạng (YYYY-MM-DD)');
        }

        // 5. Validate lý do nghỉ thuộc masterdata
        if (row.reason_resigned_official && !MASTER_DATA.resignReasons.includes(String(row.reason_resigned_official).trim())) {
            errs.push(`Lý do nghỉ không hợp lệ: "${row.reason_resigned_official}"`);
        }

        if (errs.length > 0) {
            errLog.push({ row: rowNum, msg: errs.join(' | ') });
        } else {
            const mapped: any = {
                candidate_id: String(row.candidate_id).trim(),
            };
            if (isStillWorking !== undefined) mapped.is_still_working_official = isStillWorking;
            if (row.resigned_date_official) mapped.resigned_date_official = String(row.resigned_date_official).trim();
            if (row.reason_resigned_official) mapped.reason_resigned_official = String(row.reason_resigned_official).trim();
            validRows.push(mapped);
        }
    });

    setErrors(errLog);
    setData(validRows);
};
    // Gửi lên API
    const handleSubmit = async () => {
        if (errors.length > 0) return alert('Vui lòng sửa hết lỗi trước khi gửi!');
        if (data.length === 0) return;

        setIsUploading(true);
        setImportResults([]);
        try {
            const response = await fetch(API_CONFIG.WARRANTY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'import_warranty_resign',
                    user_id,
                    user_group,
                    timestamp: new Date().toISOString(),
                    payload: data,
                }),
            });
            if (response.ok) {
                const resultData = await response.json();
                setImportResults(Array.isArray(resultData) ? resultData : []);
                setUploadStatus('success');
                setData([]);
            } else {
                setUploadStatus('error');
                alert('Có lỗi xảy ra từ phía server');
            }
        } catch (error) {
            setUploadStatus('error');
            alert('Lỗi kết nối: ' + error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">

                {/* Back */}
                <Link href="/warranty" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-orange-500 transition text-sm font-bold">
                    <ArrowLeft className="w-4 h-4" /> Quay lại Bảo hành
                </Link>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase">Import tình trạng nghỉ việc</h1>
                            <p className="text-gray-500 text-sm mt-1">Cập nhật hàng loạt tình trạng nghỉ việc (Official) cho ứng viên bảo hành.</p>
                        </div>
                        {(data.length > 0 || errors.length > 0) && (
                            <button onClick={handleReset}
                                className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                                <RefreshCcw className="w-4 h-4" /> RESET / CHỌN FILE KHÁC
                            </button>
                        )}
                    </div>

                    {/* Upload + Template */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        {/* Tải file mẫu */}
                        <button onClick={handleDownloadTemplate}
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-orange-300 hover:bg-orange-50/30 transition group">
                            <Download className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
                            <span className="text-orange-600 font-bold text-sm">TẢI FILE MẪU CHUẨN</span>
                            <span className="text-gray-400 text-xs mt-1">mau_import_nghi_viec_baohanh.xlsx</span>
                        </button>

                        {/* Upload file */}
                        <div className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-2xl p-6 flex flex-col items-center text-center relative hover:border-orange-400 transition cursor-pointer">
                            <UploadCloud className="w-8 h-8 text-orange-500 mb-3" />
                            <span className="text-orange-700 font-bold text-sm">BẤM ĐỂ UP FILE DATA</span>
                            <span className="text-gray-400 text-xs mt-1">.xlsx / .xls</span>
                            <input key={fileInputKey} type="file" onChange={handleFileUpload} accept=".xlsx,.xls"
                                className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    {/* Mô tả cột */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Cấu trúc file Excel</p>
                        <div className="grid grid-cols-4 gap-3 text-xs">
                            {[
                                { col: 'candidate_id', note: 'Bắt buộc', color: 'text-red-600 bg-red-50' },
                                { col: 'is_still_working_official', note: 'true / false', color: 'text-blue-600 bg-blue-50' },
                                { col: 'resigned_date_official', note: 'YYYY-MM-DD', color: 'text-gray-600 bg-gray-100' },
                                { col: 'reason_resigned_official', note: 'Theo masterdata', color: 'text-gray-600 bg-gray-100' },
                            ].map(({ col, note, color }) => (
                                <div key={col} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                                    <div className="font-mono font-bold text-[11px] text-gray-800 mb-1">{col}</div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>{note}</span>
                                </div>
                            ))}
                        </div>
                        {/* Danh sách lý do hợp lệ */}
                        <div className="mt-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Lý do nghỉ hợp lệ:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {MASTER_DATA.resignReasons.map(r => (
                                    <span key={r} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-600 font-mono">{r}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Lỗi */}
                    {errors.length > 0 && (
                        <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-200 shadow-inner">
                            <div className="flex items-center gap-2 text-red-700 font-black mb-4">
                                <AlertCircle className="w-5 h-5" /> PHÁT HIỆN {errors.length} DÒNG LỖI
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                {errors.map((err, i) => (
                                    <div key={i} className="text-[12px] bg-white p-2 rounded border border-red-100 flex gap-2">
                                        <span className="font-bold text-red-600 shrink-0">Dòng {err.row}:</span>
                                        <span className="text-gray-700">{err.msg}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sẵn sàng */}
                    {data.length > 0 && errors.length === 0 && (
                        <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-200 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-orange-500 shrink-0" />
                            <div>
                                <span className="text-orange-800 font-bold">File hợp lệ! Sẵn sàng xử lý </span>
                                <span className="text-orange-600 font-black text-lg">{data.length}</span>
                                <span className="text-orange-800 font-bold"> dòng dữ liệu.</span>
                            </div>
                        </div>
                    )}

                    {/* Bảng kết quả */}
                    {importResults.length > 0 && (
                        <div className="mt-8 border-t pt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-orange-500" /> Kết quả xử lý
                                </h2>
                                <button onClick={handleDownloadResults}
                                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 shadow-md shadow-orange-100 transition">
                                    <FileDown className="w-4 h-4" /> Tải kết quả (.xlsx)
                                </button>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {[
                                    { label: 'Tổng', value: importResults.length, color: 'text-gray-700 bg-gray-50 border-gray-200' },
                                    { label: 'Thành công', value: importResults.filter(r => r.import_status === 'Success').length, color: 'text-green-700 bg-green-50 border-green-200' },
                                    { label: 'Thất bại', value: importResults.filter(r => r.import_status !== 'Success').length, color: 'text-red-700 bg-red-50 border-red-200' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className={`rounded-xl p-4 border text-center font-black ${color}`}>
                                        <div className="text-2xl">{value}</div>
                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4">Mã UV</th>
                                            <th className="p-4">Họ tên</th>
                                            <th className="p-4">Trạng thái</th>
                                            <th className="p-4">Ghi chú / Lỗi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {importResults.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition">
                                                <td className="p-4 font-mono font-bold text-gray-700">{res.candidate_id}</td>
                                                <td className="p-4">{res.candidate_name || '—'}</td>
                                                <td className="p-4">
                                                    {res.import_status === 'Success'
                                                        ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg font-bold text-[11px]">THÀNH CÔNG</span>
                                                        : <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg font-bold text-[11px]">THẤT BẠI</span>
                                                    }
                                                </td>
                                                <td className="p-4">
                                                    {res.import_status === 'Success'
                                                        ? <span className="text-gray-400 text-xs">Đã cập nhật</span>
                                                        : <span className="text-red-500 italic text-xs">{res.error}</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="mt-8">
                        <button onClick={handleSubmit}
                            disabled={data.length === 0 || errors.length > 0 || isUploading}
                            className={`w-full py-4 rounded-2xl font-black text-white transition-all text-base
                                ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 active:scale-[0.99]'}
                                disabled:opacity-50 disabled:shadow-none`}>
                            {isUploading ? '⏳ ĐANG ĐẨY DỮ LIỆU LÊN HỆ THỐNG...' : `XÁC NHẬN IMPORT ${data.length > 0 ? `(${data.length} dòng)` : ''}`}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function ImportWarrantyResignPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <ImportWarrantyResignContent />
            </AppLayout>
        </ProtectedRoute>
    );
}
