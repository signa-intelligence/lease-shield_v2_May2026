
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  miniStats = [],
  trend, // Expected format: { value: string, color: string }
  label, // Text for the button at the bottom of the card
  route, // Link destination for the card
  className, // Additional class names for the card's root div
  haptic, // Haptic feedback object, e.g., { light: () => void }
  colors // Custom color palette
}) {
  const cardColors = colors || {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  const isDarkMode = cardColors.cardBg === '#2A2D30';

  // 🎨 UNIFIED COLOR MAPPING FOR DASHBOARD CARDS - RESTORED
  const CARD_STYLE_MAP = {
    'Leases Scanned': {
      border: '#3B82F6',
      iconBgLight: '#DBEAFE',
      iconBgDark: '#1E3A5F',
    },
    'Deposits Tracked': {
      border: '#10B981',
      iconBgLight: '#D1FAE5',
      iconBgDark: '#064E3B',
    },
    'Active Cases': {
      border: '#EF4444',
      iconBgLight: '#FEE2E2',
      iconBgDark: '#7F1D1D',
    },
    'Rent Tracked': {
      border: '#F59E0B',
      iconBgLight: '#FEF3C7',
      iconBgDark: '#78350F',
    },
    'Notifications': {
      border: '#8B5CF6',
      iconBgLight: '#EDE9FE',
      iconBgDark: '#4C1D95',
    },
    'Evidence Uploaded': {
      border: '#6366F1',
      iconBgLight: '#E0E7FF',
      iconBgDark: '#3730A3',
    },
    // Legacy mappings for backward compatibility
    'Active Leases': {
      border: '#3B82F6',
      iconBgLight: '#DBEAFE',
      iconBgDark: '#1E3A5F',
    },
    'Maintenance': {
      border: '#F59E0B',
      iconBgLight: '#FEF3C7',
      iconBgDark: '#78350F',
    },
    // Multilingual support
    'สัญญาเช่าที่สแกน': {
      border: '#3B82F6',
      iconBgLight: '#DBEAFE',
      iconBgDark: '#1E3A5F',
    },
    'เงินมัดจำที่ติดตาม': {
      border: '#10B981',
      iconBgLight: '#D1FAE5',
      iconBgDark: '#064E3B',
    },
    'คดีที่ดำเนินการ': {
      border: '#EF4444',
      iconBgLight: '#FEE2E2',
      iconBgDark: '#7F1D1D',
    },
    'ติดตามค่าเช่า': {
      border: '#F59E0B',
      iconBgLight: '#FEF3C7',
      iconBgDark: '#78350F',
    },
    'การแจ้งเตือน': {
      border: '#8B5CF6',
      iconBgLight: '#EDE9FE',
      iconBgDark: '#4C1D95',
    },
    'หลักฐานที่อัปโหลด': {
      border: '#6366F1',
      iconBgLight: '#E0E7FF',
      iconBgDark: '#3730A3',
    }
  };

  const specificCardTheme = CARD_STYLE_MAP[title];

  const cardStyles = {
    backgroundColor: cardColors.cardBg,
    borderColor: specificCardTheme?.border || cardColors.borderColor,
    iconBg: isDarkMode
      ? (specificCardTheme?.iconBgDark || `${specificCardTheme?.border || cardColors.textPrimary}20`)
      : (specificCardTheme?.iconBgLight || `${specificCardTheme?.border || cardColors.textPrimary}10`),
    iconColor: specificCardTheme?.border || cardColors.textPrimary,
    titleColor: specificCardTheme?.border || cardColors.textPrimary, // For h3 title and miniStats labels
    metricColor: cardColors.textPrimary, // For main value and miniStats values
    buttonBg: specificCardTheme?.border || cardColors.textPrimary,
    buttonText: '#FFFFFF',
  };

  // CSS for icon-shimmer animation (add this to your global CSS or component styles if not already present):
  /*
  @keyframes shimmer-animation {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
  .icon-shimmer {
    animation: shimmer-animation 0.2s ease-in-out;
  }
  */

  return (
    <Link to={route}>
      <div
        onClick={() => {
          haptic?.light(); // Safely call haptic feedback
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
              e.stopPropagation(); // Prevent double-firing but allow Link navigation
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
