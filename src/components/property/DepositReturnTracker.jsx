import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Loader2, ExternalLink, ArrowDownCircle } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const T = {
  en: {
    returned: "Deposit Returned",
    returnedOn: "Returned",
    amountReturned: "Amount Returned",
    deductions: "Deductions",
    notes: "Notes",
    proofUploaded: "Proof uploaded",
    uploadProof: "Upload Proof of Return",
    uploading: "Uploading...",
    viewProof: "View",
    markReturned: "Mark Deposit as Returned",
    amountLabel: "Amount Returned (฿)",
    notesLabel: "Notes (optional)",
    notesPlaceholder: "Any deductions or notes about the return...",
    originalDeposit: "Original deposit",
    confirmReturn: "Confirm Return",
    cancel: "Cancel",
    saving: "Saving...",
    depositReturn: "Deposit Return",
    success: "Deposit marked as returned",
    proofSuccess: "Proof uploaded successfully",
    error: "Something went wrong",
  },
  th: {
    returned: "คืนเงินมัดจำแล้ว",
    returnedOn: "คืนเมื่อ",
    amountReturned: "จำนวนที่คืน",
    deductions: "หักไว้",
    notes: "หมายเหตุ",
    proofUploaded: "อัปโหลดหลักฐานแล้ว",
    uploadProof: "อัปโหลดหลักฐานการคืน",
    uploading: "กำลังอัปโหลด...",
    viewProof: "ดู",
    markReturned: "ยืนยันว่าคืนเงินมัดจำแล้ว",
    amountLabel: "จำนวนเงินที่คืน (฿)",
    notesLabel: "หมายเหตุ (ไม่จำเป็น)",
    notesPlaceholder: "รายละเอียดการหักเงินหรือหมายเหตุ...",
    originalDeposit: "เงินมัดจำเดิม",
    confirmReturn: "ยืนยันการคืน",
    cancel: "ยกเลิก",
    saving: "กำลังบันทึก...",
    depositReturn: "การคืนเงินมัดจำ",
    success: "บันทึกการคืนเงินมัดจำแล้ว",
    proofSuccess: "อัปโหลดหลักฐานสำเร็จ",
    error: "เกิดข้อผิดพลาด",
  },
  zh: { returned: "押金已退还", returnedOn: "退还日期", amountReturned: "退还金额", deductions: "扣除", notes: "备注", proofUploaded: "凭证已上传", uploadProof: "上传退还凭证", uploading: "上传中...", viewProof: "查看", markReturned: "标记为已退还", amountLabel: "退还金额 (฿)", notesLabel: "备注 (可选)", notesPlaceholder: "扣款说明或备注...", originalDeposit: "原始押金", confirmReturn: "确认退还", cancel: "取消", saving: "保存中...", depositReturn: "押金退还", success: "已标记为退还", proofSuccess: "凭证已上传", error: "出错了" },
  ja: { returned: "敷金返還済み", returnedOn: "返還日", amountReturned: "返還金額", deductions: "控除", notes: "メモ", proofUploaded: "証明アップロード済み", uploadProof: "返還証明をアップロード", uploading: "アップロード中...", viewProof: "表示", markReturned: "敷金返還済みにする", amountLabel: "返還金額 (฿)", notesLabel: "メモ (任意)", notesPlaceholder: "控除や返還に関するメモ...", originalDeposit: "元の敷金", confirmReturn: "返還を確認", cancel: "キャンセル", saving: "保存中...", depositReturn: "敷金返還", success: "敷金返還済みに更新", proofSuccess: "証明をアップロードしました", error: "エラーが発生しました" },
  ko: { returned: "보증금 반환 완료", returnedOn: "반환 날짜", amountReturned: "반환 금액", deductions: "공제", notes: "메모", proofUploaded: "증빙 업로드 완료", uploadProof: "반환 증빙 업로드", uploading: "업로드 중...", viewProof: "보기", markReturned: "보증금 반환 완료로 표시", amountLabel: "반환 금액 (฿)", notesLabel: "메모 (선택)", notesPlaceholder: "공제 또는 반환 관련 메모...", originalDeposit: "원래 보증금", confirmReturn: "반환 확인", cancel: "취소", saving: "저장 중...", depositReturn: "보증금 반환", success: "보증금 반환 완료로 표시됨", proofSuccess: "증빙이 업로드되었습니다", error: "오류가 발생했습니다" },
  ru: { returned: "Депозит возвращён", returnedOn: "Возвращён", amountReturned: "Возвращённая сумма", deductions: "Вычеты", notes: "Заметки", proofUploaded: "Чек загружен", uploadProof: "Загрузить подтверждение возврата", uploading: "Загрузка...", viewProof: "Открыть", markReturned: "Отметить как возвращённый", amountLabel: "Возвращённая сумма (฿)", notesLabel: "Заметки (необязательно)", notesPlaceholder: "Детали вычетов или заметки...", originalDeposit: "Исходный депозит", confirmReturn: "Подтвердить возврат", cancel: "Отмена", saving: "Сохранение...", depositReturn: "Возврат депозита", success: "Депозит отмечен как возвращённый", proofSuccess: "Подтверждение загружено", error: "Что-то пошло не так" },
};

export default function DepositReturnTracker({ deposit, colors, isDarkMode, language, toast }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [marking, setMarking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [returnAmount, setReturnAmount] = useState(deposit.deposit_amount || 0);
  const [returnNotes, setReturnNotes] = useState("");

  const str = T[language] || T.en;

  const handleMarkReturned = async () => {
    setMarking(true);
    haptic.medium();
    const res = await base44.functions.invoke("markDepositReturned", {
      deposit_tracker_id: deposit.id,
      return_amount: returnAmount,
      return_notes: returnNotes,
    });
    if (res.data?.success) {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      queryClient.invalidateQueries({ queryKey: ["timelineEvents"] });
      haptic.success();
      toast?.success?.(str.success);
    } else {
      toast?.error?.(res.data?.error || str.error);
    }
    setMarking(false);
  };

  const handleUploadProof = async (file) => {
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
    setUploading(true);
    haptic.medium();
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const res = await base44.functions.invoke("uploadDepositReturnProof", {
      deposit_tracker_id: deposit.id,
      proof_url: file_url,
      proof_file_name: file.name,
    });
    if (res.data?.success) {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      haptic.success();
      toast?.success?.(str.proofSuccess);
    } else {
      toast?.error?.(res.data?.error || str.error);
    }
    setUploading(false);
  };

  // Already returned — show status
  if (deposit.status === "returned") {
    const deductions = (deposit.deposit_amount || 0) - (deposit.return_amount || deposit.deposit_amount || 0);

    return (
      <div
        className="mt-5 pt-5 border-t rounded-xl p-4"
        style={{
          borderColor: colors.borderColor,
          backgroundColor: isDarkMode ? "rgba(16,185,129,0.08)" : "#F0FDF4",
          border: `1px solid ${isDarkMode ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-sm" style={{ color: isDarkMode ? "#6EE7B7" : "#059669" }}>
            {str.returned}
          </span>
        </div>

        <div className="space-y-1.5 text-xs" style={{ color: colors.textSecondary }}>
          {deposit.returned_date && (
            <p>{str.returnedOn}: {new Date(deposit.returned_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
          )}
          {deposit.return_amount != null && (
            <p className="font-semibold" style={{ color: colors.textPrimary }}>
              {str.amountReturned}: ฿{deposit.return_amount.toLocaleString()}
            </p>
          )}
          {deductions > 0 && (
            <p className="text-red-600 font-semibold">
              {str.deductions}: ฿{deductions.toLocaleString()}
            </p>
          )}
          {deposit.return_notes && (
            <p>{str.notes}: {deposit.return_notes}</p>
          )}
        </div>

        {deposit.return_proof_url ? (
          <div className="flex items-center gap-2 mt-3 text-xs">
            <span>📎 {deposit.return_proof_file_name || str.proofUploaded}</span>
            <a
              href={deposit.return_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
              style={{ color: "#0C3B2E" }}
              onClick={() => haptic.light()}
            >
              [{str.viewProof}]
            </a>
          </div>
        ) : (
          <label
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer mt-3 transition-all active:scale-95"
            style={{
              backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
              color: colors.textSecondary,
              border: `1px solid ${colors.borderColor}`,
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? str.uploading : str.uploadProof}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files[0]) handleUploadProof(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  }

  // Not returned — show form or button
  return (
    <div className="mt-5 pt-5 border-t" style={{ borderColor: colors.borderColor }}>
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
        <ArrowDownCircle className="w-4 h-4" style={{ color: "#0C3B2E" }} />
        {str.depositReturn}
      </h4>

      {!showForm ? (
        <button
          onClick={() => {
            haptic.light();
            setReturnAmount(deposit.deposit_amount || 0);
            setReturnNotes("");
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: "#0C3B2E",
            color: "#FFFFFF",
            minHeight: "44px",
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          {str.markReturned}
        </button>
      ) : (
        <div className="space-y-3 p-4 rounded-xl" style={{
          backgroundColor: isDarkMode ? "rgba(12,59,46,0.08)" : "#F0FDF4",
          border: `1px solid ${isDarkMode ? "rgba(12,59,46,0.15)" : "#BBF7D0"}`,
        }}>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
              {str.amountLabel}
            </label>
            <input
              type="number"
              value={returnAmount}
              onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: colors.inputBg || colors.fieldBg,
                border: `1px solid ${colors.borderColor}`,
                color: colors.textPrimary,
                fontSize: "16px",
                minHeight: "44px",
              }}
            />
            <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              {str.originalDeposit}: ฿{(deposit.deposit_amount || 0).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
              {str.notesLabel}
            </label>
            <textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder={str.notesPlaceholder}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-vertical"
              style={{
                backgroundColor: colors.inputBg || colors.fieldBg,
                border: `1px solid ${colors.borderColor}`,
                color: colors.textPrimary,
                fontSize: "16px",
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMarkReturned}
              disabled={marking}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: "#0C3B2E",
                color: "#FFFFFF",
                opacity: marking ? 0.6 : 1,
                cursor: marking ? "not-allowed" : "pointer",
                minHeight: "44px",
              }}
            >
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {marking ? str.saving : str.confirmReturn}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={marking}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                color: colors.textSecondary,
                border: `1px solid ${colors.borderColor}`,
                minHeight: "44px",
              }}
            >
              {str.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}