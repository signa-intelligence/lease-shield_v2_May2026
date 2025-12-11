import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, Shield, DollarSign, FileText, Scale, Lock, HelpCircle, Wallet, Star } from "lucide-react";
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
        questionEn: 'Which languages does Lease Shield support?',
        questionTh: 'Lease Shield สนับสนุนภาษาอะไรบ้าง?',
        questionZh: 'Lease Shield支持哪些语言？',
        questionJa: 'Lease Shieldはどの言語をサポートしていますか？',
        questionKo: 'Lease Shield는 어떤 언어를 지원하나요?',
        questionRu: 'Какие языки поддерживает Lease Shield?',
        answerEn: 'English, Thai, Japanese, Korean, Simplified Chinese, and Russian.\n\nBoth the app and Lisa (the assistant) can communicate in all supported languages.',
        answerTh: 'อังกฤษ ไทย ญี่ปุ่น เกาหลี จีน (ตัวย่อ) และรัสเซีย\n\nทั้งแอปและ Lisa (ผู้ช่วย) สามารถสื่อสารได้ในทุกภาษาที่รองรับ',
        answerZh: '英语、泰语、日语、韩语、简体中文和俄语。\n\n应用程序和Lisa（助手）都可以使用所有支持的语言进行交流。',
        answerJa: '英語、タイ語、日本語、韓国語、簡体字中国語、ロシア語。\n\nアプリとLisa（アシスタント）の両方がサポートされているすべての言語でコミュニケーションできます。',
        answerKo: '영어、태국어、일본어、한국어、중국어 간체 및 러시아어。\n\n앱과 Lisa（어시스턴트） 모두 지원되는 모든 언어로 통신할 수 있습니다。',
        answerRu: 'Английский、тайский、японский、корейский、упрощённый китайский и русский。\n\nКак приложение、так и Lisa（помощник）могут общаться на всех поддерживаемых языках。'
      },
      {
        questionEn: 'How do I change my language?',
        questionTh: 'ฉันจะเปลี่ยนภาษาได้อย่างไร?',
        questionZh: '如何更改语言？',
        questionJa: '言語を変更するにはどうすればよいですか？',
        questionKo: '언어를 변경하려면 어떻게 하나요?',
        questionRu: 'Как изменить язык?',
        answerEn: 'From the navigation menu or account settings → select preferred language.',
        answerTh: 'จากเมนูนำทางหรือการตั้งค่าบัญชี → เลือกภาษาที่ต้องการ',
        answerZh: '从导航菜单或帐户设置 → 选择首选语言。',
        answerJa: 'ナビゲーションメニューまたはアカウント設定から → 希望する言語を選択します。',
        answerKo: '탐색 메뉴 또는 계정 설정에서 → 원하는 언어를 선택합니다。',
        answerRu: 'В навигационном меню или настройках аккаунта → выберите предпочитаемый язык。'
      }
    ]
  },
  lisa: {
    icon: HelpCircle,
    color: '#F59E0B',
    titleEn: 'Lisa: The Lease Shield Assistant',
    titleTh: 'Lisa: ผู้ช่วย Lease Shield',
    titleZh: 'Lisa: Lease Shield助手',
    titleJa: 'Lisa: Lease Shieldアシスタント',
    titleKo: 'Lisa: Lease Shield 어시스턴트',
    titleRu: 'Lisa: Помощник Lease Shield',
    questions: [
      {
        questionEn: 'What can Lisa help me with?',
        questionTh: 'Lisa สามารถช่วยอะไรฉันได้บ้าง?',
        questionZh: 'Lisa可以帮我做什么？',
        questionJa: 'Lisaは何を助けてくれますか？',
        questionKo: 'Lisa는 무엇을 도와줄 수 있나요?',
        questionRu: 'Чем Lisa может мне помочь?',
        answerEn: 'Lisa can guide you through:\n• Understanding your lease\n• How to upload documents\n• Finding features in the app\n• Understanding your plan\n• Explaining deadlines and reminders\n• Basic rental processes\n\nLisa is trained to answer in EN/TH/JP/KR/ZH/RU.',
        answerTh: 'Lisa สามารถแนะนำคุณได้เกี่ยวกับ:\n• ความเข้าใจสัญญาเช่าของคุณ\n• วิธีอัปโหลดเอกสาร\n• การค้นหาฟีเจอร์ในแอป\n• ความเข้าใจแผนของคุณ\n• การอธิบายกำหนดเวลาและการแจ้งเตือน\n• กระบวนการเช่าพื้นฐาน\n\nLisa ได้รับการฝึกฝนให้ตอบในภาษา EN/TH/JP/KR/ZH/RU',
        answerZh: 'Lisa可以指导您：\n• 了解您的租约\n• 如何上传文件\n• 在应用中查找功能\n• 了解您的计划\n• 解释截止日期和提醒\n• 基本租赁流程\n\nLisa经过培训可以用EN/TH/JP/KR/ZH/RU回答。',
        answerJa: 'Lisaは以下を案内できます：\n• あなたのリース契約の理解\n• ドキュメントのアップロード方法\n• アプリ内の機能の検索\n• プランの理解\n• 期限とリマインダーの説明\n• 基本的な賃貸プロセス\n\nLisaはEN/TH/JP/KR/ZH/RUで回答するように訓練されています。',
        answerKo: 'Lisa는 다음을 안내할 수 있습니다：\n• 임대 계약 이해\n• 문서 업로드 방법\n• 앱에서 기능 찾기\n• 플랜 이해\n• 마감일 및 알림 설명\n• 기본 임대 프로세스\n\nLisa는 EN/TH/JP/KR/ZH/RU로 답변하도록 훈련되었습니다。',
        answerRu: 'Lisa может помочь вам с：\n• Пониманием вашего договора\n• Загрузкой документов\n• Поиском функций в приложении\n• Пониманием вашего плана\n• Объяснением сроков и напоминаний\n• Базовыми процессами аренды\n\nLisa обучена отвечать на EN/TH/JP/KR/ZH/RU。'
      },
      {
        questionEn: 'Does Lisa give legal advice?',
        questionTh: 'Lisa ให้คำแนะนำทางกฎหมายหรือไม่?',
        questionZh: 'Lisa提供法律建议吗？',
        questionJa: 'Lisaは法的アドバイスを提供しますか？',
        questionKo: 'Lisa는 법률 자문을 제공하나요?',
        questionRu: 'Lisa дает юридические консультации?',
        answerEn: 'No.\n\nLisa provides structured guidance and information based on your lease and inputs, but not legal interpretation.',
        answerTh: 'ไม่\n\nLisa ให้คำแนะนำและข้อมูลที่มีโครงสร้างตามสัญญาเช่าและข้อมูลของคุณ แต่ไม่ใช่การตีความทางกฎหมาย',
        answerZh: '不。\n\nLisa根据您的租约和输入提供结构化的指导和信息，但不提供法律解释。',
        answerJa: 'いいえ。\n\nLisaは、あなたのリース契約と入力に基づいて構造化されたガイダンスと情報を提供しますが、法的解釈ではありません。',
        answerKo: '아니요。\n\nLisa는 귀하의 임대 계약 및 입력을 기반으로 구조화된 안내 및 정보를 제공하지만 법적 해석은 제공하지 않습니다。',
        answerRu: 'Нет。\n\nLisa предоставляет структурированные рекомендации и информацию на основе вашего договора и данных、но не юридическую интерпретацию。'
      }
    ]
  },
  referral: {
    icon: Star,
    color: '#C7A338',
    titleEn: 'Referral Program',
    titleTh: 'โปรแกรมแนะนำเพื่อน',
    titleZh: '推荐计划',
    titleJa: '紹介プログラム',
    titleKo: '추천 프로그램',
    titleRu: 'Реферальная программа',
    questions: [
      {
        questionEn: 'How does the referral program work?',
        questionTh: 'โปรแกรมแนะนำเพื่อนทำงานอย่างไร?',
        questionZh: '推荐计划如何运作？',
        questionJa: '紹介プログラムはどのように機能しますか？',
        questionKo: '추천 프로그램은 어떻게 작동하나요?',
        questionRu: 'Как работает реферальная программа?',
        answerEn: 'Share your personal referral link. When your friend subscribes and pays their first bill, you receive credit automatically applied to your next invoice.',
        answerTh: 'แชร์ลิงก์แนะนำส่วนตัวของคุณ เมื่อเพื่อนของคุณสมัครสมาชิกและชำระบิลแรก คุณจะได้รับเครดิตที่นำไปใช้กับใบแจ้งหนี้ถัดไปโดยอัตโนมัติ',
        answerZh: '分享您的个人推荐链接。当您的朋友订阅并支付第一笔账单时，您将获得自动应用于下一张发票的积分。',
        answerJa: '個人紹介リンクを共有します。友達がサブスクリプションを登録し、最初の請求を支払うと、次の請求書に自動的に適用されるクレジットを受け取ります。',
        answerKo: '개인 추천 링크를 공유하세요。친구가 구독하고 첫 번째 청구서를 지불하면 다음 송장에 자동으로 적용되는 크레딧을 받습니다。',
        answerRu: 'Поделитесь своей личной реферальной ссылкой。Когда ваш друг подпишется и оплатит первый счёт、вы получите кредит、автоматически применяемый к следующему счёту。'
      },
      {
        questionEn: 'Is there a limit to how many friends I can refer?',
        questionTh: 'มีขีดจำกัดในการแนะนำเพื่อนหรือไม่?',
        questionZh: '我可以推荐多少朋友有限制吗？',
        questionJa: '友達を紹介できる人数に制限はありますか？',
        questionKo: '추천할 수 있는 친구 수에 제한이 있나요?',
        questionRu: 'Есть ли ограничение на количество друзей、которых я могу порекомендовать?',
        answerEn: 'No — unlimited referrals.',
        answerTh: 'ไม่มี — แนะนำได้ไม่จำกัด',
        answerZh: '无限制。',
        answerJa: 'いいえ — 無制限の紹介。',
        answerKo: '없음 — 무제한 추천。',
        answerRu: 'Нет — неограниченное количество рефералов。'
      },
      {
        questionEn: 'How much credit do I get?',
        questionTh: 'ฉันจะได้รับเครดิตเท่าไหร่?',
        questionZh: '我能获得多少积分？',
        questionJa: 'どれくらいのクレジットがもらえますか？',
        questionKo: '얼마의 크레딧을 받나요?',
        questionRu: 'Сколько кредита я получаю?',
        answerEn: 'You earn the value of the plan your friend selects (Lite, Protect, or Secure).\n\nExample: Your friend joins Protect → you receive ฿390 credit.',
        answerTh: 'คุณจะได้รับมูลค่าของแผนที่เพื่อนของคุณเลือก (Lite, Protect หรือ Secure)\n\nตัวอย่าง: เพื่อนของคุณเข้าร่วม Protect → คุณจะได้รับเครดิต ฿390',
        answerZh: '您获得朋友选择的计划价值（Lite、Protect或Secure）。\n\n例如：您的朋友加入Protect → 您获得฿390积分。',
        answerJa: '友達が選択したプラン（Lite、Protect、またはSecure）の価値を獲得します。\n\n例：友達がProtectに参加 → ฿390のクレジットを受け取ります。',
        answerKo: '친구가 선택한 플랜（Lite、Protect 또는 Secure）의 가치를 얻습니다。\n\n예：친구가 Protect에 가입 → ฿390 크레딧을 받습니다。',
        answerRu: 'Вы зарабатываете стоимость плана、который выбрал ваш друг（Lite、Protect или Secure）。\n\nПример：ваш друг присоединяется к Protect → вы получаете ฿390 кредита。'
      },
      {
        questionEn: 'Where do I find my referral link?',
        questionTh: 'ฉันจะหาลิงก์แนะนำของฉันได้ที่ไหน?',
        questionZh: '我在哪里可以找到我的推荐链接？',
        questionJa: '紹介リンクはどこで見つかりますか？',
        questionKo: '추천 링크는 어디에서 찾을 수 있나요?',
        questionRu: 'Где я могу найти мою реферальную ссылку?',
        answerEn: 'In your account page under "Referral Program".',
        answerTh: 'ในหน้าบัญชีของคุณภายใต้ "โปรแกรมแนะนำเพื่อน"',
        answerZh: '在您的帐户页面的"推荐计划"下。',
        answerJa: 'アカウントページの「紹介プログラム」の下にあります。',
        answerKo: '계정 페이지의 "추천 프로그램" 아래에 있습니다。',
        answerRu: 'На странице вашего аккаунта в разделе "Реферальная программа"。'
      }
    ]
  },
  privacy: {
    icon: Lock,
    color: '#8B5CF6',
    titleEn: 'Privacy & PDPA',
    titleTh: 'ความเป็นส่วนตัวและ PDPA',
    titleZh: '隐私和PDPA',
    titleJa: 'プライバシーとPDPA',
    titleKo: '개인정보 보호 및 PDPA',
    titleRu: 'Конфиденциальность и PDPA',
    questions: [
      {
        questionEn: 'How does Lease Shield use my data?',
        questionTh: 'Lease Shield ใช้ข้อมูลของฉันอย่างไร?',
        questionZh: 'Lease Shield如何使用我的数据？',
        questionJa: 'Lease Shieldは私のデータをどのように使用しますか？',
        questionKo: 'Lease Shield는 내 데이터를 어떻게 사용하나요?',
        questionRu: 'Как Lease Shield использует мои данные?',
        answerEn: 'We use your information and uploaded documents only to provide the Lease Shield service – for example, to analyse your lease, generate letters, and help you organise evidence.\n\nWe follow Thailand\'s PDPA rules. For full details, see our Privacy / PDPA Policy at leaseshield.asia.',
        answerTh: 'เราใช้ข้อมูลและเอกสารที่อัปโหลดของคุณเพื่อให้บริการ Lease Shield เท่านั้น – เช่น เพื่อวิเคราะห์สัญญาเช่า สร้างจดหมาย และช่วยคุณจัดระเบียบหลักฐาน\n\nเราปฏิบัติตามกฎหมาย PDPA ของไทย สำหรับรายละเอียดเต็มรูปแบบ ดูนโยบายความเป็นส่วนตัว / PDPA ที่ leaseshield.asia',
        answerZh: '我们仅使用您的信息和上传的文档来提供Lease Shield服务 – 例如，分析您的租约、生成信件并帮助您整理证据。\n\n我们遵守泰国的PDPA规则。有关完整详细信息，请参阅leaseshield.asia上的隐私/PDPA政策。',
        answerJa: 'お客様の情報およびアップロードされた文書は、Lease Shieldサービスの提供のためにのみ使用されます – 例えば、リース契約の分析、レターの生成、証拠の整理をお手伝いするためです。\n\nタイのPDPA規則に従います。詳細については、leaseshield.asiaのプライバシー/PDPAポリシーをご覧ください。',
        answerKo: '귀하의 정보 및 업로드된 문서는 Lease Shield 서비스 제공을 위해서만 사용됩니다 – 예를 들어 임대 계약 분석、편지 생성 및 증거 정리 지원을 위해서입니다。\n\n우리는 태국의 PDPA 규칙을 따릅니다。전체 세부 정보는 leaseshield.asia의 개인정보 보호/PDPA 정책을 참조하세요。',
        answerRu: 'Мы используем вашу информацию и загруженные документы только для предоставления услуги Lease Shield – например、для анализа вашего договора、создания писем и помощи в организации доказательств。\n\nМы следуем правилам PDPA Таиланда。Полные подробности см。в нашей Политике конфиденциальности / PDPA на leaseshield.asia。'
      },
      {
        questionEn: 'Can I delete my data or account?',
        questionTh: 'ฉันสามารถลบข้อมูลหรือบัญชีของฉันได้หรือไม่?',
        questionZh: '我可以删除我的数据或帐户吗？',
        questionJa: 'データまたはアカウントを削除できますか？',
        questionKo: '내 데이터나 계정을 삭제할 수 있나요?',
        questionRu: 'Могу ли я удалить свои данные или аккаунт?',
        answerEn: 'Yes. You can request permanent deletion of your account and data at any time by emailing privacy@leaseshield.asia from your registered email address.\n\nAfter verification, your data will be deleted within 14 days, except where we must keep certain records for legal or accounting reasons. See the Data Deletion section on leaseshield.asia for details.',
        answerTh: 'ได้ คุณสามารถขอลบบัญชีและข้อมูลของคุณอย่างถาวรได้ตลอดเวลาโดยส่งอีเมลไปที่ privacy@leaseshield.asia จากอีเมลที่ลงทะเบียนของคุณ\n\nหลังจากตรวจสอบแล้ว ข้อมูลของคุณจะถูกลบภายใน 14 วัน ยกเว้นกรณีที่เราต้องเก็บบันทึกบางอย่างตามกฎหมายหรือเพื่อการบัญชี ดูส่วนการลบข้อมูลที่ leaseshield.asia สำหรับรายละเอียด',
        answerZh: '可以。您可以随时通过从注册的电子邮件地址向privacy@leaseshield.asia发送电子邮件来请求永久删除您的帐户和数据。\n\n验证后，您的数据将在14天内删除，除非我们必须出于法律或会计原因保留某些记录。有关详细信息，请参阅leaseshield.asia上的数据删除部分。',
        answerJa: 'はい。登録されたメールアドレスからprivacy@leaseshield.asiaにメールを送信することで、いつでもアカウントとデータの完全削除をリクエストできます。\n\n確認後、法律または会計上の理由で特定の記録を保持する必要がある場合を除き、14日以内にデータが削除されます。詳細については、leaseshield.asiaのデータ削除セクションを参照してください。',
        answerKo: '예。등록된 이메일 주소에서 privacy@leaseshield.asia로 이메일을 보내 언제든지 계정 및 데이터의 영구 삭제를 요청할 수 있습니다。\n\n확인 후 법적 또는 회계 목적으로 특정 기록을 보관해야 하는 경우를 제외하고 14일 이내에 데이터가 삭제됩니다。자세한 내용은 leaseshield.asia의 데이터 삭제 섹션을 참조하세요。',
        answerRu: 'Да。Вы можете запросить окончательное удаление вашей учётной записи и данных в любое время、отправив письмо на privacy@leaseshield.asia с зарегистрированного адреса электронной почты。\n\nПосле проверки ваши данные будут удалены в течение 14 дней、за исключением случаев、когда мы обязаны хранить определённые записи по юридическим или бухгалтерским причинам。Подробности см。в разделе «Удаление данных» на leaseshield.asia。'
      },
      {
        questionEn: 'Is Lease Shield a law firm?',
        questionTh: 'Lease Shield เป็นสำนักงานกฎหมายหรือไม่?',
        questionZh: 'Lease Shield是律师事务所吗？',
        questionJa: 'Lease Shieldは法律事務所ですか？',
        questionKo: 'Lease Shield는 법률 회사인가요?',
        questionRu: 'Lease Shield — это юридическая фирма?',
        answerEn: 'No. Lease Shield is not a law firm and does not provide legal advice or legal representation.\n\nWe offer tools, templates, and guidance to help you manage rental issues. For complex disputes, you may still need to consult a qualified lawyer.',
        answerTh: 'ไม่ใช่ Lease Shield ไม่ใช่สำนักงานกฎหมายและไม่ให้คำแนะนำทางกฎหมายหรือการตัวแทนทางกฎหมาย\n\nเรานำเสนอเครื่องมือ เทมเพลต และคำแนะนำเพื่อช่วยคุณจัดการปัญหาการเช่า สำหรับข้อพิพาทที่ซับซ้อน คุณอาจยังคงต้องปรึกษาทนายความที่มีคุณสมบัติ',
        answerZh: '不。Lease Shield不是律师事务所，不提供法律建议或法律代理。\n\n我们提供工具、模板和指导，帮助您管理租赁问题。对于复杂的纠纷，您可能仍需咨询合格的律师。',
        answerJa: 'いいえ。Lease Shieldは法律事務所ではなく、法的助言や法的代理を提供しません。\n\n賃貸問題の管理を支援するツール、テンプレート、ガイダンスを提供します。複雑な紛争の場合、適格な弁護士に相談する必要があるかもしれません。',
        answerKo: '아니요。Lease Shield는 법률 회사가 아니며 법률 자문이나 법적 대리를 제공하지 않습니다。\n\n임대 문제 관리를 돕기 위한 도구、템플릿 및 안내를 제공합니다。복잡한 분쟁의 경우 자격을 갖춘 변호사와 상담해야 할 수도 있습니다。',
        answerRu: 'Нет。Lease Shield не является юридической фирмой и не предоставляет юридические консультации или юридическое представительство。\n\nМы предлагаем инструменты、шаблоны и рекомендации、чтобы помочь вам управлять проблемами аренды。Для сложных споров вам может потребоваться консультация квалифицированного юриста。'
      },
      {
        questionEn: 'What is the refund policy for subscriptions and credits?',
        questionTh: 'นโยบายการคืนเงินสำหรับการสมัครสมาชิกและเครดิตคืออะไร?',
        questionZh: '订阅和积分的退款政策是什么？',
        questionJa: 'サブスクリプションとクレジットの返金ポリシーは何ですか？',
        questionKo: '구독 및 크레딧에 대한 환불 정책은 무엇인가요?',
        questionRu: 'Какова политика возврата средств для подписок и кредитов?',
        answerEn: 'Refunds are only available in limited cases, such as mistaken charges, auto-renewals you report within 48 hours, or confirmed technical failures.\n\nWe do not refund unused credits, change of mind, or partial subscription periods. For full details, see the Refund & Subscription Policy at leaseshield.asia.',
        answerTh: 'การคืนเงินมีเฉพาะในกรณีจำกัด เช่น การเรียกเก็บเงินผิดพลาด การต่ออายุอัตโนมัติที่คุณรายงานภายใน 48 ชั่วโมง หรือความล้มเหลวทางเทคนิคที่ยืนยัน\n\nเราไม่คืนเงินสำหรับเครดิตที่ไม่ได้ใช้ การเปลี่ยนใจ หรือระยะเวลาการสมัครสมาชิกบางส่วน สำหรับรายละเอียดเต็มรูปแบบ ดูนโยบายการคืนเงินและการสมัครสมาชิกที่ leaseshield.asia',
        answerZh: '退款仅在有限情况下可用，例如错误收费、您在48小时内报告的自动续订或确认的技术故障。\n\n我们不退还未使用的积分、改变主意或部分订阅期。有关完整详细信息，请参阅leaseshield.asia上的退款和订阅政策。',
        answerJa: '返金は、誤請求、48時間以内に報告された自動更新、または確認された技術的障害など、限られた場合にのみ利用可能です。\n\n未使用のクレジット、気が変わった場合、または部分的なサブスクリプション期間の返金はしません。詳細については、leaseshield.asiaの返金およびサブスクリプションポリシーをご覧ください。',
        answerKo: '환불은 잘못된 청구、48시간 이내에 보고한 자동 갱신 또는 확인된 기술적 오류와 같은 제한적인 경우에만 가능합니다。\n\n미사용 크레딧、마음이 바뀐 경우 또는 부분 구독 기간에 대해서는 환불하지 않습니다。전체 세부 정보는 leaseshield.asia의 환불 및 구독 정책을 참조하세요。',
        answerRu: 'Возврат средств доступен только в ограниченных случаях、таких как ошибочные списания、автопродления、о которых вы сообщили в течение 48 часов、или подтверждённые технические сбои。\n\nМы не возвращаем неиспользованные кредиты、в случае изменения решения или за частичные периоды подписки。Полные подробности см。в Политике возврата и подписки на leaseshield.asia。'
      }
    ]
  },
  technical: {
    icon: HelpCircle,
    color: '#6366F1',
    titleEn: 'App & Technical',
    titleTh: 'แอปและเทคนิค',
    titleZh: '应用和技术',
    titleJa: 'アプリと技術',
    titleKo: '앱 및 기술',
    titleRu: 'Приложение и техническая информация',
    questions: [
      {
        questionEn: 'Can I use Lease Shield on mobile?',
        questionTh: 'ฉันสามารถใช้ Lease Shield บนมือถือได้หรือไม่?',
        questionZh: '我可以在移动设备上使用Lease Shield吗？',
        questionJa: 'Lease Shieldをモバイルで使用できますか？',
        questionKo: 'Lease Shield를 모바일에서 사용할 수 있나요?',
        questionRu: 'Могу ли я использовать Lease Shield на мобильном устройстве?',
        answerEn: 'Yes — it is fully optimized for both mobile browsers and Android/iOS app wrappers.',
        answerTh: 'ได้ — ได้รับการปรับให้เหมาะสมอย่างเต็มที่สำหรับทั้งเบราว์เซอร์มือถือและแอป Android/iOS',
        answerZh: '是的 — 它已针对移动浏览器和Android/iOS应用程序进行了完全优化。',
        answerJa: 'はい — モバイルブラウザとAndroid/iOSアプリラッパーの両方に完全に最適化されています。',
        answerKo: '예 — 모바일 브라우저와 Android/iOS 앱 래퍼 모두에 완전히 최적화되어 있습니다。',
        answerRu: 'Да — оно полностью оптимизировано как для мобильных браузеров、так и для обёрток приложений Android/iOS。'
      },
      {
        questionEn: 'Why am I not receiving notifications?',
        questionTh: 'ทำไมฉันไม่ได้รับการแจ้งเตือน?',
        questionZh: '为什么我没有收到通知？',
        questionJa: '通知が届かないのはなぜですか？',
        questionKo: '알림을 받지 못하는 이유는 무엇인가요?',
        questionRu: 'Почему я не получаю уведомления?',
        answerEn: 'Enable push notifications and/or LINE alerts in your device settings and app preferences.',
        answerTh: 'เปิดใช้งานการแจ้งเตือนแบบพุชและ/หรือการแจ้งเตือน LINE ในการตั้งค่าอุปกรณ์และการตั้งค่าแอปของคุณ',
        answerZh: '在您的设备设置和应用偏好中启用推送通知和/或LINE提醒。',
        answerJa: 'デバイス設定とアプリの設定でプッシュ通知および/またはLINE通知を有効にしてください。',
        answerKo: '기기 설정 및 앱 환경설정에서 푸시 알림 및/또는 LINE 알림을 활성화하세요。',
        answerRu: 'Включите push-уведомления и/или LINE-уведомления в настройках устройства и настройках приложения。'
      },
      {
        questionEn: 'Is my data secure?',
        questionTh: 'ข้อมูลของฉันปลอดภัยหรือไม่?',
        questionZh: '我的数据安全吗？',
        questionJa: '私のデータは安全ですか？',
        questionKo: '내 데이터는 안전한가요?',
        questionRu: 'Мои данные в безопасности?',
        answerEn: 'All files and communication are encrypted.\n\nLease Shield never sells or shares your personal data.',
        answerTh: 'ไฟล์และการสื่อสารทั้งหมดได้รับการเข้ารหัส\n\nLease Shield ไม่เคยขายหรือแบ่งปันข้อมูลส่วนบุคคลของคุณ',
        answerZh: '所有文件和通信都经过加密。\n\nLease Shield永远不会出售或共享您的个人数据。',
        answerJa: 'すべてのファイルと通信は暗号化されています。\n\nLease Shieldはあなたの個人データを決して販売または共有しません。',
        answerKo: '모든 파일과 통신은 암호화됩니다。\n\nLease Shield는 귀하의 개인 데이터를 절대 판매하거나 공유하지 않습니다。',
        answerRu: 'Все файлы и коммуникации зашифрованы。\n\nLease Shield никогда не продаёт и не передаёт ваши личные данные。'
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