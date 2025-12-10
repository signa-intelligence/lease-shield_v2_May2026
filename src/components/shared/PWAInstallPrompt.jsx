import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export default function PWAInstallPrompt({ language = 'en', isDarkMode = false }) {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Don't show banner if running as standalone PWA or in native wrapper
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isNativeWrapper = navigator.userAgent.includes('LeaseShieldApp');

  if (isStandalone || isNativeWrapper) {
    return null;
  }

  const t = {
    en: {
      install: 'Install App',
      installForOffline: 'For quick access and offline features, add to your home screen.',
      close: 'Close',
    },
    th: {
      install: 'ติดตั้งแอป',
      installForOffline: 'เพื่อการเข้าถึงที่รวดเร็วและฟีเจอร์ออฟไลน์ เพิ่มไปยังหน้าจอหลักของคุณ',
      close: 'ปิด',
    },
    zh: {
        install: '安装应用',
        installForOffline: '为了快速访问和离线功能，请添加到主屏幕。',
        close: '关闭',
    },
    ja: {
        install: 'アプリをインストール',
        installForOffline: 'すばやいアクセスとオフライン機能のために、ホーム画面に追加してください。',
        close: '閉じる',
    },
    ko: {
        install: '앱 설치',
        installForOffline: '빠른 액세스와 오프라인 기능을 위해 홈 화면에 추가하세요.',
        close: '닫기',
    },
    ru: {
        install: 'Установить',
        installForOffline: 'Для быстрого доступа и офлайн-функций, добавьте на главный экран.',
        close: 'Закрыть',
    },
  };

  const strings = t[language] || t.en;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsVisible(true);
      console.log('✅ `beforeinstallprompt` event fired. Prompt is visible.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setIsVisible(false);
    setInstallPromptEvent(null);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `calc(90px + env(safe-area-inset-bottom, 0px))`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 'calc(100% - 32px)',
        maxWidth: '500px',
        animation: 'slideInUp 0.3s ease-out'
      }}
    >
      <div
        style={{
          background: isDarkMode ? '#1F2937' : '#FFFFFF',
          color: isDarkMode ? '#F9FAFB' : '#0F172A',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
        }}
      >
        <div style={{
            width: '48px',
            height: '48px',
            flexShrink: 0,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0C3B2E, #047857)'
        }}>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
              alt="Lease Shield Logo"
              style={{ width: '40px', height: '40px' }}
            />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '15px' }}>{strings.install}</p>
          <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '2px' }}>{strings.installForOffline}</p>
        </div>

        <Button
            onClick={handleInstallClick}
            style={{
                background: '#0C3B2E',
                color: 'white',
                fontWeight: '600',
                borderRadius: '10px',
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                border: '2px solid #C7A338'
            }}
            className="btn-interaction"
        >
          <Download className="w-4 h-4 mr-2" />
          {strings.install}
        </Button>
        <button 
            onClick={handleClose} 
            className="btn-interaction"
            style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderRadius: '50%',
                padding: '4px',
                border: 'none',
                cursor: 'pointer'
            }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}