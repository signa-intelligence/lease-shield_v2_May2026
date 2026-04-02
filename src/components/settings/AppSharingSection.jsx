import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Globe, X } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { isInstalledApp } from "../../utils/detectInstalledApp";

const translations = {
  en: {
    title: "Get the App",
    availableOn: "LeaseShield is available on:",
    android: "Android",
    androidDesc: "Download our mobile app from Google Play Store",
    desktopWeb: "Desktop & Web",
    webDesc: "Access LeaseShield from any browser on your computer or tablet",
    visit: "Visit",
  },
  th: {
    title: "ดาวน์โหลดแอป",
    availableOn: "LeaseShield พร้อมใช้งานบน:",
    android: "Android",
    androidDesc: "ดาวน์โหลดแอปมือถือจาก Google Play Store",
    desktopWeb: "เดสก์ท็อปและเว็บ",
    webDesc: "เข้าใช้ LeaseShield จากเบราว์เซอร์ใดก็ได้บนคอมพิวเตอร์หรือแท็บเล็ตของคุณ",
    visit: "เยี่ยมชม",
  },
  zh: {
    title: "获取应用",
    availableOn: "LeaseShield 可在以下平台使用:",
    android: "Android",
    androidDesc: "从 Google Play 商店下载我们的移动应用",
    desktopWeb: "桌面和网页版",
    webDesc: "在电脑或平板电脑的任何浏览器上访问 LeaseShield",
    visit: "访问",
  },
  ja: {
    title: "アプリを入手",
    availableOn: "LeaseShieldは以下で利用可能です:",
    android: "Android",
    androidDesc: "Google Playストアからモバイルアプリをダウンロード",
    desktopWeb: "デスクトップとウェブ",
    webDesc: "パソコンやタブレットのブラウザからLeaseShieldにアクセス",
    visit: "アクセス",
  },
  ko: {
    title: "앱 다운로드",
    availableOn: "LeaseShield는 다음에서 사용 가능합니다:",
    android: "Android",
    androidDesc: "Google Play 스토어에서 모바일 앱 다운로드",
    desktopWeb: "데스크톱 및 웹",
    webDesc: "컴퓨터나 태블릿의 브라우저에서 LeaseShield에 액세스",
    visit: "방문",
  },
  ru: {
    title: "Скачать приложение",
    availableOn: "LeaseShield доступен на:",
    android: "Android",
    androidDesc: "Скачайте мобильное приложение из Google Play Store",
    desktopWeb: "Десктоп и веб",
    webDesc: "Получите доступ к LeaseShield через любой браузер на компьютере или планшете",
    visit: "Посетите",
  },
};

export default function AppSharingSection({ language, colors, isDarkMode }) {
  const t = translations[language] || translations.en;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('app_download_dismissed');
    const inApp = isInstalledApp();
    if (!inApp && dismissed !== 'true') {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    haptic.light();
    localStorage.setItem('app_download_dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Download className="w-5 h-5" style={{ color: '#0C3B2E' }} />
            {t.title}
          </CardTitle>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <X className="w-4 h-4" style={{ color: colors.textSecondary }} />
          </button>
        </div>
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
      </CardContent>
    </Card>
  );
}