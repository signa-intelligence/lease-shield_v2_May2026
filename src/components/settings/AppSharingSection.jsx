import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Globe, Share2, CheckCircle2, ArrowRight } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";

const translations = {
  en: {
    title: "App & Sharing",
    availableOn: "LeaseShield is available on:",
    android: "Android",
    androidDesc: "Download our mobile app from Google Play Store",
    desktopWeb: "Desktop & Web",
    webDesc: "Access LeaseShield from any browser on your computer or tablet",
    visit: "Visit",
    shareTitle: "Share App with Friends",
    shareDesc: "Invite others to protect their deposits",
  },
  th: {
    title: "แอปและการแชร์",
    availableOn: "LeaseShield พร้อมใช้งานบน:",
    android: "Android",
    androidDesc: "ดาวน์โหลดแอปมือถือจาก Google Play Store",
    desktopWeb: "เดสก์ท็อปและเว็บ",
    webDesc: "เข้าใช้ LeaseShield จากเบราว์เซอร์ใดก็ได้บนคอมพิวเตอร์หรือแท็บเล็ตของคุณ",
    visit: "เยี่ยมชม",
    shareTitle: "แชร์แอปกับเพื่อน",
    shareDesc: "ชวนคนอื่นมาป้องกันเงินมัดจำของพวกเขา",
  },
  zh: {
    title: "应用与分享",
    availableOn: "LeaseShield 可在以下平台使用:",
    android: "Android",
    androidDesc: "从 Google Play 商店下载我们的移动应用",
    desktopWeb: "桌面和网页版",
    webDesc: "在电脑或平板电脑的任何浏览器上访问 LeaseShield",
    visit: "访问",
    shareTitle: "与朋友分享应用",
    shareDesc: "邀请他人保护他们的押金",
  },
  ja: {
    title: "アプリと共有",
    availableOn: "LeaseShieldは以下で利用可能です:",
    android: "Android",
    androidDesc: "Google Playストアからモバイルアプリをダウンロード",
    desktopWeb: "デスクトップとウェブ",
    webDesc: "パソコンやタブレットのブラウザからLeaseShieldにアクセス",
    visit: "アクセス",
    shareTitle: "友達とアプリを共有",
    shareDesc: "他の人に敷金保護を勧める",
  },
  ko: {
    title: "앱 및 공유",
    availableOn: "LeaseShield는 다음에서 사용 가능합니다:",
    android: "Android",
    androidDesc: "Google Play 스토어에서 모바일 앱 다운로드",
    desktopWeb: "데스크톱 및 웹",
    webDesc: "컴퓨터나 태블릿의 브라우저에서 LeaseShield에 액세스",
    visit: "방문",
    shareTitle: "친구와 앱 공유",
    shareDesc: "다른 사람들이 보증금을 보호하도록 초대",
  },
  ru: {
    title: "Приложение и обмен",
    availableOn: "LeaseShield доступен на:",
    android: "Android",
    androidDesc: "Скачайте мобильное приложение из Google Play Store",
    desktopWeb: "Десктоп и веб",
    webDesc: "Получите доступ к LeaseShield через любой браузер на компьютере или планшете",
    visit: "Посетите",
    shareTitle: "Поделиться приложением с другом",
    shareDesc: "Пригласите других защитить свои депозиты",
  },
};

export default function AppSharingSection({ language, colors, isDarkMode, onShareApp, appLinkCopied }) {
  const t = translations[language] || translations.en;

  return (
    <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <Download className="w-5 h-5" style={{ color: '#0C3B2E' }} />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: colors.textSecondary }}>
          {t.availableOn}
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Android Card */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.fieldBg,
            borderRadius: '12px',
            borderLeft: '4px solid #0C3B2E',
          }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#0C3B2E',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📱
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: colors.textPrimary }}>{t.android}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{t.androidDesc}</p>
              </div>
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=asia.leaseshield.app"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.light()}
            >
              <img
                src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                alt="Get it on Google Play"
                style={{ height: '56px', marginTop: '4px' }}
              />
            </a>
          </div>

          {/* Desktop & Web Card */}
          <div style={{
            padding: '20px',
            backgroundColor: colors.fieldBg,
            borderRadius: '12px',
            borderLeft: '4px solid #C7A338',
          }}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#C7A338',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                💻
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: colors.textPrimary }}>{t.desktopWeb}</p>
                <p className="text-sm" style={{ color: colors.textSecondary }}>{t.webDesc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="w-4 h-4" style={{ color: '#0C3B2E' }} />
              <a
                href="https://app.leaseshield.asia"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => haptic.light()}
                style={{
                  color: '#0C3B2E',
                  fontWeight: '700',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                app.leaseshield.asia
              </a>
            </div>
          </div>
        </div>

        {/* Share App */}
        <div
          onClick={onShareApp}
          style={{
            padding: '16px',
            backgroundColor: colors.fieldBg,
            borderRadius: '12px',
            borderLeft: '4px solid #C7A338',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
            e.currentTarget.style.borderLeftColor = '#0C3B2E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.fieldBg;
            e.currentTarget.style.borderLeftColor = '#C7A338';
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: appLinkCopied ? '#10B981' : '#C7A338',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
                {appLinkCopied ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Share2 className="w-5 h-5 text-white" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '2px' }}>
                  {t.shareTitle}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: colors.textSecondary }}>
                  {t.shareDesc}
                </div>
              </div>
            </div>
            {appLinkCopied ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowRight className="w-5 h-5" style={{ color: colors.textSecondary }} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}