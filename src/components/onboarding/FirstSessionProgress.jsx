import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { differenceInHours } from "date-fns";

export default function FirstSessionProgress({ user, leases, deposits, documents, colors, language = 'en' }) {
  // Only show if account is less than 24 hours old
  const accountAge = user?.created_date ? differenceInHours(new Date(), new Date(user.created_date)) : 999;
  
  if (accountAge > 24) return null;

  const t = {
    en: {
      title: "Your first session:",
      protections: "protections set up",
      leaseScan: "Lease scanned",
      propertyAdded: "Property added",
      depositTracked: "Deposit tracked",
      evidenceUploaded: "Evidence uploaded"
    },
    th: {
      title: "เซสชันแรกของคุณ:",
      protections: "การป้องกันที่ตั้งค่า",
      leaseScan: "สแกนสัญญาเช่า",
      propertyAdded: "เพิ่มทรัพย์สิน",
      depositTracked: "ติดตามเงินมัดจำ",
      evidenceUploaded: "อัปโหลดหลักฐาน"
    },
    zh: {
      title: "您的第一次会话：",
      protections: "已设置的保护",
      leaseScan: "已扫描租约",
      propertyAdded: "已添加物业",
      depositTracked: "已追踪押金",
      evidenceUploaded: "已上传证据"
    },
    ja: {
      title: "最初のセッション：",
      protections: "設定された保護",
      leaseScan: "賃貸契約スキャン済み",
      propertyAdded: "物件追加済み",
      depositTracked: "敷金追跡済み",
      evidenceUploaded: "証拠アップロード済み"
    },
    ko: {
      title: "첫 세션:",
      protections: "설정된 보호",
      leaseScan: "임대 계약 스캔됨",
      propertyAdded: "부동산 추가됨",
      depositTracked: "보증금 추적됨",
      evidenceUploaded: "증거 업로드됨"
    },
    ru: {
      title: "Ваша первая сессия:",
      protections: "настроено защит",
      leaseScan: "Договор отсканирован",
      propertyAdded: "Добавлена недвижимость",
      depositTracked: "Депозит отслеживается",
      evidenceUploaded: "Доказательства загружены"
    }
  };

  const strings = t[language] || t.en;

  const actions = [
    {
      label: strings.leaseScan,
      completed: user?.first_lease_scan_completed || leases.length > 0
    },
    {
      label: strings.propertyAdded,
      completed: user?.first_property_created || deposits.length > 0
    },
    {
      label: strings.depositTracked,
      completed: user?.first_deposit_added || deposits.length > 0
    },
    {
      label: strings.evidenceUploaded,
      completed: user?.first_evidence_upload || documents.length > 0
    }
  ];

  const completedCount = actions.filter(a => a.completed).length;
  const totalCount = actions.length;

  // Hide if all complete
  if (completedCount === totalCount) return null;

  return (
    <div
      className="mb-6 p-4 rounded-xl border-2"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: '#C7A338'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
            {strings.title}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
            backgroundColor: '#C7A338',
            color: '#FFFFFF'
          }}>
            {completedCount} / {totalCount}
          </span>
        </div>
        <span className="text-xs" style={{ color: colors.textSecondary }}>
          {strings.protections}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: action.completed 
                ? (colors.cardBg === '#FFFFFF' ? '#ECFDF5' : '#1E4435')
                : (colors.cardBg === '#FFFFFF' ? '#F3F4F6' : '#353A3D'),
              border: `1px solid ${action.completed ? '#10B981' : colors.borderColor}`
            }}
          >
            {action.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Circle className="w-3.5 h-3.5" style={{ color: colors.textSecondary }} />
            )}
            <span className="text-xs font-medium" style={{
              color: action.completed ? '#10B981' : colors.textSecondary
            }}>
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}