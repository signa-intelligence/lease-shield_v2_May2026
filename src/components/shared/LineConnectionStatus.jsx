import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MessageCircle, ExternalLink, Copy, Loader2 } from "lucide-react";

export default function LineConnectionStatus({ user, colors }) {
  const [showQR, setShowQR] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const queryClient = useQueryClient();

  const startConnectionMutation = useMutation({
    mutationFn: async () => {
      // Set pending flag on user
      await base44.auth.updateMe({ pending_line_connection: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowQR(true);
    }
  });

  const language = user?.language || 'en';
  const isConnected = !!user?.line_messaging_token;
  const isPending = user?.pending_line_connection === true;

  const lineOALink = 'https://line.me/R/ti/p/@leaseshield';
  const lineOAQR = 'https://qr-official.line.me/sid/M/leaseshield.png';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(lineOALink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStartConnection = () => {
    startConnectionMutation.mutate();
  };

  const strings = {
    en: {
      title: 'LINE Notifications',
      connected: 'Connected',
      notConnected: 'Not Connected',
      pending: 'Waiting for Connection',
      connectBtn: 'Connect LINE',
      openLine: 'Open in LINE',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      step1: 'Step 1: Click Connect LINE',
      step2: 'Step 2: Add LeaseShield as friend',
      step3: 'Step 3: Done! You\'ll get notifications',
      benefits: 'Get instant alerts for:',
      benefit1: '📅 Lease deadlines',
      benefit2: '💰 Deposit returns',
      benefit3: '🏠 Rent reminders',
      benefit4: '🔧 Maintenance updates',
      pendingMsg: 'Waiting for you to add LeaseShield LINE OA as friend',
      scanQR: 'Scan this QR with LINE app',
      orUseLink: 'Or click the link above',
      checkConnection: 'Check Connection',
      checking: 'Checking...'
    },
    th: {
      title: 'การแจ้งเตือน LINE',
      connected: 'เชื่อมต่อแล้ว',
      notConnected: 'ยังไม่เชื่อมต่อ',
      pending: 'รอการเชื่อมต่อ',
      connectBtn: 'เชื่อมต่อ LINE',
      openLine: 'เปิดใน LINE',
      copyLink: 'คัดลอกลิงก์',
      linkCopied: 'คัดลอกแล้ว!',
      step1: 'ขั้นตอน 1: คลิกเชื่อมต่อ LINE',
      step2: 'ขั้นตอน 2: เพิ่ม LeaseShield เป็นเพื่อน',
      step3: 'ขั้นตอน 3: เสร็จแล้ว! คุณจะได้รับการแจ้งเตือน',
      benefits: 'รับการแจ้งเตือนทันทีสำหรับ:',
      benefit1: '📅 กำหนดสัญญาเช่า',
      benefit2: '💰 การคืนเงินมัดจำ',
      benefit3: '🏠 การชำระค่าเช่า',
      benefit4: '🔧 อัปเดตการซ่อม',
      pendingMsg: 'รอคุณเพิ่ม LeaseShield LINE OA เป็นเพื่อน',
      scanQR: 'สแกน QR ด้วยแอป LINE',
      orUseLink: 'หรือคลิกลิงก์ด้านบน',
      checkConnection: 'ตรวจสอบการเชื่อมต่อ',
      checking: 'กำลังตรวจสอบ...'
    }
  };

  const str = strings[language];

  if (isConnected) {
    return (
      <Card className="border-2 border-green-200" style={{ backgroundColor: colors.cardBg }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold" style={{ color: colors.textPrimary }}>{str.title}</p>
                <Badge className="bg-green-100 text-green-800 mt-1">
                  {str.connected}
                </Badge>
              </div>
            </div>
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-200" style={{ backgroundColor: colors.cardBg }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: colors.textPrimary }}>{str.title}</p>
            <Badge className="bg-amber-100 text-amber-800 mt-1">
              {isPending ? str.pending : str.notConnected}
            </Badge>
          </div>
        </div>

        {isPending ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-900 mb-2">
                <strong>{str.pendingMsg}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={lineOALink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {str.openLine}
                </a>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-500 text-green-600 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {str.linkCopied}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {str.copyLink}
                    </>
                  )}
                </button>
              </div>
            </div>

            {showQR && (
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <img 
                  src={lineOAQR}
                  alt="LINE QR Code"
                  className="w-48 h-48 mx-auto mb-2"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {str.scanQR}
                </p>
              </div>
            )}

            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['currentUser'] })}
              variant="outline"
              className="w-full"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {str.checkConnection}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {str.benefits}
              </p>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                <li>{str.benefit1}</li>
                <li>{str.benefit2}</li>
                <li>{str.benefit3}</li>
                <li>{str.benefit4}</li>
              </ul>
            </div>

            <Button
              onClick={handleStartConnection}
              disabled={startConnectionMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
            >
              {startConnectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {str.checking}
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {str.connectBtn}
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>
                {str.step1} → {str.step2} → {str.step3}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}