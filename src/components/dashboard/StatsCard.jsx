import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  bgGradient,
  scoreColor,
  miniStats = [],
  trend,
  actionButton,
  ctaText,
  onCtaClick,
  compact = false,
  colors
}) {
  const cardColors = colors || {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const isDarkMode = cardColors.bg === '#1A1D1F';

  // Convert Tailwind gradient classes to inline styles
  const getInlineGradient = () => {
    if (!bgGradient) return null;
    
    if (bgGradient.includes('from-ls-gold')) {
      return 'linear-gradient(135deg, #C7A338 0%, #D97706 100%)';
    }
    if (bgGradient.includes('from-ls-charcoal')) {
      return 'linear-gradient(135deg, #1A1D1F 0%, #475569 100%)';
    }
    if (bgGradient.includes('from-blue-600')) {
      return 'linear-gradient(135deg, #2563EB 0%, #9333EA 100%)';
    }
    
    return null;
  };

  const inlineGradient = getInlineGradient();
  const hasGradient = !!inlineGradient;
  const hasCustomBg = hasGradient || scoreColor;

  return (
    <Card 
      className="border-none shadow-lg hover:shadow-xl transition-all duration-300 h-full"
      style={{
        background: inlineGradient || undefined,
        backgroundColor: !inlineGradient 
          ? (scoreColor 
              ? (isDarkMode ? '#2A2D30' : `${scoreColor}10`) 
              : cardColors.cardBg)
          : undefined,
        borderLeft: scoreColor && !hasGradient ? `4px solid ${scoreColor}` : undefined,
      }}
    >
      <CardContent className="p-3 md:p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-3">
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: hasGradient
                ? 'rgba(255, 255, 255, 0.2)'
                : (scoreColor 
                    ? (isDarkMode ? `${scoreColor}30` : `${scoreColor}20`)
                    : (isDarkMode ? '#353A3D' : 'rgba(255, 255, 255, 0.2)'))
            }}
          >
            <Icon 
              className="w-5 h-5 md:w-6 md:h-6" 
              style={{ 
                color: hasGradient 
                  ? '#FFFFFF' 
                  : (scoreColor || cardColors.textPrimary)
              }} 
            />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div>
          <p 
            className="text-xs font-semibold mb-1 truncate" 
            style={{ 
              color: hasGradient 
                ? 'rgba(255, 255, 255, 0.9)' 
                : cardColors.textSecondary
            }}
          >
            {title}
          </p>
          <p 
            className="text-xl md:text-2xl font-bold truncate" 
            style={{ 
              color: hasGradient 
                ? '#FFFFFF' 
                : (scoreColor || cardColors.textPrimary)
            }}
          >
            {value}
          </p>
        </div>

        {miniStats && miniStats.length > 0 && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {miniStats.map((stat, idx) => (
              <div key={idx} className="text-xs">
                <span 
                  style={{ 
                    color: hasGradient 
                      ? 'rgba(255, 255, 255, 0.8)' 
                      : cardColors.textSecondary,
                    marginRight: '4px'
                  }}
                >
                  {stat.label}:
                </span>
                <span 
                  className="font-bold"
                  style={{ 
                    color: hasGradient 
                      ? '#FFFFFF' 
                      : (scoreColor || cardColors.textPrimary)
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {ctaText && onCtaClick && (
          <button
            onClick={onCtaClick}
            className="mt-3 w-full py-2 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-80"
            style={{
              backgroundColor: scoreColor || (isDarkMode ? '#0C3B2E' : '#FFFFFF'),
              color: scoreColor ? '#FFFFFF' : cardColors.textPrimary,
              border: scoreColor ? 'none' : `2px solid ${cardColors.borderColor}`
            }}
          >
            {ctaText}
          </button>
        )}

        {actionButton && (
          <Link to={actionButton.link} className="mt-3 block">
            <button
              className="w-full py-2 px-3 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: hasGradient 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : (isDarkMode ? '#353A3D' : 'rgba(12, 59, 46, 0.1)'),
                color: hasGradient 
                  ? '#FFFFFF' 
                  : (scoreColor || '#0C3B2E'),
                border: hasGradient 
                  ? '1px solid rgba(255, 255, 255, 0.5)' 
                  : `1px solid ${isDarkMode ? '#4B5563' : (scoreColor ? `${scoreColor}60` : '#0C3B2E')}`,
                backdropFilter: 'blur(10px)',
                fontWeight: '700'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = hasGradient 
                  ? 'rgba(255, 255, 255, 0.35)' 
                  : (isDarkMode ? '#4B5563' : 'rgba(12, 59, 46, 0.15)');
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = hasGradient 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : (isDarkMode ? '#353A3D' : 'rgba(12, 59, 46, 0.1)');
              }}
            >
              {actionButton.label}
            </button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}