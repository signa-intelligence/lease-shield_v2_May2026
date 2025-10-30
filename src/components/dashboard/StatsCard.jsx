import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProtectionScoreGauge from "./ProtectionScoreGauge";
import { Link } from "react-router-dom";

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
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      {/* Background circle */}
      {!showGauge && (
        <div 
          className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full opacity-10"
          style={{
            backgroundColor: scoreColor || undefined
          }}
        />
      )}
      <div className={`${showGauge ? 'p-4' : 'p-6'} relative z-10`}>
        <div className="flex justify-between items-start mb-3">
          {/* Icon box */}
          <div 
            className={`p-3 rounded-xl ${bgGradient || ''}`}
            style={
              scoreColor ? { backgroundColor: scoreColor } : {}
            }
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
          
          {showGauge ? (
            <div className="mt-2 mb-2">
              <ProtectionScoreGauge score={scoreValue || 0} size={240} />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-ls-charcoal mb-2">{value}</p>
              {scoreStatus && (
                <Badge 
                  style={{
                    backgroundColor: `${scoreColor}15`,
                    color: scoreColor,
                    border: `1px solid ${scoreColor}30`
                  }}
                  className="font-semibold"
                >
                  {scoreStatus}
                </Badge>
              )}
              
              {/* Mini Stats - only for non-gauge cards */}
              {miniStats && miniStats.length > 0 && (
                <div className="mt-4 space-y-2">
                  {miniStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium text-slate-600">{stat.label}</span>
                      <span className="text-sm font-bold text-ls-charcoal">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* CTA Button */}
          {ctaText && onCtaClick && (
            <button
              onClick={onCtaClick}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:gap-3"
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
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          {/* Action Button - only for non-gauge cards */}
          {actionButton && (
            <Link to={actionButton.link}>
              <button
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
                style={{
                  backgroundColor: '#ECEFED',
                  color: '#0C3B2E',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0C3B2E';
                  e.target.style.color = '#FFFFFF';
                  e.target.style.borderColor = '#0C3B2E';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ECEFED';
                  e.target.style.color = '#0C3B2E';
                  e.target.style.borderColor = 'transparent';
                }}
              >
                {actionButton.label}
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}