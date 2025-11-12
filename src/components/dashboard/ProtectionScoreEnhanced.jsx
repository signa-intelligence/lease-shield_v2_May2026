import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Award, Target, ChevronRight, CheckCircle2 } from 'lucide-react';
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

  // FULL-SIZE VERSION (no compact prop or compact=false)
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

          {/* Percentile badge */}
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full"
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
        </div>

        {/* Compact Breakdown bars */}
        <div className="space-y-3">
          {categoryData.map((cat) => (
            <div key={cat.key}>
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
      </CardContent>
    </Card>
  );
};

export default ProtectionScoreEnhanced;