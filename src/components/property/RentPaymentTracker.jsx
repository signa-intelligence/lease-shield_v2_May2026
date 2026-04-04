import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Loader2, FileText, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import LazyImage from "../shared/LazyImage";

const T = {
  en: {
    paymentHistory: "Payment History",
    markAsPaid: "Mark as Paid",
    marking: "Marking...",
    uploadProof: "Upload Proof",
    uploading: "Uploading...",
    paid: "PAID",
    overdue: "OVERDUE",
    pending: "PENDING",
    daysLate: "days late",
    paidOn: "Paid",
    proof: "Proof",
    viewProof: "View",
    noPayments: "Set up rent schedule to track payments",
    generating: "Loading payments...",
  },
  th: {
    paymentHistory: "ประวัติการชำระเงิน",
    markAsPaid: "ยืนยันว่าชำระแล้ว",
    marking: "กำลังบันทึก...",
    uploadProof: "อัปโหลดหลักฐาน",
    uploading: "กำลังอัปโหลด...",
    paid: "ชำระแล้ว",
    overdue: "เลยกำหนด",
    pending: "รอชำระ",
    daysLate: "วันที่เลยกำหนด",
    paidOn: "ชำระเมื่อ",
    proof: "หลักฐาน",
    viewProof: "ดู",
    noPayments: "ตั้งค่ากำหนดค่าเช่าเพื่อติดตามการชำระเงิน",
    generating: "กำลังโหลด...",
  },
  zh: { paymentHistory: "付款记录", markAsPaid: "标记为已付", marking: "标记中...", uploadProof: "上传凭证", uploading: "上传中...", paid: "已付", overdue: "逾期", pending: "待付", daysLate: "天逾期", paidOn: "付款日", proof: "凭证", viewProof: "查看", noPayments: "设置租金计划以追踪付款", generating: "加载中..." },
  ja: { paymentHistory: "支払い履歴", markAsPaid: "支払い済みにする", marking: "処理中...", uploadProof: "証明をアップロード", uploading: "アップロード中...", paid: "支払い済み", overdue: "期限超過", pending: "未払い", daysLate: "日超過", paidOn: "支払日", proof: "証明", viewProof: "表示", noPayments: "家賃スケジュールを設定して支払いを追跡", generating: "読み込み中..." },
  ko: { paymentHistory: "결제 내역", markAsPaid: "결제 완료로 표시", marking: "처리 중...", uploadProof: "증빙 업로드", uploading: "업로드 중...", paid: "결제 완료", overdue: "연체", pending: "대기 중", daysLate: "일 연체", paidOn: "결제일", proof: "증빙", viewProof: "보기", noPayments: "임대료 일정을 설정하여 결제 추적", generating: "로딩 중..." },
  ru: { paymentHistory: "История платежей", markAsPaid: "Отметить как оплачено", marking: "Обработка...", uploadProof: "Загрузить чек", uploading: "Загрузка...", paid: "ОПЛАЧЕНО", overdue: "ПРОСРОЧЕНО", pending: "ОЖИДАНИЕ", daysLate: "дней просрочки", paidOn: "Оплачено", proof: "Чек", viewProof: "Открыть", noPayments: "Настройте график аренды для отслеживания платежей", generating: "Загрузка..." },
};

function getMonthsToGenerate(rentDueDay) {
  const today = new Date();
  const months = [];
  for (let i = 2; i >= -1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(rentDueDay || 1, lastDay);
    const dueDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    months.push({ dueDate, monthKey });
  }
  return months;
}

export default function RentPaymentTracker({ deposit, colors, isDarkMode, language, toast, user }) {
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const str = T[language] || T.en;

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["rentPayments", deposit.id],
    queryFn: () => base44.entities.RentPayment.filter({ deposit_tracker_id: deposit.id }, "-due_date"),
    enabled: !!deposit.id && !!deposit.rent_amount && !!deposit.rent_due_day,
  });

  // Auto-generate missing payment records
  useEffect(() => {
    if (isLoading || !deposit.rent_amount || !deposit.rent_due_day || !user?.email) return;

    const needed = getMonthsToGenerate(deposit.rent_due_day);
    const existingKeys = new Set(payments.map((p) => p.month_key));
    const missing = needed.filter((m) => !existingKeys.has(m.monthKey));

    if (missing.length === 0) return;

    const createMissing = async () => {
      for (const m of missing) {
        await base44.entities.RentPayment.create({
          deposit_tracker_id: deposit.id,
          owner_email: user.email,
          month_key: m.monthKey,
          due_date: m.dueDate,
          amount: deposit.rent_amount,
          payment_status: "pending",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["rentPayments", deposit.id] });
    };
    createMissing();
  }, [isLoading, payments.length, deposit.id, deposit.rent_amount, deposit.rent_due_day, user?.email]);

  const handleMarkPaid = async (payment) => {
    setMarkingId(payment.id);
    haptic.medium();
    await base44.entities.RentPayment.update(payment.id, {
      payment_status: "paid",
      paid_date: new Date().toISOString().split("T")[0],
    });
    // Timeline event
    base44.entities.TimelineEvent.create({
      owner_email: user.email,
      property_address: deposit.property_address || "",
      lease_id: deposit.lease_id || "",
      event_type: "rent_due",
      event_date: new Date().toISOString(),
      title: language === "th" ? "ยืนยันการชำระค่าเช่า" : "Rent Payment Confirmed",
      description: `฿${payment.amount?.toLocaleString()} — ${new Date(payment.due_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      source: "manual",
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["rentPayments", deposit.id] });
    setMarkingId(null);
    haptic.success();
    toast?.success?.(language === "th" ? "บันทึกการชำระเงินแล้ว" : "Payment recorded");
  };

  const handleUploadProof = async (payment, file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast?.error?.(language === "th" ? "รองรับเฉพาะ JPEG, PNG, PDF" : "Only JPEG, PNG, or PDF allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast?.error?.(language === "th" ? "ไฟล์ใหญ่เกิน 10MB" : "File too large (max 10MB)");
      return;
    }
    setUploadingId(payment.id);
    haptic.medium();
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.RentPayment.update(payment.id, {
      proof_url: file_url,
      proof_file_name: file.name,
    });
    // Also save as Document for evidence vault
    base44.entities.Document.create({
      type: "receipt",
      file_url,
      label: `Rent proof — ${new Date(payment.due_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["rentPayments", deposit.id] });
    setUploadingId(null);
    haptic.success();
    toast?.success?.(language === "th" ? "อัปโหลดหลักฐานสำเร็จ" : "Proof uploaded");
  };

  if (!deposit.rent_amount || !deposit.rent_due_day) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2" style={{ color: colors.textSecondary }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{str.generating}</span>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="mt-6 pt-5 border-t" style={{ borderColor: colors.borderColor }}>
      <h4 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <FileText className="w-5 h-5" style={{ color: "#0C3B2E" }} />
        {str.paymentHistory}
      </h4>

      <div className="space-y-3">
        {payments.map((p) => {
          const due = new Date(p.due_date);
          const isPaid = p.payment_status === "paid";
          const isOverdue = !isPaid && due < today;
          const daysLate = isOverdue ? Math.floor((today - due) / 86400000) : 0;
          const monthLabel = due.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "long", year: "numeric" });

          return (
            <div
              key={p.id}
              className="rounded-xl p-4 transition-all"
              style={{
                backgroundColor: isPaid
                  ? isDarkMode ? "rgba(16,185,129,0.08)" : "#F0FDF4"
                  : isOverdue
                  ? isDarkMode ? "rgba(239,68,68,0.08)" : "#FEF2F2"
                  : colors.fieldBg,
                border: `1px solid ${isPaid ? (isDarkMode ? "rgba(16,185,129,0.2)" : "#BBF7D0") : isOverdue ? (isDarkMode ? "rgba(239,68,68,0.2)" : "#FECACA") : colors.borderColor}`,
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-sm" style={{ color: colors.textPrimary }}>{monthLabel}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: colors.textPrimary }}>
                    ฿{(p.amount || 0).toLocaleString()}
                  </p>
                </div>
                {isPaid ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {str.paid}
                  </Badge>
                ) : isOverdue ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-bold gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {str.overdue} ({daysLate} {str.daysLate})
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold gap-1">
                    <Clock className="w-3 h-3" />
                    {str.pending}
                  </Badge>
                )}
              </div>

              {/* Paid info */}
              {isPaid && (
                <div className="text-xs space-y-1 mb-2" style={{ color: colors.textSecondary }}>
                  {p.paid_date && (
                    <p>{str.paidOn}: {new Date(p.paid_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                  {p.proof_url && (
                    <div className="flex items-center gap-1">
                      <span>📎 {p.proof_file_name || str.proof}</span>
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                        style={{ color: "#0C3B2E" }}
                        onClick={() => haptic.light()}
                      >
                        [{str.viewProof}]
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {!isPaid && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => handleMarkPaid(p)}
                    disabled={markingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: "#0C3B2E",
                      color: "#FFFFFF",
                      opacity: markingId === p.id ? 0.6 : 1,
                      cursor: markingId === p.id ? "not-allowed" : "pointer",
                      minHeight: "40px",
                    }}
                  >
                    {markingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {markingId === p.id ? str.marking : str.markAsPaid}
                  </button>

                  <label
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderColor}`,
                      opacity: uploadingId === p.id ? 0.6 : 1,
                      minHeight: "40px",
                    }}
                  >
                    {uploadingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingId === p.id ? str.uploading : str.uploadProof}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      disabled={uploadingId === p.id}
                      onChange={(e) => {
                        if (e.target.files[0]) handleUploadProof(p, e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Upload proof for already-paid (if missing) */}
              {isPaid && !p.proof_url && (
                <label
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer mt-2 transition-all active:scale-95"
                  style={{
                    backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                    color: colors.textSecondary,
                    border: `1px solid ${colors.borderColor}`,
                    opacity: uploadingId === p.id ? 0.6 : 1,
                  }}
                >
                  {uploadingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploadingId === p.id ? str.uploading : str.uploadProof}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    disabled={uploadingId === p.id}
                    onChange={(e) => {
                      if (e.target.files[0]) handleUploadProof(p, e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}