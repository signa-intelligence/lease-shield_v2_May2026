import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Clock } from "lucide-react";

export default function PromptPayQR({ caseId, amount, language, isDarkMode, onSuccess, onCancel }) {
  const [status, setStatus] = useState("loading"); // loading | qr_ready | polling | confirmed | expired | error
  const [qrData, setQrData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 min in seconds
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const colors = isDarkMode ? {
    bg: '#2A2D30', text: '#F9FAFB', sub: '#D1D5DB', border: 'rgba(255,255,255,0.1)'
  } : {
    bg: '#FFFFFF', text: '#0F172A', sub: '#475569', border: 'rgba(12,59,46,0.08)'
  };

  const str = {
    en: {
      generating: "Generating PromptPay QR code...",
      scanToPay: "Scan to Pay with PromptPay",
      amount: "Amount",
      timeRemaining: "Time remaining",
      waitingConfirmation: "Waiting for payment confirmation...",
      paymentConfirmed: "Payment confirmed!",
      redirecting: "Redirecting...",
      expired: "QR code expired",
      tryAgain: "Generate New QR",
      error: "Failed to generate QR code",
      cancel: "Cancel — Pay by Card Instead",
      instructions: "Open your banking app, scan this QR code, and confirm the payment."
    },
    th: {
      generating: "กำลังสร้าง QR Code PromptPay...",
      scanToPay: "สแกนเพื่อจ่ายด้วย PromptPay",
      amount: "จำนวนเงิน",
      timeRemaining: "เวลาที่เหลือ",
      waitingConfirmation: "รอการยืนยันการชำระเงิน...",
      paymentConfirmed: "ชำระเงินสำเร็จ!",
      redirecting: "กำลังเปลี่ยนหน้า...",
      expired: "QR Code หมดอายุ",
      tryAgain: "สร้าง QR ใหม่",
      error: "ไม่สามารถสร้าง QR Code ได้",
      cancel: "ยกเลิก — จ่ายด้วยบัตรแทน",
      instructions: "เปิดแอปธนาคาร สแกน QR Code นี้ แล้วยืนยันการชำระเงิน"
    },
    zh: { generating: "正在生成PromptPay二维码...", scanToPay: "扫码支付 PromptPay", amount: "金额", timeRemaining: "剩余时间", waitingConfirmation: "等待支付确认...", paymentConfirmed: "支付已确认!", redirecting: "正在跳转...", expired: "二维码已过期", tryAgain: "生成新二维码", error: "生成二维码失败", cancel: "取消 — 改用银行卡支付", instructions: "打开银行应用，扫描此二维码，确认付款。" },
    ja: { generating: "PromptPay QRコード生成中...", scanToPay: "PromptPayでスキャンして支払う", amount: "金額", timeRemaining: "残り時間", waitingConfirmation: "支払い確認待ち...", paymentConfirmed: "支払い確認済み!", redirecting: "リダイレクト中...", expired: "QRコードの有効期限切れ", tryAgain: "新しいQRを生成", error: "QRコードの生成に失敗", cancel: "キャンセル — カードで支払う", instructions: "銀行アプリを開き、このQRコードをスキャンして支払いを確認してください。" },
    ko: { generating: "PromptPay QR 코드 생성 중...", scanToPay: "PromptPay로 스캔하여 결제", amount: "금액", timeRemaining: "남은 시간", waitingConfirmation: "결제 확인 대기 중...", paymentConfirmed: "결제 확인됨!", redirecting: "이동 중...", expired: "QR 코드 만료됨", tryAgain: "새 QR 생성", error: "QR 코드 생성 실패", cancel: "취소 — 카드로 결제", instructions: "은행 앱을 열고 이 QR 코드를 스캔한 후 결제를 확인하세요." },
    ru: { generating: "Генерация QR-кода PromptPay...", scanToPay: "Отсканируйте для оплаты через PromptPay", amount: "Сумма", timeRemaining: "Осталось времени", waitingConfirmation: "Ожидание подтверждения оплаты...", paymentConfirmed: "Оплата подтверждена!", redirecting: "Перенаправление...", expired: "QR-код истёк", tryAgain: "Создать новый QR", error: "Не удалось создать QR-код", cancel: "Отмена — оплатить картой", instructions: "Откройте банковское приложение, отсканируйте этот QR-код и подтвердите платёж." }
  };
  const t = str[language] || str.en;

  const generateQR = async () => {
    setStatus("loading");
    setError(null);
    setTimeLeft(900);
    
    const response = await base44.functions.invoke('createOmiseCharge', {
      case_id: caseId,
      amount: amount
    });

    if (response.data?.qr_code_url) {
      setQrData(response.data);
      setStatus("qr_ready");
      startCountdown();
      startPolling();
    } else {
      setError(response.data?.error || "Unknown error");
      setStatus("error");
    }
  };

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = 900;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setStatus("expired");
        stopPolling();
      }
    }, 1000);
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const caseRecord = await base44.entities.Case.get(caseId);
      if (caseRecord.status === "intake") {
        setStatus("confirmed");
        stopPolling();
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => onSuccess(), 2000);
      }
    }, 5000); // poll every 5 seconds
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    generateQR();
    return () => {
      stopPolling();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.bg }}>
      <CardContent className="p-6">
        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#6366F1' }} />
            <p className="text-sm font-semibold" style={{ color: colors.text }}>{t.generating}</p>
          </div>
        )}

        {/* QR Ready */}
        {(status === "qr_ready" || status === "polling") && qrData && (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text }}>{t.scanToPay}</h3>
            
            <div className="p-4 bg-white rounded-xl shadow-lg">
              <img
                src={qrData.qr_code_url}
                alt="PromptPay QR Code"
                className="w-56 h-56 object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-2xl font-bold" style={{ color: colors.text }}>
                ฿{amount.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: colors.sub }}>{t.instructions}</p>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
              backgroundColor: timeLeft <= 120
                ? (isDarkMode ? '#4C1D1D' : '#FEE2E2')
                : (isDarkMode ? '#1E3A5F' : '#EFF6FF')
            }}>
              <Clock className="w-4 h-4" style={{ color: timeLeft <= 120 ? '#EF4444' : '#3B82F6' }} />
              <span className="text-sm font-mono font-bold" style={{
                color: timeLeft <= 120 ? '#EF4444' : '#3B82F6'
              }}>
                {t.timeRemaining}: {formatTime(timeLeft)}
              </span>
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#F59E0B' }} />
              <p className="text-sm" style={{ color: '#F59E0B' }}>{t.waitingConfirmation}</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                stopPolling();
                if (timerRef.current) clearInterval(timerRef.current);
                onCancel();
              }}
              className="text-sm"
              style={{ color: colors.sub }}
            >
              {t.cancel}
            </Button>
          </div>
        )}

        {/* Confirmed */}
        {status === "confirmed" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            }}>
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-bold" style={{ color: '#10B981' }}>{t.paymentConfirmed}</p>
            <p className="text-sm" style={{ color: colors.sub }}>{t.redirecting}</p>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <AlertTriangle className="w-12 h-12" style={{ color: '#F59E0B' }} />
            <p className="text-lg font-bold" style={{ color: colors.text }}>{t.expired}</p>
            <Button onClick={generateQR} style={{ backgroundColor: '#6366F1', color: '#FFF' }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.tryAgain}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-sm"
              style={{ color: colors.sub }}
            >
              {t.cancel}
            </Button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-bold" style={{ color: colors.text }}>{t.error}</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={generateQR} style={{ backgroundColor: '#6366F1', color: '#FFF' }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.tryAgain}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-sm"
              style={{ color: colors.sub }}
            >
              {t.cancel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}