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
  className,
  haptic,
  colors,
  gradient,
  scoreColor
}) {
  const cardColors = colors || {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const isDarkMode = cardColors.cardBg === '#2A2D30';

  // Extract color from gradient if provided (e.g., "from-blue-500 to-blue-700" -> "#3B82F6")
  const extractedColor = scoreColor || '#0C3B2E';
  
  // Generate lighter background for icon based on the main color
  const iconBgLight = `${extractedColor}15`;
  const iconBgDark = `${extractedColor}30`;

  const cardStyles = {
    backgroundColor: cardColors.cardBg,
    borderColor: extractedColor,
    iconBg: isDarkMode ? iconBgDark : iconBgLight,
    iconColor: extractedColor,
    titleColor: extractedColor,
    metricColor: cardColors.textPrimary,
    buttonBg: extractedColor,
    buttonText: '#FFFFFF',
  };

  return (
    <Link to={route}>
      <div
        onClick={() => {
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
              <h3 className="text-sm font-semibold" style={{ color: cardStyles.titleColor }}>
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
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        )}
      </div>
    </Link>
  );
}