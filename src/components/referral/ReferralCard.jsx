import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Share2, CheckCircle2, TrendingUp, Gift, Zap } from 'lucide-react';
import { haptic } from '../shared/HapticFeedback';
import { useToast } from '../shared/Toast';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReferralCard({ user, colors, language = 'en' }) {
  const [copiedItem, setCopiedItem] = useState(null);
  const toast = useToast();

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }, '-created_date', 50),
    enabled: !!user,
  });

  // Tier-based referral limits
  const TIER_LIMITS = {
    free: 3,
    lite: 10,
    protect: 25,
    secure: 999
  };

  const userTier = user?.plan_tier || 'free';
  const tierLimit = user?.referral_limit_override || TIER_LIMITS[userTier] || TIER_LIMITS.free;
  const isUnlimited = userTier === 'secure' || tierLimit >= 999;

  // Count active referrals (exclude refunded/chargeback)
  const activeReferrals = referrals.filter(r => 
    ['pending_first_payment', 'pending_refund_window', 'converted', 'cancelled'].includes(r.status)
  );
  const currentReferralCount = activeReferrals.length;
  const limitReached = !isUnlimited && currentReferralCount >= tierLimit;

  const t = {
    en: {
      title: "Refer Friends. Earn Free Months.",
      subtitle: "Share your link. When friends complete 3 months of paid subscription, you earn credit toward your next invoice.",
      unlimitedReferrals: "Unlimited Referrals",
      unlimitedDesc: "No cap on invites",
      referralLimit: "Referral Limit",
      referralsUsed: "used",
      upgradeForMore: "Upgrade for more",
      limitReached: "Limit Reached",
      limitReachedDesc: "Upgrade your plan to refer more friends",
      creditRule: "Earn Friend's Plan Value",
      creditRuleDesc: "You earn what your friend subscribes to",
      autoApplied: "Auto-Applied",
      autoAppliedDesc: "Credit reduces next billing automatically",
      yourLink: "Your Referral Link",
      copyLink: "Copy Link",
      shareLink: "Share Link",
      linkCopied: "Copied!",
      friendsReferred: "Friends Who Subscribed",
      availableCredit: "Available Credit",
      appliedToNextInvoice: "Applied automatically to your next invoice(s)",
      recentReferrals: "Recent Referrals",
      pending: "Pending",
      converted: "Converted",
      cancelled: "Cancelled",
      noReferralsYet: "No referrals yet. Share your link to get started!",
      example: "Example: You're on Lite. Friend joins Protect (฿390) and completes 3 months → you earn ฿390.",
      earnedCredit: "Earned",
      status: "Status"
    },
    th: {
      title: "แนะนำเพื่อน รับเดือนฟรี",
      subtitle: "แชร์ลิงก์ของคุณ เมื่อเพื่อนชำระครบ 3 เดือนติดต่อกัน คุณจะได้รับเครดิตสำหรับใบแจ้งหนี้ถัดไป",
      unlimitedReferrals: "แนะนำได้ไม่จำกัด",
      unlimitedDesc: "ไม่จำกัดจำนวนเพื่อน",
      referralLimit: "ขอบเขตการแนะนำ",
      referralsUsed: "ใช้ไปแล้ว",
      upgradeForMore: "อัปเกรดเพื่อเพิ่มเติม",
      limitReached: "ถึงขีดจำกัด",
      limitReachedDesc: "อัปเกรดแผนเพื่อแนะนำเพื่อนเพิ่มเติม",
      creditRule: "ได้รับมูลค่าแผนของเพื่อน",
      creditRuleDesc: "คุณได้รับตามแผนที่เพื่อนสมัคร",
      autoApplied: "ใช้อัตโนมัติ",
      autoAppliedDesc: "เครดิตหักยอดรอบถัดไปโดยอัตโนมัติ",
      yourLink: "ลิงก์แนะนำของคุณ",
      copyLink: "คัดลอกลิงก์",
      shareLink: "แชร์ลิงก์",
      linkCopied: "คัดลอกแล้ว!",
      friendsReferred: "เพื่อนที่สมัครแล้ว",
      availableCredit: "เครดิตคงเหลือ",
      appliedToNextInvoice: "ใช้อัตโนมัติกับใบแจ้งหนี้ถัดไป",
      recentReferrals: "การแนะนำล่าสุด",
      pending: "รอชำระเงิน",
      converted: "สำเร็จ",
      cancelled: "ยกเลิก",
      noReferralsYet: "ยังไม่มีการแนะนำ แชร์ลิงก์เพื่อเริ่มต้น!",
      example: "ตัวอย่าง: คุณใช้ Lite เพื่อนใช้ Protect (฿390) และชำระครบ 3 เดือน → คุณได้ ฿390",
      earnedCredit: "ได้รับ",
      status: "สถานะ"
    },
    zh: {
      title: "推荐好友，赚免费月份",
      subtitle: "分享您的链接。当好友完成3个月的连续付费订阅时，您将获得下次发票的抵扣额度。",
      unlimitedReferrals: "无限推荐",
      unlimitedDesc: "邀请不设上限",
      referralLimit: "推荐限制",
      referralsUsed: "已使用",
      upgradeForMore: "升级以获取更多",
      limitReached: "已达上限",
      limitReachedDesc: "升级您的计划以推荐更多朋友",
      creditRule: "获得好友计划价值",
      creditRuleDesc: "您获得好友订阅的计划价值",
      autoApplied: "自动应用",
      autoAppliedDesc: "额度自动抵扣下次账单",
      yourLink: "您的推荐链接",
      copyLink: "复制链接",
      shareLink: "分享链接",
      linkCopied: "已复制！",
      friendsReferred: "已订阅好友",
      availableCredit: "可用额度",
      appliedToNextInvoice: "自动应用于下次发票",
      recentReferrals: "最近推荐",
      pending: "待支付",
      converted: "已转化",
      cancelled: "已取消",
      noReferralsYet: "还没有推荐。分享您的链接开始吧！",
      example: "示例：您使用Lite。好友订阅Protect（฿390）并完成3个月 → 您获得฿390。",
      earnedCredit: "获得",
      status: "状态"
    },
    ja: {
      title: "友達紹介で無料月を獲得",
      subtitle: "リンクを共有。友達が3ヶ月間の連続有料購読を完了すると、次回請求のクレジットが得られます。",
      unlimitedReferrals: "無制限紹介",
      unlimitedDesc: "招待上限なし",
      referralLimit: "紹介制限",
      referralsUsed: "使用済み",
      upgradeForMore: "アップグレードして増やす",
      limitReached: "上限に達しました",
      limitReachedDesc: "より多くの友達を紹介するにはプランをアップグレード",
      creditRule: "友達のプラン価値を獲得",
      creditRuleDesc: "友達が購読するプランの価値を獲得",
      autoApplied: "自動適用",
      autoAppliedDesc: "クレジットが次回請求を自動的に減額",
      yourLink: "あなたの紹介リンク",
      copyLink: "リンクをコピー",
      shareLink: "リンクを共有",
      linkCopied: "コピーしました！",
      friendsReferred: "購読した友達",
      availableCredit: "利用可能なクレジット",
      appliedToNextInvoice: "次回請求に自動適用",
      recentReferrals: "最近の紹介",
      pending: "支払い待ち",
      converted: "完了",
      cancelled: "キャンセル",
      noReferralsYet: "まだ紹介がありません。リンクを共有して始めましょう！",
      example: "例：あなたはLite。友達がProtect（฿390）に参加し3ヶ月完了 → あなたは฿390獲得。",
      earnedCredit: "獲得",
      status: "ステータス"
    },
    ko: {
      title: "친구 추천으로 무료 월 받기",
      subtitle: "링크를 공유하세요. 친구가 3개월 연속 유료 구독을 완료하면 다음 청구서의 크레딧을 받습니다.",
      unlimitedReferrals: "무제한 추천",
      unlimitedDesc: "초대 제한 없음",
      referralLimit: "추천 한도",
      referralsUsed: "사용됨",
      upgradeForMore: "업그레이드하여 더 많이",
      limitReached: "한도 도달",
      limitReachedDesc: "더 많은 친구를 추천하려면 플랜 업그레이드",
      creditRule: "친구 플랜 가치 획득",
      creditRuleDesc: "친구가 구독하는 플랜 가치 획득",
      autoApplied: "자동 적용",
      autoAppliedDesc: "크레딧이 다음 청구를 자동 감소",
      yourLink: "귀하의 추천 링크",
      copyLink: "링크 복사",
      shareLink: "링크 공유",
      linkCopied: "복사됨!",
      friendsReferred: "구독한 친구",
      availableCredit: "사용 가능한 크레딧",
      appliedToNextInvoice: "다음 청구서에 자동 적용",
      recentReferrals: "최근 추천",
      pending: "결제 대기",
      converted: "전환됨",
      cancelled: "취소됨",
      noReferralsYet: "아직 추천이 없습니다. 링크를 공유하여 시작하세요!",
      example: "예: 귀하는 Lite. 친구가 Protect（฿390）가입 후 3개월 완료 → 귀하는 ฿390 획득.",
      earnedCredit: "획득",
      status: "상태"
    },
    ru: {
      title: "Пригласите друзей. Заработайте бесплатные месяцы.",
      subtitle: "Поделитесь ссылкой. Когда друзья завершат 3 месяца подряд платной подписки, вы получите кредит на следующий счёт.",
      unlimitedReferrals: "Неограниченные приглашения",
      unlimitedDesc: "Без лимита",
      referralLimit: "Лимит приглашений",
      referralsUsed: "использовано",
      upgradeForMore: "Обновите для большего",
      limitReached: "Лимит достигнут",
      limitReachedDesc: "Обновите план, чтобы приглашать больше друзей",
      creditRule: "Получаете стоимость плана друга",
      creditRuleDesc: "Вы получаете стоимость того плана, который выбирает друг",
      autoApplied: "Автоприменение",
      autoAppliedDesc: "Кредит автоматически уменьшает следующий счёт",
      yourLink: "Ваша реферальная ссылка",
      copyLink: "Скопировать ссылку",
      shareLink: "Поделиться ссылкой",
      linkCopied: "Скопировано!",
      friendsReferred: "Подписались друзей",
      availableCredit: "Доступный кредит",
      appliedToNextInvoice: "Автоматически применяется к следующим счетам",
      recentReferrals: "Последние приглашения",
      pending: "Ожидание",
      converted: "Конвертировано",
      cancelled: "Отменено",
      noReferralsYet: "Пока нет приглашений. Поделитесь ссылкой, чтобы начать!",
      example: "Пример: Вы на Lite. Друг на Protect (฿390) и завершает 3 месяца → Вы получаете ฿390.",
      earnedCredit: "Получено",
      status: "Статус"
    }
  };

  const strings = t[language] || t.en;

  const referralLink = user?.referral_code 
    ? `https://app.leaseshield.asia/welcome?ref=${user.referral_code}`
    : '';

  const handleCopy = async () => {
    haptic.light();
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedItem('link');
      haptic.success();
      toast.success(strings.linkCopied);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      haptic.error();
    }
  };

  const handleShare = async () => {
    haptic.light();
    const title = language === 'th' 
      ? 'Lease Shield - ป้องกันเงินมัดจำค่าเช่า'
      : 'Lease Shield - Protect Your Rental Deposit';
    const text = language === 'th'
      ? 'มาป้องกันเงินมัดจำด้วย Lease Shield กัน!'
      : language === 'zh'
        ? '加入我在Lease Shield保护您的租赁押金！'
        : language === 'ja'
          ? 'Lease Shieldで一緒に敷金を守りましょう！'
          : language === 'ko'
            ? 'Lease Shield에서 보증금을 보호하세요！'
            : language === 'ru'
              ? 'Присоединяйтесь ко мне в Lease Shield для защиты депозита！'
              : 'Join me on Lease Shield to protect your rental deposit!';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: referralLink
        });
        toast.success(language === 'th' ? 'แชร์แล้ว!' : 'Shared!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          await handleCopy();
        }
      }
    } else {
      await handleCopy();
    }
  };

  const convertedReferrals = referrals.filter(r => r.status === 'converted');
  const totalCredit = user?.referral_credits_thb || 0;
  const totalEarned = user?.referral_credits_total_thb || 0;
  const referralCount = user?.referral_count || 0;

  // Account age check
  const accountCreatedAt = user?.created_date ? new Date(user.created_date) : new Date();
  const accountAgeMs = Date.now() - accountCreatedAt.getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
  const MINIMUM_AGE_DAYS = 7;
  const accountTooNew = accountAgeDays < MINIMUM_AGE_DAYS && !user?.referral_code;
  const daysUntilEligible = Math.ceil(MINIMUM_AGE_DAYS - accountAgeDays);

  // If account too new and no referral code, show countdown
  if (accountTooNew) {
    return (
      <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
        <CardHeader style={{
          background: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
          borderRadius: '16px 16px 0 0'
        }}>
          <div className="flex items-start gap-3">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-white mb-1">
                {language === 'th' ? '🔒 โปรแกรมแนะนำจะปลดล็อกเร็วๆ นี้' : 
                 language === 'zh' ? '🔒 推荐计划即将解锁' :
                 language === 'ja' ? '🔒 紹介プログラムがまもなく解除されます' :
                 language === 'ko' ? '🔒 추천 프로그램 곧 잠금 해제' :
                 language === 'ru' ? '🔒 Реферальная программа скоро откроется' :
                 '🔒 Referral Program Unlocks Soon'}
              </CardTitle>
              <p className="text-sm text-white/90">
                {language === 'th' ? 'บัญชีของคุณต้องมีอายุ 7 วันเพื่อสร้างรหัสแนะนำ' :
                 language === 'zh' ? '您的账户必须达到7天才能生成推荐代码' :
                 language === 'ja' ? 'アカウントが7日経過すると紹介コードを生成できます' :
                 language === 'ko' ? '추천 코드를 생성하려면 계정이 7일 이상 되어야 합니다' :
                 language === 'ru' ? 'Вашему аккаунту должно быть 7 дней для генерации реферального кода' :
                 'Your account must be 7 days old to generate a referral code'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mb-4">
              <p className="text-5xl font-bold mb-2" style={{ color: '#C7A338' }}>
                {daysUntilEligible}
              </p>
              <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {language === 'th' ? `${daysUntilEligible} วันที่เหลือ` :
                 language === 'zh' ? `还剩${daysUntilEligible}天` :
                 language === 'ja' ? `あと${daysUntilEligible}日` :
                 language === 'ko' ? `${daysUntilEligible}일 남음` :
                 language === 'ru' ? `Осталось ${daysUntilEligible} дн.` :
                 `${daysUntilEligible} day${daysUntilEligible !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
            <div className="mb-6">
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: colors.fieldBg,
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(accountAgeDays / MINIMUM_AGE_DAYS) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0C3B2E 0%, #10B981 100%)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                {language === 'th' ? `วันที่ ${Math.floor(accountAgeDays)} จาก 7` :
                 language === 'zh' ? `第${Math.floor(accountAgeDays)}天，共7天` :
                 language === 'ja' ? `${Math.floor(accountAgeDays)}日目 / 7日` :
                 language === 'ko' ? `${Math.floor(accountAgeDays)}일 / 7일` :
                 language === 'ru' ? `День ${Math.floor(accountAgeDays)} из 7` :
                 `Day ${Math.floor(accountAgeDays)} of 7`}
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{
              backgroundColor: colors.fieldBg,
              border: `1px solid ${colors.borderColor}`
            }}>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {language === 'th' ? '💡 สิ่งนี้ช่วยป้องกันการฉ้อโกงและทำให้มั่นใจว่าผู้ใช้ที่แท้จริงเข้าร่วมโปรแกรมแนะนำของเรา' :
                 language === 'zh' ? '💡 这有助于防止欺诈并确保真实用户参与我们的推荐计划' :
                 language === 'ja' ? '💡 これは不正を防ぎ、本物のユーザーが紹介プログラムに参加することを保証します' :
                 language === 'ko' ? '💡 이는 사기를 방지하고 진정한 사용자가 추천 프로그램에 참여하도록 보장합니다' :
                 language === 'ru' ? '💡 Это помогает предотвратить мошенничество и гарантирует участие настоящих пользователей' :
                 '💡 This helps prevent fraud and ensures genuine users participate in our referral program.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{
        background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
        borderRadius: '16px 16px 0 0'
      }}>
        <div className="flex items-start gap-3">
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #CFAF6A 0%, #D9BC7E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white mb-1">
              {strings.title}
            </CardTitle>
            <p className="text-sm text-white/90">
              {strings.subtitle}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Feature badges */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-3 rounded-lg text-center" style={{
            backgroundColor: colors.fieldBg,
            border: `1px solid ${colors.borderColor}`
          }}>
            {isUnlimited ? (
              <>
                <Gift className="w-5 h-5 mx-auto mb-1" style={{ color: '#10B981' }} />
                <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>
                  {strings.unlimitedReferrals}
                </p>
                <p className="text-[10px]" style={{ color: colors.textSecondary }}>
                  {strings.unlimitedDesc}
                </p>
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mx-auto mb-1" style={{ color: limitReached ? '#EF4444' : '#10B981' }} />
                <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>
                  {currentReferralCount} / {tierLimit}
                </p>
                <p className="text-[10px]" style={{ color: colors.textSecondary }}>
                  {strings.referralsUsed}
                </p>
              </>
            )}
          </div>
          <div className="p-3 rounded-lg text-center" style={{
            backgroundColor: colors.fieldBg,
            border: `1px solid ${colors.borderColor}`
          }}>
            <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: '#C7A338' }} />
            <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>
              {strings.creditRule}
            </p>
            <p className="text-[10px]" style={{ color: colors.textSecondary }}>
              {strings.creditRuleDesc}
            </p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{
            backgroundColor: colors.fieldBg,
            border: `1px solid ${colors.borderColor}`
          }}>
            <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: '#3B82F6' }} />
            <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>
              {strings.autoApplied}
            </p>
            <p className="text-[10px]" style={{ color: colors.textSecondary }}>
              {strings.autoAppliedDesc}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl text-center" style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '2px solid #86EFAC'
          }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#047857' }}>
              {strings.friendsReferred}
            </p>
            <p className="text-3xl font-bold" style={{ color: '#0C3B2E' }}>
              {referralCount}
            </p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '2px solid #FCD34D'
          }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>
              {strings.availableCredit}
            </p>
            <p className="text-3xl font-bold" style={{ color: '#C7A338' }}>
              ฿{totalCredit}
            </p>
          </div>
        </div>

        {totalCredit > 0 && (
          <div className="mb-6 p-3 rounded-lg" style={{
            backgroundColor: colors.fieldBg,
            borderLeft: '4px solid #10B981'
          }}>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              💡 {strings.appliedToNextInvoice}
            </p>
          </div>
        )}

        {/* Limit warning banner */}
        {limitReached && (
          <div className="mb-6 p-4 rounded-xl border-2" style={{
            backgroundColor: colors.fieldBg,
            borderColor: '#EF4444'
          }}>
            <div className="flex items-start gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold mb-1" style={{ color: '#EF4444' }}>
                  {strings.limitReached}
                </p>
                <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                  {strings.limitReachedDesc}
                </p>
                <a
                  href="#plan-selector"
                  onClick={(e) => {
                    e.preventDefault();
                    haptic.medium();
                    document.getElementById('plan-selector')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-bold underline"
                  style={{ color: '#0C3B2E' }}
                >
                  {strings.upgradeForMore} →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Referral link */}
        <div className="mb-6">
          <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
            {strings.yourLink}
          </p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg text-sm font-mono truncate" style={{
              backgroundColor: colors.fieldBg,
              border: `1px solid ${colors.borderColor}`,
              color: limitReached ? colors.textSecondary : colors.textPrimary,
              opacity: limitReached ? 0.6 : 1
            }}>
              {referralLink}
            </div>
            <button
              onClick={limitReached ? null : handleCopy}
              disabled={limitReached}
              className="btn-interaction"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: limitReached ? '#9CA3AF' : (copiedItem === 'link' ? '#10B981' : '#0C3B2E'),
                color: '#FFFFFF',
                border: 'none',
                cursor: limitReached ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                opacity: limitReached ? 0.5 : 1
              }}
              title={limitReached ? strings.limitReachedDesc : ''}
            >
              {copiedItem === 'link' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{copiedItem === 'link' ? strings.linkCopied : strings.copyLink}</span>
            </button>
            <button
              onClick={limitReached ? null : handleShare}
              disabled={limitReached}
              className="btn-interaction"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: limitReached ? '#9CA3AF' : '#C7A338',
                color: '#FFFFFF',
                border: 'none',
                cursor: limitReached ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                opacity: limitReached ? 0.5 : 1
              }}
              title={limitReached ? strings.limitReachedDesc : ''}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{strings.shareLink}</span>
            </button>
          </div>
        </div>

        {/* Example */}
        <div className="p-3 rounded-lg mb-6" style={{
          backgroundColor: colors.fieldBg,
          borderLeft: '4px solid #C7A338'
        }}>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            💡 {strings.example}
          </p>
        </div>

        {/* Recent referrals */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: colors.textPrimary }}>
            {strings.recentReferrals}
          </p>
          {convertedReferrals.length === 0 ? (
            <div className="text-center py-8" style={{
              backgroundColor: colors.fieldBg,
              borderRadius: '12px',
              border: `1px dashed ${colors.borderColor}`
            }}>
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {strings.noReferralsYet}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {convertedReferrals.slice(0, 5).map((ref) => (
                <div
                  key={ref.id}
                  className="p-3 rounded-lg flex items-center justify-between"
                  style={{
                    backgroundColor: colors.fieldBg,
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                      {ref.referred_email?.split('@')[0]}***
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {ref.referred_plan} • {new Date(ref.converted_at || ref.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge style={{
                      backgroundColor: ref.status === 'converted' ? '#10B981' : ref.status === 'pending_first_payment' ? '#F59E0B' : '#6B7280',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      padding: '4px 8px'
                    }}>
                      {ref.status === 'converted' ? strings.converted : ref.status === 'pending_first_payment' ? strings.pending : strings.cancelled}
                    </Badge>
                    {ref.credit_thb > 0 && (
                      <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                        +฿{ref.credit_thb}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}