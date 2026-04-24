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
    startFree: "Upload your lease in 2 minutes.\nGet a risk report.\nFree, no credit card required.",
    createAccount: "Start Free. No Credit Card Needed",
    logIn: "Log In",
    notSure: "Learn how Lease Shield works",
    footerTagline: "Built to prevent deposit loss in Thailand",
  },
  th: {
    headline: "ผู้เช่าในไทยเสียเงินประกันทุกวัน อย่าให้คุณเป็นหนึ่งในนั้น",
    startFree: "อัปโหลดสัญญาเช่าใน 2 นาที\nรับรายงานความเสี่ยง\nฟรี ไม่ต้องใช้บัตรเครดิต",
    createAccount: "เริ่มต้นฟรี ไม่ต้องใช้บัตรเครดิต",
    logIn: "เข้าสู่ระบบ",
    notSure: "ดูวิธีการทำงานของ Lease Shield",
    footerTagline: "ออกแบบมาเพื่อป้องกันการสูญเสียเงินประกันในประเทศไทย",
  },
  ko: {
    headline: "태국에서 매일 세입자들이 보증금을 잃고 있습니다. 당신은 그중 하나가 되지 마세요.",
    startFree: "2분 안에 계약서를 업로드하세요.\n위험 보고서를 받으세요.\n무료, 신용카드 불필요.",
    createAccount: "무료로 시작. 신용카드 불필요",
    logIn: "로그인",
    notSure: "Lease Shield 작동 방식 보기",
    footerTagline: "태국에서 보증금 손실을 막기 위해 설계되었습니다",
  },
  ja: {
    headline: "タイでは毎日入居者がデポジットを失っています。あなたがその一人にならないように。",
    startFree: "2分で契約書をアップロード。\nリスクレポートを取得。\n無料、クレジットカード不要。",
    createAccount: "無料で開始。カード不要",
    logIn: "ログイン",
    notSure: "Lease Shield の仕組みを見る",
    footerTagline: "タイでのデポジット損失を防ぐために設計されています",
  },
  zh: {
    headline: "在泰国，租客每天都在失去押金。确保你不是其中之一。",
    startFree: "2分钟上传你的租约。\n获取风险报告。\n免费，无需信用卡。",
    createAccount: "免费开始，无需信用卡",
    logIn: "登录",
    notSure: "了解 Lease Shield 如何运作",
    footerTagline: "专为防止在泰国丢失押金而设计",
  },
  ru: {
    headline: "Арендаторы в Таиланде теряют депозиты каждый день. Убедитесь, что вы не один из них.",
    startFree: "Загрузите договор за 2 минуты.\nПолучите отчёт о рисках.\nБесплатно, без кредитной карты.",
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

      <div style={{position: 'absolute', top: '16px', right: '16px', zIndex: 100}}>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="en" style={{color: '#000'}}>EN</option>
          <option value="th" style={{color: '#000'}}>TH</option>
          <option value="ko" style={{color: '#000'}}>KO</option>
          <option value="ja" style={{color: '#000'}}>JA</option>
          <option value="zh" style={{color: '#000'}}>ZH</option>
          <option value="ru" style={{color: '#000'}}>RU</option>
        </select>
      </div>

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
      <p className="text-base text-white/70 text-center mb-10 max-w-md whitespace-pre-line">
        {planName
          ? `Create your account to ${selectedPlan === 'one-time-scan' ? 'purchase' : 'subscribe to'} ${planName}.`
          : strings.startFree}
      </p>

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

      {/* Footer */}
      <p className="mt-4 text-xs text-white/30">
        © {new Date().getFullYear()} Lease Shield · {strings.footerTagline || 'Fair. Transparent. Protected.'}
      </p>
    </div>
  );
}