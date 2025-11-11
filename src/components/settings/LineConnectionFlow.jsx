import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  CheckCircle2, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  Smartphone,
  QrCode,
  ArrowRight,
  Copy
} from 'lucide-react';

export default function LineConnectionFlow({ user, onUpdate, colors }) {
  const [connecting, setConnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const language = user?.language || 'en';
  const isConnected = !!user?.line_messaging_token;
  const isPending = user?.pending_line_connection === true;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (onUpdate) onUpdate();
    }
  });

  // Poll for connection status when pending
  useEffect(() => {
    if (!isPending) return;

    const pollInterval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }, 3000); // Check every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setConnecting(false);
      updateMutation.mutate({ pending_line_connection: null });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPending, queryClient]);

  const strings = {
    en: {
      title: 'LINE Notifications',
      subtitle: 'Get instant alerts via LINE Official Account',
      connected: 'Connected',
      notConnected: 'Not Connected',
      connect: 'Connect LINE',
      disconnect: 'Disconnect',
      connecting: 'Waiting for Connection...',
      howToConnect: 'How to Connect',
      step1: 'Click "Connect LINE" button below',
      step2: 'You\'ll be redirected to LINE app',
      step3: 'Add Lease Shield Official Account',
      step4: 'Connection confirmed automatically',
      benefits: 'Benefits',
      benefit1: 'Instant push notifications',
      benefit2: 'Rich interactive messages',
      benefit3: 'Quick action buttons',
      benefit4: 'Faster than email',
      openLine: 'Open LINE App',
      scanQR: 'Or scan QR code',
      showQR: 'Show QR Code',
      hideQR: 'Hide QR Code',
      waitingDesc: 'Please add Lease Shield on LINE app to complete connection',
      cancelConnection: 'Cancel',
      premiumFeature: 'Premium Feature',
      upgradeRequired: 'Available on Protect & Secure plans',
      upgradeNow: 'Upgrade Now',
      disconnectConfirm: 'Disconnect LINE notifications?',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!'
    },
    th: {
      title: 'การแจ้งเตือนทาง LINE',
      subtitle: 'รับการแจ้งเตือนทันทีผ่าน LINE Official Account',
      connected: 'เชื่อมต่อแล้ว',
      notConnected: 'ยังไม่ได้เชื่อมต่อ',
      connect: 'เชื่อมต่อ LINE',
      disconnect: 'ยกเลิกการเชื่อมต่อ',
      connecting: 'กำลังรอการเชื่อมต่อ...',
      howToConnect: 'วิธีการเชื่อมต่อ',
      step1: 'กดปุ่ม "เชื่อมต่อ LINE" ด้านล่าง',
      step2: 'คุณจะถูกนำไปยังแอป LINE',
      step3: 'เพิ่มเพื่อน Lease Shield Official Account',
      step4: 'ระบบจะยืนยันการเชื่อมต่ออัตโนมัติ',
      benefits: 'ประโยชน์',
      benefit1: 'การแจ้งเตือนแบบทันที',
      benefit2: 'ข้อความที่มีปฏิสัมพันธ์',
      benefit3: 'ปุ่มกดทำงานได้เลย',
      benefit4: 'เร็วกว่าอีเมล',
      openLine: 'เปิดแอป LINE',
      scanQR: 'หรือสแกน QR code',
      showQR: 'แสดง QR Code',
      hideQR: 'ซ่อน QR Code',
      waitingDesc: 'กรุณาเพิ่มเพื่อน Lease Shield บนแอป LINE เพื่อทำการเชื่อมต่อให้เสร็จสมบูรณ์',
      cancelConnection: 'ยกเลิก',
      premiumFeature: 'ฟีเจอร์พรีเมียม',
      upgradeRequired: 'ใช้ได้ในแผน Protect และ Secure',
      upgradeNow: 'อัปเกรดเลย',
      disconnectConfirm: 'ยกเลิกการเชื่อมต่อ LINE?',
      copyLink: 'คัดลอกลิงก์',
      linkCopied: 'คัดลอกลิงก์แล้ว!'
    }
  };

  const str = strings[language];
  const hasLineAccess = user?.plan_tier === 'protect' || user?.plan_tier === 'secure';

  const handleConnect = async () => {
    setConnecting(true);
    
    // Set pending flag
    await updateMutation.mutateAsync({ pending_line_connection: true });
    
    // Redirect to LINE add friend
    const lineUrl = 'https://line.me/R/ti/p/@leaseshield';
    window.open(lineUrl, '_blank');
  };

  const handleDisconnect = async () => {
    if (confirm(str.disconnectConfirm)) {
      await updateMutation.mutateAsync({
        line_messaging_token: null,
        line_user_id: null,
        line_notifications: false
      });
      setConnecting(false);
    }
  };

  const handleCancelConnection = async () => {
    await updateMutation.mutateAsync({ pending_line_connection: null });
    setConnecting(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://line.me/R/ti/p/@leaseshield');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1" style={{ color: colors.textPrimary }}>
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              {str.title}
            </CardTitle>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {str.subtitle}
            </p>
          </div>
          <Badge className={isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {str.connected}
              </>
            ) : (
              str.notConnected
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!hasLineAccess ? (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
              {str.premiumFeature}
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              {str.upgradeRequired}
            </p>
            <Button
              onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {str.upgradeNow}
            </Button>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{
              backgroundColor: colors.bg,
              border: `2px solid #10B981`
            }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-emerald-600">{str.connected}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>
                    {language === 'th' ? 'คุณจะได้รับการแจ้งเตือนทาง LINE' : 'You\'ll receive alerts via LINE'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full text-red-600 hover:text-red-700"
            >
              {str.disconnect}
            </Button>
          </div>
        ) : (isPending || connecting) ? (
          <div className="text-center p-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75" />
              <div className="relative w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-emerald-600" />
              </div>
            </div>
            <h3 className="font-bold mb-2" style={{ color: colors.textPrimary }}>
              {str.connecting}
            </h3>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {str.waitingDesc}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleCancelConnection}
                size="sm"
              >
                {str.cancelConnection}
              </Button>
              <Button
                onClick={handleConnect}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {str.openLine}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Benefits */}
            <div>
              <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
                {str.benefits}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[str.benefit1, str.benefit2, str.benefit3, str.benefit4].map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.borderColor}`
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs" style={{ color: colors.textPrimary }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Connect */}
            <div>
              <h4 className="font-semibold mb-3" style={{ color: colors.textPrimary }}>
                {str.howToConnect}
              </h4>
              <div className="space-y-2">
                {[str.step1, str.step2, str.step3, str.step4].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">{idx + 1}</span>
                    </div>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base font-bold"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {str.connecting}
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {str.connect}
                </>
              )}
            </Button>

            {/* Alternative: QR Code */}
            <div className="text-center">
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-sm font-semibold flex items-center gap-2 mx-auto"
                style={{
                  color: colors.textSecondary,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = colors.textPrimary}
                onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
              >
                <QrCode className="w-4 h-4" />
                {showQR ? str.hideQR : str.showQR}
              </button>
            </div>

            {showQR && (
              <div className="text-center p-6 rounded-lg" style={{
                backgroundColor: colors.bg,
                border: `2px solid ${colors.borderColor}`
              }}>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/81fb46467_M_gainfriends_2dbarcodes_GW.png"
                  alt="LINE QR Code"
                  className="w-48 h-48 mx-auto mb-3"
                />
                <p className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
                  {str.scanQR}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {str.linkCopied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        {str.copyLink}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}