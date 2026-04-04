import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Loader2, Camera, ExternalLink } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import LazyImage from "../shared/LazyImage";

const T = {
  en: {
    completionTracking: "Completion Tracking",
    completed: "Completed",
    completedOn: "Completed on",
    completionNotes: "Notes",
    markComplete: "Mark as Completed",
    notesPlaceholder: "Notes about the completed work (optional)...",
    confirm: "Confirm Completion",
    cancel: "Cancel",
    saving: "Saving...",
    uploadPhotos: "Upload Before/After Photos",
    uploading: "Uploading...",
    photosUploaded: "completion photo(s)",
    success: "Marked as completed",
    photoSuccess: "Photos uploaded",
    error: "Something went wrong",
  },
  th: {
    completionTracking: "ติดตามการซ่อม",
    completed: "เสร็จสิ้น",
    completedOn: "เสร็จเมื่อ",
    completionNotes: "หมายเหตุ",
    markComplete: "ทำเครื่องหมายว่าเสร็จ",
    notesPlaceholder: "หมายเหตุเกี่ยวกับงานซ่อม (ไม่จำเป็น)...",
    confirm: "ยืนยันว่าเสร็จ",
    cancel: "ยกเลิก",
    saving: "กำลังบันทึก...",
    uploadPhotos: "อัปโหลดรูปก่อน/หลัง",
    uploading: "กำลังอัปโหลด...",
    photosUploaded: "รูปภาพซ่อมเสร็จ",
    success: "บันทึกว่าเสร็จแล้ว",
    photoSuccess: "อัปโหลดรูปสำเร็จ",
    error: "เกิดข้อผิดพลาด",
  },
  zh: { completionTracking: "完工追踪", completed: "已完成", completedOn: "完成于", completionNotes: "备注", markComplete: "标记为已完成", notesPlaceholder: "完工备注（可选）...", confirm: "确认完成", cancel: "取消", saving: "保存中...", uploadPhotos: "上传前后照片", uploading: "上传中...", photosUploaded: "完工照片", success: "已标记为完成", photoSuccess: "照片已上传", error: "出错了" },
  ja: { completionTracking: "完了追跡", completed: "完了", completedOn: "完了日", completionNotes: "メモ", markComplete: "完了にする", notesPlaceholder: "完了メモ（任意）...", confirm: "完了を確認", cancel: "キャンセル", saving: "保存中...", uploadPhotos: "前後写真をアップロード", uploading: "アップロード中...", photosUploaded: "完了写真", success: "完了に更新", photoSuccess: "写真をアップロードしました", error: "エラー" },
  ko: { completionTracking: "완료 추적", completed: "완료됨", completedOn: "완료일", completionNotes: "메모", markComplete: "완료로 표시", notesPlaceholder: "완료 메모 (선택)...", confirm: "완료 확인", cancel: "취소", saving: "저장 중...", uploadPhotos: "전후 사진 업로드", uploading: "업로드 중...", photosUploaded: "완료 사진", success: "완료로 표시됨", photoSuccess: "사진 업로드 완료", error: "오류" },
  ru: { completionTracking: "Отслеживание завершения", completed: "Завершено", completedOn: "Завершено", completionNotes: "Заметки", markComplete: "Отметить как завершённое", notesPlaceholder: "Заметки о завершённой работе (необязательно)...", confirm: "Подтвердить", cancel: "Отмена", saving: "Сохранение...", uploadPhotos: "Загрузить фото до/после", uploading: "Загрузка...", photosUploaded: "фото завершения", success: "Отмечено как завершённое", photoSuccess: "Фото загружены", error: "Ошибка" },
};

export default function MaintenanceCompletionSection({ request, colors, isDarkMode, language, toast }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [marking, setMarking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const str = T[language] || T.en;

  // Already completed — show summary
  if (request.status === "completed") {
    return (
      <div className="mt-3 p-3 rounded-lg" style={{
        backgroundColor: isDarkMode ? "rgba(16,185,129,0.08)" : "#F0FDF4",
        border: `1px solid ${isDarkMode ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`,
      }}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold" style={{ color: isDarkMode ? "#6EE7B7" : "#059669" }}>{str.completed}</span>
        </div>
        {request.resolved_date && (
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {str.completedOn}: {new Date(request.resolved_date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
        {request.completion_notes && (
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>{str.completionNotes}: {request.completion_notes}</p>
        )}
        {request.completion_photo_urls && request.completion_photo_urls.length > 0 && (
          <div className="mt-2">
            <p className="text-xs mb-1" style={{ color: colors.textSecondary }}>📎 {request.completion_photo_urls.length} {str.photosUploaded}</p>
            <div className="grid grid-cols-4 gap-1">
              {request.completion_photo_urls.map((url, i) => (
                <LazyImage key={i} src={url} alt={`Completion ${i+1}`} className="w-full h-16 object-cover rounded cursor-pointer" onClick={() => window.open(url, "_blank")} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not completed — show action
  if (request.status === "completed" || request.status === "rejected") return null;

  const handleMarkComplete = async () => {
    setMarking(true);
    haptic.medium();
    const res = await base44.functions.invoke("markMaintenanceComplete", {
      maintenance_id: request.id,
      completion_notes: notes,
    });
    if (res.data?.success) {
      setShowForm(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["timelineEvents"] });
      haptic.success();
      toast?.success?.(str.success);
    } else {
      toast?.error?.(res.data?.error || str.error);
    }
    setMarking(false);
  };

  const handleUploadPhotos = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    haptic.medium();
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    await base44.entities.MaintenanceRequest.update(request.id, {
      completion_photo_urls: [...(request.completion_photo_urls || []), ...urls],
    });
    queryClient.invalidateQueries({ queryKey: ["maintenance"] });
    haptic.success();
    toast?.success?.(str.photoSuccess);
    setUploading(false);
  };

  return (
    <div className="mt-3 p-3 rounded-lg" style={{
      backgroundColor: isDarkMode ? "rgba(12,59,46,0.06)" : "#F8FAFC",
      border: `1px solid ${colors.borderColor}`,
    }}>
      <p className="text-xs font-bold mb-2" style={{ color: colors.textPrimary }}>{str.completionTracking}</p>

      {!showForm ? (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { haptic.light(); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF", minHeight: "36px" }}
          >
            <CheckCircle2 className="w-3 h-3" /> {str.markComplete}
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95" style={{
            backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
            color: colors.textPrimary,
            border: `1px solid ${colors.borderColor}`,
            opacity: uploading ? 0.6 : 1,
            minHeight: "36px",
          }}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
            {uploading ? str.uploading : str.uploadPhotos}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files.length) handleUploadPhotos(Array.from(e.target.files)); e.target.value = ""; }} />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={str.notesPlaceholder}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-xs resize-vertical"
            style={{ backgroundColor: colors.inputBg || colors.fieldBg, border: `1px solid ${colors.borderColor}`, color: colors.textPrimary, fontSize: "16px" }}
          />
          <div className="flex gap-2">
            <button onClick={handleMarkComplete} disabled={marking} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold active:scale-95" style={{ backgroundColor: "#0C3B2E", color: "#FFFFFF", opacity: marking ? 0.6 : 1, minHeight: "36px" }}>
              {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {marking ? str.saving : str.confirm}
            </button>
            <button onClick={() => { setShowForm(false); setNotes(""); }} className="px-3 py-2 rounded-lg text-xs font-semibold active:scale-95" style={{ backgroundColor: isDarkMode ? "#374151" : "#F3F4F6", color: colors.textSecondary, minHeight: "36px" }}>
              {str.cancel}
            </button>
          </div>
        </div>
      )}

      {request.completion_photo_urls && request.completion_photo_urls.length > 0 && (
        <div className="mt-2">
          <p className="text-xs" style={{ color: colors.textSecondary }}>📎 {request.completion_photo_urls.length} {str.photosUploaded}</p>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {request.completion_photo_urls.map((url, i) => (
              <LazyImage key={i} src={url} alt={`Completion ${i+1}`} className="w-full h-16 object-cover rounded cursor-pointer" onClick={() => window.open(url, "_blank")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}