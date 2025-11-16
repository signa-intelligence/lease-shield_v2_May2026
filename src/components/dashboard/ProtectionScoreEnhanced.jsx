import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectionScoreEnhanced({ 
  score = 0, 
  breakdown = { documentation: 0, active: 0, proactive: 0 },
  recommendations = [],
  onDismissRecommendation,
  onResetRecommendations,
  colors,
  strings,
  isDarkMode,
  showAchievement
}) {
  const [currentRec, setCurrentRec] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (currentRec >= recommendations.length && recommendations.length > 0) {
      setCurrentRec(recommendations.length - 1);
    }
  }, [recommendations.length, currentRec]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
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

    if (isLeftSwipe && currentRec < recommendations.length - 1) {
      setCurrentRec(currentRec + 1);
    }
    if (isRightSwipe && currentRec > 0) {
      setCurrentRec(currentRec - 1);
    }
  };

  const getScoreGrade = (s) => {
    if (s >= 90) return { label: 'A+', color: '#10B981' };
    if (s >= 80) return { label: 'A', color: '#059669' };
    if (s >= 70) return { label: 'B+', color: '#3B82F6' };
    if (s >= 60) return { label: 'B', color: '#2563EB' };
    if (s >= 50) return { label: 'C', color: '#F59E0B' };
    return { label: 'D', color: '#EF4444' };
  };

  const getPercentile = (s) => {
    if (s >= 90) return 95;
    if (s >= 80) return 85;
    if (s >= 70) return 75;
    if (s >= 60) return 60;
    if (s >= 50) return 45;
    return 30;
  };

  const getBadges = (s) => {
    const badges = [];
    if (s >= 90) badges.push(strings.expertProtector || 'Expert');
    if (breakdown.active >= 30) badges.push(strings.selfProtector || 'Self-Protector');
    if (breakdown.documentation >= 30) badges.push(strings.documenter || 'Documenter');
    if (breakdown.proactive >= 30) badges.push(strings.actionTaker || 'Action Taker');
    return badges;
  };

  const grade = getScoreGrade(score);
  const percentile = getPercentile(score);
  const badges = getBadges(score);
  const displayRecommendations = recommendations.filter(r => !r.dismissed);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-none shadow-xl relative overflow-hidden" style={{ backgroundColor: colors.cardBg }}>
      {showAchievement && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4"
            style={{
              animation: 'slideInUp 0.5s ease-out'
            }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">
              {strings.achievementUnlocked || '🎉 Achievement Unlocked!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {strings.protectionLevel100 || 'You\'ve reached 100% protection level!'}
            </p>
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2">
              {strings.expertProtector || 'Expert Protector'}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex flex-col items-center justify-center flex-shrink-0">
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  stroke={isDarkMode ? '#3A3D40' : '#E5E7EB'}
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="54"
                  stroke={grade.color}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease'
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: grade.color }}>
                  {score}%
                </span>
                <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                  {strings.protection || 'Protection'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 justify-center max-w-xs">
              {badges.map((badge, idx) => (
                <Badge
                  key={idx}
                  className="px-3 py-1 text-xs sm:text-sm font-semibold rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700"
                >
                  {badge}
                </Badge>
              ))}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                {strings.grade || 'Grade'}: <span className="font-bold" style={{ color: grade.color }}>{grade.label}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                {strings.topPercentile || 'Top'} {percentile}% {strings.ofUsers || 'of users'}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>
              {strings.protectionBreakdown || 'Protection Breakdown'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.documentation || 'Documentation'}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {breakdown.documentation}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#E5E7EB' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${breakdown.documentation}%`,
                      background: 'linear-gradient(to right, #3B82F6, #2563EB)'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.activeProtections || 'Active Protections'}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {breakdown.active}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#E5E7EB' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${breakdown.active}%`,
                      background: 'linear-gradient(to right, #10B981, #059669)'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {strings.proactiveActions || 'Proactive Actions'}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {breakdown.proactive}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: isDarkMode ? '#2A2D30' : '#E5E7EB' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${breakdown.proactive}%`,
                      background: 'linear-gradient(to right, #F59E0B, #D97706)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {displayRecommendations.length > 0 && (
          <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${colors.borderColor}` }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                {strings.quickWins || 'Quick Wins'}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetRecommendations}
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                {strings.reset || 'Reset'}
              </Button>
            </div>

            <div 
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isDarkMode ? '#2A2D30' : '#F0FDF4',
                  border: `1px solid ${isDarkMode ? '#3A3D40' : '#86EFAC'}`
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                      {displayRecommendations[currentRec]?.title}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {displayRecommendations[currentRec]?.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismissRecommendation(displayRecommendations[currentRec]?.id)}
                    className="flex-shrink-0"
                  >
                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                      {strings.dismiss || 'Dismiss'}
                    </span>
                  </Button>
                </div>
              </div>

              {displayRecommendations.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button
                    onClick={() => setCurrentRec(Math.max(0, currentRec - 1))}
                    disabled={currentRec === 0}
                    className="p-1 rounded-full transition-colors disabled:opacity-30"
                    style={{
                      backgroundColor: isDarkMode ? '#2A2D30' : '#F3F4F6',
                      color: colors.textPrimary
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex gap-1.5">
                    {displayRecommendations.map((_, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: idx === currentRec 
                            ? '#10B981' 
                            : (isDarkMode ? '#3A3D40' : '#D1D5DB')
                        }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentRec(Math.min(displayRecommendations.length - 1, currentRec + 1))}
                    disabled={currentRec === displayRecommendations.length - 1}
                    className="p-1 rounded-full transition-colors disabled:opacity-30"
                    style={{
                      backgroundColor: isDarkMode ? '#2A2D30' : '#F3F4F6',
                      color: colors.textPrimary
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}