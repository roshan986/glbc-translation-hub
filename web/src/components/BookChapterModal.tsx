import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CANONICAL_BOOKS } from '../services/kjvService';
import type { BibleBookMeta } from '../services/kjvService';

interface BookChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: string;
  currentChapter: number;
  onSelect: (book: string, chapter: number) => void;
  availableBooks?: string[];
}

export const BookChapterModal: React.FC<BookChapterModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onSelect,
  availableBooks = []
}) => {
  const [selectedBookName, setSelectedBookName] = useState<string>(currentBook);
  const activeBookRef = useRef<HTMLButtonElement>(null);
  const booksContainerRef = useRef<HTMLDivElement>(null);

  // Sync with currentBook prop when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedBookName(currentBook);
    }
  }, [isOpen, currentBook]);

  // Scroll active book into view on open
  useEffect(() => {
    if (isOpen && activeBookRef.current && booksContainerRef.current) {
      setTimeout(() => {
        activeBookRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMeta: BibleBookMeta =
    CANONICAL_BOOKS.find((b) => b.name.toLowerCase() === selectedBookName.toLowerCase()) ||
    CANONICAL_BOOKS.find((b) => b.name === 'Romans') ||
    CANONICAL_BOOKS[44]; // Romans

  const otBooks = CANONICAL_BOOKS.filter((b) => b.testament === 'OT');
  const ntBooks = CANONICAL_BOOKS.filter((b) => b.testament === 'NT');

  const chapters = Array.from({ length: currentMeta.chaptersCount }, (_, i) => i + 1);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="app-modal-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          height: '520px',
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          overflow: 'hidden',
          border: '1px solid var(--theme-border, #e2e8f0)',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel: Books List */}
        <div
          ref={booksContainerRef}
          style={{
            width: '210px',
            borderRight: '1px solid var(--theme-border, #f1f5f9)',
            background: 'var(--theme-box-bg, #ffffff)',
            overflowY: 'auto',
            padding: '1rem 0.5rem',
            scrollbarWidth: 'thin'
          }}
        >
          {/* New Testament first since translation is NT-focused */}
          <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
            NEW TESTAMENT
          </div>
          {ntBooks.map((b) => {
            const isSelected = b.name.toLowerCase() === selectedBookName.toLowerCase();
            const hasSheet = availableBooks.some((ab) => ab.toLowerCase() === b.name.toLowerCase());
            return (
              <button
                key={b.slug}
                ref={isSelected ? activeBookRef : null}
                onClick={() => setSelectedBookName(b.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: isSelected ? '#2563eb' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--theme-text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  marginBottom: '2px',
                  gap: '0.35rem'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                {hasSheet && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.25rem',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : '#dcfce7',
                      color: isSelected ? '#a7f3d0' : '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0
                    }}
                    title="Live Google Sheet connected"
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? '#34d399' : '#16a34a' }} />
                    Active
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ padding: '0.75rem 0.75rem 0.25rem 0.75rem', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', letterSpacing: '0.05em', borderTop: '1px solid var(--theme-border)', marginTop: '0.5rem' }}>
            OLD TESTAMENT
          </div>
          {otBooks.map((b) => {
            const isSelected = b.name.toLowerCase() === selectedBookName.toLowerCase();
            const hasSheet = availableBooks.some((ab) => ab.toLowerCase() === b.name.toLowerCase());
            return (
              <button
                key={b.slug}
                ref={isSelected ? activeBookRef : null}
                onClick={() => setSelectedBookName(b.name)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: isSelected ? '#2563eb' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--theme-text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  marginBottom: '2px',
                  gap: '0.35rem'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                {hasSheet && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.35rem',
                      borderRadius: '0.25rem',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : '#dcfce7',
                      color: isSelected ? '#a7f3d0' : '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      flexShrink: 0
                    }}
                    title="Live Google Sheet connected"
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isSelected ? '#34d399' : '#16a34a' }} />
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Panel: Book Header & Chapter Grid */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--theme-card-bg, #ffffff)',
            color: 'var(--theme-text, #0f172a)',
            padding: '1.25rem'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--theme-border, #f1f5f9)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--theme-text, #0f172a)' }}>
                  {currentMeta.name}
                </h2>
                {availableBooks.some((ab) => ab.toLowerCase() === currentMeta.name.toLowerCase()) ? (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    Active Translation
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8'
                    }}
                  >
                    Reference &amp; Study Mode
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {currentMeta.chaptersCount} chapters · {currentMeta.testament === 'NT' ? 'New Testament' : 'Old Testament'}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              aria-label="Close chapter selector"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chapter Buttons Grid */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              paddingRight: '0.25rem'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem'
              }}
            >
              {chapters.map((ch) => {
                const isCurrent =
                  currentMeta.name.toLowerCase() === currentBook.toLowerCase() && ch === currentChapter;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      onSelect(currentMeta.name, ch);
                      onClose();
                    }}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '0.5rem',
                      border: isCurrent ? '2px solid #2563eb' : '1px solid var(--theme-border)',
                      backgroundColor: isCurrent ? '#2563eb' : 'var(--theme-box-bg)',
                      color: isCurrent ? '#ffffff' : 'var(--theme-text)',
                      fontSize: '0.9375rem',
                      fontWeight: isCurrent ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.backgroundColor = 'var(--theme-card-bg)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.backgroundColor = 'var(--theme-box-bg)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
