import React from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend, trendUp, bgGradient, scoreColor }) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgGradient || scoreColor} rounded-full opacity-10`} />
      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${bgGradient || scoreColor} bg-opacity-10`} style={
            scoreColor ? { backgroundColor: scoreColor } : {}
          }>
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
          <p className="text-3xl font-bold text-ls-charcoal">{value}</p>
        </div>
      </div>
    </Card>
  );
}