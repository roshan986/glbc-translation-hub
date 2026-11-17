import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { getAppsScriptUrl, setAppsScriptUrl, testConnection, syncProtectionsApi } from '../services/api';

interface ConnectionModalProps {
  onClose: () => void;
  onConnected: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ onClose, onConnected }) => {
  const [url, setUrl] = useState<string>(getAppsScriptUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncingProtections, setSyncingProtections] = useState<boolean>(false);

  const handleSyncProtections = async () => {
    setSyncingProtections(true);
    setTestResult(null);
    const res = await syncProtectionsApi();
    setSyncingProtections(false);
    if (res.success) {
      setTestResult({ success: true, message: res.message || 'Column protections successfully synced across sheets!' });
    } else {
      setTestResult({ success: false, message: res.error || 'Failed to sync column protections.' });
    }
  };

  const handleTestAndSave = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid Google Apps Script Web App URL' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await testConnection(url.trim());
    setTesting(false);

    if (res.success) {
      setAppsScriptUrl(url.trim());
      setTestResult({
        success: true,
        message: `Connected successfully! Found books: ${res.books?.join(', ')}`
      });
      setTimeout(() => {
        onConnected();
        onClose();
      }, 1200);
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Failed to connect. Check permissions and URL.'
      });
    }
  };

  const handleUseDemo = () => {
    setAppsScriptUrl('');
    setUrl('');
    setTestResult({ success: true, message: 'Switched back to Demo Mode (Sample Data)' });
    setTimeout(() => {
      onConnected();
      onClose();
    }, 800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="app-modal-card"
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '0.75rem',
          maxWidth: '36rem',
          width: '100%',
          padding: '1.5rem',
          boxShadow: 'var(--theme-card-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
          border: '1px solid var(--theme-border, #cbd5e1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <Database size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)', margin: 0 }}>
                Google Sheet Connection
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)', margin: '0.15rem 0 0' }}>
                Connect this UI directly to your live Google Sheet database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--theme-text-muted, #94a3b8)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status banner */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: url ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${url ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {url ? (
            <>
              <CheckCircle2 size={16} color="#34d399" />
              <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 600 }}>
                Target Endpoint Configured
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={16} color="#fbbf24" />
              <span style={{ fontSize: '0.8125rem', color: '#fbbf24', fontWeight: 600 }}>
                Currently in Demo Mode (Local Sample Data)
              </span>
            </>
          )}
        </div>

        {/* Input form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
            Google Apps Script Web App URL:
          </label>
          <input
            type="text"
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border, #cbd5e1)',
              background: 'var(--theme-box-bg, #ffffff)',
              color: 'var(--theme-text, #0f172a)',
              fontSize: '0.8125rem',
              outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #64748b)' }}>
            Saved directly to browser memory. No server restarts needed.
          </span>
        </div>

        {testResult && (
          <div
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
              color: testResult.success ? '#15803d' : '#991b1b',
              fontWeight: 500
            }}
          >
            {testResult.message}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={handleTestAndSave}
            disabled={testing}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: testing ? 'not-allowed' : 'pointer'
            }}
          >
            {testing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            <span>{testing ? 'Testing Connection...' : 'Connect & Fetch Live Data'}</span>
          </button>

          <button
            onClick={handleSyncProtections}
            disabled={syncingProtections}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              borderRadius: '0.375rem',
              border: '1px solid #a7f3d0',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: syncingProtections ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
            title="Re-sync native Google Sheets column edit protections based on active members in ⚙ Config"
          >
            <ShieldCheck size={14} color="#059669" />
            <span>{syncingProtections ? 'Syncing...' : 'Sync Protections'}</span>
          </button>

          <button
            onClick={handleUseDemo}
            style={{
              padding: '0.625rem 1rem',
              backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
              color: 'var(--theme-text-muted, #475569)',
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border, #cbd5e1)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset to Demo
          </button>
        </div>

        {/* 4-Step Instructions */}
        <div
          style={{
            borderTop: '1px solid var(--theme-border, #e2e8f0)',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text, #0f172a)' }}>
            📋 HOW TO GET THIS URL FROM YOUR GOOGLE SHEET:
          </b>
          <ol style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #475569)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            <li>
              In your Google Sheet, open <b>Extensions &gt; Apps Script</b>.
            </li>
            <li>
              Ensure <code>Code.gs</code> has the latest code (from <code>AppScript/Code.gs</code>).
            </li>
            <li>
              Click the blue <b>Deploy &gt; New deployment</b> button (top right).
            </li>
            <li>
              Select type: <b>Web app</b>. Set <i>Execute as:</i> <b>Me</b>, and <i>Who has access:</i> <b>Anyone</b>.
            </li>
            <li>
              Click <b>Deploy</b>, authorize permissions, and copy the <b>Web app URL</b> (ends in <code>/exec</code>).
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
