import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

export default function LanguageSelector({ isOpen, onClose, colors, currentLanguage = 'en' }) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleLanguageSelect = async (langCode) => {
    if (saving) return;
    setSaving(true);
    try {
      await base44.auth.updateMe({ language: langCode });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      window.location.reload();
    } catch (error) {
      console.error('Failed to update language:', error);
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <Card
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
          padding: '24px',
          maxWidth: '400px',
          width: '100%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
            {currentLanguage === 'th' ? 'เลือกภาษา' : currentLanguage === 'zh' ? '选择语言' : currentLanguage === 'ja' ? '言語を選択' : currentLanguage === 'ko' ? '언어 선택' : currentLanguage === 'ru' ? 'Выбрать язык' : 'Select Language'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: currentLanguage === lang.code ? '#063F2C' : 'transparent',
                border: `2px solid ${currentLanguage === lang.code ? '#063F2C' : colors.borderColor}`,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                color: currentLanguage === lang.code ? '#FFFFFF' : colors.textPrimary,
                opacity: saving ? 0.6 : 1
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-semibold">{lang.name}</span>
              </div>
              {currentLanguage === lang.code && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}