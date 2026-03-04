import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const LISA_SYSTEM_PROMPT = `You are Lisa, the friendly AI assistant for LeaseShield - a Thai rental deposit protection service.

CURRENT PRICING (ALWAYS USE THESE - NO OLD PRICES):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subscriptions:
• Lite: ฿190/month or ฿1,900/year (save 17%)
• Protect: ฿390/month or ฿3,900/year (save 17%)  
• Secure: ฿990/month or ฿9,900/year (save 17%)

One-time Services:
• Lease Scan Only: ฿590 (no subscription required)
• Resolve Service: ฿3,500 (members) or ฿5,000 (public)

NEVER mention old prices like 390, 690, or 1,290 for subscriptions.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAN FEATURES:
Explorer (Free):
- 1 lifetime lease scan
- Basic risk score preview
- 100MB storage

Lite (฿190/month or ฿1,900/year — ฿158/month equivalent):
- 6 lease scans/year
- Email notifications
- Deposit tracker
- 3 letter credits
- 1GB storage

Protect (฿390/month or ฿3,900/year — ฿325/month equivalent):
- Everything in Lite
- 12 lease scans/year
- LINE notifications
- Rent payment alerts
- 5 letter credits
- 5GB storage
- Automated reminders

Secure (฿990/month or ฿9,900/year — ฿825/month equivalent):
- Everything in Protect
- UNLIMITED lease scans
- 50 letter credits/month (auto-refreshed every 30 days)
- 20GB storage
- Priority support
- Priority case queue
- Advanced reminders
- 1 Resolve case/year (included)
- Unlimited FastTrack (complimentary)

Your personality:
- Warm, helpful, professional
- Explain complex legal/rental terms simply
- Always mention prevention (LeaseShield is about preventing problems)
- Keep answers concise but complete
- If you don't know something, admit it and suggest contacting support@leaseshield.asia

Common questions:
- Pricing → Use the CURRENT PRICING above
- Plan comparison → Highlight prevention features
- Deposit disputes → Mention Resolve service (฿3,500 members / ฿5,000 public)
- Lease scan → Can buy one-time for ฿590
- PDPA compliance → Yes, fully compliant, users can export data anytime

Respond in the same language as the user's question.`;

export default function Lisa({ language = 'en', isDarkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const colors = isDarkMode ? {
    bg: '#1F2937',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: '#FFFFFF'
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LISA_SYSTEM_PROMPT}\n\nUser question: ${userMessage}`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response || 'I apologize, I encountered an error. Please try again or contact support@leaseshield.asia'
      }]);
    } catch (error) {
      console.error('Lisa error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'th' 
          ? 'ขออภัย เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือติดต่อ support@leaseshield.asia'
          : 'Sorry, an error occurred. Please try again or contact support@leaseshield.asia'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#0C3B2E',
          border: '3px solid #C7A338',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(12,59,46,0.4)',
          zIndex: 1000,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 10px 24px rgba(12,59,46,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(12,59,46,0.4)';
        }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <Card
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '380px',
        maxWidth: 'calc(100vw - 40px)',
        height: '500px',
        maxHeight: 'calc(100vh - 150px)',
        zIndex: 1000,
        backgroundColor: colors.cardBg,
        borderColor: colors.borderColor,
        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${colors.borderColor}`,
          backgroundColor: '#0C3B2E',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="flex items-center gap-2">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#C7A338',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Lisa</p>
            <p className="text-xs text-white/70">
              {language === 'th' ? 'ผู้ช่วยของคุณ' : language === 'zh' ? '您的助手' : language === 'ja' ? 'あなたのアシスタント' : language === 'ko' ? '귀하의 도우미' : language === 'ru' ? 'Ваш помощник' : 'Your Assistant'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div className="text-center" style={{ marginTop: '40px' }}>
            <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: colors.textSecondary, opacity: 0.5 }} />
            <p className="text-sm font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'สวัสดี! ฉันคือ Lisa' : language === 'zh' ? '你好！我是Lisa' : language === 'ja' ? 'こんにちは！Lisaです' : language === 'ko' ? '안녕하세요! Lisa입니다' : language === 'ru' ? 'Привет! Я Lisa' : 'Hi! I\'m Lisa'}
            </p>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ถามฉันเกี่ยวกับแผน ราคา หรือฟีเจอร์' : language === 'zh' ? '询问我有关计划、价格或功能的问题' : language === 'ja' ? 'プラン、価格、機能について質問してください' : language === 'ko' ? '플랜, 가격 또는 기능에 대해 질문하세요' : language === 'ru' ? 'Спросите меня о планах, ценах или функциях' : 'Ask me about plans, pricing, or features'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: msg.role === 'user' ? '#0C3B2E' : (isDarkMode ? '#374151' : '#F0FDF4'),
                    color: msg.role === 'user' ? '#FFFFFF' : colors.textPrimary,
                    fontSize: '14px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? '#374151' : '#F0FDF4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0C3B2E' }} />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'กำลังคิด...' : language === 'zh' ? '思考中...' : language === 'ja' ? '考え中...' : language === 'ko' ? '생각 중...' : language === 'ru' ? 'Думаю...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '12px',
        borderTop: `1px solid ${colors.borderColor}`,
        backgroundColor: colors.bg
      }}>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'th' ? 'พิมพ์คำถามของคุณ...' : language === 'zh' ? '输入您的问题...' : language === 'ja' ? '質問を入力...' : language === 'ko' ? '질문을 입력하세요...' : language === 'ru' ? 'Введите ваш вопрос...' : 'Type your question...'}
            disabled={isLoading}
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.borderColor,
              color: colors.textPrimary
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              backgroundColor: '#0C3B2E',
              color: '#FFFFFF',
              minWidth: '44px'
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}