import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, bgGradient, scoreColor, scoreStatus, ctaText, onCtaClick }) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      {/* Background circle - changes color for Protection Score */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full opacity-10"
        style={{
          backgroundColor: scoreColor || undefined
        }}
      />
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          {/* Icon box - matches score color for Protection Score */}
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
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
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
          
          {/* CTA Button for Protection Score */}
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
        </div>
      </div>
    </Card>
  );
}