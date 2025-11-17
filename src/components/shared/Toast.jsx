import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 2500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{
      success: (msg, opts) => addToast(msg, 'success', opts?.duration || 2500),
      error: (msg, opts) => addToast(msg, 'error', opts?.duration || 3000),
      info: (msg, opts) => addToast(msg, 'info', opts?.duration || 2500),
      warning: (msg, opts) => addToast(msg, 'warning', opts?.duration || 2500),
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '90vw',
      width: '320px'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    return () => setIsExiting(true);
  }, []);

  const styles = {
    success: {
      bg: '#10B981',
      icon: CheckCircle2
    },
    error: {
      bg: '#EF4444',
      icon: AlertCircle
    },
    info: {
      bg: '#3B82F6',
      icon: Info
    },
    warning: {
      bg: '#F59E0B',
      icon: AlertTriangle
    }
  };

  const config = styles[type] || styles.info;
  const Icon = config.icon;

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 120);
  };

  return (
    <div
      className={isExiting ? 'toast-exit' : 'toast-enter'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: config.bg,
        color: '#FFFFFF',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        minHeight: '48px'
      }}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${type === 'success' ? 'success-pulse' : ''}`} />
      <span style={{
        flex: 1,
        fontSize: '14px',
        fontWeight: '600',
        lineHeight: '1.4'
      }}>
        {message}
      </span>
      <button
        onClick={handleClose}
        className="btn-interaction"
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.9,
          transition: 'opacity 0.2s'
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}