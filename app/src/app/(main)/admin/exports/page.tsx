"use client";

import { useState } from "react";
import { Download, CreditCard, Receipt, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import type { PaymentStatus } from "@/lib/schema/payment";
import type { SettlementStatus } from "@/lib/schema/settlement";
import type { LeadStatus } from "@/lib/schema/lead";

// ── helpers ──

async function downloadCsv(endpoint: string, params: URLSearchParams, filename: string) {
    const res = await fetch(`${endpoint}?${params.toString()}`);
    if (!res.ok) {
        throw new Error("다운로드에 실패했습니다.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── filter options ──

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "ready", label: "준비" },
    { value: "in_progress", label: "진행중" },
    { value: "done", label: "완료" },
    { value: "canceled", label: "취소" },
    { value: "partial_canceled", label: "부분취소" },
];

const SETTLEMENT_STATUS_OPTIONS: { value: SettlementStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기" },
    { value: "confirmed", label: "확인" },
    { value: "paid", label: "지급완료" },
];

const LEAD_STATUS_OPTIONS: { value: LeadStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "submitted", label: "제출" },
    { value: "in_progress", label: "진행중" },
    { value: "quote_pending", label: "견적대기" },
    { value: "negotiating", label: "협상중" },
    { value: "contracted", label: "계약완료" },
    { value: "hold", label: "보류" },
    { value: "canceled", label: "취소" },
    { value: "closed", label: "종료" },
];

const selectClass =
    "px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]";

// ── page ──

export default function AdminExportsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">데이터 내보내기</h1>
                <p className="text-sm text-gray-500 mt-1">결제, 정산, 리드 데이터를 CSV로 내보냅니다.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <PaymentsCard />
                <SettlementsCard />
                <LeadsCard />
            </div>
        </div>
    );
}

// ── 결제 카드 ──

function PaymentsCard() {
    const [status, setStatus] = useState<PaymentStatus | "all">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);
            const today = new Date().toISOString().slice(0, 10);
            await downloadCsv("/api/exports/payments", params, `payments-${today}.csv`);
            toast.success("결제 데이터를 다운로드했습니다.");
        } catch {
            toast.error("다운로드에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#62e3d5]/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#0a3b41]" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-[#0a3b41]">결제 내역</h2>
                    <p className="text-xs text-gray-500">결제 상태 및 날짜 범위로 필터링</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">상태</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}>
                        {PAYMENT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
                </div>
                <Button variant="primary" size="sm" onClick={handleDownload} isLoading={loading}>
                    <Download className="w-4 h-4 mr-1" />
                    CSV 다운로드
                </Button>
            </div>
        </div>
    );
}

// ── 정산 카드 ──

function SettlementsCard() {
    const now = new Date();
    const [status, setStatus] = useState<SettlementStatus | "all">("all");
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(0);
    const [loading, setLoading] = useState(false);

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (month > 0) {
                params.set("year", String(year));
                params.set("month", String(month));
            }
            const today = new Date().toISOString().slice(0, 10);
            await downloadCsv("/api/exports/settlements", params, `settlements-${today}.csv`);
            toast.success("정산 데이터를 다운로드했습니다.");
        } catch {
            toast.error("다운로드에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#62e3d5]/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-[#0a3b41]" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-[#0a3b41]">정산 내역</h2>
                    <p className="text-xs text-gray-500">정산 상태 및 기간으로 필터링</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">상태</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}>
                        {SETTLEMENT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">년도</label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
                        {years.map((y) => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">월</label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectClass}>
                        <option value={0}>전체 월</option>
                        {months.map((m) => (
                            <option key={m} value={m}>{m}월</option>
                        ))}
                    </select>
                </div>
                <Button variant="primary" size="sm" onClick={handleDownload} isLoading={loading}>
                    <Download className="w-4 h-4 mr-1" />
                    CSV 다운로드
                </Button>
            </div>
        </div>
    );
}

// ── 리드 카드 ──

function LeadsCard() {
    const [status, setStatus] = useState<LeadStatus | "all">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (dateFrom) params.set("dateFrom", dateFrom);
            if (dateTo) params.set("dateTo", dateTo);
            const today = new Date().toISOString().slice(0, 10);
            await downloadCsv("/api/exports/leads", params, `leads-${today}.csv`);
            toast.success("리드 데이터를 다운로드했습니다.");
        } catch {
            toast.error("다운로드에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#62e3d5]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#0a3b41]" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-[#0a3b41]">리드 내역</h2>
                    <p className="text-xs text-gray-500">리드 상태 및 날짜 범위로 필터링</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">상태</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass}>
                        {LEAD_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
                </div>
                <Button variant="primary" size="sm" onClick={handleDownload} isLoading={loading}>
                    <Download className="w-4 h-4 mr-1" />
                    CSV 다운로드
                </Button>
            </div>
        </div>
    );
}
