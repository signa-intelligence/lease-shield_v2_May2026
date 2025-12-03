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
    },
    zh: {
      title: 'LINE通知',
      yourAccount: '您的账户',
      landlordAccount: '房东',
      juristicAccount: '物业管理处',
      connected: '已连接',
      notConnected: '未连接',
      pending: '等待连接',
      connectBtn: '连接LINE',
      openLine: '在LINE中打开',
      copyLink: '复制链接',
      linkCopied: '链接已复制！',
      copyCommand: '复制指令',
      shareCommand: '分享',
      commandCopied: '已复制！',
      step1: '步骤1：点击连接LINE',
      step2: '步骤2：添加LeaseShield为好友',
      step3: '步骤3：发送 "confirm"',
      benefits: '立即获取以下提醒：',
      benefit1: '📅 租约截止日期',
      benefit2: '💰 押金退还',
      benefit3: '🏠 租金提醒',
      benefit4: '🔧 维护更新',
      pendingMsg: '等待您添加LeaseShield LINE官方账号为好友',
      scanQR: '使用LINE应用扫描此二维码',
      orUseLink: '或点击上面的链接',
      checkConnection: '检查连接',
      checking: '检查中...',
      upgradeRequired: '升级到Protect或Secure',
      lineUpsellText: 'LINE通知（租约截止日期、押金退还、租金提醒、维护更新）在Protect和Secure计划中可用。',
      upgradeToUnlock: '升级以解锁LINE提醒',
      viewPlans: '查看计划',
      landlordInstructions: '请房东添加 @leaseshield 并发送命令',
      juristicInstructions: '请物业添加 @leaseshield 并发送命令',
      receiveNotifications: '将接收维护通知'
    },
    ja: {
      title: 'LINE通知',
      yourAccount: 'あなたのアカウント',
      landlordAccount: '家主',
      juristicAccount: '建物管理',
      connected: '接続済み',
      notConnected: '未接続',
      pending: '接続待ち',
      connectBtn: 'LINEに接続',
      openLine: 'LINEで開く',
      copyLink: 'リンクをコピー',
      linkCopied: 'リンクをコピーしました！',
      copyCommand: 'コマンドをコピー',
      shareCommand: '共有',
      commandCopied: 'コピーしました！',
      step1: 'ステップ1：LINEに接続をクリック',
      step2: 'ステップ2：LeaseShieldを友だち追加',
      step3: 'ステップ3："confirm"を送信',
      benefits: '次の情報をすぐに受け取れます：',
      benefit1: '📅 賃貸契約の期限',
      benefit2: '💰 敷金返還',
      benefit3: '🏠 家賃リマインダー',
      benefit4: '🔧 メンテナンス更新',
      pendingMsg: 'LeaseShield LINE公式アカウントを友だち追加してください',
      scanQR: 'LINEアプリでこのQRコードをスキャン',
      orUseLink: 'または上記のリンクをクリック',
      checkConnection: '接続を確認',
      checking: '確認中...',
      upgradeRequired: 'ProtectまたはSecureにアップグレード',
      lineUpsellText: 'LINE通知（賃貸契約の期限、敷金返還、家賃リマインダー、メンテナンス更新）は、ProtectおよびSecureプランで利用可能です。',
      upgradeToUnlock: 'アップグレードしてLINEリマインダーを解除',
      viewPlans: 'プランを表示',
      landlordInstructions: '家主に @leaseshield を追加してコマンドを送信するよう依頼してください',
      juristicInstructions: '管理会社に @leaseshield を追加してコマンドを送信するよう依頼してください',
      receiveNotifications: 'メンテナンス通知を受け取ります'
    },
    ko: {
      title: 'LINE 알림',
      yourAccount: '귀하의 계정',
      landlordAccount: '집주인',
      juristicAccount: '건물 관리',
      connected: '연결됨',
      notConnected: '연결되지 않음',
      pending: '연결 대기 중',
      connectBtn: 'LINE 연결',
      openLine: 'LINE에서 열기',
      copyLink: '링크 복사',
      linkCopied: '링크 복사됨！',
      copyCommand: '명령어 복사',
      shareCommand: '공유',
      commandCopied: '복사됨！',
      step1: '1단계: LINE 연결 클릭',
      step2: '2단계: LeaseShield를 친구로 추가',
      step3: '3단계: "confirm" 보내기',
      benefits: '다음에 대한 즉각적인 알림 받기:',
      benefit1: '📅 임대 계약 마감일',
      benefit2: '💰 보증금 반환',
      benefit3: '🏠 임대료 알림',
      benefit4: '🔧 유지보수 업데이트',
      pendingMsg: 'LeaseShield LINE 공식 계정을 친구로 추가하기를 기다리고 있습니다',
      scanQR: 'LINE 앱으로 이 QR 코드 스캔',
      orUseLink: '또는 위 링크 클릭',
      checkConnection: '연결 확인',
      checking: '확인 중...',
      upgradeRequired: 'Protect 또는 Secure로 업그레이드',
      lineUpsellText: 'LINE 알림（임대 계약 마감일、보증금 반환、임대료 알림、유지보수 업데이트）은 Protect 및 Secure 플랜에서 사용할 수 있습니다。',
      upgradeToUnlock: '업그레이드하여 LINE 알림 잠금 해제',
      viewPlans: '플랜 보기',
      landlordInstructions: '집주인에게 @leaseshield 를 추가하고 명령을 보내달라고 요청하세요',
      juristicInstructions: '관리 사무소에 @leaseshield 를 추가하고 명령을 보내달라고 요청하세요',
      receiveNotifications: '유지보수 알림을 받게 됩니다'
    },
    ru: {
      title: 'Уведомления LINE',
      yourAccount: 'Ваш аккаунт',
      landlordAccount: 'Арендодатель',
      juristicAccount: 'Управляющая компания',
      connected: 'Подключено',
      notConnected: 'Не подключено',
      pending: 'Ожидание подключения',
      connectBtn: 'Подключить LINE',
      openLine: 'Открыть в LINE',
      copyLink: 'Скопировать ссылку',
      linkCopied: 'Ссылка скопирована！',
      copyCommand: 'Скопировать команду',
      shareCommand: 'Поделиться',
      commandCopied: 'Скопировано！',
      step1: 'Шаг 1: Нажмите Подключить LINE',
      step2: 'Шаг 2: Добавьте LeaseShield в друзья',
      step3: 'Шаг 3: Отправьте "confirm"',
      benefits: 'Получайте мгновенные уведомления о:',
      benefit1: '📅 Сроках договора',
      benefit2: '💰 Возврате депозита',
      benefit3: '🏠 Напоминаниях об аренде',
      benefit4: '🔧 Обновлениях обслуживания',
      pendingMsg: 'Ожидаем добавления LeaseShield LINE OA в друзья',
      scanQR: 'Отсканируйте этот QR-код в приложении LINE',
      orUseLink: 'Или нажмите на ссылку выше',
      checkConnection: 'Проверить подключение',
      checking: 'Проверка...',
      upgradeRequired: 'Обновите до Protect или Secure',
      lineUpsellText: 'Уведомления LINE (сроки договора, возврат депозита, напоминания об аренде, обновления обслуживания) доступны в планах Protect и Secure.',
      upgradeToUnlock: 'Обновите, чтобы разблокировать напоминания LINE',
      viewPlans: 'Посмотреть планы',
      landlordInstructions: 'Попросите арендодателя добавить @leaseshield и отправить команду',
      juristicInstructions: 'Попросите управляющую компанию добавить @leaseshield и отправить команду',
      receiveNotifications: 'Будет получать уведомления об обслуживании'
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