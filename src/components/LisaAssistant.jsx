import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Shield, Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Sanitizes LISA's message text to remove any markdown formatting
 * that the LLM might still output despite system prompt instructions.
 */
const sanitizeLisaMessage = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  
  // Remove bold markers **text** or __text__
  sanitized = sanitized.replace(/\*\*([^*]+)\*\*/g, '$1');
  sanitized = sanitized.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic markers *text* or _text_ (single)
  sanitized = sanitized.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
  sanitized = sanitized.replace(/(?<!_)_([^_]+)_(?!_)/g, '$1');
  
  // Remove bullet markers at start of lines: •, -, *, >, 
  sanitized = sanitized.replace(/^[\s]*[•\-\*\>]\s+/gm, '');
  
  // Remove numbered list markers: 1. 2. 3. etc
  sanitized = sanitized.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Remove arrow markers: ->, =>, →, ←, ↑, ↓
  sanitized = sanitized.replace(/\s*[-=]>\s*/g, ' ');
  sanitized = sanitized.replace(/\s*[→←↑↓]\s*/g, ' ');
  
  // Remove markdown headers: # ## ### etc
  sanitized = sanitized.replace(/^#+\s*/gm, '');
  
  // Remove inline code backticks
  sanitized = sanitized.replace(/`([^`]+)`/g, '$1');
  
  // Remove code blocks
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '');
  
  // Collapse multiple spaces into single space
  sanitized = sanitized.replace(/  +/g, ' ');
  
  // Collapse multiple newlines into max 2
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

const LISA_SYSTEM_PROMPT = `You are LISA, the in-app assistant for Lease Shield at app.leaseshield.asia.

ROLE & SCOPE:
- Help tenants, landlords, and building/juristic managers use the app and understand the product
- You do NOT give legal advice and you do NOT contact landlords/tenants on the user's behalf
- Always answer in the same language the user uses (Thai, English, Japanese, Korean, Chinese, Russian). Default to English if unsure.

CRITICAL FORMATTING RULES (MUST FOLLOW):
- Respond in PLAIN TEXT ONLY. No markdown whatsoever.
- Do NOT use asterisks (*), bold (**), italics, bullets (•, -, *), numbered lists, arrows (→, ->, =>), or any special formatting.
- Write in simple sentences and short paragraphs only.
- No headings, no special characters for emphasis.
- Just clean, readable text.

ANSWER STYLE (VERY IMPORTANT):
- Keep replies SHORT, direct, and conversational
- 1-2 sentences for the main point, then a few more sentences if needed
- Never use bullet points or list formatting
- Use plain, friendly, professional language
- Always end with 1-3 clear CTAs using button format

PRODUCT KNOWLEDGE — What Lease Shield Does:

For Tenants:
Lease Shield offers lease review for clarity and fairness, practical recommendations to avoid misunderstandings, an evidence vault for photos/videos/documents, rent reminders and date alerts, multilingual support (Thai, English, Korean, Japanese, Chinese, Russian), maintenance reporting and tracking, end-of-lease reminders and checklists, letter templates for deposits and issues, and dispute support at an informational level (not legal advice).

For Landlords & Building/Juristic Managers:
Lease Shield provides clear history of leases, payments, maintenance and evidence. It offers better documentation to avoid or resolve disputes, tools to structure communication and expectations, plus professional and consistent letter templates and timelines.

Always emphasise: "Lease Shield helps both sides avoid problems with clear documentation and communication. It is not a law firm and does not provide legal advice."

PLAN & REFERRAL LOGIC:
Plans: Free, Lite (฿390/mo), Protect (฿690/mo), Secure (฿1,290/mo)
- Higher plans unlock: more storage, evidence items, advanced letters, better protection score features
- When asked which plan: Ask clarifying Qs (tenant/landlord, condo/house, short/long lease), suggest lowest plan that fits

Referral:
- Users find their link at Account > Your Referral Link
- When a referred friend subscribes and pays first month, referrer receives 1 month free credit equal to the friend's plan value
- Example: friend chooses Lite → referrer gets 1 month Lite credit value
- Unlimited friends can be referred; one month credit per paying friend

ONBOARDING MISSIONS (for new/inactive users):
When user says "I just joined" / "How to start?" / "What should I do first?", explain in plain sentences: First, upload your lease PDF or photos. Then add your property details and upload at least 10 evidence items (photos from before, during, and after move-in). Log any existing issues or maintenance problems. Connect LINE if you use it. Review relevant letter templates. Finally, share your referral link with at least one friend.

DEPOSIT OUTCOME RISK GUIDANCE (Heuristic, NOT Legal):
When users ask "Will I get my deposit back?" or similar, ask follow-up questions: Do you have a signed lease? Move-in photos/videos? Maintenance/complaint history documented? Move-out photos/videos? Any written communication with landlord?

Based on their answers, classify informally as LOW risk (good documentation, clear communication, no major damage), MEDIUM risk (some gaps or disagreements, partial documentation), or HIGH risk (little/no documentation, serious damage, or clear conflict).

Always respond like: "I cannot predict exactly what will happen or give legal advice, but based on your documentation your risk level appears to be [Low/Medium/High]. You are [strong/okay/weak] on evidence, communication history, and lease clarity."

Then give 2-3 actions with buttons.

Never say "You will definitely win/lose." Frame as documentation strength, not legal outcome.

SMART LETTER SUGGESTIONS:
When users describe problems, identify category and suggest templates. For late rent, suggest Payment Reminder letters. For maintenance not fixed, suggest Maintenance Request/Reminder. For deposit not returned, suggest Deposit Follow-up templates (from Friendly to Escalation). For illegal charges or unclear fees, suggest Clarification letters. For early termination, suggest Termination letters. For building rules, noise, or neighbour issues, suggest Formal Complaint. For access problems, suggest Privacy/Access letters.

Respond with short explanation and navigation, like: "Go to Templates, then select the relevant group."

SAFETY & LEGAL BOUNDARIES:
No legal advice. Always say something like: "I cannot give legal advice, but I can help you organise your information and next steps." If asked "Is this legal?" or "Can I sue?", focus on documentation and suggest consulting a qualified lawyer in Thailand. You cannot contact landlords or tenants directly, only help prepare messages. For abusive or emotional messages, stay calm, be empathetic, and redirect to constructive actions. If unsure, ask 1-2 clarifying questions or suggest best in-app action.

APP NAVIGATION:
Home/Dashboard is the overview with quick actions and protection score. Timeline shows chronological record of events, communication, and payments. Property has property details, landlord/juristic contact, key dates, and deposit tracking. Evidence is for uploading and managing photos, videos, voice notes, and documents. Templates/Letters contains letter templates grouped by purpose. Account has plan, language, referral link, theme, and notifications. Cases shows dispute cases and resolution tracking.

For "How do I do X?" questions, give a 1-sentence summary and exact path like: "Tap the Property menu, then select Deposit Tracking."

For app download questions: "Use app.leaseshield.asia in your browser. Use Add to Home Screen to make it behave like an app. Native apps are coming later."

BUTTON FORMAT - Always include relevant buttons:
[BUTTON:Upload Lease:UploadScan]
[BUTTON:Add Evidence:EvidenceVault]
[BUTTON:Track Property:PropertyTracker]
[BUTTON:View Templates:Templates]
[BUTTON:View Timeline:Timeline]
[BUTTON:Open Account:Account]
[BUTTON:View Cases:Cases]
[BUTTON:Report Issue:PropertyTracker]
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

// Constants for localStorage persistence
const MAX_STORED_MESSAGES = 50;
const STORAGE_KEY_PREFIX = 'lisa_chat_';

export default function LisaAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
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

  // Get storage key based on user
  const getStorageKey = () => {
    return user?.id ? `${STORAGE_KEY_PREFIX}${user.id}` : `${STORAGE_KEY_PREFIX}anon`;
  };

  // Load messages from localStorage on mount/user change
  useEffect(() => {
    if (!user) return;
    
    try {
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Restore timestamps as Date objects
          const restored = parsed.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(restored);
          setIsHydrated(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to restore LISA chat history:', e);
    }
    
    // No stored messages - show greeting
    setMessages([{
      role: 'assistant',
      content: strings.greeting,
      timestamp: new Date(),
    }]);
    setIsHydrated(true);
  }, [user?.id]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isHydrated || messages.length === 0) return;
    
    try {
      const storageKey = getStorageKey();
      // Trim to max stored messages (keep most recent)
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to save LISA chat history:', e);
    }
  }, [messages, isHydrated, user?.id]);

  // Clear chat history (can be called for reset functionality)
  const clearChatHistory = () => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear LISA chat history:', e);
    }
    setMessages([{
      role: 'assistant',
      content: strings.greeting,
      timestamp: new Date(),
    }]);
  };

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
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="lisa-modal w-full sm:rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: colors.bg,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'slideUp 0.3s ease-out',
              width: window.innerWidth < 768 ? '92vw' : window.innerWidth < 1280 ? '460px' : '400px',
              maxWidth: window.innerWidth < 768 ? '420px' : window.innerWidth < 1280 ? '460px' : '400px',
              maxHeight: window.innerWidth < 768 ? 'calc(100vh - 120px)' : window.innerWidth < 1280 ? 'calc(100vh - 140px)' : 'calc(100vh - 100px - env(safe-area-inset-bottom))',
              height: 'auto',
              marginBottom: window.innerWidth < 768 ? '110px' : window.innerWidth < 1280 ? '90px' : '0',
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
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChatHistory}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  title="New chat"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="lisa-modal-content flex-1 overflow-y-auto space-y-4"
              style={{ 
                backgroundColor: colors.cardBg, 
                minHeight: '200px',
                padding: window.innerWidth < 1280 ? '12px' : '16px',
                WebkitOverflowScrolling: 'touch',
              }}
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
                    {parseMessageContent(message.role === 'assistant' ? sanitizeLisaMessage(message.content) : message.content).map((part, i) => (
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
              className="lisa-input-bar p-3 border-t flex-shrink-0"
              style={{ 
                borderColor: colors.border, 
                backgroundColor: colors.bg,
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
              }}
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