import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface ChapterBarProps {
  currentBook?: string;
  totalChapters?: number;
  currentChapter: number;
  onSelectChapter: (chapter: number) => void;
  onOpenPicker?: () => void;
}

export const ChapterBar: React.FC<ChapterBarProps> = ({
  currentBook = 'Romans',
  totalChapters = 16,
  currentChapter,
  onSelectChapter,
  onOpenPicker
}) => {
  return (
    <div
      className="subbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.625rem',
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--theme-card-bg)',
        borderBottom: '1px solid var(--theme-border)'
      }}
    >
      {/* Sleek Cohesive Navigation Capsule */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          backgroundColor: 'var(--theme-box-bg)',
          borderRadius: '9999px',
          padding: '0.25rem',
          border: '1px solid var(--theme-border)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Quick Step: Previous Chapter */}
        <button
          type="button"
          onClick={() => onSelectChapter(Math.max(1, currentChapter - 1))}
          disabled={currentChapter <= 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentChapter <= 1 ? 'var(--theme-border)' : 'var(--theme-text-muted)',
            cursor: currentChapter <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Previous chapter"
          aria-label="Previous chapter"
          onMouseEnter={(e) => {
            if (currentChapter > 1) {
              e.currentTarget.style.backgroundColor = 'var(--theme-card-bg)';
              e.currentTarget.style.color = 'var(--theme-text)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = currentChapter <= 1 ? 'var(--theme-border)' : 'var(--theme-text-muted)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Centered Active Location Pill (Click opens Book & Chapter Picker) */}
        <button
          type="button"
          onClick={onOpenPicker}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--theme-card-bg)',
            color: 'var(--theme-text)',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: '1px solid var(--theme-border)',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease'
          }}
          title="Change Book & Chapter"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--theme-border-subtle, var(--theme-border))';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--theme-border)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
          }}
        >
          <BookOpen size={15} color="#0284c7" />
          <span>{currentBook} {currentChapter}</span>
          <ChevronDown size={13} color="var(--theme-text-muted)" />
        </button>

        {/* Quick Step: Next Chapter */}
        <button
          type="button"
          onClick={() => onSelectChapter(Math.min(totalChapters, currentChapter + 1))}
          disabled={currentChapter >= totalChapters}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentChapter >= totalChapters ? 'var(--theme-border)' : 'var(--theme-text-muted)',
            cursor: currentChapter >= totalChapters ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Next chapter"
          aria-label="Next chapter"
          onMouseEnter={(e) => {
            if (currentChapter < totalChapters) {
              e.currentTarget.style.backgroundColor = 'var(--theme-card-bg)';
              e.currentTarget.style.color = 'var(--theme-text)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.06)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = currentChapter >= totalChapters ? 'var(--theme-border)' : 'var(--theme-text-muted)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
