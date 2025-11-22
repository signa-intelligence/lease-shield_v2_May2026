import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, Clock, ExternalLink, Copy, Loader2, TrendingUp } from "lucide-react";

export default function LineConnectionStatus({ user, colors }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const queryClient = useQueryClient();
  
  const userTier = user?.plan_tier || 'free';
  const lineFeatureAvailable = ['protect', 'secure'].includes(userTier);

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
  const isPending = user?.line_connection_pending === true;

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
      checking: 'Checking...',
      upgradeRequired: 'Upgrade to Protect or Secure',
      lineUpsellText: 'LINE notifications (lease deadlines, deposit returns, rent reminders, maintenance updates) are available on Protect and Secure plans.',
      upgradeToUnlock: 'Upgrade to unlock LINE reminders',
      viewPlans: 'View plans'
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
      checking: 'กำลังตรวจสอบ...',
      upgradeRequired: 'อัปเกรดเป็น Protect หรือ Secure',
      lineUpsellText: 'การแจ้งเตือน LINE (กำหนดสัญญาเช่า, การคืนเงินมัดจำ, การชำระค่าเช่า, อัปเดตการซ่อม) พร้อมใช้งานในแผน Protect และ Secure',
      upgradeToUnlock: 'อัปเกรดเพื่อปลดล็อกการแจ้งเตือน LINE',
      viewPlans: 'ดูแผน'
    },
    zh: {
      title: 'LINE通知',
      connected: '已连接',
      notConnected: '未连接',
      pending: '等待连接',
      connectBtn: '连接LINE',
      openLine: '在LINE中打开',
      copyLink: '复制链接',
      linkCopied: '链接已复制！',
      step1: '步骤1：点击连接LINE',
      step2: '步骤2：添加LeaseShield为好友',
      step3: '步骤3：完成！您将收到通知',
      benefits: '获得即时提醒：',
      benefit1: '📅 租约截止日期',
      benefit2: '💰 押金退还',
      benefit3: '🏠 租金提醒',
      benefit4: '🔧 维护更新',
      pendingMsg: '等待您添加LeaseShield LINE OA为好友',
      scanQR: '用LINE应用扫描此二维码',
      orUseLink: '或点击上面的链接',
      checkConnection: '检查连接',
      checking: '检查中...',
      upgradeRequired: '升级到Protect或Secure',
      lineUpsellText: 'LINE通知（租约截止日期、押金退还、租金提醒、维护更新）在Protect和Secure计划中可用。',
      upgradeToUnlock: '升级以解锁LINE提醒',
      viewPlans: '查看计划'
    },
    ja: {
      title: 'LINE通知',
      connected: '接続済み',
      notConnected: '未接続',
      pending: '接続待ち',
      connectBtn: 'LINEを接続',
      openLine: 'LINEで開く',
      copyLink: 'リンクをコピー',
      linkCopied: 'リンクをコピーしました！',
      step1: 'ステップ1：LINEを接続をクリック',
      step2: 'ステップ2：LeaseShieldを友達に追加',
      step3: 'ステップ3：完了！通知を受け取ります',
      benefits: '即座のアラートを受け取る：',
      benefit1: '📅 賃貸契約期限',
      benefit2: '💰 敷金返還',
      benefit3: '🏠 家賃リマインダー',
      benefit4: '🔧 メンテナンス更新',
      pendingMsg: 'LeaseShield LINE OAを友達に追加するのをお待ちしています',
      scanQR: 'LINEアプリでこのQRをスキャン',
      orUseLink: 'または上のリンクをクリック',
      checkConnection: '接続を確認',
      checking: '確認中...',
      upgradeRequired: 'ProtectまたはSecureにアップグレード',
      lineUpsellText: 'LINE通知（賃貸契約期限、敷金返還、家賃リマインダー、メンテナンス更新）は、ProtectおよびSecureプランで利用可能です。',
      upgradeToUnlock: 'LINEリマインダーをアンロックするためにアップグレード',
      viewPlans: 'プランを見る'
    },
    ko: {
      title: 'LINE 알림',
      connected: '연결됨',
      notConnected: '연결되지 않음',
      pending: '연결 대기 중',
      connectBtn: 'LINE 연결',
      openLine: 'LINE에서 열기',
      copyLink: '링크 복사',
      linkCopied: '링크 복사됨!',
      step1: '1단계: LINE 연결 클릭',
      step2: '2단계: LeaseShield를 친구로 추가',
      step3: '3단계: 완료! 알림을 받게 됩니다',
      benefits: '즉시 알림 받기:',
      benefit1: '📅 임대 계약 마감일',
      benefit2: '💰 보증금 반환',
      benefit3: '🏠 임대료 알림',
      benefit4: '🔧 유지보수 업데이트',
      pendingMsg: 'LeaseShield LINE OA를 친구로 추가하기를 기다리는 중',
      scanQR: 'LINE 앱으로 이 QR 스캔',
      orUseLink: '또는 위의 링크를 클릭',
      checkConnection: '연결 확인',
      checking: '확인 중...',
      upgradeRequired: 'Protect 또는 Secure로 업그레이드',
      lineUpsellText: 'LINE 알림(임대 계약 마감일, 보증금 반환, 임대료 알림, 유지보수 업데이트)은 Protect 및 Secure 플랜에서 사용할 수 있습니다.',
      upgradeToUnlock: 'LINE 알림을 잠금 해제하려면 업그레이드',
      viewPlans: '플랜 보기'
    }
  };

  const str = strings[language] || strings.en;

  const lineOAUrl = "https://line.me/R/ti/p/@leaseshield";
  const qrCodeUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/81fb46467_M_gainfriends_2dbarcodes_GW.png";

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
          <Badge className={isConnected ? 'bg-emerald-100 text-emerald-700' : isPending ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}>
            {isConnected ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {str.connected}
              </>
            ) : isPending ? (
              <>
                <Clock className="w-3 h-3 mr-1" />
                {str.pending}
              </>
            ) : (
              str.notConnected
            )}
          </Badge>
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
        ) : !isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#1E3A5F' : '#EFF6FF', border: '2px solid #3B82F6' }}>
              <h4 className="font-bold mb-2" style={{ color: colors.textPrimary }}>{str.benefits}</h4>
              <ul className="space-y-1 text-sm" style={{ color: colors.textSecondary }}>
                <li>{str.benefit1}</li>
                <li>{str.benefit2}</li>
                <li>{str.benefit3}</li>
                <li>{str.benefit4}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <a href={lineOAUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {str.connectBtn}
                </Button>
              </a>
              
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="w-full"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
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

            {isPending && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: isDarkMode ? '#3A2D1C' : '#FFF7ED', border: '2px solid #F59E0B' }}>
                <p className="text-sm mb-3" style={{ color: colors.textPrimary }}>
                  {str.pendingMsg}
                </p>
                <Button
                  variant="outline"
                  onClick={() => checkConnectionMutation.mutate()}
                  disabled={checkConnectionMutation.isPending}
                  className="w-full"
                >
                  {checkConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {str.checking}
                    </>
                  ) : (
                    str.checkConnection
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-emerald-600" />
            <p className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
              {str.connected}
            </p>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {str.benefit1} • {str.benefit2}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}