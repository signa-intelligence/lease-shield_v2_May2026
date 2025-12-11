import React from "react";
import { MessageCircle } from "lucide-react";
import { haptic } from "./HapticFeedback";

/**
 * Lisa Floating Action Button
 * Small circular button that opens the Lisa assistant
 */
export default function LisaFAB({ onClick, isDarkMode = false }) {
  return (
    <button
      type="button"
      aria-label="Open Lisa Assistant"
      onClick={() => {
        haptic.medium();
        if (onClick) onClick();
      }}
      className="btn-interaction"
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        right: "20px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#0C3B2E",
        border: "2px solid #C7A338",
        color: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 20px rgba(12,59,46,0.35)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        zIndex: 50,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(12,59,46,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(12,59,46,0.35)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.95)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
      }}
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}