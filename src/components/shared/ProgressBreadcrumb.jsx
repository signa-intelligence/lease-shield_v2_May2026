import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export default function ProgressBreadcrumb({ 
  steps, 
  currentStep, 
  primaryColor = '#0C3B2E',
  secondaryColor = '#C7A338',
  colors, 
  language = 'en' 
}) {
  // Safe color defaults
  const safeColors = colors || {
    cardBg: '#FFFFFF',
    textPrimary: '#1A1D1F',
    textSecondary: '#64748b',
    borderColor: '#E5E7EB'
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-1 rounded-full transition-all duration-500"
          style={{
            backgroundColor: safeColors.borderColor,
            width: '100%',
            zIndex: 0
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: primaryColor,
              width: `${(currentStep / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div 
              key={idx}
              className="flex flex-col items-center relative"
              style={{ flex: 1, zIndex: 1 }}
            >
              {/* Circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300"
                style={{
                  backgroundColor: isCompleted ? primaryColor : isCurrent ? secondaryColor : safeColors.cardBg,
                  border: `3px solid ${isCompleted ? primaryColor : isCurrent ? secondaryColor : safeColors.borderColor}`,
                  boxShadow: isCurrent ? `0 0 0 4px ${secondaryColor}20` : 'none',
                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Circle 
                    className="w-5 h-5" 
                    style={{ 
                      color: isCurrent ? '#FFFFFF' : safeColors.textSecondary,
                      fill: isCurrent ? '#FFFFFF' : 'none'
                    }} 
                  />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <p 
                  className="text-xs font-semibold whitespace-nowrap"
                  style={{ 
                    color: isCompleted || isCurrent 
                      ? safeColors.textPrimary
                      : safeColors.textSecondary
                  }}
                >
                  {step?.label || ''}
                </p>
                {step?.sublabel && (
                  <p 
                    className="text-xs mt-1"
                    style={{ 
                      color: safeColors.textSecondary
                    }}
                  >
                    {step.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}