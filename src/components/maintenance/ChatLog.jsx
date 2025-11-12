import React from "react";
import { format } from "date-fns";
import { User, Home, Building2, Settings } from "lucide-react";

export default function ChatLog({ communicationLog = [], language = 'en', colors }) {
  if (!communicationLog || communicationLog.length === 0) {
    return null;
  }

  const strings = {
    en: {
      communicationLog: "Communication History",
      tenant: "Tenant",
      landlord: "Landlord",
      juristic: "Juristic Office",
      system: "System"
    },
    th: {
      communicationLog: "ประวัติการสื่อสาร",
      tenant: "ผู้เช่า",
      landlord: "เจ้าของบ้าน",
      juristic: "นิติบุคคล",
      system: "ระบบ"
    }
  };

  const str = strings[language];

  const getSenderIcon = (sender) => {
    switch (sender) {
      case 'tenant': return <User className="w-4 h-4" />;
      case 'landlord': return <Home className="w-4 h-4" />;
      case 'juristic': return <Building2 className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getSenderColor = (sender) => {
    switch (sender) {
      case 'tenant': return '#3B82F6';
      case 'landlord': return '#F59E0B';
      case 'juristic': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getSenderBgColor = (sender, isDarkMode) => {
    switch (sender) {
      case 'tenant': return isDarkMode ? '#1E3A5F' : '#EFF6FF';
      case 'landlord': return isDarkMode ? '#3A2D1C' : '#FFF7ED';
      case 'juristic': return isDarkMode ? '#2D1C3A' : '#FAF5FF';
      default: return isDarkMode ? '#2A2D30' : '#F3F4F6';
    }
  };

  const isDarkMode = colors.bg === '#1A1D1F';

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: colors.textPrimary }}>
        💬 {str.communicationLog}
      </h4>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {communicationLog.map((log, idx) => {
          const senderColor = getSenderColor(log.sender);
          const bgColor = getSenderBgColor(log.sender, isDarkMode);
          const Icon = getSenderIcon(log.sender);

          return (
            <div
              key={idx}
              className="p-3 rounded-lg transition-all hover:shadow-md"
              style={{
                backgroundColor: bgColor,
                borderLeft: `4px solid ${senderColor}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: senderColor }}
                  >
                    {React.cloneElement(Icon, { className: "w-4 h-4 text-white" })}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                      {log.sender_name || str[log.sender] || log.sender}
                    </p>
                    {log.sender_email && (
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {log.sender_email}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs whitespace-nowrap" style={{ color: colors.textSecondary }}>
                  {format(new Date(log.timestamp), language === 'th' ? 'd MMM HH:mm' : 'MMM d, HH:mm')}
                </span>
              </div>
              
              <p className="text-sm ml-10" style={{ color: colors.textPrimary }}>
                {log.message}
              </p>

              {log.action_type && (
                <div className="mt-2 ml-10">
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: isDarkMode ? '#353A3D' : '#F3F4F6',
                      color: senderColor,
                      fontWeight: '600'
                    }}
                  >
                    {log.action_type.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}