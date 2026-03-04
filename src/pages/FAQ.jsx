import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronUp, Shield, DollarSign, FileText, Scale, Lock, HelpCircle, Wallet, Star, Zap } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import AuthGuard from "../components/shared/AuthGuard";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
        answerEn: 'Lease Shield helps tenants and landlords prevent rental problems before they happen.\n\nIt provides lease checks, deposit tracking, evidence storage, reminders, and structured guidance — keeping records clear and relationships fair.',
        answerTh: 'Lease Shield ช่วยผู้เช่าและเจ้าของบ้านป้องกันปัญหาการเช่าก่อนเกิดขึ้น\n\nให้บริการตรวจสอบสัญญาเช่า ติดตามเงินมัดจำ จัดเก็บหลักฐาน การแจ้งเตือน และคำแนะนำที่มีโครงสร้าง — รักษาบันทึกที่ชัดเจนและความสัมพันธ์ที่เป็นธรรม',
        answerZh: 'Lease Shield帮助租户和房东在问题发生前预防租赁问题。\n\n它提供租约检查、押金追踪、证据存储、提醒和结构化指导 — 保持记录清晰，关系公平。',
        answerJa: 'Lease Shieldは、賃借人と貸主が賃貸問題を未然に防ぐのを支援します。\n\nリース契約チェック、敷金追跡、証拠保存、リマインダー、構造化されたガイダンスを提供 — 記録を明確に、関係を公正に保ちます。',
        answerKo: 'Lease Shield는 임차인과 임대인이 임대 문제를 사전에 예방할 수 있도록 돕습니다。\n\n임대 계약 확인、보증금 추적、증거 보관、알림 및 구조화된 안내를 제공 — 기록을 명확하게、관계를 공정하게 유지합니다。',
        answerRu: 'Lease Shield помогает арендаторам и арендодателям предотвращать проблемы с арендой до их возникновения。\n\nОн предоставляет проверку договоров、отслеживание депозитов、хранение доказательств、напоминания и структурированную помощь — сохраняя записи ясными、а отношения справедливыми。'
      },
      {
        questionEn: 'How does Lease Shield work?',
        questionTh: 'Lease Shield ทำงานอย่างไร?',
        questionZh: 'Lease Shield如何工作？',
        questionJa: 'Lease Shieldはどのように機能しますか？',
        questionKo: 'Lease Shield는 어떻게 작동하나요?',
        questionRu: 'Как работает Lease Shield?',
        answerEn: 'Upload your lease for structured analysis, track deposits with reminders, store evidence (documents and photos), and access guidance when issues arise.\n\nLease Shield supports both tenants and landlords by keeping records clear and helping prevent disputes before they escalate.',
        answerTh: 'อัปโหลดสัญญาเช่าเพื่อวิเคราะห์แบบมีโครงสร้าง ติดตามเงินมัดจำด้วยการแจ้งเตือน จัดเก็บหลักฐาน (เอกสารและรูปภาพ) และเข้าถึงคำแนะนำเมื่อเกิดปัญหา\n\nLease Shield สนับสนุนทั้งผู้เช่าและเจ้าของบ้านโดยรักษาบันทึกให้ชัดเจนและช่วยป้องกันข้อพิพาทก่อนที่จะบานปลาย',
        answerZh: '上传租约进行结构化分析，通过提醒追踪押金，存储证据（文件和照片），并在出现问题时获得指导。\n\nLease Shield通过保持记录清晰和帮助在争议升级前预防来支持租户和房东。',
        answerJa: 'リース契約をアップロードして構造化分析、リマインダー付きの敷金追跡、証拠保存（文書と写真）、問題発生時のガイダンスへのアクセスを受けます。\n\nLease Shieldは、記録を明確に保ち、紛争がエスカレートする前に予防を支援することで、賃借人と貸主の両方をサポートします。',
        answerKo: '구조화된 분석을 위해 임대 계약을 업로드하고、알림으로 보증금을 추적하고、증거（문서 및 사진）를 저장하고、문제 발생 시 안내에 액세스하세요。\n\nLease Shield는 기록을 명확하게 유지하고 분쟁이 확대되기 전에 예방하도록 도와 임차인과 임대인 모두를 지원합니다。',
        answerRu: 'Загрузите договор для структурированного анализа、отслеживайте депозиты с напоминаниями、храните доказательства（документы и фото）и получайте помощь при возникновении проблем。\n\nLease Shield поддерживает как арендаторов、так и арендодателей、сохраняя записи ясными и помогая предотвратить споры до их эскалации。'
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
        questionEn: 'What file types can I upload for a lease scan?',
        questionTh: 'ฉันสามารถอัปโหลดไฟล์ประเภทใดสำหรับการสแกนสัญญาเช่า?',
        questionZh: '我可以上传哪些文件类型进行租约扫描？',
        questionJa: 'リーススキャンにはどのファイルタイプをアップロードできますか？',
        questionKo: '임대 계약 스캔을 위해 어떤 파일 유형을 업로드할 수 있나요?',
        questionRu: 'Какие типы файлов я могу загрузить для сканирования договора?',
        answerEn: 'Lease Shield currently supports PDF files and clear images (PNG or JPG).\n\nWord documents (DOC/DOCX) are not supported at this time. If your lease is in Word format, please export or save it as a PDF before uploading.',
        answerTh: 'ปัจจุบัน Lease Shield รองรับไฟล์ PDF และรูปภาพที่ชัดเจน (PNG หรือ JPG)\n\nไม่รองรับเอกสาร Word (DOC/DOCX) ในขณะนี้ หากสัญญาเช่าของคุณอยู่ในรูปแบบ Word กรุณาส่งออกหรือบันทึกเป็น PDF ก่อนอัปโหลด',
        answerZh: 'Lease Shield当前支持PDF文件和清晰的图像（PNG或JPG）。\n\n目前不支持Word文档（DOC/DOCX）。如果您的租约是Word格式，请在上传前将其导出或保存为PDF。',
        answerJa: 'Lease ShieldはPDFファイルと鮮明な画像（PNGまたはJPG）をサポートしています。\n\nWord文書（DOC/DOCX）は現在サポートされていません。リース契約がWord形式の場合は、アップロード前にPDFとしてエクスポートまたは保存してください。',
        answerKo: 'Lease Shield는 현재 PDF 파일과 선명한 이미지（PNG 또는 JPG）를 지원합니다。\n\nWord 문서（DOC/DOCX）는 현재 지원되지 않습니다。임대 계약이 Word 형식인 경우 업로드하기 전에 PDF로 내보내거나 저장하세요。',
        answerRu: 'Lease Shield в настоящее время поддерживает PDF-файлы и чёткие изображения（PNG или JPG）。\n\nДокументы Word（DOC/DOCX）в настоящее время не поддерживаются。Если ваш договор в формате Word、пожалуйста、экспортируйте или сохраните его как PDF перед загрузкой。'
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
        answerEn: 'Lite → 6 scans per year\nProtect → 12 scans per year\nSecure → 50 scans per year — very generous for most rental situations',
        answerTh: 'Lite → 6 ครั้ง/ปี\nProtect → 12 ครั้ง/ปี\nSecure → 50 ครั้ง/ปี — เพียงพอสำหรับการเช่าส่วนใหญ่',
        answerZh: 'Lite → 每年6次\nProtect → 每年12次\nSecure → 每年50次 — 适合大多数租赁情况',
        answerJa: 'Lite → 年6回\nProtect → 年12回\nSecure → 年50回 — ほとんどの賃貸状況に十分',
        answerKo: 'Lite → 연간 6회\nProtect → 연간 12회\nSecure → 연간 50회 — 대부분의 임대 상황에 충분',
        answerRu: 'Lite → 6 раз в год\nProtect → 12 раз в год\nSecure → 50 раз в год — достаточно для большинства арендных ситуаций'
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
        questionEn: 'How does billing work — monthly or annual?',
        questionTh: 'การเรียกเก็บเงินทำงานอย่างไร — รายเดือนหรือรายปี?',
        questionZh: '计费如何运作 — 按月还是按年？',
        questionJa: '請求はどのように機能しますか — 月額または年額？',
        questionKo: '청구는 어떻게 작동합니까 — 월별 또는 연간?',
        questionRu: 'Как работает оплата — ежемесячно или ежегодно?',
        answerEn: 'Plans are displayed as monthly prices. You can choose to pay monthly or annually at checkout. Annual plans include a 17% discount and are offered as the best-value option.',
        answerTh: 'แผนจะแสดงเป็นราคารายเดือน คุณสามารถเลือกจ่ายรายเดือนหรือรายปีได้ที่หน้าชำระเงิน แผนรายปีมีส่วนลด 17% และเป็นตัวเลือกที่คุ้มค่าที่สุด',
        answerZh: '计划显示为每月价格。您可以在结账时选择按月或按年付款。年度计划享有 17% 折扣，是最具价值的选择。',
        answerJa: 'プランは月額料金として表示されます。チェックアウト時に月払いまたは年払いを選択できます。年間プランには17%割引が含まれており、最もお得なオプションとして提供されています。',
        answerKo: '플랜은 월별 가격으로 표시됩니다。결제 시 월별 또는 연간 결제를 선택할 수 있습니다。연간 플랜에는 17% 할인이 포함되어 있으며 최고의 가치 옵션으로 제공됩니다。',
        answerRu: 'Планы отображаются в виде ежемесячных цен。Вы можете выбрать ежемесячную или годовую оплату при оформлении заказа。Годовые планы включают скидку 17% и предлагаются как вариант с лучшей ценностью。'
      },
      {
        questionEn: 'What is the One-Time Lease Scan?',
        questionTh: 'การสแกนสัญญาเช่าครั้งเดียวคืออะไร?',
        questionZh: '一次性租约扫描是什么？',
        questionJa: '一回限りリーススキャンとは何ですか？',
        questionKo: '일회성 임대 계약 스캔이란 무엇인가요?',
        questionRu: 'Что такое однократное сканирование договора?',
        answerEn: 'A one-time service for ฿590. You receive one lease upload, a structured review summary, a risk score, key risk highlights, recommended actions, and a letter template if needed.\n\nThis option is ideal if you want a quick check without committing to an ongoing plan.',
        answerTh: 'บริการครั้งเดียวในราคา ฿590 คุณจะได้รับการอัปโหลดสัญญาเช่าหนึ่งครั้ง สรุปการตรวจสอบที่มีโครงสร้าง คะแนนความเสี่ยง ความเสี่ยงสำคัญ การดำเนินการที่แนะนำ และเทมเพลตจดหมายหากจำเป็น\n\nตัวเลือกนี้เหมาะถ้าคุณต้องการตรวจสอบอย่างรวดเร็วโดยไม่ผูกมัดกับแผนต่อเนื่อง',
        answerZh: '฿590的一次性服务。您将收到一次租约上传、结构化审查摘要、风险评分、关键风险重点、建议行动和所需的信件模板。\n\n如果您想要快速检查而不承诺持续计划，此选项非常理想。',
        answerJa: '฿590の一回限りサービス。1回のリースアップロード、構造化されたレビュー要約、リスクスコア、主要リスクのハイライト、推奨アクション、必要に応じてレターテンプレートを受け取ります。\n\nこのオプションは、継続的なプランにコミットせずに迅速なチェックが必要な場合に最適です。',
        answerKo: '฿590의 일회성 서비스입니다。한 번의 임대 계약 업로드、구조화된 검토 요약、위험 점수、주요 위험 강조、권장 조치 및 필요한 경우 편지 템플릿을 받습니다。\n\n지속적인 플랜에 커밋하지 않고 빠른 확인을 원하는 경우 이 옵션이 이상적입니다。',
        answerRu: 'Одноразовая услуга за ฿590。Вы получаете одну загрузку договора、структурированное резюме обзора、оценку риска、ключевые риски、рекомендуемые действия и шаблон письма при необходимости。\n\nЭтот вариант идеален、если вы хотите быструю проверку без обязательств по постоянному плану。'
      },
      {
        questionEn: 'What plans are available?',
        questionTh: 'มีแผนอะไรบ้าง?',
        questionZh: '有哪些计划？',
        questionJa: 'どのようなプランがありますか？',
        questionKo: '어떤 플랜이 있나요?',
        questionRu: 'Какие планы доступны?',
        answerEn: 'Explorer (Free)\n• 1 lifetime lease scan\n• Basic risk score preview\n• 100 MB storage\n\nLite\n฿158/month — 17% OFF (paid annually) or ฿190/month\n• 6 lease scans/year\n• Email alerts\n• 3 letter credits\n• 1GB storage\n\nProtect\n฿325/month — 17% OFF (paid annually) or ฿390/month\n• Everything in Lite\n• 12 scans/year\n• LINE alerts\n• 5 letter credits\n• 5GB storage\n\nSecure\n฿825/month — 17% OFF (paid annually) or ฿990/month\n• Everything in Protect\n• 50 lease scans/year\n• 50 letter credits/year\n• 20GB storage\n• 1 Resolve case/year (included)\n• 10 Fast Track cases/year\n• Premium support',
        answerTh: 'Explorer (ฟรี)\n• 1 การสแกนตลอดชีพ\n• ดูคะแนนความเสี่ยงเบื้องต้น\n• พื้นที่ 100 MB\n\nLite\n฿158/เดือน — ลด 17% (ชำระรายปี) หรือ ฿190/เดือน\n• 6 การสแกน/ปี\n• อีเมลแจ้งเตือน\n• 3 เครดิตจดหมาย\n• พื้นที่ 1GB\n\nProtect\n฿325/เดือน — ลด 17% (ชำระรายปี) หรือ ฿390/เดือน\n• ทุกอย่างใน Lite\n• 12 การสแกน/ปี\n• LINE แจ้งเตือน\n• 5 เครดิตจดหมาย\n• พื้นที่ 5GB\n\nSecure\n฿825/เดือน — ลด 17% (ชำระรายปี) หรือ ฿990/เดือน\n• ทุกอย่างใน Protect\n• 50 การสแกนสัญญา/ปี\n• 50 เครดิตจดหมาย/ปี\n• พื้นที่ 20GB\n• 1 คดี Resolve/ปี (รวม)\n• 10 Fast Track/ปี\n• การสนับสนุนพรีเมียม',
        answerZh: 'Explorer（免费）\n• 1次终身租约扫描\n• 基本风险评分预览\n• 100 MB存储\n\nLite\n฿158/月 — 17% 折扣（按年支付）或 ฿190/月\n• 每年6次租约扫描\n• 电子邮件提醒\n• 3个信件积分\n• 1GB存储\n\nProtect\n฿325/月 — 17% 折扣（按年支付）或 ฿390/月\n• Lite所有功能\n• 每年12次扫描\n• LINE提醒\n• 5个信件积分\n• 5GB存储\n\nSecure\n฿825/月 — 17% 折扣（按年支付）或 ฿990/月\n• Protect所有功能\n• 无限扫描\n• 每月50个信件积分（每30天自动刷新）\n• 20GB存储\n• 每年1个Resolve案件（包含）\n• 无限FastTrack（免费）',
        answerJa: 'Explorer（無料）\n• 1回の生涯リーススキャン\n• 基本リスクスコアプレビュー\n• 100 MBストレージ\n\nLite\n฿158/月 — 17% OFF（年払い）または ฿190/月\n• 年6回リーススキャン\n• メールアラート\n• 3レタークレジット\n• 1GBストレージ\n\nProtect\n฿325/月 — 17% OFF（年払い）または ฿390/月\n• Liteの全機能\n• 年12回スキャン\n• LINE通知\n• 5レタークレジット\n• 5GBストレージ\n\nSecure\n฿825/月 — 17% OFF（年払い）または ฿990/月\n• Protectの全機能\n• 無制限スキャン\n• 月50レタークレジット（30日ごとに自動更新）\n• 20GBストレージ\n• 年1件Resolveケース（含）\n• 無制限FastTrack（無料）',
        answerKo: 'Explorer（무료）\n• 1회 평생 임대 계약 스캔\n• 기본 위험 점수 미리보기\n• 100 MB 저장소\n\nLite\n฿158/월 — 17% OFF（연간 결제）또는 ฿190/월\n• 연간 6회 임대 계약 스캔\n• 이메일 알림\n• 3개 레터 크레딧\n• 1GB 저장소\n\nProtect\n฿325/월 — 17% OFF（연간 결제）또는 ฿390/월\n• Lite 모든 기능\n• 연간 12회 스캔\n• LINE 알림\n• 5개 레터 크레딧\n• 5GB 저장소\n\nSecure\n฿825/월 — 17% OFF（연간 결제）또는 ฿990/월\n• Protect 모든 기능\n• 무제한 스캔\n• 월 50개 레터 크레딧（30일마다 자동 갱신）\n• 20GB 저장소\n• 연간 1건 Resolve 케이스（포함）\n• 무제한 FastTrack（무료）',
        answerRu: 'Explorer（бесплатно）\n• 1 сканирование договора навсегда\n• Базовый просмотр рисков\n• 100 МБ хранилище\n\nLite\n฿158/месяц — 17% OFF（годовая оплата）или ฿190/месяц\n• 6 сканирований договора/год\n• Email-уведомления\n• 3 кредита писем\n• 1GB хранилище\n\nProtect\n฿325/месяц — 17% OFF（годовая оплата）или ฿390/месяц\n• Всё из Lite\n• 12 сканирований/год\n• LINE-уведомления\n• 5 кредитов писем\n• 5GB хранилище\n\nSecure\n฿825/месяц — 17% OFF（годовая оплата）или ฿990/месяц\n• Всё из Protect\n• Безлимит сканирований\n• 50 кредитов писем/месяц（автообновление каждые 30 дней）\n• 20GB хранилище\n• 1 дело Resolve/год（включено）\n• Безлимит FastTrack（бесплатно）'
      },
      {
        questionEn: 'How is the One-Time Scan different from subscriptions?',
        questionTh: 'การสแกนครั้งเดียวต่างจากการสมัครสมาชิกอย่างไร?',
        questionZh: '一次性扫描与订阅有何不同？',
        questionJa: '一回限りスキャンとサブスクリプションの違いは何ですか？',
        questionKo: '일회성 스캔과 구독의 차이점은 무엇인가요?',
        questionRu: 'Чем однократное сканирование отличается от подписок?',
        answerEn: 'The <a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">One-Time Lease Scan</a> (฿590) is a single check with no ongoing benefits.\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">Subscription plans</a> (Lite/Protect/Secure) include multiple scans per year, deposit tracking, automated reminders, evidence vault, and ongoing support. Best if you want full protection throughout your tenancy.',
        answerTh: '<a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">การสแกนสัญญาเช่าครั้งเดียว</a> (฿590) เป็นการตรวจสอบเพียงครั้งเดียวโดยไม่มีสิทธิประโยชน์ต่อเนื่อง\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">แผนสมาชิก</a> (Lite/Protect/Secure) รวมการสแกนหลายครั้งต่อปี การติดตามเงินมัดจำ การแจ้งเตือนอัตโนมัติ คลังหลักฐาน และการสนับสนุนอย่างต่อเนื่อง เหมาะสำหรับการป้องกันเต็มรูปแบบตลอดการเช่า',
        answerZh: '<a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">一次性租约扫描</a>（฿590）是一次检查，无持续福利。\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">订阅计划</a>（Lite/Protect/Secure）包括每年多次扫描、押金追踪、自动提醒、证据库和持续支持。如果您希望在整个租期获得全面保护，订阅最合适。',
        answerJa: '<a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">一回限りリーススキャン</a>（฿590）は、継続的な特典のない単一チェックです。\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">サブスクリプションプラン</a>（Lite/Protect/Secure）には、年間複数回のスキャン、敷金追跡、自動リマインダー、証拠保管庫、および継続的なサポートが含まれます。賃貸期間中の完全な保護が必要な場合に最適です。',
        answerKo: '<a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">일회성 임대 계약 스캔</a>（฿590）은 지속적인 혜택이 없는 단일 확인입니다。\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">구독 플랜</a>（Lite/Protect/Secure）에는 연간 여러 번의 스캔、보증금 추적、자동 알림、증거 보관함 및 지속적인 지원이 포함됩니다。임대 기간 동안 완전한 보호를 원하시면 구독이 가장 적합합니다。',
        answerRu: '<a href="#" class="one-time-scan-link font-semibold underline" style="color: #0C3B2E;">Однократное сканирование договора</a>（฿590）— это одна проверка без постоянных льгот。\n\n<a href="#" class="subscription-plans-link font-semibold underline" style="color: #0C3B2E;">Планы подписки</a>（Lite/Protect/Secure）включают несколько сканирований в год、отслеживание депозитов、автоматические напоминания、хранилище доказательств и постоянную поддержку。Лучший вариант для полной защиты на весь период аренды。'
      },
      {
        questionEn: 'Can I change or cancel my plan later?',
        questionTh: 'ฉันสามารถเปลี่ยนหรือยกเลิกแผนภายหลังได้หรือไม่?',
        questionZh: '我可以稍后更改或取消我的计划吗？',
        questionJa: '後でプランを変更またはキャンセルできますか？',
        questionKo: '나중에 플랜을 변경하거나 취소할 수 있나요?',
        questionRu: 'Могу ли я изменить или отменить свой план позже?',
        answerEn: 'Yes. You can upgrade, downgrade, or cancel your plan at any time from <a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">your account</a>.',
        answerTh: 'ได้ คุณสามารถอัปเกรด ดาวน์เกรด หรือยกเลิกแผนของคุณได้ทุกเมื่อจาก<a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">บัญชีของคุณ</a>',
        answerZh: '可以。您可以随时从<a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">您的帐户</a>升级、降级或取消您的计划。',
        answerJa: 'はい。<a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">アカウント</a>からいつでもプランをアップグレード、ダウングレード、またはキャンセルできます。',
        answerKo: '예。<a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">계정</a>에서 언제든지 플랜을 업그레이드、다운그레이드 또는 취소할 수 있습니다。',
        answerRu: 'Да。Вы можете обновить、понизить или отменить свой план в любое время из <a href="#" class="account-plans-link font-semibold underline" style="color: #0C3B2E;">вашего аккаунта</a>。'
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
        answerEn: 'You can change your language anytime using the <a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">language selector</a> in the app menu.',
        answerTh: 'คุณสามารถเปลี่ยนภาษาได้ทุกเมื่อโดยใช้<a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">ตัวเลือกภาษา</a>ในเมนูแอป',
        answerZh: '您可以随时使用应用菜单中的<a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">语言选择器</a>更改语言。',
        answerJa: 'アプリメニューの<a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">言語セレクター</a>を使用していつでも言語を変更できます。',
        answerKo: '앱 메뉴의 <a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">언어 선택기</a>를 사용하여 언제든지 언어를 변경할 수 있습니다。',
        answerRu: 'Вы можете изменить язык в любое время、используя <a href="#" class="language-selector-link font-semibold underline" style="color: #0C3B2E;">переключатель языка</a> в меню приложения。'
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
  resolve: {
    icon: Scale,
    color: '#DC2626',
    titleEn: 'Resolve Service',
    titleTh: 'บริการ Resolve',
    titleZh: 'Resolve服务',
    titleJa: 'Resolveサービス',
    titleKo: 'Resolve 서비스',
    titleRu: 'Сервис Resolve',
    questions: [
      {
        questionEn: 'How long does case review take?',
        questionTh: 'การตรวจสอบคดีใช้เวลานานเท่าไหร่?',
        questionZh: '案件审查需要多长时间？',
        questionJa: 'ケースレビューにはどのくらいかかりますか？',
        questionKo: '사례 검토는 얼마나 걸리나요?',
        questionRu: 'Сколько времени занимает рассмотрение дела?',
        answerEn: 'We offer two review levels:\n\n📋 **Standard Review**: 2-3 business days\n⚡ **Fast Track Review**: 1 business day (priority service)\n\nBusiness days are Monday-Friday, excluding Thai public holidays.',
        answerTh: 'เรามีการตรวจสอบ 2 ระดับ:\n\n📋 **การตรวจสอบมาตรฐาน**: 2-3 วันทำการ\n⚡ **การตรวจสอบแบบเร่งด่วน**: 1 วันทำการ (บริการเร่งด่วน)\n\nวันทำการคือวันจันทร์-ศุกร์ ไม่รวมวันหยุดนักขัตฤกษ์',
        answerZh: '我们提供两个审查级别：\n\n📋 **标准审查**：2-3个工作日\n⚡ **快速审查**：1个工作日（优先服务）\n\n工作日为周一至周五，不包括泰国公共假期。',
        answerJa: '2つのレビューレベルを提供しています：\n\n📋 **標準レビュー**：2-3営業日\n⚡ **ファストトラックレビュー**：1営業日（優先サービス）\n\n営業日は月曜日から金曜日で、タイの祝日は除きます。',
        answerKo: '두 가지 검토 수준을 제공합니다:\n\n📋 **표준 검토**: 2-3영업일\n⚡ **빠른 검토**: 1영업일 (우선 서비스)\n\n영업일은 월요일~금요일이며 태국 공휴일은 제외됩니다.',
        answerRu: 'Мы предлагаем два уровня проверки:\n\n📋 **Стандартная проверка**: 2-3 рабочих дня\n⚡ **Приоритетная проверка**: 1 рабочий день (приоритетная услуга)\n\nРабочие дни — понедельник-пятница, без тайских государственных праздников.'
      },
      {
        questionEn: 'What is Fast Track review?',
        questionTh: 'การตรวจสอบแบบเร่งด่วนคืออะไร?',
        questionZh: '什么是快速审查？',
        questionJa: 'ファストトラックレビューとは何ですか？',
        questionKo: '빠른 검토란 무엇인가요?',
        questionRu: 'Что такое приоритетная проверка?',
        answerEn: 'Fast Track is our priority review service. Your case receives expedited review by our consultants within 1 business day, compared to 2-3 business days for standard review. It\'s ideal when you need urgent guidance on your rental dispute.',
        answerTh: 'เร่งด่วนคือบริการตรวจสอบลำดับความสำคัญของเรา คดีของคุณจะได้รับการตรวจสอบอย่างเร่งด่วนโดยที่ปรึกษาภายใน 1 วันทำการ เทียบกับ 2-3 วันทำการสำหรับการตรวจสอบมาตรฐาน เหมาะสมเมื่อคุณต้องการคำแนะนำเร่งด่วนเกี่ยวกับข้อพิพาทการเช่า',
        answerZh: '快速审查是我们的优先审查服务。您的案件将在1个工作日内由我们的顾问进行加急审查，而标准审查需要2-3个工作日。当您需要紧急指导处理租赁纠纷时，这是理想的选择。',
        answerJa: 'ファストトラックは、優先レビューサービスです。標準レビューの2-3営業日に対し、1営業日以内にコンサルタントがケースの迅速なレビューを行います。賃貸紛争について緊急のガイダンスが必要な場合に最適です。',
        answerKo: '빠른 검토는 우선 검토 서비스입니다. 표준 검토의 2-3영업일에 비해 1영업일 이내에 컨설턴트가 사례를 신속하게 검토합니다. 임대 분쟁에 대한 긴급 안내가 필요할 때 이상적입니다.',
        answerRu: 'Приоритетная проверка — это наша услуга ускоренного рассмотрения. Ваше дело рассматривается консультантами в течение 1 рабочего дня, по сравнению с 2-3 рабочими днями для стандартной проверки. Идеально, когда вам нужна срочная помощь по арендному спору.'
      },
      {
        questionEn: 'What are business days?',
        questionTh: 'วันทำการคืออะไร?',
        questionZh: '什么是工作日？',
        questionJa: '営業日とは何ですか？',
        questionKo: '영업일이란 무엇인가요?',
        questionRu: 'Что такое рабочие дни?',
        answerEn: 'Business days are Monday through Friday, excluding Thai public holidays.\n\nExamples:\n• Submit Friday → Standard review ready Monday-Wednesday\n• Submit Friday → Fast Track review ready Monday\n• Submit Saturday → Same as submitting Monday',
        answerTh: 'วันทำการคือวันจันทร์ถึงวันศุกร์ ไม่รวมวันหยุดนักขัตฤกษ์ไทย\n\nตัวอย่าง:\n• ส่งวันศุกร์ → การตรวจสอบมาตรฐานพร้อมวันจันทร์-วันพุธ\n• ส่งวันศุกร์ → การตรวจสอบเร่งด่วนพร้อมวันจันทร์\n• ส่งวันเสาร์ → เหมือนส่งวันจันทร์',
        answerZh: '工作日是周一到周五，不包括泰国公共假期。\n\n示例：\n• 周五提交 → 标准审查周一至周三完成\n• 周五提交 → 快速审查周一完成\n• 周六提交 → 等同于周一提交',
        answerJa: '営業日は月曜日から金曜日までで、タイの祝日は除きます。\n\n例：\n• 金曜日に提出 → 標準レビューは月曜日〜水曜日に完了\n• 金曜日に提出 → ファストトラックレビューは月曜日に完了\n• 土曜日に提出 → 月曜日に提出したのと同じ',
        answerKo: '영업일은 월요일부터 금요일까지이며 태국 공휴일은 제외됩니다。\n\n예시：\n• 금요일 제출 → 표준 검토 월요일~수요일 완료\n• 금요일 제출 → 빠른 검토 월요일 완료\n• 토요일 제출 → 월요일 제출과 동일',
        answerRu: 'Рабочие дни — с понедельника по пятницу, без тайских государственных праздников。\n\nПримеры：\n• Подача в пятницу → Стандартная проверка готова в понедельник-среду\n• Подача в пятницу → Приоритетная проверка готова в понедельник\n• Подача в субботу → То же, что подать в понедельник'
      },
      {
        questionEn: 'How much does Resolve cost?',
        questionTh: 'Resolve มีค่าใช้จ่ายเท่าไหร่?',
        questionZh: 'Resolve的费用是多少？',
        questionJa: 'Resolveの費用はいくらですか？',
        questionKo: 'Resolve 비용은 얼마인가요?',
        questionRu: 'Сколько стоит Resolve?',
        answerEn: '• Public rate: ฿5,000 per case (no subscription required)\n• Member rate: ฿3,500 per case (Protect/Secure subscribers after 30 days)\n• Free: 1 case/year for Annual Secure subscribers\n\nAll rates include standard review (2-3 business days). Fast Track (1 business day) is available as an upgrade.',
        answerTh: '• ราคาทั่วไป: ฿5,000 ต่อคดี (ไม่ต้องสมัครสมาชิก)\n• ราคาสมาชิก: ฿3,500 ต่อคดี (สมาชิก Protect/Secure หลัง 30 วัน)\n• ฟรี: 1 คดี/ปี สำหรับสมาชิก Annual Secure\n\nทุกราคารวมการตรวจสอบมาตรฐาน (2-3 วันทำการ) เร่งด่วน (1 วันทำการ) เป็นตัวเลือกอัปเกรด',
        answerZh: '• 公开价格: 每案฿5,000（无需订阅）\n• 会员价格: 每案฿3,500（Protect/Secure订阅者30天后）\n• 免费: 年度Secure订阅者每年1案\n\n所有价格包含标准审查（2-3个工作日）。快速审查（1个工作日）可作为升级选项。',
        answerJa: '• 公開価格: ケースごとに฿5,000（サブスクリプション不要）\n• 会員価格: ケースごとに฿3,500（Protect/Secure会員30日後）\n• 無料: Annual Secure会員は年1件\n\nすべての料金に標準レビュー（2-3営業日）が含まれます。ファストトラック（1営業日）はアップグレードオプションです。',
        answerKo: '• 공개 가격: 사례당 ฿5,000（구독 불필요）\n• 회원 가격: 사례당 ฿3,500（Protect/Secure 구독자 30일 후）\n• 무료: 연간 Secure 구독자 연 1건\n\n모든 가격에는 표준 검토（2-3영업일）가 포함됩니다. 빠른 검토（1영업일）는 업그레이드 옵션입니다。',
        answerRu: '• Публичный тариф: ฿5,000 за дело（подписка не требуется）\n• Тариф участника: ฿3,500 за дело（участники Protect/Secure после 30 дней）\n• Бесплатно: 1 дело/год для годовых подписчиков Secure\n\nВсе тарифы включают стандартную проверку（2-3 рабочих дня）. Приоритетная проверка（1 рабочий день）доступна как обновление。'
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
        answerEn: 'Share your personal referral link. When your friend subscribes and completes 3 consecutive months of paid subscription, you receive account credit automatically.\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Learn more about referrals →</a>',
        answerTh: 'แชร์ลิงก์แนะนำส่วนตัวของคุณ เมื่อเพื่อนของคุณสมัครสมาชิกและชำระครบ 3 เดือนติดต่อกัน คุณจะได้รับเครดิตบัญชีโดยอัตโนมัติ\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">เรียนรู้เพิ่มเติมเกี่ยวกับการแนะนำ →</a>',
        answerZh: '分享您的个人推荐链接。当您的朋友订阅并完成3个月连续付费订阅时，您将自动获得帐户积分。\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">了解更多推荐信息 →</a>',
        answerJa: '個人紹介リンクを共有します。友達がサブスクリプションを登録し、3ヶ月間連続して支払いを完了すると、自動的にアカウントクレジットを受け取ります。\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">紹介についてもっと詳しく →</a>',
        answerKo: '개인 추천 링크를 공유하세요。친구가 구독하고 3개월 연속 유료 구독을 완료하면 자동으로 계정 크레딧을 받습니다。\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">추천에 대해 자세히 알아보기 →</a>',
        answerRu: 'Поделитесь своей личной реферальной ссылкой。Когда ваш друг подпишется и завершит 3 месяца подряд платной подписки、вы автоматически получите кредит на счёт。\n\n<a href="https://www.leaseshield.asia" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Узнать больше о рефералах →</a>'
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
        answerEn: 'You earn the value of the plan your friend subscribes to, after they complete 3 consecutive months.\n\nExample: Friend joins Protect and completes 3 months → you receive ฿390 credit.',
        answerTh: 'คุณจะได้รับมูลค่าของแผนที่เพื่อนของคุณสมัคร หลังจากพวกเขาชำระครบ 3 เดือนติดต่อกัน\n\nตัวอย่าง: เพื่อนเข้าร่วม Protect และชำระครบ 3 เดือน → คุณได้รับเครดิต ฿390',
        answerZh: '您获得朋友订阅的计划价值，在他们完成连续3个月后。\n\n例如：朋友加入Protect并完成3个月 → 您获得฿390积分。',
        answerJa: '友達が購読するプランの価値を、3ヶ月連続完了後に獲得します。\n\n例：友達がProtectに参加し3ヶ月完了 → ฿390のクレジットを受け取ります。',
        answerKo: '친구가 구독하는 플랜의 가치를 연속 3개월 완료 후에 얻습니다。\n\n예：친구가 Protect에 가입하고 3개월 완료 → ฿390 크레딧을 받습니다。',
        answerRu: 'Вы зарабатываете стоимость плана、на который подписывается ваш друг、после того как они завершат 3 месяца подряд。\n\nПример：друг присоединяется к Protect и завершает 3 месяца → вы получаете ฿390 кредита。'
      },
      {
        questionEn: 'Where do I find my referral link?',
        questionTh: 'ฉันจะหาลิงก์แนะนำของฉันได้ที่ไหน?',
        questionZh: '我在哪里可以找到我的推荐链接？',
        questionJa: '紹介リンクはどこで見つかりますか？',
        questionKo: '추천 링크는 어디에서 찾을 수 있나요?',
        questionRu: 'Где я могу найти мою реферальную ссылку?',
        answerEn: 'You can find your referral link in your <a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">Account page</a> under "Referral Program."',
        answerTh: 'คุณสามารถหาลิงก์แนะนำของคุณได้ใน<a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">หน้าบัญชี</a>ของคุณภายใต้ "โปรแกรมแนะนำเพื่อน"',
        answerZh: '您可以在<a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">帐户页面</a>的"推荐计划"下找到您的推荐链接。',
        answerJa: '<a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">アカウントページ</a>の「紹介プログラム」の下に紹介リンクがあります。',
        answerKo: '<a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">계정 페이지</a>의 "추천 프로그램" 아래에서 추천 링크를 찾을 수 있습니다。',
        answerRu: 'Вы можете найти свою реферальную ссылку на <a href="#" class="account-referral-link font-semibold underline" style="color: #0C3B2E;">странице аккаунта</a> в разделе "Реферальная программа"。'
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
        answerEn: 'We use your information and uploaded documents only to deliver the Lease Shield service, such as analysing leases, generating documents, and organising evidence.\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Privacy Policy →</a>',
        answerTh: 'เราใช้ข้อมูลและเอกสารที่อัปโหลดของคุณเพื่อให้บริการ Lease Shield เท่านั้น เช่น การวิเคราะห์สัญญาเช่า การสร้างเอกสาร และการจัดระเบียบหลักฐาน\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">นโยบายความเป็นส่วนตัว →</a>',
        answerZh: '我们仅使用您的信息和上传的文档来提供Lease Shield服务，例如分析租约、生成文档和组织证据。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">隐私政策 →</a>',
        answerJa: 'お客様の情報およびアップロードされた文書は、Lease Shieldサービスの提供（リース契約の分析、文書の生成、証拠の整理など）のためにのみ使用されます。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">プライバシーポリシー →</a>',
        answerKo: '귀하의 정보 및 업로드된 문서는 임대 계약 분석、문서 생성 및 증거 정리와 같은 Lease Shield 서비스 제공을 위해서만 사용됩니다。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">개인정보 보호정책 →</a>',
        answerRu: 'Мы используем вашу информацию и загруженные документы только для предоставления услуги Lease Shield、такие как анализ договоров、создание документов и организация доказательств。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Политика конфиденциальности →</a>'
      },
      {
        questionEn: 'Can I delete my data or account?',
        questionTh: 'ฉันสามารถลบข้อมูลหรือบัญชีของฉันได้หรือไม่?',
        questionZh: '我可以删除我的数据或帐户吗？',
        questionJa: 'データまたはアカウントを削除できますか？',
        questionKo: '내 데이터나 계정을 삭제할 수 있나요?',
        questionRu: 'Могу ли я удалить свои данные или аккаунт?',
        answerEn: 'You may request account or data deletion at any time by emailing <a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>.\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Privacy Policy →</a>',
        answerTh: 'คุณสามารถขอลบบัญชีหรือข้อมูลได้ตลอดเวลาโดยส่งอีเมลไปที่ <a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">นโยบายความเป็นส่วนตัว →</a>',
        answerZh: '您可以随时通过发送电子邮件至<a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>请求删除帐户或数据。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">隐私政策 →</a>',
        answerJa: '<a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>にメールを送信することで、いつでもアカウントまたはデータの削除をリクエストできます。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">プライバシーポリシー →</a>',
        answerKo: '<a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>로 이메일을 보내 언제든지 계정 또는 데이터 삭제를 요청할 수 있습니다。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">개인정보 보호정책 →</a>',
        answerRu: 'Вы можете запросить удаление учётной записи или данных в любое время、отправив письмо на <a href="mailto:privacy@leaseshield.asia" class="font-semibold underline" style="color: #0C3B2E;">privacy@leaseshield.asia</a>。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Политика конфиденциальности →</a>'
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
        answerEn: 'Refunds are only available in limited cases such as mistaken charges, reported auto-renewals within 48 hours, or confirmed technical failures.\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Refund Policy →</a>',
        answerTh: 'การคืนเงินมีเฉพาะในกรณีจำกัด เช่น การเรียกเก็บเงินผิดพลาด การรายงานการต่ออายุอัตโนมัติภายใน 48 ชั่วโมง หรือความล้มเหลวทางเทคนิคที่ยืนยัน\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">นโยบายการคืนเงิน →</a>',
        answerZh: '退款仅在有限情况下可用，例如错误收费、48小时内报告的自动续订或确认的技术故障。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">退款政策 →</a>',
        answerJa: '返金は、誤請求、48時間以内に報告された自動更新、または確認された技術的障害など、限られた場合にのみ利用可能です。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">返金ポリシー →</a>',
        answerKo: '환불은 잘못된 청구、48시간 이내에 보고된 자동 갱신 또는 확인된 기술적 오류와 같은 제한적인 경우에만 가능합니다。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">환불 정책 →</a>',
        answerRu: 'Возврат средств доступен только в ограниченных случаях、таких как ошибочные списания、о которых сообщено в течение 48 часов、или подтверждённые технические сбои。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Политика возврата →</a>'
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
        answerEn: 'Yes. Lease Shield is available as a native app on <a href="https://play.google.com/store/apps/details?id=asia.leaseshield.app" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Google Play Store</a> for Android devices. The iOS app is coming soon to the Apple App Store.\n\nYou can also use Lease Shield directly in your mobile browser on any device.',
        answerTh: 'ได้ Lease Shield ทำงานในเบราว์เซอร์บนอุปกรณ์ใดก็ได้\n\nสำหรับการเข้าถึงอย่างรวดเร็ว คุณสามารถเพิ่มไปยังหน้าจอหลักจากเมนูเบราว์เซอร์ (iOS Safari หรือ Android Chrome) — ไม่ต้องดาวน์โหลด',
        answerZh: '是的。Lease Shield直接在任何设备的浏览器中运行。\n\n为了快速访问，您可以从浏览器菜单（iOS Safari或Android Chrome）将其添加到主屏幕 — 无需下载。',
        answerJa: 'はい。Lease Shieldは任意のデバイスのブラウザで直接動作します。\n\nクイックアクセスのため、ブラウザメニュー（iOS SafariまたはAndroid Chrome）からホーム画面に追加できます — ダウンロード不要。',
        answerKo: '예。Lease Shield는 모든 기기의 브라우저에서 직접 작동합니다。\n\n빠른 액세스를 위해 브라우저 메뉴（iOS Safari 또는 Android Chrome）에서 홈 화면에 추가할 수 있습니다 — 다운로드 불필요。',
        answerRu: 'Да。Lease Shield работает непосредственно в вашем браузере на любом устройстве。\n\nДля быстрого доступа вы можете добавить его на главный экран из меню браузера（iOS Safari или Android Chrome）— загрузка не требуется。'
      },
      {
        questionEn: 'How can Lease Shield be installed on a phone?',
        questionTh: 'สามารถติดตั้ง Lease Shield บนโทรศัพท์ได้อย่างไร?',
        questionZh: '如何在手机上安装Lease Shield？',
        questionJa: 'Lease Shieldはどのように携帯電話にインストールできますか？',
        questionKo: 'Lease Shield를 휴대폰에 어떻게 설치할 수 있나요?',
        questionRu: 'Как установить Lease Shield на телефон?',
        answerEn: 'Android users can download the Lease Shield app from the <a href="https://play.google.com/store/apps/details?id=asia.leaseshield.app" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">Google Play Store</a>. iOS users can download from the Apple App Store (coming soon).\n\nAlternatively, you can use Lease Shield in your mobile browser and add it to your home screen for quick access by opening the browser menu and selecting "Add to Home Screen."',
        answerTh: 'Lease Shield ทำงานในเบราว์เซอร์และสามารถเพิ่มไปยังหน้าจอหลักเพื่อเข้าถึงอย่างรวดเร็ว ไม่ต้องดาวน์โหลดแอป\n\nเพื่อเพิ่ม ให้เปิดเมนูเบราว์เซอร์และเลือก "Add to Home Screen"',
        answerZh: 'Lease Shield在浏览器中运行，可以添加到主屏幕以便快速访问。无需下载应用。\n\n要添加，请打开浏览器菜单并选择"添加到主屏幕"。',
        answerJa: 'Lease Shieldはブラウザで動作し、クイックアクセスのためにホーム画面に追加できます。アプリのダウンロードは不要です。\n\n追加するには、ブラウザメニューを開き、「ホーム画面に追加」を選択してください。',
        answerKo: 'Lease Shield는 브라우저에서 작동하며 빠른 액세스를 위해 홈 화면에 추가할 수 있습니다。앱 다운로드가 필요하지 않습니다。\n\n추가하려면 브라우저 메뉴를 열고 "홈 화면에 추가"를 선택하세요。',
        answerRu: 'Lease Shield работает в браузере и может быть добавлен на главный экран для быстрого доступа。Загрузка приложения не требуется。\n\nЧтобы добавить、откройте меню браузера и выберите "Добавить на главный экран"。'
      },
      {
        questionEn: 'Why am I not receiving notifications?',
        questionTh: 'ทำไมฉันไม่ได้รับการแจ้งเตือน?',
        questionZh: '为什么我没有收到通知？',
        questionJa: '通知が届かないのはなぜですか？',
        questionKo: '알림을 받지 못하는 이유는 무엇인가요?',
        questionRu: 'Почему я не получаю уведомления?',
        answerEn: 'Please check your notification preferences and ensure LINE alerts are enabled in your <a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">account settings</a>.',
        answerTh: 'กรุณาตรวจสอบการตั้งค่าการแจ้งเตือนและตรวจสอบว่าเปิดการแจ้งเตือน LINE ใน<a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">การตั้งค่าบัญชี</a>ของคุณ',
        answerZh: '请检查您的通知偏好设置，并确保在您的<a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">帐户设置</a>中启用了LINE提醒。',
        answerJa: '通知設定を確認し、<a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">アカウント設定</a>でLINE通知が有効になっていることを確認してください。',
        answerKo: '알림 환경설정을 확인하고 <a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">계정 설정</a>에서 LINE 알림이 활성화되어 있는지 확인하세요。',
        answerRu: 'Пожалуйста、проверьте настройки уведомлений и убедитесь、что LINE-уведомления включены в ваших <a href="#" class="account-notifications-link font-semibold underline" style="color: #0C3B2E;">настройках аккаунта</a>。'
      },
      {
        questionEn: 'Is my data secure?',
        questionTh: 'ข้อมูลของฉันปลอดภัยหรือไม่?',
        questionZh: '我的数据安全吗？',
        questionJa: '私のデータは安全ですか？',
        questionKo: '내 데이터는 안전한가요?',
        questionRu: 'Мои данные в безопасности?',
        answerEn: 'All files and communications are encrypted. Lease Shield never sells or shares personal data.\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPA & Privacy →</a>',
        answerTh: 'ไฟล์และการสื่อสารทั้งหมดได้รับการเข้ารหัส Lease Shield ไม่เคยขายหรือแบ่งปันข้อมูลส่วนบุคคล\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPA และความเป็นส่วนตัว →</a>',
        answerZh: '所有文件和通信都经过加密。Lease Shield永远不会出售或共享个人数据。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPA和隐私 →</a>',
        answerJa: 'すべてのファイルと通信は暗号化されています。Lease Shieldは個人データを決して販売または共有しません。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPAとプライバシー →</a>',
        answerKo: '모든 파일과 통신은 암호화됩니다。Lease Shield는 개인 데이터를 절대 판매하거나 공유하지 않습니다。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPA 및 개인정보 보호 →</a>',
        answerRu: 'Все файлы и коммуникации зашифрованы。Lease Shield никогда не продаёт и не передаёт личные данные。\n\n<a href="https://www.leaseshield.asia/legal#privacy" target="_blank" rel="noopener noreferrer" class="font-semibold underline" style="color: #0C3B2E;">PDPA и конфиденциальность →</a>'
      }
    ]
  }
};

function FAQContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { question: `What is ${num1} + ${num2}?`, answer: num1 + num2 };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      question: `What is ${num1} + ${num2}?`,
      answer: num1 + num2
    };
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  // Handle in-app link clicks
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (e.target.classList.contains('language-selector-link')) {
        e.preventDefault();
        const langEvent = new CustomEvent('openLanguageSelector');
        window.dispatchEvent(langEvent);
      }
      if (e.target.classList.contains('account-referral-link')) {
        e.preventDefault();
        navigate(createPageUrl('Account') + '#referral');
      }
      if (e.target.classList.contains('account-notifications-link')) {
        e.preventDefault();
        navigate(createPageUrl('Account') + '#notifications');
      }
      if (e.target.classList.contains('one-time-scan-link')) {
        e.preventDefault();
        navigate(createPageUrl('Account') + '#one-time');
      }
      if (e.target.classList.contains('subscription-plans-link')) {
        e.preventDefault();
        navigate(createPageUrl('Account') + '#plans');
      }
      if (e.target.classList.contains('account-plans-link')) {
        e.preventDefault();
        navigate(createPageUrl('Account') + '#plans');
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

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
                        background: '#E8F3EF',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(15, 66, 41, 0.15)'
                      }}>
                        <Icon className="w-7 h-7" style={{ color: '#0F4229' }} />
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
                                <div 
                                 className="text-sm leading-relaxed whitespace-pre-line" 
                                 style={{ color: colors.textPrimary, lineHeight: '1.7' }}
                                 dangerouslySetInnerHTML={{ __html: getLocalizedText(q, 'answer') }}
                                />
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

        {/* Contact Support Form */}
        <div className="mt-12 border-t pt-8" style={{ borderColor: colors.borderColor }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
            {language === 'th' ? 'ยังต้องการความช่วยเหลือ?' : language === 'zh' ? '仍需要帮助？' : language === 'ja' ? 'まだヘルプが必要ですか？' : language === 'ko' ? '여전히 도움이 필요하신가요?' : language === 'ru' ? 'Нужна дополнительная помощь?' : 'Still Need Help?'}
          </h2>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'ไม่พบสิ่งที่คุณกำลังมองหา? ส่งข้อความถึงเรา เราจะตอบกลับภายใน 2-3 วันทำการ' : language === 'zh' ? '找不到您要找的内容？给我们发送消息，我们将在2-3个工作日内回复' : language === 'ja' ? 'お探しのものが見つかりませんか？メッセージをお送りください。2-3営業日以内に返信いたします' : language === 'ko' ? '찾고 있는 내용을 찾을 수 없나요? 메시지를 보내주시면 2-3영업일 이내에 답변드리겠습니다' : language === 'ru' ? 'Не нашли то, что искали? Отправьте нам сообщение, и мы ответим в течение 2-3 рабочих дней' : "Can't find what you're looking for? Send us a message and we'll get back to you within 2-3 business days."}
          </p>
          
          <form 
            className="space-y-4 max-w-2xl"
            onSubmit={async (e) => {
              e.preventDefault();
              
              if (parseInt(captchaAnswer) !== captchaQuestion.answer) {
                alert(language === 'th' ? 'คำตอบไม่ถูกต้อง กรุณาลองอีกครั้ง' : 'Incorrect answer. Please try again.');
                setCaptchaQuestion(generateCaptcha());
                setCaptchaAnswer('');
                return;
              }
              
              const formData = new FormData(e.target);
              setIsSubmitting(true);
              
              try {
                const currentUser = await base44.auth.me();
                
                await base44.integrations.Core.SendEmail({
                  to: 'support@leaseshield.asia',
                  subject: `Support Request: ${formData.get('subject')}`,
                  body: `
<h3>New Support Request</h3>
<p><strong>From:</strong> ${formData.get('name')} (${formData.get('email')})</p>
<p><strong>User Account:</strong> ${currentUser.email}</p>
<p><strong>Plan:</strong> ${currentUser.plan_tier || 'free'}</p>
<p><strong>Subject:</strong> ${formData.get('subject')}</p>
<p><strong>Message:</strong></p>
<p style="white-space: pre-wrap;">${formData.get('message').replace(/\n/g, '<br>')}</p>
                  `
                });
                
                alert(language === 'th' ? 'ส่งข้อความสำเร็จ! เราจะตอบกลับภายใน 2-3 วันทำการ' : language === 'zh' ? '消息发送成功！我们将在2-3个工作日内回复' : language === 'ja' ? 'メッセージが正常に送信されました！2-3営業日以内に返信いたします' : language === 'ko' ? '메시지가 성공적으로 전송되었습니다! 2-3영업일 이내에 답변드리겠습니다' : language === 'ru' ? 'Сообщение отправлено успешно! Мы ответим в течение 2-3 рабочих дней' : "Message sent successfully! We'll respond within 2-3 business days.");
                e.target.reset();
                setCaptchaAnswer('');
                setCaptchaQuestion(generateCaptcha());
              } catch (error) {
                console.error('Send failed:', error);
                alert(language === 'th' ? 'ส่งข้อความไม่สำเร็จ กรุณาส่งอีเมลโดยตรงไปที่ support@leaseshield.asia' : 'Failed to send message. Please email us directly at support@leaseshield.asia');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ชื่อของคุณ *' : language === 'zh' ? '您的姓名 *' : language === 'ja' ? 'お名前 *' : language === 'ko' ? '이름 *' : language === 'ru' ? 'Ваше имя *' : 'Your Name *'}
              </label>
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={100}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C3B2E] focus:border-transparent"
                style={{
                  backgroundColor: colors.fieldBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'อีเมล *' : language === 'zh' ? '电子邮件地址 *' : language === 'ja' ? 'メールアドレス *' : language === 'ko' ? '이메일 주소 *' : language === 'ru' ? 'Email адрес *' : 'Email Address *'}
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C3B2E] focus:border-transparent"
                style={{
                  backgroundColor: colors.fieldBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'หัวข้อ *' : language === 'zh' ? '主题 *' : language === 'ja' ? '件名 *' : language === 'ko' ? '제목 *' : language === 'ru' ? 'Тема *' : 'Subject *'}
              </label>
              <input
                type="text"
                name="subject"
                required
                minLength={5}
                maxLength={200}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C3B2E] focus:border-transparent"
                style={{
                  backgroundColor: colors.fieldBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ข้อความ *' : language === 'zh' ? '消息 *' : language === 'ja' ? 'メッセージ *' : language === 'ko' ? '메시지 *' : language === 'ru' ? 'Сообщение *' : 'Message *'}
              </label>
              <textarea
                name="message"
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C3B2E] focus:border-transparent"
                style={{
                  backgroundColor: colors.fieldBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {language === 'th' ? 'ขั้นต่ำ 20 ตัวอักษร' : language === 'zh' ? '至少20个字符' : language === 'ja' ? '最低20文字' : language === 'ko' ? '최소 20자' : language === 'ru' ? 'Минимум 20 символов' : 'Minimum 20 characters'}
              </p>
            </div>
            
            <div className="p-4 rounded-lg border" style={{
              backgroundColor: isDarkMode ? '#374151' : '#F9FAFB',
              borderColor: colors.borderColor
            }}>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'ตรวจสอบความปลอดภัย: ' : language === 'zh' ? '安全检查: ' : language === 'ja' ? 'セキュリティチェック: ' : language === 'ko' ? '보안 확인: ' : language === 'ru' ? 'Проверка безопасности: ' : 'Security Check: '}{captchaQuestion.question} *
              </label>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0C3B2E] focus:border-transparent"
                placeholder={language === 'th' ? 'ใส่คำตอบของคุณ' : language === 'zh' ? '输入答案' : language === 'ja' ? '答えを入力' : language === 'ko' ? '답변 입력' : language === 'ru' ? 'Введите ответ' : 'Enter your answer'}
                style={{
                  backgroundColor: colors.fieldBg,
                  borderColor: colors.borderColor,
                  color: colors.textPrimary
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSubmitting ? '#9CA3AF' : '#0C3B2E',
                color: '#FFFFFF'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.target.style.backgroundColor = '#084D38';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.target.style.backgroundColor = '#0C3B2E';
              }}
            >
              {isSubmitting ? (language === 'th' ? 'กำลังส่ง...' : language === 'zh' ? '发送中...' : language === 'ja' ? '送信中...' : language === 'ko' ? '전송 중...' : language === 'ru' ? 'Отправка...' : 'Sending...') : (language === 'th' ? 'ส่งข้อความ' : language === 'zh' ? '发送消息' : language === 'ja' ? 'メッセージを送信' : language === 'ko' ? '메시지 보내기' : language === 'ru' ? 'Отправить сообщение' : 'Send Message')}
            </button>
          </form>
          
          <p className="text-sm mt-4" style={{ color: colors.textSecondary }}>
            {language === 'th' ? 'หรือส่งอีเมลโดยตรงไปที่: ' : language === 'zh' ? '或直接发送电子邮件至: ' : language === 'ja' ? 'または直接メールを送信: ' : language === 'ko' ? '또는 직접 이메일 보내기: ' : language === 'ru' ? 'Или напишите нам напрямую: ' : 'Or email us directly at: '}<a href="mailto:support@leaseshield.asia" className="font-medium" style={{ color: '#0C3B2E' }}>support@leaseshield.asia</a>
          </p>
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