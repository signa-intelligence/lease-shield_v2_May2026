import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProtectionScoreGauge from "./ProtectionScoreGauge";

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
  actionButton
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';

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

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header: Title & Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-bold mb-2" style={{ 
            color: colors.textSecondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ 
            color: accentColor,
            letterSpacing: '-0.02em'
          }}>
            {value}
          </p>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${accentColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
      </div>

      {trend && (
        <Badge className={`${trend > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} text-xs font-semibold`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </Badge>
      )}

      {showGauge && (
        <div className="mt-4">
          <ProtectionScoreGauge score={scoreValue} />
          {scoreStatus && (
            <Badge className="mt-3 w-full justify-center border-none text-xs font-bold" style={{ 
              backgroundColor: colors.miniStatBg,
              color: accentColor 
            }}>
              {scoreStatus}
            </Badge>
          )}
        </div>
      )}

      {miniStats && miniStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {miniStats.map((stat, idx) => (
            <div key={idx} className="p-3 rounded-lg" style={{ 
              backgroundColor: colors.miniStatBg
            }}>
              <p className="text-xs font-semibold mb-1" style={{ 
                color: colors.textSecondary
              }}>
                {stat.label}
              </p>
              <p className="text-lg font-bold" style={{ 
                color: colors.textPrimary
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px 20px',
            backgroundColor: accentColor,
            color: brandColors.white,
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
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
        <Link to={actionButton.link} className="block mt-4">
          <button
            style={{
              width: '100%',
              padding: '12px 20px',
              backgroundColor: 'transparent',
              color: accentColor,
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: `2px solid ${accentColor}`,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = accentColor;
              e.target.style.color = brandColors.white;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = accentColor;
            }}
          >
            {actionButton.label}
          </button>
        </Link>
      )}
    </div>
  );
}