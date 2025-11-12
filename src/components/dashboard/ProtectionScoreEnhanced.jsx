import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Award, Target, ChevronRight, CheckCircle2, ChevronLeft, Star, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ProtectionScoreEnhanced = ({ 
  score, 
  breakdown, 
  recommendations, 
  language = 'en',
  colors,
  compact = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const getScoreColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 70) return '#EAB308';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreGrade = (score) => {
    if (score >= 85) return { grade: 'A+', label: language === 'th' ? 'ยอดเยี่ยม' : 'Excellent' };
    if (score >= 70) return { grade: 'B+', label: language === 'th' ? 'ดี' : 'Good' };
    if (score >= 50) return { grade: 'C', label: language === 'th' ? 'พอใช้' : 'Fair' };
    return { grade: 'D', label: language === 'th' ? 'ต้องปรับปรุง' : 'Needs Work' };
  };

  const scoreColor = getScoreColor(score);
  const { grade, label } = getScoreGrade(score);

  const categoryData = [
    {
      key: 'documentation',
      label: language === 'th' ? 'เอกสาร' : 'Documentation',
      maxScore: 40,
      score: breakdown.documentation,
      color: '#3B82F6',
      icon: '📄',
    },
    {
      key: 'activeProtections',
      label: language === 'th' ? 'การป้องกัน' : 'Protections',
      maxScore: 35,
      score: breakdown.activeProtections,
      color: '#8B5CF6',
      icon: '🛡️',
    },
    {
      key: 'proactiveActions',
      label: language === 'th' ? 'การดำเนินการ' : 'Actions',
      maxScore: 25,
      score: breakdown.proactiveActions,
      color: '#10B981',
      icon: '⚡',
    },
  ];

  const percentile = Math.min(95, Math.floor(score * 0.9 + 10));

  // Achievement Badges Logic
  const getAchievements = () => {
    const achievements = [];
    
    if (score >= 85) {
      achievements.push({
        icon: Trophy,
        label: language === 'th' ? 'ผู้เชี่ยวชาญ' : 'Expert',
        color: '#FFD700'
      });
    }
    if (score >= 70) {
      achievements.push({
        icon: Star,
        label: language === 'th' ? 'ผู้ป้องกันตัวเอง' : 'Self-Protector',
        color: '#C7A338'
      });
    }
    if (breakdown.documentation >= 30) {
      achievements.push({
        icon: CheckCircle2,
        label: language === 'th' ? 'นักจัดเก็บเอกสาร' : 'Documenter',
        color: '#3B82F6'
      });
    }
    if (breakdown.proactiveActions >= 20) {
      achievements.push({
        icon: Zap,
        label: language === 'th' ? 'นักดำเนินการ' : 'Action Taker',
        color: '#10B981'
      });
    }
    
    return achievements;
  };

  const achievements = getAchievements();

  // Swipe Handlers
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
    
    if (isLeftSwipe && currentSlide < recommendations.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextSlide = () => {
    if (currentSlide < recommendations.length - 1) {
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
              {language === 'th' ? 'คะแนนการป้องกัน' : 'Protection Score'}
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
        {/* Compact Score Circle */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-32 h-32 mb-3">
            {/* Background circle */}
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

            {/* Score text */}
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

          {/* Percentile badge with animation */}
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full animate-pulse"
            style={{
              backgroundColor: `${scoreColor}10`,
              border: `1px solid ${scoreColor}30`,
            }}
          >
            <TrendingUp className="w-3 h-3" style={{ color: scoreColor }} />
            <span className="text-xs font-semibold" style={{ color: scoreColor }}>
              {language === 'th' ? `ท็อป ${percentile}%` : `Top ${percentile}%`}
            </span>
          </div>

          {/* Achievement Badges */}
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

        {/* Compact Breakdown bars with progress rings */}
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

        {/* Swipeable Recommendation Cards */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                {language === 'th' ? 'คำแนะนำ' : 'Quick Wins'}
              </span>
              {recommendations.length > 1 && (
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
                    {currentSlide + 1}/{recommendations.length}
                  </span>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === recommendations.length - 1}
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: currentSlide === recommendations.length - 1 ? colors.borderColor : colors.textPrimary,
                      color: currentSlide === recommendations.length - 1 ? colors.textSecondary : colors.cardBg,
                      cursor: currentSlide === recommendations.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: currentSlide === recommendations.length - 1 ? 0.5 : 1,
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
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="min-w-full px-1"
                  >
                    <Link to={createPageUrl(rec.route)}>
                      <div
                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: `${scoreColor}10`,
                          border: `1px solid ${scoreColor}30`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
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
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            {recommendations.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {recommendations.map((_, idx) => (
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