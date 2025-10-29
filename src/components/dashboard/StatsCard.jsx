import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, bgGradient, scoreColor, scoreStatus }) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300" style={{
      background: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgba(199, 163, 56, 0.2)'
    }}>
      {/* Background decorative element */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full opacity-10"
        style={{
          backgroundColor: scoreColor || '#C7A338'
        }}
      />
      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-3">
          {/* Icon box */}
          <div 
            className={`p-3 rounded-xl ${bgGradient || ''}`}
            style={
              scoreColor ? { 
                backgroundColor: scoreColor,
                boxShadow: `0 4px 12px ${scoreColor}40`
              } : {
                boxShadow: '0 4px 12px rgba(199, 163, 56, 0.3)'
              }
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
          <p className="text-sm font-medium mb-1" style={{ color: '#065f46' }}>{title}</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#0C3B2E' }}>{value}</p>
          {scoreStatus && (
            <Badge 
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor,
                border: `1px solid ${scoreColor}40`,
                fontWeight: '600'
              }}
            >
              {scoreStatus}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}