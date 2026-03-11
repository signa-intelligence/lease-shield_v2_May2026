import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Check, Pencil, FileText, Wallet } from "lucide-react";
import { format } from "date-fns";
import { haptic } from "../shared/HapticFeedback";

const ManualLeaseEvents = ({ user, colors, isDarkMode, language }) => {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState(null);
  const [dateValue, setDateValue] = useState("");
  const [saving, setSaving] = useState(false);

  const t = {
    en: {
      title: "Manual Lease Dates",
      leaseEnd: "End of Lease Date",
      depositReturn: "Deposit Return Date",
      setDate: "Set date",
      save: "Save",
      cancel: "Cancel",
    },
    th: {
      title: "วันที่สัญญาเช่าด้วยตนเอง",
      leaseEnd: "วันสิ้นสุดสัญญาเช่า",
      depositReturn: "วันคืนเงินมัดจำ",
      setDate: "กำหนดวันที่",
      save: "บันทึก",
      cancel: "ยกเลิก",
    },
    zh: {
      title: "手动租约日期",
      leaseEnd: "租约结束日期",
      depositReturn: "押金退还日期",
      setDate: "设置日期",
      save: "保存",
      cancel: "取消",
    },
    ja: {
      title: "手動リース日付",
      leaseEnd: "賃貸契約終了日",
      depositReturn: "敷金返還日",
      setDate: "日付を設定",
      save: "保存",
      cancel: "キャンセル",
    },
    ko: {
      title: "수동 임대 날짜",
      leaseEnd: "임대 계약 종료일",
      depositReturn: "보증금 반환일",
      setDate: "날짜 설정",
      save: "저장",
      cancel: "취소",
    },
    ru: {
      title: "Ручные даты аренды",
      leaseEnd: "Дата окончания аренды",
      depositReturn: "Дата возврата депозита",
      setDate: "Установить дату",
      save: "Сохранить",
      cancel: "Отмена",
    },
  };

  const strings = t[language] || t.en;

  const fields = [
    {
      key: "manual_lease_end_date",
      label: strings.leaseEnd,
      icon: FileText,
      color: "#EF4444",
    },
    {
      key: "manual_deposit_return_date",
      label: strings.depositReturn,
      icon: Wallet,
      color: "#C7A338",
    },
  ];

  const handleStartEdit = (key) => {
    haptic.light();
    setEditingField(key);
    setDateValue(user?.[key] || "");
  };

  const handleSave = async (key) => {
    if (!dateValue) return;
    setSaving(true);
    haptic.medium();
    await base44.auth.updateMe({ [key]: dateValue });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setEditingField(null);
    setDateValue("");
    setSaving(false);
  };

  const handleClear = async (key) => {
    haptic.medium();
    setSaving(true);
    await base44.auth.updateMe({ [key]: null });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setEditingField(null);
    setDateValue("");
    setSaving(false);
  };

  const handleCancel = () => {
    haptic.light();
    setEditingField(null);
    setDateValue("");
  };

  return (
    <div className="space-y-2">
      <h4
        className="font-bold text-xs uppercase tracking-wide mb-2"
        style={{ color: colors.textSecondary }}
      >
        {strings.title}
      </h4>
      {fields.map(({ key, label, icon: Icon, color }) => {
        const currentValue = user?.[key];
        const isEditing = editingField === key;

        return (
          <div
            key={key}
            className="p-3 rounded-xl border-2 transition-all"
            style={{
              backgroundColor: currentValue
                ? `${color}08`
                : isDarkMode
                ? "#374151"
                : "#F8FAFC",
              borderColor: currentValue ? `${color}40` : colors.borderColor,
              borderLeftWidth: "5px",
              borderLeftColor: currentValue ? color : colors.borderColor,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-xs"
                  style={{ color: colors.textPrimary }}
                >
                  {label}
                </p>

                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="date"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border text-sm flex-1"
                      style={{
                        backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                        borderColor: colors.borderColor,
                        color: colors.textPrimary,
                        fontSize: "14px",
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(key)}
                      disabled={!dateValue || saving}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        backgroundColor:
                          dateValue && !saving ? "#0C3B2E" : "#9CA3AF",
                        color: "#FFFFFF",
                        opacity: dateValue && !saving ? 1 : 0.5,
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                        color: colors.textSecondary,
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : currentValue ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CalendarIcon
                      className="w-3 h-3"
                      style={{ color: colors.textSecondary }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      {format(new Date(currentValue), "MMM d, yyyy")}
                    </span>
                  </div>
                ) : (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: colors.textSecondary }}
                  >
                    {strings.setDate}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleStartEdit(key)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
                      color: colors.textSecondary,
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {currentValue && (
                    <button
                      onClick={() => handleClear(key)}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isDarkMode ? "#4B1D1D" : "#FEE2E2",
                        color: "#EF4444",
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ManualLeaseEvents;