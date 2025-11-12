import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export default function ProgressBreadcrumb({ steps, currentStep, colors, language = 'en' }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div 
          className="absolute top-5 left-0 h-1 rounded-full transition-all duration-500"
          style={{
            backgroundColor: colors?.borderColor || '#E5E7EB',
            width: '100%',
            zIndex: 0
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              backgroundColor: '#10B981',
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
                  backgroundColor: isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : colors?.cardBg || '#FFFFFF',
                  border: `3px solid ${isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : colors?.borderColor || '#E5E7EB'}`,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Circle 
                    className="w-5 h-5" 
                    style={{ 
                      color: isCurrent ? '#3B82F6' : colors?.textSecondary || '#9CA3AF',
                      fill: isCurrent ? '#3B82F6' : 'none'
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
                      ? colors?.textPrimary || '#1A1D1F'
                      : colors?.textSecondary || '#9CA3AF'
                  }}
                >
                  {step.label}
                </p>
                {step.sublabel && (
                  <p 
                    className="text-xs mt-1"
                    style={{ 
                      color: colors?.textSecondary || '#9CA3AF'
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