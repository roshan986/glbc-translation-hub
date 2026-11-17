import React, { useState } from 'react';
import type { VerseItem, TeamMember } from '../types';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface ReviewQueueProps {
  verses: VerseItem[];
  currentUser: TeamMember;
  onSelectVerse: (verse: VerseItem) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  verses,
  currentUser,
  onSelectVerse
}) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  // Determine if this verse needs review by currentUser
  const isPendingForUser = (v: VerseItem): boolean => {
    const role = currentUser.role.toLowerCase();
    if (role.includes('tech')) return !v.confirms.tech;
    if (role.includes('style')) return !v.confirms.style;
    if (role.includes('ortho')) return !v.confirms.ortho;
    if (role.includes('theo')) return !v.confirms.theo;
    if (role.includes('comm')) return !v.confirms.comm;
    if (role.includes('final')) return !v.confirms.final;
    return false;
  };

  const filteredVerses = verses.filter((v) => {
    if (filter === 'pending') {
      return isPendingForUser(v) && v.status !== 'Done';
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            PERSONAL TASK INBOX
          </div>
          <h1>My Review Queue</h1>
          <p>
            Showing verses awaiting <b>{currentUser.role}</b> action by <b>{currentUser.name}</b>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`subtle-button ${filter === 'pending' ? 'selected' : ''}`}
            onClick={() => setFilter('pending')}
            style={{
              backgroundColor: filter === 'pending' ? '#eff6ff' : '#ffffff',
              color: filter === 'pending' ? '#1d4ed8' : '#64748b',
              fontWeight: 600
            }}
          >
            Pending ({verses.filter(isPendingForUser).length})
          </button>
          <button
            className={`subtle-button ${filter === 'all' ? 'selected' : ''}`}
            onClick={() => setFilter('all')}
            style={{
              backgroundColor: filter === 'all' ? '#eff6ff' : '#ffffff',
              color: filter === 'all' ? '#1d4ed8' : '#64748b',
              fontWeight: 600
            }}
          >
            All Verses ({verses.length})
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredVerses.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              color: '#64748b'
            }}
          >
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
              All Caught Up!
            </h3>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--theme-text-muted)' }}>
              No verses currently awaiting {currentUser.role} confirmation.
            </p>
          </div>
        ) : (
          filteredVerses.map((v) => {
            const pending = isPendingForUser(v);
            return (
              <div
                key={v.row}
                className="review-queue-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--theme-card-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.75rem',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                    <b style={{ fontSize: '1rem', color: 'var(--theme-text)' }}>{v.verse}</b>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: pending ? '#dbeafe' : '#d1fae5',
                        color: pending ? '#1e40af' : '#065f46'
                      }}
                    >
                      {pending ? 'Needs Your Review' : 'Reviewed'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {v.lastEdited}
                    </span>
                  </div>

                  <p
                    className="kannada-text"
                    lang="kn"
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--theme-text)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {v.proposed}
                  </p>
                </div>

                <button
                  className="approve-button"
                  onClick={() => onSelectVerse(v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>Review Verse</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
