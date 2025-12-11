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
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user?.email }, '-created_date', 10),
    enabled: !!user,
  });

  const t = {
    en: {
      title: "Refer Friends. Earn Free Months.",
      subtitle: "Share your link. When friends complete 3 months of paid subscription, you earn credit toward your next invoice.",
      unlimitedReferrals: "Unlimited Referrals",
      unlimitedDesc: "No cap on invites",
      creditRule: "Earn Friend's Plan Value",
      creditRuleDesc: "You earn what your friend subscribes to",
      autoApplied: "Auto-Applied",
      autoAppliedDesc: "Credit reduces next billing automatically",
      yourLink: "Your Referral Link",
      yourCode: "Your Code",
      copyLink: "Copy Link",
      copyCode: "Copy Code",
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
      creditRule: "ได้รับมูลค่าแผนของเพื่อน",
      creditRuleDesc: "คุณได้รับตามแผนที่เพื่อนสมัคร",
      autoApplied: "ใช้อัตโนมัติ",
      autoAppliedDesc: "เครดิตหักยอดรอบถัดไปโดยอัตโนมัติ",
      yourLink: "ลิงก์แนะนำของคุณ",
      yourCode: "โค้ดของคุณ",
      copyLink: "คัดลอกลิงก์",
      copyCode: "คัดลอกโค้ด",
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
      creditRule: "获得好友计划价值",
      creditRuleDesc: "您获得好友订阅的计划价值",
      autoApplied: "自动应用",
      autoAppliedDesc: "额度自动抵扣下次账单",
      yourLink: "您的推荐链接",
      yourCode: "您的代码",
      copyLink: "复制链接",
      copyCode: "复制代码",
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
      creditRule: "友達のプラン価値を獲得",
      creditRuleDesc: "友達が購読するプランの価値を獲得",
      autoApplied: "自動適用",
      autoAppliedDesc: "クレジットが次回請求を自動的に減額",
      yourLink: "あなたの紹介リンク",
      yourCode: "あなたのコード",
      copyLink: "リンクをコピー",
      copyCode: "コードをコピー",
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
      creditRule: "친구 플랜 가치 획득",
      creditRuleDesc: "친구가 구독하는 플랜 가치 획득",
      autoApplied: "자동 적용",
      autoAppliedDesc: "크레딧이 다음 청구를 자동 감소",
      yourLink: "귀하의 추천 링크",
      yourCode: "귀하의 코드",
      copyLink: "링크 복사",
      copyCode: "코드 복사",
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
      creditRule: "Получаете стоимость плана друга",
      creditRuleDesc: "Вы получаете стоимость того плана, который выбирает друг",
      autoApplied: "Автоприменение",
      autoAppliedDesc: "Кредит автоматически уменьшает следующий счёт",
      yourLink: "Ваша реферальная ссылка",
      yourCode: "Ваш код",
      copyLink: "Скопировать ссылку",
      copyCode: "Скопировать код",
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

  const handleCopy = async (type) => {
    haptic.light();
    const textToCopy = type === 'link' ? referralLink : user?.referral_code;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedItem(type);
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
      ? `มาป้องกันเงินมัดจำด้วย Lease Shield กัน! ใช้โค้ดของฉัน: ${user?.referral_code}`
      : language === 'zh'
        ? `加入我在Lease Shield保护您的租赁押金！使用我的代码：${user?.referral_code}`
        : language === 'ja'
          ? `Lease Shieldで一緒に敷金を守りましょう！私のコードを使用：${user?.referral_code}`
          : language === 'ko'
            ? `Lease Shield에서 보증금을 보호하세요！내 코드 사용：${user?.referral_code}`
            : language === 'ru'
              ? `Присоединяйтесь ко мне в Lease Shield для защиты депозита！Используйте мой код：${user?.referral_code}`
              : `Join me on Lease Shield to protect your rental deposit! Use my code: ${user?.referral_code}`;

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
          await handleCopy('link');
        }
      }
    } else {
      await handleCopy('link');
    }
  };

  const convertedReferrals = referrals.filter(r => r.status === 'converted');
  const totalCredit = user?.referral_credits_thb || 0;
  const totalEarned = user?.referral_credits_total_thb || 0;
  const referralCount = user?.referral_count || 0;

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
            <Gift className="w-5 h-5 mx-auto mb-1" style={{ color: '#10B981' }} />
            <p className="text-xs font-bold mb-0.5" style={{ color: colors.textPrimary }}>
              {strings.unlimitedReferrals}
            </p>
            <p className="text-[10px]" style={{ color: colors.textSecondary }}>
              {strings.unlimitedDesc}
            </p>
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

        {/* Referral link/code */}
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
              {strings.yourLink}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg text-sm font-mono truncate" style={{
                backgroundColor: colors.fieldBg,
                border: `1px solid ${colors.borderColor}`,
                color: colors.textPrimary
              }}>
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy('link')}
                className="btn-interaction"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: copiedItem === 'link' ? '#10B981' : '#0C3B2E',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedItem === 'link' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copiedItem === 'link' ? strings.linkCopied : strings.copyLink}</span>
              </button>
              <button
                onClick={handleShare}
                className="btn-interaction"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#C7A338',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{strings.shareLink}</span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
              {strings.yourCode}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-lg text-center text-2xl font-bold tracking-widest" style={{
                backgroundColor: colors.fieldBg,
                border: `2px solid ${colors.borderColor}`,
                color: '#C7A338'
              }}>
                {user?.referral_code || '------'}
              </div>
              <button
                onClick={() => handleCopy('code')}
                className="btn-interaction"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: copiedItem === 'code' ? '#10B981' : colors.cardBg,
                  color: copiedItem === 'code' ? '#FFFFFF' : colors.textPrimary,
                  border: `2px solid ${copiedItem === 'code' ? '#10B981' : colors.borderColor}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copiedItem === 'code' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copiedItem === 'code' ? strings.linkCopied : strings.copyCode}</span>
              </button>
            </div>
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