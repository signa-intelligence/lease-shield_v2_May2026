import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Calendar, FolderLock, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Welcome() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const navigate = useNavigate();

  // Get user language preference (defaults to 'en' for unauthenticated users)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const language = user?.language || 'en';

  // Translations
  const t = {
    en: {
      title: "Welcome to Lease Shield",
      subtitle: "Protect your rental deposit, track payments, and manage disputes in one secure app.",
      depositTitle: "Deposit Shield",
      depositBody: "Record your deposit, photos, and agreements.",
      rentTitle: "Rent & Reminders",
      rentBody: "Track due dates and never miss a payment.",
      evidenceTitle: "Evidence Vault",
      evidenceBody: "Store move-in/out photos and case notes.",
      continueButton: "Continue to app",
      installHelp: "How to install on your phone",
      modalTitle: "Install Lease Shield on your phone",
      step1: "Open app.leaseshield.asia in your mobile browser.",
      step2iPhone: "iPhone: Tap Share → Add to Home Screen.",
      step2Android: "Android: Tap menu (⋮) → Install app or Add to Home Screen.",
      openApp: "Open app"
    },
    th: {
      title: "ยินดีต้อนรับสู่ Lease Shield",
      subtitle: "ปกป้องเงินมัดจำค่าเช่า ติดตามการชำระเงิน และจัดการข้อพิพาทได้ในแอปที่ปลอดภัยเดียว",
      depositTitle: "Deposit Shield",
      depositBody: "บันทึกเงินมัดจำ รูปถ่าย และสัญญาเช่า",
      rentTitle: "ค่าเช่าและการเตือน",
      rentBody: "ติดตามวันครบกำหนด ไม่พลาดการจ่าย",
      evidenceTitle: "Evidence Vault",
      evidenceBody: "เก็บรูปถ่ายเข้า–ออกห้อง และบันทึกกรณีพิพาท",
      continueButton: "ดำเนินการต่อไปยังแอป",
      installHelp: "วิธีติดตั้งบนโทรศัพท์ของคุณ",
      modalTitle: "ติดตั้ง Lease Shield บนโทรศัพท์ของคุณ",
      step1: "เปิด app.leaseshield.asia ในเบราว์เซอร์บนมือถือของคุณ",
      step2iPhone: "iPhone: แตะ แชร์ → เพิ่มไปยังหน้าจอหลัก",
      step2Android: "Android: แตะเมนู (⋮) → ติดตั้งแอป หรือ เพิ่มไปยังหน้าจอหลัก",
      openApp: "เปิดแอป"
    },
    ja: {
      title: "Lease Shield へようこそ",
      subtitle: "この安全なアプリひとつで、賃貸保証金を守り、支払いを管理し、トラブルを整理できます。",
      depositTitle: "デポジットシールド",
      depositBody: "保証金・写真・契約書を記録",
      rentTitle: "家賃 & リマインダー",
      rentBody: "期日を追跡し、支払い忘れを防止",
      evidenceTitle: "エビデンスボールト",
      evidenceBody: "入退去の写真やケースメモを保存",
      continueButton: "アプリに進む",
      installHelp: "スマホへのインストール方法",
      modalTitle: "スマホに Lease Shield をインストール",
      step1: "モバイルブラウザで app.leaseshield.asia を開きます。",
      step2iPhone: "iPhone：共有 → ホーム画面に追加 をタップ",
      step2Android: "Android：メニュー (⋮) → アプリをインストール または ホーム画面に追加 をタップ",
      openApp: "アプリを開く"
    },
    ko: {
      title: "Lease Shield에 오신 것을 환영합니다",
      subtitle: "하나의 안전한 앱에서 보증금을 보호하고, 납부 내역을 추적하고, 분쟁을 관리하세요.",
      depositTitle: "보증금 보호",
      depositBody: "보증금, 사진, 계약서를 기록",
      rentTitle: "임대료 & 알림",
      rentBody: "납부일을 추적하고 연체를 방지",
      evidenceTitle: "증거 보관함",
      evidenceBody: "입·퇴실 사진과 메모를 보관",
      continueButton: "앱으로 계속",
      installHelp: "휴대폰에 설치하는 방법",
      modalTitle: "휴대폰에 Lease Shield 설치",
      step1: "모바일 브라우저에서 app.leaseshield.asia 를 엽니다.",
      step2iPhone: "iPhone: 공유 → 홈 화면에 추가 를 탭",
      step2Android: "Android: 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가 선택",
      openApp: "앱 열기"
    },
    zh: {
      title: "欢迎使用 Lease Shield",
      subtitle: "在这一个安全的应用中保护押金、跟踪付款并管理租赁纠纷。",
      depositTitle: "押金防护",
      depositBody: "记录押金、照片和合同",
      rentTitle: "房租与提醒",
      rentBody: "跟踪到期日，不再错过付款",
      evidenceTitle: "证据库",
      evidenceBody: "保存入住/退租照片和案例备注",
      continueButton: "继续进入应用",
      installHelp: "如何在手机上安装",
      modalTitle: "在手机上安装 Lease Shield",
      step1: "在手机浏览器中打开 app.leaseshield.asia。",
      step2iPhone: "iPhone：点击 共享 → 添加到主屏幕",
      step2Android: "Android：点击菜单 (⋮) → 安装应用 或 添加到主屏幕",
      openApp: "打开应用"
    },
    ru: {
      title: "Добро пожаловать в Lease Shield",
      subtitle: "Защищайте залог, отслеживайте платежи и управляйте спорами в одном защищённом приложении.",
      depositTitle: "Deposit Shield",
      depositBody: "фиксируйте залог, фото и договоры",
      rentTitle: "Аренда и напоминания",
      rentBody: "отслеживайте сроки и не пропускайте платежи",
      evidenceTitle: "Хранилище доказательств",
      evidenceBody: "храните фото въезда/выезда и заметки по делу",
      continueButton: "Перейти в приложение",
      installHelp: "Как установить на телефон",
      modalTitle: "Установите Lease Shield на телефон",
      step1: "Откройте app.leaseshield.asia в мобильном браузере.",
      step2iPhone: "iPhone: нажмите Поделиться → На экран «Домой».",
      step2Android: "Android: нажмите меню (⋮) → Установить приложение или Добавить на главный экран.",
      openApp: "Открыть приложение"
    }
  };

  const strings = t[language] || t.en;

  // Preserve query params (source, plan, etc.) for tracking
  const queryParams = window.location.search;

  const handleContinue = () => {
    navigate(`/login${queryParams}`);
  };

  const handleOpenApp = () => {
    setShowInstallModal(false);
    navigate(`/login${queryParams}`);
  };

  // Feature bullets
  const features = [
    {
      icon: Shield,
      title: strings.depositTitle,
      description: strings.depositBody
    },
    {
      icon: Calendar,
      title: strings.rentTitle,
      description: strings.rentBody
    },
    {
      icon: FolderLock,
      title: strings.evidenceTitle,
      description: strings.evidenceBody
    }
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)'
      }}
    >
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/8a29b56f1_LeaseShieldmainlogowobkg.png"
              alt="Lease Shield"
              className="h-16 w-auto"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#0C3B2E' }}>
            {strings.title}
          </h1>

          {/* Subheading */}
          <p className="text-center text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">
            {strings.subtitle}
          </p>

          {/* Feature Bullets */}
          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary Button */}
          <Button
            onClick={handleContinue}
            className="w-full mb-4"
            style={{
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #C7A338',
              boxShadow: '0 4px 12px rgba(12, 59, 46, 0.25)'
            }}
          >
            {strings.continueButton}
          </Button>

          {/* Secondary Link */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full text-center text-sm font-medium flex items-center justify-center gap-2"
            style={{ 
              color: '#0C3B2E', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <Smartphone className="w-4 h-4" />
            {strings.installHelp}
          </button>
        </CardContent>
      </Card>

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowInstallModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Modal Title */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#0C3B2E' }}
                >
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#0C3B2E' }}>
                  {strings.modalTitle}
                </h2>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700">
                    1
                  </div>
                  <p className="text-gray-700">
                    {strings.step1}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700">
                    2
                  </div>
                  <p className="text-gray-700">
                    {strings.step2iPhone}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-gray-700">
                    3
                  </div>
                  <p className="text-gray-700">
                    {strings.step2Android}
                  </p>
                </div>
              </div>

              {/* Open App Button */}
              <Button
                onClick={handleOpenApp}
                className="w-full"
                style={{
                  backgroundColor: '#0C3B2E',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #C7A338'
                }}
              >
                {strings.openApp}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}