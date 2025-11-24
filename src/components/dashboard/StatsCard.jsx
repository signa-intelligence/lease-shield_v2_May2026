import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  miniStats = [],
  trend,
  label,
  route,
  onClick,
  className,
  haptic,
  isDarkMode = false,
  gradient,
  scoreColor
}) {
  const cardBg = isDarkMode ? '#2A2D30' : '#FFFFFF';
  const textPrimary = isDarkMode ? '#F9FAFB' : '#1A1D1F';
  const textSecondary = isDarkMode ? '#D1D5DB' : '#64748b';

  // Extract color from gradient if provided (e.g., "from-blue-500 to-blue-700" -> "#3B82F6")
  const extractedColor = scoreColor || '#0C3B2E';
  
  // Generate lighter background for icon based on the main color
  const iconBgLight = `${extractedColor}15`;
  const iconBgDark = `${extractedColor}30`;

  const cardStyles = {
    backgroundColor: cardBg,
    borderColor: extractedColor,
    iconBg: isDarkMode ? iconBgDark : iconBgLight,
    iconColor: extractedColor,
    titleColor: extractedColor,
    metricColor: textPrimary,
    buttonBg: extractedColor,
    buttonText: '#FFFFFF',
  };

  const content = (
    <div
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
        haptic?.light();
        const iconElement = document.querySelector(`#stat-icon-${title.replace(/\s/g, '-')}`);
        if (iconElement) {
          iconElement.classList.add('icon-shimmer');
          setTimeout(() => {
            iconElement.classList.remove('icon-shimmer');
          }, 200);
        }
      }}
      className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all duration-200 ${className || ''}`}
      style={{
        backgroundColor: cardStyles.backgroundColor,
        borderLeft: `4px solid ${cardStyles.borderColor}`,
        cursor: 'pointer'
      }}
    >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div 
                id={`stat-icon-${title.replace(/\s/g, '-')}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center" 
                style={{ backgroundColor: cardStyles.iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: cardStyles.iconColor }} />
              </div>
              <h3 
                className="text-sm font-semibold" 
                style={{ 
                  color: cardStyles.titleColor,
                  whiteSpace: 'normal',
                  lineHeight: '1.3',
                  wordBreak: 'break-word'
                }}
              >
                {title}
              </h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: cardStyles.metricColor }}>
              {value}
            </p>
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: trend.color + '20' }}>
              {trend.value && String(trend.value).startsWith('-') ? (
                <TrendingDown className="w-3 h-3" style={{ color: trend.color }} />
              ) : (
                <TrendingUp className="w-3 h-3" style={{ color: trend.color }} />
              )}
              <span className="text-xs font-semibold" style={{ color: trend.color }}>
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {miniStats && miniStats.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mb-3">
            {miniStats.map((stat, idx) => (
              <div key={idx} className="text-xs">
                <p style={{ color: cardStyles.titleColor, opacity: 0.7 }}>{stat.label}</p>
                <p className="font-semibold" style={{ color: cardStyles.metricColor }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {label && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic?.light();
            }}
            className="btn-interaction"
            style={{
              backgroundColor: cardStyles.buttonBg,
              color: cardStyles.buttonText,
              width: "100%",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              whiteSpace: "normal",
              textAlign: "center",
              lineHeight: "1.3",
              minHeight: "36px"
            }}
          >
            {label}
          </button>
        )}
      </div>
  );

  // BUG FIX: Always wrap in Link if route exists, let onClick work inside
  return route ? <Link to={route} onClick={(e) => onClick && e.preventDefault()}>{content}</Link> : content;
}