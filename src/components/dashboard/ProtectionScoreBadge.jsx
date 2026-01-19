import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Enhanced Protection Score Badge with:
 * - Circular progress ring
 * - Score trend indicator
 * - Gradient colors by tier
 * - Subtle pulse animation on score increase
 */
export default function ProtectionScoreBadge({
  score,
  previousScore,
  lastScoreUpdate,
  tierCap = 100,
  size = 'default', // 'default' | 'large'
  showTrend = true,
  showPulse = true,
  isDarkMode = false,
  onViewed
}) {
  const [shouldPulse, setShouldPulse] = useState(false);

  // Get tier-based colors with gradients
  const getScoreColors = (score) => {
    if (score >= 80) return {
      main: '#10B981',
      light: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      shadow: 'rgba(16,185,129,0.3)',
      border: 'rgba(16,185,129,0.2)',
      ringColor: '#10B981'
    };
    if (score >= 60) return {
      main: '#F59E0B',
      light: '#EA580C',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
      shadow: 'rgba(245,158,11,0.3)',
      border: 'rgba(245,158,11,0.2)',
      ringColor: '#F59E0B'
    };
    return {
      main: '#EF4444',
      light: '#DC2626',
      gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      shadow: 'rgba(239,68,68,0.3)',
      border: 'rgba(239,68,68,0.2)',
      ringColor: '#EF4444'
    };
  };

  const colors = getScoreColors(score);

  // Calculate trend
  const calculateTrend = () => {
    if (!showTrend || previousScore === undefined || previousScore === null) return null;
    
    // Only show trend if updated within last 7 days
    if (lastScoreUpdate) {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(lastScoreUpdate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 7) return null;
    }
    
    const diff = score - previousScore;
    if (diff === 0) return null;
    
    return {
      direction: diff > 0 ? 'up' : 'down',
      value: Math.abs(diff)
    };
  };

  const trend = calculateTrend();

  // Progress ring calculation (0-100 mapped to 0-360 degrees)
  const ringProgress = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 26; // radius 26 for 60px circle
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  // Pulse animation on score increase
  useEffect(() => {
    if (showPulse && trend?.direction === 'up') {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [score, trend, showPulse]);

  // Notify parent when viewed (for tracking)
  useEffect(() => {
    if (onViewed) onViewed();
  }, []);

  // Debug logging
  console.log('🎯 Protection Score Rendered:', {
    currentScore: score,
    previousScore: previousScore,
    trend: trend,
    showPulse: shouldPulse,
    progressRingPercent: ringProgress
  });

  const isLarge = size === 'large';
  const ringSize = isLarge ? 80 : 60;
  const iconSize = isLarge ? 32 : 24;
  const ringRadius = isLarge ? 34 : 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset = ringCircumference - (ringProgress / 100) * ringCircumference;

  return (
    <div 
      className={`relative inline-flex flex-col items-center ${shouldPulse ? 'score-pulse' : ''}`}
      style={{
        animation: shouldPulse ? 'scorePulse 2s ease-out' : 'none'
      }}
    >
      {/* Circular Progress Ring with Shield Icon */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        {/* Background ring */}
        <svg 
          className="absolute inset-0" 
          width={ringSize} 
          height={ringSize}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)'}
            strokeWidth="3"
          />
          {/* Progress ring */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringRadius}
            fill="none"
            stroke={colors.ringColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringStrokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out',
              filter: `drop-shadow(0 0 4px ${colors.shadow})`
            }}
          />
        </svg>

        {/* Shield icon with gradient background */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            margin: isLarge ? '8px' : '6px'
          }}
        >
          <div
            style={{
              width: isLarge ? 64 : 48,
              height: isLarge ? 64 : 48,
              borderRadius: '12px',
              background: colors.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 8px ${colors.shadow}`
            }}
          >
            <Shield 
              style={{ 
                width: iconSize, 
                height: iconSize, 
                color: 'white' 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div 
          className="flex items-center gap-0.5 mt-1"
          style={{
            fontSize: '10px',
            fontWeight: '600',
            color: trend.direction === 'up' ? '#10B981' : '#EF4444'
          }}
        >
          {trend.direction === 'up' ? (
            <TrendingUp style={{ width: 10, height: 10 }} />
          ) : (
            <TrendingDown style={{ width: 10, height: 10 }} />
          )}
          <span>{trend.direction === 'up' ? '+' : '-'}{trend.value}</span>
        </div>
      )}

      <style>{`
        @keyframes scorePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .score-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}