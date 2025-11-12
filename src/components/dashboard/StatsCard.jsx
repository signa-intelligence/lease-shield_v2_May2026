import React from "react";
import { Link } from "react-router-dom";
import { haptic } from "../shared/HapticFeedback";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  bgGradient,
  miniStats,
  actionButton,
  ctaText,
  onCtaClick,
  scoreColor,
  compact = false
}) {
  const cardStyle = compact
    ? "p-3 sm:p-4"
    : "p-4 sm:p-6";

  return (
    <div
      className={`rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 card-hover-lift ${cardStyle}`}
      style={{
        background: bgGradient || (scoreColor ? `linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}05 100%)` : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)'),
        border: scoreColor ? `2px solid ${scoreColor}30` : '2px solid transparent',
        minHeight: compact ? '120px' : '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onCtaClick ? 'pointer' : 'default',
        minWidth: '140px'
      }}
      onClick={onCtaClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-slate-600 dark:text-slate-300 mb-1`}>
            {title}
          </p>
          <p className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold`} style={{ color: scoreColor || '#1A1D1F' }}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: scoreColor || '#1A1D1F' }} />
          </div>
        )}
      </div>

      {miniStats && miniStats.length > 0 && (
        <div className="flex gap-2 sm:gap-3 flex-wrap mb-2">
          {miniStats.map((stat, index) => (
            <div key={index} className={`${compact ? 'text-xs' : 'text-sm'} text-slate-600 dark:text-slate-300`}>
              <span className="font-semibold">{stat.label}:</span> {stat.value}
            </div>
          ))}
        </div>
      )}

      {actionButton && (
        <Link to={actionButton.link}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.light();
            }}
            className={`${compact ? 'text-xs py-1.5 px-3' : 'text-sm py-2 px-4'} rounded-lg font-semibold transition-all hover:opacity-80 active:scale-95 w-full`}
            style={{
              backgroundColor: scoreColor || '#0C3B2E',
              color: '#FFFFFF',
              border: 'none',
              minHeight: '44px'
            }}
          >
            {actionButton.label}
          </button>
        </Link>
      )}

      {ctaText && onCtaClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.medium();
            onCtaClick();
          }}
          className={`${compact ? 'text-xs py-1.5 px-3' : 'text-sm py-2 px-4'} rounded-lg font-semibold transition-all hover:opacity-80 active:scale-95 w-full`}
          style={{
            backgroundColor: scoreColor || '#0C3B2E',
            color: '#FFFFFF',
            border: 'none',
            minHeight: '44px'
          }}
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}