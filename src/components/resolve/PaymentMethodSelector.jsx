import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

export default function PaymentMethodSelector({ amount, language, isDarkMode, onSelectStripe, onSelectPromptPay, loading }) {
  const colors = isDarkMode ? {
    bg: '#2A2D30', text: '#F9FAFB', sub: '#D1D5DB', border: 'rgba(255,255,255,0.1)', hover: '#353A3D'
  } : {
    bg: '#FFFFFF', text: '#0F172A', sub: '#475569', border: 'rgba(12,59,46,0.08)', hover: '#F8FAFC'
  };

  const str = {
    en: { title: "Choose Payment Method", amount: "Total", card: "Pay by Card", cardDesc: "Credit/debit card via Stripe", promptpay: "Pay by PromptPay", promptpayDesc: "Scan QR code with your banking app", popular: "Popular in Thailand" },
    th: { title: "เลือกวิธีชำระเงิน", amount: "ยอดรวม", card: "จ่ายด้วยบัตร", cardDesc: "บัตรเครดิต/เดบิตผ่าน Stripe", promptpay: "จ่ายด้วย PromptPay", promptpayDesc: "สแกน QR Code ด้วยแอปธนาคาร", popular: "นิยมในไทย" },
    zh: { title: "选择支付方式", amount: "总计", card: "银行卡支付", cardDesc: "通过Stripe支付信用卡/借记卡", promptpay: "PromptPay支付", promptpayDesc: "用银行应用扫描二维码", popular: "泰国热门" },
    ja: { title: "支払い方法を選択", amount: "合計", card: "カードで支払う", cardDesc: "Stripe経由のクレジット/デビットカード", promptpay: "PromptPayで支払う", promptpayDesc: "銀行アプリでQRコードをスキャン", popular: "タイで人気" },
    ko: { title: "결제 방법 선택", amount: "합계", card: "카드 결제", cardDesc: "Stripe를 통한 신용/직불 카드", promptpay: "PromptPay 결제", promptpayDesc: "은행 앱으로 QR 코드 스캔", popular: "태국에서 인기" },
    ru: { title: "Выберите способ оплаты", amount: "Итого", card: "Оплата картой", cardDesc: "Кредитная/дебетовая карта через Stripe", promptpay: "Оплата PromptPay", promptpayDesc: "Сканируйте QR-код банковским приложением", popular: "Популярно в Таиланде" }
  };
  const t = str[language] || str.en;

  return (
    <Card className="border-none shadow-xl" style={{ backgroundColor: colors.bg }}>
      <CardContent className="p-6 space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-lg font-bold" style={{ color: colors.text }}>{t.title}</h3>
          <p className="text-2xl font-bold mt-1" style={{ color: colors.text }}>
            ฿{amount.toLocaleString()}
          </p>
        </div>

        {/* PromptPay Option */}
        <button
          onClick={onSelectPromptPay}
          disabled={loading}
          className="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4"
          style={{
            borderColor: '#6366F1',
            backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
          }}>
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: colors.text }}>{t.promptpay}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                {t.popular}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: colors.sub }}>{t.promptpayDesc}</p>
          </div>
        </button>

        {/* Stripe Card Option */}
        <button
          onClick={onSelectStripe}
          disabled={loading}
          className="w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.bg,
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
          }}>
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <span className="font-bold" style={{ color: colors.text }}>{t.card}</span>
            <p className="text-sm mt-0.5" style={{ color: colors.sub }}>{t.cardDesc}</p>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}