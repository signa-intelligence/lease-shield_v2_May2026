
import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProtectionScoreGauge from "./ProtectionScoreGauge";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  bgGradient, 
  scoreColor, 
  scoreStatus, 
  ctaText, 
  onCtaClick, 
  showGauge = false, 
  scoreValue,
  miniStats,
  actionButton
}) {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isDarkMode = user?.theme === 'dark';

  const colors = isDarkMode ? {
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    miniStatBg: '#353A3D'
  } : {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    miniStatBg: '#F8FAFC'
  };

  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full" style={{ backgroundColor: colors.cardBg }}>
      {/* Background circle - smaller */}
      {!showGauge && (
        <div 
          className="absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 rounded-full opacity-10"
          style={{
            backgroundColor: scoreColor || undefined
          }}
        />
      )}
      <div className={`${showGauge ? 'p-3' : 'p-4'} relative z-10 flex flex-col h-full`}>
        {/* Top section - Icon and trend - more compact */}
        <div className="flex justify-between items-start mb-2">
          <div 
            className={`p-2 rounded-lg ${bgGradient || ''}`}
            style={
              scoreColor ? { backgroundColor: scoreColor } : {}
            }
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>

        {/* Title - more compact */}
        <p className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>{title}</p>
        
        {/* Main value area - flex-grow to push action button to bottom */}
        <div className="flex-grow flex flex-col">
          {showGauge ? (
            <div className="flex items-center justify-center py-1">
              <ProtectionScoreGauge score={scoreValue || 0} size={180} />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>{value}</p>
              {scoreStatus && (
                <Badge 
                  style={{
                    backgroundColor: `${scoreColor}15`,
                    color: scoreColor,
                    border: `1px solid ${scoreColor}30`
                  }}
                  className="font-semibold mb-2 text-xs"
                >
                  {scoreStatus}
                </Badge>
              )}
              
              {/* Mini Stats - more compact */}
              {miniStats && miniStats.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {miniStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg" style={{ backgroundColor: colors.miniStatBg }}>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{stat.label}</span>
                      <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Action buttons - always at bottom - more compact */}
        <div className="mt-auto pt-2">
          {/* CTA Button */}
          {ctaText && onCtaClick && (
            <button
              onClick={onCtaClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:gap-3"
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor,
                border: `2px solid ${scoreColor}40`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = scoreColor;
                e.target.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `${scoreColor}20`;
                e.target.style.color = scoreColor;
              }}
            >
              {ctaText}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          
          {/* Action Button */}
          {actionButton && (
            <Link to={actionButton.link}>
              <button
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200"
                style={{
                  backgroundColor: isDarkMode ? '#353A3D' : '#ECEFED',
                  color: '#0C3B2E',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.color = '#FFFFFF';
                  e.target.style.borderColor = '#0C3B2E';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isDarkMode ? '#353A3D' : '#ECEFED';
                  e.target.style.color = '#0C3B2E';
                  e.target.style.borderColor = 'transparent';
                }}
              >
                {actionButton.label}
                <ChevronRight className="w-3 h-3" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
