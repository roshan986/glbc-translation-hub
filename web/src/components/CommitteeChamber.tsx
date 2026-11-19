import React, { useState, useMemo } from 'react';
import type { VerseItem, TeamMember } from '../types';
import {
  Users,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  Sparkles,
  BookOpen,
  Send,
  Lock
} from 'lucide-react';
import { generateWhatsAppLink } from '../services/api';
import { parseDrafterComments } from '../utils/drafterParser';
import { showToast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

interface CommitteeChamberProps {
  verses: VerseItem[];
  currentBook: string;
  team: TeamMember[];
  currentUser?: TeamMember;
  onApproveConsensus: (row: number, conclusion: string) => Promise<void>;
  onRequestReReview: (row: number, notes: string) => Promise<void>;
}

type CommitteeFilter = 'awaiting' | 'under_review' | 'all';

export const CommitteeChamber: React.FC<CommitteeChamberProps> = ({
  verses,
  currentBook,
  team,
  currentUser: _currentUser,
  onApproveConsensus,
  onRequestReReview
}) => {
  const { canEdit } = useAuth();
  const isCommitteeEditable = canEdit('committee');
  const [filter, setFilter] = useState<CommitteeFilter>('awaiting');
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0);
  const [conclusionText, setConclusionText] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(18);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter verses
  const awaitingVerses = useMemo(
    () => verses.filter((v) => v.status === 'Awaiting Committee' || (!v.confirms.comm && v.confirms.tech && v.confirms.style && v.confirms.ortho && v.confirms.theo)),
    [verses]
  );

  const underReviewVerses = useMemo(
    () => verses.filter((v) => v.status === 'Under Review' || (!v.confirms.comm && (v.confirms.tech || v.confirms.style || v.confirms.ortho || v.confirms.theo))),
    [verses]
  );

  const displayedVerses = useMemo(() => {
    if (filter === 'awaiting') return awaitingVerses;
    if (filter === 'under_review') return underReviewVerses;
    return verses;
  }, [filter, awaitingVerses, underReviewVerses, verses]);

  const activeVerse: VerseItem | undefined = displayedVerses[selectedVerseIndex] || displayedVerses[0];

  // Parse drafter comments dynamically using identical logic as Focus Mode
  const parsedDrafter = useMemo(() => {
    if (!activeVerse) return { wordPairs: [], notes: [] };
    if (activeVerse.wordPairs && activeVerse.wordPairs.length > 0 && activeVerse.notes && activeVerse.notes.length > 0) {
      return {
        wordPairs: activeVerse.wordPairs,
        notes: activeVerse.notes
      };
    }
    return parseDrafterComments(activeVerse.drafterCmtHtml || activeVerse.drafterCmt || '');
  }, [activeVerse]);

  // Sync conclusion text when active verse changes
  React.useEffect(() => {
    if (activeVerse) {
      setConclusionText(activeVerse.reviews.conclusion || '');
      setActionNotice(null);
    }
  }, [activeVerse]);

  if (!activeVerse) {
    return (
      <div className="empty-chamber-state">
        <Users size={48} color="#94a3b8" />
        <h3>No verses currently awaiting Committee deliberation</h3>
        <p>All verses are either in review by individual disciplines or have already been concluded.</p>
        <button className="btn-secondary" onClick={() => setFilter('all')}>
          View All Verses
        </button>
      </div>
    );
  }

  const isAll4ReviewersApproved =
    activeVerse.confirms.tech &&
    activeVerse.confirms.style &&
    activeVerse.confirms.ortho &&
    activeVerse.confirms.theo;

  // Find final editor to notify
  const finalEditor = team.find((m) => m.role.toLowerCase().includes('final')) || team[0];

  const handleApprove = async () => {
    if (!activeVerse || submitting || !isCommitteeEditable) return;
    setSubmitting(true);
    // If the text in the chamber is identical to the accumulated deliberation history,
    // do not re-send the history to avoid duplicate appending in the cell
    const textToSend = conclusionText.trim() === (activeVerse.reviews.conclusion || '').trim()
      ? ''
      : conclusionText.trim();

    await onApproveConsensus(activeVerse.row, textToSend);
    setSubmitting(false);
    setActionNotice('✅ Committee consensus approved! Verse advanced to "Needs Final".');

    // Auto-advance
    if (selectedVerseIndex < displayedVerses.length - 1) {
      setTimeout(() => setSelectedVerseIndex((i) => i + 1), 600);
    }
  };

  const handleReturnReReview = async () => {
    if (!isCommitteeEditable) return;
    if (!conclusionText.trim()) {
      showToast('warning', 'Please provide guidance notes explaining what needs re-review.');
      return;
    }
    setSubmitting(true);
    await onRequestReReview(activeVerse.row, conclusionText.trim());
    setSubmitting(false);
    setActionNotice('🔄 Returned for re-review with committee guidance notes.');
  };

  const handleCopyProposed = () => {
    setConclusionText(activeVerse.proposed);
  };

  const waLink = generateWhatsAppLink(
    finalEditor?.phone || '919876543216',
    activeVerse.verse,
    currentBook,
    'Needs Final',
    'Final Sign-Off',
    finalEditor?.name || 'Final Editor',
    activeVerse.chapter
  );

  // Helper to render reviewer comments cleanly with bylines
  const renderReviewFindings = (text: string) => {
    if (!text || !text.trim()) {
      return <span className="no-comment">No notes recorded yet</span>;
    }
    const blocks = text.includes('\n\n') ? text.split(/\n\s*\n/) : text.split(/\n/);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', whiteSpace: 'pre-wrap' }}>
        {blocks.map((b, idx) => {
          const m = b.match(/^([A-Za-z0-9\s.]+?):\s*([\s\S]+)$/);
          if (m) {
            const author = m[1].trim();
            const note = m[2].replace(/^\[Request Edit\]\s*[-–:]?\s*/i, '').trim();
            return (
              <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>
                <b style={{ color: 'var(--theme-text)' }}>{author}: </b>
                <span>{note}</span>
              </div>
            );
          }
          const cleanB = b.replace(/^\[Request Edit\]\s*[-–:]?\s*/i, '').trim();
          return (
            <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>
              {cleanB}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="committee-chamber-container">
      {/* Header Bar */}
      <div className="chamber-header">
        <div className="chamber-title-group">
          <div className="chamber-icon-badge">
            <Users size={22} />
          </div>
          <div>
            <h2 className="chamber-title">Committee Consensus Chamber</h2>
            <p className="chamber-subtitle">
              Synthesize 4-reviewer findings into authoritative Kannada translation conclusions.
            </p>
          </div>
        </div>

        {!isCommitteeEditable && (
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.875rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#60a5fa'
            }}
          >
            <Lock size={14} />
            <span><b>Read-Only Observation View:</b> You can view committee consensus deliberations. Confirmations are restricted for your role.</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="chamber-filters">
          <button
            className={`chamber-filter-pill ${filter === 'awaiting' ? 'active' : ''}`}
            onClick={() => {
              setFilter('awaiting');
              setSelectedVerseIndex(0);
            }}
          >
            Awaiting Committee <span className="pill-badge">{awaitingVerses.length}</span>
          </button>
          <button
            className={`chamber-filter-pill ${filter === 'under_review' ? 'active' : ''}`}
            onClick={() => {
              setFilter('under_review');
              setSelectedVerseIndex(0);
            }}
          >
            Under Review <span className="pill-badge">{underReviewVerses.length}</span>
          </button>
          <button
            className={`chamber-filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilter('all');
              setSelectedVerseIndex(0);
            }}
          >
            All Verses <span className="pill-badge">{verses.length}</span>
          </button>
        </div>
      </div>

      {/* Verse Navigation Strip */}
      <div className="chamber-verse-nav">
        <div className="nav-controls">
          <button
            className="chamber-nav-btn"
            disabled={selectedVerseIndex === 0}
            onClick={() => setSelectedVerseIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <div className="verse-counter">
            <span className="current-ref">{activeVerse.verse}</span>
            <span className="nav-index">
              ({selectedVerseIndex + 1} of {displayedVerses.length})
            </span>
          </div>
          <button
            className="chamber-nav-btn"
            disabled={selectedVerseIndex === displayedVerses.length - 1}
            onClick={() => setSelectedVerseIndex((i) => Math.min(displayedVerses.length - 1, i + 1))}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>

        <div className="verse-status-banner">
          <span className={`status-pill status-${activeVerse.status.toLowerCase().replace(/\s+/g, '-')}`}>
            {activeVerse.status}
          </span>
          {isAll4ReviewersApproved ? (
            <span className="pill-ready-consensus">
              <CheckCircle2 size={14} /> All 4 Reviewers Approved
            </span>
          ) : (
            <span className="pill-partial-review">
              <Clock size={14} /> Review in progress
            </span>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="chamber-notice-banner">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)}>✕</button>
        </div>
      )}

      {/* Main Grid: Translation Source vs Committee Matrix */}
      <div className="chamber-grid">
        {/* Left Column: Source Texts & Drafter Back-Translation */}
        <div className="chamber-source-col">
          {/* KJV Source Card */}
          <div className="chamber-card">
            <div className="chamber-card-header">
              <span className="source-label kjv">OLD READING (KJV 1611)</span>
              <BookOpen size={16} color="var(--theme-text-muted)" />
            </div>
            <div className="source-text kjv-text">{activeVerse.oldReading}</div>
          </div>

          {/* Drafter Proposed Kannada Card */}
          <div className="chamber-card">
            <div className="chamber-card-header">
              <span className="source-label proposed">DRAFTER PROPOSED READING (KANNADA)</span>
              <div className="font-controls">
                <button
                  className="font-btn"
                  title="Smaller font"
                  onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                >
                  A⁻
                </button>
                <button
                  className="font-btn"
                  title="Larger font"
                  onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                >
                  A⁺
                </button>
              </div>
            </div>
            <div
              className="source-text proposed-kannada"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{
                __html: activeVerse.proposedHtml || activeVerse.proposed
              }}
            />
          </div>

          {/* Drafter Back-Translation (Word Pairs) */}
          {parsedDrafter.wordPairs.length > 0 && (
            <div className="chamber-card">
              <div className="chamber-card-header">
                <span className="source-label notes">BACK-TRANSLATION (WORD PAIRS)</span>
              </div>
              <div className="word-pairs">
                {parsedDrafter.wordPairs.map((pair, idx) => (
                  <div key={idx} className="word-pair-item">
                    <span
                      lang="kn"
                      className="word-pair-kannada"
                      dangerouslySetInnerHTML={{
                        __html: pair.kannadaHtml || pair.kannada
                      }}
                    />
                    <small
                      className="word-pair-english"
                      dangerouslySetInnerHTML={{
                        __html: pair.englishHtml || pair.english
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drafter Investigation Notes */}
          {parsedDrafter.notes.length > 0 && (
            <div className="chamber-card">
              <div className="chamber-card-header">
                <span className="source-label notes">DRAFTER INVESTIGATION NOTES</span>
              </div>
              <div className="investigation-notes">
                {parsedDrafter.notes.map((note, idx) => (
                  <div key={idx} className="investigation-note">
                    <span className={`note-type ${note.type}`}>
                      <Sparkles size={12} /> {note.title}
                    </span>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: note.html || note.text
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw comments fallback if neither word pairs nor structured notes were found */}
          {parsedDrafter.wordPairs.length === 0 && parsedDrafter.notes.length === 0 && activeVerse.drafterCmt && (
            <div className="chamber-card">
              <div className="chamber-card-header">
                <span className="source-label notes">DRAFTER COMMENTS</span>
              </div>
              <div
                className="drafter-notes-body"
                dangerouslySetInnerHTML={{
                  __html: activeVerse.drafterCmtHtml || activeVerse.drafterCmt
                }}
              />
            </div>
          )}
        </div>

        {/* Right Column: 4 Reviewer Matrix & Committee Consensus Editor */}
        <div className="chamber-review-col">
          {/* 4-Reviewer Findings Matrix */}
          <div className="reviewer-matrix">
            <div className="matrix-title">4-DISCIPLINE REVIEWER FINDINGS</div>
            <div className="matrix-cards-grid">
              {/* Technical */}
              <div className={`matrix-card ${activeVerse.confirms.tech ? 'confirmed' : 'pending'}`}>
                <div className="matrix-card-top">
                  <span className="role-title">Technical</span>
                  {activeVerse.confirms.tech ? (
                    <span className="tag-ok">
                      <CheckCircle2 size={12} /> Y
                    </span>
                  ) : (
                    <span className="tag-wait">Pending</span>
                  )}
                </div>
                <div className="matrix-content">
                  {renderReviewFindings(activeVerse.reviews.tech)}
                </div>
              </div>

              {/* Style & Language */}
              <div className={`matrix-card ${activeVerse.confirms.style ? 'confirmed' : 'pending'}`}>
                <div className="matrix-card-top">
                  <span className="role-title">Style & Language</span>
                  {activeVerse.confirms.style ? (
                    <span className="tag-ok">
                      <CheckCircle2 size={12} /> Y
                    </span>
                  ) : (
                    <span className="tag-wait">Pending</span>
                  )}
                </div>
                <div className="matrix-content">
                  {renderReviewFindings(activeVerse.reviews.style)}
                </div>
              </div>

              {/* Orthographic */}
              <div className={`matrix-card ${activeVerse.confirms.ortho ? 'confirmed' : 'pending'}`}>
                <div className="matrix-card-top">
                  <span className="role-title">Orthographic</span>
                  {activeVerse.confirms.ortho ? (
                    <span className="tag-ok">
                      <CheckCircle2 size={12} /> Y
                    </span>
                  ) : (
                    <span className="tag-wait">Pending</span>
                  )}
                </div>
                <div className="matrix-content">
                  {renderReviewFindings(activeVerse.reviews.ortho)}
                </div>
              </div>

              {/* Theological */}
              <div className={`matrix-card ${activeVerse.confirms.theo ? 'confirmed' : 'pending'}`}>
                <div className="matrix-card-top">
                  <span className="role-title">Theological</span>
                  {activeVerse.confirms.theo ? (
                    <span className="tag-ok">
                      <CheckCircle2 size={12} /> Y
                    </span>
                  ) : (
                    <span className="tag-wait">Pending</span>
                  )}
                </div>
                <div className="matrix-content">
                  {renderReviewFindings(activeVerse.reviews.theo)}
                </div>
              </div>
            </div>
          </div>

          {/* Committee Conclusion Form (Column O & P) */}
          <div className="committee-conclusion-card">
            <div className="conclusion-header">
              <div className="header-left">
                <Sparkles size={18} color="#7c3aed" />
                <div>
                  <span className="conclusion-title">CONCLUDED KANNADA TRANSLATION</span>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                    Authoritative Kannada verse text agreed by Committee for Final Editorial sign-off
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={handleCopyProposed}
                  title="Copy drafter's proposed Kannada reading"
                >
                  <Copy size={14} /> Adopt Proposed
                </button>
              </div>
            </div>

            {/* If cell currently contains chat deliberation notes from previous testing */}
            {conclusionText && /^[A-Za-z0-9\s.]+?:/m.test(conclusionText) && (
              <div style={{
                margin: '0.5rem 1rem 0',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <span>
                  <b>Note:</b> This cell currently contains deliberation chat notes. Click <b>Adopt Proposed</b> to replace with clean Scripture text.
                </span>
                <button
                  type="button"
                  onClick={handleCopyProposed}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Replace with Proposed
                </button>
              </div>
            )}

            <textarea
              className="conclusion-textarea"
              placeholder="Enter authoritative Kannada translation conclusion or adopt drafter reading..."
              value={conclusionText}
              onChange={(e) => setConclusionText(e.target.value)}
              rows={4}
              style={{ fontFamily: "'Noto Sans Kannada', sans-serif", fontSize: '1rem', lineHeight: '1.6' }}
            />

            <div className="conclusion-footer">
              <div className="footer-status">
                {activeVerse.confirms.comm ? (
                  <span className="comm-confirmed-tag">
                    <CheckCircle2 size={14} /> Committee Confirmed (Y)
                  </span>
                ) : (
                  <span className="comm-pending-tag">
                    <Clock size={14} /> Awaiting Committee Sign-off
                  </span>
                )}
              </div>

              <div className="footer-buttons">
                <button
                  type="button"
                  className="btn-return"
                  disabled={submitting}
                  onClick={handleReturnReReview}
                  title="Request reviewers to re-evaluate"
                >
                  <RotateCcw size={15} /> Return for Re-Review
                </button>

                <button
                  type="button"
                  className="btn-approve-consensus"
                  disabled={submitting}
                  onClick={handleApprove}
                >
                  <CheckCircle2 size={16} /> Approve Consensus (Y)
                </button>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-wa-notify"
                  title="Notify Final Editor via WhatsApp"
                >
                  <Send size={15} /> WhatsApp Final Editor
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
