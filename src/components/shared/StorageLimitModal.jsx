import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Database, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { haptic } from "./HapticFeedback";

const TIER_INFO = {
  free: { label: 'Explorer', limitLabel: '100 MB', limitBytes: 100 * 1024 * 1024, next: 'lite', nextLabel: 'Lite', nextLimitLabel: '1 GB', nextPrice: 190, multiplier: '10×', benefits: ['6 lease scans/year', '3 letter credits', 'Email alerts'] },
  lite: { label: 'Lite', limitLabel: '1 GB', limitBytes: 1024 * 1024 * 1024, next: 'protect', nextLabel: 'Protect', nextLimitLabel: '5 GB', nextPrice: 390, multiplier: '5×', benefits: ['12 lease scans/year', '10 letter credits', 'LINE alerts'] },
  protect: { label: 'Protect', limitLabel: '5 GB', limitBytes: 5 * 1024 * 1024 * 1024, next: 'secure', nextLabel: 'Secure', nextLimitLabel: '20 GB', nextPrice: 990, multiplier: '4×', benefits: ['Unlimited scans', '50 letter credits/month', 'Priority support'] },
  secure: { label: 'Secure', limitLabel: '20 GB', limitBytes: 20 * 1024 * 1024 * 1024, next: null, nextLabel: null, nextLimitLabel: null, nextPrice: null, multiplier: null, benefits: [] },
};

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

const t = {
  en: { title: 'Storage Limit Reached', wouldExceed: 'This upload would exceed your storage limit.', using: "You're using", of: 'of', moreSpace: 'Need more space?', current: 'Current', upgrade: 'Upgrade', storage: 'storage', plus: 'plus', upgradeNow: 'Upgrade Now', later: 'Maybe Later', maxTier: "You're on our highest tier. Contact support if you need more storage.", perMonth: '/month', getMore: 'Get {mult} more storage' },
  th: { title: 'พื้นที่จัดเก็บเต็ม', wouldExceed: 'การอัปโหลดนี้จะเกินขีดจำกัดพื้นที่ของคุณ', using: 'คุณใช้', of: 'จาก', moreSpace: 'ต้องการพื้นที่เพิ่ม?', current: 'ปัจจุบัน', upgrade: 'อัปเกรด', storage: 'พื้นที่', plus: 'รวมถึง', upgradeNow: 'อัปเกรดตอนนี้', later: 'ไว้ทีหลัง', maxTier: 'คุณอยู่ในแพลนสูงสุดแล้ว ติดต่อฝ่ายสนับสนุนหากต้องการพื้นที่เพิ่ม', perMonth: '/เดือน', getMore: 'รับพื้นที่เพิ่ม {mult}' },
  zh: { title: '存储空间已满', wouldExceed: '此上传将超出您的存储限制。', using: '您正在使用', of: '/', moreSpace: '需要更多空间？', current: '当前', upgrade: '升级', storage: '存储', plus: '加', upgradeNow: '立即升级', later: '稍后再说', maxTier: '您已在最高套餐。如需更多存储，请联系支持。', perMonth: '/月', getMore: '获得 {mult} 更多空间' },
  ja: { title: 'ストレージ上限到達', wouldExceed: 'このアップロードはストレージ制限を超えます。', using: '使用中', of: '/', moreSpace: 'もっとスペースが必要？', current: '現在', upgrade: 'アップグレード', storage: 'ストレージ', plus: 'プラス', upgradeNow: '今すぐアップグレード', later: '後で', maxTier: '最上位プランをご利用中です。追加ストレージが必要な場合はサポートにご連絡ください。', perMonth: '/月', getMore: '{mult} の追加ストレージ' },
  ko: { title: '저장 공간 한도 도달', wouldExceed: '이 업로드는 저장 공간 한도를 초과합니다.', using: '사용 중', of: '/', moreSpace: '더 많은 공간이 필요하세요?', current: '현재', upgrade: '업그레이드', storage: '저장소', plus: '플러스', upgradeNow: '지금 업그레이드', later: '나중에', maxTier: '최상위 플랜을 사용 중입니다. 추가 저장소가 필요하면 지원팀에 문의하세요.', perMonth: '/월', getMore: '{mult} 더 많은 저장소' },
  ru: { title: 'Лимит хранилища достигнут', wouldExceed: 'Эта загрузка превысит лимит хранилища.', using: 'Используется', of: 'из', moreSpace: 'Нужно больше места?', current: 'Текущий', upgrade: 'Обновить', storage: 'хранилище', plus: 'плюс', upgradeNow: 'Обновить сейчас', later: 'Позже', maxTier: 'Вы на максимальном тарифе. Свяжитесь с поддержкой для дополнительного хранилища.', perMonth: '/мес', getMore: '{mult} больше хранилища' },
};

export default function StorageLimitModal({ open, onClose, currentUsage = 0, limit = 0, currentTier = 'free', fileSize = 0, language = 'en', isDarkMode = false }) {
  const strings = t[language] || t.en;
  const tier = TIER_INFO[currentTier] || TIER_INFO.free;
  const usagePercent = limit > 0 ? Math.min(100, Math.round((currentUsage / limit) * 100)) : 100;

  const colors = isDarkMode ? {
    cardBg: '#1F2937', textPrimary: '#F9FAFB', textSecondary: '#D1D5DB', borderColor: 'rgba(255,255,255,0.1)', fieldBg: '#374151'
  } : {
    cardBg: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#475569', borderColor: 'rgba(12,59,46,0.08)', fieldBg: '#F8FAFC'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] modal-enter" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-bold" style={{ color: colors.textPrimary }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            {strings.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Message */}
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            {fileSize > 0 ? strings.wouldExceed : `${strings.using} ${formatBytes(currentUsage)} ${strings.of} ${tier.limitLabel}.`}
          </p>

          {/* Storage Meter */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: colors.fieldBg, border: `1px solid ${colors.borderColor}` }}>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                <Database className="w-3.5 h-3.5 inline mr-1" />
                {strings.storage}
              </span>
              <span className="text-xs font-bold" style={{ color: usagePercent >= 95 ? '#EF4444' : colors.textPrimary }}>
                {formatBytes(currentUsage)} / {tier.limitLabel}
              </span>
            </div>
            <Progress value={usagePercent} className="h-2.5" />
            <p className="text-xs mt-1 font-semibold" style={{ color: usagePercent >= 95 ? '#EF4444' : '#F59E0B' }}>
              {usagePercent}% {strings.using.toLowerCase()}
            </p>
          </div>

          {/* Upgrade Prompt */}
          {tier.next ? (
            <div className="space-y-4">
              <p className="font-bold text-sm" style={{ color: colors.textPrimary }}>{strings.moreSpace}</p>

              {/* Tier Comparison */}
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: isDarkMode ? '#0C3B2E20' : '#F0FDF4', border: '2px solid #0C3B2E' }}>
                <div className="text-center flex-1">
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{strings.current}</p>
                  <p className="text-sm font-bold" style={{ color: colors.textPrimary }}>{tier.label}</p>
                  <p className="text-lg font-bold" style={{ color: '#EF4444' }}>{tier.limitLabel}</p>
                </div>
                <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#0C3B2E' }} />
                <div className="text-center flex-1">
                  <p className="text-xs font-semibold" style={{ color: '#0C3B2E' }}>{strings.upgrade}</p>
                  <p className="text-sm font-bold" style={{ color: '#0C3B2E' }}>{tier.nextLabel}</p>
                  <p className="text-lg font-bold" style={{ color: '#10B981' }}>{tier.nextLimitLabel}</p>
                  <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>฿{tier.nextPrice}{strings.perMonth}</p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <p className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.getMore.replace('{mult}', tier.multiplier)} {strings.plus}:
                </p>
                {tier.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs" style={{ color: colors.textPrimary }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Link to={createPageUrl("Account") + '?showPlans=true&highlight=' + tier.next} className="w-full" onClick={() => { haptic.medium(); onClose(); }}>
                  <Button className="w-full" style={{ backgroundColor: '#0C3B2E', color: '#FFFFFF', minHeight: '48px', fontWeight: 700, boxShadow: '0 4px 12px rgba(12,59,46,0.4)' }}>
                    {strings.upgradeNow}
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => { haptic.light(); onClose(); }} className="w-full" style={{ minHeight: '44px' }}>
                  {strings.later}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>{strings.maxTier}</p>
              <Button variant="outline" onClick={() => { haptic.light(); onClose(); }} className="w-full" style={{ minHeight: '44px' }}>
                {strings.later}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}