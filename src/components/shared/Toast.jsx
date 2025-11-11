import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { transitions, borderRadius, shadows } from '@/utils/designSystem';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message) => addToast(message, 'info'), [addToast]);
  const warning = useCallback((message) => addToast(message, 'warning'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        width: '100%',
        padding: '0 16px',
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const config = {
    success: {
      icon: CheckCircle2,
      bg: '#10B981',
      bgLight: '#D1FAE5',
      text: '#065F46',
    },
    error: {
      icon: AlertCircle,
      bg: '#EF4444',
      bgLight: '#FEE2E2',
      text: '#991B1B',
    },
    info: {
      icon: Info,
      bg: '#3B82F6',
      bgLight: '#DBEAFE',
      text: '#1E40AF',
    },
    warning: {
      icon: AlertCircle,
      bg: '#F59E0B',
      bgLight: '#FEF3C7',
      text: '#92400E',
    },
  };

  const { icon: Icon, bg, bgLight, text } = config[toast.type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: bgLight,
        borderLeft: `4px solid ${bg}`,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.lg,
        transform: isExiting ? 'translateX(400px)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: `all ${transitions.base}`,
        animation: isExiting ? 'none' : 'slideInRight 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      <p
        style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: '600',
          color: text,
          margin: 0,
        }}
      >
        {toast.message}
      </p>

      <button
        onClick={handleRemove}
        style={{
          padding: '4px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: transitions.fast,
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        <X className="w-4 h-4" style={{ color: text }} />
      </button>
    </div>
  );
};

export default ToastProvider;