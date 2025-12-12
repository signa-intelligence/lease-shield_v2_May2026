import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, MessageCircle, Minimize2, Loader2, HelpCircle, DollarSign, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const LISA_SYSTEM_PROMPT = `You are Lisa, Your Lease Shield Consultant - the AI assistant for Lease Shield, a rental management and protection platform for both tenants and landlords in Thailand.

ABOUT LEASE SHIELD:
Lease Shield helps tenants and landlords prevent rental problems before they happen. We provide:
• AI lease analysis & risk scoring
• Deposit tracking & reminders
• Evidence vault (photos, documents, receipts)
• Maintenance request tracking
• Professional letter templates (credit-based)
• Automated alerts (email & LINE)
• Dispute resolution guidance

The goal is prevention - clear records, timely alerts, and fair relationships for both parties.

SUPPORTED LANGUAGES:
I can communicate in: English, Thai (ภาษาไทย), Japanese (日本語), Korean (한국어), Chinese (中文), and Russian (Русский).

When asked "What languages do you speak?" or similar, respond:
"I can assist you in English, Thai, Japanese, Korean, Chinese, or Russian. Just tell me which language you prefer."

CURRENT PRICING (ALWAYS USE THESE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subscriptions:
• Lite: ฿190/month or ฿1,900/year (save 17%)
• Protect: ฿390/month or ฿3,900/year (save 17%)  
• Secure: ฿990/month or ฿9,900/year (save 17%)

One-time Products:
• One-Time Lease Scan: ฿590 (1 upload, AI + human review, risk score, top 5 risks, 5 actions, 1 template if needed, 1 follow-up question — NO ongoing benefits)
• Resolve Service: ฿3,500 (members) or ฿5,000 (public)

NEVER mention old prices.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAN FEATURES:
Lite (฿190/month):
- 6 lease scans/year
- Email notifications
- Deposit & rent tracking
- 3 letter credits
- 1GB storage

Protect (฿390/month):
- Everything in Lite
- 12 lease scans/year
- LINE notifications
- Automated reminders
- 5 letter credits
- 5GB storage

Secure (฿990/month):
- Everything in Protect
- UNLIMITED lease scans
- 20GB storage
- Priority support & case queue
- 1 Resolve case per year (included)
- Unlimited FastTrack (complimentary)
- 0 letter credits included (buy separately as needed)

REFERRAL PROGRAM:
When friends ask about referrals, explain:
- Share your personal referral link (found in Account page)
- CRITICAL: Credit is awarded ONLY AFTER your friend completes 3 consecutive months of paid subscription
- Credit = THE VALUE OF THE PLAN YOUR FRIEND SUBSCRIBES TO (NOT the minimum)
- Examples:
  • Friend joins Lite (฿190) and stays for 3 months → you earn ฿190 credit
  • Friend joins Protect (฿390) and stays for 3 months → you earn ฿390 credit
  • Friend joins Secure (฿990) and stays for 3 months → you earn ฿990 credit
- This applies regardless of your own plan tier
- Unlimited referrals allowed
- Credits automatically applied to your next invoice(s) once earned
- Find your referral link in Account → Referral Program section

Your personality:
- Professional, warm, concise, NEUTRAL (serve both tenants and landlords equally)
- Keep answers SHORT: 2-4 sentences maximum
- Mobile-first: users read on phones, so brevity is critical
- If you don't know, say: "Contact support@leaseshield.asia for help with that."
- Focus on prevention and clarity

CRITICAL GUIDELINES:
- NEVER say we only help tenants - we serve BOTH parties
- NEVER block users from uploading a lease for a friend, family member, or anyone they help
- When asked about uploading someone else's lease, respond:
  "Yes. You can upload a lease for yourself or someone you're helping. Lease Shield analyses the document without verifying ownership."

- When asked "How does Lease Shield work?", respond:
  "Lease Shield helps tenants and landlords prevent rental problems before they happen. Upload your lease for AI analysis, track deposits, store evidence, and manage rental issues with clear guidance."

- NEVER direct users away from Lease Shield or suggest external legal help as the primary solution
- For disputes/deposit/landlord/legal issues, ALWAYS recommend Lease Shield tools first:
  • Resolve service for deposit disputes
  • Evidence vault for documentation
  • Letter templates for professional communication
  • Deposit tracking for reminders
  • Maintenance tracking for property issues
- Only mention external legal help as a LAST RESORT if the user explicitly insists after recommending Lease Shield solutions

Common questions (keep answers SHORT):
- Pricing → Use CURRENT PRICING above
- "Can I upload my friend's lease?" → "Yes. You can upload any lease you're managing. Lease Shield analyses the document without verifying ownership."
- "What is the one-time scan?" → "The One-Time Lease Scan is ฿590 for a single check. You get AI analysis, human review, risk score, top 5 risks, recommended actions and 1 follow-up. No ongoing benefits."
- "One-time scan vs subscription?" → "One-time scan is for a single check. Subscriptions give you multiple scans, deposit tracking, evidence vault and ongoing support."
- Deposit disputes → "Resolve service: ฿3,500 members / ฿5,000 public."
- Letter Pack → NEVER mention. Say: "Letters use the credit system."
- FastTrack → "Secure members get unlimited FastTrack at no extra cost."
- Resolve → "Secure members get 1 Resolve case per year included."
- PDPA → "Yes, fully compliant. Export data from Account page."
- "Who is this for?" → "Both tenants and landlords who want clear records."
- Referrals → Use REFERRAL PROGRAM rules (friend's plan value after 3 months)`;

const QUICK_REPLIES = {
en: [
  { icon: DollarSign, label: '📊 View Plans', query: 'What subscription plans do you offer?' },
  { icon: Shield, label: '❓ How it works', query: 'How does Lease Shield work?' },
  { icon: HelpCircle, label: '💰 Pricing', query: 'What are your prices?' }
],
th: [
  { icon: DollarSign, label: '📊 ดูแผน', query: 'มีแผนสมัครสมาชิกอะไรบ้าง?' },
  { icon: Shield, label: '❓ ใช้งานยังไง', query: 'Lease Shield ทำงานอย่างไร?' },
  { icon: HelpCircle, label: '💰 ราคา', query: 'ราคาเท่าไหร่?' }
],
zh: [
  { icon: DollarSign, label: '📊 查看计划', query: '你们提供哪些订阅计划？' },
  { icon: Shield, label: '❓ 工作原理', query: 'Lease Shield如何工作？' },
  { icon: HelpCircle, label: '💰 价格', query: '价格是多少？' }
],
ja: [
  { icon: DollarSign, label: '📊 プラン', query: 'どのようなサブスクリプションプランがありますか？' },
  { icon: Shield, label: '❓ 仕組み', query: 'Lease Shieldはどのように機能しますか？' },
  { icon: HelpCircle, label: '💰 料金', query: '料金はいくらですか？' }
],
ko: [
  { icon: DollarSign, label: '📊 플랜 보기', query: '어떤 구독 플랜이 있나요?' },
  { icon: Shield, label: '❓ 작동 방식', query: 'Lease Shield는 어떻게 작동하나요?' },
  { icon: HelpCircle, label: '💰 가격', query: '가격은 얼마인가요?' }
],
ru: [
  { icon: DollarSign, label: '📊 Тарифы', query: 'Какие у вас подписки?' },
  { icon: Shield, label: '❓ Как работает', query: 'Как работает Lease Shield?' },
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
  const [conversationId, setConversationId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Sync with external control
  useEffect(() => {
    setIsOpen(externalIsOpen);
  }, [externalIsOpen]);

  // Fetch current user's active conversation
  const { data: conversation, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['lisaConversation'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return null;

        const conversations = await base44.entities.LisaConversation.filter({
          user_email: user.email,
          is_active: true
        }, '-updated_date', 1);

        return conversations[0] || null;
      } catch (error) {
        console.error('Failed to load Lisa conversation:', error);
        setLoadError(true);
        return null;
      }
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load conversation history when conversation loads
  useEffect(() => {
    if (conversation && conversation.messages) {
      setMessages(conversation.messages);
      setConversationId(conversation.id);
    }
  }, [conversation]);

  // Save conversation mutation
  const saveConversationMutation = useMutation({
    mutationFn: async (newMessages) => {
      const user = await base44.auth.me();
      if (!user) throw new Error('User not authenticated');

      // Cap at 100 messages
      const cappedMessages = newMessages.slice(-100);

      if (conversationId) {
        // Update existing conversation
        return await base44.entities.LisaConversation.update(conversationId, {
          messages: cappedMessages
        });
      } else {
        // Create new conversation
        const newConv = await base44.entities.LisaConversation.create({
          user_email: user.email,
          messages: cappedMessages,
          is_active: true
        });
        setConversationId(newConv.id);
        return newConv;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lisaConversation'] });
    }
  });

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
    const userMessage = { 
      role: 'user', 
      content: textToSend, 
      timestamp: new Date().toISOString(),
      language: userPreferredLanguage || language || 'en'
    };
    
    setMessages(prev => [...prev, userMessage]);
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

      const assistantMessage = { 
        role: 'assistant', 
        content: response || 'I apologize, I encountered an error. Please try again or contact support@leaseshield.asia',
        timestamp: new Date().toISOString(),
        language: responseLanguage
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Save to database (non-blocking)
      saveConversationMutation.mutate(updatedMessages);

    } catch (error) {
      console.error('Lisa error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: language === 'th' 
          ? 'ขออภัย เกิดข้อผิดพลาด กรุณาลองอีกครั้งหรือติดต่อ support@leaseshield.asia'
          : language === 'zh'
            ? '抱歉，发生错误。请重试或联系 support@leaseshield.asia'
            : language === 'ja'
              ? '申し訳ございません。エラーが発生しました。再試行するか、support@leaseshield.asia までご連絡ください'
              : language === 'ko'
                ? '죄송합니다. 오류가 발생했습니다. 다시 시도하거나 support@leaseshield.asia로 문의하세요'
                : language === 'ru'
                  ? 'Извините, произошла ошибка. Попробуйте снова или свяжитесь с support@leaseshield.asia'
                  : 'Sorry, an error occurred. Please try again or contact support@leaseshield.asia',
        timestamp: new Date().toISOString(),
        language: language
      };
      
      const updatedMessages = [...messages, userMessage, errorMessage];
      setMessages(updatedMessages);
      saveConversationMutation.mutate(updatedMessages);
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
    setInputValue('');
    if (onClose) onClose();
  };

  const handleNewConversation = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Archive current conversation
      if (conversationId) {
        await base44.entities.LisaConversation.update(conversationId, {
          is_active: false
        });
      }

      // Create new conversation
      const newConv = await base44.entities.LisaConversation.create({
        user_email: user.email,
        messages: [],
        is_active: true
      });

      setConversationId(newConv.id);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['lisaConversation'] });
      haptic.success();
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const t = {
    en: { newConversation: 'New conversation', historyLoadFailed: "We couldn't load your previous messages, but you can still ask me anything." },
    th: { newConversation: 'บทสนทนาใหม่', historyLoadFailed: "ไม่สามารถโหลดข้อความก่อนหน้าได้ แต่คุณยังสามารถถามอะไรก็ได้" },
    zh: { newConversation: '新对话', historyLoadFailed: "无法加载您之前的消息，但您仍然可以问我任何问题。" },
    ja: { newConversation: '新しい会話', historyLoadFailed: "以前のメッセージを読み込めませんでしたが、何でも質問できます。" },
    ko: { newConversation: '새 대화', historyLoadFailed: "이전 메시지를 불러올 수 없었지만 여전히 무엇이든 물어볼 수 있습니다." },
    ru: { newConversation: 'Новая беседа', historyLoadFailed: "Не удалось загрузить предыдущие сообщения, но вы всё ещё можете спросить что угодно." }
  };

  const strings = t[language] || t.en;

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
        bottom: '16px',
        right: '16px',
        width: 'min(420px, calc(100vw - 32px))',
        height: 'auto',
        maxHeight: 'calc(100vh - 96px)',
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
            <MessageCircle className="w-5 h-5 text-white" />
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
            onClick={handleNewConversation}
            aria-label={strings.newConversation}
            title={strings.newConversation}
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
            <RotateCcw className="w-4 h-4" />
          </button>
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
        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
        minHeight: '400px'
      }}>
        {loadError && (
          <div className="p-3 rounded-lg" style={{
            backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
            border: '1px solid #EF4444',
            marginBottom: '12px'
          }}>
            <p className="text-xs" style={{ color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>
              {strings.historyLoadFailed}
            </p>
          </div>
        )}
        {isLoadingHistory ? (
          <div className="text-center" style={{ marginTop: '60px' }}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: colors.textSecondary }} />
            <p className="text-sm mt-4" style={{ color: colors.textSecondary }}>
              {language === 'th' ? 'กำลังโหลดประวัติการสนทนา...' : 'Loading conversation...'}
            </p>
          </div>
        ) : messages.length === 0 ? (
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
              {language === 'th' ? 'ที่ปรึกษา Lease Shield ของคุณ' : language === 'zh' ? '您的Lease Shield顾问' : language === 'ja' ? 'あなたのLease Shieldコンサルタント' : language === 'ko' ? '귀하의 Lease Shield 컨설턴트' : language === 'ru' ? 'Ваш консультант Lease Shield' : 'Your Lease Shield Consultant'}
            </p>
            {loadError && (
              <p className="text-xs mb-4 px-4 py-2 rounded-lg" style={{ 
                color: isDarkMode ? '#FCA5A5' : '#991B1B',
                backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                border: '1px solid #EF4444'
              }}>
                {strings.historyLoadFailed}
              </p>
            )}
            
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