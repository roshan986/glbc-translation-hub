import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  userEmail: string;
  userName?: string;
  onConfirmPin: (pin: string) => boolean;
  onContinueAsRegular: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  userEmail,
  userName,
  onConfirmPin,
  onContinueAsRegular
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter your admin PIN');
      return;
    }
    const success = onConfirmPin(pin.trim());
    if (!success) {
      setError('Invalid PIN. Please try again.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pin-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '26rem',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 24px rgba(59, 130, 246, 0.15)',
          padding: '1.75rem',
          color: '#f8fafc',
          animation: 'fadeInScale 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 id="admin-pin-title" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Admin Verification
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '0.125rem 0 0' }}>
              Welcome back, <strong style={{ color: '#e2e8f0' }}>{userName || userEmail}</strong>
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Enter your secret admin passphrase to unlock <strong>Super Admin</strong> mode across all roles, books, and permissions.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="text"
                autoCapitalize="none"
                autoComplete="off"
                maxLength={40}
                placeholder="Enter admin secret..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                  fontSize: '0.9375rem',
                  letterSpacing: showPin ? 'normal' : '0.1em',
                  borderRadius: '0.625rem',
                  backgroundColor: '#1e293b',
                  border: error ? '1px solid #ef4444' : '1px solid #334155',
                  color: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  color: '#f87171',
                  fontSize: '0.8125rem',
                  marginTop: '0.5rem'
                }}
              >
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'background-color 0.15s ease'
              }}
            >
              <ShieldCheck size={18} />
              Confirm Super Admin
            </button>

            <button
              type="button"
              onClick={onContinueAsRegular}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#94a3b8',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Continue as Regular Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
