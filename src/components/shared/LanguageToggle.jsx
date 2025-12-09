import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { haptic } from "./HapticFeedback";

export default function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateLanguageMutation = useMutation({
    mutationFn: (language) => base44.auth.updateMe({ language }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsOpen(false);
    },
  });

  const currentLanguage = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';

  const languages = [
    { code: 'en', name: 'English', flag: 'EN', nativeName: 'English' },
    { code: 'th', name: 'Thai', flag: 'TH', nativeName: 'ไทย' },
    { code: 'zh', name: 'Chinese', flag: 'CN', nativeName: '简体中文' },
    { code: 'ja', name: 'Japanese', flag: 'JP', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', flag: 'KR', nativeName: '한국어' },
    { code: 'ru', name: 'Russian', flag: 'RU', nativeName: 'Русский' }
  ];

  const currentLang = languages.find(l => l.code === currentLanguage);

  const handleLanguageChange = (langCode) => {
    haptic.light();
    updateLanguageMutation.mutate(langCode);
    
    localStorage.setItem('preferred_language', langCode);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => {
          haptic.light();
          setIsOpen(!isOpen);
        }}
        aria-label="Change Language"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '11px',
          fontWeight: '700',
          color: isDarkMode ? '#ECEFED' : '#0C3B2E'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#0C3B2E';
          e.target.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#ECEFED';
          e.target.style.color = isDarkMode ? '#ECEFED' : '#0C3B2E';
        }}
      >
        <span>{currentLang?.flag || 'EN'}</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />

          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              backgroundColor: isDarkMode ? '#2A2D30' : '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              padding: '8px',
              minWidth: '200px',
              zIndex: 999,
              animation: 'slideDown 0.2s ease-out'
            }}
          >
            <style>
              {`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>

            <div style={{
              padding: '8px 12px',
              marginBottom: '4px',
              borderBottom: `1px solid ${isDarkMode ? '#3A3D40' : '#E5E7EB'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isDarkMode ? '#A8ABAD' : '#64748b',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                <Globe className="w-4 h-4" />
                <span>SELECT LANGUAGE</span>
              </div>
            </div>

            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={updateLanguageMutation.isPending}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  backgroundColor: currentLanguage === lang.code 
                    ? (isDarkMode ? '#0C3B2E' : '#E8F5E9') 
                    : 'transparent',
                  color: currentLanguage === lang.code
                    ? (isDarkMode ? '#FFFFFF' : '#0C3B2E')
                    : (isDarkMode ? '#ECEFED' : '#1A1D1F'),
                  borderRadius: '8px',
                  cursor: updateLanguageMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: currentLanguage === lang.code ? '600' : '400',
                  transition: 'all 0.15s',
                  marginBottom: '2px',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (currentLanguage !== lang.code && !updateLanguageMutation.isPending) {
                    e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '700',
                  backgroundColor: isDarkMode ? '#3A3D40' : '#F3F4F6',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  minWidth: '28px',
                  textAlign: 'center'
                }}>
                  {lang.flag}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600' }}>{lang.nativeName}</div>
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.7,
                    marginTop: '2px'
                  }}>
                    {lang.name}
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <span style={{ fontSize: '16px' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}