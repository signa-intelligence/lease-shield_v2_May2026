import React from "react";
import { MessageCircle } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Lisa Floating Action Button
 * Small circular button that opens the Lisa assistant
 */
export default function LisaFAB({ onClick, isDarkMode = false }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const label = isMobile ? 'Ask Lisa' : 'Chat with Lisa';

  // Check if cookie banner is visible
  const [cookieBannerVisible, setCookieBannerVisible] = React.useState(false);

  React.useEffect(() => {
    const checkCookieBanner = () => {
      const banner = document.getElementById('cookie-banner') || document.querySelector('[data-cookie-banner]');
      setCookieBannerVisible(banner && banner.offsetHeight > 0);
    };

    checkCookieBanner();
    const observer = new MutationObserver(checkCookieBanner);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        haptic.medium();
        if (onClick) onClick();
      }}
      className="btn-interaction"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "fixed",
        bottom: cookieBannerVisible ? "calc(160px + env(safe-area-inset-bottom, 0px))" : "calc(80px + env(safe-area-inset-bottom, 0px))",
        right: "20px",
        minWidth: isMobile ? "56px" : (isHovered ? "180px" : "56px"),
        height: "56px",
        borderRadius: "28px",
        backgroundColor: "#063F2C",
        border: "3px solid #CFAF6A",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "0 16px",
        boxShadow: "0 8px 24px rgba(6,63,44,0.4)",
        cursor: "pointer",
        transition: "bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 50,
        fontWeight: "700",
        fontSize: "14px",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}
    >
      <MessageCircle className="w-6 h-6 flex-shrink-0" />
      {(!isMobile && isHovered) && (
        <span style={{
          opacity: 1,
          animation: "fadeIn 0.2s ease-in"
        }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </button>
  );
}