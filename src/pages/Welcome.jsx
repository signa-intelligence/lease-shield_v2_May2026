import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Calendar, FolderLock, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { haptic } from "../components/shared/HapticFeedback";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function Welcome() {
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Get user language preference (defaults to 'en' for unauthenticated users)
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Handle referral code from URL and redirect authenticated users
  React.useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Check for ref param and process referral
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode && !user.referred_by && !user.referral_code_processed) {
          // Process referral in background
          base44.functions.invoke('processReferralSignup', { referralCode: refCode })
            .then(() => console.log('[WELCOME] Referral processed'))
            .catch(err => console.error('[WELCOME] Referral failed:', err));
          
          // Mark as processed to avoid duplicate calls
          base44.auth.updateMe({ referral_code_processed: true })
            .catch(err => console.error('[WELCOME] Failed to mark referral processed:', err));
        }
        
        window.location.href = '/dashboard';
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, isLoading]);

  const language = user?.language || 'en';

  // WebView Detection
  const isWebView = () => {
    const ua = navigator.userAgent || '';
    const isWebViewUA = ua.includes('wv') || ua.includes('Crosswalk');
    const isIOSWebView = window.navigator.standalone === false && screen.width < 1024;
    return isWebViewUA || isIOSWebView;
  };

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
      continueButton: "Continue with Google",
      continueCaption: "We use Base44.com to securely handle sign-in with Google.",
      checkingSession: "Checking your session...",
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
      continueButton: "ดำเนินการต่อด้วย Google",
      continueCaption: "เราใช้ Base44.com เพื่อจัดการการลงชื่อเข้าใช้ด้วย Google อย่างปลอดภัย",
      checkingSession: "กำลังตรวจสอบเซสชันของคุณ...",
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
      continueCaption: "Мы используем Base44.com для безопасной авторизации через Google.",
      checkingSession: "Проверка вашей сессии...",
      installHelp: "Как установить на телефон",
      modalTitle: "Установите Lease Shield на телефон",
      step1: "Откройте app.leaseshield.asia в мобильном браузере.",
      step2iPhone: "iPhone: нажмите Поделиться → На экран «Домой».",
      step2Android: "Android: нажмите меню (⋮) → Установить приложение или Добавить на главный экран.",
      openApp: "Открыть приложение"
    }
  };

  const strings = t[language] || t.en;

  if (checkingAuth || isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center page-transition"
        style={{
          background: 'linear-gradient(135deg, #F3F6F5 0%, #E8EDEC 100%)'
        }}
      >
        <LoadingSpinner
          size="lg"
          color="#0C3B2E"
          text={strings.checkingSession}
        />
      </div>
    );
  }

  // Preserve query params (source, plan, etc.) for tracking
  const queryParams = window.location.search;

  const handleContinue = () => {
    haptic.medium();
    // Preserve ref param through login flow
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const nextUrl = refCode ? `/welcome?ref=${refCode}` : '/cookie-sync';
    window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`;
  };

  const handleOpenApp = () => {
    haptic.light();
    setShowInstallModal(false);
    window.location.href = "/login?next=/cookie-sync";
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
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3" style={{ color: '#063F2C' }}>
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
                  style={{ backgroundColor: '#063F2C' }}
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

          {/* Primary Google Button */}
          <Button
            onClick={handleContinue}
            className="w-full mb-2 btn-interaction"
            style={{
              backgroundColor: '#063F2C',
              color: '#FFFFFF',
              padding: '14px 24px',
              fontSize: '17px',
              fontWeight: '700',
              borderRadius: '12px',
              border: '2px solid #CFAF6A',
              boxShadow: '0 6px 16px rgba(12, 59, 46, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {strings.continueButton}
          </Button>

          {/* Security Caption */}
          <p className="text-xs text-center mb-4" style={{ color: '#64748B', lineHeight: '1.4' }}>
            {strings.continueCaption}
          </p>

          {/* Secondary Link */}
          <button
            onClick={() => {
              haptic.light();
              setShowInstallModal(true);
            }}
            className="w-full text-center text-sm font-medium flex items-center justify-center gap-2 btn-interaction"
            style={{ 
              color: '#063F2C', 
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
              onClick={() => {
                haptic.light();
                setShowInstallModal(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors btn-interaction"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Modal Title */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#063F2C' }}
                >
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#063F2C' }}>
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
                className="w-full btn-interaction"
                style={{
                  backgroundColor: '#063F2C',
                  color: '#FFFFFF',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '12px',
                  border: '2px solid #CFAF6A'
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