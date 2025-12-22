import React from "react";
import { X, Shield, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { haptic } from "../shared/HapticFeedback";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProtectionScoreDetails({ 
  isOpen, 
  onClose, 
  score, 
  suggestions, 
  isDarkMode,
  language 
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getStatusInfo = (score, isLocked, userTier) => {
    if (score >= 90 && userTier === 'secure') return { label: language === 'th' ? 'ครอบคลุมเต็มรูปแบบ (Secure)' : language === 'zh' ? '完全覆盖 (Secure)' : language === 'ja' ? '完全カバー (Secure)' : language === 'ko' ? '완전 보장 (Secure)' : language === 'ru' ? 'Полное покрытие (Secure)' : 'Fully Covered (Secure)', color: '#10B981', bgColor: '#ECFDF5' };
    if (score >= 75) return { label: language === 'th' ? 'แข็งแกร่ง' : language === 'zh' ? '强' : language === 'ja' ? '強い' : language === 'ko' ? '강함' : language === 'ru' ? 'Сильная' : 'Strong', color: '#059669', bgColor: '#D1FAE5' };
    if (score >= 50) return { label: language === 'th' ? 'กำลังพัฒนา' : language === 'zh' ? '改进中' : language === 'ja' ? '改善中' : language === 'ko' ? '개선 중' : language === 'ru' ? 'Улучшается' : 'Improving', color: '#F59E0B', bgColor: '#FEF3C7' };
    if (score >= 25) return { label: language === 'th' ? 'พื้นฐาน' : language === 'zh' ? '基本' : language === 'ja' ? '基本' : language === 'ko' ? '기본' : language === 'ru' ? 'Базовая' : 'Basic', color: '#F97316', bgColor: '#FFEDD5' };
    return { label: language === 'th' ? 'มีความเสี่ยง' : language === 'zh' ? '有风险' : language === 'ja' ? 'リスクあり' : language === 'ko' ? '위험' : language === 'ru' ? 'Под угрозой' : 'At Risk', color: '#EF4444', bgColor: '#FEE2E2' };
  };

  const status = getStatusInfo(score, isLocked, userTier);
  const colors = isDarkMode ? {
    bg: '#111827',
    cardBg: '#1F2937',
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

  const t = {
    en: { 
      protectionScore: 'Protection Score',
      howToImprove: 'How to Improve Your Score',
      pointsEach: 'points each',
      close: 'Close'
    },
    th: { 
      protectionScore: 'คะแนนการป้องกัน',
      howToImprove: 'วิธีปรับปรุงคะแนนของคุณ',
      pointsEach: 'คะแนนแต่ละอัน',
      close: 'ปิด'
    },
    zh: { 
      protectionScore: '保护分数',
      howToImprove: '如何提高分数',
      pointsEach: '每个积分',
      close: '关闭'
    },
    ja: { 
      protectionScore: '保護スコア',
      howToImprove: 'スコアの改善方法',
      pointsEach: 'ポイント',
      close: '閉じる'
    },
    ko: { 
      protectionScore: '보호 점수',
      howToImprove: '점수를 향상시키는 방법',
      pointsEach: '각 포인트',
      close: '닫기'
    },
    ru: { 
      protectionScore: 'Уровень защиты',
      howToImprove: 'Как улучшить уровень',
      pointsEach: 'баллов каждый',
      close: 'Закрыть'
    }
  };

  const strings = t[language] || t.en;

  const handleSuggestionClick = (suggestion) => {
    haptic.medium();
    onClose();
    navigate(suggestion.route);
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95vw',
          maxWidth: '500px',
          maxHeight: '85vh',
          backgroundColor: colors.cardBg,
          borderRadius: '20px',
          boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.6)' : '0 20px 40px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalEnter 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `1px solid ${colors.borderColor}`
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${colors.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.textPrimary }}>
            {strings.protectionScore}
          </h2>
          <button
            onClick={() => {
              haptic.light();
              onClose();
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: colors.fieldBg,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDarkMode ? '#4B5563' : '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.fieldBg;
            }}
          >
            <X className="w-5 h-5" style={{ color: colors.textPrimary }} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Fuel Gauge */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-5xl font-bold" style={{ color: status.color }}>
                  {score}/{tierCap}
                </div>
                {isLocked && (
                  <Crown className="w-10 h-10 text-amber-600" />
                )}
              </div>
              <div 
                className="inline-block px-4 py-2 rounded-full text-sm font-bold"
                style={{ 
                  backgroundColor: isDarkMode ? status.color + '30' : status.bgColor,
                  color: status.color 
                }}
              >
                {status.label}
              </div>
            </div>

            {/* Horizontal Fuel Bar Gauge */}
            <div style={{
              width: '100%',
              height: '60px',
              backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
              borderRadius: '30px',
              overflow: 'hidden',
              position: 'relative',
              border: `3px solid ${colors.borderColor}`,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {/* Fuel Fill */}
              <div
                style={{
                  width: `${(score / tierCap) * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${score >= 90 ? '#10B981' : score >= 75 ? '#059669' : score >= 50 ? '#F59E0B' : score >= 25 ? '#F97316' : '#EF4444'} 0%, ${score >= 90 ? '#059669' : score >= 75 ? '#047857' : score >= 50 ? '#D97706' : score >= 25 ? '#EA580C' : '#DC2626'} 100%)`,
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '12px'
                }}
              >
                {score > 20 && (
                  <Shield className="w-6 h-6 text-white" style={{ opacity: 0.9 }} />
                )}
              </div>

              {/* Segmentation Lines */}
              {[25, 50, 75].map(mark => (
                <div
                  key={mark}
                  style={{
                    position: 'absolute',
                    left: `${mark}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    zIndex: 1
                  }}
                />
              ))}
            </div>

            {/* Gauge Labels */}
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>0</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{Math.round(tierCap * 0.25)}</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{Math.round(tierCap * 0.5)}</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{Math.round(tierCap * 0.75)}</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{tierCap}</span>
            </div>
          </div>

          {/* Locked State Banner */}
          {isLocked && (
            <div className="p-5 rounded-xl mb-6" style={{
              backgroundColor: isDarkMode ? '#2D2520' : '#FFFBEB',
              border: `3px solid ${isDarkMode ? '#C7A338' : '#F59E0B'}`
            }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-2" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                    {language === 'th' ? '🔒 การป้องกันเต็มรูปแบบถูกล็อค' : language === 'zh' ? '🔒 全面保护已锁定' : language === 'ja' ? '🔒 完全な保護がロックされています' : language === 'ko' ? '🔒 전체 보호 잠김' : language === 'ru' ? '🔒 Полная защита заблокирована' : '🔒 Full Protection Locked'}
                  </h4>
                  <p className="text-sm whitespace-pre-line" style={{ color: isDarkMode ? '#FDE68A' : '#78350F' }}>
                    {language === 'th' 
                      ? `แผนปัจจุบันของคุณอนุญาตการป้องกันได้สูงสุด ${tierCap}/100\nเฉพาะสมาชิก Secure เท่านั้นที่สามารถปลดล็อค Fully Covered (100%)`
                      : language === 'zh'
                        ? `您当前的计划允许保护最高达 ${tierCap}/100。\n只有Secure会员才能解锁完全覆盖（100%）。`
                        : language === 'ja'
                          ? `現在のプランでは最大${tierCap}/100まで保護できます。\nSecureメンバーのみがFully Covered（100%）をアンロックできます。`
                          : language === 'ko'
                            ? `현재 플랜은 최대 ${tierCap}/100까지 보호할 수 있습니다.\nSecure 회원만 완전 보장（100%）을 잠금 해제할 수 있습니다.`
                            : language === 'ru'
                              ? `Ваш текущий план позволяет защиту до ${tierCap}/100.\nТолько участники Secure могут разблокировать Полное покрытие (100%).`
                              : `Your current plan allows protection up to ${tierCap}/100.\nOnly Secure members can unlock Fully Covered (100%).`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  haptic.medium();
                  onClose();
                  navigate(createPageUrl("Account") + "?showPlans=true");
                }}
                className="w-full"
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#C7A338',
                  color: '#1A1D1F',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(199,163,56,0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.color = '#FFFFFF';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(12,59,46,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#C7A338';
                  e.target.style.color = '#1A1D1F';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(199,163,56,0.4)';
                }}
              >
                👑 {language === 'th' ? 'อัปเกรดเป็น Secure' : language === 'zh' ? '升级到Secure' : language === 'ja' ? 'Secureにアップグレード' : language === 'ko' ? 'Secure로 업그레이드' : language === 'ru' ? 'Обновить до Secure' : 'Upgrade to Secure'}
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-4" style={{ color: colors.textPrimary }}>
                {strings.howToImprove}
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="cursor-pointer card-interactive"
                    style={{
                      padding: '16px',
                      backgroundColor: colors.fieldBg,
                      borderRadius: '12px',
                      border: `2px solid ${colors.borderColor}`,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.borderColor;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {suggestion.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                          )}
                          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                            {suggestion.action}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          +{suggestion.points} {strings.pointsEach}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {score >= 90 && !isLocked && userTier === 'secure' && (
            <div className="mt-6 p-4 rounded-xl text-center" style={{
              backgroundColor: isDarkMode ? '#10B98130' : '#ECFDF5',
              border: `2px solid ${isDarkMode ? '#10B981' : '#A7F3D0'}`
            }}>
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                {language === 'th' ? 'ยอดเยี่ยม! คุณได้รับ Fully Covered (Secure) แล้ว' : language === 'zh' ? '太棒了！您已获得完全覆盖 (Secure)' : language === 'ja' ? '素晴らしい！Fully Covered (Secure) を達成しました' : language === 'ko' ? '훌륭합니다! 완전 보장 (Secure)을 달성했습니다' : language === 'ru' ? 'Отлично! Вы достигли Полного покрытия (Secure)' : 'Excellent! You have achieved Fully Covered (Secure)'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: translate(-50%, -45%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}