import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Receipt, Upload, Loader2, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const T = {
  en: {
    reimbursement: "Payment & Reimbursement",
    submitClaim: "I Paid — Request Reimbursement",
    amount: "Amount Paid (฿)",
    date: "Payment Date",
    receipt: "Receipt (JPEG/PNG/PDF)",
    submit: "Submit Claim",
    cancel: "Cancel",
    submitting: "Submitting...",
    pending: "PENDING",
    approved: "APPROVED",
    rejected: "REJECTED",
    paid: "REIMBURSED",
    claimedAmount: "Claimed",
    approvedAmount: "Approved",
    claimedOn: "Claimed on",
    approvedOn: "Approved on",
    paidOn: "Paid on",
    viewReceipt: "View Receipt",
    notes: "Notes",
    noReceipt: "Please upload a receipt",
    noAmount: "Please enter a valid amount",
    success: "Reimbursement claim submitted",
    error: "Something went wrong",
    notApplicable: "not_applicable",
  },
  th: {
    reimbursement: "การชำระเงินและการเบิกคืน",
    submitClaim: "ฉันจ่ายแล้ว — ขอเบิกคืน",
    amount: "จำนวนที่จ่าย (฿)",
    date: "วันที่ชำระ",
    receipt: "ใบเสร็จ (JPEG/PNG/PDF)",
    submit: "ส่งคำขอ",
    cancel: "ยกเลิก",
    submitting: "กำลังส่ง...",
    pending: "รอดำเนินการ",
    approved: "อนุมัติแล้ว",
    rejected: "ถูกปฏิเสธ",
    paid: "เบิกคืนแล้ว",
    claimedAmount: "จำนวนที่ขอ",
    approvedAmount: "จำนวนที่อนุมัติ",
    claimedOn: "ขอเมื่อ",
    approvedOn: "อนุมัติเมื่อ",
    paidOn: "จ่ายเมื่อ",
    viewReceipt: "ดูใบเสร็จ",
    notes: "หมายเหตุ",
    noReceipt: "กรุณาอัปโหลดใบเสร็จ",
    noAmount: "กรุณาใส่จำนวนเงิน",
    success: "ส่งคำขอเบิกคืนแล้ว",
    error: "เกิดข้อผิดพลาด",
  },
  zh: { reimbursement: "付款与报销", submitClaim: "我已付款 — 申请报销", amount: "已付金额 (฿)", date: "付款日期", receipt: "收据 (JPEG/PNG/PDF)", submit: "提交申请", cancel: "取消", submitting: "提交中...", pending: "待审核", approved: "已批准", rejected: "已拒绝", paid: "已报销", claimedAmount: "申请金额", approvedAmount: "批准金额", claimedOn: "申请日期", approvedOn: "批准日期", paidOn: "报销日期", viewReceipt: "查看收据", notes: "备注", noReceipt: "请上传收据", noAmount: "请输入有效金额", success: "报销申请已提交", error: "出错了" },
  ja: { reimbursement: "支払いと払い戻し", submitClaim: "支払い済み — 払い戻し申請", amount: "支払い金額 (฿)", date: "支払日", receipt: "レシート (JPEG/PNG/PDF)", submit: "申請する", cancel: "キャンセル", submitting: "送信中...", pending: "保留中", approved: "承認済み", rejected: "却下", paid: "払い戻し済み", claimedAmount: "申請金額", approvedAmount: "承認金額", claimedOn: "申請日", approvedOn: "承認日", paidOn: "支払日", viewReceipt: "レシートを見る", notes: "メモ", noReceipt: "レシートをアップロードしてください", noAmount: "有効な金額を入力してください", success: "払い戻し申請が提出されました", error: "エラー" },
  ko: { reimbursement: "결제 및 환급", submitClaim: "결제함 — 환급 요청", amount: "결제 금액 (฿)", date: "결제 날짜", receipt: "영수증 (JPEG/PNG/PDF)", submit: "신청하기", cancel: "취소", submitting: "제출 중...", pending: "대기 중", approved: "승인됨", rejected: "거부됨", paid: "환급됨", claimedAmount: "신청 금액", approvedAmount: "승인 금액", claimedOn: "신청일", approvedOn: "승인일", paidOn: "환급일", viewReceipt: "영수증 보기", notes: "메모", noReceipt: "영수증을 업로드하세요", noAmount: "유효한 금액을 입력하세요", success: "환급 신청이 제출되었습니다", error: "오류" },
  ru: { reimbursement: "Оплата и возмещение", submitClaim: "Я заплатил — Запрос на возмещение", amount: "Оплаченная сумма (฿)", date: "Дата оплаты", receipt: "Чек (JPEG/PNG/PDF)", submit: "Подать заявку", cancel: "Отмена", submitting: "Отправка...", pending: "В ожидании", approved: "Одобрено", rejected: "Отклонено", paid: "Возмещено", claimedAmount: "Запрошенная сумма", approvedAmount: "Одобренная сумма", claimedOn: "Дата запроса", approvedOn: "Дата одобрения", paidOn: "Дата выплаты", viewReceipt: "Посмотреть чек", notes: "Заметки", noReceipt: "Загрузите чек", noAmount: "Введите корректную сумму", success: "Заявка на возмещение подана", error: "Ошибка" },
};

function StatusBadge({ status, str, isDarkMode }) {
  const config = {
    pending: { bg: isDarkMode ? "rgba(245,158,11,0.15)" : "#FFF7ED", color: "#D97706", icon: Clock, label: str.pending },
    approved: { bg: isDarkMode ? "rgba(59,130,246,0.15)" : "#EFF6FF", color: "#2563EB", icon: CheckCircle2, label: str.approved },
    rejected: { bg: isDarkMode ? "rgba(239,68,68,0.15)" : "#FEF2F2", color: "#DC2626", icon: XCircle, label: str.rejected },
    paid: { bg: isDarkMode ? "rgba(16,185,129,0.15)" : "#F0FDF4", color: "#059669", icon: CheckCircle2, label: str.paid },
  };
  const c = config[status];
  if (!c) return null;
  const Icon = c.icon;
  return (
    <Badge className="text-xs font-bold gap-1" style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
      <Icon className="w-3 h-3" /> {c.label}
    </Badge>
  );
}

export default function ReimbursementSection({ request, colors, isDarkMode, language, toast }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const str = T[language] || T.en;

  const status = request.reimbursement_status;

  // Don't show if not applicable and no claim exists
  if (status === "not_applicable" && !request.tenant_paid_amount) {
    // Show submit claim button only for non-completed
    if (request.status === "completed" || request.status === "rejected") return null;
  }

  const handleSubmitClaim = async () => {
    if (!receiptFile) { toast?.error?.(str.noReceipt); return; }
    if (!amount || parseFloat(amount) <= 0) { toast?.error?.(str.noAmount); return; }

    setSubmitting(true);
    haptic.medium();
    const { file_url } = await base44.integrations.Core.UploadFile({ file: receiptFile });
    const res = await base44.functions.invoke("submitReimbursementClaim", {
      maintenance_id: request.id,
      amount: parseFloat(amount),
      payment_date: date,
      receipt_url: file_url,
      receipt_file_name: receiptFile.name,
    });
    if (res.data?.success) {
      setShowForm(false);
      setAmount("");
      setReceiptFile(null);
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      haptic.success();
      toast?.success?.(str.success);
    } else {
      toast?.error?.(res.data?.error || str.error);
    }
    setSubmitting(false);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div className="mt-3 p-3 rounded-lg" style={{
      backgroundColor: isDarkMode ? "rgba(245,158,11,0.06)" : "#FFFBEB",
      border: `1px solid ${isDarkMode ? "rgba(245,158,11,0.15)" : "#FDE68A"}`,
    }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
          <DollarSign className="w-3.5 h-3.5" /> {str.reimbursement}
        </p>
        {status && status !== "not_applicable" && <StatusBadge status={status} str={str} isDarkMode={isDarkMode} />}
      </div>

      {/* Existing claim info */}
      {request.tenant_paid_amount > 0 && (
        <div className="text-xs space-y-1 mb-2" style={{ color: colors.textSecondary }}>
          <p>{str.claimedAmount}: <strong style={{ color: colors.textPrimary }}>฿{request.tenant_paid_amount.toLocaleString()}</strong></p>
          {request.tenant_payment_date && <p>{str.claimedOn}: {fmtDate(request.tenant_payment_date)}</p>}
          {request.reimbursement_amount && status !== "pending" && (
            <p>{str.approvedAmount}: <strong style={{ color: colors.textPrimary }}>฿{request.reimbursement_amount.toLocaleString()}</strong></p>
          )}
          {request.reimbursement_notes && <p>{str.notes}: {request.reimbursement_notes}</p>}
          {request.tenant_receipt_url && (
            <a href={request.tenant_receipt_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: "#0C3B2E" }} onClick={() => haptic.light()}>
              📎 {str.viewReceipt}
            </a>
          )}
        </div>
      )}

      {/* Submit claim button (only if no claim yet) */}
      {(!status || status === "not_applicable") && !request.tenant_paid_amount && !showForm && (
        <button
          onClick={() => { haptic.light(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={{ backgroundColor: "#D97706", color: "#FFFFFF", minHeight: "36px" }}
        >
          <Receipt className="w-3 h-3" /> {str.submitClaim}
        </button>
      )}

      {/* Claim form */}
      {showForm && (
        <div className="space-y-2 mt-2">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{str.amount}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: colors.inputBg || colors.fieldBg, border: `1px solid ${colors.borderColor}`, color: colors.textPrimary, fontSize: "16px", minHeight: "40px" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{str.date}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: colors.inputBg || colors.fieldBg, border: `1px solid ${colors.borderColor}`, color: colors.textPrimary, fontSize: "16px", minHeight: "40px" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>{str.receipt}</label>
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setReceiptFile(e.target.files[0])} className="w-full text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmitClaim} disabled={submitting} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold active:scale-95" style={{ backgroundColor: "#D97706", color: "#FFFFFF", opacity: submitting ? 0.6 : 1, minHeight: "36px" }}>
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
              {submitting ? str.submitting : str.submit}
            </button>
            <button onClick={() => { setShowForm(false); setAmount(""); setReceiptFile(null); }} className="px-3 py-2 rounded-lg text-xs font-semibold active:scale-95" style={{ backgroundColor: isDarkMode ? "#374151" : "#F3F4F6", color: colors.textSecondary, minHeight: "36px" }}>
              {str.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}