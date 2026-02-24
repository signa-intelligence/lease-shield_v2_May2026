import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, CheckCircle2, AlertCircle, Shield, Gift, TrendingUp } from 'lucide-react';
import { haptic } from '../shared/HapticFeedback';

export default function ReferralTermsModal({ isOpen, onClose, colors, language = 'en' }) {
  const t = {
    en: {
      title: "Referral Program Terms & Conditions",
      howItWorks: "How It Works",
      howItWorksText: "Share your unique referral link with friends. When they sign up using your link and complete 3 consecutive months of paid subscription, you earn a credit equal to their plan value.",
      earningRewards: "Earning Rewards",
      earningRewardsText: "You earn credits based on your friend's subscription plan:\n• If they subscribe to Lite (฿190/month) → you earn ฿190\n• If they subscribe to Protect (฿390/month) → you earn ฿390\n• If they subscribe to Secure (฿990/month) → you earn ฿990\n\nCredits are automatically applied to your next invoice(s).",
      referralLimits: "Referral Limits by Tier",
      referralLimitsText: "• Explorer/Free: 3 active referrals maximum\n• Lite: 10 active referrals maximum\n• Protect: 25 active referrals maximum\n• Secure: Unlimited active referrals\n\nActive referrals = friends who are currently subscribed or pending verification.",
      eligibility: "Eligibility Requirements",
      eligibilityText: "To qualify for referral rewards:\n• Your account must be at least 7 days old\n• Your friend must be a new user (not an existing LeaseShield member)\n• Your friend must use your referral link during signup\n• Your friend must complete 3 consecutive months of paid subscription\n• All payments must be successful (no refunds or chargebacks)",
      creditReversals: "Credit Reversals",
      creditReversalsText: "Earned credits will be reversed if:\n• Your friend requests a refund within the first 3 months\n• A chargeback is issued by your friend\n• Fraudulent activity is detected\n• Your friend's subscription is cancelled before completing 3 months",
      fairUse: "Fair Use Policy",
      fairUseText: "All referrals are subject to automated fraud detection. We reserve the right to:\n• Flag suspicious referrals for manual review\n• Block referral credits if fraud patterns are detected\n• Terminate accounts engaged in referral abuse\n\nCommon fraud patterns include: same IP addresses, disposable email domains, bulk signups, coordinated cancellations.",
      programTerms: "Program Terms",
      programTermsText: "• LeaseShield reserves the right to modify or terminate the referral program at any time\n• Credits are non-transferable and have no cash value\n• Credits can only be applied to LeaseShield subscription invoices\n• Maximum credit per invoice: 100% of invoice amount\n• Excess credits roll over to subsequent invoices\n• Credits do not expire as long as your account remains active",
      gotIt: "Got It",
      close: "Close"
    },
    th: {
      title: "ข้อกำหนดและเงื่อนไขโปรแกรมแนะนำ",
      howItWorks: "วิธีการทำงาน",
      howItWorksText: "แชร์ลิงก์แนะนำของคุณกับเพื่อน เมื่อพวกเขาสมัครผ่านลิงก์ของคุณและชำระเงิน 3 เดือนติดต่อกัน คุณจะได้รับเครดิตเท่ากับมูลค่าแผนของพวกเขา",
      earningRewards: "การรับรางวัล",
      earningRewardsText: "คุณได้รับเครดิตตามแผนสมาชิกของเพื่อน:\n• ถ้าเพื่อนสมัคร Lite (฿190/เดือน) → คุณได้ ฿190\n• ถ้าเพื่อนสมัคร Protect (฿390/เดือน) → คุณได้ ฿390\n• ถ้าเพื่อนสมัคร Secure (฿990/เดือน) → คุณได้ ฿990\n\nเครดิตจะถูกใช้อัตโนมัติกับใบแจ้งหนี้ถัดไป",
      referralLimits: "ขีดจำกัดการแนะนำตามระดับ",
      referralLimitsText: "• Explorer/Free: สูงสุด 3 การแนะนำ\n• Lite: สูงสุด 10 การแนะนำ\n• Protect: สูงสุด 25 การแนะนำ\n• Secure: ไม่จำกัดการแนะนำ\n\nการแนะนำที่ใช้งานอยู่ = เพื่อนที่กำลังสมัครอยู่หรือรอการตรวจสอบ",
      eligibility: "ข้อกำหนดคุณสมบัติ",
      eligibilityText: "เพื่อมีสิทธิ์ได้รับรางวัลการแนะนำ:\n• บัญชีของคุณต้องมีอายุอย่างน้อย 7 วัน\n• เพื่อนของคุณต้องเป็นผู้ใช้ใหม่ (ไม่ใช่สมาชิก LeaseShield เดิม)\n• เพื่อนของคุณต้องใช้ลิงก์แนะนำของคุณขณะสมัคร\n• เพื่อนของคุณต้องชำระเงินครบ 3 เดือนติดต่อกัน\n• การชำระเงินทั้งหมดต้องสำเร็จ (ไม่มีการคืนเงินหรือการเรียกเงินคืน)",
      creditReversals: "การกลับรายการเครดิต",
      creditReversalsText: "เครดิตที่ได้รับจะถูกกลับรายการหาก:\n• เพื่อนของคุณขอคืนเงินภายใน 3 เดือนแรก\n• มีการเรียกเงินคืนจากเพื่อนของคุณ\n• ตรวจพบกิจกรรมฉ้อโกง\n• เพื่อนของคุณยกเลิกการสมัครก่อนครบ 3 เดือน",
      fairUse: "นโยบายการใช้งานที่เป็นธรรม",
      fairUseText: "การแนะนำทั้งหมดต้องผ่านการตรวจจับการฉ้อโกงอัตโนมัติ เราขอสงวนสิทธิ์:\n• ทำเครื่องหมายการแนะนำที่น่าสงสัยเพื่อตรวจสอบด้วยตนเอง\n• บล็อกเครดิตการแนะนำหากตรวจพบรูปแบบการฉ้อโกง\n• ยกเลิกบัญชีที่ทำการแนะนำในทางที่ผิด\n\nรูปแบบการฉ้อโกงที่พบบ่อย: ที่อยู่ IP เดียวกัน โดเมนอีเมลชั่วคราว การสมัครจำนวนมาก การยกเลิกที่ประสานกัน",
      programTerms: "ข้อกำหนดโปรแกรม",
      programTermsText: "• LeaseShield ขอสงวนสิทธิ์ในการแก้ไขหรือยกเลิกโปรแกรมแนะนำได้ทุกเมื่อ\n• เครดิตไม่สามารถโอนได้และไม่มีมูลค่าเป็นเงินสด\n• เครดิตสามารถใช้ได้เฉพาะกับใบแจ้งหนี้ LeaseShield เท่านั้น\n• เครดิตสูงสุดต่อใบแจ้งหนี้: 100% ของจำนวนเงินในใบแจ้งหนี้\n• เครดิตส่วนเกินจะโอนไปใบแจ้งหนี้ถัดไป\n• เครดิตไม่หมดอายุตราบเท่าที่บัญชีของคุณยังใช้งานอยู่",
      gotIt: "เข้าใจแล้ว",
      close: "ปิด"
    },
    zh: {
      title: "推荐计划条款与条件",
      howItWorks: "运作方式",
      howItWorksText: "与朋友分享您的唯一推荐链接。当他们使用您的链接注册并完成连续3个月的付费订阅时，您将获得与其计划价值相等的积分。",
      earningRewards: "获得奖励",
      earningRewardsText: "您根据朋友的订阅计划获得积分:\n• 如果他们订阅 Lite (฿190/月) → 您获得 ฿190\n• 如果他们订阅 Protect (฿390/月) → 您获得 ฿390\n• 如果他们订阅 Secure (฿990/月) → 您获得 ฿990\n\n积分会自动应用到您的下次发票。",
      referralLimits: "按层级的推荐限制",
      referralLimitsText: "• Explorer/Free: 最多3个活跃推荐\n• Lite: 最多10个活跃推荐\n• Protect: 最多25个活跃推荐\n• Secure: 无限活跃推荐\n\n活跃推荐 = 当前订阅或待验证的朋友。",
      eligibility: "资格要求",
      eligibilityText: "获得推荐奖励的资格:\n• 您的账户必须至少7天\n• 您的朋友必须是新用户（非现有LeaseShield会员）\n• 您的朋友必须在注册时使用您的推荐链接\n• 您的朋友必须完成3个月连续的付费订阅\n• 所有付款必须成功（无退款或退单）",
      creditReversals: "积分撤销",
      creditReversalsText: "在以下情况下，获得的积分将被撤销:\n• 您的朋友在前3个月内申请退款\n• 您的朋友发起退单\n• 检测到欺诈活动\n• 您的朋友在完成3个月前取消订阅",
      fairUse: "公平使用政策",
      fairUseText: "所有推荐均受自动欺诈检测约束。我们保留以下权利:\n• 标记可疑推荐以进行人工审核\n• 如果检测到欺诈模式，则阻止推荐积分\n• 终止参与推荐滥用的账户\n\n常见欺诈模式包括: 相同IP地址、一次性电子邮件域、批量注册、协调取消。",
      programTerms: "计划条款",
      programTermsText: "• LeaseShield保留随时修改或终止推荐计划的权利\n• 积分不可转让且无现金价值\n• 积分只能应用于LeaseShield订阅发票\n• 每张发票的最大积分: 发票金额的100%\n• 超额积分将结转到后续发票\n• 只要您的账户保持活跃，积分就不会过期",
      gotIt: "明白了",
      close: "关闭"
    },
    ja: {
      title: "紹介プログラム利用規約",
      howItWorks: "仕組み",
      howItWorksText: "あなたの固有の紹介リンクを友達と共有してください。友達があなたのリンクを使用してサインアップし、3ヶ月連続で有料購読を完了すると、友達のプラン価値と同等のクレジットを獲得できます。",
      earningRewards: "報酬の獲得",
      earningRewardsText: "友達の購読プランに基づいてクレジットを獲得:\n• Lite (฿190/月) を購読 → ฿190獲得\n• Protect (฿390/月) を購読 → ฿390獲得\n• Secure (฿990/月) を購読 → ฿990獲得\n\nクレジットは次回の請求に自動適用されます。",
      referralLimits: "ティア別紹介制限",
      referralLimitsText: "• Explorer/Free: 最大3件のアクティブ紹介\n• Lite: 最大10件のアクティブ紹介\n• Protect: 最大25件のアクティブ紹介\n• Secure: アクティブ紹介無制限\n\nアクティブ紹介 = 現在購読中または検証待ちの友達。",
      eligibility: "資格要件",
      eligibilityText: "紹介報酬の資格:\n• アカウントが少なくとも7日間必要\n• 友達は新規ユーザーである必要があります（既存のLeaseShieldメンバーではない）\n• 友達はサインアップ時に紹介リンクを使用する必要があります\n• 友達は3ヶ月連続の有料購読を完了する必要があります\n• すべての支払いが成功する必要があります（返金またはチャージバックなし）",
      creditReversals: "クレジットの取り消し",
      creditReversalsText: "次の場合、獲得したクレジットは取り消されます:\n• 友達が最初の3ヶ月以内に返金を要求\n• 友達がチャージバックを発行\n• 不正行為が検出された\n• 友達が3ヶ月完了前に購読をキャンセル",
      fairUse: "公正な使用ポリシー",
      fairUseText: "すべての紹介は自動不正検出の対象となります。私たちは次の権利を留保します:\n• 疑わしい紹介を手動レビューのためにフラグ付け\n• 不正パターンが検出された場合、紹介クレジットをブロック\n• 紹介の悪用に関与するアカウントを終了\n\n一般的な不正パターン: 同じIPアドレス、使い捨てメールドメイン、一括サインアップ、協調的なキャンセル。",
      programTerms: "プログラム規約",
      programTermsText: "• LeaseShieldはいつでも紹介プログラムを変更または終了する権利を留保します\n• クレジットは譲渡不可で、現金価値はありません\n• クレジットはLeaseShield購読請求にのみ適用できます\n• 請求あたりの最大クレジット: 請求金額の100%\n• 超過クレジットは次の請求に繰り越されます\n• アカウントがアクティブである限り、クレジットは期限切れになりません",
      gotIt: "了解しました",
      close: "閉じる"
    },
    ko: {
      title: "추천 프로그램 약관",
      howItWorks: "작동 방식",
      howItWorksText: "고유한 추천 링크를 친구와 공유하세요. 친구가 귀하의 링크를 사용하여 가입하고 연속 3개월의 유료 구독을 완료하면 친구의 플랜 가치와 동일한 크레딧을 받습니다.",
      earningRewards: "보상 획득",
      earningRewardsText: "친구의 구독 플랜에 따라 크레딧을 받습니다:\n• Lite (฿190/월) 구독 → ฿190 획득\n• Protect (฿390/월) 구독 → ฿390 획득\n• Secure (฿990/월) 구독 → ฿990 획득\n\n크레딧은 다음 청구서에 자동 적용됩니다.",
      referralLimits: "등급별 추천 한도",
      referralLimitsText: "• Explorer/Free: 최대 3개의 활성 추천\n• Lite: 최대 10개의 활성 추천\n• Protect: 최대 25개의 활성 추천\n• Secure: 무제한 활성 추천\n\n활성 추천 = 현재 구독 중이거나 확인 대기 중인 친구.",
      eligibility: "자격 요건",
      eligibilityText: "추천 보상 자격:\n• 계정이 최소 7일 이상이어야 합니다\n• 친구는 신규 사용자여야 합니다（기존 LeaseShield 회원 아님）\n• 친구는 가입 시 추천 링크를 사용해야 합니다\n• 친구는 연속 3개월의 유료 구독을 완료해야 합니다\n• 모든 결제가 성공해야 합니다（환불 또는 지불 거절 없음）",
      creditReversals: "크레딧 취소",
      creditReversalsText: "다음의 경우 획득한 크레딧이 취소됩니다:\n• 친구가 처음 3개월 내에 환불 요청\n• 친구가 지불 거절 발행\n• 사기 활동 감지\n• 친구가 3개월 완료 전에 구독 취소",
      fairUse: "공정 사용 정책",
      fairUseText: "모든 추천은 자동 사기 탐지 대상입니다. 우리는 다음의 권리를 보유합니다:\n• 의심스러운 추천을 수동 검토를 위해 표시\n• 사기 패턴이 감지되면 추천 크레딧 차단\n• 추천 남용에 연루된 계정 종료\n\n일반적인 사기 패턴: 동일한 IP 주소, 일회용 이메일 도메인, 대량 가입, 조정된 취소.",
      programTerms: "프로그램 약관",
      programTermsText: "• LeaseShield는 언제든지 추천 프로그램을 수정하거나 종료할 권리를 보유합니다\n• 크레딧은 양도할 수 없으며 현금 가치가 없습니다\n• 크레딧은 LeaseShield 구독 청구서에만 적용할 수 있습니다\n• 청구서당 최대 크레딧: 청구서 금액의 100%\n• 초과 크레딧은 다음 청구서로 이월됩니다\n• 계정이 활성 상태인 한 크레딧은 만료되지 않습니다",
      gotIt: "알겠습니다",
      close: "닫기"
    },
    ru: {
      title: "Условия реферальной программы",
      howItWorks: "Как это работает",
      howItWorksText: "Поделитесь своей уникальной реферальной ссылкой с друзьями. Когда они зарегистрируются по вашей ссылке и завершат 3 последовательных месяца платной подписки, вы получите кредит, равный стоимости их плана.",
      earningRewards: "Получение наград",
      earningRewardsText: "Вы получаете кредиты в зависимости от плана подписки друга:\n• Если они подпишутся на Lite (฿190/месяц) → вы получите ฿190\n• Если они подпишутся на Protect (฿390/месяц) → вы получите ฿390\n• Если они подпишутся на Secure (฿990/месяц) → вы получите ฿990\n\nКредиты автоматически применяются к вашему следующему счёту.",
      referralLimits: "Лимиты приглашений по уровням",
      referralLimitsText: "• Explorer/Free: максимум 3 активных приглашения\n• Lite: максимум 10 активных приглашений\n• Protect: максимум 25 активных приглашений\n• Secure: неограниченные активные приглашения\n\nАктивные приглашения = друзья, которые в данный момент подписаны или ожидают проверки.",
      eligibility: "Требования к участию",
      eligibilityText: "Чтобы претендовать на реферальные награды:\n• Вашему аккаунту должно быть не менее 7 дней\n• Ваш друг должен быть новым пользователем (не существующим участником LeaseShield)\n• Ваш друг должен использовать вашу реферальную ссылку при регистрации\n• Ваш друг должен завершить 3 последовательных месяца платной подписки\n• Все платежи должны быть успешными (без возвратов или чарджбэков)",
      creditReversals: "Отмена кредитов",
      creditReversalsText: "Полученные кредиты будут отменены, если:\n• Ваш друг запросит возврат средств в течение первых 3 месяцев\n• Ваш друг инициирует чарджбэк\n• Обнаружена мошенническая активность\n• Подписка вашего друга отменена до завершения 3 месяцев",
      fairUse: "Политика справедливого использования",
      fairUseText: "Все приглашения подлежат автоматическому обнаружению мошенничества. Мы оставляем за собой право:\n• Помечать подозрительные приглашения для ручной проверки\n• Блокировать реферальные кредиты при обнаружении мошеннических паттернов\n• Прекращать работу аккаунтов, участвующих в злоупотреблении приглашениями\n\nОбщие мошеннические паттерны: одинаковые IP-адреса, одноразовые почтовые домены, массовые регистрации, скоординированные отмены.",
      programTerms: "Условия программы",
      programTermsText: "• LeaseShield оставляет за собой право изменить или прекратить реферальную программу в любое время\n• Кредиты непередаваемы и не имеют денежной стоимости\n• Кредиты могут применяться только к счетам за подписку LeaseShield\n• Максимальный кредит на счёт: 100% суммы счёта\n• Избыточные кредиты переносятся на последующие счета\n• Кредиты не истекают, пока ваш аккаунт остаётся активным",
      gotIt: "Понятно",
      close: "Закрыть"
    }
  };

  const strings = t[language] || t.en;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}
      >
        <DialogHeader className="border-b pb-4" style={{ borderBottomColor: colors.borderColor }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold pr-8" style={{ color: colors.textPrimary }}>
                {strings.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6 pb-2">
          {/* How It Works */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0C3B2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Gift className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#0C3B2E' }}>
                {strings.howItWorks}
              </h3>
            </div>
            <p className="text-sm leading-relaxed pl-10" style={{ color: colors.textPrimary }}>
              {strings.howItWorksText}
            </p>
          </div>

          {/* Earning Rewards */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#C7A338',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#C7A338' }}>
                {strings.earningRewards}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.earningRewardsText}
              </p>
            </div>
          </div>

          {/* Referral Limits */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#3B82F6' }}>
                {strings.referralLimits}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.referralLimitsText}
              </p>
            </div>
          </div>

          {/* Eligibility */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#10B981' }}>
                {strings.eligibility}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.eligibilityText}
              </p>
            </div>
          </div>

          {/* Credit Reversals */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#EF4444' }}>
                {strings.creditReversals}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.creditReversalsText}
              </p>
            </div>
          </div>

          {/* Fair Use */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#F59E0B' }}>
                {strings.fairUse}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.fairUseText}
              </p>
            </div>
          </div>

          {/* Program Terms */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base" style={{ color: '#6B7280' }}>
                {strings.programTerms}
              </h3>
            </div>
            <div className="pl-10">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary }}>
                {strings.programTermsText}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t" style={{ borderTopColor: colors.borderColor }}>
          <button
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="w-full btn-interaction"
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#C7A338';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#0C3B2E';
            }}
          >
            {strings.gotIt}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}