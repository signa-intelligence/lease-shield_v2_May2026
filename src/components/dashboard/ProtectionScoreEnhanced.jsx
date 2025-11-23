import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Award, Target, ChevronRight, CheckCircle2, ChevronLeft, Star, Trophy, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const ProtectionScoreEnhanced = ({
  score,
  breakdown,
  recommendations,
  language = 'en',
  colors,
  compact = false,
  user,
  isDarkMode = false // Added isDarkMode prop
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const queryClient = useQueryClient();

  const dismissedRecs = user?.dismissed_recommendations || [];

  // Filter out dismissed recommendations
  const activeRecommendations = recommendations.filter(rec =>
    !dismissedRecs.includes(rec.action)
  );

  const getScoreColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#EAB308';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const t = {
    en: {
      protectionScore: 'Protection Score',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      needsWork: 'Needs Work',
      top: 'Top',
      documentation: 'Documentation',
      protections: 'Protections',
      actions: 'Actions',
      expert: 'Expert',
      selfProtector: 'Self-Protector',
      documenter: 'Documenter',
      actionTaker: 'Action Taker',
      quickWins: 'Quick Wins',
      resetHiddenTips: 'Reset hidden tips',
      allTipsHidden: 'All tips hidden!',
      showTipsAgain: 'Show tips again',
      topPercentile: 'Top {percentile}th Percentile' // New string
    },
    th: {
      protectionScore: 'คะแนนการป้องกัน',
      excellent: 'ยอดเยี่ยม',
      good: 'ดี',
      fair: 'พอใช้',
      needsWork: 'ต้องปรับปรุง',
      top: 'ท็อป',
      documentation: 'เอกสาร',
      protections: 'การป้องกัน',
      actions: 'การดำเนินการ',
      expert: 'ผู้เชี่ยวชาญ',
      selfProtector: 'ผู้ป้องกันตัวเอง',
      documenter: 'นักจัดเก็บเอกสาร',
      actionTaker: 'นักดำเนินการ',
      quickWins: 'วิธีปรับปรุงคะแนน',
      resetHiddenTips: 'รีเซ็ตคำแนะนำที่ซ่อน',
      allTipsHidden: 'ซ่อนคำแนะนำทั้งหมดแล้ว!',
      showTipsAgain: 'แสดงคำแนะนำอีกครั้ง',
      topPercentile: 'เปอร์เซ็นไทล์สูงสุดที่ {percentile}' // New string
    },
    zh: {
      protectionScore: '保护分数',
      excellent: '优秀',
      good: '良好',
      fair: '一般',
      needsWork: '需要改进',
      top: '前',
      documentation: '文档',
      protections: '保护',
      actions: '行动',
      expert: '专家',
      selfProtector: '自我保护者',
      documenter: '文档管理者',
      actionTaker: '行动者',
      quickWins: '快速提升',
      resetHiddenTips: '重置隐藏提示',
      allTipsHidden: '所有提示已隐藏！',
      showTipsAgain: '再次显示提示',
      topPercentile: '前 {percentile} 百分位' // New string
    },
    ja: {
      protectionScore: '保護スコア',
      excellent: '優秀',
      good: '良い',
      fair: '普通',
      needsWork: '改善が必要',
      top: 'トップ',
      documentation: 'ドキュメント',
      protections: '保護',
      actions: 'アクション',
      expert: 'エキスパート',
      selfProtector: 'セルフプロテクター',
      documenter: 'ドキュメンター',
      actionTaker: '実行者',
      quickWins: 'クイックウィン',
      resetHiddenTips: '非表示のヒントをリセット',
      allTipsHidden: 'すべてのヒントが非表示！',
      showTipsAgain: 'ヒントを再表示',
      topPercentile: '{percentile}パーセンタイル上位' // New string
    },
    ko: {
      protectionScore: '보호 점수',
      excellent: '우수',
      good: '좋음',
      fair: '보통',
      needsWork: '개선 필요',
      top: '상위',
      documentation: '문서화',
      protections: '보호',
      actions: '조치',
      expert: '전문가',
      selfProtector: '자기보호자',
      documenter: '문서 작성자',
      actionTaker: '실행자',
      quickWins: '빠른 개선',
      resetHiddenTips: '숨겨진 팁 재설정',
      allTipsHidden: '모든 팁이 숨겨졌습니다!',
      showTipsAgain: '팁 다시 표시',
      topPercentile: '상위 {percentile} 백분위'
    },
    ru: {
      protectionScore: 'Индекс защиты',
      excellent: 'Отлично',
      good: 'Хорошо',
      fair: 'Удовлетворительно',
      needsWork: 'Требуются действия',
      top: 'Топ',
      documentation: 'Документы',
      protections: 'Меры защиты',
      actions: 'Действия',
      expert: 'Эксперт',
      selfProtector: 'Самозащита',
      documenter: 'Документалист',
      actionTaker: 'Активист',
      quickWins: 'Быстрые улучшения',
      resetHiddenTips: 'Вернуть скрытые советы',
      allTipsHidden: 'Все советы скрыты!',
      showTipsAgain: 'Показать советы снова',
      topPercentile: 'Топ {percentile}%'
    }
  };

  const strings = t[language] || t.en;

  const getScoreGrade = (score) => {
    if (score >= 85) return { grade: 'A+', label: strings.excellent };
    if (score >= 70) return { grade: 'B+', label: strings.good };
    if (score >= 50) return { grade: 'C', label: strings.fair };
    return { grade: 'D', label: strings.needsWork };
  };

  const achievementBadges = {
    expert: {
      en: 'Expert',
      th: 'ผู้เชี่ยวชาญ',
      zh: '专家',
      ja: 'エキスパート',
      ko: '전문가',
      ru: 'Эксперт',
      color: isDarkMode ? '#FFD700' : '#C7A338',
      bgColor: isDarkMode ? 'rgba(255,215,0,0.25)' : 'rgba(199,163,56,0.15)',
      borderColor: isDarkMode ? 'rgba(255,215,0,0.5)' : 'rgba(199,163,56,0.35)'
    },
    selfProtector: {
      en: 'Self-Protector',
      th: 'ป้องกันตนเอง',
      zh: '自我保护者',
      ja: 'セルフプロテクター',
      ko: '자기 보호자',
      ru: 'Самозащита',
      color: isDarkMode ? '#10B981' : '#047857',
      bgColor: isDarkMode ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.15)',
      borderColor: isDarkMode ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.35)'
    },
    documenter: {
      en: 'Documenter',
      th: 'ผู้บันทึก',
      zh: '文档员',
      ja: 'ドキュメンター',
      ko: '문서 작성자',
      ru: 'Документалист',
      color: isDarkMode ? '#3B82F6' : '#2563EB',
      bgColor: isDarkMode ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)',
      borderColor: isDarkMode ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.35)'
    }
  };


  const scoreColor = getScoreColor(score);
  const { grade, label } = getScoreGrade(score);

  const categoryData = [
    {
      key: 'documentation',
      label: strings.documentation,
      maxScore: 40,
      score: breakdown.documentation,
      color: '#3B82F6',
      icon: '📄',
    },
    {
      key: 'activeProtections',
      label: strings.protections,
      maxScore: 35,
      score: breakdown.activeProtections,
      color: '#8B5CF6',
      icon: '🛡️',
    },
    {
      key: 'proactiveActions',
      label: strings.actions,
      maxScore: 25,
      score: breakdown.proactiveActions,
      color: '#10B981',
      icon: '⚡',
    },
  ];

  const percentile = Math.min(95, Math.floor(score * 0.9 + 10));

  const getAchievements = () => {
    const achievements = [];

    if (score >= 85) {
      achievements.push('expert');
    }
    if (score >= 70) {
      achievements.push('selfProtector');
    }
    if (breakdown.documentation >= 30) {
      achievements.push('documenter');
    }
    // Removed 'actionTaker' as it's not in the new badge config.

    return achievements;
  };

  const achievements = getAchievements();

  const handleDismissRecommendation = async (rec) => {
    setDismissing(true);
    try {
      const updatedDismissed = [...dismissedRecs, rec.action];
      await base44.auth.updateMe({
        dismissed_recommendations: updatedDismissed
      });

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Move to next slide if available, otherwise go back
      if (currentSlide >= activeRecommendations.length - 1 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    } finally {
      setDismissing(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < activeRecommendations.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextSlide = () => {
    if (currentSlide < activeRecommendations.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <Card
      className="border-none shadow-xl overflow-hidden h-full"
      style={{ backgroundColor: colors.cardBg }}
    >
      <CardHeader
        className="pb-3"
        style={{
          background: `linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}40 100%)`,
          borderBottom: `1px solid ${colors.borderColor}`,
          padding: "12px",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: scoreColor }} />
            <span
              className="text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              {strings.protectionScore}
            </span>
          </div>
          <Badge
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {grade}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-32 h-32 mb-3">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={colors.borderColor}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${score * 3.52} 352`}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dasharray 1s ease-out",
                  filter: `drop-shadow(0 0 6px ${scoreColor}40)`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-3xl font-bold"
                style={{
                  color: scoreColor,
                  textShadow: `0 2px 8px ${scoreColor}30`,
                }}
              >
                {score}%
              </div>
              <div
                className="text-xs font-semibold mt-1"
                style={{ color: colors.textSecondary }}
              >
                {label}
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full animate-pulse"
            style={{
              backgroundColor: `${scoreColor}10`,
              border: `1px solid ${scoreColor}30`,
            }}
          >
            <TrendingUp className="w-3 h-3" style={{ color: scoreColor }} />
            <span
              className="text-xs font-semibold"
              style={{ color: scoreColor }}
            >
              {strings.top} {percentile}%
            </span>
          </div>

          {/* Percentile Badge */}
          {percentile >= 75 && (
            <div style={{
              marginTop: 12,
              padding: '6px 14px',
              borderRadius: 9999,
              backgroundColor: isDarkMode ? 'rgba(16,185,129,0.25)' : '#D1FAE5',
              border: isDarkMode ? '2px solid rgba(16,185,129,0.5)' : '2px solid #6EE7B7',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 'bold',
                color: isDarkMode ? '#6EE7B7' : '#047857',
                letterSpacing: '0.02em'
              }}>
                {strings.topPercentile.replace('{percentile}', percentile)}
              </p>
            </div>
          )}

          {/* Achievement Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'center',
            marginTop: 12
          }}>
            {achievements.map((badgeKey, idx) => {
              const badgeConfig = achievementBadges[badgeKey];
              if (!badgeConfig) return null; // Should not happen if getAchievements is in sync

              return (
                <div
                  key={idx}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: badgeConfig.color,
                    backgroundColor: badgeConfig.bgColor,
                    border: `2px solid ${badgeConfig.borderColor}`,
                    letterSpacing: '0.01em'
                  }}
                >
                  {badgeConfig[language] || badgeConfig.en}
                </div>
              );
            })}
          </div>
        </div>

        {/* Small stat boxes with improved readability */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF',
            border: `1px solid ${isDarkMode ? '#3B82F6' : '#BFDBFE'}`
          }}>
            <p className="text-xs font-bold mb-1" style={{
              color: isDarkMode ? '#93C5FD' : '#1E40AF',
              opacity: 1
            }}>
              {strings.documentation}
            </p>
            <p className="text-lg font-extrabold" style={{
              color: isDarkMode ? '#DBEAFE' : '#1E3A8A'
            }}>
              {breakdown.documentation}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#1E3A2D' : '#F0FDF4',
            border: `1px solid ${isDarkMode ? '#10B981' : '#A7F3D0'}`
          }}>
            <p className="text-xs font-bold mb-1" style={{
              color: isDarkMode ? '#6EE7B7' : '#065F46',
              opacity: 1
            }}>
              {strings.protections}
            </p>
            <p className="text-lg font-extrabold" style={{
              color: isDarkMode ? '#D1FAE5' : '#064E3B'
            }}>
              {breakdown.activeProtections}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#3A2D1C' : '#FFFBEB',
            border: `1px solid ${isDarkMode ? '#F59E0B' : '#FDE68A'}`
          }}>
            <p className="text-xs font-bold mb-1" style={{
              color: isDarkMode ? '#FCD34D' : '#92400E',
              opacity: 1
            }}>
              {strings.actions}
            </p>
            <p className="text-lg font-extrabold" style={{
              color: isDarkMode ? '#FEF3C7' : '#78350F'
            }}>
              {breakdown.proactiveActions}
            </p>
          </div>
        </div>


        {activeRecommendations && activeRecommendations.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-bold"
                style={{ color: colors.textPrimary }}
              >
                {strings.quickWins}
              </span>

              {activeRecommendations.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor:
                        currentSlide === 0
                          ? colors.borderColor
                          : colors.textPrimary,
                      color:
                        currentSlide === 0
                          ? colors.textSecondary
                          : colors.cardBg,
                      cursor:
                        currentSlide === 0 ? "not-allowed" : "pointer",
                      opacity: currentSlide === 0 ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span
                    className="text-[10px]"
                    style={{ color: colors.textSecondary }}
                  >
                    {currentSlide + 1}/{activeRecommendations.length}
                  </span>
                  <button
                    onClick={nextSlide}
                    disabled={
                      currentSlide === activeRecommendations.length - 1
                    }
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor:
                        currentSlide === activeRecommendations.length - 1
                          ? colors.borderColor
                          : colors.textPrimary,
                      color:
                        currentSlide === activeRecommendations.length - 1
                          ? colors.textSecondary
                          : colors.cardBg,
                      cursor:
                        currentSlide === activeRecommendations.length - 1
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        currentSlide === activeRecommendations.length - 1
                          ? 0.5
                          : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {activeRecommendations.map((rec, idx) => {
                  const extraCount = rec.extraCount || 0;

                  return (
                    <div key={idx} className="min-w-full px-1">
                      <div className="relative">
                        <Link to={createPageUrl(rec.route)}>
                          <div
                            className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: `${scoreColor}10`,
                              border: `1px solid ${scoreColor}30`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="text-xs font-bold pr-6"
                                style={{ color: colors.textPrimary }}
                              >
                                {rec.action}
                              </span>
                              <Badge
                                style={{
                                  backgroundColor: scoreColor,
                                  color: "#FFFFFF",
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                }}
                              >
                                +{rec.points}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-end">
                              <ChevronRight
                                className="w-4 h-4"
                                style={{ color: scoreColor }}
                              />
                            </div>
                          </div>
                        </Link>

                        {extraCount > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              minWidth: "24px",
                              height: "24px",
                              borderRadius: "12px",
                              backgroundColor: "#10B981",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "bold",
                              padding: "0 6px",
                              boxShadow:
                                "0 2px 4px rgba(0,0,0,0.2)",
                              zIndex: 10,
                            }}
                          >
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeRecommendations.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {activeRecommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor:
                        idx === currentSlide
                          ? scoreColor
                          : colors.borderColor,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {dismissedRecs.length > 0 && (
              <button
                onClick={async () => {
                  await base44.auth.updateMe({
                    dismissed_recommendations: [],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["currentUser"],
                  });
                  setCurrentSlide(0);
                }}
                style={{
                  marginTop: "8px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.borderColor}`,
                  backgroundColor: "transparent",
                  color: colors.textSecondary,
                  fontSize: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.borderColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                {strings.resetHiddenTips}
              </button>
            )}
          </div>
        )}

        {activeRecommendations.length === 0 &&
          recommendations.length > 0 && (
            <div
              className="mt-4 p-3 rounded-lg text-center"
              style={{
                backgroundColor: `${scoreColor}10`,
                border: `1px solid ${scoreColor}30`,
              }}
            >
              <Trophy
                className="w-6 h-6 mx-auto mb-2"
                style={{ color: scoreColor }}
              />
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                {strings.allTipsHidden}
              </p>
              <button
                onClick={async () => {
                  await base44.auth.updateMe({
                    dismissed_recommendations: [],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["currentUser"],
                  });
                  setCurrentSlide(0);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: scoreColor,
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {strings.showTipsAgain}
              </button>
            </div>
          )}
      </CardContent>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Card>
  );
};

export default ProtectionScoreEnhanced;