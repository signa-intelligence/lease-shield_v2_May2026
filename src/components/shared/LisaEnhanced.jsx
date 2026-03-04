import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, MessageCircle, Minimize2, Loader2, HelpCircle, DollarSign, Shield, RotateCcw, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LISA_SYSTEM_PROMPT = `You are Lisa, LeaseShield's assistant and product guide. Your PRIMARY job is to help users USE LeaseShield's features to protect themselves — not just give generic advice.

# YOUR IDENTITY & MISSION

You are NOT a generic chatbot. You are LeaseShield's best salesperson and guide.
For EVERY question about renting, leases, deposits, landlords, or disputes:
1. Brief acknowledgment of the question
2. Recommend the SPECIFIC LeaseShield feature(s) that help
3. Explain HOW the feature solves their problem
4. Give a CLEAR call to action (what to click, where to go)
5. Offer to guide them through the next step

NEVER give generic advice without connecting it to a LeaseShield feature.

# FEATURE KNOWLEDGE

## 🔍 Lease Scanning (CORE FEATURE — always mention first for new users)
- Upload PDF or image of lease for AI analysis
- Identifies risks, unfair clauses, missing protections, deposit traps
- Generates protection score (0-100) with detailed risk breakdown
- Takes 2 minutes, could save thousands of baht
- Explorer tier: 1 free scan — perfect to start!
- Action: "Go to Scan page and upload your lease"

## 📂 Evidence Vault
- Secure, organized storage for rental documents, photos, videos
- Document property condition at move-in (crucial for deposit return)
- Organize by folders and rooms
- Storage: 100MB (Explorer), 1GB (Lite), 5GB (Protect), 20GB (Secure)
- Files stay private unless shared to a Resolve case
- Action: "Go to Evidence Vault and create a folder for your property"

## 💰 Deposit & Rent Tracking (Property Tracker)
- Track deposit amounts, payment dates, expected return dates
- Automatic alerts at key dates (30, 7, 3 days before deadlines)
- Track rent due dates with reminders
- Manage multiple properties in one place
- Action: "Go to Property Tracker and add your deposit details"

## 📅 Timeline
- Calendar view of ALL rental events: lease dates, deposits, rent, maintenance, cases
- Never miss a deadline or important date
- Action: "Check your Timeline to see upcoming events"

## 📝 Letter Templates (1 credit each)
- Professional, bilingual letters (English + Thai)
- Types: Pre-signing negotiation, maintenance request, deposit return, lease extension
- Checklists: Pre-signing inspection, move-in condition
- Action: "Go to Templates to find the right letter for your situation"

## 🛡️ Resolve Service (Professional dispute support)
- Public rate: ฿5,000 per case (no subscription needed)
- Member rate: ฿3,500 per case (Protect/Secure after 30 days)
- Includes: case assessment, strategy, customized letters, step-by-step guidance
- Standard review: 2-3 business days; Fast Track: 1 business day
- NOT a law firm — provides guidance and tools, user handles communications
- Action: "Go to Cases and submit a new case"

## Subscription Plans
- Explorer (Free): 1 lifetime scan, basic risk preview, 100MB storage
- Lite (฿190/month or ฿1,900/year): 6 scans/year, 3 letter credits, 1GB, email alerts, deposit tracker
- Protect (฿390/month or ฿3,900/year): 12 scans/year, 5 letter credits, 5GB, LINE alerts, rent reminders
- Secure (฿990/month or ฿9,900/year): 50 scans/year, 50 letter credits/year, 10 Fast Track/year, 20GB, priority queue, 1 free Resolve/year, premium support

# FEATURE RECOMMENDATION TRIGGERS

When user asks about → Recommend these features:

**LEASE / CONTRACT / AGREEMENT / SIGNING / RENTING:**
→ Primary: Lease Scanning ("Upload your lease for AI analysis — identifies risks before you sign")
→ Secondary: Letter Templates (pre-signing negotiation)
→ Action: "Want to start? Go to Scan and upload your lease!"

**DEPOSIT / SECURITY DEPOSIT / GETTING MONEY BACK:**
→ Primary: Evidence Vault ("Document property condition — crucial for deposit disputes")
→ Secondary: Deposit Tracker ("Track when your deposit is due back with automatic alerts")
→ Tertiary: Letter Templates (deposit return request)
→ Action: "First, make sure your property condition is documented in Evidence Vault"

**LANDLORD ISSUES / DISPUTES / PROBLEMS:**
→ Primary: Resolve Service ("Professional guidance for your situation")
→ Secondary: Letter Templates ("Send a formal, professional request")
→ Tertiary: Evidence Vault ("Build your evidence trail")
→ Action: "Start by documenting everything in Evidence Vault, then submit a Resolve case"

**MOVING IN / NEW RENTAL:**
→ Primary: Lease Scanning ("Scan your lease BEFORE signing")
→ Secondary: Evidence Vault ("Document everything on day one")
→ Tertiary: Deposit Tracker ("Set up tracking immediately")
→ Action: "Let's set up your complete protection: 1) Scan lease, 2) Photo everything, 3) Track deposit"

**MOVING OUT / LEAVING:**
→ Primary: Evidence Vault ("Compare move-in vs move-out photos")
→ Secondary: Letter Templates ("Professional deposit return letter")
→ Tertiary: Deposit Tracker ("Check when deposit is due back")
→ Action: "Take move-out photos now, then generate a deposit return letter"

**MAINTENANCE / REPAIRS / BROKEN THINGS:**
→ Primary: Maintenance Tracker ("Log the issue with date and photos")
→ Secondary: Letter Templates ("Send formal maintenance request")
→ Tertiary: Evidence Vault ("Store photos and videos as evidence")
→ Action: "Log this in Maintenance Tracker and send a formal request to your landlord"

**RENT / PAYMENT:**
→ Primary: Property Tracker ("Set up rent reminders so you never miss a payment")
→ Action: "Go to Property Tracker and set your rent due date"

**GENERAL RENTAL ADVICE / LEGAL QUESTIONS:**
→ Acknowledge question briefly, then LEAD with LeaseShield features
→ "I'm not a lawyer, but LeaseShield gives you the tools to handle this!"
→ Recommend 2-3 most relevant features with clear actions

# RESPONSE PATTERN (MANDATORY)

For EVERY response, follow this structure:

1. **Brief acknowledgment** (1 sentence max)
2. **Feature recommendation with emoji** (name the specific feature)
3. **How it helps** (concrete benefit, not vague)
4. **Clear action** ("Go to [page]", "Upload your lease", "Create a folder")
5. **Offer next step** ("Want me to walk you through it?")

STRONG example:
"Great question! Here's how LeaseShield helps with that:

🔍 LEASE SCANNING — Upload your lease and our AI identifies unfair clauses, missing protections, and deposit traps. Takes 2 minutes.

📂 EVIDENCE VAULT — Document your property condition with organized photos. This is your proof if disputes arise.

💰 DEPOSIT TRACKER — Set alerts so you know exactly when your deposit should be returned.

Ready to start? I recommend uploading your lease first — you get 1 free scan on Explorer tier!

Which would you like to do first?"

WEAK example (NEVER DO THIS):
"You should document the property condition and communicate with your landlord in writing."

# UPGRADE RECOMMENDATIONS

Only suggest upgrades when:
- User's current tier can't do what they need
- User asks about pricing/plans
- User hits a tier limit

Explorer user needing more:
"You're on Explorer with 1 free scan. For your situation, Lite (฿190/month or ฿1,900/year) gives you 6 scans/year, 3 letter credits, and 1GB storage — perfect for ongoing protection. Want to upgrade?"

Never suggest upgrades to Secure tier users (they have everything).

# CRITICAL LEGAL LANGUAGE RULES

🚫 NEVER SAY:
- "recover your deposit" / "deposit recovery" / "get your deposit back"
- "we recover" / "we'll get" / "help you get your deposit"
- Any guarantee of outcomes or results
- "negotiate on your behalf" / "we'll handle it for you"
- Long vague paragraphs without recommending features
- Generic advice without connecting to LeaseShield tools

✅ ALWAYS USE:
- "deposit disputes" or "deposit issues" (not "deposit recovery")
- "guide you through the process" / "support your efforts"
- "empower you to pursue" (not "recover for you")
- User handles communications — we provide guidance, strategy, templates

⚠️ MANDATORY DISCLAIMERS (when discussing Resolve or legal topics):
- "We're not a law firm and don't provide legal representation"
- "We cannot guarantee outcomes"
- "You handle communications with your landlord using our guidance"

# OTHER RULES

- Support email (support@leaseshield.asia): ONLY for technical bugs, login issues, billing errors
- File formats: PDF, PNG, JPG (no Word/DOC yet)
- Privacy: Files are private unless user submits to Resolve case
- Installation: Browser-based, can add to home screen
- Billing: Non-refundable, cancellation keeps access until period end
- Supported languages: English, Thai, Japanese, Korean, Chinese, Russian
- Be concise but ALWAYS product-focused
- Use emojis for feature headers (🔍📂💰📝🛡️📅)
- End responses with a call to action or "Which would you like to do first?"`;


const MAX_CHARS = 500;

export default function LisaEnhanced({ language = 'en', isDarkMode = false, isOpen: externalIsOpen = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPreferredLanguage, setUserPreferredLanguage] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [navigationError, setNavigationError] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch user context for tier-aware responses
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: storageInfo } = useQuery({
    queryKey: ['userStorage', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const storage = await base44.entities.UserStorage.filter({ user_email: user.email });
      return storage[0] || null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

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

  // CRITICAL: Load from localStorage FIRST when chat opens
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('lisa_chat_history');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[LISA] Restored chat history from localStorage:', parsed.length, 'messages');
            setMessages(parsed);
            return; // Skip database load
          }
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
      
      // Only load from database if localStorage is empty
      if (conversation && conversation.messages && conversation.messages.length > 0) {
        loadPreviousHistory(conversation);
      }
    }
  }, [isOpen, conversation]);

  // CRITICAL: Save to localStorage after EVERY message change
  useEffect(() => {
    if (messages.length > 0) {
      const last10 = messages.slice(-10);
      localStorage.setItem('lisa_chat_history', JSON.stringify(last10));
      console.log('[LISA] Saved', last10.length, 'messages to localStorage');
    }
  }, [messages]);

  const loadPreviousHistory = async (currentConv) => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // If current conversation has messages, just use them
      if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
        const recentMessages = currentConv.messages.slice(-10);
        
        setMessages([
          {
            role: 'assistant',
            content: language === 'th' 
              ? '💬 ดำเนินการสนทนาของเราต่อ...'
              : language === 'zh'
                ? '💬 继续我们的对话...'
                : language === 'ja'
                  ? '💬 会話を続けます...'
                  : language === 'ko'
                    ? '💬 대화를 계속합니다...'
                    : language === 'ru'
                      ? '💬 Продолжаем нашу беседу...'
                      : '💬 Continuing our conversation...',
            timestamp: new Date().toISOString(),
            isSystemMessage: true
          },
          ...recentMessages
        ]);
        setConversationId(currentConv.id);
      } else {
        // No current conversation, show welcome
        setMessages([]);
        setConversationId(currentConv ? currentConv.id : null);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setMessages([]);
    }
  };

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

  const categorizeQuestion = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('price') || q.includes('cost') || q.includes('plan')) return 'pricing';
    if (q.includes('scan') || q.includes('lease')) return 'lease_scanning';
    if (q.includes('deposit')) return 'deposits';
    if (q.includes('dispute') || q.includes('resolve')) return 'disputes';
    if (q.includes('support') || q.includes('help')) return 'support';
    if (q.includes('evidence') || q.includes('proof')) return 'evidence';
    if (q.includes('upgrade') || q.includes('payment')) return 'billing';
    
    return 'general';
  };

  const trackLisaInteraction = async (data) => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      await base44.entities.LisaAnalytics.create({
        user_email: user.email,
        question: data.question,
        response: data.response,
        session_id: sessionId,
        action_taken: data.action,
        user_plan_tier: user.plan_tier || 'free',
        response_time_ms: data.responseTime,
        category: categorizeQuestion(data.question)
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const trackQuickAction = (actionId) => {
    trackLisaInteraction({
      question: 'Quick action clicked',
      response: `User clicked: ${actionId}`,
      action: `quick_action_${actionId}`,
      responseTime: 0
    });
  };

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading || textToSend.length > MAX_CHARS) return;

    const startTime = Date.now();
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
      
      // Build user context for tier-aware responses
      const userTier = user?.plan_tier || 'free';
      const availableScans = user?.available_scans || 0;
      const storageUsedMB = storageInfo ? Math.round(storageInfo.total_bytes / (1024 * 1024)) : 0;
      const storageLimitMB = storageInfo ? Math.round(storageInfo.tier_limit_bytes / (1024 * 1024)) : 100;
      
      const tierCapabilities = {
        free: 'Preview scan only (top 5 risks summary), 100MB storage, public case pricing (฿5,000)',
        lite: 'Full scans with top 5 clause analysis, 1GB storage, 6 scans/year, 3 letter credits, deposit tracking, timeline, property tracker, member case pricing (฿3,500 after 30 days)',
        protect: 'Full scans with ALL clause analysis, 5GB storage, 12 scans/year, 5 letter credits, all Lite features, LINE notifications, member case pricing (฿3,500 after 30 days)',
        secure: 'All Protect features, 20GB storage, 50 scans/year, 50 letter credits/year, 10 Fast Track cases/year, priority queue, 1 free Resolve case/year (Annual only), premium support'
      };

      const userContext = `\n\nCURRENT USER CONTEXT:
- Subscription Tier: ${userTier.toUpperCase()}
- Available Scans: ${availableScans}
- Storage Used: ${storageUsedMB}MB / ${storageLimitMB}MB
- Tier Capabilities: ${tierCapabilities[userTier] || tierCapabilities.free}

IMPORTANT:
- Provide tier-appropriate advice
- Explain limitations based on current tier
- If user is on Secure tier: NEVER suggest upgrades (they're on the top tier already)
- If user is on Free/Lite/Protect: Only suggest upgrades when relevant to their question
- Don't be pushy about upgrades
- Be helpful within current tier constraints
- When discussing features, acknowledge what user already has on their current tier

SECURE TIER USERS:
- Already have all features (50 scans/year, 50 letters/year, 10 Fast Track/year, 20GB storage, priority queue, etc.)
- Never suggest upgrades
- Focus on helping them use existing features
- Can mention Annual benefits (1 free Resolve case/year) if they're on Monthly
- Secure tier has fair usage policies to maintain service quality. The annual allowances support consistent use throughout the subscription.
- If asked about monthly limits: "Secure tier has fair usage policies to maintain service quality. The annual allowances (50 scans, 50 letters, 10 Fast Track) support consistent use throughout your subscription."`;
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LISA_SYSTEM_PROMPT}${userContext}${languageInstruction}\n\nUser question: ${textToSend}`,
        add_context_from_internet: false
      });

      const responseTime = Date.now() - startTime;
      const assistantMessage = { 
        role: 'assistant', 
        content: response || 'I apologize, I encountered an error. Please try again or contact support@leaseshield.asia',
        timestamp: new Date().toISOString(),
        language: responseLanguage
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Track the interaction
      trackLisaInteraction({
        question: textToSend,
        response: response,
        action: 'message_sent',
        responseTime: responseTime
      });

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
    // Don't clear localStorage - let chat history persist across sessions
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
      localStorage.removeItem('lisa_chat_history'); // Clear localStorage for new conversation
      queryClient.invalidateQueries({ queryKey: ['lisaConversation'] });
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

  const handleNavigate = (route) => {
    try {
      setNavigationError(false);
      navigate(createPageUrl(route));
      handleClose();
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigationError(true);
    }
  };

  const detectActionButtons = (content) => {
    // Detect if message mentions both Resolve and upgrade/plan
    const mentionsResolve = /resolve service|resolve case|dispute resolution/i.test(content);
    const mentionsUpgrade = /upgrade|paid plan|member|subscription/i.test(content);
    
    return mentionsResolve && mentionsUpgrade;
  };

  const stripMarkdownLinks = (text) => {
    // Remove markdown links [text](url) or [text](#)
    return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
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
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-base">Lisa</p>
              {user && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: user.plan_tier === 'secure' ? '#C7A338' : user.plan_tier === 'protect' ? '#10B981' : user.plan_tier === 'lite' ? '#3B82F6' : '#6B7280',
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {user.plan_tier || 'FREE'}
                </span>
              )}
            </div>
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
            <p className="text-base font-semibold mb-2" style={{ color: colors.textPrimary, lineHeight: '1.4' }}>
              {language === 'th' 
                ? 'สวัสดี ฉันคือ Lisa — ผู้ช่วย Lease Shield ของคุณ'
                : language === 'zh'
                  ? '你好，我是Lisa — 您的Lease Shield助手'
                  : language === 'ja'
                    ? 'こんにちは、Lisaです — あなたのLease Shieldアシスタント'
                    : language === 'ko'
                      ? '안녕하세요, Lisa입니다 — 귀하의 Lease Shield 어시스턴트'
                      : language === 'ru'
                        ? 'Привет, я Lisa — ваш помощник Lease Shield'
                        : 'Hi, I\'m Lisa — your Lease Shield assistant'}
            </p>
            <p className="text-sm px-6" style={{ color: colors.textSecondary, lineHeight: '1.5' }}>
              {language === 'th'
                ? 'บอกฉันว่าเกิดอะไรขึ้น แล้วฉันจะแนะนำขั้นตอนถัดไปที่ดีที่สุดให้'
                : language === 'zh'
                  ? '告诉我发生了什么，我会为您指引最佳的下一步'
                  : language === 'ja'
                    ? '何が起きているか教えてください。最適な次のステップをご案内します'
                    : language === 'ko'
                      ? '무슨 일이 있는지 말씀해 주세요. 최선의 다음 단계를 안내해 드리겠습니다'
                      : language === 'ru'
                        ? 'Расскажите, что происходит, и я подскажу лучший следующий шаг'
                        : 'Tell me what\'s going on and I\'ll guide you to the best next step'}
            </p>
            {loadError && (
              <p className="text-xs mt-4 px-4 py-2 rounded-lg mx-4" style={{ 
                color: isDarkMode ? '#FCA5A5' : '#991B1B',
                backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                border: '1px solid #EF4444'
              }}>
                {strings.historyLoadFailed}
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const shouldShowActions = msg.role === 'assistant' && detectActionButtons(msg.content);
              const cleanContent = msg.role === 'assistant' ? stripMarkdownLinks(msg.content) : msg.content;
              
              return (
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
                      borderLeft: msg.role === 'assistant' ? '3px solid #10B981' : 'none',
                      opacity: msg.isSystemMessage ? 0.7 : 1,
                      fontStyle: msg.isSystemMessage ? 'italic' : 'normal'
                    }}
                  >
                    {cleanContent}
                  </div>
                  
                  {shouldShowActions && !navigationError && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => { 
                          navigate(createPageUrl('Account') + '#pricing'); 
                          handleClose(); 
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(12,59,46,0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#084D38';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0C3B2E';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                        {language === 'th' ? 'อัปเกรดแผน' : language === 'zh' ? '升级计划' : language === 'ja' ? 'プランをアップグレード' : language === 'ko' ? '플랜 업그레이드' : language === 'ru' ? 'Обновить план' : 'Upgrade Plan'}
                      </button>
                      <button
                        onClick={() => handleNavigate('ResolveCase')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
                          color: colors.textPrimary,
                          border: `2px solid ${colors.borderColor}`,
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#4B5563' : '#E5E7EB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#F3F4F6';
                        }}
                      >
                        <Shield className="w-4 h-4" />
                        {language === 'th' ? 'เปิด Resolve' : language === 'zh' ? '打开Resolve' : language === 'ja' ? 'Resolveを開く' : language === 'ko' ? 'Resolve 열기' : language === 'ru' ? 'Открыть Resolve' : 'Open Resolve'}
                      </button>
                    </div>
                  )}

                  {shouldShowActions && navigationError && (
                    <div style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                      border: '1px solid #EF4444'
                    }}>
                      <p style={{ fontSize: '12px', color: isDarkMode ? '#FCA5A5' : '#991B1B', marginBottom: '8px' }}>
                        {language === 'th' ? 'ไม่สามารถนำทางได้ กรุณาไปที่หน้าบัญชี' : 'Navigation failed. Please go to Account page.'}
                      </p>
                      <button
                        onClick={() => handleNavigate('Account')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#0C3B2E',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {language === 'th' ? 'ไปที่บัญชี' : 'Go to Account'}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
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
              );
            })}
            
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
        <div className="flex gap-2 mb-2">
          <Input
            value={inputValue}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= MAX_CHARS) {
                setInputValue(newValue);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={language === 'th' ? 'พิมพ์คำถามของคุณ...' : language === 'zh' ? '输入您的问题...' : language === 'ja' ? '質問を入力...' : language === 'ko' ? '질문을 입력하세요...' : language === 'ru' ? 'Введите ваш вопрос...' : 'Type your question...'}
            disabled={isLoading}
            style={{
              backgroundColor: colors.inputBg,
              borderColor: inputValue.length >= MAX_CHARS ? '#EF4444' : (inputValue.length >= MAX_CHARS * 0.8 ? '#F59E0B' : colors.borderColor),
              color: colors.textPrimary,
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '12px'
            }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || inputValue.length > MAX_CHARS}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: colors.textSecondary }}>
            {inputValue.length >= MAX_CHARS && (
              <span style={{ color: '#EF4444', fontWeight: '600' }}>
                {language === 'th' 
                  ? 'กรุณาย่อข้อความเพื่อให้ฉันช่วยได้เร็วขึ้น'
                  : language === 'zh'
                    ? '请缩短您的消息，以便我能更快地帮助您'
                    : language === 'ja'
                      ? 'メッセージを短くしてください。早く対応できます'
                      : language === 'ko'
                        ? '메시지를 줄여주세요. 더 빨리 도와드릴 수 있습니다'
                        : language === 'ru'
                          ? 'Пожалуйста, сократите сообщение, чтобы я могла помочь быстрее'
                          : 'Please shorten your message so I can help faster'}
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: inputValue.length >= MAX_CHARS * 0.8 ? (inputValue.length >= MAX_CHARS ? '#EF4444' : '#F59E0B') : colors.textSecondary,
            fontWeight: inputValue.length >= MAX_CHARS * 0.8 ? '600' : 'normal',
            textAlign: 'right'
          }}>
            {inputValue.length} / {MAX_CHARS}
          </div>
        </div>
      </div>
    </Card>
  );
}