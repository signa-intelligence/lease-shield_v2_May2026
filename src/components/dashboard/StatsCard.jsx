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

  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    miniStatBg: isDarkMode ? '#353A3D' : '#F8FAFC',
    borderAccent: isDarkMode ? '#0C3B2E' : '#0C3B2E'
  };

  // Use solid brand colors instead of gradients
  let cardStyle = {
    backgroundColor: colors.cardBg,
    borderLeft: scoreColor ? `4px solid ${scoreColor}` : '4px solid #0C3B2E'
  };

  // Special styling for gradient cards - use subtle brand colors
  if (bgGradient === 'bg-gradient-to-br from-ls-gold to-amber-600') {
    cardStyle = {
      backgroundColor: isDarkMode ? '#2D2920' : '#FFFBEB',
      borderLeft: '4px solid #C7A338'
    };
  } else if (bgGradient === 'bg-gradient-to-br from-ls-charcoal to-slate-700') {
    cardStyle = {
      backgroundColor: isDarkMode ? '#1A1D1F' : '#F8FAFC',
      borderLeft: '4px solid #1A1D1F'
    };
  }

  const isSpecialCard = !!bgGradient;
  const textColor = isSpecialCard ? (bgGradient.includes('gold') ? '#C7A338' : '#1A1D1F') : colors.textPrimary;
  const iconColor = isSpecialCard ? (bgGradient.includes('gold') ? '#C7A338' : '#1A1D1F') : (scoreColor || '#0C3B2E');

  return (
    <div
      style={{
        ...cardStyle,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon & Value */}
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
            color: textColor,
            letterSpacing: '-0.02em'
          }}>
            {value}
          </p>
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
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
              backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
              color: scoreColor 
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
              backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
              border: `1px solid ${colors.borderAccent}20`
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
            padding: '10px 20px',
            backgroundColor: scoreColor || '#0C3B2E',
            color: '#FFFFFF',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
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
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#0C3B2E',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: '2px solid #0C3B2E',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0C3B2E';
              e.target.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#0C3B2E';
            }}
          >
            {actionButton.label}
          </button>
        </Link>
      )}
    </div>
  );
}