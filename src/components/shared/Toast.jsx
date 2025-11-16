import React, { createContext, useContext, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

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

  const addToast = (message, type = 'info', duration = type === 'success' ? 2000 : 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, options = {}) => addToast(message, 'success', options.duration || 2000),
    error: (message, options = {}) => addToast(message, 'error', options.duration || 4000),
    info: (message, options = {}) => addToast(message, 'info', options.duration || 4000),
    warning: (message, options = {}) => addToast(message, 'warning', options.duration || 4000),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '90vw', width: 'auto' }}
    >
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const Toast = ({ id, message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bg: '#10B981',
      text: '#FFFFFF'
    },
    error: {
      icon: XCircle,
      bg: '#EF4444',
      text: '#FFFFFF'
    },
    warning: {
      icon: AlertTriangle,
      bg: '#F59E0B',
      text: '#FFFFFF'
    },
    info: {
      icon: Info,
      bg: '#3B82F6',
      text: '#FFFFFF'
    }
  };

  const { icon: Icon, bg, text } = config[type] || config.info;

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
      style={{
        backgroundColor: bg,
        color: text,
        minWidth: '280px',
        maxWidth: '400px',
        animation: isExiting ? 'slideOutRight 0.3s ease-out' : 'slideInRight 0.3s ease-out'
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};