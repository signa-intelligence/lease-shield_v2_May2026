import React from "react";
import { base44 } from "@/api/base44Client";

const planNames = {
  'lite': 'Lite',
  'protect': 'Protect',
  'secure': 'Secure',
  'one-time-scan': 'One-Time Lease Scan'
};

const t = {
  en: {
    headline: "Renters in Thailand Lose Deposits Every Day. Make Sure You're Not One of Them.",
    startFree: ["Upload your lease in 2 minutes.", "Get a risk report."],
    createAccount: "Start Free. No Credit Card Needed",
    logIn: "Log In",
    notSure: "Learn how Lease Shield works",
    footerTagline: "Built to prevent deposit loss in Thailand",
  },
  th: {
    headline: "ผู้เช่าในไทยเสียเงินประกันทุกวัน อย่าให้คุณเป็นหนึ่งในนั้น",
    startFree: ["อัปโหลดสัญญาเช่าใน 2 นาที", "รับรายงานความเสี่ยง"],
    createAccount: "เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต",
    logIn: "เข้าสู่ระบบ",
    notSure: "ดูวิธีการทำงานของ Lease Shield",
    footerTagline: "ออกแบบมาเพื่อป้องกันการสูญเสียเงินประกันในประเทศไทย",
  },
  ko: {
    headline: "태국에서 매일 세입자들이 보증금을 잃고 있습니다. 당신은 그중 하나가 되지 마세요.",
    startFree: ["2분 안에 계약서를 업로드하세요.", "위험 보고서를 받으세요."],
    createAccount: "무료로 시작. 신용카드 불필요",
    logIn: "로그인",
    notSure: "Lease Shield 작동 방식 보기",
    footerTagline: "태국에서 보증금 손실을 막기 위해 설계되었습니다",
  },
  ja: {
    headline: "タイでは毎日入居者がデポジットを失っています。あなたがその一人にならないように。",
    startFree: ["2分で契約書をアップロード。", "リスクレポートを取得。"],
    createAccount: "無料で開始。カード不要",
    logIn: "ログイン",
    notSure: "Lease Shield の仕組みを見る",
    footerTagline: "タイでのデポジット損失を防ぐために設計されています",
  },
  zh: {
    headline: "在泰国，租客每天都在失去押金。确保你不是其中之一。",
    startFree: ["2分钟上传你的租约。", "获取风险报告。"],
    createAccount: "免费开始，无需信用卡",
    logIn: "登录",
    notSure: "了解 Lease Shield 如何运作",
    footerTagline: "专为防止在泰国丢失押金而设计",
  },
  ru: {
    headline: "Арендаторы в Таиланде теряют депозиты каждый день. Убедитесь, что вы не один из них.",
    startFree: ["Загрузите договор за 2 минуты.", "Получите отчёт о рисках."],
    createAccount: "Начать бесплатно. Без карты",
    logIn: "Войти",
    notSure: "Как работает Lease Shield",
    footerTagline: "Создано, чтобы защитить ваш депозит в Таиланде",
  },
};

const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'th', label: 'TH', name: 'ไทย' },
  { code: 'ko', label: 'KO', name: '한국어' },
  { code: 'ja', label: 'JA', name: '日本語' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'ru', label: 'RU', name: 'Русский' },
];

function detectLang() {
  const stored = localStorage.getItem('ls_landing_lang');
  if (stored && ['en','th','ko','ja','zh','ru'].includes(stored)) return stored;
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('th')) return 'th';
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export default function AppHome() {
  const [lang, setLang] = React.useState(detectLang);
  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('ls_landing_lang', code);
  };
  const strings = t[lang] || t.en;
  const searchParams = new URLSearchParams(window.location.search);
  const selectedPlan = searchParams.get('plan');
  const planName = selectedPlan ? planNames[selectedPlan] : null;

  const handleAuth = (isScanCTA = false) => {
    if (selectedPlan) {
      sessionStorage.setItem('pendingPlan', selectedPlan);
    }
    if (isScanCTA && !selectedPlan) {
      sessionStorage.setItem('scanFromFunnel', 'true');
    }
    base44.auth.redirectToLogin(window.location.origin + "/welcome");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(165deg, #0C3B2E 0%, #145A44 50%, #0C3B2E 100%)",
        position: 'relative',
      }}
    >



      {/* Logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd84b6c148652a5512a0a0/9df84f495_LeaseShieldcrestlogonobkg.png"
        alt="Lease Shield"
        className="w-20 h-20 mb-4"
        width="80"
        height="80"
      />

      {/* App Name */}
      <h1
        className="text-2xl font-bold tracking-wider mb-8"
        style={{ color: "#C7A338" }}
      >
        LEASE SHIELD
      </h1>

      {/* Headline */}
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4 max-w-lg leading-tight">
        {planName ? `Get Started with ${planName}` : strings.headline}
      </h2>

      {/* Description */}
      <div className="text-base text-white/70 text-center mb-10 max-w-md">
        {planName
          ? <p>{`Create your account to ${selectedPlan === 'one-time-scan' ? 'purchase' : 'subscribe to'} ${planName}.`}</p>
          : strings.startFree.map((line, i) => <p key={i}>{line}</p>)}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={() => handleAuth(true)}
          className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all"
          style={{
            backgroundColor: "#C7A338",
            color: "#0C3B2E",
          }}
        >
          {planName
            ? `Sign Up for ${planName}`
            : strings.createAccount}
        </button>
        <button
          onClick={() => handleAuth(false)}
          className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all"
          style={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "2px solid rgba(255,255,255,0.4)",
          }}
        >
          {strings.logIn}
        </button>
      </div>

      {/* Trust Badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '16px',
        maxWidth: '400px',
      }}>
        {['Free to Start', 'No Credit Card', 'Cancel Anytime', 'PDPA Compliant'].map((badge) => (
          <span
            key={badge}
            style={{
              border: '1px solid #C7A338',
              color: '#FFFFFF',
              backgroundColor: 'transparent',
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Language Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '4px',
        marginTop: '12px',
        fontSize: '13px',
      }}>
        {[
          { code: 'en', flag: '🇬🇧', label: 'EN' },
          { code: 'th', flag: '🇹🇭', label: 'TH' },
          { code: 'zh', flag: '🇨🇳', label: 'ZH' },
          { code: 'ja', flag: '🇯🇵', label: 'JA' },
          { code: 'ko', flag: '🇰🇷', label: 'KO' },
          { code: 'ru', flag: '🇷🇺', label: 'RU' },
        ].map((l, i, arr) => (
          <span key={l.code} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <button
              onClick={() => changeLang(l.code)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: lang === l.code ? '#C7A338' : 'rgba(255,255,255,0.6)',
                fontWeight: lang === l.code ? 700 : 400,
                fontSize: '13px',
                padding: '2px 4px',
                textDecoration: lang === l.code ? 'underline' : 'none',
                textUnderlineOffset: '3px',
                minHeight: 'auto',
              }}
            >
              {l.flag} {l.label}
            </button>
            {i < arr.length - 1 && (
              <span style={{ color: 'rgba(255,255,255,0.25)', margin: '0 2px' }}>·</span>
            )}
          </span>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-white/30">
        © {new Date().getFullYear()} Lease Shield · {strings.footerTagline || 'Fair. Transparent. Protected.'}
      </p>
    </div>
  );
}