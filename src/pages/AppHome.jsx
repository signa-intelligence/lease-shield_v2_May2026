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

      {/* Footer */}
      <p className="mt-16 text-xs text-white/30">
        © {new Date().getFullYear()} Lease Shield · Fair. Transparent. Protected.
      </p>
    </div>
  );
}