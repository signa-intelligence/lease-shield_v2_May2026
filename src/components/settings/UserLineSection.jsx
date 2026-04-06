import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CheckCircle2, Bell, XCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { haptic } from "../shared/HapticFeedback";

export default function UserLineSection({
  user, colors, isDarkMode, language, toast,
  onOpenLineModal, refetchUser, queryClient
}) {
  const [disconnecting, setDisconnecting] = React.useState(false);
  const isConnected = !!user?.line_user_id;

  const handleDisconnect = async () => {
    const confirmMsg = language === 'th' ? 'คุณต้องการยกเลิกการเชื่อมต่อ LINE หรือไม่?' : 'Disconnect LINE notifications?';
    if (!confirm(confirmMsg)) return;
    
    haptic.medium();
    setDisconnecting(true);
    try {
      await base44.auth.updateMe({
        line_user_id: null,
        line_messaging_token: null,
        line_notifications: false,
        line_connected_at: null
      });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await refetchUser();
      toast.success(language === 'th' ? 'ยกเลิกการเชื่อมต่อ LINE แล้ว' : 'LINE disconnected');
      haptic.success();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error(language === 'th' ? 'ไม่สามารถยกเลิกได้' : 'Failed to disconnect');
      haptic.error();
    } finally {
      setDisconnecting(false);
    }
  };

  const str = {
    en: {
      title: 'Your LINE Notifications',
      desc: 'Connect your LINE to receive important alerts directly in LINE chat.',
      connected: 'LINE Connected',
      youReceive: "You'll receive:",
      deposit: 'Deposit return reminders',
      rent: 'Rent due reminders',
      maintenance: 'Maintenance updates',
      lease: 'Lease scan results',
      disconnect: 'Disconnect LINE',
      notConnected: 'LINE Not Connected',
      connectDesc: 'Connect LINE to get deposit, rent, lease, and maintenance alerts.',
      connectBtn: 'Connect Your LINE'
    },
    th: {
      title: 'การแจ้งเตือน LINE ของคุณ',
      desc: 'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือนสำคัญโดยตรงในแชท LINE',
      connected: 'เชื่อมต่อ LINE แล้ว',
      youReceive: 'คุณจะได้รับ:',
      deposit: 'เตือนการคืนเงินมัดจำ',
      rent: 'เตือนกำหนดจ่ายค่าเช่า',
      maintenance: 'อัปเดตการซ่อมบำรุง',
      lease: 'ผลการสแกนสัญญาเช่า',
      disconnect: 'ยกเลิกการเชื่อมต่อ LINE',
      notConnected: 'ยังไม่ได้เชื่อมต่อ LINE',
      connectDesc: 'เชื่อมต่อ LINE เพื่อรับการแจ้งเตือนเงินมัดจำ ค่าเช่า สัญญาเช่า และการซ่อมบำรุง',
      connectBtn: 'เชื่อมต่อ LINE ของคุณ'
    }
  };
  const s = str[language] || str.en;

  return (
    <Card className="mb-6 border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <MessageCircle className="w-5 h-5" style={{ color: '#06C755' }} />
          {s.title}
        </CardTitle>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>{s.desc}</p>
      </CardHeader>
      <CardContent className="p-6">
        {isConnected ? (
          <div>
            <div className="p-4 rounded-xl mb-4" style={{
              backgroundColor: isDarkMode ? '#1E3A2A' : '#F0FDF4',
              border: '2px solid #10B981'
            }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold" style={{ color: isDarkMode ? '#6EE7B7' : '#065F46' }}>
                  {s.connected}
                </span>
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>{s.youReceive}</p>
              <ul className="space-y-1.5 text-sm" style={{ color: colors.textPrimary }}>
                <li className="flex items-center gap-2">
                  <span>💰</span> {s.deposit}
                </li>
                <li className="flex items-center gap-2">
                  <span>🏠</span> {s.rent}
                </li>
                <li className="flex items-center gap-2">
                  <span>🔧</span> {s.maintenance}
                </li>
                <li className="flex items-center gap-2">
                  <span>📋</span> {s.lease}
                </li>
              </ul>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                backgroundColor: isDarkMode ? '#3A2020' : '#FEF2F2',
                color: '#EF4444', border: '2px solid #EF4444',
                fontWeight: '600', fontSize: '13px', cursor: disconnecting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: disconnecting ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
              {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {s.disconnect}
            </button>
          </div>
        ) : (
          <div>
            <div className="p-4 rounded-xl mb-4" style={{
              backgroundColor: isDarkMode ? '#2A2520' : '#FFF7ED',
              border: '2px solid #F59E0B'
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <span className="font-bold" style={{ color: isDarkMode ? '#FCD34D' : '#92400E' }}>
                  {s.notConnected}
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {s.connectDesc}
              </p>
            </div>
            <button
              onClick={() => {
                haptic.light();
                onOpenLineModal({ type: 'user', depositId: null, propertyAddress: null });
              }}
              style={{
                padding: '12px 24px', borderRadius: '10px',
                backgroundColor: '#06C755', color: '#FFFFFF',
                border: 'none', fontWeight: 'bold', fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '8px', boxShadow: '0 4px 12px rgba(6,199,85,0.3)',
                transition: 'all 0.2s'
              }}
            >
              <MessageCircle className="w-4 h-4" />
              {s.connectBtn}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}