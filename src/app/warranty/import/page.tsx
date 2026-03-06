'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, UploadCloud, AlertCircle, CheckCircle2, RefreshCcw, FileDown } from 'lucide-react';
import Link from 'next/link';
import { MASTER_DATA, API_CONFIG } from '@/constants/masterData';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

const BOOL_TRUE_VALUES = ['true', '1', 'có', 'còn làm', 'yes'];
const BOOL_FALSE_VALUES = ['false', '0', 'không', 'đã nghỉ', 'no'];

// Convert Excel serial date → "YYYY-MM-DD" không bị lệch timezone
function excelSerialToDateStr(serial: number): string {
    const d = new Date((serial - 25569) * 86400 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function ImportWarrantyResignContent() {
    const { user_id, user_group } = useAuth();

    const [importResults, setImportResults] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<{ row: number; msg: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(Date.now());

    const handleReset = () => {
        setData([]);
        setErrors([]);
        setImportResults([]);
        setFileInputKey(Date.now());
    };

    const handleDownloadResults = () => {
        if (importResults.length === 0) return;
        const exportData = importResults.map(item => ({
            "Mã ứng viên": item.candidate_id,
            "Còn làm việc": item.is_still_working_official ? 'Có' : 'Không',
            "Ngày nghỉ": item.resigned_date_official || '',
            "Lý do nghỉ": item.reason_resigned_official || '',
            "Cập nhật lúc": item.last_updated_at || '',
            "Trạng thái": item.import_status === 'Success' ? 'Thành công' : 'Thất bại',
            "Ghi chú / Lỗi": item.error || '',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ket_qua_Import');
        XLSX.writeFile(wb, `Ket_qua_Import_BaoHanh_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            // range:1 bỏ dòng 1 (tiêu đề hiển thị), dòng 2 làm header, dòng 3+ là data
            const rawData = XLSX.utils.sheet_to_json(ws, { range: 1, header: 1 });
            const headers = rawData[0] as string[];
            const dataRows = rawData.slice(1);
            const mapped = dataRows
                .map((row: any) => {
                    const obj: any = {};
                    headers.forEach((h, i) => { if (h) obj[h.toString().trim()] = row[i]; });
                    return obj;
                })
                .filter((row: any) => Object.values(row).some(v => v !== undefined && v !== null && v !== ''));
            validateData(mapped);
        };
        reader.readAsBinaryString(file);
    };

    const validateData = (rows: any[]) => {
        const errLog: { row: number; msg: string }[] = [];
        const mappedRows: any[] = [];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        const toDateStr = (val: any): string => {
            if (val === undefined || val === null || val === '') return '';
            if (typeof val === 'number') return excelSerialToDateStr(val);
            return String(val).trim();
        };

        rows.forEach((row: any, index: number) => {
            const rowNum = index + 3;
            const errs: string[] = [];

            const rawId = row['candidate_id']?.toString().trim() ?? '';
            const rawWorking = (row['is_still_working_official'] !== undefined && row['is_still_working_official'] !== null)
                ? String(row['is_still_working_official']).toLowerCase().trim()
                : '';
            const rawDate = toDateStr(row['resigned_date_official']);
            const rawReason = row['reason_resigned_official']?.toString().trim() ?? '';

            if (!rawId) errs.push('Thiếu candidate_id');

            let isStillWorking: boolean | undefined;
            if (rawWorking !== '') {
                if (BOOL_TRUE_VALUES.includes(rawWorking)) isStillWorking = true;
                else if (BOOL_FALSE_VALUES.includes(rawWorking)) isStillWorking = false;
                else errs.push(`is_still_working_official không hợp lệ: "${rawWorking}"`);
            }

            if (isStillWorking === false) {
                if (!rawDate) errs.push('Thiếu resigned_date_official');
                if (!rawReason) errs.push('Thiếu reason_resigned_official');
            }

            if (rawDate && !dateRegex.test(rawDate)) {
                errs.push(`Ngày sai định dạng: "${rawDate}" (cần YYYY-MM-DD)`);
            }

            if (rawReason && !MASTER_DATA.resignReasons.includes(rawReason)) {
                errs.push(`Lý do không hợp lệ: "${rawReason}"`);
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

  const handleSubmit = async () => {
    if (errors.length > 0) return alert('Vui lòng sửa hết lỗi trước khi gửi!');
    if (data.length === 0) return;

    setIsUploading(true);
    setImportResults([]); // Clear kết quả cũ trước khi bắt đầu

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

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error ${response.status}: ${errorText}`);
        }

        const resultData = await response.json();
        
        // Debug: Xem webhook thực sự trả về gì
        console.log("Raw Response:", resultData);

        // Xử lý trường hợp webhook trả về mảng hoặc object chứa mảng
        let finalResults = [];
        if (Array.isArray(resultData)) {
            finalResults = resultData;
        } else if (resultData && typeof resultData === 'object') {
            // Thử tìm mảng trong các key phổ biến
            finalResults = resultData.data || resultData.results || resultData.payload || [];
        }

        if (finalResults.length > 0) {
            setImportResults(finalResults);
            setData([]); // Chỉ xóa dữ liệu input khi đã có kết quả trả về
            
            // Tự động cuộn xuống khu vực kết quả sau 100ms
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);
        } else {
            alert('Webhook phản hồi thành công nhưng không có dữ liệu kết quả.');
        }

    } catch (err) {
        console.error("Import Error:", err);
        alert('Lỗi kết nối hoặc xử lý: ' + (err as Error).message);
    } finally {
        setIsUploading(false);
    }
};

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 py-6">

                {/* Top bar */}
                <div className="flex items-center justify-between mb-5">
                    <Link href="/warranty" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-500 transition text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> Quay lại Bảo hành
                    </Link>
                    {(data.length > 0 || errors.length > 0 || importResults.length > 0) && (
                        <button onClick={handleReset}
                            className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                            <RefreshCcw className="w-4 h-4" /> RESET
                        </button>
                    )}
                </div>

                {/* Card chính */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    <div className="px-6 py-5 border-b border-gray-100">
                        <h1 className="text-lg font-black text-slate-800 uppercase tracking-wide">Import tình trạng nghỉ việc</h1>
                        <p className="text-gray-400 text-xs mt-0.5">Cập nhật hàng loạt tình trạng nghỉ việc (Official) cho ứng viên bảo hành.</p>
                    </div>

                    <div className="p-6 space-y-5">

                        {/* Upload + Template */}
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

                        {/* Lỗi validate */}
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

                        {/* Sẵn sàng import */}
                        {data.length > 0 && errors.length === 0 && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                <span className="text-orange-800 font-bold text-sm">
                                    File hợp lệ! Sẵn sàng xử lý <span className="text-orange-600 font-black text-base">{data.length}</span> dòng.
                                </span>
                            </div>
                        )}

                        {/* Loading */}
                        {isUploading && (
                            <div className="bg-orange-50 rounded-xl p-5 border border-orange-200 flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
                                <p className="text-orange-700 font-bold text-sm">Đang đẩy dữ liệu và chờ phản hồi từ hệ thống...</p>
                                <p className="text-orange-500 text-xs">Vui lòng không đóng trang này</p>
                            </div>
                        )}

                        {/* Bảng kết quả */}
                        {importResults.length > 0 && (
                            <div className="border-t pt-5">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-orange-500" /> Kết quả xử lý hệ thống
                                    </h2>
                                    <button onClick={handleDownloadResults}
                                        className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition">
                                        <FileDown className="w-3.5 h-3.5" /> Tải kết quả (.xlsx)
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
                                                    <th className="px-4 py-3">Ngày nghỉ</th>
                                                    <th className="px-4 py-3">Lý do</th>
                                                    <th className="px-4 py-3">Trạng thái</th>
                                                    <th className="px-4 py-3">Ghi chú</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {importResults.map((res, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                                                        <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">{res.candidate_id}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-600">{res.resigned_date_official || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-600">{res.reason_resigned_official || '—'}</td>
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

                {/* Scroll to top */}
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 w-10 h-10 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center z-50"
                    title="Lên đầu trang">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="18 15 12 9 6 15" />
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
