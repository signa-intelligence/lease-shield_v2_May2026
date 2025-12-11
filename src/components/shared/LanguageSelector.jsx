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
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ language: selectedLanguage });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      onClose();
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

        <div className="space-y-2 mb-6">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: selectedLanguage === lang.code ? '#063F2C' : 'transparent',
                border: `2px solid ${selectedLanguage === lang.code ? '#063F2C' : colors.borderColor}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                color: selectedLanguage === lang.code ? '#FFFFFF' : colors.textPrimary
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-semibold">{lang.name}</span>
              </div>
              {selectedLanguage === lang.code && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            style={{
              backgroundColor: '#063F2C',
              color: '#FFFFFF',
              padding: '14px',
              fontWeight: '700',
              fontSize: '15px',
              borderRadius: '12px'
            }}
          >
            {saving ? (
              currentLanguage === 'th' ? 'กำลังบันทึก...' : currentLanguage === 'zh' ? '保存中...' : currentLanguage === 'ja' ? '保存中...' : currentLanguage === 'ko' ? '저장 중...' : currentLanguage === 'ru' ? 'Сохранение...' : 'Saving...'
            ) : (
              currentLanguage === 'th' ? 'บันทึก' : currentLanguage === 'zh' ? '保存' : currentLanguage === 'ja' ? '保存' : currentLanguage === 'ko' ? '저장' : currentLanguage === 'ru' ? 'Сохранить' : 'Save'
            )}
          </Button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              width: '100%',
              padding: '8px',
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {currentLanguage === 'th' ? 'ยกเลิก' : currentLanguage === 'zh' ? '取消' : currentLanguage === 'ja' ? 'キャンセル' : currentLanguage === 'ko' ? '취소' : currentLanguage === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
        </div>
      </Card>
    </div>
  );
}