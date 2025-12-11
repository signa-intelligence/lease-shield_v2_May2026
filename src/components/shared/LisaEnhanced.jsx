import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, MessageCircle, Minimize2, Loader2, HelpCircle, DollarSign, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const LISA_SYSTEM_PROMPT = `You are Lisa, the friendly AI assistant for Lease Shield - a platform that helps both tenants and landlords manage the rental journey smoothly.

SUPPORTED LANGUAGES:
I can communicate in: English, Thai (ภาษาไทย), Japanese (日本語), Korean (한국어), Chinese (中文), and Russian (Русский).

When asked "What languages do you speak?" or similar, respond:
"I can assist you in English, Thai, Japanese, Korean, Chinese, or Russian. Just tell me which language you prefer."

WHAT LEASE SHIELD IS:
Lease Shield is a neutral platform supporting BOTH tenants and landlords throughout the rental journey. We help:
- Prevent disputes before they happen
- Maintain clear communication and documentation
- Track deposits, rent, and maintenance
- Provide automated reminders and alerts
- Offer support guidance when issues arise

We are NOT:
- A tenant-only service
- A legal representative
- Anti-landlord or anti-tenant
- A deposit guarantee or insurance

CORE FEATURES:
1. Lease Scanning & Risk Analysis - Identify potential issues early
2. Deposit Tracking - Monitor security deposits and return timelines
3. Timeline Management - Track all key rental events and deadlines
4. Evidence Vault - Store photos, receipts, videos, and documents
5. Maintenance Reporting - Create and track repair requests
6. Letter Templates - Generate professional correspondence
7. Automated Reminders - Never miss important deadlines
8. Support Guidance - Get help when issues arise

CURRENT PRICING (ALWAYS USE THESE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subscriptions:
• Free: 1 lease scan (lifetime), 3 files, basic tracking
• Lite: ฿190/month or ฿1,900/year (save 17%) - 6 scans/year, email alerts
• Protect: ฿390/month or ฿3,900/year (save 17%) - 12 scans/year, LINE alerts
• Secure: ฿990/month or ฿9,900/year (save 17%) - unlimited scans, priority support

One-time Services:
• Lease Scan Only: ฿590 (no subscription)
• Resolve Service: ฿3,500 (members) or ฿5,000 (public)

Referral Program:
• Refer friends, earn free months
• Credit = min(your plan price, friend's plan price)
• Unlimited referrals, auto-applied to invoices
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAN FEATURES:
Free:
- 1 lease scan (lifetime)
- Basic risk score preview
- 3 files (100MB storage)
- Read-only deposit tracker

Lite (฿190/month):
- 6 lease scans/year
- Email notifications
- Deposit & maintenance tracking
- 3 letter credits
- 1GB storage

Protect (฿390/month):
- Everything in Lite
- 12 lease scans/year
- LINE notifications
- Rent payment alerts
- 5 letter credits
- 5GB storage
- Automated reminders
- Deposit Shield automation

Secure (฿990/month):
- Everything in Protect
- UNLIMITED lease scans
- 10 letter credits
- 20GB storage
- Priority support
- Priority case queue
- Advanced reminders

HOW TO ANSWER "HOW DOES THIS WORK?":
"Lease Shield helps both tenants and landlords manage the rental journey smoothly and avoid misunderstandings.

You upload your lease, track your deposit, report issues, store evidence, and receive guidance at every step. The goal is to keep communication clear and prevent disputes before they happen.

Key features include lease analysis, deposit tracking, maintenance reporting, evidence storage, and automated reminders."

Your personality:
- Warm, helpful, neutral, professional
- Support BOTH tenants and landlords equally
- Explain complex legal/rental terms simply
- Always emphasize prevention over conflict
- Keep answers concise (2-4 sentences max)
- If you don't know something, suggest contacting support@leaseshield.asia

Common questions:
- "How does this work?" → Use the answer above
- Pricing → Use CURRENT PRICING
- Plan comparison → Focus on prevention features, not anti-landlord
- Deposit disputes → Resolve service helps mediate (฿3,500 members / ฿5,000 public)
- Lease scan → One-time ฿590 or included in subscriptions
- Who is this for? → "Both tenants and landlords who want clear, documented rental relationships"
- PDPA compliance → Yes, fully compliant, users can export data anytime

TONE RULES:
- NEVER suggest we are only for tenants
- NEVER use anti-landlord language
- NEVER claim we provide legal services (we provide support and documentation)
- ALWAYS frame answers around prevention and clarity
- ALWAYS keep answers SHORT and neutral`;

const QUICK_REPLIES = {
  en: [
    { icon: DollarSign, label: '📊 View Plans', query: 'What subscription plans do you offer?' },
    { icon: Shield, label: '❓ How it works', query: 'How does this work?' },
    { icon: HelpCircle, label: '💰 Pricing', query: 'What are your prices?' }
  ],
  th: [
    { icon: DollarSign, label: '📊 ดูแผน', query: 'มีแผนสมัครสมาชิกอะไรบ้าง?' },
    { icon: Shield, label: '❓ ใช้งานยังไง', query: 'ระบบนี้ทำงานอย่างไร?' },
    { icon: HelpCircle, label: '💰 ราคา', query: 'ราคาเท่าไหร่?' }
  ],
  zh: [
    { icon: DollarSign, label: '📊 查看计划', query: '你们提供哪些订阅计划？' },
    { icon: Shield, label: '❓ 工作原理', query: '这是如何工作的？' },
    { icon: HelpCircle, label: '💰 价格', query: '价格是多少？' }
  ],
  ja: [
    { icon: DollarSign, label: '📊 プラン', query: 'どのようなサブスクリプションプランがありますか？' },
    { icon: Shield, label: '❓ 仕組み', query: 'これはどのように機能しますか？' },
    { icon: HelpCircle, label: '💰 料金', query: '料金はいくらですか？' }
  ],
  ko: [
    { icon: DollarSign, label: '📊 플랜 보기', query: '어떤 구독 플랜이 있나요?' },
    { icon: Shield, label: '❓ 작동 방식', query: '이것은 어떻게 작동하나요?' },
    { icon: HelpCircle, label: '💰 가격', query: '가격은 얼마인가요?' }
  ],
  ru: [
    { icon: DollarSign, label: '📊 Тарифы', query: 'Какие у вас подписки?' },
    { icon: Shield, label: '❓ Как работает', query: 'Как это работает?' },
    { icon: HelpCircle, label: '💰 Цены', query: 'Сколько это стоит?' }
  ]
};

export default function LisaEnhanced({ language = 'en', isDarkMode = false, isOpen: externalIsOpen = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferredLanguage, setUserPreferredLanguage] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync with external control
  useEffect(() => {
    setIsOpen(externalIsOpen);
  }, [externalIsOpen]);

  const colors = isDarkMode ? {
    bg: '#1F2937',
    cardBg: '#2A2D30',
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    borderColor: 'rgba(255,255,255,0.1)',
    inputBg: '#374151',
    lisaBubbleBg: '#374151',
    userBubbleBg: '#0C3B2E'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderColor: 'rgba(12,59,46,0.08)',
    inputBg: '#FFFFFF',
    lisaBubbleBg: '#F0FDF4',
    userBubbleBg: '#0C3B2E'
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading) return;

    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      // Detect language switch requests
      const lowerText = textToSend.toLowerCase();
      const languageSwitchPatterns = {
        th: /speak.*thai|switch.*thai|thai.*please|ภาษาไทย/i,
        en: /speak.*english|switch.*english|english.*please/i,
        ja: /speak.*japanese|switch.*japanese|japanese.*please|日本語/i,
        ko: /speak.*korean|switch.*korean|korean.*please|한국어/i,
        zh: /speak.*chinese|switch.*chinese|chinese.*please|中文/i,
        ru: /speak.*russian|switch.*russian|russian.*please|русский/i
      };

      for (const [lang, pattern] of Object.entries(languageSwitchPatterns)) {
        if (pattern.test(lowerText)) {
          setUserPreferredLanguage(lang);
          break;
        }
      }

      // Determine response language: user preference > app language > English
      const responseLanguage = userPreferredLanguage || language || 'en';
      
      const languageMap = {
        en: 'English',
        th: 'Thai',
        ja: 'Japanese',
        ko: 'Korean',
        zh: 'Chinese',
        ru: 'Russian'
      };

      const languageInstruction = `\n\nCRITICAL: Respond in ${languageMap[responseLanguage]} ONLY. Do not switch languages unless the user explicitly requests it.`;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LISA_SYSTEM_PROMPT}${languageInstruction}\n\nUser question: ${textToSend}`,
        add_context_from_internet: false
      });

      const fallbackMessages = {
        en: 'I apologize, I encountered an error. Please try again or contact support@leaseshield.asia',
        th: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือติดต่อ support@leaseshield.asia',
        zh: '抱歉，我遇到了错误。请重试或联系 support@leaseshield.asia',
        ja: '申し訳ありません。エラーが発生しました。再試行するか、support@leaseshield.asia までお問い合わせください。',
        ko: '죄송합니다. 오류가 발생했습니다. 다시 시도하거나 support@leaseshield.asia로 문의하세요.',
        ru: 'Извините, произошла ошибка. Попробуйте снова или свяжитесь с support@leaseshield.asia'
      };

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response || fallbackMessages[responseLanguage] || fallbackMessages.en,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Lisa error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'th' 
          ? 'ขออภัย เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือติดต่อ support@leaseshield.asia'
          : language === 'zh'
            ? '抱歉，发生错误。请重试或联系 support@leaseshield.asia'
            : language === 'ja'
              ? '申し訳ありません。エラーが発生しました。再試行するか、support@leaseshield.asia までお問い合わせください。'
              : language === 'ko'
                ? '죄송합니다. 오류가 발생했습니다. 다시 시도하거나 support@leaseshield.asia로 문의하세요.'
                : language === 'ru'
                  ? 'Извините, произошла ошибка. Попробуйте снова или свяжитесь с support@leaseshield.asia'
                  : 'Sorry, an error occurred. Please try again or contact support@leaseshield.asia',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (query) => {
    handleSend(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setMessages([]);
    setInputValue('');
    if (onClose) onClose();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Don't render anything if not open or minimized
  if (!isOpen && !isMinimized) {
    return null;
  }

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            padding: '12px 20px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #0C3B2E 0%, #0F5A45 100%)',
            border: '2px solid #C7A338',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(12,59,46,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Lisa</span>
          {messages.length > 0 && (
            <span style={{
              background: '#EF4444',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <Card
      className="lisa-chat-window"
      style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)',
        height: '600px',
        maxHeight: 'calc(100vh - 150px)',
        zIndex: 1000,
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        animation: 'lisaSlideIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes lisaSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes typingDots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #063F2C 0%, #0F5A45 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(207,175,106,0.3)'
        }}
      >
        <div className="flex items-center gap-3">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #CFAF6A 0%, #D9BC7E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base">Lisa</p>
            <div className="flex items-center gap-1.5">
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 4px #10B981'
              }} />
              <p className="text-xs text-white/80">
                {language === 'th' ? 'ออนไลน์' : language === 'zh' ? '在线' : language === 'ja' ? 'オンライン' : language === 'ko' ? '온라인' : language === 'ru' ? 'Онлайн' : 'Online'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            aria-label="Minimize"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB'
      }}>
        {messages.length === 0 ? (
          <div className="text-center" style={{ marginTop: '60px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #063F2C 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(12,59,46,0.2)'
            }}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: colors.textPrimary }}>
              {language === 'th' ? 'สวัสดี! ฉันคือ Lisa 👋' : language === 'zh' ? '你好！我是Lisa 👋' : language === 'ja' ? 'こんにちは！Lisaです 👋' : language === 'ko' ? '안녕하세요! Lisa입니다 👋' : language === 'ru' ? 'Привет! Я Lisa 👋' : 'Hi! I\'m Lisa 👋'}
            </p>
            <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'ผู้ช่วยของคุณสำหรับคำถามเกี่ยวกับการป้องกันสิทธิ์การเช่า' : language === 'zh' ? '您的租赁保护助手' : language === 'ja' ? '賃貸保護のアシスタント' : language === 'ko' ? '임대 보호 도우미' : language === 'ru' ? 'Ваш помощник по защите аренды' : 'Your rental protection assistant'}
            </p>
            
            {/* Quick Reply Buttons */}
            <div className="flex flex-col gap-2 px-4">
              {(QUICK_REPLIES[userPreferredLanguage || language] || QUICK_REPLIES.en).map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickReply(reply.query)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${colors.borderColor}`,
                    backgroundColor: 'transparent',
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#063F2C';
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F0FDF4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {reply.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: msg.role === 'user' ? colors.userBubbleBg : colors.lisaBubbleBg,
                    color: msg.role === 'user' ? '#FFFFFF' : colors.textPrimary,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderLeft: msg.role === 'assistant' ? '3px solid #10B981' : 'none'
                  }}
                >
                  {msg.content}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: colors.textSecondary,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingLeft: msg.role === 'assistant' ? '4px' : '0',
                  paddingRight: msg.role === 'user' ? '4px' : '0'
                }}>
                  {msg.timestamp && formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: colors.lisaBubbleBg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderLeft: '3px solid #10B981'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#063F2C',
                          animation: `typingBounce 1.4s infinite ease-in-out`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    {language === 'th' ? 'Lisa กำลังพิมพ์' : language === 'zh' ? 'Lisa正在输入' : language === 'ja' ? 'Lisaが入力中' : language === 'ko' ? 'Lisa가 입력 중' : language === 'ru' ? 'Lisa печатает' : 'Lisa is typing'}
                  </span>
                </div>
                <style>{`
                  @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                  }
                `}</style>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${colors.borderColor}`,
        backgroundColor: colors.cardBg
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
              color: colors.textPrimary,
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '12px'
            }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              backgroundColor: '#063F2C',
              color: '#FFFFFF',
              minWidth: '48px',
              height: '48px',
              borderRadius: '12px',
              padding: '0'
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}