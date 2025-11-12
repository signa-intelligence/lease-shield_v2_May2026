import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProtectionScoreGauge from "./ProtectionScoreGauge";
import { useAnimatedNumber, createRipple } from "@/utils/animations";

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  scoreColor,
  bgGradient,
  scoreStatus,
  showGauge = false,
  scoreValue,
  ctaText,
  onCtaClick,
  miniStats,
  actionButton,
  compact = false
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';

  // Animate number values
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) : value;
  const animatedValue = useAnimatedNumber(numericValue || 0);

  // Brand colors
  const brandColors = {
    forest: '#0C3B2E',
    gold: '#C7A338',
    charcoal: '#1A1D1F',
    stone: '#ECEFED',
    white: '#FFFFFF'
  };

  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : brandColors.white,
    textPrimary: isDarkMode ? '#ECEFED' : brandColors.charcoal,
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    miniStatBg: isDarkMode ? '#353A3D' : brandColors.stone
  };

  // Determine accent color based on bgGradient or scoreColor
  let accentColor = scoreColor || brandColors.forest;
  if (bgGradient === 'bg-gradient-to-br from-ls-gold to-amber-600') {
    accentColor = brandColors.gold;
  } else if (bgGradient === 'bg-gradient-to-br from-ls-charcoal to-slate-700') {
    accentColor = brandColors.charcoal;
  }

  const handleCardClick = (e) => {
    if (!e.target.closest('button') && !e.target.closest('a')) {
      createRipple(e, e.currentTarget);
    }
  };

  // Format the display value (preserve currency symbol if present)
  const displayValue = typeof value === 'string' && value.includes('฿')
    ? `฿${animatedValue.toLocaleString()}`
    : animatedValue.toString();

  return (
    <div
      className="ripple-container card-hover-lift"
      onClick={handleCardClick}
      style={{
        backgroundColor: colors.cardBg,
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        borderRadius: compact ? '12px' : '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: compact ? '12px' : '24px',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      {/* Header: Title & Icon */}
      <div className="flex items-start justify-between" style={{ marginBottom: compact ? '8px' : '16px' }}>
        <div className="flex-1">
          <p className={compact ? "text-[10px]" : "text-xs"} style={{ 
            color: colors.textSecondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            marginBottom: compact ? '4px' : '8px'
          }}>
            {title}
          </p>
          <p 
            className={compact ? "text-xl" : "text-3xl"} 
            style={{ 
              color: accentColor,
              letterSpacing: '-0.02em',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {typeof value === 'string' && value.includes('฿') ? displayValue : value}
          </p>
        </div>
        <div 
          className="icon-bounce"
          style={{
            width: compact ? '32px' : '48px',
            height: compact ? '32px' : '48px',
            borderRadius: compact ? '8px' : '12px',
            backgroundColor: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Icon className={compact ? "w-4 h-4" : "w-6 h-6"} style={{ color: accentColor }} />
        </div>
      </div>

      <style jsx>{`
        .icon-bounce:hover {
          animation: iconBounce 0.5s ease-in-out;
        }

        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>

      {trend && (
        <Badge className={`${trend > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} text-xs font-semibold`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </Badge>
      )}

      {showGauge && (
        <div style={{ marginTop: compact ? '8px' : '16px' }}>
          <ProtectionScoreGauge score={scoreValue} />
          {scoreStatus && (
            <Badge className={compact ? "mt-2 text-[10px]" : "mt-3 text-xs"} style={{ 
              backgroundColor: colors.miniStatBg,
              color: accentColor,
              width: '100%',
              justifyContent: 'center',
              border: 'none',
              fontWeight: 'bold'
            }}>
              {scoreStatus}
            </Badge>
          )}
        </div>
      )}

      {miniStats && miniStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2" style={{ marginTop: compact ? '8px' : '16px' }}>
          {miniStats.map((stat, idx) => (
            <div 
              key={idx} 
              className={compact ? "p-2" : "p-3"}
              style={{ 
                backgroundColor: colors.miniStatBg,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                animation: `fadeIn 0.4s ease-out ${idx * 0.1}s backwards`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = isDarkMode ? '#3A3D40' : '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = colors.miniStatBg;
              }}
            >
              <p className={compact ? "text-[9px]" : "text-xs"} style={{ 
                color: colors.textSecondary,
                fontWeight: '600',
                marginBottom: compact ? '2px' : '4px'
              }}>
                {stat.label}
              </p>
              <p className={compact ? "text-sm" : "text-lg"} style={{ 
                color: colors.textPrimary,
                fontWeight: 'bold'
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {ctaText && onCtaClick && (
        <button
          onClick={(e) => {
            createRipple(e, e.currentTarget);
            onCtaClick();
          }}
          className="ripple-container btn-press-feedback"
          style={{
            width: '100%',
            marginTop: compact ? '8px' : '16px',
            padding: compact ? '8px 12px' : '12px 20px',
            backgroundColor: accentColor,
            color: brandColors.white,
            borderRadius: compact ? '8px' : '10px',
            fontWeight: '600',
            fontSize: compact ? '12px' : '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
            e.target.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            e.target.style.opacity = '1';
          }}
        >
          {ctaText}
        </button>
      )}

      {actionButton && (
        <Link to={actionButton.link} className="block" style={{ marginTop: compact ? '8px' : '16px' }}>
          <button
            className="ripple-container btn-press-feedback"
            style={{
              width: '100%',
              padding: compact ? '8px 12px' : '12px 20px',
              backgroundColor: 'transparent',
              color: accentColor,
              borderRadius: compact ? '8px' : '10px',
              fontWeight: '600',
              fontSize: compact ? '12px' : '14px',
              border: `2px solid ${accentColor}`,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={(e) => createRipple(e, e.currentTarget)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = accentColor;
              e.target.style.color = brandColors.white;
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = accentColor;
              e.target.style.transform = 'scale(1)';
            }}
          >
            {actionButton.label}
          </button>
        </Link>
      )}
    </div>
  );
}