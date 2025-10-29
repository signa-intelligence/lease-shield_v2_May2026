import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, bgGradient, scoreColor, scoreStatus }) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(199, 163, 56, 0.2)',
      boxShadow: '0 8px 24px rgba(12, 59, 46, 0.15)',
    }}>
      {/* Decorative corner accent */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle at top right, ${scoreColor || 'rgba(199, 163, 56, 0.15)'} 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />
      
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          {/* Icon box with gradient */}
          <div 
            className={`p-3 rounded-xl ${bgGradient || ''}`}
            style={
              scoreColor ? { 
                background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}dd)`,
                boxShadow: `0 4px 12px ${scoreColor}40`
              } : {
                boxShadow: '0 4px 12px rgba(12, 59, 46, 0.2)'
              }
            }
          >
            <Icon className="w-6 h-6 text-white" style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg`} style={{
              color: trendUp ? '#10B981' : '#EF4444',
              backgroundColor: trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${trendUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ 
            color: '#0C3B2E',
            opacity: 0.8,
            letterSpacing: '0.5px'
          }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #0C3B2E 0%, #1a5241 50%, #C7A338 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {value}
          </p>
          {scoreStatus && (
            <Badge 
              style={{
                backgroundColor: `${scoreColor}15`,
                color: scoreColor,
                border: `2px solid ${scoreColor}40`,
                fontWeight: '700',
                letterSpacing: '0.3px',
                padding: '4px 12px'
              }}
            >
              {scoreStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom shine effect */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: scoreColor 
          ? `linear-gradient(90deg, transparent, ${scoreColor}, transparent)`
          : 'linear-gradient(90deg, transparent, #C7A338, transparent)',
        opacity: 0.5
      }} />
    </Card>
  );
}