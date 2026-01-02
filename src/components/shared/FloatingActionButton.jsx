import React from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { haptic } from "./HapticFeedback";

/**
 * Floating Action Button (FAB)
 * We now ONLY show this on the Evidence Vault page.
 * On all other pages it returns null (invisible).
 */
export default function FloatingActionButton({
  icon: Icon = Plus,
  label = "Upload",
  onClick,
  color = "#0C3B2E",
  position = "bottom-right",
  size = "medium",
  showLabel = false,
  disabled = false,
}) {
  const location = useLocation();

  // ✅ Only show FAB on Evidence Vault page
  const evidencePath = createPageUrl("EvidenceVault");
  const isEvidencePage = location.pathname === evidencePath;

  if (!isEvidencePage) {
    // No FAB anywhere else
    return null;
  }

  const handleClick = () => {
    if (disabled) return;
    haptic.medium?.();
    if (onClick) onClick();
  };

  const positionStyles = {
    "bottom-right": {
      bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      right: "20px",
    },
    "bottom-left": {
      bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      left: "20px",
    },
    "bottom-center": {
      bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      left: "50%",
      transform: "translateX(-50%)",
    },
  };

  const sizeStyles = {
    small: {
      width: "48px",
      height: "48px",
      borderRadius: "24px",
      fontSize: "20px",
    },
    medium: {
      width: "56px",
      height: "56px",
      borderRadius: "28px",
      fontSize: "22px",
    },
    large: {
      width: "64px",
      height: "64px",
      borderRadius: "32px",
      fontSize: "24px",
    },
  };

  const posStyle = positionStyles[position] || positionStyles["bottom-right"];
  const szStyle = sizeStyles[size] || sizeStyles.large;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: "fixed",
        zIndex: 60,
        backgroundColor: disabled ? "#9CA3AF" : color,
        color: "#FFFFFF",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        cursor: disabled ? "default" : "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...posStyle,
        ...szStyle,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.96)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.25)";
      }}
    >
      <Icon style={{ width: 24, height: 24 }} />
      {showLabel && (
        <span style={{ marginLeft: 8, fontWeight: 600, fontSize: 14 }}>
          {label}
        </span>
      )}
    </button>
  );
}
