import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { ToastMessage } from '../utils/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.duration || 3500);
    };

    window.addEventListener('glbc-toast', handleToastEvent);
    return () => window.removeEventListener('glbc-toast', handleToastEvent);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '380px',
        width: 'calc(100vw - 2rem)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const bg = isSuccess
          ? '#065f46'
          : isError
          ? '#991b1b'
          : isWarning
          ? '#92400e'
          : '#1e3a8a';

        const border = isSuccess
          ? '#059669'
          : isError
          ? '#dc2626'
          : isWarning
          ? '#d97706'
          : '#3b82f6';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              backgroundColor: bg,
              color: '#ffffff',
              border: `1px solid ${border}`,
              borderRadius: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              fontSize: '0.8125rem',
              lineHeight: 1.4,
              fontWeight: 500,
              animation: 'slideInToast 0.2s ease-out'
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
              {isSuccess && <CheckCircle2 size={16} color="#6ee7b7" />}
              {isError && <XCircle size={16} color="#fca5a5" />}
              {isWarning && <AlertTriangle size={16} color="#fcd34d" />}
              {!isSuccess && !isError && !isWarning && <Info size={16} color="#93c5fd" />}
            </div>
            <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '0.1rem',
                marginLeft: '0.25rem',
                display: 'flex',
                alignItems: 'center'
              }}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
