import React from "react";
import { X, Shield, ArrowRight, CheckCircle2, AlertCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { haptic } from "../shared/HapticFeedback";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProtectionScoreDetails({ 
  isOpen, 
  onClose, 
  score, 
  actionScore,
  tierCap,
  isLocked,
  userTier,
  suggestions, 
  isDarkMode,
  language 
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getStatusInfo = (score) => {
    // TIER-GATED: Only Secure can show "Fully Covered"
    if (score >= 90 && userTier === 'secure') return { label: language === 'th' ? 'ครอบคลุมเต็มรูปแบบ (Secure)' : language === 'zh' ? '完全覆盖（Secure）' : language === 'ja' ? '完全カバー（Secure）' : language === 'ko' ? '완전 보장（Secure）' : language === 'ru' ? 'Полное покрытие（Secure）' : 'Fully Covered (Secure)', color: '#10B981', bgColor: '#ECFDF5' };
    if (score >= 75) return { label: language === 'th' ? 'แข็งแกร่ง' : language === 'zh' ? '强' : language === 'ja' ? '強い' : language === 'ko' ? '강함' : language === 'ru' ? 'Сильная' : 'Strong', color: '#059669', bgColor: '#D1FAE5' };
    if (score >= 50) return { label: language === 'th' ? 'กำลังพัฒนา' : language === 'zh' ? '改进中' : language === 'ja' ? '改善中' : language === 'ko' ? '개선 중' : language === 'ru' ? 'Улучшается' : 'Improving', color: '#F59E0B', bgColor: '#FEF3C7' };
    if (score >= 25) return { label: language === 'th' ? 'พื้นฐาน' : language === 'zh' ? '基本' : language === 'ja' ? '基本' : language === 'ko' ? '기본' : language === 'ru' ? 'Базовая' : 'Basic', color: '#F97316', bgColor: '#FFEDD5' };
    return { label: language === 'th' ? 'มีความเสี่ยง' : language === 'zh' ? '有风险' : language === 'ja' ? 'リスクあり' : language === 'ko' ? '위험' : language === 'ru' ? 'Под угрозой' : 'At Risk', color: '#EF4444', bgColor: '#FEE2E2' };
  };

  const status = getStatusInfo(score);
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
      protectionScore: 'Protection Coverage',
      howToImprove: 'Complete Your Coverage',
      close: 'Close',
      lockedTitle: '🔒 Full Protection Locked',
      lockedMessage: 'Your current plan allows protection up to {cap}/100.',
      lockedSecureOnly: 'Only Secure members can unlock Fully Covered (100%).',
      upgradeToSecure: 'Upgrade to Secure',
      tierCapped: 'Coverage Cap: {cap}/100'
    },
    th: { 
      protectionScore: 'คะแนนการป้องกัน',
      howToImprove: 'วิธีปรับปรุงคะแนนของคุณ',
      pointsEach: 'คะแนนแต่ละอัน',
      close: 'ปิด',
      lockedTitle: '🔒 การป้องกันเต็มรูปแบบถูกล็อก',
      lockedMessage: 'แผนปัจจุบันของคุณอนุญาตให้ป้องกันได้สูงสุด {cap}/100',
      lockedSecureOnly: 'เฉพาะสมาชิก Secure เท่านั้นที่สามารถปลดล็อกครอบคลุมเต็มรูปแบบ (100%)',
      upgradeToSecure: 'อัปเกรดเป็น Secure',
      tierCapped: 'ขีดจำกัดแผน: {cap}/100'
    },
    zh: { 
      protectionScore: '保护覆盖',
      howToImprove: '完成您的覆盖',
      close: '关闭',
      lockedTitle: '🔒 完全保护已锁定',
      lockedMessage: '您当前的计划允许保护最高达{cap}/100',
      lockedSecureOnly: '只有Secure会员才能解锁完全覆盖（100%）',
      upgradeToSecure: '升级到Secure',
      tierCapped: '覆盖上限：{cap}/100'
    },
    ja: { 
      protectionScore: '保護カバレッジ',
      howToImprove: 'カバレッジを完了',
      close: '閉じる',
      lockedTitle: '🔒 完全保護がロック',
      lockedMessage: '現在のプランでは最大{cap}/100まで保護可能',
      lockedSecureOnly: 'Secureメンバーのみが完全カバー（100%）をアンロック可能',
      upgradeToSecure: 'Secureにアップグレード',
      tierCapped: 'カバレッジ上限：{cap}/100'
    },
    ko: { 
      protectionScore: '보호 범위',
      howToImprove: '범위 완료',
      close: '닫기',
      lockedTitle: '🔒 완전 보호 잠김',
      lockedMessage: '현재 플랜은 최대 {cap}/100까지 보호 허용',
      lockedSecureOnly: 'Secure 회원만 완전 보장（100%）을 잠금 해제할 수 있습니다',
      upgradeToSecure: 'Secure로 업그레이드',
      tierCapped: '범위 상한：{cap}/100'
    },
    ru: { 
      protectionScore: 'Охват защиты',
      howToImprove: 'Завершите охват',
      close: 'Закрыть',
      lockedTitle: '🔒 Полная защита заблокирована',
      lockedMessage: 'Ваш текущий план позволяет защиту до {cap}/100',
      lockedSecureOnly: 'Только участники Secure могут разблокировать полное покрытие（100%）',
      upgradeToSecure: 'Обновить до Secure',
      tierCapped: 'Лимит охвата：{cap}/100'
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
          {/* Locked State Banner */}
          {isLocked && userTier !== 'secure' && (
          <div className="mb-6 p-5 rounded-xl" style={{
            backgroundColor: isDarkMode ? '#2A1F1F' : '#FFFBEB',
            border: '2px solid #C7A338'
          }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C7A338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base mb-2" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                  {strings.lockedTitle}
                </h3>
                <p className="text-sm mb-2" style={{ color: isDarkMode ? '#FDE68A' : '#B45309' }}>
                  {strings.lockedMessage.replace('{cap}', tierCap)}
                </p>
                <p className="text-sm font-semibold mb-4" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                  {strings.lockedSecureOnly}
                </p>
                <button
                  onClick={() => {
                    haptic.medium();
                    onClose();
                    window.location.href = '/account?showPlans=true';
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#0C3B2E',
                    color: '#FFFFFF',
                    border: '2px solid #C7A338',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(199,163,56,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#C7A338';
                    e.target.style.borderColor = '#C7A338';
                    e.target.style.color = '#1A1D1F';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#0C3B2E';
                    e.target.style.borderColor = '#C7A338';
                    e.target.style.color = '#FFFFFF';
                  }}
                >
                  {strings.upgradeToSecure}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Fuel Gauge */}
          <div className="mb-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="text-5xl font-bold" style={{ color: status.color }}>
                {score}/100
              </div>
              {isLocked && userTier !== 'secure' && (
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7A338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
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
            {tierCap < 100 && (
              <div className="text-xs mt-2 font-medium" style={{ color: colors.textSecondary }}>
                {strings.tierCapped.replace('{cap}', tierCap)}
              </div>
            )}
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
                  width: `${score}%`,
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
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>25</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>50</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>75</span>
              <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>100</span>
            </div>
          </div>

          {/* Coverage Tasks */}
          {suggestions && suggestions.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-4" style={{ color: colors.textPrimary }}>
                {strings.howToImprove}
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => {
                  const isCompleted = suggestion.completed === true;
                  return (
                    <div
                      key={idx}
                      onClick={() => !isCompleted && handleSuggestionClick(suggestion)}
                      className={isCompleted ? '' : 'cursor-pointer card-interactive'}
                      style={{
                        padding: '16px',
                        backgroundColor: isCompleted ? (isDarkMode ? '#1E3A2E' : '#F0FDF4') : colors.fieldBg,
                        borderRadius: '12px',
                        border: `2px solid ${isCompleted ? '#10B981' : colors.borderColor}`,
                        transition: 'all 0.2s',
                        opacity: isCompleted ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.borderColor = '#10B981';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCompleted) {
                          e.currentTarget.style.borderColor = colors.borderColor;
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            )}
                            <p className="text-sm font-semibold" style={{ color: isCompleted ? '#10B981' : colors.textPrimary }}>
                              {suggestion.action}
                            </p>
                            {suggestion.points && (
                              <Badge className="text-xs font-bold" style={{
                                backgroundColor: isCompleted ? '#10B981' : '#F59E0B',
                                color: '#FFFFFF'
                              }}>
                                +{suggestion.points}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                            {suggestion.benefit}
                          </p>
                        </div>
                        {!isCompleted && (
                          <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Final Secure-only task */}
                {userTier !== 'secure' && (
                  <div
                    onClick={() => {
                      haptic.medium();
                      onClose();
                      navigate(createPageUrl("Account") + "?showPlans=true");
                    }}
                    className="cursor-pointer card-interactive"
                    style={{
                      padding: '16px',
                      backgroundColor: isDarkMode ? '#2D2520' : '#FFFBEB',
                      borderRadius: '12px',
                      border: `2px solid #C7A338`,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0C3B2E';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#C7A338';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7A338" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                            {language === 'th' ? 'อัปเกรดเป็น Secure เพื่อปลดล็อกการป้องกันเต็มรูปแบบ' : language === 'zh' ? '升级到Secure以解锁完全保护' : language === 'ja' ? 'Secureにアップグレードして完全保護をアンロック' : language === 'ko' ? 'Secure로 업그레이드하여 완전 보호 잠금 해제' : language === 'ru' ? 'Обновите до Secure для полной защиты' : 'Upgrade to Secure to unlock full protection'}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: isDarkMode ? '#FDE68A' : '#B45309' }}>
                          {language === 'th' ? 'ปลดล็อกการป้องกันระดับพรีเมียมและครอบคลุม 100%' : language === 'zh' ? '解锁高级保护并达到100%覆盖' : language === 'ja' ? 'プレミアム保護と100%カバレッジをアンロック' : language === 'ko' ? '프리미엄 보호 및 100% 보장 잠금 해제' : language === 'ru' ? 'Разблокируйте премиум защиту и 100% покрытие' : 'Unlock premium protection and 100% coverage'}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: '#C7A338' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Celebration - Only for Secure at 90+ */}
          {score >= 90 && userTier === 'secure' && (
            <div className="mt-6 p-4 rounded-xl text-center" style={{
              backgroundColor: isDarkMode ? '#10B98130' : '#ECFDF5',
              border: `2px solid ${isDarkMode ? '#10B981' : '#A7F3D0'}`
            }}>
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                {language === 'th' ? 'ยอดเยี่ยม! คุณครอบคลุมเต็มรูปแบบแล้ว' : language === 'zh' ? '太棒了！您已获得完全覆盖' : language === 'ja' ? '素晴らしい！完全カバーを達成しました' : language === 'ko' ? '훌륭합니다! 완전 보장을 달성했습니다' : language === 'ru' ? 'Отлично! Вы достигли полного покрытия' : 'Excellent! You are Fully Covered'}
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