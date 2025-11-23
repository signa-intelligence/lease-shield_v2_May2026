import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { haptic } from "./HapticFeedback";

/**
 * PageHeader - Unified header component for all pages
 * 
 * @param {string} title - Page title
 * @param {string} subtitle - Page subtitle/description
 * @param {React.Component} icon - Lucide icon component (optional)
 * @param {string} iconColor - Icon color (optional)
 * @param {boolean} showBack - Show back button
 * @param {string} backRoute - Custom back route (defaults to Dashboard)
 * @param {React.ReactNode} actions - Action buttons/chips row (optional)
 * @param {object} colors - Theme colors object
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  showBack = false,
  backRoute,
  backLabel = "Back",
  actions,
  isDarkMode = false
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    haptic.light();
    navigate(backRoute || createPageUrl("Dashboard"));
  };

  return (
    <div className="mb-6">
      {showBack && (
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-opacity-80 text-gray-600 dark:text-gray-400"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{backLabel}</span>
        </button>
      )}

      <div className="flex items-start gap-3 mb-3">
        {Icon && (
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconColor || '#0C3B2E' }}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900 dark:text-gray-50">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400" style={{ lineHeight: '1.5' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="mt-4">
          {actions}
        </div>
      )}
    </div>
  );
}