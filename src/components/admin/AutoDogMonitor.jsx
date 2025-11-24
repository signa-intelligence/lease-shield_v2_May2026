import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, AlertTriangle, Shield } from "lucide-react";

/**
 * 🐕 AUTO-DOG MONITOR
 * Real-time role system health indicator
 */
export default function AutoDogMonitor({ 
  superAdminCount, 
  adminCount, 
  vaCount, 
  limits,
  isDarkMode,
  language = 'en'
}) {
  const colors = isDarkMode ? {
    bg: '#1A1D1F',
    cardBg: '#2A2D30',
    textPrimary: '#ECEFED',
    textSecondary: '#A8ABAD',
    borderColor: '#3A3D40',
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB',
  };

  const strings = {
    en: {
      title: "🐕 AutoDog System Health",
      healthy: "System Healthy",
      warning: "Warning",
      critical: "Critical",
      superAdminStatus: "Super Admin Coverage",
      adminStatus: "Admin Capacity",
      vaStatus: "VA Capacity",
      sufficient: "Sufficient",
      atLimit: "At Limit",
      belowMinimum: "Below Minimum!",
    },
    th: {
      title: "🐕 สุขภาพระบบ AutoDog",
      healthy: "ระบบปกติ",
      warning: "คำเตือน",
      critical: "วิกฤต",
      superAdminStatus: "Super Admin ครอบคลุม",
      adminStatus: "ความจุ Admin",
      vaStatus: "ความจุ VA",
      sufficient: "เพียงพอ",
      atLimit: "ถึงขีดจำกัด",
      belowMinimum: "ต่ำกว่าขั้นต่ำ!",
    }
  };

  const str = strings[language] || strings.en;

  // Determine overall health
  const isCritical = superAdminCount < limits.MINIMUM_SUPER_ADMINS;
  const hasWarnings = 
    superAdminCount >= limits.MAXIMUM_SUPER_ADMINS ||
    adminCount >= limits.MAXIMUM_ADMINS ||
    vaCount >= limits.MAXIMUM_VAS;
  const isHealthy = !isCritical && !hasWarnings;

  const getStatusIcon = () => {
    if (isCritical) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (hasWarnings) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
  };

  const getStatusBadge = () => {
    if (isCritical) {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {str.critical}
        </Badge>
      );
    }
    if (hasWarnings) {
      return (
        <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {str.warning}
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-800 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {str.healthy}
      </Badge>
    );
  };

  return (
    <Card className="border-none shadow-lg" style={{ 
      backgroundColor: colors.cardBg,
      borderLeft: `6px solid ${isCritical ? '#EF4444' : hasWarnings ? '#F59E0B' : '#10B981'}`
    }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
            {getStatusIcon()}
            {str.title}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Super Admin Status */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
            border: `2px solid ${
              superAdminCount < limits.MINIMUM_SUPER_ADMINS ? '#EF4444' :
              superAdminCount >= limits.MAXIMUM_SUPER_ADMINS ? '#F59E0B' :
              '#10B981'
            }`
          }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ 
                color: superAdminCount < limits.MINIMUM_SUPER_ADMINS ? '#EF4444' : '#8B5CF6' 
              }} />
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {str.superAdminStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ 
                color: superAdminCount < limits.MINIMUM_SUPER_ADMINS ? '#EF4444' : 
                       superAdminCount >= limits.MAXIMUM_SUPER_ADMINS ? '#F59E0B' : 
                       '#10B981' 
              }}>
                {superAdminCount}
              </span>
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                / {limits.MAXIMUM_SUPER_ADMINS} (min: {limits.MINIMUM_SUPER_ADMINS})
              </span>
              {superAdminCount < limits.MINIMUM_SUPER_ADMINS ? (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  {str.belowMinimum}
                </Badge>
              ) : superAdminCount >= limits.MAXIMUM_SUPER_ADMINS ? (
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                  {str.atLimit}
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                  {str.sufficient}
                </Badge>
              )}
            </div>
          </div>

          {/* Admin Status */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
            border: `2px solid ${adminCount >= limits.MAXIMUM_ADMINS ? '#F59E0B' : colors.borderColor}`
          }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {str.adminStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ 
                color: adminCount >= limits.MAXIMUM_ADMINS ? '#F59E0B' : '#3B82F6' 
              }}>
                {adminCount}
              </span>
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                / {limits.MAXIMUM_ADMINS}
              </span>
              {adminCount >= limits.MAXIMUM_ADMINS && (
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                  {str.atLimit}
                </Badge>
              )}
            </div>
          </div>

          {/* VA Status */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#353A3D' : '#F8FAFC',
            border: `2px solid ${vaCount >= limits.MAXIMUM_VAS ? '#F59E0B' : colors.borderColor}`
          }}>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {str.vaStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ 
                color: vaCount >= limits.MAXIMUM_VAS ? '#F59E0B' : '#F59E0B' 
              }}>
                {vaCount}
              </span>
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                / {limits.MAXIMUM_VAS}
              </span>
              {vaCount >= limits.MAXIMUM_VAS && (
                <Badge className="bg-amber-100 text-amber-800 text-xs">
                  {str.atLimit}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}