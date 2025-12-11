import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { haptic } from './HapticFeedback';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration = 'default',
  animate = true,
  isDarkMode = false,
  compact = false,
}) => {
  const illustrations = {
    default: (
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50"
          style={{
            animation: animate ? 'pulse 3s ease-in-out infinite' : 'none',
          }}
        />
        <div
          className="absolute inset-4 bg-gradient-to-tr from-emerald-100 to-blue-100 rounded-full opacity-50"
          style={{
            animation: animate ? 'pulse 3s ease-in-out infinite 0.5s' : 'none',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {Icon && (
            <Icon
              className="w-24 h-24 text-slate-400"
              style={{
                animation: animate ? 'float 4s ease-in-out infinite' : 'none',
              }}
            />
          )}
        </div>
      </div>
    ),
    leases: (
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Animated document illustration */}
          <defs>
            <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0C3B2E" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          
          {/* Main document */}
          <g style={{ animation: animate ? 'float 4s ease-in-out infinite' : 'none' }}>
            <rect x="50" y="30" width="100" height="130" rx="8" fill="url(#docGradient)" opacity="0.2" />
            <rect x="60" y="40" width="80" height="110" rx="6" fill="#FFFFFF" stroke="#0C3B2E" strokeWidth="2" />
            <line x1="70" y1="55" x2="130" y2="55" stroke="#0C3B2E" strokeWidth="2" opacity="0.3" />
            <line x1="70" y1="70" x2="130" y2="70" stroke="#0C3B2E" strokeWidth="2" opacity="0.3" />
            <line x1="70" y1="85" x2="120" y2="85" stroke="#0C3B2E" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="120" r="15" fill="#C7A338" opacity="0.2" />
            <path d="M 95 120 L 98 123 L 105 116" stroke="#C7A338" strokeWidth="3" fill="none" />
          </g>
          
          {/* Floating sparkles */}
          <circle cx="40" cy="60" r="3" fill="#C7A338" opacity="0.6" style={{ animation: animate ? 'twinkle 2s ease-in-out infinite' : 'none' }} />
          <circle cx="160" cy="80" r="2" fill="#047857" opacity="0.6" style={{ animation: animate ? 'twinkle 2s ease-in-out infinite 0.5s' : 'none' }} />
          <circle cx="45" cy="140" r="2.5" fill="#3B82F6" opacity="0.6" style={{ animation: animate ? 'twinkle 2s ease-in-out infinite 1s' : 'none' }} />
        </svg>
      </div>
    ),
    deposits: (
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C7A338" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          
          {/* Shield with wallet */}
          <g style={{ animation: animate ? 'float 4s ease-in-out infinite' : 'none' }}>
            <path d="M 100 30 L 60 50 L 60 100 C 60 130 80 150 100 160 C 120 150 140 130 140 100 L 140 50 Z" 
                  fill="url(#walletGradient)" opacity="0.2" />
            <path d="M 100 40 L 70 55 L 70 100 C 70 125 85 140 100 148 C 115 140 130 125 130 100 L 130 55 Z" 
                  fill="#FFFFFF" stroke="#C7A338" strokeWidth="2" />
            
            {/* Money symbol */}
            <text x="100" y="105" textAnchor="middle" fontSize="36" fontWeight="bold" fill="#C7A338">฿</text>
          </g>
          
          {/* Coins falling */}
          <circle cx="70" cy="70" r="8" fill="#C7A338" opacity="0.6" style={{ animation: animate ? 'fall 3s ease-in-out infinite' : 'none' }} />
          <circle cx="130" cy="90" r="6" fill="#d97706" opacity="0.6" style={{ animation: animate ? 'fall 3s ease-in-out infinite 0.5s' : 'none' }} />
        </svg>
      </div>
    ),
    documents: (
      <div className="relative w-64 h-64 mx-auto mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          
          {/* Folder */}
          <g style={{ animation: animate ? 'float 4s ease-in-out infinite' : 'none' }}>
            <path d="M 50 70 L 50 140 L 150 140 L 150 85 L 120 85 L 110 70 Z" 
                  fill="url(#folderGradient)" opacity="0.2" />
            <path d="M 55 75 L 55 135 L 145 135 L 145 90 L 118 90 L 108 75 Z" 
                  fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
            
            {/* Papers inside */}
            <rect x="70" y="100" width="50" height="2" fill="#3B82F6" opacity="0.4" />
            <rect x="70" y="110" width="60" height="2" fill="#3B82F6" opacity="0.4" />
            <rect x="70" y="120" width="45" height="2" fill="#3B82F6" opacity="0.4" />
          </g>
        </svg>
      </div>
    ),
  };

  const textColor = isDarkMode ? '#F9FAFB' : '#0F172A';
  const secondaryTextColor = isDarkMode ? '#D1D5DB' : '#64748B';

  return (
    <div
      className="text-center px-6"
      style={{
        animation: animate ? 'fadeIn 0.5s ease-out' : 'none',
        paddingTop: compact ? '32px' : '48px',
        paddingBottom: compact ? '32px' : '48px',
      }}
    >
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.3; }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes fall {
            0% { transform: translateY(-20px); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(30px); opacity: 0; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {illustrations[illustration] || illustrations.default}

      <h3
        className="font-bold mb-3"
        style={{
          fontSize: compact ? '20px' : '24px',
          fontWeight: '700',
          marginBottom: '12px',
          color: textColor,
        }}
      >
        {title}
      </h3>

      <p
        className="mb-6 max-w-md mx-auto"
        style={{
          fontSize: compact ? '14px' : '16px',
          lineHeight: '1.6',
          marginBottom: '24px',
          color: secondaryTextColor,
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              haptic.light();
              onAction();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#063F2C',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(6, 63, 44, 0.2)',
              whiteSpace: 'normal',
              textAlign: 'center',
              lineHeight: '1.3',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 12px rgba(6, 63, 44, 0.3)';
              e.target.style.backgroundColor = '#084D38';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 6px rgba(6, 63, 44, 0.2)';
              e.target.style.backgroundColor = '#063F2C';
            }}
          >
            {actionLabel}
            <ArrowRight className="w-5 h-5" />
          </button>

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={() => {
                haptic.light();
                onSecondaryAction();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: isDarkMode ? '#F9FAFB' : '#063F2C',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                border: `2px solid ${isDarkMode ? '#F9FAFB' : '#063F2C'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: '1.3',
                minHeight: '48px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDarkMode ? '#374151' : '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;