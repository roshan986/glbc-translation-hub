import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          border: '1px solid var(--theme-border)',
          borderRadius: '0.75rem',
          maxWidth: '34rem',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--theme-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', padding: '0.5rem', borderRadius: '0.5rem' }}>
              <Keyboard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                Keyboard Shortcuts & Guide
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                Review with maximum speed and zero wrist strain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>REVIEWER SHORTCUTS</b>
          {[
            { key: 'Y / Enter', desc: 'Approve current verse for your active role' },
            { key: 'Space / →', desc: 'Skip to next verse without confirming' },
            { key: '←', desc: 'Return to previous verse' },
            { key: 'J', desc: 'Open visual verse jump grid' },
            { key: 'E', desc: 'Focus comment box to suggest an edit' },
            { key: 'Ctrl + Enter', desc: 'Submit comment and write to Sheets' },
            { key: 'A⁻ / A⁺', desc: 'Scale Kannada text size (16px – 36px)' }
          ].map((sc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.375rem 0.5rem',
                backgroundColor: 'var(--theme-box-bg)',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem'
              }}
            >
              <span style={{ color: 'var(--theme-text)' }}>{sc.desc}</span>
              <span className="keycap">{sc.key}</span>
            </div>
          ))}
        </div>

        {/* Translation Workflow Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>STAGE PROGRESSION</b>
          <div style={{ fontSize: '0.8125rem', color: 'var(--theme-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div>🔴 <b>Not Started</b>: Proposed text empty or Drafter not confirmed.</div>
            <div>🟡 <b>Awaiting Review</b>: Drafter confirmed ("Y"); ready for 4 reviewers.</div>
            <div>🟡 <b>Under Review</b>: 1 to 3 reviewers confirmed ("Y").</div>
            <div>🟡 <b>Awaiting Committee</b>: All 4 reviewers confirmed; awaiting committee.</div>
            <div>🟡 <b>Needs Final</b>: Committee confirmed; awaiting Final Editor.</div>
            <div>✅ <b>Done</b>: Final reading present and confirmed ("Y"). Locked!</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
};
