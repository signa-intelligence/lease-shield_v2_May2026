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
  scoreColor,
  compactTitle = false,
  language = 'en',
  primaryAction = false
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
    titleColor: textPrimary,
    metricColor: textPrimary,
    buttonBg: extractedColor,
    buttonText: '#FFFFFF',
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    haptic?.light();
    const iconElement = document.querySelector(`#stat-icon-${title.replace(/\s/g, '-')}`);
    if (iconElement) {
      iconElement.classList.add('icon-shimmer');
      setTimeout(() => {
        iconElement.classList.remove('icon-shimmer');
      }, 200);
    }

    // CRITICAL: Use onClick if provided (takes precedence over route)
    if (onClick) {
      onClick();
    } else if (route) {
      // Safe navigation - use window.location for hash-based routes
      window.location.href = route;
    }
  };

  const content = (
    <div
      onClick={handleCardClick}
      className={`rounded-xl p-4 flex flex-col justify-between shadow-md transition-all duration-200 ${className || ''}`}
      style={{
        backgroundColor: cardStyles.backgroundColor,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(12,59,46,0.08)'}`,
        cursor: 'pointer'
      }}
    >
        <div className="flex flex-col mb-3">
          <div className="flex items-center justify-between mb-3">
            <div 
              id={`stat-icon-${title.replace(/\s/g, '-')}`}
              className="w-10 h-10 rounded-xl flex items-center justify-center" 
              style={{ backgroundColor: cardStyles.iconBg }}
            >
              <Icon className="w-5 h-5" style={{ color: cardStyles.iconColor }} />
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
          <div>
            <h3 
              className="text-xs font-semibold mb-1" 
              style={{ 
                color: cardStyles.titleColor,
                opacity: 0.7,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: compactTitle ? '10px' : '0.75rem',
                lineHeight: compactTitle ? '1.2' : '1rem',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}
            >
              {title}
            </h3>
            <p className="text-2xl font-bold" style={{ color: cardStyles.metricColor }}>
              {value}
            </p>
          </div>
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
            onClick={handleCardClick}
            className="btn-interaction"
            style={{
              backgroundColor: primaryAction ? '#0F4229' : cardStyles.buttonBg,
              color: cardStyles.buttonText,
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: language === 'ru' ? '11px' : '13px',
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              whiteSpace: language === 'ru' ? 'normal' : 'nowrap',
              textAlign: "center",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: "40px",
              lineHeight: language === 'ru' ? '1.2' : '1.5'
            }}
          >
            {label}
          </button>
        )}
      </div>
  );

  return content;
}