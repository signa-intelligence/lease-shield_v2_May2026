import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { differenceInHours } from "date-fns";

export default function FirstSessionProgress({ user, leases, deposits, documents, isDarkMode = false, language = 'en' }) {
  // Only show if account is less than 24 hours old
  const accountAge = user?.created_date ? differenceInHours(new Date(), new Date(user.created_date)) : 999;
  
  if (accountAge > 24) return null;

  const t = {
    en: {
      title: "Your first session: {done} / {total} protections set up",
      leaseScan: "Scan a lease",
      propertyAdded: "Add your property",
      depositTracked: "Add your deposit",
      evidenceUploaded: "Upload evidence",
      unlockFullCoverage: "Unlock Full Coverage (Secure)"
    },
    th: {
      title: "เซสชันแรกของคุณ: {done} / {total} การป้องกันที่ตั้งค่า",
      leaseScan: "สแกนสัญญาเช่า",
      propertyAdded: "เพิ่มทรัพย์สินของคุณ",
      depositTracked: "เพิ่มเงินมัดจำของคุณ",
      evidenceUploaded: "อัปโหลดหลักฐาน",
      unlockFullCoverage: "ปลดล็อกความคุ้มครองเต็มรูปแบบ (Secure)"
    },
    zh: {
      title: "您的第一次会话：",
      protections: "已设置的保护",
      leaseScan: "已扫描租约",
      propertyAdded: "已添加物业",
      depositTracked: "已追踪押金",
      evidenceUploaded: "已上传证据",
      unlockFullCoverage: "解锁完全覆盖（Secure）"
    },
    ja: {
      title: "最初のセッション：",
      protections: "設定された保護",
      leaseScan: "賃貸契約スキャン済み",
      propertyAdded: "物件追加済み",
      depositTracked: "敷金追跡済み",
      evidenceUploaded: "証拠アップロード済み",
      unlockFullCoverage: "完全カバーを解除（Secure）"
    },
    ko: {
      title: "첫 세션:",
      protections: "설정된 보호",
      leaseScan: "임대 계약 스캔됨",
      propertyAdded: "부동산 추가됨",
      depositTracked: "보증금 추적됨",
      evidenceUploaded: "증거 업로드됨",
      unlockFullCoverage: "완전 보장 잠금 해제（Secure）"
    },
    ru: {
      title: "Ваша первая сессия: {done} / {total} защит установлено",
      leaseScan: "Отсканировать договор",
      propertyAdded: "Добавить вашу недвижимость",
      depositTracked: "Добавить ваш депозит",
      evidenceUploaded: "Загрузить доказательства",
      unlockFullCoverage: "Разблокировать полное покрытие（Secure）"
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

  const isFreeTier = !user?.plan_tier || user?.plan_tier === 'free';

  return (
    <div
      className="p-4 rounded-xl border-2"
      style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1E3A2E 0%, #0C3B2E 100%)'
          : 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
        borderColor: '#C7A338',
        marginBottom: '24px'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm" style={{ color: '#FFFFFF' }}>
          {language === 'en' || language === 'th' || language === 'ru'
            ? strings.title.replace('{done}', completedCount).replace('{total}', totalCount)
            : `${strings.title} ${completedCount} / ${totalCount}`
          }
        </span>
        <span className="text-lg font-bold" style={{ 
          color: '#C7A338',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: action.completed 
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(255, 255, 255, 0.15)',
              border: `1px solid ${action.completed ? '#10B981' : 'rgba(255, 255, 255, 0.3)'}`
            }}
          >
            {action.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-white opacity-60" />
            )}
            <span className="text-xs font-medium" style={{
              color: action.completed ? '#ECFDF5' : 'rgba(255, 255, 255, 0.9)'
            }}>
              {action.label}
            </span>
          </div>
        ))}
      </div>

      {isFreeTier && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5" style={{ color: '#C7A338' }}>
              {strings.unlockFullCoverage}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {language === 'th' ? 'เริ่มต้น ฿190/เดือน' : language === 'zh' ? '从฿190/月开始' : language === 'ja' ? '฿190/月から' : language === 'ko' ? '฿190/월부터' : language === 'ru' ? 'От ฿190/мес' : 'Starting at ฿190/month'}
            </p>
          </div>
          <a 
            href="/account?showPlans=true"
            className="w-full sm:w-auto"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/account?showPlans=true';
            }}
          >
            <button
              className="btn-interaction w-full sm:w-auto"
              style={{
                padding: '10px 20px',
                backgroundColor: '#C7A338',
                color: '#1A1D1F',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(199,163,56,0.4)',
                whiteSpace: 'nowrap'
              }}
            >
              {language === 'th' ? 'อัปเกรด →' : language === 'zh' ? '升级 →' : language === 'ja' ? 'アップグレード →' : language === 'ko' ? '업그레이드 →' : language === 'ru' ? 'Обновить →' : 'Upgrade →'}
            </button>
          </a>
        </div>
      )}
    </div>
  );
}