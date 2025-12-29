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
        top: "20px",
        right: "70px",
        minWidth: "56px",
        width: "56px",
        height: "56px",
        borderRadius: "28px",
        backgroundColor: "#063F2C",
        border: "3px solid #CFAF6A",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "0",
        boxShadow: "0 4px 12px rgba(12, 59, 46, 0.2)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 50,
        fontWeight: "700",
        fontSize: "14px",
        overflow: "hidden",
        whiteSpace: "nowrap"
      }}
    >
      <MessageCircle className="w-5 h-5 flex-shrink-0" />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </button>
  );
}