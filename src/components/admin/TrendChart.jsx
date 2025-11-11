import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function TrendChart({ title, data, dataKey, chartType = "line", color = "#0C3B2E", colors, language }) {
  const strings = {
    en: { noData: "No data available" },
    th: { noData: "ไม่มีข้อมูล" }
  };

  const t = strings[language];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg border"
          style={{
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor
          }}
        >
          <p className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
            {label}
          </p>
          <p className="text-sm" style={{ color: color }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: colors.textPrimary }}>
          <TrendingUp className="w-5 h-5" style={{ color: color }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: colors.textSecondary, fontSize: 12 }}
                  stroke={colors.borderColor}
                />
                <YAxis
                  tick={{ fill: colors.textSecondary, fontSize: 12 }}
                  stroke={colors.borderColor}
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
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: colors.textSecondary, fontSize: 12 }}
                  stroke={colors.borderColor}
                />
                <YAxis
                  tick={{ fill: colors.textSecondary, fontSize: 12 }}
                  stroke={colors.borderColor}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: colors.textSecondary }}>{t.noData}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}