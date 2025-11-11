import React from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function TrendChart({ 
  title, 
  data, 
  dataKey, 
  color = "#0C3B2E",
  icon: Icon,
  type = "line",
  valuePrefix = "",
  valueSuffix = "",
  showTrend = true
}) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const colors = {
    cardBg: isDarkMode ? '#2A2D30' : '#FFFFFF',
    textPrimary: isDarkMode ? '#ECEFED' : '#1A1D1F',
    textSecondary: isDarkMode ? '#A8ABAD' : '#64748b',
    gridColor: isDarkMode ? '#3A3D40' : '#E5E7EB',
    tooltipBg: isDarkMode ? '#1A1D1F' : '#FFFFFF'
  };

  // Calculate trend
  const trend = data.length >= 2 
    ? ((data[data.length - 1][dataKey] - data[data.length - 2][dataKey]) / (data[data.length - 2][dataKey] || 1)) * 100
    : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: colors.tooltipBg,
          border: `1px solid ${colors.gridColor}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
            {label}
          </p>
          <p className="text-lg font-bold" style={{ color: color }}>
            {valuePrefix}{payload[0].value}{valueSuffix}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
            {Icon && <Icon className="w-5 h-5" style={{ color: color }} />}
            {title}
          </CardTitle>
          {showTrend && data.length >= 2 && (
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={200}>
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
                stroke={colors.gridColor}
              />
              <YAxis 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
                stroke={colors.gridColor}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
                stroke={colors.gridColor}
              />
              <YAxis 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
                stroke={colors.gridColor}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={3}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}