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
  general: {
    icon: HelpCircle,
    color: '#0C3B2E',
    titleEn: 'General Overview',
    titleTh: 'ภาพรวมทั่วไป',
    titleZh: '概述',
    titleJa: '概要',
    titleKo: '일반 개요',
    titleRu: 'Общий обзор',
    questions: [
      {
        questionEn: 'What is Lease Shield?',
        questionTh: 'Lease Shield คืออะไร?',
        questionZh: 'Lease Shield是什么？',
        questionJa: 'Lease Shieldとは何ですか？',
        questionKo: 'Lease Shield는 무엇인가요?',
        questionRu: 'Что такое Lease Shield?',
        answerEn: 'Lease Shield is a platform that helps tenants and landlords manage the rental journey clearly, confidently, and fairly.\n\nWe provide tools for lease scanning, deposit tracking, reminders, documentation, evidence storage, and issue reporting — helping prevent problems before they happen.',
        answerTh: 'Lease Shield คือแพลตฟอร์มที่ช่วยผู้เช่าและเจ้าของบ้านจัดการการเช่าอย่างชัดเจน มั่นใจ และเป็นธรรม\n\nเรามีเครื่องมือสำหรับการสแกนสัญญาเช่า ติดตามเงินมัดจำ การแจ้งเตือน เอกสาร การจัดเก็บหลักฐาน และรายงานปัญหา — ช่วยป้องกันปัญหาก่อนเกิดขึ้น',
        answerZh: 'Lease Shield是一个帮助租户和房东清晰、自信、公平地管理租赁过程的平台。\n\n我们提供租约扫描、押金追踪、提醒、文档管理、证据存储和问题报告工具 — 帮助在问题发生前预防。',
        answerJa: 'Lease Shieldは、賃借人と貸主が賃貸の過程を明確、自信を持って、公正に管理するのを支援するプラットフォームです。\n\nリーススキャン、敷金追跡、リマインダー、文書管理、証拠保存、問題報告のツールを提供し — 問題が発生する前に防ぐのを支援します。',
        answerKo: 'Lease Shield는 임차인과 임대인이 임대 과정을 명확하고 자신감 있게 공정하게 관리할 수 있도록 돕는 플랫폼입니다。\n\n임대 계약 스캔、보증금 추적、알림、문서화、증거 저장 및 문제 보고 도구를 제공하여 문제가 발생하기 전에 예방합니다。',
        answerRu: 'Lease Shield — это платформа, которая помогает арендаторам и арендодателям управлять процессом аренды ясно, уверенно и справедливо。\n\nМы предоставляем инструменты для сканирования договоров、отслеживания депозитов、напоминаний、документации、хранения доказательств и сообщения о проблемах — помогая предотвращать проблемы до их возникновения。'
      },
      {
        questionEn: 'How does Lease Shield work?',
        questionTh: 'Lease Shield ทำงานอย่างไร?',
        questionZh: 'Lease Shield如何工作？',
        questionJa: 'Lease Shieldはどのように機能しますか？',
        questionKo: 'Lease Shield는 어떻게 작동하나요?',
        questionRu: 'Как работает Lease Shield?',
        answerEn: 'You upload your lease, track your deposit, report issues, store evidence, and receive guidance throughout your rental period.\n\nLease Shield does not take sides — it supports both tenants and landlords by improving clarity and reducing misunderstandings.',
        answerTh: 'คุณอัปโหลดสัญญาเช่า ติดตามเงินมัดจำ รายงานปัญหา จัดเก็บหลักฐาน และรับคำแนะนำตลอดระยะเวลาการเช่า\n\nLease Shield ไม่เข้าข้างฝ่ายใด — รองรับทั้งผู้เช่าและเจ้าของบ้านด้วยการปรับปรุงความชัดเจนและลดความเข้าใจผิด',
        answerZh: '您上传租约、追踪押金、报告问题、存储证据，并在整个租赁期间获得指导。\n\nLease Shield不偏袒任何一方 — 通过提高清晰度和减少误解来支持租户和房东。',
        answerJa: 'リース契約をアップロードし、敷金を追跡し、問題を報告し、証拠を保存し、賃貸期間中にガイダンスを受けます。\n\nLease Shieldは立場を取りません — 明確性を向上させ、誤解を減らすことで、賃借人と貸主の両方をサポートします。',
        answerKo: '임대 계약을 업로드하고、보증금을 추적하고、문제를 보고하고、증거를 저장하며、임대 기간 동안 안내를 받습니다。\n\nLease Shield는 편을 들지 않습니다 — 명확성을 개선하고 오해를 줄임으로써 임차인과 임대인 모두를 지원합니다。',
        answerRu: 'Вы загружаете договор、отслеживаете депозит、сообщаете о проблемах、храните доказательства и получаете рекомендации на протяжении всего периода аренды。\n\nLease Shield не принимает чью-либо сторону — он поддерживает и арендаторов、и арендодателей、улучшая ясность и уменьшая недопонимание。'
      },
      {
        questionEn: 'Who is Lease Shield for — tenants or landlords?',
        questionTh: 'Lease Shield เหมาะสำหรับใคร — ผู้เช่าหรือเจ้าของบ้าน?',
        questionZh: 'Lease Shield是为租户还是房东设计的？',
        questionJa: 'Lease Shieldは誰のためですか — 賃借人または貸主？',
        questionKo: 'Lease Shield는 누구를 위한 것입니까 — 임차인인가요 아니면 임대인인가요?',
        questionRu: 'Для кого Lease Shield — для арендаторов или арендодателей?',
        answerEn: 'Both.\n\nLease Shield is designed for tenants who want clarity and protection and landlords who want transparency, documentation, and well-informed tenants.',
        answerTh: 'ทั้งสองฝ่าย\n\nLease Shield ออกแบบมาสำหรับผู้เช่าที่ต้องการความชัดเจนและการป้องกัน และเจ้าของบ้านที่ต้องการความโปร่งใส เอกสาร และผู้เช่าที่มีข้อมูลดี',
        answerZh: '两者都有。\n\nLease Shield是为想要清晰和保护的租户以及想要透明度、文档和知情租户的房东设计的。',
        answerJa: '両方です。\n\nLease Shieldは、明確性と保護を求める賃借人と、透明性、文書化、および情報に通じた賃借人を求める貸主のために設計されています。',
        answerKo: '둘 다입니다。\n\nLease Shield는 명확성과 보호를 원하는 임차인과 투명성、문서화 및 정보에 밝은 임차인을 원하는 임대인을 위해 설계되었습니다。',
        answerRu: 'Для обоих。\n\nLease Shield разработан для арендаторов、которые хотят ясности и защиты、и для арендодателей、которые хотят прозрачности、документации и информированных арендаторов。'
      }
    ]
  },
  leaseScan: {
    icon: Shield,
    color: '#0C3B2E',
    titleEn: 'Lease Scan',
    titleTh: 'สแกนสัญญาเช่า',
    titleZh: '租约扫描',
    titleJa: 'リーススキャン',
    titleKo: '임대 계약 스캔',
    titleRu: 'Сканирование договора',
    questions: [
      {
        questionEn: 'What is a lease scan?',
        questionTh: 'การสแกนสัญญาเช่าคืออะไร?',
        questionZh: '租约扫描是什么？',
        questionJa: 'リーススキャンとは何ですか？',
        questionKo: '임대 계약 스캔이란 무엇인가요?',
        questionRu: 'Что такое сканирование договора?',
        answerEn: 'Our AI reviews your rental agreement to highlight unusual terms, important dates, missing information, and potential risks.',
        answerTh: 'AI ของเราตรวจสอบสัญญาเช่าของคุณเพื่อเน้นเงื่อนไขที่ผิดปกติ วันที่สำคัญ ข้อมูลที่ขาดหายไป และความเสี่ยงที่อาจเกิดขึ้น',
        answerZh: '我们的AI会审查您的租赁协议，突出显示不寻常的条款、重要日期、缺失信息和潜在风险。',
        answerJa: '私たちのAIは、あなたの賃貸契約をレビューして、異常な条件、重要な日付、欠落している情報、および潜在的なリスクを強調します。',
        answerKo: '우리의 AI는 임대 계약을 검토하여 비정상적인 조건、중요한 날짜、누락된 정보 및 잠재적 위험을 강조합니다。',
        answerRu: 'Наш ИИ проверяет ваш договор аренды、чтобы выделить необычные условия、важные даты、отсутствующую информацию и потенциальные риски。'
      },
      {
        questionEn: 'Does Lease Shield give legal advice?',
        questionTh: 'Lease Shield ให้คำแนะนำทางกฎหมายหรือไม่?',
        questionZh: 'Lease Shield提供法律建议吗？',
        questionJa: 'Lease Shieldは法的アドバイスを提供しますか？',
        questionKo: 'Lease Shield는 법률 자문을 제공하나요?',
        questionRu: 'Lease Shield дает юридические консультации?',
        answerEn: 'No.\n\nLease Shield highlights information and risk areas to help you understand your lease better — but final decisions should be made by you or a legal professional.',
        answerTh: 'ไม่ให้\n\nLease Shield เน้นข้อมูลและพื้นที่เสี่ยงเพื่อช่วยให้คุณเข้าใจสัญญาเช่าได้ดีขึ้น — แต่การตัดสินใจขั้นสุดท้ายควรทำโดยคุณหรือผู้เชี่ยวชาญด้านกฎหมาย',
        answerZh: '不提供。\n\nLease Shield突出显示信息和风险区域，帮助您更好地理解您的租约 — 但最终决定应由您或法律专业人士做出。',
        answerJa: 'いいえ。\n\nLease Shieldは、あなたがリース契約をよりよく理解できるように情報とリスク領域を強調します — しかし最終的な決定はあなたまたは法律専門家が行うべきです。',
        answerKo: '아니요。\n\nLease Shield는 임대 계약을 더 잘 이해할 수 있도록 정보와 위험 영역을 강조합니다 — 그러나 최종 결정은 귀하 또는 법률 전문가가 내려야 합니다。',
        answerRu: 'Нет。\n\nLease Shield выделяет информацию и области рисков、чтобы помочь вам лучше понять ваш договор — но окончательные решения должны приниматься вами или юристом。'
      },
      {
        questionEn: 'How many lease scans do I get?',
        questionTh: 'ฉันได้สแกนสัญญาเช่ากี่ครั้ง?',
        questionZh: '我可以进行多少次租约扫描？',
        questionJa: 'リーススキャンは何回利用できますか？',
        questionKo: '몇 번의 임대 계약 스캔을 받나요?',
        questionRu: 'Сколько сканирований договора я получаю?',
        answerEn: 'Lite → 6 scans per year\nProtect → 12 scans per year\nSecure → Unlimited',
        answerTh: 'Lite → 6 ครั้ง/ปี\nProtect → 12 ครั้ง/ปี\nSecure → ไม่จำกัด',
        answerZh: 'Lite → 每年6次\nProtect → 每年12次\nSecure → 无限制',
        answerJa: 'Lite → 年6回\nProtect → 年12回\nSecure → 無制限',
        answerKo: 'Lite → 연간 6회\nProtect → 연간 12회\nSecure → 무제한',
        answerRu: 'Lite → 6 раз в год\nProtect → 12 раз в год\nSecure → Неограниченно'
      }
    ]
  },
  deposit: {
    icon: Wallet,
    color: '#10B981',
    titleEn: 'Deposit Tracking',
    titleTh: 'ติดตามเงินมัดจำ',
    titleZh: '押金追踪',
    titleJa: '敷金追跡',
    titleKo: '보증금 추적',
    titleRu: 'Отслеживание депозита',
    questions: [
      {
        questionEn: 'Can Lease Shield track my rental deposit?',
        questionTh: 'Lease Shield สามารถติดตามเงินมัดจำการเช่าของฉันได้หรือไม่?',
        questionZh: 'Lease Shield可以追踪我的租金押金吗？',
        questionJa: 'Lease Shieldは私の敷金を追跡できますか？',
        questionKo: 'Lease Shield가 내 임대 보증금을 추적할 수 있나요?',
        questionRu: 'Может ли Lease Shield отслеживать мой арендный депозит?',
        answerEn: 'Yes.\n\nThe system tracks your deposit amount, due date, and return deadlines, with reminders before key events.',
        answerTh: 'ได้\n\nระบบติดตามจำนวนเงินมัดจำ วันครบกำหนด และกำหนดเวลาคืนเงิน พร้อมการแจ้งเตือนก่อนกิจกรรมสำคัญ',
        answerZh: '可以。\n\n系统追踪您的押金金额、到期日和退还期限，并在关键事件前提醒您。',
        answerJa: 'はい。\n\nシステムは、あなたの敷金額、期日、および返却期限を追跡し、重要なイベントの前にリマインダーを送信します。',
        answerKo: '예。\n\n시스템은 보증금 금액、만기일 및 반환 기한을 추적하고 주요 이벤트 전에 알림을 보냅니다。',
        answerRu: 'Да。\n\nСистема отслеживает сумму вашего депозита、срок оплаты и сроки возврата、с напоминаниями перед ключевыми событиями。'
      },
      {
        questionEn: 'Does Lease Shield hold or manage deposit money?',
        questionTh: 'Lease Shield ถือหรือจัดการเงินมัดจำหรือไม่?',
        questionZh: 'Lease Shield持有或管理押金吗？',
        questionJa: 'Lease Shieldは敷金を保管または管理しますか？',
        questionKo: 'Lease Shield가 보증금을 보유하거나 관리하나요?',
        questionRu: 'Lease Shield хранит или управляет деньгами депозита?',
        answerEn: 'No.\n\nWe track and remind — but we do not handle or store funds.',
        answerTh: 'ไม่\n\nเราติดตามและแจ้งเตือน — แต่เราไม่จัดการหรือจัดเก็บเงิน',
        answerZh: '不。\n\n我们追踪和提醒 — 但我们不处理或存储资金。',
        answerJa: 'いいえ。\n\n私たちは追跡とリマインダーを行います — しかし資金を取り扱ったり保管したりはしません。',
        answerKo: '아니요。\n\n우리는 추적하고 알림을 보냅니다 — 그러나 자금을 처리하거나 보관하지 않습니다。',
        answerRu: 'Нет。\n\nМы отслеживаем и напоминаем — но мы не обрабатываем и не храним средства。'
      }
    ]
  },
  evidence: {
    icon: FileText,
    color: '#8B5CF6',
    titleEn: 'Issue Reporting & Evidence',
    titleTh: 'การรายงานปัญหาและหลักฐาน',
    titleZh: '问题报告和证据',
    titleJa: '問題報告と証拠',
    titleKo: '문제 보고 및 증거',
    titleRu: 'Отчет о проблемах и доказательства',
    questions: [
      {
        questionEn: 'What can I report through Lease Shield?',
        questionTh: 'ฉันสามารถรายงานอะไรผ่าน Lease Shield ได้บ้าง?',
        questionZh: '我可以通过Lease Shield报告什么？',
        questionJa: 'Lease Shieldを通じて何を報告できますか？',
        questionKo: 'Lease Shield를 통해 무엇을 보고할 수 있나요?',
        questionRu: 'Что я могу сообщить через Lease Shield?',
        answerEn: 'You can report issues such as:\n• Maintenance problems\n• Repair delays\n• Communication breakdowns\n• Deposit disputes\n• General rental concerns\n\nReports can be saved privately or shared when needed.',
        answerTh: 'คุณสามารถรายงานปัญหาเช่น:\n• ปัญหาการซ่อมบำรุง\n• ความล่าช้าในการซ่อมแซม\n• การสื่อสารขัดข้อง\n• ข้อพิพาทเงินมัดจำ\n• ความกังวลเกี่ยวกับการเช่าทั่วไป\n\nรายงานสามารถบันทึกไว้เป็นส่วนตัวหรือแบ่งปันเมื่อจำเป็น',
        answerZh: '您可以报告以下问题：\n• 维护问题\n• 维修延迟\n• 沟通障碍\n• 押金纠纷\n• 一般租赁问题\n\n报告可以私密保存或在需要时共享。',
        answerJa: '次のような問題を報告できます：\n• メンテナンスの問題\n• 修理の遅延\n• コミュニケーションの問題\n• 敷金の紛争\n• 一般的な賃貸の懸念\n\nレポートは非公開で保存したり、必要に応じて共有したりできます。',
        answerKo: '다음과 같은 문제를 보고할 수 있습니다：\n• 유지보수 문제\n• 수리 지연\n• 의사소통 장애\n• 보증금 분쟁\n• 일반 임대 문제\n\n보고서는 비공개로 저장하거나 필요시 공유할 수 있습니다。',
        answerRu: 'Вы можете сообщать о таких проблемах、как：\n• Проблемы с обслуживанием\n• Задержки ремонта\n• Нарушения связи\n• Споры о депозите\n• Общие вопросы аренды\n\nОтчеты могут быть сохранены конфиденциально или переданы при необходимости。'
      },
      {
        questionEn: 'How does the evidence feature work?',
        questionTh: 'ฟีเจอร์หลักฐานทำงานอย่างไร?',
        questionZh: '证据功能如何运作？',
        questionJa: '証拠機能はどのように機能しますか？',
        questionKo: '증거 기능은 어떻게 작동하나요?',
        questionRu: 'Как работает функция доказательств?',
        answerEn: 'You can upload photos, videos, receipts, and documents.\n\nEverything is stored with timestamps so both sides have a clear record if issues ever arise.',
        answerTh: 'คุณสามารถอัปโหลดรูปภาพ วิดีโอ ใบเสร็จ และเอกสาร\n\nทุกอย่างจะถูกจัดเก็บพร้อมประทับเวลา เพื่อให้ทั้งสองฝ่ายมีบันทึกที่ชัดเจนหากเกิดปัญหา',
        answerZh: '您可以上传照片、视频、收据和文件。\n\n所有内容都带有时间戳存储，以便在出现问题时双方都有明确的记录。',
        answerJa: '写真、動画、領収書、文書をアップロードできます。\n\nすべてがタイムスタンプ付きで保存されるため、問題が発生した場合、双方が明確な記録を持つことができます。',
        answerKo: '사진、동영상、영수증 및 문서를 업로드할 수 있습니다。\n\n모든 것이 타임스탬프와 함께 저장되므로 문제가 발생할 경우 양측 모두 명확한 기록을 갖게 됩니다。',
        answerRu: 'Вы можете загружать фотографии、видео、чеки и документы。\n\nВсё хранится с отметками времени、чтобы обе стороны имели чёткую запись、если возникнут проблемы。'
      }
    ]
  },
  pricing: {
    icon: DollarSign,
    color: '#C7A338',
    titleEn: 'Plans & Pricing',
    titleTh: 'แผนและราคา',
    titleZh: '计划和定价',
    titleJa: 'プランと料金',
    titleKo: '플랜 및 가격',
    titleRu: 'Планы и цены',
    questions: [
      {
        questionEn: 'What plans are available?',
        questionTh: 'มีแผนอะไรบ้าง?',
        questionZh: '有哪些计划？',
        questionJa: 'どのようなプランがありますか？',
        questionKo: '어떤 플랜이 있나요?',
        questionRu: 'Какие планы доступны?',
        answerEn: 'Lite — Essentials (lease scans, emails, tracking)\nProtect — Adds LINE alerts + more scans + more storage\nSecure — Full suite with unlimited scans & premium support\n\n• Lite: ฿190/month or ฿1,900/year\n• Protect: ฿390/month or ฿3,900/year\n• Secure: ฿990/month or ฿9,900/year',
        answerTh: 'Lite — พื้นฐาน (สแกนสัญญาเช่า, อีเมล, การติดตาม)\nProtect — เพิ่มการแจ้งเตือน LINE + สแกนเพิ่ม + พื้นที่จัดเก็บเพิ่ม\nSecure — ชุดเต็มพร้อมการสแกนไม่จำกัดและการสนับสนุนพรีเมียม\n\n• Lite: ฿190/เดือน หรือ ฿1,900/ปี\n• Protect: ฿390/เดือน หรือ ฿3,900/ปี\n• Secure: ฿990/เดือน หรือ ฿9,900/ปี',
        answerZh: 'Lite — 基础（租约扫描、电子邮件、追踪）\nProtect — 添加LINE提醒 + 更多扫描 + 更多存储\nSecure — 完整套件，无限次扫描和高级支持\n\n• Lite：฿190/月 或 ฿1,900/年\n• Protect：฿390/月 或 ฿3,900/年\n• Secure：฿990/月 或 ฿9,900/年',
        answerJa: 'Lite — 基本（リーススキャン、メール、追跡）\nProtect — LINE通知 + スキャン追加 + ストレージ追加\nSecure — 無制限スキャンとプレミアムサポート付きの完全版\n\n• Lite：฿190/月 または ฿1,900/年\n• Protect：฿390/月 または ฿3,900/年\n• Secure：฿990/月 または ฿9,900/年',
        answerKo: 'Lite — 기본（임대 계약 스캔、이메일、추적）\nProtect — LINE 알림 추가 + 더 많은 스캔 + 더 많은 저장소\nSecure — 무제한 스캔 및 프리미엄 지원이 포함된 전체 제품군\n\n• Lite：฿190/월 또는 ฿1,900/년\n• Protect：฿390/월 또는 ฿3,900/년\n• Secure：฿990/월 또는 ฿9,900/년',
        answerRu: 'Lite — Основы（сканирование договоров、email、отслеживание）\nProtect — Добавляет LINE-уведомления + больше сканирований + больше хранилища\nSecure — Полный набор с неограниченными сканированиями и премиум-поддержкой\n\n• Lite：฿190/месяц или ฿1,900/год\n• Protect：฿390/месяц или ฿3,900/год\n• Secure：฿990/месяц или ฿9,900/год'
      },
      {
        questionEn: 'Can I change or cancel my plan later?',
        questionTh: 'ฉันสามารถเปลี่ยนหรือยกเลิกแผนภายหลังได้หรือไม่?',
        questionZh: '我可以稍后更改或取消我的计划吗？',
        questionJa: '後でプランを変更またはキャンセルできますか？',
        questionKo: '나중에 플랜을 변경하거나 취소할 수 있나요?',
        questionRu: 'Могу ли я изменить или отменить свой план позже?',
        answerEn: 'Yes. You can upgrade, downgrade, or cancel at any time.',
        answerTh: 'ได้ คุณสามารถอัปเกรด ดาวน์เกรด หรือยกเลิกได้ทุกเมื่อ',
        answerZh: '可以。您可以随时升级、降级或取消。',
        answerJa: 'はい。いつでもアップグレード、ダウングレード、またはキャンセルできます。',
        answerKo: '예。언제든지 업그레이드、다운그레이드 또는 취소할 수 있습니다。',
        answerRu: 'Да。Вы можете обновить、понизить или отменить в любое время。'
      },
      {
        questionEn: 'What payment methods do you accept?',
        questionTh: 'คุณยอมรับวิธีการชำระเงินอะไร?',
        questionZh: '您接受哪些支付方式？',
        questionJa: 'どの支払い方法を受け付けていますか？',
        questionKo: '어떤 결제 방법을 받나요?',
        questionRu: 'Какие способы оплаты вы принимаете?',
        answerEn: 'Stripe payments (credit/debit cards).\n\nLocal options may be added in the future.',
        answerTh: 'การชำระเงินผ่าน Stripe (บัตรเครดิต/เดบิต)\n\nอาจเพิ่มตัวเลือกท้องถิ่นในอนาคต',
        answerZh: 'Stripe支付（信用卡/借记卡）。\n\n未来可能会添加本地选项。',
        answerJa: 'Stripe支払い（クレジット/デビットカード）。\n\n今後、ローカルオプションが追加される可能性があります。',
        answerKo: 'Stripe 결제（신용/체크카드）。\n\n향후 현지 옵션이 추가될 수 있습니다。',
        answerRu: 'Платежи Stripe（кредитные/дебетовые карты）。\n\nВ будущем могут быть добавлены местные варианты。'
      }
    ]
  },
  multilingual: {
    icon: FileText,
    color: '#3B82F6',
    titleEn: 'Multilingual Support',
    titleTh: 'การสนับสนุนหลายภาษา',
    titleZh: '多语言支持',
    titleJa: '多言語サポート',
    titleKo: '다국어 지원',
    titleRu: 'Многоязычная поддержка',
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
        answerEn: 'Lease Shield is fully PDPA compliant:\n\n• Data encryption at rest and in transit\n• Minimal data collection (only what\'s necessary)\n• Right to access, export, and delete your data\n• Secure cloud storage with access controls\n• No selling or sharing of personal data\n• Clear privacy policy at leaseshield.asia/legal#privacy\n\nYou can export your data anytime from Account → Data Privacy → Export My Data.',
        answerTh: 'Lease Shield ปฏิบัติตาม พ.ร.บ. PDPA อย่างเต็มที่:\n\n• เข้ารหัสข้อมูลขณะจัดเก็บและส่งผ่าน\n• เก็บข้อมูลน้อยที่สุด (เฉพาะที่จำเป็น)\n• สิทธิ์ในการเข้าถึง ส่งออก และลบข้อมูลของคุณ\n• การจัดเก็บบนคลาวด์ที่ปลอดภัยพร้อมการควบคุมการเข้าถึง\n• ไม่ขายหรือแชร์ข้อมูลส่วนบุคคล\n• นโยบายความเป็นส่วนตัวที่ชัดเจนที่ leaseshield.asia/legal#privacy\n\nคุณสามารถส่งออกข้อมูลได้ทุกเมื่อจาก บัญชี → ความเป็นส่วนตัวของข้อมูล → ส่งออกข้อมูลของฉัน',
        answerZh: 'Lease Shield完全符合PDPA：\n\n• 静态和传输中的数据加密\n• 最小化数据收集（仅必要部分）\n• 访问、导出和删除数据的权利\n• 带访问控制的安全云存储\n• 不出售或共享个人数据\n• 清晰的隐私政策在leaseshield.asia/legal#privacy\n\n您可以随时从账户→数据隐私→导出我的数据导出数据。',
        answerJa: 'Lease Shieldは完全にPDPA準拠です：\n\n• 保存時および転送時のデータ暗号化\n• 最小限のデータ収集（必要なもののみ）\n• データのアクセス、エクスポート、削除の権利\n• アクセス制御を備えた安全なクラウドストレージ\n• 個人データの販売や共有なし\n• leaseshield.asia/legal#privacyの明確なプライバシーポリシー\n\nアカウント→データプライバシー→マイデータをエクスポートからいつでもデータをエクスポートできます。',
        answerKo: 'Lease Shield는 PDPA를 완전히 준수합니다：\n\n• 저장 및 전송 중 데이터 암호화\n• 최소한의 데이터 수집（필요한 것만）\n• 데이터 액세스、내보내기 및 삭제 권한\n• 액세스 제어가 있는 안전한 클라우드 스토리지\n• 개인 데이터 판매 또는 공유 없음\n• leaseshield.asia/legal#privacy의 명확한 개인정보 보호정책\n\n계정 → 데이터 프라이버시 → 내 데이터 내보내기에서 언제든지 데이터를 내보낼 수 있습니다。',
        answerRu: 'Lease Shield полностью соответствует PDPA：\n\n• Шифрование данных при хранении и передаче\n• Минимальный сбор данных（только необходимое）\n• Право на доступ、экспорт и удаление данных\n• Безопасное облачное хранилище с контролем доступа\n• Отсутствие продажи или обмена личными данными\n• Чёткая политика конфиденциальности на leaseshield.asia/legal#privacy\n\nВы можете экспортировать данные в любое время из Аккаунт → Конфиденциальность данных → Экспортировать мои данные。'
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
          isDarkMode={isDarkMode}
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