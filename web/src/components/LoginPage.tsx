import React from 'react';
import { BookOpen, AlertCircle, LogIn, ShieldAlert, RefreshCw } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

interface LoginPageProps {
  onSignInWithGoogle: () => void;
  isLoading: boolean;
  error: string | null;
  unregisteredEmail: string | null;
  onClearError: () => void;
  onBypassForDemo?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSignInWithGoogle,
  isLoading,
  error,
  unregisteredEmail,
  onClearError,
  onBypassForDemo
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b1120',
        backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(37, 99, 235, 0.25), transparent)',
        padding: '1.25rem',
        boxSizing: 'border-box',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(37, 99, 235, 0.1)',
          padding: '2.5rem 2rem',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        {/* Church & Hub Emblem */}
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '1rem',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.3)'
          }}
        >
          <BookOpen size={32} />
        </div>

        {/* Title & Organization */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 0.375rem 0',
              color: '#ffffff'
            }}
          >
            GLBC <span style={{ color: '#60a5fa', fontWeight: 600 }}>Translation Hub</span>
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.02em',
              margin: '0 0 0.5rem 0',
              textTransform: 'uppercase'
            }}
          >
            Gospel Light Baptist Church
          </p>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#64748b',
              margin: 0
            }}
          >
            Kannada Bible Translation & Editorial Workspace
          </p>
        </div>

        {/* Unregistered Account / Access Denied Notice */}
        {unregisteredEmail ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginBottom: '1.75rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '0.5rem' }}>
              <ShieldAlert size={20} />
              <strong style={{ fontSize: '0.9375rem' }}>Access Denied</strong>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', margin: '0 0 0.625rem 0', lineHeight: 1.5 }}>
              Your Google account <strong style={{ color: '#ffffff' }}>{unregisteredEmail}</strong> is not listed as an active member in the translation team directory.
            </p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              Please contact the project coordinator to have your Google email registered in the system.
            </p>
            <button
              onClick={onClearError}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Sign In with a Different Account
            </button>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              color: '#fca5a5',
              fontSize: '0.8125rem',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Primary Action: Sign in with Google */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={onSignInWithGoogle}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontSize: '0.9375rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Demo / Unconfigured Mode Notice */}
        {!isFirebaseConfigured && onBypassForDemo && (
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px dashed #334155',
              borderRadius: '0.625rem',
              padding: '0.875rem',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}
          >
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Firebase credentials not yet provided in <code style={{ color: '#60a5fa' }}>.env</code>.
            </p>
            <button
              onClick={onBypassForDemo}
              style={{
                background: 'none',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                color: '#cbd5e1',
                padding: '0.375rem 0.75rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Continue with Sample / Demo Mode
            </button>
          </div>
        )}

        {/* Discreet Footer */}
        <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
          Authorized translation team members only.
        </p>
      </div>
    </div>
  );
};
