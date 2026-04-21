import React from "react";
import { base44 } from "@/api/base44Client";

const planNames = {
  'lite': 'Lite',
  'protect': 'Protect',
  'secure': 'Secure',
  'one-time-scan': 'One-Time Lease Scan'
};

export default function AppHome() {
  const searchParams = new URLSearchParams(window.location.search);
  const selectedPlan = searchParams.get('plan');
  const planName = selectedPlan ? planNames[selectedPlan] : null;

  const handleAuth = () => {
    if (selectedPlan) {
      sessionStorage.setItem('pendingPlan', selectedPlan);
    }
    base44.auth.redirectToLogin(window.location.origin + "/welcome");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(165deg, #0C3B2E 0%, #145A44 50%, #0C3B2E 100%)",
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
        {planName ? `Get Started with ${planName}` : "Protect Your Rental in Thailand"}
      </h2>

      {/* Description */}
      <p className="text-base text-white/70 text-center mb-10 max-w-md">
        {planName
          ? `Create your account to ${selectedPlan === 'one-time-scan' ? 'purchase' : 'subscribe to'} ${planName}.`
          : "Scan your lease, track your deposit, resolve disputes."}
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button
          onClick={handleAuth}
          className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all"
          style={{
            backgroundColor: "#C7A338",
            color: "#0C3B2E",
          }}
        >
          {planName
            ? `Sign Up for ${planName}`
            : "Create Free Account"}
        </button>
        <button
          onClick={handleAuth}
          className="flex-1 py-3.5 rounded-xl font-bold text-base transition-all"
          style={{
            backgroundColor: "transparent",
            color: "#FFFFFF",
            border: "2px solid rgba(255,255,255,0.4)",
          }}
        >
          Log In
        </button>
      </div>

      {/* "Not sure yet?" link */}
      <a
        href="https://www.leaseshield.asia"
        className="mt-5 text-base text-white underline underline-offset-4 hover:text-white/80 transition-colors"
      >
        Not sure yet? See how Lease Shield works
      </a>

      {/* Social Icons */}
      <div className="flex items-center gap-5 mt-12">
        <a href="https://www.facebook.com/leaseshield" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <svg className="w-5 h-5 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="https://www.instagram.com/leaseshield" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <svg className="w-5 h-5 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a href="https://www.tiktok.com/@leaseshield" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
          <svg className="w-5 h-5 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.6z"/></svg>
        </a>
        <a href="https://www.linkedin.com/company/leashieldasia" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <svg className="w-5 h-5 text-white/60 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs text-white/30">
        © {new Date().getFullYear()} Lease Shield · Fair. Transparent. Protected.
      </p>
    </div>
  );
}