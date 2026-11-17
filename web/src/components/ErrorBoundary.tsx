import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GLBC App Crash caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('glbc_bundle_Romans_1');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--theme-canvas-bg, #020617)',
            color: 'var(--theme-text, #f8fafc)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--theme-text, #f8fafc)' }}>
              {this.props.fallbackTitle || 'Something interrupted this view'}
            </h2>

            <p style={{ fontSize: '0.8125rem', color: 'var(--theme-text-muted, #94a3b8)', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              The application encountered an unexpected state. You can reload the view or clear temporary cache to restore standard operation.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: 'var(--theme-box-bg, #142037)',
                  border: '1px solid var(--theme-border, #1e293b)',
                  borderRadius: '0.375rem',
                  padding: '0.625rem',
                  fontSize: '0.6875rem',
                  fontFamily: 'monospace',
                  color: '#f87171',
                  textAlign: 'left',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  marginBottom: '1.25rem',
                  wordBreak: 'break-word'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Reload View</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: 'var(--theme-box-bg, #142037)',
                  color: 'var(--theme-text-muted, #94a3b8)',
                  border: '1px solid var(--theme-border, #1e293b)',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
