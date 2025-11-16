
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
  user
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
      showTipsAgain: 'Show tips again'
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
      showTipsAgain: 'แสดงคำแนะนำอีกครั้ง'
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
      showTipsAgain: '再次显示提示'
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
      selfProtector: '自己保護者',
      documenter: 'ドキュメンター',
      actionTaker: '実行者',
      quickWins: 'クイックウィン',
      resetHiddenTips: '非表示のヒントをリセット',
      allTipsHidden: 'すべてのヒントが非表示！',
      showTipsAgain: 'ヒントを再表示'
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
      documenter: '문서 관리자',
      actionTaker: '실행자',
      quickWins: '빠른 개선',
      resetHiddenTips: '숨겨진 팁 재설정',
      allTipsHidden: '모든 팁이 숨겨졌습니다!',
      showTipsAgain: '팁 다시 표시'
    }
  };

  const strings = t[language] || t.en;

  const getScoreGrade = (score) => {
    if (score >= 85) return { grade: 'A+', label: strings.excellent };
    if (score >= 70) return { grade: 'B+', label: strings.good };
    if (score >= 50) return { grade: 'C', label: strings.fair };
    return { grade: 'D', label: strings.needsWork };
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
      achievements.push({
        icon: Trophy,
        label: strings.expert,
        color: '#FFD700'
      });
    }
    if (score >= 70) {
      achievements.push({
        icon: Star,
        label: strings.selfProtector,
        color: '#C7A338'
      });
    }
    if (breakdown.documentation >= 30) {
      achievements.push({
        icon: CheckCircle2,
        label: strings.documenter,
        color: '#3B82F6'
      });
    }
    if (breakdown.proactiveActions >= 20) {
      achievements.push({
        icon: Zap,
        label: strings.actionTaker,
        color: '#10B981'
      });
    }
    
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
    <Card className="border-none shadow-xl overflow-hidden h-full" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader
        className="pb-3"
        style={{
          background: `linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}40 100%)`,
          borderBottom: `1px solid ${colors.borderColor}`,
          padding: '12px'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: scoreColor }} />
            <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
              {strings.protectionScore}
            </span>
          </div>
          <Badge
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
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
                  transition: 'stroke-dasharray 1s ease-out',
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
              <div className="text-xs font-semibold mt-1" style={{ color: colors.textSecondary }}>
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
            <span className="text-xs font-semibold" style={{ color: scoreColor }}>
              {strings.top} {percentile}%
            </span>
          </div>

          {achievements.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
              {achievements.map((achievement, idx) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${achievement.color}15`,
                      border: `1px solid ${achievement.color}30`,
                      animation: 'fadeIn 0.5s ease-out',
                      animationDelay: `${idx * 0.1}s`,
                      animationFillMode: 'backwards'
                    }}
                    title={achievement.label}
                  >
                    <Icon className="w-3 h-3" style={{ color: achievement.color }} />
                    <span className="text-[10px] font-bold" style={{ color: achievement.color }}>
                      {achievement.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {categoryData.map((cat, idx) => (
            <div 
              key={cat.key}
              style={{
                animation: 'slideInRight 0.5s ease-out',
                animationDelay: `${idx * 0.1}s`,
                animationFillMode: 'backwards'
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                    {cat.label}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: cat.color }}>
                  {cat.score}/{cat.maxScore}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.borderColor }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(cat.score / cat.maxScore) * 100}%`,
                    background: `linear-gradient(90deg, ${cat.color} 0%, ${cat.color}cc 100%)`,
                    boxShadow: `0 0 6px ${cat.color}40`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {activeRecommendations && activeRecommendations.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                {strings.quickWins}
              </span>
              {activeRecommendations.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: currentSlide === 0 ? colors.borderColor : colors.textPrimary,
                      color: currentSlide === 0 ? colors.textSecondary : colors.cardBg,
                      cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentSlide === 0 ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px]" style={{ color: colors.textSecondary }}>
                    {currentSlide + 1}/{activeRecommendations.length}
                  </span>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === activeRecommendations.length - 1}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: currentSlide === activeRecommendations.length - 1 ? colors.borderColor : colors.textPrimary,
                      color: currentSlide === activeRecommendations.length - 1 ? colors.textSecondary : colors.cardBg,
                      cursor: currentSlide === activeRecommendations.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: currentSlide === activeRecommendations.length - 1 ? 0.5 : 1,
                      transition: 'all 0.2s'
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
                  transform: `translateX(-${currentSlide * 100}%)`
                }}
              >
                {activeRecommendations.map((rec, idx) => {
                  const isLocked = rec.requiresPaid && user?.plan_tier === 'free';
                  const extraCount = rec.extraCount || 0;
                  
                  return (
                    <div 
                      key={idx}
                      className="min-w-full px-1"
                    >
                      <div className="relative">
                        {/* Dismiss button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDismissRecommendation(rec);
                          }}
                          disabled={dismissing}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: '#FFFFFF',
                            cursor: dismissing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: dismissing ? 0.5 : 1,
                            transition: 'all 0.2s',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => {
                            if (!dismissing) {
                              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                              e.target.style.transform = 'scale(1.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!dismissing) {
                              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>

                        <Link to={createPageUrl(rec.route)}>
                          <div
                            className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                            style={{
                              backgroundColor: `${scoreColor}10`,
                              border: `1px solid ${scoreColor}30`,
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold pr-6" style={{ color: colors.textPrimary }}>
                                {rec.action}
                              </span>
                              <Badge
                                style={{
                                  backgroundColor: scoreColor,
                                  color: '#FFFFFF',
                                  fontSize: '10px',
                                  padding: '2px 6px'
                                }}
                              >
                                +{rec.points}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-end">
                              <ChevronRight className="w-4 h-4" style={{ color: scoreColor }} />
                            </div>
                          </div>
                        </Link>
                        
                        {isLocked && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#EF4444',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 10
                            }}
                          >
                            X
                          </div>
                        )}
                        
                        {extraCount > 0 && !isLocked && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              minWidth: '24px',
                              height: '24px',
                              borderRadius: '12px',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '0 6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 10
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
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: idx === currentSlide ? scoreColor : colors.borderColor,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0
                    }}
                  />
                ))}
              </div>
            )}

            {dismissedRecs.length > 0 && (
              <button
                onClick={async () => {
                  await base44.auth.updateMe({ dismissed_recommendations: [] });
                  queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                  setCurrentSlide(0);
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.borderColor}`,
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.borderColor;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {strings.resetHiddenTips}
              </button>
            )}
          </div>
        )}

        {activeRecommendations.length === 0 && recommendations.length > 0 && (
          <div className="mt-4 p-3 rounded-lg text-center" style={{
            backgroundColor: `${scoreColor}10`,
            border: `1px solid ${scoreColor}30`,
          }}>
            <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: scoreColor }} />
            <p className="text-xs font-semibold mb-2" style={{ color: colors.textPrimary }}>
              {strings.allTipsHidden}
            </p>
            <button
              onClick={async () => {
                await base44.auth.updateMe({ dismissed_recommendations: [] });
                queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                setCurrentSlide(0);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: scoreColor,
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
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
