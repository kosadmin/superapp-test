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
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Dòng 1: tiêu đề hiển thị (bỏ qua)
        // Dòng 2: tên field → dùng làm header
        // Dòng 3+: data
        // header: 1 = dùng dòng đầu tiên của range làm header
        // range: 1 = bắt đầu đọc từ row index 1 (tức dòng 2 trong Excel)
        const rawData = XLSX.utils.sheet_to_json(ws, { range: 1, header: 1 });

        // rawData[0] là mảng tên field (dòng 2 Excel)
        // rawData[1..n] là data (dòng 3+ Excel)
        const headers = rawData[0] as string[];
        const dataRows = rawData.slice(1);

        // Map thành object theo header
        const mapped = dataRows
            .map((row: any) => {
                const obj: any = {};
                headers.forEach((h, i) => {
                    if (h) obj[h.toString().trim()] = row[i];
                });
                return obj;
            })
            .filter((row: any) => {
                // Bỏ dòng hoàn toàn trống
                return Object.values(row).some(v => v !== undefined && v !== null && v !== '');
            });

        validateData(dataRows.length, mapped);
    };
    reader.readAsBinaryString(file);
};

const validateData = (totalDataRows: number, rows: any[]) => {
    const errLog: { row: number; msg: string }[] = [];
    const mappedRows: any[] = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    // Helper: convert date từ Excel (Date object hoặc string) sang YYYY-MM-DD
    const toDateStr = (val: any): string => {
        if (!val) return '';
        if (val instanceof Date) {
            return val.toISOString().slice(0, 10);
        }
        return String(val).trim();
    };

    rows.forEach((row: any, index: number) => {
        const rowNum = index + 3; // dòng 3 trở đi trong Excel
        const errs: string[] = [];

        const rawId = row['candidate_id']?.toString().trim() ?? '';
        const rawWorking = row['is_still_working_official'] !== undefined && row['is_still_working_official'] !== null
            ? String(row['is_still_working_official']).toLowerCase().trim()
            : '';
        const rawDate = toDateStr(row['resigned_date_official']);
        const rawReason = row['reason_resigned_official']?.toString().trim() ?? '';

        // 1. candidate_id bắt buộc
        if (!rawId) {
            errs.push('Thiếu candidate_id');
        }

        // 2. Parse is_still_working_official
        let isStillWorking: boolean | undefined;
        if (rawWorking !== '') {
            if (BOOL_TRUE_VALUES.includes(rawWorking)) {
                isStillWorking = true;
            } else if (BOOL_FALSE_VALUES.includes(rawWorking)) {
                isStillWorking = false;
            } else {
                errs.push(`is_still_working_official không hợp lệ: "${rawWorking}"`);
            }
        }

        // 3. Nếu false → ngày và lý do bắt buộc
        if (isStillWorking === false) {
            if (!rawDate) errs.push('Thiếu resigned_date_official (bắt buộc khi đã nghỉ)');
            if (!rawReason) errs.push('Thiếu reason_resigned_official (bắt buộc khi đã nghỉ)');
        }

        // 4. Định dạng ngày
        if (rawDate && !dateRegex.test(rawDate)) {
            errs.push(`resigned_date_official sai định dạng: "${rawDate}" (phải là YYYY-MM-DD)`);
        }

        // 5. Lý do phải thuộc masterdata
        if (rawReason && !MASTER_DATA.resignReasons.includes(rawReason)) {
            errs.push(`Lý do nghỉ không hợp lệ: "${rawReason}"`);
        }

        if (errs.length > 0) {
            errLog.push({ row: rowNum, msg: errs.join(' | ') });
        } else {
            const item: any = { candidate_id: rawId };
            if (isStillWorking !== undefined) item.is_still_working_official = isStillWorking;
            if (rawDate) item.resigned_date_official = rawDate;
            if (rawReason) item.reason_resigned_official = rawReason;
            mappedRows.push(item);
        }
    });

    setErrors(errLog);
    setData(errLog.length === 0 ? mappedRows : []);
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
        // overflow-y-auto để cuộn được bên trong AppLayout (vốn là h-screen overflow-hidden)
        <div className="h-full overflow-y-auto bg-gray-50">
            <div className="max-w-3xl mx-auto px-6 py-6">

                {/* Top bar: Back + Reset */}
                <div className="flex items-center justify-between mb-5">
                    <Link href="/warranty" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> Quay lại Bảo hành
                    </Link>
                    {(data.length > 0 || errors.length > 0) && (
                        <button onClick={handleReset}
                            className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                            <RefreshCcw className="w-4 h-4" /> RESET
                        </button>
                    )}
                </div>

                {/* Card chính */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header card */}
                    <div className="px-6 py-5 border-b border-gray-100">
                        <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">Import tình trạng nghỉ việc</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Cập nhật hàng loạt tình trạng nghỉ việc (Official) cho ứng viên bảo hành.</p>
                    </div>

                    <div className="p-6 space-y-5">

                        {/* Upload + Template — 2 cột nhỏ gọn */}
                        <div className="grid grid-cols-2 gap-4">
                            <a href="/templates/mau_import_nghi_viec.xlsx" download
                                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center text-center hover:border-orange-300 hover:bg-orange-50/30 transition group">
                                <Download className="w-6 h-6 text-orange-400 mb-2 group-hover:scale-110 transition" />
                                <span className="text-orange-600 font-bold text-xs">TẢI FILE MẪU</span>
                                <span className="text-gray-400 text-[10px] mt-0.5">mau_import_nghi_viec.xlsx</span>
                            </a>
                            <div className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-xl p-4 flex flex-col items-center text-center relative hover:border-orange-400 transition cursor-pointer">
                                <UploadCloud className="w-6 h-6 text-orange-500 mb-2" />
                                <span className="text-orange-700 font-bold text-xs">BẤM ĐỂ UP FILE</span>
                                <span className="text-gray-400 text-[10px] mt-0.5">.xlsx / .xls</span>
                                <input key={fileInputKey} type="file" onChange={handleFileUpload} accept=".xlsx,.xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        {/* Cấu trúc cột */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cấu trúc file Excel</p>
                            <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                                {[
                                    { col: 'candidate_id', note: 'Bắt buộc', color: 'text-red-600 bg-red-50' },
                                    { col: 'is_still_working_official', note: 'true / false', color: 'text-blue-600 bg-blue-50' },
                                    { col: 'resigned_date_official', note: 'YYYY-MM-DD', color: 'text-gray-600 bg-gray-100' },
                                    { col: 'reason_resigned_official', note: 'Theo masterdata', color: 'text-gray-600 bg-gray-100' },
                                ].map(({ col, note, color }) => (
                                    <div key={col} className="bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm">
                                        <div className="font-mono font-bold text-[10px] text-gray-800 mb-1 break-all">{col}</div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${color}`}>{note}</span>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Lý do nghỉ hợp lệ:</p>
                                <div className="flex flex-wrap gap-1">
                                    {MASTER_DATA.resignReasons.map(r => (
                                        <span key={r} className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-mono">{r}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Lỗi */}
                        {errors.length > 0 && (
                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                <div className="flex items-center gap-2 text-red-700 font-black mb-3 text-sm">
                                    <AlertCircle className="w-4 h-4" /> PHÁT HIỆN {errors.length} DÒNG LỖI
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                    {errors.map((err, i) => (
                                        <div key={i} className="text-[11px] bg-white p-2 rounded border border-red-100 flex gap-2">
                                            <span className="font-bold text-red-600 shrink-0">Dòng {err.row}:</span>
                                            <span className="text-gray-700">{err.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sẵn sàng */}
                        {data.length > 0 && errors.length === 0 && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                <span className="text-orange-800 font-bold text-sm">
                                    File hợp lệ! Sẵn sàng xử lý <span className="text-orange-600 font-black text-base">{data.length}</span> dòng.
                                </span>
                            </div>
                        )}

                        {/* Bảng kết quả */}
                        {importResults.length > 0 && (
                            <div className="border-t pt-5">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-orange-500" /> Kết quả xử lý
                                    </h2>
                                    <button onClick={handleDownloadResults}
                                        className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition">
                                        <FileDown className="w-3.5 h-3.5" /> Tải kết quả
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    {[
                                        { label: 'Tổng', value: importResults.length, color: 'text-gray-700 bg-gray-50 border-gray-200' },
                                        { label: 'Thành công', value: importResults.filter(r => r.import_status === 'Success').length, color: 'text-green-700 bg-green-50 border-green-200' },
                                        { label: 'Thất bại', value: importResults.filter(r => r.import_status !== 'Success').length, color: 'text-red-700 bg-red-50 border-red-200' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className={`rounded-xl p-3 border text-center font-black ${color}`}>
                                            <div className="text-xl">{value}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0 z-10 text-xs">
                                                <tr>
                                                    <th className="px-4 py-3">Mã UV</th>
                                                    <th className="px-4 py-3">Họ tên</th>
                                                    <th className="px-4 py-3">Trạng thái</th>
                                                    <th className="px-4 py-3">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {importResults.map((res, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                                                        <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{res.candidate_id}</td>
                                                        <td className="px-4 py-3 text-xs">{res.candidate_name || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            {res.import_status === 'Success'
                                                                ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-bold text-[10px]">THÀNH CÔNG</span>
                                                                : <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold text-[10px]">THẤT BẠI</span>
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {res.import_status === 'Success'
                                                                ? <span className="text-gray-400 text-[10px]">Đã cập nhật</span>
                                                                : <span className="text-red-500 italic text-[10px]">{res.error}</span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button onClick={handleSubmit}
                            disabled={data.length === 0 || errors.length > 0 || isUploading}
                            className={`w-full py-3.5 rounded-xl font-black text-white transition-all text-sm
                                ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 active:scale-[0.99]'}
                                disabled:opacity-40 disabled:shadow-none`}>
                            {isUploading ? '⏳ ĐANG ĐẨY DỮ LIỆU...' : `XÁC NHẬN IMPORT${data.length > 0 ? ` (${data.length} dòng)` : ''}`}
                        </button>

                    </div>
                </div>

                {/* Scroll to top button */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 w-10 h-10 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center z-50"
                    title="Lên đầu trang"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="18 15 12 9 6 15"/>
                    </svg>
                </button>

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
