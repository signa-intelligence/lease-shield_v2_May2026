import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Shield, Loader2, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LISA_SYSTEM_PROMPT = `You are LISA, the official AI assistant for LeaseShield - a rental protection app for tenants in Thailand.

IDENTITY & TONE:
- Polite, efficient, zero fluff
- Give clear steps for renters, landlords, and building managers
- Never provide legal advice - always say "LeaseShield does not provide legal advice. Here's general guidance..."
- Respond in the user's language (detected from their app settings)

MARKETING KNOWLEDGE:
- LeaseShield protects tenants' rental rights through AI-powered lease scanning, deposit tracking, evidence vaults, and dispute resolution
- Plans: Free (basic), Lite (฿390/mo - 3 scans, email alerts), Protect (฿690/mo - 5 scans, LINE alerts, 3 letter credits), Secure (฿1,290/mo - unlimited scans, priority support, 5 letter credits)
- Protection Score: measures how well protected the user is based on documentation, active protections, and proactive actions
- Evidence Vault: secure storage for photos, videos, receipts, and documents related to rental
- Maintenance reporting: log issues, upload evidence, track landlord responses
- Deposit tracking: monitor return deadlines, get reminders
- Dispute resolution (Resolve): professional case handling starting at ฿4,500 (member) or ฿6,000 (public)
- Referral program: share your code, earn credits when friends subscribe

IN-APP KNOWLEDGE:
- Dashboard: overview of protection score, active leases, deposits, cases
- Evidence upload: photos, videos, receipts - organize by category
- Lease upload: scan contracts for risk analysis
- Maintenance timeline: track issue resolution progress
- Profile settings: language, notifications, LINE connection
- Letter templates: generate formal letters to landlords
- Rent tracking: set due dates, get reminders

SECURITY RULES:
- Only reference the current logged-in user's data
- Never access or infer other users' data
- If asked about landlord/juristic details: "For privacy reasons I can't access other people's information."
- If asked legal questions: "LeaseShield does not provide legal advice. Here's general guidance..."

When suggesting actions, include a button suggestion in this format:
[BUTTON:Label:PageName]

Examples:
[BUTTON:Upload Lease:UploadScan]
[BUTTON:Track Deposit:PropertyTracker]
[BUTTON:View Evidence:EvidenceVault]
[BUTTON:Report Issue:PropertyTracker]
[BUTTON:View Plans:Account]
[BUTTON:View Timeline:Timeline]
[BUTTON:Open Templates:Templates]
[BUTTON:View Cases:Cases]
`;

const TRANSLATIONS = {
  en: {
    title: 'LISA — LeaseShield Assistant',
    placeholder: 'Ask LISA...',
    greeting: "Hi! I'm LISA, your LeaseShield assistant. How can I help you today?",
    thinking: 'Thinking...',
    error: 'Sorry, I encountered an error. Please try again.',
  },
  th: {
    title: 'LISA — ผู้ช่วย LeaseShield',
    placeholder: 'ถาม LISA...',
    greeting: 'สวัสดี! ฉันคือ LISA ผู้ช่วย LeaseShield ของคุณ ฉันช่วยอะไรคุณได้บ้างวันนี้?',
    thinking: 'กำลังคิด...',
    error: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
  },
  zh: {
    title: 'LISA — LeaseShield 助手',
    placeholder: '问 LISA...',
    greeting: '你好！我是 LISA，您的 LeaseShield 助手。今天我能帮您什么？',
    thinking: '思考中...',
    error: '抱歉，遇到错误。请重试。',
  },
  ja: {
    title: 'LISA — LeaseShield アシスタント',
    placeholder: 'LISAに質問...',
    greeting: 'こんにちは！LeaseShieldアシスタントのLISAです。今日はどのようにお手伝いしましょうか？',
    thinking: '考え中...',
    error: '申し訳ありません、エラーが発生しました。もう一度お試しください。',
  },
  ko: {
    title: 'LISA — LeaseShield 어시스턴트',
    placeholder: 'LISA에게 질문...',
    greeting: '안녕하세요! LeaseShield 어시스턴트 LISA입니다. 오늘 무엇을 도와드릴까요?',
    thinking: '생각 중...',
    error: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
  },
  ru: {
    title: 'LISA — Ассистент LeaseShield',
    placeholder: 'Спросить LISA...',
    greeting: 'Привет! Я LISA, ваш ассистент LeaseShield. Чем могу помочь сегодня?',
    thinking: 'Думаю...',
    error: 'Извините, произошла ошибка. Пожалуйста, попробуйте снова.',
  },
};

export default function LisaAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const language = user?.language || 'en';
  const strings = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isDarkMode = user?.theme === 'dark';

  // Initialize greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: strings.greeting,
        timestamp: new Date(),
      }]);
    }
  }, [strings.greeting]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleButtonClick = (pageName) => {
    setIsOpen(false);
    navigate(createPageUrl(pageName));
  };

  const parseMessageContent = (content) => {
    const buttonRegex = /\[BUTTON:([^:]+):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = buttonRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'button', label: match[1], page: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const buildUserContext = () => {
    if (!user) return '';
    
    return `
USER CONTEXT (read-only, for personalization):
- Name: ${user.full_name || 'Not set'}
- Plan: ${user.plan_tier || 'free'}
- Language: ${language}
- Protection features: ${user.email_notifications ? 'Email alerts ON' : 'Email alerts OFF'}, ${user.line_notifications ? 'LINE alerts ON' : 'LINE alerts OFF'}
- Letter credits: ${user.letter_credits || 0}
- Reward balance: ฿${user.reward_credit_balance || 0}
`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const fullPrompt = `${LISA_SYSTEM_PROMPT}

${buildUserContext()}

CONVERSATION:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}
user: ${userMessage.content}

Respond in ${language === 'th' ? 'Thai' : language === 'zh' ? 'Chinese' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'ru' ? 'Russian' : 'English'}.
assistant:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('LISA error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: strings.error,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const colors = isDarkMode ? {
    bg: '#1F2937',
    cardBg: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: 'rgba(255,255,255,0.1)',
    inputBg: '#4B5563',
  } : {
    bg: '#FFFFFF',
    cardBg: '#F3F4F6',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: 'rgba(12,59,46,0.1)',
    inputBg: '#FFFFFF',
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 shadow-xl"
        style={{
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: '16px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
          border: '3px solid #C7A338',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px rgba(12,59,46,0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="w-full sm:w-[400px] sm:max-h-[600px] h-full sm:h-auto sm:rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: colors.bg,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)',
                borderBottom: '2px solid #C7A338',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{strings.title}</h3>
                  <p className="text-xs text-emerald-200">AI-Powered Support</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ backgroundColor: colors.cardBg, minHeight: '300px', maxHeight: 'calc(100vh - 200px)' }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: message.role === 'user' ? '#0C3B2E' : colors.bg,
                      color: message.role === 'user' ? '#FFFFFF' : colors.text,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {parseMessageContent(message.content).map((part, i) => (
                      part.type === 'button' ? (
                        <button
                          key={i}
                          onClick={() => handleButtonClick(part.page)}
                          className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm font-semibold"
                          style={{
                            backgroundColor: '#C7A338',
                            color: '#0C3B2E',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#D4B44A';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#C7A338';
                          }}
                        >
                          {part.label}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <span key={i} className="text-sm whitespace-pre-wrap">{part.content}</span>
                      )
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-3 flex items-center gap-2"
                    style={{ backgroundColor: colors.bg, color: colors.textSecondary }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{strings.thinking}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 border-t"
              style={{ borderColor: colors.border, backgroundColor: colors.bg }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={strings.placeholder}
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-4 py-3 text-sm"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    outline: 'none',
                    maxHeight: '120px',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #0C3B2E 0%, #047857 100%)'
                      : '#9CA3AF',
                    border: 'none',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}