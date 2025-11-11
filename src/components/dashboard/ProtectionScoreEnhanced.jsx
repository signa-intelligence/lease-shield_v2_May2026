import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Award, Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { spacing, typography, borderRadius, shadows, transitions, brandColors } from '@/utils/designSystem';

const ProtectionScoreEnhanced = ({ 
  score, 
  breakdown, 
  recommendations, 
  language = 'en',
  colors
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const iconMap = {
    FileText: '📄',
    Shield: '🛡️',
    Bell: '🔔',
    Wrench: '🔧',
  };

  return (
    <Card className="border-none shadow-xl overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader
        style={{
          background: `linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}40 100%)`,
          borderBottom: `1px solid ${colors.borderColor}`,
        }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <Shield className="w-6 h-6" style={{ color: scoreColor }} />
            {language === 'th' ? 'คะแนนการป้องกัน' : 'Protection Score'}
          </CardTitle>
          <Badge
            style={{
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              padding: '4px 12px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {grade}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Score Circle */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-48 h-48 mb-4">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={colors.borderColor}
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke={scoreColor}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${score * 5.53} 553`}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                  filter: `drop-shadow(0 0 8px ${scoreColor}40)`,
                }}
              />
            </svg>

            {/* Score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-5xl font-bold"
                style={{
                  color: scoreColor,
                  textShadow: `0 2px 8px ${scoreColor}30`,
                }}
              >
                {score}%
              </div>
              <div className="text-sm font-semibold mt-1" style={{ color: colors.textSecondary }}>
                {label}
              </div>
            </div>
          </div>

          {/* Percentile badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: `${scoreColor}10`,
              border: `1px solid ${scoreColor}30`,
            }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: scoreColor }} />
            <span className="text-sm font-semibold" style={{ color: scoreColor }}>
              {language === 'th' ? `ท็อป ${percentile}% ของผู้ใช้` : `Top ${percentile}% of users`}
            </span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-4 mb-6">
          {categoryData.map((cat) => (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {cat.label}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: cat.color }}>
                  {cat.score}/{cat.maxScore}
                </span>
              </div>
              <div
                className="h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.borderColor }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(cat.score / cat.maxScore) * 100}%`,
                    background: `linear-gradient(90deg, ${cat.color} 0%, ${cat.color}cc 100%)`,
                    boxShadow: `0 0 8px ${cat.color}40`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations Carousel */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Target className="w-4 h-4 text-amber-600" />
                {language === 'th' ? 'วิธีเพิ่มคะแนน' : 'Quick Wins'}
              </h4>
              <div className="flex gap-1">
                {recommendations.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: currentSlide === idx ? brandColors.gold : colors.borderColor,
                      border: 'none',
                      cursor: 'pointer',
                      transition: transitions.fast,
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: borderRadius.lg,
              }}
            >
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentSlide * 100}%)`,
                }}
              >
                {recommendations.map((rec, idx) => (
                  <Link
                    key={idx}
                    to={createPageUrl(rec.route)}
                    className="min-w-full"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.borderColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = brandColors.gold;
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = colors.borderColor;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{iconMap[rec.icon] || '✨'}</span>
                          <span className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                            {rec.action}
                          </span>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: '#10B98120',
                            color: '#10B981',
                            border: '1px solid #10B98140',
                          }}
                        >
                          +{rec.points}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                          {language === 'th' ? 'แตะเพื่อเริ่มต้น' : 'Tap to start'}
                        </p>
                        <ChevronRight className="w-4 h-4" style={{ color: brandColors.gold }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Perfect score celebration */}
        {score === 100 && (
          <div
            className="mt-6 p-4 rounded-xl text-center"
            style={{
              background: 'linear-gradient(135deg, #10B98120 0%, #3B82F620 100%)',
              border: '2px solid #10B98140',
            }}
          >
            <Award className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
            <p className="font-bold text-lg mb-1" style={{ color: colors.textPrimary }}>
              {language === 'th' ? '🎉 สมบูรณ์แบบ!' : '🎉 Perfect Score!'}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {language === 'th' 
                ? 'คุณมีการป้องกันที่ดีที่สุด!' 
                : 'You have maximum protection!'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProtectionScoreEnhanced;