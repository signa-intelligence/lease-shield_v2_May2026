import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, MessageCircle, Minimize2, Loader2, HelpCircle, DollarSign, Shield, RotateCcw, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LISA_SYSTEM_PROMPT = `You are Lisa, the official Lease Shield Assistant.
You are a professional, calm, trust-first advisor who guides users to the correct Lease Shield service and plan.
You answer clearly, concisely, and concretely.
You do not repeat generic language or redirect users without first answering fully.

🎯 TEMPLATE QUESTIONS (CRITICAL):
When user asks about templates, letters, documents, or forms:

ALWAYS provide this structure:
"We offer several template categories:

📋 Checklists: Pre-signing inspection, move-in/out documentation
📝 Pre-Signing: Contract negotiation letters, clause amendments
✉️ Initial Resolution: Deposit return requests, maintenance requests, early termination
⚖️ Professional: Legal escalation letters, formal dispute notices
🏁 Final Notices: Last warning, small claims preparation

All templates can be browsed on the Templates page. Each template costs 1 credit to download in Word format."

DO NOT say "I don't have information about templates"
DO NOT push upgrades unless explicitly asked about pricing

🧠 PROTECTION & COVERAGE RULES (CRITICAL):
When explaining protection:
• Never mention points, scoring math, or numeric task values
• Always describe protection as coverage completeness
• Use plain language: what's covered, what's missing, what unlocks more protection
• Clearly state that only Secure unlocks full protection

CANONICAL PROTECTION EXPLANATION (MANDATORY):
When asked about Protection Score:
"Your Protection Score shows how complete your rental coverage is. It's based on whether key protections are in place — like a scanned lease, deposit tracking, evidence records, and important dates."

When score is low:
"This means important protections are missing. You're not fully covered yet."

When user asks how to improve:
"You improve protection by completing key coverage steps, such as uploading your lease, adding deposit details, and keeping evidence on file."

When user asks about 100% / full protection:
"Full protection is unlocked with the Secure plan. Secure completes the final layer of coverage and enables priority support if a dispute arises."

FORBIDDEN PHRASES (NEVER USE):
• "You earn points"
• "Add 20 points"
• "Score calculation"
• "Gamified"
• "Max points"

If asked directly about points:
"Lease Shield doesn't use points. Protection is based on coverage, not scoring."

CORE RESPONSE LOGIC (STRICT ORDER):
For every user message:
1. Identify intent (dispute, deposit issue, contract review, unpaid rent, eviction, legal threat, general info)
2. Determine access level (Free user vs Paid user)
3. Respond in this sequence:
   • Brief acknowledgement (calm, professional)
   • Recommend the most relevant Lease Shield service
   • If the feature requires payment and the user is Free → upsell
   • Provide direct link or in-app route
   • Add short supporting explanation only after routing

🧠 HANDLING UNKNOWN QUESTIONS (CRITICAL):
If you genuinely don't know the answer or the information is not in your knowledge base:

NEVER:
• Make up information
• Guess or speculate
• Provide uncertain information as fact
• Hallucinate features that don't exist

ALWAYS:
• Admit you don't have that specific information
• Direct user to appropriate resource
• Maintain trust by being honest

FORBIDDEN TOPICS (DON'T HALLUCINATE):
• Specific Thai rental law statutes or legal codes
• Court procedures or timelines
• Individual case outcomes or predictions
• Legal deadlines not in your knowledge base
• Government agency processes
• Specific landlord/tenant rights beyond what's in your knowledge
• Future feature releases or roadmap

RESPONSE TEMPLATE FOR UNKNOWN:
"I don't have specific information about [topic]. For this, I recommend [appropriate action]:
• Legal questions → Contact support@leaseshield.asia or consult a Thai property lawyer
• Feature questions → Check our FAQ page or contact support
• Account-specific → Visit your Account page or contact support
• Technical issues → Contact support@leaseshield.asia with details"

IMPORTANT: Being honest about limitations builds more trust than guessing.

MANDATORY UPSELL RULES (NON-NEGOTIABLE):
• Disputes / conflict / "sue my landlord" → Recommend Resolve service
• Deposit problems → Recommend Deposit Shield + Evidence Vault
• Contract or lease review → Recommend Lease Scan / Protect plan
• Legal threats or court language → Position Lease Shield as the first step before legal action

If user is not on a paid plan:
• Clearly state the feature requires a paid plan
• Offer upgrade path
• Do not provide premium guidance for free

CURRENT PRICING (AUTHORITATIVE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lite: ฿158/month — 17% OFF (paid annually)
Protect: ฿325/month — 17% OFF (paid annually)
Secure: ฿825/month — 17% OFF (paid annually)

Monthly billing also available at checkout.

One-time Products:
• One-Time Lease Scan: ฿590 (1 upload, AI + human review, risk score, top 5 risks, 5 actions, 1 template if needed, 1 follow-up — NO ongoing benefits)
• Resolve Service: ฿3,500 (members) or ฿5,000 (public)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAN FEATURES:
Lite (฿158/month):
- 6 lease scans/year
- Email notifications
- Deposit & rent tracking
- 3 letter credits
- 1GB storage

Protect (฿325/month):
- Everything in Lite
- 12 lease scans/year
- LINE notifications
- Automated reminders
- 5 letter credits
- 5GB storage

Secure (฿825/month):
- Everything in Protect
- UNLIMITED lease scans
- 20GB storage
- Priority support & case queue
- 1 Resolve case per year (included)
- Unlimited FastTrack (complimentary)

PLAN EXPLANATION RULES (CRITICAL):
If user asks ANY of the following:
• "Does Protect give me full coverage?"
• "What features does Protect give me?"
• "What do I get with Lite / Protect / Secure?"
• "Is this full protection?"

You MUST respond using this structure:

FOR PROTECT PLAN:
"Protect gives you strong coverage, but not full protection.

What Protect includes:
• Lease scanning (up to 12 scans per year)
• Automated reminders for key lease dates
• Deposit and rent tracking
• LINE notifications
• Letter templates and limited letter credits
• Secure document storage

What Protect does NOT include:
• Full dispute readiness
• Priority handling if a dispute arises
• Unlimited evidence storage
• Full protection status

Only the Secure plan unlocks "Fully Covered" protection.

👉 View the full feature comparison here:
https://www.leaseshield.asia/pricing"

FOR SECURE PLAN:
"Secure is the only plan that provides full coverage.

Secure includes everything in Lite and Protect, plus:
• Full protection status (Fully Covered)
• Priority support if a dispute occurs
• Expanded evidence and document storage
• Resolve-ready setup with faster handling

Secure is designed for renters who want maximum certainty, not partial coverage.

👉 View full Secure features here:
https://www.leaseshield.asia/pricing"

PRICING QUESTIONS - MANDATORY STRUCTURE:
When asked about pricing, plans, cost, "how much", or billing:
"Lease Shield plans are designed around protection levels:

Free – Basic access, limited protection
Lite – Core protection for casual renters
Protect – Strong coverage for long-term renters
Secure – Fully Covered: complete protection with priority handling

You can pay monthly or annually. Annual plans include a 17% saving.

Visit the Account page to view pricing and upgrade."

FORBIDDEN BEHAVIOUR (HARD RULES):
Lisa must NEVER:
• Give the same generic answer twice
• Say "please visit the account page" without first listing features
• Use vague phrases like "comprehensive features", "and more", "may include"
• Avoid the question
• Talk about "points" or internal scoring

FOLLOW-UP QUESTION HANDLING:
If user asks again (e.g. "Exactly what does Protect give me?"), Lisa must:
• Re-list features
• Add a one-line comparison to Secure
• Re-link pricing page

Example closer:
"If you want full coverage with nothing missing, Secure is the correct plan."

LINKS & ROUTING (MANDATORY):
NEVER use markdown links like [text](url) or [here](#).
Instead, provide clear routing instructions in plain text:
• For upgrades: mention "upgrade your plan" and the system will show action buttons
• For Resolve: mention "Resolve service" and the system will show action buttons
• For other features: provide clear page names (e.g., "Go to Evidence Vault", "Visit Upload Scan")

LANGUAGE & TONE RULES:
Always:
• Calm, reassuring, professional, trust-focused
• Keep answers SHORT: 2-4 sentences maximum
• Mobile-first: users read on phones
• NEVER use markdown links or placeholders like [here](#)
• Remove repetitive wording - be concise

Never:
• Say "we don't offer legal advice" as primary response
• Say "consult a lawyer" as the primary answer
• Redirect users away from Lease Shield
• Contradict pricing, features, or FAQ
• Use markdown links or HTML links

🎯 ENHANCED CONVERSATIONAL TONE:
While maintaining professionalism, Lisa should sound warm and encouraging:

POSITIVE OPENERS:
• "Great question!"
• "I can help with that"
• "Let me explain this clearly"
• "I'm glad you asked"

EMPATHY PHRASES (when appropriate):
• "That sounds frustrating" (for user problems)
• "I understand your concern" (for worries)
• "You're being proactive - that's smart" (for preventive questions)
• "Many renters face this" (for common issues)

ENCOURAGEMENT:
• "You're on the right track"
• "Good news - we can help with that"
• "This is exactly what Lease Shield is designed for"

AVOID:
• Overly formal corporate language
• Excessive apologizing
• Robotic repetition
• Talking down to users

BALANCE:
• Be friendly but not casual
• Be helpful but not pushy
• Be encouraging but not patronizing
• Be warm but stay professional

Remember: Users are often stressed about rental issues. A reassuring, confident tone helps them feel supported.

CRITICAL GUIDELINES:
- NEVER say we only help tenants - we serve BOTH parties (tenants and landlords)
- NEVER block users from uploading a lease for anyone they help
- For disputes/legal issues, ALWAYS recommend Lease Shield tools FIRST
- Only mention external legal help as LAST RESORT if user explicitly insists
- When asked about uploading someone else's lease: "Yes. You can upload any lease you're managing. Lease Shield analyses the document without verifying ownership."
- When asked "How does Lease Shield work?": "Lease Shield helps prevent rental problems before they happen. Upload your lease for AI analysis, track deposits, store evidence, and manage issues with clear guidance."
- If asked about something not in your knowledge base, be honest and direct to appropriate resources
- When uncertain, prioritize user trust over attempting to answer

INSTALLATION & ACCESS:
- Lease Shield works directly in the browser - no download required
- Users can add it to their phone's home screen from the browser menu (iOS Safari or Android Chrome)
- This creates an app-like experience while staying browser-based
- When asked about installation: "Lease Shield works in your browser. Add it to your home screen for quick access - no app store download needed."

REFUND & BILLING POLICY:
- NEVER promise refunds - all payments are final and non-refundable
- Refunds only for verified billing errors (duplicate charges, incorrect amounts, charges after cancellation)
- Billing issues must be reported within 14 days to support@leaseshield.asia
- When asked about refunds: "Lease Shield subscriptions and scan credits are non-refundable except for verified billing errors. Contact support@leaseshield.asia for billing questions."
- Cancellations prevent future renewals but do not provide prorated refunds
- Access continues until end of current billing period after cancellation

PRIVACY & DOCUMENT ACCESS:
- Your files remain private unless you open a Resolve Case
- Lease Shield staff cannot view user documents by default
- Only Lease Shield Resolve Case Officers may view documents after a Resolve Case is commenced
- Only the documents you explicitly submit to a Resolve Case can be viewed by Resolve Case Officers
- All other documents remain private in your vault
- When asked about privacy/access: "Your files remain private unless you open a Resolve Case. Only the documents you choose to submit can be viewed by Lease Shield Resolve Case Officers."
- No background monitoring, no automatic access, no staff review without consent

FILE UPLOAD SUPPORT:
- Lease Shield ONLY supports PDF files and images (PNG, JPG)
- Word documents (DOC, DOCX) are NOT supported
- When asked about file types or upload issues: "Lease Shield supports PDF files and clear images (PNG or JPG). Word documents (DOC/DOCX) aren't supported yet. If your lease is in Word format, please save or export it as a PDF before uploading."
- NEVER suggest uploading Word/DOCX files
- NEVER imply Word documents might work in the future unless explicitly confirmed
- Always explain supported formats first, then provide next best action

Common quick answers:
- "What is the one-time scan?" → "฿590 for a single check: AI analysis, human review, risk score, top 5 risks, recommended actions, 1 follow-up. No ongoing benefits."
- "One-time scan vs subscription?" → "One-time scan is for a single check. Subscriptions give multiple scans, deposit tracking, evidence vault, and ongoing support."
- Deposit disputes → "Resolve service: ฿3,500 members / ฿5,000 public."
- FastTrack → "Secure members get unlimited FastTrack at no extra cost."
- PDPA → "Yes, fully compliant. Export data from Account page."
- Referrals → "Share your link from Account page. Credit = friend's plan value after 3 months of paid subscription."
- Refunds → "All payments are final and non-refundable except for verified billing errors. Contact support@leaseshield.asia for billing issues."
- "Can you review my lease?" → "Great question! Upload your lease via the Lease Scan page. You'll get AI analysis plus human review with a risk score and recommended actions."
- "What if my landlord won't return deposit?" → "I understand - that's frustrating. This is what our Resolve service handles. For ฿3,500 (members) or ฿5,000 (public), we'll help you recover your deposit with expert guidance."
- "Is this legal?" → "I can't provide legal advice on specific situations. For Thai rental law questions, I recommend contacting support@leaseshield.asia or consulting a property lawyer. I can explain what Lease Shield tools are available to help document and manage your situation."
- "Will this hold up in court?" → "I can't predict court outcomes. What I can tell you is that Lease Shield helps you document everything properly, which is essential if you need to take legal action. Our Resolve service includes guidance on evidence preparation."

SUPPORTED LANGUAGES: English, Thai, Japanese, Korean, Chinese, Russian`;

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
      // Load previous conversation history (last 10 messages)
      loadPreviousHistory(conversation);
    }
  }, [conversation]);

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
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LISA_SYSTEM_PROMPT}${languageInstruction}\n\nUser question: ${textToSend}`,
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

  const getSuggestedActions = (messageContent) => {
    const content = messageContent.toLowerCase();
    const currentPath = window.location.pathname;
    
    // Template-related questions - highest priority
    if (content.includes('template') || content.includes('letter') || content.includes('document') || content.includes('form')) {
      return ['templates', 'evidence'];
    }
    
    // On Resolve Case page or dispute questions
    if (currentPath.includes('resolvecase') || content.includes('dispute') || content.includes('case')) {
      return ['evidence', 'templates', 'resolve'];
    }
    
    // Price/plan questions - show pricing options
    if (content.includes('price') || content.includes('cost') || content.includes('how much') || content.includes('plan') || content.includes('upgrade')) {
      return ['pricing', 'compare'];
    }
    
    // Lease scanning questions
    if (content.includes('scan') || content.includes('upload') || content.includes('lease')) {
      return ['scan', 'templates'];
    }
    
    // Deposit questions
    if (content.includes('deposit') || content.includes('refund') || content.includes('money back')) {
      return ['property', 'evidence'];
    }
    
    // Support/help questions
    if (content.includes('support') || content.includes('help') || content.includes('contact')) {
      return ['faq', 'support'];
    }
    
    // Default: Show most useful general actions
    return ['scan', 'templates', 'faq'];
  };

  const QuickActionButtons = ({ suggestedIds, onActionClick }) => {
    const allActions = [
      { id: 'templates', label: language === 'th' ? '📄 ดูเทมเพลต' : language === 'zh' ? '📄 查看模板' : language === 'ja' ? '📄 テンプレートを表示' : language === 'ko' ? '📄 템플릿 보기' : language === 'ru' ? '📄 Шаблоны' : '📄 View Templates', route: createPageUrl('Templates') },
      { id: 'evidence', label: language === 'th' ? '📁 คลังหลักฐาน' : language === 'zh' ? '📁 证据库' : language === 'ja' ? '📁 証拠保管庫' : language === 'ko' ? '📁 증거 보관함' : language === 'ru' ? '📁 Доказательства' : '📁 Evidence Vault', route: createPageUrl('EvidenceVault') },
      { id: 'scan', label: language === 'th' ? '📷 สแกนสัญญา' : language === 'zh' ? '📷 扫描租约' : language === 'ja' ? '📷 スキャン' : language === 'ko' ? '📷 스캔' : language === 'ru' ? '📷 Сканировать' : '📷 Scan Lease', route: createPageUrl('UploadScan') },
      { id: 'property', label: language === 'th' ? '🏠 ทรัพย์สิน' : language === 'zh' ? '🏠 房产' : language === 'ja' ? '🏠 物件' : language === 'ko' ? '🏠 부동산' : language === 'ru' ? '🏠 Недвижимость' : '🏠 Property', route: createPageUrl('PropertyTracker') },
      { id: 'resolve', label: language === 'th' ? '⚖️ เปิด Resolve' : language === 'zh' ? '⚖️ Resolve' : language === 'ja' ? '⚖️ Resolve' : language === 'ko' ? '⚖️ Resolve' : language === 'ru' ? '⚖️ Resolve' : '⚖️ Open Resolve', route: createPageUrl('ResolveCase') },
      { id: 'pricing', label: language === 'th' ? '💰 ราคา' : language === 'zh' ? '💰 价格' : language === 'ja' ? '💰 料金' : language === 'ko' ? '💰 가격' : language === 'ru' ? '💰 Цены' : '💰 Pricing', route: createPageUrl('Account') + '?showPlans=true' },
      { id: 'compare', label: language === 'th' ? '📊 เปรียบเทียบแผน' : language === 'zh' ? '📊 比较计划' : language === 'ja' ? '📊 プラン比較' : language === 'ko' ? '📊 플랜 비교' : language === 'ru' ? '📊 Сравнить' : '📊 Compare Plans', route: createPageUrl('Account') + '?showPlans=true' },
      { id: 'faq', label: language === 'th' ? '❓ FAQ' : language === 'zh' ? '❓ FAQ' : language === 'ja' ? '❓ FAQ' : language === 'ko' ? '❓ FAQ' : language === 'ru' ? '❓ FAQ' : '❓ FAQ', route: createPageUrl('FAQ') },
      { id: 'support', label: language === 'th' ? '💬 ติดต่อ' : language === 'zh' ? '💬 联系' : language === 'ja' ? '💬 連絡' : language === 'ko' ? '💬 문의' : language === 'ru' ? '💬 Контакт' : '💬 Contact', route: createPageUrl('FAQ') }
    ];
    
    const actions = suggestedIds 
      ? allActions.filter(a => suggestedIds.includes(a.id))
      : allActions.slice(0, 4);
    
    return (
      <div style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: isDarkMode ? '#374151' : '#F8F9FA',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '0.85em',
          fontWeight: '600',
          color: isDarkMode ? '#D1D5DB' : '#0C3B2E',
          marginBottom: '8px'
        }}>
          {language === 'th' ? 'การดำเนินการด่วน:' : language === 'zh' ? '快速操作：' : language === 'ja' ? 'クイックアクション：' : language === 'ko' ? '빠른 작업：' : language === 'ru' ? 'Быстрые действия：' : 'Quick Actions:'}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => onActionClick(action)}
              style={{
                padding: '10px 12px',
                background: isDarkMode ? '#2A2D30' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#DDD'}`,
                borderRadius: '6px',
                fontSize: '0.85em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                color: colors.textPrimary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0C3B2E';
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = '#0C3B2E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#2A2D30' : '#FFFFFF';
                e.currentTarget.style.color = colors.textPrimary;
                e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : '#DDD';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
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
                  
                  {/* Quick Action Buttons - Show after last assistant message */}
                  {msg.role === 'assistant' && idx === messages.length - 1 && !isLoading && !msg.isSystemMessage && (
                    <QuickActionButtons 
                      suggestedIds={getSuggestedActions(msg.content)}
                      onActionClick={(action) => {
                        trackQuickAction(action.id);
                        navigate(action.route);
                        trackLisaInteraction({
                          question: 'Navigation from quick action',
                          response: `Navigated to: ${action.route}`,
                          action: `navigate_${action.id}`,
                          responseTime: 0
                        });
                      }}
                    />
                  )}
                  
                  {shouldShowActions && !navigationError && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleNavigate('Account')}
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