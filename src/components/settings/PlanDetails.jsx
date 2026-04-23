import { Gift, Zap, Shield, Crown } from "lucide-react";

export const PRICING = {
  lite: {
    monthly: { amount: 190, priceId: "price_1SbtXQQwol6NhlUxKMIyoEbs" },
    annual: { amount: 1900, priceId: "price_1SbtXQQwol6NhlUxXqxUROyx" }
  },
  protect: {
    monthly: { amount: 390, priceId: "price_1SbtZ4Qwol6NhlUxxxUML4Un" },
    annual: { amount: 3900, priceId: "price_1SbtZ4Qwol6NhlUxUwsvYbkS" }
  },
  secure: {
    monthly: { amount: 990, priceId: "price_1SbtaWQwol6NhlUxJboFevsu" },
    annual: { amount: 9900, priceId: "price_1SbtaWQwol6NhlUxAfPLTDeE" }
  }
};

export const PLAN_DETAILS = [
  {
    key: 'free',
    label: 'Explorer',
    priceMonthly: 0,
    priceAnnual: 0,
    savingsAnnual: 0,
    tagline: 'Explore Features',
    taglineTh: 'สำรวจฟีเจอร์',
    taglineRu: 'Изучите возможности',
    taglineZh: '探索功能',
    taglineJa: '機能を探索',
    taglineKo: '기능 탐색',
    description: 'Basic lease risk check to get started',
    descriptionTh: 'ตรวจสอบความเสี่ยงสัญญาเช่าเบื้องต้นเพื่อเริ่มต้น',
    descriptionRu: 'Базовая проверка рисков договора для начала',
    descriptionZh: '基本租约风险检查以开始',
    descriptionJa: '基本的な契約リスクチェックで開始',
    descriptionKo: '시작을 위한 기본 임대 계약 위험 확인',
    benefits: ['Lifetime access', '1 Lease Scan', 'Evidence Vault storage', 'Lisa AI Assistant', 'Access to rental document templates', 'Resolve Service (฿5,000 per case)'],
    benefitsTh: ['เข้าถึงตลอดชีพ', '1 การสแกนสัญญาเช่า', 'พื้นที่จัดเก็บ Evidence Vault', 'ผู้ช่วย Lisa AI', 'เข้าถึงเทมเพลตเอกสารเช่า', 'บริการ Resolve (฿5,000 ต่อคดี)'],
    benefitsRu: ['Пожизненный доступ', '1 сканирование договора', 'Хранилище Evidence Vault', 'Ассистент Lisa AI', 'Доступ к шаблонам документов аренды', 'Сервис Resolve (฿5 000 за дело)'],
    benefitsZh: ['终身访问', '1次租约扫描', 'Evidence Vault 存储', 'Lisa AI 助手', '访问租赁文档模板', 'Resolve 服务（每案 ฿5,000）'],
    benefitsJa: ['生涯アクセス', '1回のリーススキャン', 'Evidence Vault ストレージ', 'Lisa AI アシスタント', '賃貸文書テンプレートへのアクセス', 'Resolve サービス（1件あたり ฿5,000）'],
    benefitsKo: ['평생 접근', '1회 임대 계약 스캔', 'Evidence Vault 저장소', 'Lisa AI 어시스턴트', '임대 문서 템플릿 접근', 'Resolve 서비스 (건당 ฿5,000)'],
    bgColor: '#64748b',
    icon: Gift
  },
  {
    key: 'lite',
    label: 'Lite',
    priceMonthly: 190,
    priceAnnual: 1900,
    savingsAnnual: 380,
    tagline: 'Essential Protection',
    taglineTh: 'การป้องกันที่จำเป็น',
    taglineRu: 'Базовая защита',
    taglineZh: '基本保护',
    taglineJa: '必須保護',
    taglineKo: '필수 보호',
    description: 'For ongoing rental protection after your first scan',
    descriptionTh: 'สำหรับการป้องกันการเช่าต่อเนื่องหลังจากการสแกนครั้งแรก',
    descriptionRu: 'Для постоянной защиты аренды после первого сканирования',
    descriptionZh: '首次扫描后的持续租赁保护',
    descriptionJa: '初回スキャン後の継続的な賃貸保護',
    descriptionKo: '첫 번째 스캔 후 지속적인 임대 보호',
    benefits: ['6 Lease Scans per annum', '5 Risks Reported', 'Email Notifications', '3 Letter Credits', '1GB Document Storage', 'Maintenance Tracker', 'Deposit Tracker'],
    benefitsTh: ['6 การสแกนสัญญาต่อปี', 'รายงานความเสี่ยง 5 จุด', 'การแจ้งเตือนทางอีเมล', 'เครดิตจดหมาย 3 ใบ', 'พื้นที่จัดเก็บ 1GB', 'ติดตามการซ่อมบำรุง', 'ติดตามเงินมัดจำ'],
    benefitsRu: ['6 сканирований договора в год', '5 выявленных рисков', 'Уведомления по электронной почте', '3 кредита на письма', '1 ГБ хранилища документов', 'Отслеживание обслуживания', 'Отслеживание депозита'],
    benefitsZh: ['每年6次租约扫描', '报告5个风险', '电子邮件通知', '3个信件积分', '1GB文档存储', '维护追踪器', '押金追踪器'],
    benefitsJa: ['年6回のリーススキャン', '5つのリスク報告', 'メール通知', '3つのレタークレジット', '1GBドキュメントストレージ', 'メンテナンストラッカー', '敷金トラッカー'],
    benefitsKo: ['연간 6회 임대 계약 스캔', '5개 위험 보고', '이메일 알림', '3개 레터 크레딧', '1GB 문서 저장소', '유지보수 추적기', '보증금 추적기'],
    bgColor: '#0C3B2E',
    icon: Zap
  },
  {
    key: 'protect',
    label: 'Protect',
    priceMonthly: 390,
    priceAnnual: 3900,
    savingsAnnual: 780,
    tagline: 'Complete Prevention Suite',
    taglineTh: 'ชุดป้องกันครบครัน',
    taglineRu: 'Полный комплекс профилактической защиты',
    taglineZh: '完整预防套件',
    taglineJa: '完全な予防スイート',
    taglineKo: '완전한 예방 제품군',
    description: 'Most renters upgrade after identifying risks',
    descriptionTh: 'ผู้เช่าส่วนใหญ่อัปเกรดหลังจากพบความเสี่ยง',
    descriptionRu: 'Большинство арендаторов переходят после выявления рисков',
    descriptionZh: '大多数租户在发现风险后升级',
    descriptionJa: 'ほとんどの賃借人はリスク発見後にアップグレード',
    descriptionKo: '대부분의 임차인이 위험 발견 후 업그레이드',
    benefits: ['Everything in Lite', '12 Lease Scans per annum', 'Full Risk Reports', 'LINE Notifications', '5 Letter Credits', '5GB Document Storage', 'Rent Payment Alerts', 'Automated Reminders', 'Deposit Shield Automation'],
    benefitsTh: ['ทุกอย่างในแผน Lite', '12 การสแกนสัญญาต่อปี', 'รายงานความเสี่ยงฉบับเต็ม', 'การแจ้งเตือนทาง LINE', 'เครดิตจดหมาย 5 ใบ', 'พื้นที่จัดเก็บ 5GB', 'แจ้งเตือนการชำระค่าเช่า', 'การแจ้งเตือนอัตโนมัติ', 'ระบบอัตโนมัติป้องกันเงินมัดจำ'],
    benefitsRu: ['Все из тарифа Lite', '12 сканирований договора в год', 'Полные отчёты о рисках', 'Уведомления в LINE', '5 кредитов на письма', '5 ГБ хранилища документов', 'Напоминания об оплате аренды', 'Автоматические напоминания', 'Автоматизация защиты депозита'],
    benefitsZh: ['包含Lite计划所有内容', '每年12次租约扫描', '完整风险报告', 'LINE通知', '5个信件积分', '5GB文档存储', '租金支付提醒', '自动提醒', '押金保护自动化'],
    benefitsJa: ['Liteの全て', '年12回のリーススキャン', '完全なリスクレポート', 'LINE通知', '5つのレタークレジット', '5GBドキュメントストレージ', '家賃支払いアラート', '自動リマインダー', '敷金保護自動化'],
    benefitsKo: ['Lite 플랜의 모든 내용', '연간 12회 임대 계약 스캔', '전체 위험 보고서', 'LINE 알림', '5개 레터 크레딧', '5GB 문서 저장소', '임대료 납부 알림', '자동 알림', '보증금 보호 자동화'],
    bgColor: '#C7A338',
    icon: Shield,
    popular: true
  },
  {
    key: 'secure',
    label: 'Secure',
    priceMonthly: 990,
    priceAnnual: 9900,
    savingsAnnual: 1980,
    tagline: 'Premium Protection',
    taglineTh: 'การป้องกันระดับพรีเมียม',
    taglineRu: 'Премиальная защита',
    taglineZh: '高级保护',
    taglineJa: 'プレミアム保護',
    taglineKo: '프리미엄 보호',
    description: 'Full protection for high-value rentals',
    descriptionTh: 'การป้องกันเต็มรูปแบบสำหรับการเช่ามูลค่าสูง',
    descriptionRu: 'Полная защита для дорогой аренды',
    descriptionZh: '高价租赁的全面保护',
    descriptionJa: '高額賃貸のための完全保護',
    descriptionKo: '고가 임대를 위한 완전한 보호',
    benefits: ['Everything in Protect', '50 Lease Scans per year', '50 Letter Credits per year', '20GB Document Storage', 'Priority Case Queue', 'Priority Scanning', 'Premium Support', '1 Resolve Case per year', '10 Fast Track Cases per year'],
    benefitsTh: ['ทุกอย่างในแผน Protect', '50 การสแกนสัญญาต่อปี', '50 เครดิตจดหมายต่อปี', 'พื้นที่จัดเก็บ 20GB', 'คิวคดีลำดับความสำคัญ', 'สแกนลำดับความสำคัญ', 'การสนับสนุนพรีเมียม', '1 คดี Resolve ต่อปี', '10 Fast Track ต่อปี'],
    benefitsRu: ['Все из тарифа Protect', '50 сканирований договора в год', '50 кредитов писем в год', '20 ГБ хранилища документов', 'Приоритетная очередь по делам', 'Приоритетное сканирование', 'Премиальная поддержка', '1 дело Resolve в год', '10 Fast Track в год'],
    benefitsZh: ['包含Protect计划所有内容', '每年50次租约扫描', '每年50个信件积分', '20GB文档存储', '优先案件队列', '优先扫描', '高级支持', '每年1个Resolve案件', '每年10个Fast Track案件'],
    benefitsJa: ['Protectの全て', '年50回のリーススキャン', '年50レタークレジット', '20GBドキュメントストレージ', '優先ケースキュー', '優先スキャン', 'プレミアムサポート', '年1件のResolveケース', '年10件のFast Track'],
    benefitsKo: ['Protect 플랜의 모든 내용', '연간 50회 임대 계약 스캔', '연간 50개 레터 크레딧', '20GB 문서 저장소', '우선 사례 대기열', '우선 스캔', '프리미엄 지원', '연간 1건 Resolve 케이스', '연간 10건 Fast Track'],
    bgColor: '#1A1D1F',
    icon: Crown
  }
];

export const CREDIT_PACKAGES = [
  { id: 'credits_1', credits: 1, price: 99, savings: 0 },
  { id: 'credits_3', credits: 3, price: 249, savings: 16, popular: false },
  { id: 'credits_5', credits: 5, price: 399, savings: 20, popular: true },
  { id: 'credits_10', credits: 10, price: 699, savings: 30, popular: false }
];