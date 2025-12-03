import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, FileText, Globe, Mail, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { QuickHelp } from "../components/shared/ContextualHelp";

export default function PrivacyPolicy() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const language = user?.language || 'en';

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: January 2025",
      sections: [
        {
          icon: FileText,
          title: "1. Information We Collect",
          content: `We collect the following information to provide our lease analysis services:

• Personal Information: Name, email address, phone number, and country
• Lease Documents: PDF files and images of rental agreements you upload
• Deposit Information: Security deposit amounts, dates, and property addresses
• Supporting Documents: Receipts, photos, videos, and correspondence related to your rental
• Account Data: Subscription status, plan tier, and payment information
• Usage Data: How you interact with our services

All data collection is limited to what is necessary to provide our services to you.`
        },
        {
          icon: Lock,
          title: "2. How We Use Your Information",
          content: `Your information is used exclusively for:

• AI-Powered Lease Analysis: Analyzing your lease agreements for risks and unfair clauses
• Deposit Tracking: Monitoring security deposit return dates and sending reminders
• Document Storage: Maintaining your rental documentation in a secure vault
• Communication: Sending notifications, reminders, and service updates
• Service Improvement: Understanding usage patterns to enhance our platform
• Legal Compliance: Meeting our obligations under Thai law and PDPA

We do NOT sell your personal information or lease documents to third parties.`
        },
        {
          icon: Shield,
          title: "3. Data Storage & Security",
          content: `Your data security is our top priority:

• Encryption: All files are encrypted at rest and in transit using industry-standard protocols
• Secure Infrastructure: Data stored on Base44/Supabase cloud infrastructure (AWS Singapore region)
• Access Controls: Only you can access your lease documents and personal data
• Authentication: Multi-layer authentication protects your account
• Regular Backups: Automatic backups ensure your data is never lost
• ISO 27001 Compliant: Our infrastructure meets international security standards

We implement technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your data.`
        },
        {
          icon: Globe,
          title: "4. Data Sharing & Third Parties",
          content: `We work with trusted service providers:

• Base44/Supabase: Cloud storage and database infrastructure (Data Processor)
• Stripe: Payment processing for subscriptions (PCI-DSS compliant)
• LINE Messaging API: Optional notifications (only if you enable)
• OpenAI: AI analysis of lease documents (anonymized, no personal identifiers sent)

All third parties are contractually bound to protect your data and use it only for specified purposes.

We may disclose information if required by law, court order, or to protect our legal rights.`
        },
        {
          icon: FileText,
          title: "5. Your Rights Under PDPA",
          content: `As a data subject in Thailand, you have the right to:

• Access: Request a copy of all personal data we hold about you
• Rectification: Correct inaccurate or incomplete information
• Erasure: Request deletion of your data (right to be forgotten)
• Restriction: Limit how we process your data
• Portability: Receive your data in a machine-readable format
• Object: Opt-out of certain data processing activities
• Withdraw Consent: Revoke consent at any time

To exercise these rights, contact us at privacy@leaseshield.asia or use the "Export My Data" feature in your Account settings.`
        },
        {
          icon: AlertCircle,
          title: "6. Data Retention",
          content: `We retain your information for:

• Active Accounts: As long as your account remains active
• Lease Documents: Until you delete them or close your account
• Transaction Records: 7 years (as required by Thai tax law)
• Marketing Data: Until you unsubscribe

After account closure, we securely delete your data within 30 days, except where we must retain it for legal compliance.`
        },
        {
          icon: Mail,
          title: "7. Cookies & Tracking",
          content: `We use essential cookies to:

• Maintain your login session
• Remember your language preference
• Ensure proper website functionality

We do NOT use third-party advertising cookies or sell your browsing data.`
        },
        {
          icon: Shield,
          title: "8. International Data Transfers",
          content: `Your data is primarily stored in Singapore (AWS Asia-Pacific region). If we transfer data outside Thailand, we ensure:

• Adequate protection mechanisms are in place
• Transfers comply with PDPA requirements
• Standard contractual clauses are used where necessary`
        },
        {
          icon: FileText,
          title: "9. Changes to This Policy",
          content: `We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via:

• Email notification to your registered address
• In-app notification banner
• Updated "Last Modified" date at the top of this page

Continued use of our services after changes constitutes acceptance of the updated policy.`
        },
        {
          icon: Mail,
          title: "10. Contact Us",
          content: `For privacy-related questions or to exercise your rights:

Email: privacy@leaseshield.asia
Data Protection Officer: dpo@leaseshield.asia

We will respond to all requests within 30 days as required by PDPA.`
        }
      ]
    },
    th: {
      title: "นโยบายความเป็นส่วนตัว",
      lastUpdated: "อัปเดตล่าสุด: มกราคม 2568",
      sections: [
        {
          icon: FileText,
          title: "1. ข้อมูลที่เรารวบรวม",
          content: `เรารวบรวมข้อมูลต่อไปนี้เพื่อให้บริการวิเคราะห์สัญญาเช่า:

• ข้อมูลส่วนบุคคล: ชื่อ อีเมล เบอร์โทรศัพท์ และประเทศ
• เอกสารสัญญาเช่า: ไฟล์ PDF และรูปภาพของสัญญาเช่าที่คุณอัปโหลด
• ข้อมูลเงินมัดจำ: จำนวนเงินมัดจำ วันที่ และที่อยู่ทรัพย์สิน
• เอกสารสนับสนุน: ใบเสร็จ รูปภาพ วิดีโอ และจดหมายที่เกี่ยวข้องกับการเช่า
• ข้อมูลบัญชี: สถานะการสมัครสมาชิก แผน และข้อมูลการชำระเงิน
• ข้อมูลการใช้งาน: วิธีที่คุณใช้บริการของเรา

การรวบรวมข้อมูลจำกัดเฉพาะสิ่งที่จำเป็นในการให้บริการแก่คุณ`
        },
        {
          icon: Lock,
          title: "2. วิธีที่เราใช้ข้อมูลของคุณ",
          content: `ข้อมูลของคุณใช้เฉพาะสำหรับ:

• การวิเคราะห์สัญญาด้วย AI: วิเคราะห์สัญญาเช่าของคุณเพื่อหาความเสี่ยงและข้อกำหนดที่ไม่เป็นธรรม
• การติดตามเงินมัดจำ: ตรวจสอบวันที่คืนเงินมัดจำและส่งการแจ้งเตือน
• การจัดเก็บเอกสาร: เก็บรักษาเอกสารการเช่าของคุณในตู้นิรภัย
• การสื่อสาร: ส่งการแจ้งเตือน การเตือนความจำ และการอัปเดตบริการ
• การปรับปรุงบริการ: ทำความเข้าใจรูปแบบการใช้งานเพื่อพัฒนาแพลตฟอร์ม
• การปฏิบัติตามกฎหมาย: ปฏิบัติตามพ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล

เราไม่ขายข้อมูลส่วนบุคคลหรือสัญญาเช่าของคุณให้บุคคลที่สาม`
        },
        {
          icon: Shield,
          title: "3. การจัดเก็บและความปลอดภัยของข้อมูล",
          content: `ความปลอดภัยของข้อมูลคือสิ่งสำคัญที่สุดของเรา:

• การเข้ารหัส: ไฟล์ทั้งหมดเข้ารหัสทั้งขณะจัดเก็บและส่งผ่าน
• โครงสร้างที่ปลอดภัย: ข้อมูลจัดเก็บบน Base44/Supabase (AWS สิงคโปร์)
• การควบคุมการเข้าถึง: เฉพาะคุณเท่านั้นที่เข้าถึงเอกสารและข้อมูลของคุณได้
• การยืนยันตัวตน: การยืนยันตัวตนหลายชั้นป้องกันบัญชีของคุณ
• การสำรองข้อมูล: สำรองข้อมูลอัตโนมัติเพื่อไม่ให้ข้อมูลสูญหาย
• มาตรฐาน ISO 27001: โครงสร้างของเราตรงตามมาตรฐานความปลอดภัยระดับสากล

เราใช้มาตรการทางเทคนิคและองค์กรเพื่อป้องกันการเข้าถึง การแก้ไข การเปิดเผย หรือการทำลายข้อมูลโดยไม่ได้รับอนุญาต`
        },
        {
          icon: Globe,
          title: "4. การแบ่งปันข้อมูลและบุคคลที่สาม",
          content: `เราทำงานร่วมกับผู้ให้บริการที่เชื่อถือได้:

• Base44/Supabase: โครงสร้างคลาวด์และฐานข้อมูล (ผู้ประมวลผลข้อมูล)
• Stripe: การประมวลผลการชำระเงิน (ปฏิบัติตาม PCI-DSS)
• LINE Messaging API: การแจ้งเตือนแบบเลือกใช้
• OpenAI: การวิเคราะห์สัญญาด้วย AI (ไม่มีข้อมูลระบุตัวตน)

บุคคลที่สามทั้งหมดมีข้อผูกพันตามสัญญาในการปกป้องข้อมูลของคุณ

เราอาจเปิดเผยข้อมูลหากกฎหมายกำหนด คำสั่งศาล หรือเพื่อปกป้องสิทธิ์ทางกฎหมายของเรา`
        },
        {
          icon: FileText,
          title: "5. สิทธิของคุณภายใต้ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล",
          content: `ในฐานะเจ้าของข้อมูลในประเทศไทย คุณมีสิทธิ์:

• เข้าถึง: ขอสำเนาข้อมูลส่วนบุคคลทั้งหมดที่เราเก็บรักษา
• แก้ไข: แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์
• ลบ: ขอให้ลบข้อมูลของคุณ (สิทธิที่จะถูกลืม)
• จำกัด: จำกัดวิธีที่เราประมวลผลข้อมูลของคุณ
• โอนย้าย: รับข้อมูลของคุณในรูปแบบที่อ่านด้วยเครื่องได้
• คัดค้าน: ปฏิเสธกิจกรรมการประมวลผลข้อมูลบางอย่าง
• ถอนความยินยอม: เพิกถอนความยินยอมได้ตลอดเวลา

ติดต่อ privacy@leaseshield.asia หรือใช้ฟีเจอร์ "ส่งออกข้อมูล" ในการตั้งค่าบัญชีของคุณ`
        },
        {
          icon: AlertCircle,
          title: "6. การเก็บรักษาข้อมูล",
          content: `เราเก็บรักษาข้อมูลของคุณสำหรับ:

• บัญชีที่ใช้งาน: ตราบใดที่บัญชีของคุณยังใช้งานอยู่
• เอกสารสัญญาเช่า: จนกว่าคุณจะลบหรือปิดบัญชี
• บันทึกธุรกรรม: 7 ปี (ตามที่กฎหมายภาษีไทยกำหนด)
• ข้อมูลการตลาด: จนกว่าคุณจะยกเลิกการสมัคร

หลังจากปิดบัญชี เราจะลบข้อมูลของคุณอย่างปลอดภัยภายใน 30 วัน ยกเว้นกรณีที่เราต้องเก็บไว้เพื่อปฏิบัติตามกฎหมาย`
        },
        {
          icon: Mail,
          title: "7. คุกกี้และการติดตาม",
          content: `เราใช้คุกกี้ที่จำเป็นเพื่อ:

• รักษาเซสชันการเข้าสู่ระบบของคุณ
• จดจำการตั้งค่าภาษาของคุณ
• รับประกันการทำงานของเว็บไซต์

เราไม่ใช้คุกกี้โฆษณาจากบุคคลที่สามหรือขายข้อมูลการเรียกดูของคุณ`
        },
        {
          icon: Shield,
          title: "8. การโอนข้อมูลระหว่างประเทศ",
          content: `ข้อมูลของคุณจัดเก็บหลักในสิงคโปร์ (AWS เอเชียแปซิฟิก) หากเราโอนข้อมูลออกนอกประเทศไทย เรารับประกัน:

• มีกลไกการปกป้องที่เพียงพอ
• การโอนปฏิบัติตามข้อกำหนด พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล
• ใช้ข้อกำหนดสัญญามาตรฐานเมื่อจำเป็น`
        },
        {
          icon: FileText,
          title: "9. การเปลี่ยนแปลงนโยบายนี้",
          content: `เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เพื่อสะท้อนการเปลี่ยนแปลงในแนวปฏิบัติหรือข้อกำหนดทางกฎหมาย เราจะแจ้งให้คุณทราบถึงการเปลี่ยนแปลงที่สำคัญผ่าน:

• อีเมลไปยังที่อยู่ที่ลงทะเบียนไว้
• แบนเนอร์แจ้งเตือนในแอป
• วันที่ "แก้ไขล่าสุด" ที่อัปเดตด้านบนหน้านี้

การใช้บริการของเราต่อไปหลังจากการเปลี่ยนแปลงถือเป็นการยอมรับนโยบายที่อัปเดต`
        },
        {
          icon: Mail,
          title: "10. ติดต่อเรา",
          content: `สำหรับคำถามเกี่ยวกับความเป็นส่วนตัวหรือการใช้สิทธิ์ของคุณ:

อีเมล: privacy@leaseshield.asia
เจ้าหน้าที่คุ้มครองข้อมูล: dpo@leaseshield.asia

เราจะตอบคำขอทั้งหมดภายใน 30 วันตามที่ พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคลกำหนด`
        }
      ]
    },
    zh: {
      title: "隐私政策",
      lastUpdated: "最后更新：2025年1月",
      sections: [
        {
          icon: FileText,
          title: "1. 我们收集的信息",
          content: `我们收集以下信息以提供租约分析服务：

• 个人信息：姓名、电子邮件地址、电话号码和国家
• 租约文件：您上传的租赁协议的PDF文件和图像
• 押金信息：押金金额、日期和物业地址
• 支持文件：与您的租赁相关的收据、照片、视频和信件
• 账户数据：订阅状态、计划层级和付款信息
• 使用数据：您如何与我们的服务互动

所有数据收集仅限于向您提供服务所必需的内容。`
        },
        {
          icon: Lock,
          title: "2. 我们如何使用您的信息",
          content: `您的信息专门用于：

• AI驱动的租约分析：分析您的租赁协议以识别风险和不公平条款
• 押金追踪：监控押金返还日期并发送提醒
• 文档存储：在安全保险库中维护您的租赁文档
• 通信：发送通知、提醒和服务更新
• 服务改进：了解使用模式以增强我们的平台
• 法律合规：履行泰国法律和PDPA下的义务

我们不会将您的个人信息或租约文件出售给第三方。`
        },
        {
          icon: Shield,
          title: "3. 数据存储和安全",
          content: `您的数据安全是我们的首要任务：

• 加密：所有文件在静止和传输中都使用行业标准协议加密
• 安全基础设施：数据存储在Base44/Supabase云基础设施（AWS新加坡地区）
• 访问控制：只有您可以访问您的租约文件和个人数据
• 身份验证：多层身份验证保护您的账户
• 定期备份：自动备份确保您的数据永不丢失
• ISO 27001合规：我们的基础设施符合国际安全标准

我们实施技术和组织措施以防止未经授权的访问、更改、披露或破坏您的数据。`
        },
        {
          icon: Globe,
          title: "4. 数据共享和第三方",
          content: `我们与值得信赖的服务提供商合作：

• Base44/Supabase：云存储和数据库基础设施（数据处理器）
• Stripe：订阅付款处理（符合PCI-DSS）
• LINE消息API：可选通知（仅当您启用时）
• OpenAI：租约文件的AI分析（匿名化，不发送个人标识符）

所有第三方均受合同约束保护您的数据并仅用于指定目的。

如果法律要求、法院命令或保护我们的法律权利，我们可能会披露信息。`
        },
        {
          icon: FileText,
          title: "5. PDPA下的您的权利",
          content: `作为泰国的数据主体，您有权：

• 访问：请求我们持有的所有个人数据的副本
• 纠正：更正不准确或不完整的信息
• 删除：请求删除您的数据（被遗忘权）
• 限制：限制我们处理您数据的方式
• 可移植性：以机器可读格式接收您的数据
• 反对：选择退出某些数据处理活动
• 撤回同意：随时撤回同意

要行使这些权利，请联系privacy@leaseshield.asia或在您的账户设置中使用"导出我的数据"功能。`
        },
        {
          icon: AlertCircle,
          title: "6. 数据保留",
          content: `我们保留您的信息：

• 活跃账户：只要您的账户保持活跃
• 租约文件：直到您删除它们或关闭您的账户
• 交易记录：7年（根据泰国税法要求）
• 营销数据：直到您取消订阅

账户关闭后，我们会在30天内安全删除您的数据，除非我们必须为法律合规保留。`
        },
        {
          icon: Mail,
          title: "7. Cookies和追踪",
          content: `我们使用必要的cookies来：

• 维护您的登录会话
• 记住您的语言偏好
• 确保网站正常功能

我们不使用第三方广告cookies或出售您的浏览数据。`
        },
        {
          icon: Shield,
          title: "8. 国际数据传输",
          content: `您的数据主要存储在新加坡（AWS亚太地区）。如果我们将数据转移到泰国境外，我们确保：

• 有足够的保护机制
• 传输符合PDPA要求
• 必要时使用标准合同条款`
        },
        {
          icon: FileText,
          title: "9. 本政策的变更",
          content: `我们可能会更新本隐私政策以反映我们实践或法律要求的变化。我们将通过以下方式通知您重大变更：

• 向您注册的地址发送电子邮件通知
• 应用内通知横幅
• 此页面顶部更新的"最后修改"日期

在更改后继续使用我们的服务即表示接受更新后的政策。`
        },
        {
          icon: Mail,
          title: "10. 联系我们",
          content: `对于隐私相关问题或行使您的权利：

电子邮件：privacy@leaseshield.asia
数据保护官：dpo@leaseshield.asia

根据PDPA的要求，我们将在30天内回复所有请求。`
        }
      ]
    },
    ja: {
      title: "プライバシーポリシー",
      lastUpdated: "最終更新日：2025年1月",
      sections: [
        {
          icon: FileText,
          title: "1. 収集する情報",
          content: `リース分析サービスを提供するために以下の情報を収集します：

• 個人情報：氏名、メールアドレス、電話番号、国
• リース文書：アップロードした賃貸契約のPDFファイルと画像
• 敷金情報：敷金額、日付、物件住所
• サポート文書：賃貸に関連する領収書、写真、ビデオ、書簡
• アカウントデータ：サブスクリプションステータス、プランレベル、支払い情報
• 使用データ：サービスとのやり取り方法

すべてのデータ収集は、サービス提供に必要なものに限定されます。`
        },
        {
          icon: Lock,
          title: "2. 情報の使用方法",
          content: `お客様の情報は以下の目的にのみ使用されます：

• AI駆動のリース分析：賃貸契約を分析してリスクと不公平な条項を特定
• 敷金追跡：敷金返還日を監視し、リマインダーを送信
• 文書保存：安全な保管庫で賃貸文書を維持
• コミュニケーション：通知、リマインダー、サービス更新の送信
• サービス改善：使用パターンを理解してプラットフォームを強化
• 法的コンプライアンス：タイ法とPDPAの下での義務を履行

お客様の個人情報やリース文書を第三者に販売することはありません。`
        },
        {
          icon: Shield,
          title: "3. データストレージとセキュリティ",
          content: `お客様のデータセキュリティは最優先事項です：

• 暗号化：すべてのファイルは業界標準プロトコルを使用して静止時および転送時に暗号化
• 安全なインフラストラクチャ：Base44/Supabaseクラウドインフラストラクチャ（AWSシンガポールリージョン）にデータを保存
• アクセス制御：お客様のみがリース文書と個人データにアクセス可能
• 認証：多層認証でアカウントを保護
• 定期バックアップ：自動バックアップでデータを失うことはありません
• ISO 27001準拠：インフラストラクチャは国際セキュリティ基準を満たしています

不正アクセス、変更、開示、またはデータの破壊を防ぐために技術的および組織的措置を実施します。`
        },
        {
          icon: Globe,
          title: "4. データ共有と第三者",
          content: `信頼できるサービスプロバイダーと協力しています：

• Base44/Supabase：クラウドストレージとデータベースインフラストラクチャ（データプロセッサー）
• Stripe：サブスクリプションの支払い処理（PCI-DSS準拠）
• LINEメッセージングAPI：オプションの通知（有効にした場合のみ）
• OpenAI：リース文書のAI分析（匿名化、個人識別子なし）

すべての第三者は契約上、お客様のデータを保護し、指定された目的にのみ使用する義務があります。

法律、裁判所命令、または法的権利を保護するために必要な場合、情報を開示することがあります。`
        },
        {
          icon: FileText,
          title: "5. PDPA下のお客様の権利",
          content: `タイのデータ主体として、お客様には以下の権利があります：

• アクセス：保持しているすべての個人データのコピーをリクエスト
• 訂正：不正確または不完全な情報を修正
• 削除：データの削除をリクエスト（忘れられる権利）
• 制限：データ処理方法を制限
• 移植性：機械可読形式でデータを受け取る
• 異議：特定のデータ処理活動をオプトアウト
• 同意の撤回：いつでも同意を取り消す

これらの権利を行使するには、privacy@leaseshield.asiaに連絡するか、アカウント設定の「データをエクスポート」機能を使用してください。`
        },
        {
          icon: AlertCircle,
          title: "6. データ保持",
          content: `お客様の情報を以下の期間保持します：

• アクティブアカウント：アカウントがアクティブである限り
• リース文書：削除またはアカウント閉鎖まで
• 取引記録：7年（タイ税法で要求されるとおり）
• マーケティングデータ：購読解除まで

アカウント閉鎖後、法的コンプライアンスのために保持する必要がある場合を除き、30日以内にデータを安全に削除します。`
        },
        {
          icon: Mail,
          title: "7. CookieとTracking",
          content: `必要なCookieを使用して：

• ログインセッションを維持
• 言語設定を記憶
• ウェブサイトの適切な機能を確保

第三者の広告Cookieを使用したり、閲覧データを販売したりすることはありません。`
        },
        {
          icon: Shield,
          title: "8. 国際データ転送",
          content: `お客様のデータは主にシンガポール（AWSアジア太平洋地域）に保存されます。タイ国外にデータを転送する場合、以下を確保します：

• 適切な保護メカニズムが実施されている
• 転送がPDPA要件に準拠している
• 必要に応じて標準契約条項を使用`
        },
        {
          icon: FileText,
          title: "9. このポリシーの変更",
          content: `実践または法的要件の変更を反映するために、このプライバシーポリシーを更新することがあります。以下の方法で重要な変更をお知らせします：

• 登録されたアドレスへのメール通知
• アプリ内通知バナー
• このページ上部の更新された「最終更新日」

変更後もサービスを継続して使用すると、更新されたポリシーに同意したものとみなされます。`
        },
        {
          icon: Mail,
          title: "10. お問い合わせ",
          content: `プライバシー関連の質問または権利の行使について：

メール：privacy@leaseshield.asia
データ保護責任者：dpo@leaseshield.asia

PDPAの要求に従い、すべてのリクエストに30日以内に対応します。`
        }
      ]
    },
    ko: {
      title: "개인정보 보호정책",
      lastUpdated: "마지막 업데이트: 2025년 1월",
      sections: [
        {
          icon: FileText,
          title: "1. 수집하는 정보",
          content: `임대 분석 서비스를 제공하기 위해 다음 정보를 수집합니다：

• 개인 정보：이름, 이메일 주소, 전화번호 및 국가
• 임대 문서：업로드한 임대 계약의 PDF 파일 및 이미지
• 보증금 정보：보증금 금액, 날짜 및 부동산 주소
• 지원 문서：임대와 관련된 영수증, 사진, 비디오 및 서신
• 계정 데이터：구독 상태, 플랜 등급 및 결제 정보
• 사용 데이터：서비스와 상호 작용하는 방식

모든 데이터 수집은 서비스 제공에 필요한 것으로 제한됩니다.`
        },
        {
          icon: Lock,
          title: "2. 정보 사용 방법",
          content: `귀하의 정보는 다음을 위해서만 사용됩니다：

• AI 기반 임대 분석：위험과 불공정한 조항을 식별하기 위한 임대 계약 분석
• 보증금 추적：보증금 반환 날짜 모니터링 및 알림 전송
• 문서 저장：안전한 보관소에서 임대 문서 유지
• 통신：알림, 리마인더 및 서비스 업데이트 전송
• 서비스 개선：사용 패턴을 이해하여 플랫폼 향상
• 법적 준수：태국 법률 및 PDPA에 따른 의무 이행

개인 정보나 임대 문서를 제3자에게 판매하지 않습니다.`
        },
        {
          icon: Shield,
          title: "3. 데이터 저장 및 보안",
          content: `귀하의 데이터 보안은 최우선 사항입니다：

• 암호화：모든 파일은 업계 표준 프로토콜을 사용하여 저장 및 전송 중 암호화
• 안전한 인프라：Base44/Supabase 클라우드 인프라에 데이터 저장（AWS 싱가포르 지역）
• 액세스 제어：귀하만 임대 문서 및 개인 데이터에 액세스 가능
• 인증：다층 인증으로 계정 보호
• 정기 백업：자동 백업으로 데이터 손실 방지
• ISO 27001 준수：인프라는 국제 보안 표준 충족

무단 액세스, 변경, 공개 또는 데이터 파괴를 방지하기 위한 기술적 및 조직적 조치를 구현합니다.`
        },
        {
          icon: Globe,
          title: "4. 데이터 공유 및 제3자",
          content: `신뢰할 수 있는 서비스 제공업체와 협력합니다：

• Base44/Supabase：클라우드 스토리지 및 데이터베이스 인프라（데이터 프로세서）
• Stripe：구독 결제 처리（PCI-DSS 준수）
• LINE 메시징 API：선택적 알림（활성화한 경우에만）
• OpenAI：임대 문서의 AI 분석（익명화, 개인 식별자 없음）

모든 제3자는 귀하의 데이터를 보호하고 지정된 목적으로만 사용할 계약상 의무가 있습니다.

법률, 법원 명령 또는 법적 권리 보호를 위해 필요한 경우 정보를 공개할 수 있습니다.`
        },
        {
          icon: FileText,
          title: "5. PDPA에 따른 귀하의 권리",
          content: `태국의 데이터 주체로서 귀하는 다음과 같은 권리가 있습니다：

• 액세스：보유한 모든 개인 데이터의 사본 요청
• 수정：부정확하거나 불완전한 정보 수정
• 삭제：데이터 삭제 요청（잊혀질 권리）
• 제한：데이터 처리 방식 제한
• 이동성：기계 판독 가능한 형식으로 데이터 수신
• 반대：특정 데이터 처리 활동 거부
• 동의 철회：언제든지 동의 철회

이러한 권리를 행사하려면 privacy@leaseshield.asia로 연락하거나 계정 설정에서 "데이터 내보내기" 기능을 사용하세요.`
        },
        {
          icon: AlertCircle,
          title: "6. 데이터 보유",
          content: `귀하의 정보를 다음 기간 동안 보유합니다：

• 활성 계정：계정이 활성 상태인 동안
• 임대 문서：삭제하거나 계정을 닫을 때까지
• 거래 기록：7년（태국 세법에 따라）
• 마케팅 데이터：구독 취소할 때까지

계정 폐쇄 후 법적 준수를 위해 보유해야 하는 경우를 제외하고 30일 이내에 데이터를 안전하게 삭제합니다.`
        },
        {
          icon: Mail,
          title: "7. 쿠키 및 추적",
          content: `다음을 위해 필수 쿠키를 사용합니다：

• 로그인 세션 유지
• 언어 설정 기억
• 웹사이트 적절한 기능 보장

제3자 광고 쿠키를 사용하거나 검색 데이터를 판매하지 않습니다.`
        },
        {
          icon: Shield,
          title: "8. 국제 데이터 전송",
          content: `귀하의 데이터는 주로 싱가포르（AWS 아시아 태평양 지역）에 저장됩니다. 태국 외부로 데이터를 전송하는 경우 다음을 보장합니다：

• 적절한 보호 메커니즘이 마련되어 있음
• 전송이 PDPA 요구 사항을 준수함
• 필요한 경우 표준 계약 조항 사용`
        },
        {
          icon: FileText,
          title: "9. 이 정책의 변경",
          content: `관행이나 법적 요구 사항의 변경을 반영하기 위해 이 개인정보 보호정책을 업데이트할 수 있습니다. 다음을 통해 중요한 변경 사항을 알려드립니다：

• 등록된 주소로 이메일 알림
• 앱 내 알림 배너
• 이 페이지 상단의 업데이트된 "마지막 수정" 날짜

변경 후 서비스를 계속 사용하면 업데이트된 정책에 동의한 것으로 간주됩니다.`
        },
        {
          icon: Mail,
          title: "10. 문의하기",
          content: `개인정보 관련 질문 또는 권리 행사를 위해：

이메일：privacy@leaseshield.asia
데이터 보호 책임자：dpo@leaseshield.asia

PDPA에서 요구하는 대로 30일 이내에 모든 요청에 응답합니다.`
        }
      ]
    }
  };

  const strings = content[language] || content.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ls-stone via-white to-ls-stone p-4 md:p-6" style={{
      paddingBottom: '160px'
    }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0C3B2E',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(12, 59, 46, 0.2)'
              }}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-ls-charcoal">{strings.title}</h1>
                <p className="text-slate-600">{strings.lastUpdated}</p>
              </div>
            </div>
            <QuickHelp link="privacyPolicy" size="md" />
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-none shadow-lg" style={{
          backgroundColor: '#ECEFED',
          borderLeft: '4px solid #C7A338'
        }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ls-gold flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-ls-charcoal leading-relaxed">
                  {language === 'th' 
                    ? 'เราจริงจังกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายวิธีที่เรารวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562'
                    : language === 'zh'
                      ? '我们认真对待您的隐私。本政策解释了我们如何根据《个人数据保护法》（PDPA）B.E. 2562收集、使用和保护您的个人数据。'
                      : language === 'ja'
                        ? 'お客様のプライバシーを真剣に考えています。このポリシーは、個人データ保護法（PDPA）B.E. 2562に準拠して個人データを収集、使用、保護する方法を説明します。'
                        : language === 'ko'
                          ? '귀하의 개인정보를 진지하게 생각합니다. 이 정책은 개인정보보호법（PDPA）B.E. 2562에 따라 개인 데이터를 수집, 사용 및 보호하는 방법을 설명합니다.'
                          : 'We take your privacy seriously. This policy explains how we collect, use, and protect your personal data in compliance with the Personal Data Protection Act (PDPA) B.E. 2562.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-6">
          {strings.sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border-none shadow-lg">
                <CardHeader className="border-b" style={{
                  backgroundColor: '#ECEFED'
                }}>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Icon className="w-5 h-5 text-ls-forest" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-sm text-ls-charcoal leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Notice - IMPROVED VISIBILITY */}
        <Card className="mt-8 border-none shadow-xl" style={{
          background: 'linear-gradient(to bottom right, #0C3B2E, #047857)'
        }}>
          <CardContent className="p-8 text-center">
            <Shield className="w-10 h-10 text-ls-gold mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-3">
              {language === 'th' ? 'ข้อมูลของคุณปลอดภัยกับเรา' : language === 'zh' ? '您的数据在我们这里是安全的' : language === 'ja' ? 'お客様のデータは安全です' : language === 'ko' ? '귀하의 데이터는 우리와 함께 안전합니다' : 'Your Data is Safe With Us'}
            </p>
            <p className="text-white text-base leading-relaxed mb-4">
              {language === 'th' 
                ? 'หากคุณมีคำถามหรือข้อกังวลใดๆ โปรดติดต่อเราที่' 
                : language === 'zh'
                  ? '如果您有任何问题或疑虑，请通过以下方式联系我们'
                  : language === 'ja'
                    ? 'ご質問や懸念がある場合は、以下までお問い合わせください'
                    : language === 'ko'
                      ? '질문이나 우려 사항이 있으시면 다음으로 연락하십시오'
                      : 'If you have any questions or concerns, please contact us at'}
            </p>
            <a 
              href="mailto:privacy@leaseshield.asia"
              className="inline-block px-6 py-3 bg-white text-ls-forest font-bold rounded-lg hover:bg-ls-stone transition-colors"
            >
              privacy@leaseshield.asia
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}