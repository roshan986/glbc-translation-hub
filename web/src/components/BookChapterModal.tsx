import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CANONICAL_BOOKS } from '../services/kjvService';
import type { BibleBookMeta } from '../services/kjvService';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [mobileTab, setMobileTab] = useState<'books' | 'chapters'>('chapters');
  const [selectedBookName, setSelectedBookName] = useState<string>(currentBook);
  const [activeTestament, setActiveTestament] = useState<'NT' | 'OT'>(() => {
    const meta = CANONICAL_BOOKS.find((b) => b.name.toLowerCase() === currentBook.toLowerCase());
    return meta?.testament === 'OT' ? 'OT' : 'NT';
  });
  const activeBookRef = useRef<HTMLButtonElement>(null);
  const booksContainerRef = useRef<HTMLDivElement>(null);

  // Sync with currentBook prop when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedBookName(currentBook);
      setMobileTab('chapters');
      const meta = CANONICAL_BOOKS.find((b) => b.name.toLowerCase() === currentBook.toLowerCase());
      if (meta) {
        setActiveTestament(meta.testament);
      }
    }
  }, [isOpen, currentBook]);

  // Scroll active book into view on open or testament switch
  useEffect(() => {
    if (isOpen && activeBookRef.current && booksContainerRef.current) {
      setTimeout(() => {
        activeBookRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }, [isOpen, activeTestament, mobileTab]);

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
  const displayedBooks = activeTestament === 'NT' ? ntBooks : otBooks;

  const chapters = Array.from({ length: currentMeta.chaptersCount }, (_, i) => i + 1);

  const handleTabSwitch = (testament: 'NT' | 'OT') => {
    setActiveTestament(testament);
    const currentMetaTestament = CANONICAL_BOOKS.find((b) => b.name.toLowerCase() === selectedBookName.toLowerCase())?.testament;
    if (currentMetaTestament !== testament) {
      const firstInTestament = testament === 'NT'
        ? (availableBooks.find((ab) => ntBooks.some((b) => b.name.toLowerCase() === ab.toLowerCase())) || ntBooks[0].name)
        : (availableBooks.find((ab) => otBooks.some((b) => b.name.toLowerCase() === ab.toLowerCase())) || otBooks[0].name);
      setSelectedBookName(firstInTestament);
    }
  };

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
        padding: '0.75rem'
      }}
      onClick={onClose}
    >
      <div
        className="book-chapter-modal-card app-modal-card"
        style={{
          width: '100%',
          maxWidth: isMobile ? '440px' : '560px',
          height: isMobile ? '82vh' : '500px',
          maxHeight: isMobile ? '560px' : '85vh',
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          border: '1px solid var(--theme-border, #e2e8f0)',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile ? (
          /* ════════════════════════════════════════════════════════════════════════
             MOBILE VIEW (Full-width responsive view: Books vs Chapters tabs)
             ════════════════════════════════════════════════════════════════════════ */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Mobile Header: Tab pills [ 📖 Books ] [ 📑 Chapters ] + Close */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderBottom: '1px solid var(--theme-border, #e2e8f0)',
                backgroundColor: 'var(--theme-card-bg, #ffffff)',
                flexShrink: 0,
                gap: '0.5rem'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--theme-box-bg, #f1f5f9)',
                  borderRadius: '0.5rem',
                  padding: '3px',
                  gap: '3px',
                  flex: 1,
                  maxWidth: '320px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setMobileTab('books')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: mobileTab === 'books' ? 'var(--theme-accent, #2563eb)' : 'transparent',
                    color: mobileTab === 'books' ? '#ffffff' : 'var(--theme-text-muted, #64748b)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📖 Books
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('chapters')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: mobileTab === 'chapters' ? 'var(--theme-accent, #2563eb)' : 'transparent',
                    color: mobileTab === 'chapters' ? '#ffffff' : 'var(--theme-text-muted, #64748b)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  📑 Chapters ({selectedBookName})
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Body: Books List OR Chapters Grid */}
            {mobileTab === 'books' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  overflow: 'hidden',
                  padding: '0.65rem 0.85rem'
                }}
              >
                {/* Testament Switcher NT / OT */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '0.65rem',
                    flexShrink: 0
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('NT')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: '1px solid var(--theme-border, #e2e8f0)',
                      backgroundColor: activeTestament === 'NT' ? 'var(--theme-accent, #2563eb)' : 'var(--theme-box-bg, #f8fafc)',
                      color: activeTestament === 'NT' ? '#ffffff' : 'var(--theme-text, #334155)',
                      cursor: 'pointer'
                    }}
                  >
                    New Testament (27)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('OT')}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      border: '1px solid var(--theme-border, #e2e8f0)',
                      backgroundColor: activeTestament === 'OT' ? 'var(--theme-accent, #2563eb)' : 'var(--theme-box-bg, #f8fafc)',
                      color: activeTestament === 'OT' ? '#ffffff' : 'var(--theme-text, #334155)',
                      cursor: 'pointer'
                    }}
                  >
                    Old Testament (39)
                  </button>
                </div>

                {/* Scrollable Books List (Full readable names, no truncation!) */}
                <div
                  ref={booksContainerRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingRight: '2px'
                  }}
                >
                  {displayedBooks.map((b) => {
                    const isSelected = b.name.toLowerCase() === selectedBookName.toLowerCase();
                    const hasSheet = availableBooks.some((ab) => ab.toLowerCase() === b.name.toLowerCase());
                    return (
                      <button
                        key={b.slug}
                        ref={isSelected ? activeBookRef : null}
                        type="button"
                        onClick={() => {
                          setSelectedBookName(b.name);
                          setMobileTab('chapters');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '0.5rem',
                          border: isSelected ? '1px solid #2563eb' : '1px solid var(--theme-border, #f1f5f9)',
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--theme-box-bg, #f8fafc)',
                          color: isSelected ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text, #0f172a)',
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{b.name}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #94a3b8)', fontWeight: 500 }}>
                            {b.chaptersCount} ch
                          </span>
                        </div>
                        {hasSheet && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* If mobileTab === 'chapters': Full-width Chapter Grid */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  overflow: 'hidden',
                  padding: '0.75rem 0.85rem'
                }}
              >
                {/* Selected Book Banner with "Change Book" link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid var(--theme-border, #f1f5f9)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--theme-text, #0f172a)' }}>
                        {currentMeta.name}
                      </h3>
                      {availableBooks.some((ab) => ab.toLowerCase() === currentMeta.name.toLowerCase()) && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}
                        >
                          Active Translation
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #94a3b8)' }}>
                      {currentMeta.chaptersCount} chapters · {currentMeta.testament === 'NT' ? 'New Testament' : 'Old Testament'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileTab('books')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--theme-accent, #2563eb)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)'
                    }}
                  >
                    Change Book
                  </button>
                </div>

                {/* 5-column Chapter Grid */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '2px'
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
                          type="button"
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
                            border: isCurrent ? '2px solid #2563eb' : '1px solid var(--theme-border, #e2e8f0)',
                            backgroundColor: isCurrent ? '#2563eb' : 'var(--theme-box-bg, #f8fafc)',
                            color: isCurrent ? '#ffffff' : 'var(--theme-text, #0f172a)',
                            fontSize: '0.9375rem',
                            fontWeight: isCurrent ? 800 : 600,
                            cursor: 'pointer'
                          }}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════════════════
             DESKTOP / TABLET VIEW (Side-by-side Dual Pane Layout)
             ════════════════════════════════════════════════════════════════════════ */
          <>
            {/* Left Panel: Books List */}
            <div
              className="book-modal-sidebar"
              style={{
                width: '190px',
                borderRight: '1px solid var(--theme-border, #f1f5f9)',
                background: 'var(--theme-box-bg, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '0.75rem 0.4rem',
                flexShrink: 0
              }}
            >
              {/* Segmented Testament Switcher: [ NT ] [ OT ] */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '0 0.25rem 0.5rem 0.25rem',
                  borderBottom: '1px solid var(--theme-border, #f1f5f9)',
                  marginBottom: '0.4rem',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTabSwitch('NT')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    border: 'none',
                    backgroundColor: activeTestament === 'NT' ? 'var(--theme-accent, #2563eb)' : 'transparent',
                    color: activeTestament === 'NT' ? '#ffffff' : 'var(--theme-text-muted, #94a3b8)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  NT
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('OT')}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    border: 'none',
                    backgroundColor: activeTestament === 'OT' ? 'var(--theme-accent, #2563eb)' : 'transparent',
                    color: activeTestament === 'OT' ? '#ffffff' : 'var(--theme-text-muted, #94a3b8)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  OT
                </button>
              </div>

              {/* Scrollable Books List */}
              <div
                ref={booksContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  paddingRight: '2px'
                }}
              >
                {displayedBooks.map((b) => {
                  const isSelected = b.name.toLowerCase() === selectedBookName.toLowerCase();
                  const hasSheet = availableBooks.some((ab) => ab.toLowerCase() === b.name.toLowerCase());
                  return (
                    <button
                      key={b.slug}
                      ref={isSelected ? activeBookRef : null}
                      type="button"
                      onClick={() => setSelectedBookName(b.name)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.55rem',
                        borderRadius: '0.45rem',
                        border: 'none',
                        backgroundColor: isSelected ? '#2563eb' : 'transparent',
                        color: isSelected ? '#ffffff' : 'var(--theme-text, #334155)',
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease',
                        marginBottom: '2px',
                        gap: '0.35rem'
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {b.name}
                      </span>
                      {hasSheet && (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#ffffff' : '#10b981',
                            boxShadow: isSelected ? '0 0 4px rgba(255,255,255,0.8)' : '0 0 5px rgba(16, 185, 129, 0.7)',
                            flexShrink: 0
                          }}
                          title="Live translation active"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Book Header & Chapter Grid */}
            <div
              className="book-modal-content"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--theme-card-bg, #ffffff)',
                color: 'var(--theme-text, #0f172a)',
                padding: '1.25rem',
                minWidth: 0
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid var(--theme-border, #f1f5f9)'
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme-text, #0f172a)' }}>
                      {currentMeta.name}
                    </h2>
                    {availableBooks.some((ab) => ab.toLowerCase() === currentMeta.name.toLowerCase()) && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
                          display: 'inline-block',
                          flexShrink: 0
                        }}
                        title="Active translation sheet"
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #94a3b8)' }}>
                    {currentMeta.chaptersCount} chapters · {currentMeta.testament === 'NT' ? 'New Testament' : 'Old Testament'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--theme-text-muted, #94a3b8)',
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
                  className="chapter-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(2.4rem, 1fr))',
                    gap: '0.45rem'
                  }}
                >
                  {chapters.map((ch) => {
                    const isCurrent =
                      currentMeta.name.toLowerCase() === currentBook.toLowerCase() && ch === currentChapter;
                    return (
                      <button
                        key={ch}
                        type="button"
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
                          border: isCurrent ? '2px solid #2563eb' : '1px solid var(--theme-border, #e2e8f0)',
                          backgroundColor: isCurrent ? '#2563eb' : 'var(--theme-box-bg, #f8fafc)',
                          color: isCurrent ? '#ffffff' : 'var(--theme-text, #0f172a)',
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
          </>
        )}
      </div>
    </div>
  );
};
