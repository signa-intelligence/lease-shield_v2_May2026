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

  const isDarkMode = cardColors.cardBg === '#2A2D30';

  // 🎨 UNIFIED COLOR MAPPING FOR DASHBOARD CARDS
  const CARD_STYLE_MAP = {
    'Active Leases': {
      borderLeft: '#3A8DFF',
      bgLight: '#E9F2FF',
      bgDark: '#1E2A38'
    },
    'Rent Tracked': {
      borderLeft: '#529CFF',
      bgLight: '#EAF3FF',
      bgDark: '#1F2E40'
    },
    'Notifications': {
      borderLeft: '#A388FF',
      bgLight: '#F2EDFF',
      bgDark: '#27223A'
    },
    'Maintenance': {
      borderLeft: '#E8A93B',
      bgLight: '#FBF5E6',
      bgDark: '#3A2F1B'
    },
    'Deposits Tracked': {
      borderLeft: '#8C8C8C',
      bgLight: '#F6F6F6',
      bgDark: '#2A2A2A'
    },
    'Active Cases': {
      borderLeft: '#8C8C8C',
      bgLight: '#F6F6F6',
      bgDark: '#2A2A2A'
    }
  };

  const cardStyle = CARD_STYLE_MAP[title];

  // Use dashboard-card class for mapped cards, otherwise keep original behavior
  const cardClassName = cardStyle 
    ? "dashboard-card hover:shadow-xl transition-all duration-300 h-full"
    : `border-none shadow-lg hover:shadow-xl transition-all duration-300 ${bgGradient || ''} h-full`;

  // Only apply custom background if NOT using dashboard-card class
  const cardBackground = cardStyle 
    ? undefined 
    : (bgGradient ? undefined : (scoreColor ? (isDarkMode ? cardColors.cardBg : `${scoreColor}10`) : cardColors.cardBg));

  const cardBorderLeft = cardStyle 
    ? undefined 
    : (bgGradient ? undefined : (scoreColor ? `4px solid ${scoreColor}` : undefined));

  return (
    <Card 
      className={cardClassName}
      style={{
        backgroundColor: cardBackground,
        borderLeft: cardBorderLeft
      }}
    >
      <CardContent className="p-3 md:p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-3">
          <div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: bgGradient
                ? 'rgba(255, 255, 255, 0.2)'
                : cardStyle
                  ? (isDarkMode ? `${cardStyle.borderLeft}30` : `${cardStyle.borderLeft}20`)
                  : scoreColor 
                    ? (isDarkMode ? `${scoreColor}30` : `${scoreColor}20`)
                    : 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <Icon 
              className="w-5 h-5 md:w-6 md:h-6" 
              style={{ 
                color: bgGradient 
                  ? '#FFFFFF' 
                  : cardStyle
                    ? cardStyle.borderLeft
                    : (scoreColor ? scoreColor : '#FFFFFF')
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
              color: bgGradient 
                ? 'rgba(255, 255, 255, 0.8)' 
                : cardStyle
                  ? (isDarkMode ? cardColors.textPrimary : cardStyle.borderLeft)
                  : (scoreColor ? cardColors.textSecondary : 'rgba(255, 255, 255, 0.8)')
            }}
          >
            {title}
          </p>
          <p 
            className="text-xl md:text-2xl font-bold truncate" 
            style={{ 
              color: bgGradient 
                ? '#FFFFFF' 
                : cardStyle
                  ? cardColors.textPrimary
                  : (scoreColor ? scoreColor : '#FFFFFF')
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
                    color: bgGradient 
                      ? 'rgba(255, 255, 255, 0.7)' 
                      : cardStyle
                        ? cardColors.textSecondary
                        : (scoreColor ? cardColors.textSecondary : 'rgba(255, 255, 255, 0.7)'),
                    marginRight: '4px'
                  }}
                >
                  {stat.label}:
                </span>
                <span 
                  className="font-bold"
                  style={{ 
                    color: bgGradient 
                      ? '#FFFFFF' 
                      : cardStyle
                        ? cardColors.textPrimary
                        : (scoreColor ? scoreColor : '#FFFFFF')
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
              backgroundColor: bgGradient 
                ? 'rgba(255, 255, 255, 0.2)'
                : cardStyle
                  ? (isDarkMode ? `${cardStyle.borderLeft}40` : cardStyle.borderLeft)
                  : (scoreColor || (isDarkMode ? cardColors.borderColor : '#FFFFFF')),
              color: bgGradient 
                ? '#FFFFFF' 
                : cardStyle
                  ? '#FFFFFF'
                  : (scoreColor ? '#FFFFFF' : cardColors.textPrimary),
              border: bgGradient 
                ? '1px solid rgba(255, 255, 255, 0.4)' 
                : cardStyle
                  ? 'none'
                  : (scoreColor ? 'none' : `2px solid ${cardColors.borderColor}`)
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
                backgroundColor: bgGradient
                  ? 'rgba(255, 255, 255, 0.3)'
                  : cardStyle
                    ? (isDarkMode ? `${cardStyle.borderLeft}40` : cardStyle.borderLeft)
                    : (scoreColor
                        ? (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)')
                        : 'rgba(255, 255, 255, 0.3)'),
                color: bgGradient 
                  ? '#FFFFFF' 
                  : cardStyle
                    ? '#FFFFFF'
                    : (scoreColor || '#FFFFFF'),
                border: bgGradient
                  ? '1px solid rgba(255, 255, 255, 0.4)'
                  : cardStyle
                    ? 'none'
                    : (scoreColor
                        ? `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : `${scoreColor}40`}`
                        : '1px solid rgba(255, 255, 255, 0.4)'),
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                if (bgGradient) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                } else if (cardStyle) {
                  e.target.style.backgroundColor = isDarkMode ? `${cardStyle.borderLeft}60` : `${cardStyle.borderLeft}CC`;
                } else if (scoreColor) {
                  e.target.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)';
                } else {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (bgGradient) {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                } else if (cardStyle) {
                  e.target.style.backgroundColor = isDarkMode ? `${cardStyle.borderLeft}40` : cardStyle.borderLeft;
                } else if (scoreColor) {
                  e.target.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)';
                } else {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }
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