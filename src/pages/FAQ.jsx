import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, Shield, DollarSign, FileText, Scale, Lock, HelpCircle } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AuthGuard from "../components/shared/AuthGuard";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const FAQ_DATA = {
  pricing: {
    icon: DollarSign,
    color: '#C7A338',
    titleEn: 'Pricing & Plans',
    titleTh: 'ราคาและแผน',
    titleZh: '定价与计划',
    titleJa: '価格とプラン',
    titleKo: '가격 및 플랜',
    titleRu: 'Цены и планы',
    questions: [
      {
        questionEn: 'What subscription plans do you offer?',
        questionTh: 'มีแผนสมัครสมาชิกอะไรบ้าง?',
        questionZh: '你们提供哪些订阅计划？',
        questionJa: 'どのようなサブスクリプションプランがありますか？',
        questionKo: '어떤 구독 플랜을 제공하나요?',
        questionRu: 'Какие подписки вы предлагаете?',
        answerEn: 'We offer three subscription tiers:\n\n• Lite: ฿190/month or ฿1,900/year (save 17%) - 6 lease scans/year, email notifications, deposit tracking\n\n• Protect: ฿390/month or ฿3,900/year (save 17%) - 12 lease scans/year, LINE notifications, rent alerts, 5 letter credits\n\n• Secure: ฿990/month or ฿9,900/year (save 17%) - Unlimited scans, priority support, 10 letter credits, priority case queue',
        answerTh: 'เรามีแผนสมัครสมาชิก 3 แบบ:\n\n• Lite: ฿190/เดือน หรือ ฿1,900/ปี (ประหยัด 17%) - สแกน 6 ครั้ง/ปี, แจ้งเตือนอีเมล, ติดตามเงินมัดจำ\n\n• Protect: ฿390/เดือน หรือ ฿3,900/ปี (ประหยัด 17%) - สแกน 12 ครั้ง/ปี, แจ้งเตือน LINE, แจ้งเตือนค่าเช่า, 5 เครดิตจดหมาย\n\n• Secure: ฿990/เดือน หรือ ฿9,900/ปี (ประหยัด 17%) - สแกนไม่จำกัด, สนับสนุนลำดับความสำคัญ, 10 เครดิตจดหมาย, คิวคดีลำดับความสำคัญ',
        answerZh: '我们提供三个订阅等级：\n\n• Lite：฿190/月 或 ฿1,900/年（节省17%）- 每年6次扫描，电子邮件通知，押金追踪\n\n• Protect：฿390/月 或 ฿3,900/年（节省17%）- 每年12次扫描，LINE通知，租金提醒，5个信件积分\n\n• Secure：฿990/月 或 ฿9,900/年（节省17%）- 无限次扫描，优先支持，10个信件积分，优先案件队列',
        answerJa: '3つのサブスクリプションプランがあります：\n\n• Lite：฿190/月 または ฿1,900/年（17%節約）- 年6回スキャン、メール通知、敷金追跡\n\n• Protect：฿390/月 または ฿3,900/年（17%節約）- 年12回スキャン、LINE通知、家賃アラート、5レタークレジット\n\n• Secure：฿990/月 または ฿9,900/年（17%節約）- 無制限スキャン、優先サポート、10レタークレジット、優先ケースキュー',
        answerKo: '세 가지 구독 등급을 제공합니다：\n\n• Lite：฿190/월 또는 ฿1,900/년（17% 절약）- 연간 6회 스캔，이메일 알림，보증금 추적\n\n• Protect：฿390/월 또는 ฿3,900/년（17% 절약）- 연간 12회 스캔，LINE 알림，임대료 알림，5개 레터 크레딧\n\n• Secure：฿990/월 또는 ฿9,900/년（17% 절약）- 무제한 스캔，우선 지원，10개 레터 크레딧，우선 사례 대기열',
        answerRu: 'Мы предлагаем три уровня подписки：\n\n• Lite：฿190/месяц или ฿1,900/год（экономия 17%）- 6 сканирований/год，уведомления по email，отслеживание депозита\n\n• Protect：฿390/месяц или ฿3,900/год（экономия 17%）- 12 сканирований/год，уведомления LINE，напоминания об аренде，5 кредитов писем\n\n• Secure：฿990/месяц или ฿9,900/год（экономия 17%）- Неограниченные сканирования，приоритетная поддержка，10 кредитов писем，приоритетная очередь дел'
      },
      {
        questionEn: 'Can I buy a one-time lease scan without a subscription?',
        questionTh: 'ฉันสามารถซื้อการสแกนสัญญาแบบครั้งเดียวโดยไม่ต้องสมัครสมาชิกได้ไหม?',
        questionZh: '我可以在不订阅的情况下购买一次性租约扫描吗？',
        questionJa: 'サブスクリプションなしで1回限りのリーススキャンを購入できますか？',
        questionKo: '구독 없이 일회성 임대 계약 스캔을 구매할 수 있나요?',
        questionRu: 'Могу ли я купить одноразовое сканирование договора без подписки?',
        answerEn: 'Yes! You can purchase a one-time lease scan for ฿590. This includes AI-powered risk analysis, key date extraction, and a detailed report - no subscription required.',
        answerTh: 'ได้! คุณสามารถซื้อการสแกนสัญญาแบบครั้งเดียวในราคา ฿590 ซึ่งรวมการวิเคราะห์ความเสี่ยงด้วย AI การดึงวันที่สำคัญ และรายงานโดยละเอียด - ไม่ต้องสมัครสมาชิก',
        answerZh: '是的！您可以以฿590购买一次性租约扫描。这包括AI驱动的风险分析、关键日期提取和详细报告 - 无需订阅。',
        answerJa: 'はい！฿590で1回限りのリーススキャンを購入できます。これにはAI駆動のリスク分析、主要日付の抽出、詳細レポートが含まれます - サブスクリプション不要。',
        answerKo: '네! ฿590에 일회성 임대 계약 스캔을 구매할 수 있습니다. 여기에는 AI 기반 위험 분석, 주요 날짜 추출 및 상세 보고서가 포함됩니다 - 구독 불필요.',
        answerRu: 'Да! Вы можете купить одноразовое сканирование договора за ฿590. Это включает анализ рисков с помощью ИИ, извлечение ключевых дат и подробный отчет - подписка не требуется.'
      },
      {
        questionEn: 'How much can I save with annual billing?',
        questionTh: 'ฉันจะประหยัดได้เท่าไหร่ถ้าจ่ายรายปี?',
        questionZh: '年度计费可以节省多少？',
        questionJa: '年間請求でいくら節約できますか？',
        questionKo: '연간 결제로 얼마나 절약할 수 있나요?',
        questionRu: 'Сколько я могу сэкономить при годовой оплате?',
        answerEn: 'Annual billing saves you 17% on all plans:\n\n• Lite: Save ฿380/year (฿1,900 vs ฿2,280)\n• Protect: Save ฿780/year (฿3,900 vs ฿4,680)\n• Secure: Save ฿1,980/year (฿9,900 vs ฿11,880)\n\nYou get 12 months of protection for the price of 10 months!',
        answerTh: 'การจ่ายรายปีช่วยประหยัด 17% สำหรับทุกแผน:\n\n• Lite: ประหยัด ฿380/ปี (฿1,900 vs ฿2,280)\n• Protect: ประหยัด ฿780/ปี (฿3,900 vs ฿4,680)\n• Secure: ประหยัด ฿1,980/ปี (฿9,900 vs ฿11,880)\n\nคุณจะได้รับการป้องกัน 12 เดือนในราคา 10 เดือน!',
        answerZh: '年度计费在所有计划上节省17%：\n\n• Lite：节省฿380/年（฿1,900 vs ฿2,280）\n• Protect：节省฿780/年（฿3,900 vs ฿4,680）\n• Secure：节省฿1,980/年（฿9,900 vs ฿11,880）\n\n您以10个月的价格获得12个月的保护！',
        answerJa: '年間請求で全プラン17%節約：\n\n• Lite：฿380/年節約（฿1,900 vs ฿2,280）\n• Protect：฿780/年節約（฿3,900 vs ฿4,680）\n• Secure：฿1,980/年節約（฿9,900 vs ฿11,880）\n\n10ヶ月分の価格で12ヶ月の保護が得られます！',
        answerKo: '연간 결제로 모든 플랜에서 17% 절약：\n\n• Lite：฿380/년 절약（฿1,900 vs ฿2,280）\n• Protect：฿780/년 절약（฿3,900 vs ฿4,680）\n• Secure：฿1,980/년 절약（฿9,900 vs ฿11,880）\n\n10개월 가격으로 12개월 보호를 받으세요！',
        answerRu: 'Годовая оплата экономит 17% на всех планах：\n\n• Lite：экономия ฿380/год（฿1,900 vs ฿2,280）\n• Protect：экономия ฿780/год（฿3,900 vs ฿4,680）\n• Secure：экономия ฿1,980/год（฿9,900 vs ฿11,880）\n\nВы получаете 12 месяцев защиты по цене 10 месяцев！'
      }
    ]
  },
  features: {
    icon: Shield,
    color: '#0C3B2E',
    titleEn: 'Features & Protection',
    titleTh: 'ฟีเจอร์และการป้องกัน',
    titleZh: '功能与保护',
    titleJa: '機能と保護',
    titleKo: '기능 및 보호',
    titleRu: 'Функции и защита',
    questions: [
      {
        questionEn: 'What is included in the Lite plan?',
        questionTh: 'แผน Lite มีอะไรบ้าง?',
        questionZh: 'Lite计划包含什么？',
        questionJa: 'Liteプランには何が含まれますか？',
        questionKo: 'Lite 플랜에는 무엇이 포함되나요?',
        questionRu: 'Что включено в план Lite?',
        answerEn: 'Lite plan (฿190/month) includes:\n\n• 6 Lease Scans per year\n• 5 Risks Reported per scan\n• Email Notifications\n• 3 Letter Credits\n• 1GB Document Storage\n• Maintenance Tracker\n• Deposit Tracker',
        answerTh: 'แผน Lite (฿190/เดือน) ประกอบด้วย:\n\n• สแกนสัญญา 6 ครั้ง/ปี\n• รายงานความเสี่ยง 5 จุด/สแกน\n• การแจ้งเตือนทางอีเมล\n• เครดิตจดหมาย 3 ใบ\n• พื้นที่จัดเก็บ 1GB\n• ติดตามการซ่อมบำรุง\n• ติดตามเงินมัดจำ',
        answerZh: 'Lite计划（฿190/月）包含：\n\n• 每年6次租约扫描\n• 每次扫描报告5个风险\n• 电子邮件通知\n• 3个信件积分\n• 1GB文档存储\n• 维护追踪器\n• 押金追踪器',
        answerJa: 'Liteプラン（฿190/月）には：\n\n• 年6回のリーススキャン\n• スキャンごとに5つのリスク報告\n• メール通知\n• 3つのレタークレジット\n• 1GBドキュメントストレージ\n• メンテナンストラッカー\n• 敷金トラッカー',
        answerKo: 'Lite 플랜（฿190/월）포함 사항：\n\n• 연간 6회 임대 계약 스캔\n• 스캔당 5개 위험 보고\n• 이메일 알림\n• 3개 레터 크레딧\n• 1GB 문서 저장소\n• 유지보수 추적기\n• 보증금 추적기',
        answerRu: 'План Lite（฿190/месяц）включает：\n\n• 6 сканирований договора в год\n• 5 выявленных рисков на скан\n• Уведомления по email\n• 3 кредита на письма\n• 1 ГБ хранилища\n• Отслеживание обслуживания\n• Отслеживание депозита'
      },
      {
        questionEn: 'What is included in the Protect plan?',
        questionTh: 'แผน Protect มีอะไรบ้าง?',
        questionZh: 'Protect计划包含什么？',
        questionJa: 'Protectプランには何が含まれますか？',
        questionKo: 'Protect 플랜에는 무엇이 포함되나요?',
        questionRu: 'Что включено в план Protect?',
        answerEn: 'Protect plan (฿390/month) includes everything in Lite PLUS:\n\n• 12 Lease Scans per year (double)\n• Full Risk Reports (unlimited depth)\n• LINE Notifications\n• 5 Letter Credits\n• 5GB Document Storage\n• Rent Payment Alerts\n• Automated Reminders\n• Deposit Shield Automation',
        answerTh: 'แผน Protect (฿390/เดือน) รวมทุกอย่างใน Lite บวก:\n\n• สแกนสัญญา 12 ครั้ง/ปี (เพิ่มเป็นสองเท่า)\n• รายงานความเสี่ยงฉบับเต็ม\n• การแจ้งเตือนทาง LINE\n• เครดิตจดหมาย 5 ใบ\n• พื้นที่จัดเก็บ 5GB\n• แจ้งเตือนการชำระค่าเช่า\n• การแจ้งเตือนอัตโนมัติ\n• ระบบอัตโนมัติป้องกันเงินมัดจำ',
        answerZh: 'Protect计划（฿390/月）包含Lite的所有内容加上：\n\n• 每年12次租约扫描（双倍）\n• 完整风险报告（无限深度）\n• LINE通知\n• 5个信件积分\n• 5GB文档存储\n• 租金支付提醒\n• 自动提醒\n• 押金保护自动化',
        answerJa: 'Protectプラン（฿390/月）はLiteの全て＋：\n\n• 年12回のリーススキャン（2倍）\n• 完全なリスクレポート（無制限の深度）\n• LINE通知\n• 5つのレタークレジット\n• 5GBドキュメントストレージ\n• 家賃支払いアラート\n• 自動リマインダー\n• 敷金保護自動化',
        answerKo: 'Protect 플랜（฿390/월）은 Lite의 모든 것 +：\n\n• 연간 12회 임대 계약 스캔（두 배）\n• 전체 위험 보고서（무제한 깊이）\n• LINE 알림\n• 5개 레터 크레딧\n• 5GB 문서 저장소\n• 임대료 납부 알림\n• 자동 알림\n• 보증금 보호 자동화',
        answerRu: 'План Protect（฿390/месяц）включает всё из Lite плюс：\n\n• 12 сканирований договора в год（вдвое больше）\n• Полные отчёты о рисках（неограниченная глубина）\n• Уведомления LINE\n• 5 кредитов писем\n• 5 ГБ хранилища\n• Напоминания об оплате аренды\n• Автоматические напоминания\n• Автоматизация защиты депозита'
      },
      {
        questionEn: 'What is included in the Secure plan?',
        questionTh: 'แผน Secure มีอะไรบ้าง?',
        questionZh: 'Secure计划包含什么？',
        questionJa: 'Secureプランには何が含まれますか？',
        questionKo: 'Secure 플랜에는 무엇이 포함되나요?',
        questionRu: 'Что включено в план Secure?',
        answerEn: 'Secure plan (฿990/month) is our premium tier with everything in Protect PLUS:\n\n• Unlimited Lease Scans\n• Advanced Reminders\n• 10 Letter Credits\n• 20GB Document Storage\n• Priority Case Queue (front of line)\n• Priority Scanning (expedited processing)\n• Premium Support (faster response)',
        answerTh: 'แผน Secure (฿990/เดือน) เป็นแผนพรีเมียมที่รวมทุกอย่างใน Protect บวก:\n\n• สแกนสัญญาได้ไม่จำกัด\n• การแจ้งเตือนขั้นสูง\n• เครดิตจดหมาย 10 ใบ\n• พื้นที่จัดเก็บ 20GB\n• คิวคดีลำดับความสำคัญ\n• สแกนลำดับความสำคัญ\n• การสนับสนุนพรีเมียม',
        answerZh: 'Secure计划（฿990/月）是我们的高级套餐，包含Protect的所有内容加上：\n\n• 无限次租约扫描\n• 高级提醒\n• 10个信件积分\n• 20GB文档存储\n• 优先案件队列（排在前面）\n• 优先扫描（加急处理）\n• 高级支持（更快响应）',
        answerJa: 'Secureプラン（฿990/月）はプレミアムティアで、Protectの全て＋：\n\n• 無制限のリーススキャン\n• 高度なリマインダー\n• 10のレタークレジット\n• 20GBドキュメントストレージ\n• 優先ケースキュー（最前列）\n• 優先スキャン（迅速処理）\n• プレミアムサポート（より速い応答）',
        answerKo: 'Secure 플랜（฿990/월）은 프리미엄 티어로 Protect의 모든 것 +：\n\n• 무제한 임대 계약 스캔\n• 고급 알림\n• 10개 레터 크레딧\n• 20GB 문서 저장소\n• 우선 사례 대기열（맨 앞）\n• 우선 스캔（신속 처리）\n• 프리미엄 지원（빠른 응답）',
        answerRu: 'План Secure（฿990/месяц）- наш премиум-уровень со всем из Protect плюс：\n\n• Неограниченные сканирования договоров\n• Расширенные напоминания\n• 10 кредитов писем\n• 20 ГБ хранилища\n• Приоритетная очередь дел（в начале очереди）\n• Приоритетное сканирование（ускоренная обработка）\n• Премиум-поддержка（быстрый ответ）'
      }
    ]
  },
  resolve: {
    icon: Scale,
    color: '#EF4444',
    titleEn: 'Resolve Service',
    titleTh: 'บริการ Resolve',
    titleZh: 'Resolve服务',
    titleJa: 'Resolveサービス',
    titleKo: 'Resolve 서비스',
    titleRu: 'Сервис Resolve',
    questions: [
      {
        questionEn: 'What is the Resolve service and how much does it cost?',
        questionTh: 'บริการ Resolve คืออะไรและราคาเท่าไหร่?',
        questionZh: 'Resolve服务是什么，费用多少？',
        questionJa: 'Resolveサービスとは何ですか、料金はいくらですか？',
        questionKo: 'Resolve 서비스는 무엇이며 비용은 얼마인가요?',
        questionRu: 'Что такое сервис Resolve и сколько он стоит?',
        answerEn: 'Resolve is our professional case handling and legal support service for deposit disputes, early termination, or damages.\n\nPricing:\n• Member Rate (for Lite/Protect/Secure subscribers): ฿3,500 per case\n• Public Rate (Free plan users): ฿5,000 per case\n\nNote: Lite and Protect members qualify for member pricing after 30 days of active subscription. Secure members get it immediately.',
        answerTh: 'Resolve คือบริการจัดการคดีอย่างมืออาชีพและการสนับสนุนทางกฎหมายสำหรับข้อพิพาทเงินมัดจำ การยกเลิกก่อนกำหนด หรือค่าเสียหาย\n\nราคา:\n• ราคาสมาชิก (สำหรับผู้สมัคร Lite/Protect/Secure): ฿3,500/คดี\n• ราคาทั่วไป (ผู้ใช้แผนฟรี): ฿5,000/คดี\n\nหมายเหตุ: สมาชิก Lite และ Protect จะได้รับราคาสมาชิกหลังจาก 30 วันของการสมัครที่ใช้งาน สมาชิก Secure ได้ทันที',
        answerZh: 'Resolve是我们的专业案件处理和法律支持服务，用于押金纠纷、提前终止或损坏。\n\n定价：\n• 会员价（Lite/Protect/Secure订阅者）：฿3,500/案件\n• 公开价（免费计划用户）：฿5,000/案件\n\n注：Lite和Protect会员在30天活跃订阅后获得会员价。Secure会员立即获得。',
        answerJa: 'Resolveは、敷金紛争、早期終了、または損害に対するプロフェッショナルなケース処理と法的サポートサービスです。\n\n料金：\n• メンバー料金（Lite/Protect/Secureサブスクライバー）：฿3,500/ケース\n• 公開料金（無料プランユーザー）：฿5,000/ケース\n\n注：LiteとProtectメンバーは30日間のアクティブサブスクリプション後にメンバー料金を取得します。Secureメンバーはすぐに取得します。',
        answerKo: 'Resolve는 보증금 분쟁, 조기 종료 또는 손해에 대한 전문적인 사례 처리 및 법률 지원 서비스입니다。\n\n가격：\n• 회원 요금（Lite/Protect/Secure 구독자）：฿3,500/사례\n• 공개 요금（무료 플랜 사용자）：฿5,000/사례\n\n참고：Lite 및 Protect 회원은 30일간의 활성 구독 후 회원 가격을 받습니다。Secure 회원은 즉시 받습니다。',
        answerRu: 'Resolve - это наш профессиональный сервис обработки дел и юридической поддержки по спорам о депозитах, досрочном расторжении или ущербе。\n\nЦены：\n• Тариф участника（для подписчиков Lite/Protect/Secure）：฿3,500/дело\n• Публичный тариф（пользователи бесплатного плана）：฿5,000/дело\n\nПримечание：участники Lite и Protect получают тариф участника через 30 дней активной подписки。Участники Secure получают его сразу。'
      }
    ]
  },
  privacy: {
    icon: Lock,
    color: '#8B5CF6',
    titleEn: 'Privacy & Data',
    titleTh: 'ความเป็นส่วนตัวและข้อมูล',
    titleZh: '隐私与数据',
    titleJa: 'プライバシーとデータ',
    titleKo: '개인정보 보호 및 데이터',
    titleRu: 'Конфиденциальность и данные',
    questions: [
      {
        questionEn: 'How is my data protected under PDPA?',
        questionTh: 'ข้อมูลของฉันได้รับการปกป้องอย่างไรภายใต้ พ.ร.บ. PDPA?',
        questionZh: '根据PDPA，我的数据如何受到保护？',
        questionJa: 'PDPAの下で私のデータはどのように保護されますか？',
        questionKo: 'PDPA에 따라 내 데이터는 어떻게 보호되나요?',
        questionRu: 'Как мои данные защищены в соответствии с PDPA?',
        answerEn: 'LeaseShield is fully PDPA compliant:\n\n• Data encryption at rest and in transit\n• Minimal data collection (only what\'s necessary)\n• Right to access, export, and delete your data\n• Secure cloud storage with access controls\n• No selling or sharing of personal data\n• Clear privacy policy at leaseshield.asia/legal#privacy\n\nYou can export your data anytime from Account → Data Privacy → Export My Data.',
        answerTh: 'LeaseShield ปฏิบัติตาม พ.ร.บ. PDPA อย่างเต็มที่:\n\n• เข้ารหัสข้อมูลขณะจัดเก็บและส่งผ่าน\n• เก็บข้อมูลน้อยที่สุด (เฉพาะที่จำเป็น)\n• สิทธิ์ในการเข้าถึง ส่งออก และลบข้อมูลของคุณ\n• การจัดเก็บบนคลาวด์ที่ปลอดภัยพร้อมการควบคุมการเข้าถึง\n• ไม่ขายหรือแชร์ข้อมูลส่วนบุคคล\n• นโยบายความเป็นส่วนตัวที่ชัดเจนที่ leaseshield.asia/legal#privacy\n\nคุณสามารถส่งออกข้อมูลได้ทุกเมื่อจาก บัญชี → ความเป็นส่วนตัวของข้อมูล → ส่งออกข้อมูลของฉัน',
        answerZh: 'LeaseShield完全符合PDPA：\n\n• 静态和传输中的数据加密\n• 最小化数据收集（仅必要部分）\n• 访问、导出和删除数据的权利\n• 带访问控制的安全云存储\n• 不出售或共享个人数据\n• 清晰的隐私政策在leaseshield.asia/legal#privacy\n\n您可以随时从账户→数据隐私→导出我的数据导出数据。',
        answerJa: 'LeaseShieldは完全にPDPA準拠です：\n\n• 保存時および転送時のデータ暗号化\n• 最小限のデータ収集（必要なもののみ）\n• データのアクセス、エクスポート、削除の権利\n• アクセス制御を備えた安全なクラウドストレージ\n• 個人データの販売や共有なし\n• leaseshield.asia/legal#privacyの明確なプライバシーポリシー\n\nアカウント→データプライバシー→マイデータをエクスポートからいつでもデータをエクスポートできます。',
        answerKo: 'LeaseShield는 PDPA를 완전히 준수합니다：\n\n• 저장 및 전송 중 데이터 암호화\n• 최소한의 데이터 수집（필요한 것만）\n• 데이터 액세스、내보내기 및 삭제 권한\n• 액세스 제어가 있는 안전한 클라우드 스토리지\n• 개인 데이터 판매 또는 공유 없음\n• leaseshield.asia/legal#privacy의 명확한 개인정보 보호정책\n\n계정 → 데이터 프라이버시 → 내 데이터 내보내기에서 언제든지 데이터를 내보낼 수 있습니다。',
        answerRu: 'LeaseShield полностью соответствует PDPA：\n\n• Шифрование данных при хранении и передаче\n• Минимальный сбор данных（только необходимое）\n• Право на доступ、экспорт и удаление данных\n• Безопасное облачное хранилище с контролем доступа\n• Отсутствие продажи или обмена личными данными\n• Чёткая политика конфиденциальности на leaseshield.asia/legal#privacy\n\nВы можете экспортировать данные в любое время из Аккаунт → Конфиденциальность данных → Экспортировать мои данные。'
      }
    ]
  }
};

function FAQContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    fieldBg: '#374151'
  } : {
    bg: '#F3F6F5',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    fieldBg: '#F8FAFC'
  };

  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const getLocalizedText = (item, field) => {
    const langMap = {
      en: field + 'En',
      th: field + 'Th',
      zh: field + 'Zh',
      ja: field + 'Ja',
      ko: field + 'Ko',
      ru: field + 'Ru'
    };
    return item[langMap[language]] || item[field + 'En'];
  };

  const filteredCategories = Object.entries(FAQ_DATA).filter(([key, category]) => {
    if (!searchQuery) return true;
    
    const categoryTitle = getLocalizedText(category, 'title').toLowerCase();
    if (categoryTitle.includes(searchQuery.toLowerCase())) return true;
    
    return category.questions.some(q => {
      const question = getLocalizedText(q, 'question').toLowerCase();
      const answer = getLocalizedText(q, 'answer').toLowerCase();
      return question.includes(searchQuery.toLowerCase()) || answer.includes(searchQuery.toLowerCase());
    });
  });

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 page-transition" style={{ backgroundColor: colors.bg }}>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={language === 'th' ? 'คำถามที่พบบ่อย' : language === 'zh' ? '常见问题' : language === 'ja' ? 'よくある質問' : language === 'ko' ? '자주 묻는 질문' : language === 'ru' ? 'Часто задаваемые вопросы' : 'Frequently Asked Questions'}
          subtitle={language === 'th' ? 'ค้นหาคำตอบสำหรับคำถามทั่วไป' : language === 'zh' ? '查找常见问题的答案' : language === 'ja' ? 'よくある質問の回答を見つける' : language === 'ko' ? '일반적인 질문에 대한 답변 찾기' : language === 'ru' ? 'Найдите ответы на общие вопросы' : 'Find answers to common questions'}
          icon={HelpCircle}
          iconColor="#0C3B2E"
          colors={colors}
        />

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: colors.textSecondary }} />
            <Input
              placeholder={language === 'th' ? 'ค้นหาคำถาม...' : language === 'zh' ? '搜索问题...' : language === 'ja' ? '質問を検索...' : language === 'ko' ? '질문 검색...' : language === 'ru' ? 'Поиск вопросов...' : 'Search questions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: colors.fieldBg,
                borderColor: colors.borderColor,
                color: colors.textPrimary
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredCategories.map(([categoryKey, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[categoryKey];
            
            return (
              <Card key={categoryKey} className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
                <CardHeader 
                  className="cursor-pointer hover:bg-opacity-50 transition-all"
                  onClick={() => toggleCategory(categoryKey)}
                  style={{ 
                    borderBottom: isExpanded ? `1px solid ${colors.borderColor}` : 'none',
                    padding: '20px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{
                        width: '56px',
                        height: '56px',
                        background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}CC 100%)`,
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${category.color}30`
                      }}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-lg" style={{ color: colors.textPrimary }}>
                        {getLocalizedText(category, 'title')}
                      </CardTitle>
                    </div>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" style={{ color: colors.textPrimary }} />
                      ) : (
                        <ChevronDown className="w-5 h-5" style={{ color: colors.textSecondary }} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="p-6" style={{ paddingTop: '24px' }}>
                    <div className="space-y-4">
                      {category.questions.map((q, qIdx) => {
                        const questionId = `${categoryKey}-${qIdx}`;
                        const isQuestionExpanded = expandedQuestions[questionId];
                        
                        return (
                          <div key={questionId}>
                            <button
                              onClick={() => toggleQuestion(questionId)}
                              className="w-full text-left p-5 rounded-xl transition-all"
                              style={{
                                backgroundColor: isQuestionExpanded ? (isDarkMode ? '#374151' : '#F0FDF4') : colors.fieldBg,
                                border: isQuestionExpanded ? `2px solid ${category.color}` : `2px solid ${colors.borderColor}`,
                                boxShadow: isQuestionExpanded ? `0 4px 12px ${category.color}20` : 'none'
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <p className="font-semibold text-base leading-relaxed" style={{ color: colors.textPrimary }}>
                                  {getLocalizedText(q, 'question')}
                                </p>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  backgroundColor: isQuestionExpanded ? category.color : (isDarkMode ? '#374151' : '#F3F4F6'),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isQuestionExpanded ? (
                                    <ChevronUp className="w-4 h-4" style={{ color: 'white' }} />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
                                  )}
                                </div>
                              </div>
                            </button>
                            
                            {isQuestionExpanded && (
                              <div className="mt-3 p-5 rounded-xl" style={{
                                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                                borderLeft: `4px solid ${category.color}`
                              }}>
                                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: colors.textPrimary, lineHeight: '1.7' }}>
                                  {getLocalizedText(q, 'answer')}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <AuthGuard>
      <FAQContent />
    </AuthGuard>
  );
}