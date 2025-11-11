import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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

  // FIXED: Ensure completely opaque colors
  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#9CA3AF' : '#64748b',
    miniStatBg: isDarkMode ? '#353A3D' : '#F8FAFC'
  };

  return (
    <div
      className={bgGradient || ''}
      style={{
        backgroundColor: bgGradient ? 'transparent' : colors.cardBg,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: '1 !important', // FIXED: Force full opacity with !important
        padding: '24px',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Background Circle Effect */}
      {!bgGradient && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: scoreColor ? `radial-gradient(circle, ${scoreColor}20 0%, transparent 70%)` : 'radial-gradient(circle, rgba(12, 59, 46, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      )}

      {/* Icon & Value */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-semibold mb-2" style={{ 
            color: bgGradient ? '#FFFFFF' : colors.textSecondary,
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ 
            color: bgGradient ? '#FFFFFF' : (scoreColor || colors.textPrimary),
            letterSpacing: '-0.02em'
          }}>
            {value}
          </p>
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: bgGradient 
            ? 'rgba(255, 255, 255, 0.2)' 
            : scoreColor 
              ? `linear-gradient(135deg, ${scoreColor}20 0%, ${scoreColor}10 100%)`
              : 'linear-gradient(135deg, rgba(12, 59, 46, 0.1) 0%, rgba(12, 59, 46, 0.05) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <Icon className="w-7 h-7" style={{ 
            color: bgGradient ? '#FFFFFF' : (scoreColor || '#0C3B2E')
          }} />
        </div>
      </div>

      {/* Trend Badge */}
      {trend && (
        <Badge className={`${trend > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} text-xs font-semibold`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(trend)}%
        </Badge>
      )}

      {/* Protection Score Gauge */}
      {showGauge && (
        <div className="mt-4">
          <ProtectionScoreGauge score={scoreValue} />
          {scoreStatus && (
            <Badge className="mt-3 w-full justify-center bg-white/90 border-none text-xs font-bold" style={{ color: scoreColor }}>
              {scoreStatus}
            </Badge>
          )}
        </div>
      )}

      {/* Mini Stats */}
      {miniStats && miniStats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {miniStats.map((stat, idx) => (
            <div key={idx} className="p-3 rounded-xl" style={{ 
              backgroundColor: bgGradient ? 'rgba(255, 255, 255, 0.15)' : colors.miniStatBg,
              backdropFilter: bgGradient ? 'blur(10px)' : 'none'
            }}>
              <p className="text-xs font-semibold mb-1" style={{ 
                color: bgGradient ? '#FFFFFF' : colors.textSecondary
              }}>
                {stat.label}
              </p>
              <p className="text-lg font-bold" style={{ 
                color: bgGradient ? '#FFFFFF' : colors.textPrimary
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
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

      {/* Action Button */}
      {actionButton && (
        <Link to={actionButton.link} className="block mt-4">
          <button
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: bgGradient ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: bgGradient ? '#FFFFFF' : '#0C3B2E',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              border: bgGradient ? '1px solid rgba(255, 255, 255, 0.3)' : '2px solid #0C3B2E',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: bgGradient ? 'blur(10px)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (bgGradient) {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              } else {
                e.target.style.backgroundColor = '#0C3B2E';
                e.target.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (bgGradient) {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              } else {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#0C3B2E';
              }
            }}
          >
            {actionButton.label}
          </button>
        </Link>
      )}
    </div>
  );
}