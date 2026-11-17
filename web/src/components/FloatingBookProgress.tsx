import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, X, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface FloatingBookProgressProps {
  book: string;
  completedVerses: number;
  totalVerses: number;
  isOpen: boolean;
  onClose: () => void;
}

export const FloatingBookProgress: React.FC<FloatingBookProgressProps> = ({
  book,
  completedVerses,
  totalVerses,
  isOpen,
  onClose
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(6);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const percent = totalVerses > 0 ? Math.round((completedVerses / totalVerses) * 100) : 0;
  const remainingVerses = Math.max(0, totalVerses - completedVerses);

  // Auto-close countdown timer with hover pause
  useEffect(() => {
    if (!isOpen) return;

    setSecondsRemaining(6);

    const interval = setInterval(() => {
      if (!isHovered) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    timerRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, isHovered, book]);

  if (!isOpen) return null;

  return (
    <div
      className="floating-book-progress-blast"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9990,
        width: '320px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        borderRadius: '1rem',
        padding: '1.15rem 1.25rem',
        boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.4), 0 0 25px rgba(59, 130, 246, 0.45)',
        border: '1px solid rgba(96, 165, 250, 0.4)',
        animation: 'blastEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}
          >
            <BookOpen size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff' }}>
                {book.toUpperCase()}
              </span>
              <Sparkles size={13} color="#f59e0b" />
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: percent >= 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: percent >= 100 ? '#34d399' : '#93c5fd',
                  border: `1px solid ${percent >= 100 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`
                }}
              >
                {percent}% Done
              </span>
            </div>
            <small style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', marginTop: '1px' }}>
              KJV Kannada Translation
            </small>
          </div>
        </div>

        {/* Close Button & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span
            style={{
              fontSize: '0.625rem',
              color: '#64748b',
              padding: '0.1rem 0.35rem',
              borderRadius: '0.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}
            title={isHovered ? 'Paused on hover' : `Auto-closing in ${secondsRemaining}s`}
          >
            {isHovered ? 'Paused' : `${secondsRemaining}s`}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close book progress notification"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.2rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div
        style={{
          height: '0.45rem',
          backgroundColor: '#1e293b',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #2563eb, #10b981)',
            borderRadius: '9999px',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </div>

      {/* Quick Status Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          fontSize: '0.75rem',
          paddingTop: '0.4rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a7f3d0' }}>
          <CheckCircle2 size={13} color="#10b981" />
          <span><b>{completedVerses}</b> Done</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1' }}>
          <Clock size={13} color="#94a3b8" />
          <span><b>{remainingVerses}</b> Remaining</span>
        </div>
      </div>
    </div>
  );
};
