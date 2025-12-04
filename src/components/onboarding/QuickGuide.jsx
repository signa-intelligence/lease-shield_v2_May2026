import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Home, FileText, Wallet, FolderOpen, Wrench, Scale, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_GUIDE_CONTENT = {
  step1: {
    icon: Home,
    title: {
      en: "Welcome to Your Dashboard",
      th: "ยินดีต้อนรับสู่แดชบอร์ด",
      ja: "ダッシュボードへようこそ",
      ko: "대시보드에 오신 것을 환영합니다",
      zh: "欢迎来到您的仪表板",
      ru: "Добро пожаловать на панель управления"
    },
    bullets: {
      en: [
        "This is your main overview – see your protection score, active leases, deposits, and any important alerts",
        "Quick actions allow you to upload your lease, add a property, or document an issue",
        "The protection score shows how well-organised your rental documentation is, helping both tenant and landlord"
      ],
      th: [
        "หน้าหลักที่แสดงภาพรวมคะแนนความปลอดภัย สัญญาเช่า เงินประกัน และการแจ้งเตือนสำคัญ",
        "สามารถอัปโหลดสัญญาเช่า เพิ่มทรัพย์สิน หรือบันทึกปัญหาได้อย่างรวดเร็ว",
        "คะแนนความปลอดภัยแสดงระดับความเป็นระเบียบของข้อมูล ซึ่งเป็นประโยชน์ทั้งผู้เช่าและผู้ให้เช่า"
      ],
      ja: [
        "ここは全体概要画面で、保護スコア、契約状況、デポジット、重要な通知を確認できます",
        "契約のアップロード、物件追加、問題の記録などを素早く行えます",
        "保護スコアは、賃貸情報がどれだけ整理されているかを示し、借主・貸主双方に役立ちます"
      ],
      ko: [
        "이곳은 보호 점수, 활성 계약, 보증금, 중요 알림을 확인하는 메인 화면입니다",
        "계약서 업로드, 부동산 추가, 문제 기록을 빠르게 실행할 수 있습니다",
        "보호 점수는 임대 문서가 얼마나 잘 정리되어 있는지 보여주며 임차인과 임대인 모두에게 도움이 됩니다"
      ],
      zh: [
        "这是您的总览页面，可查看保护分数、租约、押金及重要通知",
        "您可以快速上传租约、添加房源或记录问题",
        "保护分数显示文档整理程度，对租客与房东均有帮助"
      ],
      ru: [
        "Это основной обзор: ваш уровень защиты, активные договоры, депозиты и важные уведомления",
        "Быстрые действия позволяют загрузить договор, добавить объект или зафиксировать проблему",
        "Уровень защиты показывает, насколько хорошо организованы ваши документы, что полезно для арендатора и арендодателя"
      ]
    }
  },
  step2: {
    icon: FileText,
    title: {
      en: "Upload & Scan Your Lease",
      th: "อัปโหลดและสแกนสัญญาเช่า",
      ja: "契約書をアップロード＆スキャン",
      ko: "계약서 업로드 및 스캔",
      zh: "上传并扫描租约",
      ru: "Загрузите и отсканируйте договор"
    },
    bullets: {
      en: [
        "Upload your lease agreement (PDF, photos, or screenshots) for instant AI analysis",
        "The scan identifies key terms, dates, risks, and responsibilities for both sides",
        "Receive a clarity and risk score to help ensure all parties understand the agreement"
      ],
      th: [
        "อัปโหลดสัญญาเช่า (PDF รูปภาพ หรือสกรีนช็อต) เพื่อให้ระบบ AI วิเคราะห์ทันที",
        "ระบบจะตรวจหาข้อกำหนด วันที่ ความเสี่ยง และหน้าที่ของทั้งสองฝ่าย",
        "รับคะแนนความชัดเจนและความเสี่ยงเพื่อช่วยให้ทุกฝ่ายเข้าใจสัญญาอย่างถูกต้อง"
      ],
      ja: [
        "PDF・写真・スクリーンショットなどの賃貸契約書をアップロードすると、AIが即時分析します",
        "契約内容・日付・リスク・双方の責任を自動で抽出します",
        "透明度スコアとリスクスコアを受け取り、双方が契約を正しく理解できるよう支援します"
      ],
      ko: [
        "임대 계약서(PDF, 사진, 캡처)를 업로드하면 AI가 즉시 분석합니다",
        "핵심 조건, 날짜, 위험 요소, 양측의 책임을 확인합니다",
        "명확성과 위험 점수를 제공하여 모든 이해관계자가 계약 내용을 이해할 수 있도록 돕습니다"
      ],
      zh: [
        "上传租约文件（PDF、照片或截图），AI 会自动分析",
        "自动识别关键条款、日期、风险及双方责任",
        "提供清晰度与风险评分，帮助双方理解合同内容"
      ],
      ru: [
        "Загрузите договор аренды (PDF, фото, скриншот), и ИИ выполнит мгновенный анализ",
        "Система выявит ключевые условия, даты, риски и обязанности сторон",
        "Получите оценку прозрачности и рисков для лучшего понимания соглашения обеими сторонами"
      ]
    }
  },
  step3: {
    icon: MessageCircle,
    title: {
      en: "Meet LISA — Your LeaseShield Assistant",
      th: "พบกับ LISA — ผู้ช่วย LeaseShield ของคุณ",
      ja: "LISA に会いましょう — あなたの LeaseShield アシスタント",
      ko: "LISA를 만나보세요 — 당신의 LeaseShield 어시스턴트",
      zh: "认识 LISA — 您的 LeaseShield 助手",
      ru: "Познакомьтесь с LISA — вашим помощником LeaseShield"
    },
    bullets: {
      en: [
        "LISA can help explain features, guide you through the app, and answer questions in multiple languages",
        "Get assistance with deposit disputes, find the right letter templates, and receive suggested next steps",
        "You can open LISA anytime using the green shield icon at the bottom-right of the screen"
      ],
      th: [
        "LISA สามารถอธิบายฟีเจอร์ต่างๆ แนะนำการใช้แอป และตอบคำถามได้หลายภาษา",
        "รับความช่วยเหลือเรื่องข้อพิพาทเงินประกัน ค้นหาเทมเพลตจดหมายที่เหมาะสม และรับคำแนะนำขั้นตอนถัดไป",
        "คุณสามารถเปิด LISA ได้ทุกเมื่อโดยแตะไอคอนโล่สีเขียวที่มุมขวาล่างของหน้าจอ"
      ],
      ja: [
        "LISA は機能の説明、アプリの使い方のガイド、多言語での質問への回答ができます",
        "デポジット紛争の支援、適切な手紙テンプレートの検索、次のステップの提案を受けられます",
        "画面右下の緑色のシールドアイコンをタップすることで、いつでも LISA を開けます"
      ],
      ko: [
        "LISA는 기능 설명, 앱 안내, 여러 언어로 질문에 답변할 수 있습니다",
        "보증금 분쟁 지원, 적절한 편지 템플릿 찾기, 다음 단계 제안을 받을 수 있습니다",
        "화면 오른쪽 하단의 녹색 방패 아이콘을 탭하여 언제든지 LISA를 열 수 있습니다"
      ],
      zh: [
        "LISA 可以解释功能、引导您使用应用，并以多种语言回答问题",
        "获取押金纠纷帮助、找到合适的信函模板，并获得下一步建议",
        "您可以随时点击屏幕右下角的绿色盾牌图标打开 LISA"
      ],
      ru: [
        "LISA поможет объяснить функции, проведёт вас по приложению и ответит на вопросы на разных языках",
        "Получите помощь по спорам о депозите, найдите подходящие шаблоны писем и рекомендации по дальнейшим шагам",
        "Вы можете открыть LISA в любое время, нажав на зелёную иконку щита в правом нижнем углу экрана"
      ]
    }
  },
  step4: {
    icon: Wallet,
    title: {
      en: "Track Your Deposit",
      th: "ติดตามเงินประกัน",
      ja: "デポジットを追跡",
      ko: "보증금 추적",
      zh: "追踪押金",
      ru: "Отслеживайте депозит"
    },
    bullets: {
      en: [
        "Record your security deposit amount, payment date, and expected return date",
        "Get automated reminders as the move-out date approaches",
        "Log deductions or notes so both tenant and landlord/juristic can keep records transparent"
      ],
      th: [
        "บันทึกจำนวนเงินประกัน วันชำระ และวันที่คาดว่าจะได้รับคืน",
        "รับการแจ้งเตือนอัตโนมัติเมื่อใกล้วันย้ายออก",
        "บันทึกการหักเงินหรือหมายเหตุเพื่อให้ทั้งผู้เช่าและผู้ให้เช่าหรือนิติบุคคลติดตามได้อย่างโปร่งใส"
      ],
      ja: [
        "デポジット金額、支払日、返金予定日を登録できます",
        "退去日が近づくと自動リマインダーが届きます",
        "控除やメモを記録し、借主・貸主・管理会社が透明性を持って管理できます"
      ],
      ko: [
        "보증금 금액, 지급일, 반환 예정일을 기록합니다",
        "퇴실일이 다가오면 자동 알림을 받습니다",
        "공제 내역과 메모를 기록해 임차인·임대인·관리 사무소 모두가 투명하게 확인할 수 있습니다"
      ],
      zh: [
        "记录押金金额、支付日期和预计退还日期",
        "临近退租时自动提醒",
        "可记录扣款和备注，让租客、房东与大楼管理保持透明"
      ],
      ru: [
        "Запишите сумму депозита, дату внесения и предполагаемую дату возврата",
        "Получайте автоматические напоминания по мере приближения даты выезда",
        "Фиксируйте удержания и заметки для прозрачности между арендатором, арендодателем и управляющей компанией"
      ]
    }
  },
  step5: {
    icon: FolderOpen,
    title: {
      en: "Store Evidence in the Vault",
      th: "จัดเก็บหลักฐานใน Vault",
      ja: "証拠をVaultに保存",
      ko: "Vault에 증거 저장",
      zh: "在保险库中存储证据",
      ru: "Храните доказательства в Хранилище"
    },
    bullets: {
      en: [
        "Upload photos, videos, voice notes, and documents as timestamped evidence",
        "Ideal for move-in/move-out, repairs, condition reports, and communication records",
        "Everything is securely organised, helping both tenant and landlord/juristic avoid misunderstandings"
      ],
      th: [
        "อัปโหลดรูปภาพ วิดีโอ ไฟล์เสียง และเอกสารพร้อมบันทึกเวลา",
        "เหมาะสำหรับการบันทึกสภาพห้องเข้า-ออก การซ่อมแซม และประวัติการสื่อสาร",
        "ทุกอย่างถูกจัดเก็บอย่างปลอดภัย ลดความเข้าใจคลาดเคลื่อนของผู้เช่าและผู้ให้เช่า/นิติบุคคล"
      ],
      ja: [
        "写真・動画・音声メモ・書類をタイムスタンプ付きで保存できます",
        "入居/退去時の記録、修繕状況、連絡履歴に最適です",
        "借主・貸主・管理会社が誤解を避けられるよう、安全に整理されます"
      ],
      ko: [
        "사진, 영상, 음성 메모, 문서를 시간 기록과 함께 업로드합니다",
        "입주/퇴거 기록, 수리 내역, 소통 기록에 매우 유용합니다",
        "임차인·임대인·관리 사무소 모두가 오해를 줄일 수 있도록 안전하게 정리됩니다"
      ],
      zh: [
        "上传照片、视频、语音记录及文件，并自动标记时间",
        "适用于入住/退租记录、维修、状况说明与沟通留档",
        "所有资料安全整理，减少租客、房东及物业管理之间的误会"
      ],
      ru: [
        "Загружайте фото, видео, голосовые заметки и документы с отметкой времени",
        "Подходит для фиксации состояния при въезде/выезде, ремонтов и истории общения",
        "Всё безопасно организовано, что помогает избежать недопониманий между жильцом, владельцем и управляющей компанией"
      ]
    }
  },
  step6: {
    icon: Wrench,
    title: {
      en: "Report and Track Maintenance Issues",
      th: "รายงานและติดตามปัญหาการซ่อมบำรุง",
      ja: "修繕の報告と追跡",
      ko: "유지보수 문제 보고 및 추적",
      zh: "报告并追踪维修问题",
      ru: "Сообщайте о неисправностях и отслеживайте ремонт"
    },
    bullets: {
      en: [
        "Report maintenance issues with photos, videos, or voice notes",
        "Track responses and resolution status from landlord or juristic/building manager",
        "Creates a transparent history for everyone involved"
      ],
      th: [
        "รายงานปัญหาการซ่อมแซมพร้อมรูปภาพ วิดีโอ หรือข้อความเสียง",
        "ติดตามการตอบกลับและสถานะจากผู้ให้เช่าหรือนิติบุคคล",
        "สร้างประวัติอย่างโปร่งใสสำหรับทุกฝ่าย"
      ],
      ja: [
        "写真・動画・音声メモを使って修繕依頼を提出できます",
        "貸主または管理会社からの対応状況を追跡できます",
        "すべての関係者にとって透明性のある履歴が作られます"
      ],
      ko: [
        "사진, 영상, 음성 메모로 수리 요청을 제출하세요",
        "임대인 또는 관리 사무소의 대응 및 처리 상태를 추적할 수 있습니다",
        "모든 관계자에게 투명한 기록이 생성됩니다"
      ],
      zh: [
        "通过照片、视频或语音记录提交维修问题",
        "跟踪房东或物业管理的回复与处理状态",
        "建立透明的维修历史记录"
      ],
      ru: [
        "Сообщайте о неисправностях, прикладывая фото, видео или голосовые сообщения",
        "Отслеживайте ответы и статус решения от владельца или управляющей компании",
        "Формируется прозрачная история для всех сторон"
      ]
    }
  },
  step7: {
    icon: Scale,
    title: {
      en: "Resolve Problems and Submit Cases",
      th: "แก้ไขปัญหาและส่งเคส",
      ja: "問題を解決しケースを提出",
      ko: "문제 해결 및 케이스 제출",
      zh: "解决问题并提交案件",
      ru: "Решайте проблемы и подавайте кейсы"
    },
    bullets: {
      en: [
        "Raise a case for disputes, delayed repairs, or unclear communication",
        "Our team reviews your evidence and helps draft professional, neutral letters and messages",
        "Tenants, landlords, and juristic managers can all use this to clarify issues fairly"
      ],
      th: [
        "ส่งเคสเมื่อมีข้อพิพาท การซ่อมล่าช้า หรือการสื่อสารไม่ชัดเจน",
        "ทีมงานจะตรวจสอบหลักฐานและช่วยจัดทำจดหมาย/ข้อความที่เป็นกลางและเหมาะสม",
        "ผู้เช่า ผู้ให้เช่า และนิติบุคคลสามารถใช้ระบบนี้เพื่อแก้ปัญหาอย่างเป็นธรรม"
      ],
      ja: [
        "トラブル・修繕遅延・連絡不備などがある場合にケースを提出できます",
        "チームが証拠を確認し、中立的で丁寧な文書作成をサポートします",
        "借主・貸主・管理会社が公平に問題を整理するために利用できます"
      ],
      ko: [
        "분쟁, 지연된 수리, 불명확한 소통이 있을 때 케이스를 접수할 수 있습니다",
        "팀이 증거를 검토하고 중립적인 문서와 메시지를 작성하는 데 도움을 줍니다",
        "임차인·임대인·관리 사무소 모두 공정하게 문제를 해결할 수 있습니다"
      ],
      zh: [
        "若遇到纠纷、维修拖延或沟通不清，可提交案件",
        "团队会审核证据，并协助起草专业且中立的信件与沟通内容",
        "租客、房东与大楼管理皆可使用此功能公平解决问题"
      ],
      ru: [
        "Подайте кейс при споре, задержке ремонта или неясной коммуникации",
        "Наша команда проверит доказательства и поможет составить профессиональные и нейтральные письма/сообщения",
        "Арендатор, арендодатель и управляющая компания могут использовать это для справедливого урегулирования ситуации"
      ]
    }
  },
  step8: {
    icon: Bell,
    title: {
      en: "Stay Notified & Connect LINE",
      th: "รับการแจ้งเตือนและเชื่อมต่อ LINE",
      ja: "通知を受け取り、LINEを連携",
      ko: "알림 받기 및 LINE 연결",
      zh: "保持通知并连接 LINE",
      ru: "Получайте уведомления и подключите LINE"
    },
    bullets: {
      en: [
        "Enable LINE, email, or in-app alerts for rent dates, reminders, maintenance updates, and case progress",
        "Follow the connection flow to link LINE to your LeaseShield account (QR scan → confirm → sync)",
        "View your communication and notification timeline between tenant, landlord, and juristic/building manager"
      ],
      th: [
        "เปิดการแจ้งเตือนผ่าน LINE อีเมล หรือในแอป สำหรับวันเช่า การเตือน ความคืบหน้าการซ่อมแซม และสถานะเคส",
        "เชื่อมต่อ LINE ด้วยขั้นตอนง่าย ๆ (สแกน QR → ยืนยัน → ซิงก์บัญชี)",
        "ดูไทม์ไลน์การแจ้งเตือนและการสื่อสารระหว่างผู้เช่า ผู้ให้เช่า และนิติบุคคล"
      ],
      ja: [
        "家賃日、リマインダー、修繕状況、ケース進行などを LINE・メール・アプリ通知で受け取れます",
        "LINE の接続手順に従ってアカウントをリンクします（QR スキャン → 確認 → 同期）",
        "借主・貸主・管理会社間の通知/連絡履歴を確認できます"
      ],
      ko: [
        "월세일, 리마인더, 수리 상태, 케이스 진행 상황을 LINE·이메일·앱 알림으로 받을 수 있습니다",
        "QR 스캔 → 확인 → 동기화 순서로 LINE을 연결하세요",
        "임차인·임대인·관리 사무소 간의 알림 및 소통 타임라인을 확인할 수 있습니다"
      ],
      zh: [
        "可通过 LINE、邮件或应用通知接收租金日、提醒、维修更新与案件进度",
        "按步骤将 LINE 连接至您的 LeaseShield 帐户（扫码 → 确认 → 同步）",
        "可查看租客、房东与物业管理之间的通知与沟通记录"
      ],
      ru: [
        "Получайте уведомления о дате аренды, напоминаниях, ремонтах и ходе рассмотрения кейсов через LINE, email или приложение",
        "Подключите LINE (сканирование QR → подтверждение → синхронизация)",
        "Просматривайте историю уведомлений и коммуникаций между арендатором, владельцем и управляющей компанией"
      ]
    }
  }
};

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8'];

const TRANSLATIONS = {
  en: {
    intro: "LeaseShield is a rental protection app that helps tenants, landlords, and building managers document leases, track deposits, store evidence, and resolve issues transparently.",
    back: "Back",
    next: "Next",
    getStarted: "Get Started",
    stepOf: "of",
    quickGuide: "Quick Guide",
    dontShowAgain: "Don't show this again"
  },
  th: {
    intro: "LeaseShield คือแอปคุ้มครองการเช่าที่ช่วยผู้เช่า ผู้ให้เช่า และนิติบุคคลจัดการสัญญาเช่า ติดตามเงินประกัน เก็บหลักฐาน และแก้ไขปัญหาอย่างโปร่งใส",
    back: "ย้อนกลับ",
    next: "ถัดไป",
    getStarted: "เริ่มต้นใช้งาน",
    stepOf: "จาก",
    quickGuide: "คู่มือเริ่มต้น",
    dontShowAgain: "ไม่ต้องแสดงอีก"
  },
  zh: {
    intro: "LeaseShield 是一款租赁保护应用，帮助租客、房东和物业管理记录租约、追踪押金、存储证据并透明解决问题。",
    back: "返回",
    next: "下一步",
    getStarted: "开始使用",
    stepOf: "/",
    quickGuide: "快速指南",
    dontShowAgain: "不再显示"
  },
  ja: {
    intro: "LeaseShield は賃貸保護アプリで、借主・貸主・管理会社が賃貸契約の管理、敷金追跡、証拠保存、問題の透明な解決をサポートします。",
    back: "戻る",
    next: "次へ",
    getStarted: "始める",
    stepOf: "/",
    quickGuide: "クイックガイド",
    dontShowAgain: "今後表示しない"
  },
  ko: {
    intro: "LeaseShield는 임차인, 임대인, 관리 사무소가 임대 계약 관리, 보증금 추적, 증거 저장, 문제의 투명한 해결을 돕는 임대 보호 앱입니다.",
    back: "뒤로",
    next: "다음",
    getStarted: "시작하기",
    stepOf: "/",
    quickGuide: "빠른 가이드",
    dontShowAgain: "다시 표시 안 함"
  },
  ru: {
    intro: "LeaseShield — приложение для защиты аренды, которое помогает арендаторам, арендодателям и управляющим компаниям документировать договоры, отслеживать депозиты, хранить доказательства и прозрачно решать проблемы.",
    back: "Назад",
    next: "Далее",
    getStarted: "Начать",
    stepOf: "из",
    quickGuide: "Краткое руководство",
    dontShowAgain: "Больше не показывать"
  }
};

export default function QuickGuide({ open, onClose, language = 'en', isDarkMode = false, user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const lang = TRANSLATIONS[language] ? language : 'en';
  const strings = TRANSLATIONS[lang];

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  if (!open) return null;

  const stepKey = STEP_KEYS[currentStep];
  const stepData = QUICK_GUIDE_CONTENT[stepKey];
  const Icon = stepData.icon;
  const stepTitle = stepData.title[lang] || stepData.title.en;
  const stepBullets = stepData.bullets[lang] || stepData.bullets.en;
  const isLastStep = currentStep === STEP_KEYS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    if (isLastStep) {
      localStorage.setItem('leaseshield_quick_guide_done', 'true');
      
      // Save "Don't show again" preference to user record
      if (dontShowAgain && user) {
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.auth.updateMe({ hide_quick_guide: true });
        } catch (error) {
          console.error('Failed to save Quick Guide preference:', error);
        }
      }
      
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          maxHeight: '85vh',
          animation: 'modalEnter 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div 
          className="relative p-6 pb-4"
          style={{
            background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-1">
                {strings.quickGuide} • {currentStep + 1} {strings.stepOf} {STEP_KEYS.length}
              </p>
              <h2 className="text-xl font-bold text-white">
                {stepTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / STEP_KEYS.length) * 100}%`,
              backgroundColor: '#C7A338'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {isFirstStep && (
            <p 
              className="text-sm mb-6 pb-4 border-b"
              style={{
                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                borderColor: isDarkMode ? '#374151' : '#E5E7EB'
              }}
            >
              {strings.intro}
            </p>
          )}

          <ul className="space-y-4">
            {stepBullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <span className="text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: isDarkMode ? '#E5E7EB' : '#374151' }}
                >
                  {bullet}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: isDarkMode ? '#374151' : '#E5E7EB' }}
        >
          {/* Checkbox row */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: '#0C3B2E' }}
            />
            <label 
              htmlFor="dontShowAgain" 
              className="text-sm cursor-pointer"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              {strings.dontShowAgain}
            </label>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className="gap-2"
              style={{
                opacity: isFirstStep ? 0.5 : 1,
                borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
                color: isDarkMode ? '#E5E7EB' : '#374151'
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              {strings.back}
            </Button>

          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEP_KEYS.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: index === currentStep 
                    ? '#0C3B2E' 
                    : index < currentStep 
                      ? '#C7A338' 
                      : (isDarkMode ? '#4B5563' : '#D1D5DB')
                }}
              />
            ))}
          </div>

            <Button
              onClick={handleNext}
              className="gap-2"
              style={{
                backgroundColor: isLastStep ? '#C7A338' : '#0C3B2E',
                color: '#FFFFFF'
              }}
            >
              {isLastStep ? strings.getStarted : strings.next}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}