import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, Clock, ExternalLink, Copy, Loader2, TrendingUp, Share2, MessageCircle, User, Building } from "lucide-react";

export default function LineConnectionStatus({ user, colors }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copiedRole, setCopiedRole] = useState(null);
  const queryClient = useQueryClient();
  
  const userTier = user?.plan_tier || 'free';
  const lineFeatureAvailable = ['protect', 'secure'].includes(userTier);

  const initiateConnectionMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ pending_line_connection: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowQR(true);
    }
  });

  const checkConnectionMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await base44.auth.me();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
    }
  });

  const language = user?.language || 'en';
  const isDarkMode = user?.theme === 'dark';
  const isConnected = !!user?.line_messaging_token;
  const isPending = user?.pending_line_connection === true;
  const landlordConnected = !!user?.landlord_line_token;
  const juristicConnected = !!user?.juristic_line_token;

  const handleCopyConfirmCommand = async (role, email) => {
    const command = `confirm ${role} ${email}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShareCommand = async (role, email) => {
    const command = `confirm ${role} ${email}`;
    const roleLabel = role === 'landlord' 
      ? (language === 'th' ? 'เจ้าของบ้าน' : 'Landlord')
      : (language === 'th' ? 'นิติบุคคล' : 'Juristic');
    
    const text = language === 'th'
      ? `เชื่อมต่อ LINE กับ Lease Shield (${roleLabel}):\n\n1. เพิ่มเพื่อน: https://line.me/R/ti/p/@leaseshield\n2. ส่งข้อความนี้:\n\n${command}`
      : `Connect LINE to Lease Shield (${roleLabel}):\n\n1. Add friend: https://line.me/R/ti/p/@leaseshield\n2. Send this message:\n\n${command}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await handleCopyConfirmCommand(role, email);
        }
      }
    } else {
      await handleCopyConfirmCommand(role, email);
    }
  };

  const strings = {
    en: {
      title: 'LINE Notifications',
      yourAccount: 'Your Account',
      landlordAccount: 'Landlord',
      juristicAccount: 'Building Management',
      connected: 'Connected',
      notConnected: 'Not Connected',
      pending: 'Waiting for Connection',
      connectBtn: 'Connect LINE',
      openLine: 'Open in LINE',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      copyCommand: 'Copy Command',
      shareCommand: 'Share',
      commandCopied: 'Copied!',
      step1: 'Step 1: Click Connect LINE',
      step2: 'Step 2: Add LeaseShield as friend',
      step3: 'Step 3: Send "confirm"',
      benefits: 'Get instant alerts for:',
      benefit1: '📅 Lease deadlines',
      benefit2: '💰 Deposit returns',
      benefit3: '🏠 Rent reminders',
      benefit4: '🔧 Maintenance updates',
      pendingMsg: 'Waiting for you to add LeaseShield LINE OA as friend',
      scanQR: 'Scan this QR with LINE app',
      orUseLink: 'Or click the link above',
      checkConnection: 'Check Connection',
      checking: 'Checking...',
      upgradeRequired: 'Upgrade to Protect or Secure',
      lineUpsellText: 'LINE notifications (lease deadlines, deposit returns, rent reminders, maintenance updates) are available on Protect and Secure plans.',
      upgradeToUnlock: 'Upgrade to unlock LINE reminders',
      viewPlans: 'View plans',
      landlordInstructions: 'Ask landlord to add @leaseshield and send the command',
      juristicInstructions: 'Ask juristic to add @leaseshield and send the command',
      receiveNotifications: 'Will receive maintenance notifications'
    },
    th: {
      title: 'การแจ้งเตือน LINE',
      yourAccount: 'บัญชีของคุณ',
      landlordAccount: 'เจ้าของบ้าน',
      juristicAccount: 'นิติบุคคล',
      connected: 'เชื่อมต่อแล้ว',
      notConnected: 'ยังไม่เชื่อมต่อ',
      pending: 'รอการเชื่อมต่อ',
      connectBtn: 'เชื่อมต่อ LINE',
      openLine: 'เปิดใน LINE',
      copyLink: 'คัดลอกลิงก์',
      linkCopied: 'คัดลอกแล้ว!',
      copyCommand: 'คัดลอกคำสั่ง',
      shareCommand: 'แชร์',
      commandCopied: 'คัดลอกแล้ว!',
      step1: 'ขั้นตอน 1: คลิกเชื่อมต่อ LINE',
      step2: 'ขั้นตอน 2: เพิ่ม LeaseShield เป็นเพื่อน',
      step3: 'ขั้นตอน 3: ส่ง "confirm"',
      benefits: 'รับการแจ้งเตือนทันทีสำหรับ:',
      benefit1: '📅 กำหนดสัญญาเช่า',
      benefit2: '💰 การคืนเงินมัดจำ',
      benefit3: '🏠 การชำระค่าเช่า',
      benefit4: '🔧 อัปเดตการซ่อม',
      pendingMsg: 'รอคุณเพิ่ม LeaseShield LINE OA เป็นเพื่อน',
      scanQR: 'สแกน QR ด้วยแอป LINE',
      orUseLink: 'หรือคลิกลิงก์ด้านบน',
      checkConnection: 'ตรวจสอบการเชื่อมต่อ',
      checking: 'กำลังตรวจสอบ...',
      upgradeRequired: 'อัปเกรดเป็น Protect หรือ Secure',
      lineUpsellText: 'การแจ้งเตือน LINE (กำหนดสัญญาเช่า, การคืนเงินมัดจำ, การชำระค่าเช่า, อัปเดตการซ่อม) พร้อมใช้งานในแผน Protect และ Secure',
      upgradeToUnlock: 'อัปเกรดเพื่อปลดล็อกการแจ้งเตือน LINE',
      viewPlans: 'ดูแผน',
      landlordInstructions: 'ให้เจ้าของบ้านเพิ่มเพื่อน @leaseshield แล้วส่งคำสั่ง',
      juristicInstructions: 'ให้นิติบุคคลเพิ่มเพื่อน @leaseshield แล้วส่งคำสั่ง',
      receiveNotifications: 'จะได้รับการแจ้งเตือนการซ่อมบำรุง'
    }
  };

  const str = strings[language] || strings.en;
  const lineOAUrl = "https://line.me/R/ti/p/@leaseshield";
  const qrCodeUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/81fb46460_M_gainfriends_2dbarcodes_GW.png";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(lineOAUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
        <CardTitle className="flex items-center justify-between" style={{ color: colors.textPrimary }}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            {str.title}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!lineFeatureAvailable ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ 
              backgroundColor: isDarkMode ? 'rgba(199,163,56,0.15)' : 'rgba(199,163,56,0.08)', 
              border: '2px dashed rgba(199,163,56,0.3)' 
            }}>
              <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{str.upgradeRequired}</h4>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {str.lineUpsellText}
              </p>
            </div>

            <a href={`${window.location.origin}${window.location.pathname}#plan-selector`}>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                <TrendingUp className="w-4 h-4 mr-2" />
                {str.upgradeToUnlock}
              </Button>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tenant Connection */}
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: isConnected 
                  ? (isDarkMode ? '#1F2937' : '#F0FDF4')
                  : (isDarkMode ? '#2A2D30' : '#FEF2F2'),
                borderColor: isConnected ? '#10B981' : '#EF4444'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isConnected ? '#10B981' : '#EF4444' }}
                >
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {str.yourAccount}
                  </p>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {isConnected ? str.connected : str.notConnected}
                  </p>
                  {!isConnected && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <a href={lineOAUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {str.connectBtn}
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyLink}
                          className="text-xs"
                        >
                          {copiedLink ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              {str.linkCopied}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              {str.copyLink}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {str.step1} → {str.step2} → {str.step3}
                      </p>
                    </>
                  )}
                  {isConnected && (
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                      {str.receiveNotifications}
                    </p>
                  )}
                </div>
              </div>
              {showQR && !isConnected && (
                <div className="mt-4 p-4 rounded-lg text-center" style={{ 
                  backgroundColor: isDarkMode ? '#1A1D1F' : '#FFFFFF',
                  border: `2px solid ${colors.borderColor}`
                }}>
                  <img 
                    src={qrCodeUrl} 
                    alt="LINE QR Code"
                    className="w-48 h-48 mx-auto mb-3"
                  />
                  <p className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
                    {str.scanQR}
                  </p>
                </div>
              )}
              {isPending && !isConnected && (
                <div className="mt-3 p-3 rounded-lg" style={{ 
                  backgroundColor: isDarkMode ? '#3A2D1C' : '#FFF7ED', 
                  border: '2px solid #F59E0B' 
                }}>
                  <p className="text-xs mb-2" style={{ color: colors.textPrimary }}>
                    {str.pendingMsg}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkConnectionMutation.mutate()}
                    disabled={checkConnectionMutation.isPending}
                    className="w-full text-xs"
                  >
                    {checkConnectionMutation.isPending ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {str.checking}
                      </>
                    ) : (
                      str.checkConnection
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Landlord Connection */}
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: landlordConnected 
                  ? (isDarkMode ? '#1F2937' : '#F0FDF4')
                  : (isDarkMode ? '#2A2D30' : '#FFFBEB'),
                borderColor: landlordConnected ? '#10B981' : '#F59E0B'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: landlordConnected ? '#10B981' : '#F59E0B' }}
                >
                  {landlordConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {str.landlordAccount}
                  </p>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {landlordConnected 
                      ? `${str.connected} - ${str.receiveNotifications}`
                      : str.notConnected}
                  </p>
                  {!landlordConnected && user?.email && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <button
                          onClick={() => handleCopyConfirmCommand('landlord', user.email)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: copiedRole === 'landlord' ? '#10B981' : '#FFFFFF',
                            color: copiedRole === 'landlord' ? '#FFFFFF' : '#F59E0B',
                            border: `2px solid ${copiedRole === 'landlord' ? '#10B981' : '#F59E0B'}`,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedRole === 'landlord' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              {str.commandCopied}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 inline mr-1" />
                              {str.copyCommand}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleShareCommand('landlord', user.email)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#F59E0B',
                            color: '#FFFFFF',
                            border: '2px solid #F59E0B',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          <Share2 className="w-3 h-3 inline mr-1" />
                          {str.shareCommand}
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {str.landlordInstructions}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Juristic Connection */}
            <div
              className="p-4 rounded-xl border-2"
              style={{
                backgroundColor: juristicConnected 
                  ? (isDarkMode ? '#1F2937' : '#F0FDF4')
                  : (isDarkMode ? '#2A2D30' : '#EFF6FF'),
                borderColor: juristicConnected ? '#10B981' : '#3B82F6'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: juristicConnected ? '#10B981' : '#3B82F6' }}
                >
                  {juristicConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Building className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {str.juristicAccount}
                  </p>
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                    {juristicConnected 
                      ? `${str.connected} - ${str.receiveNotifications}`
                      : str.notConnected}
                  </p>
                  {!juristicConnected && user?.email && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <button
                          onClick={() => handleCopyConfirmCommand('juristic', user.email)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: copiedRole === 'juristic' ? '#10B981' : '#FFFFFF',
                            color: copiedRole === 'juristic' ? '#FFFFFF' : '#3B82F6',
                            border: `2px solid ${copiedRole === 'juristic' ? '#10B981' : '#3B82F6'}`,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedRole === 'juristic' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              {str.commandCopied}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 inline mr-1" />
                              {str.copyCommand}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleShareCommand('juristic', user.email)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF',
                            border: '2px solid #3B82F6',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          <Share2 className="w-3 h-3 inline mr-1" />
                          {str.shareCommand}
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {str.juristicInstructions}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}