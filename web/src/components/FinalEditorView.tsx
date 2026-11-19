import React, { useState, useMemo } from 'react';
import type { VerseItem, TeamMember } from '../types';
import {
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { parseDrafterComments } from '../utils/drafterParser';
import { showToast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

interface FinalEditorViewProps {
  verses: VerseItem[];
  currentBook: string;
  team?: TeamMember[];
  currentUser?: TeamMember;
  onSubmitFinal: (row: number, finalReading: string, confirm: 'Y' | 'N') => Promise<void>;
}

type FinalFilter = 'needs_final' | 'finalized' | 'all';

export const FinalEditorView: React.FC<FinalEditorViewProps> = ({
  verses,
  currentBook,
  team: _team,
  currentUser: _currentUser,
  onSubmitFinal
}) => {
  const { canEdit } = useAuth();
  const isFinalEditable = canEdit('final');
  const [filter, setFilter] = useState<FinalFilter>('needs_final');
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0);
  const [finalReadingText, setFinalReadingText] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(18);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quality verification checklist state
  const [checklist, setChecklist] = useState({
    faithful: true,
    grammar: true,
    theology: true,
    orthography: true
  });

  const needsFinalVerses = useMemo(
    () => verses.filter((v) => v.status === 'Needs Final' || (!v.confirms.final && v.confirms.comm)),
    [verses]
  );

  const finalizedVerses = useMemo(
    () => verses.filter((v) => v.status === 'Done' || v.confirms.final),
    [verses]
  );

  const displayedVerses = useMemo(() => {
    if (filter === 'needs_final') return needsFinalVerses;
    if (filter === 'finalized') return finalizedVerses;
    return verses;
  }, [filter, needsFinalVerses, finalizedVerses, verses]);

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

  // Sync editor text when active verse changes
  React.useEffect(() => {
    if (activeVerse) {
      // Pre-fill with existing Final reading, or approved Committee conclusion (only if comm confirmed!), or Drafter proposed
      let existing = activeVerse.reviews.final;
      if (!existing && activeVerse.confirms.comm && activeVerse.reviews.conclusion) {
        existing = activeVerse.reviews.conclusion;
      }
      if (!existing) {
        existing = activeVerse.proposed || '';
      }
      setFinalReadingText(existing);
      setActionNotice(null);
    }
  }, [activeVerse]);

  if (!activeVerse) {
    return (
      <div className="empty-chamber-state">
        <Lock size={48} color="#94a3b8" />
        <h3>No verses currently awaiting Final Sign-off</h3>
        <p>Verses arrive in this queue only after the Committee has reviewed all 4 disciplines and approved consensus.</p>
        <button className="btn-secondary" onClick={() => setFilter('all')}>
          View All Verses
        </button>
      </div>
    );
  }

  const isFinalized = activeVerse.confirms.final || activeVerse.status === 'Done';

  const handleSignOff = async () => {
    if (!activeVerse || !finalReadingText.trim() || submitting || !isFinalEditable) {
      if (!isFinalEditable) showToast('warning', 'Read-only access: Final sign-off is restricted.');
      else if (!finalReadingText.trim()) showToast('warning', 'Please enter or verify the Final Kannada Reading before sign-off.');
      return;
    }
    setSubmitting(true);
    await onSubmitFinal(activeVerse.row, finalReadingText.trim(), 'Y');
    setSubmitting(false);
    setActionNotice(`🔒 Verse ${activeVerse.verse} officially signed off, locked, and marked Done!`);

    // Advance to next verse if available
    if (selectedVerseIndex < displayedVerses.length - 1) {
      setTimeout(() => setSelectedVerseIndex((i) => i + 1), 600);
    }
  };

  const handleReturnToCommittee = async () => {
    if (!activeVerse || submitting || !isFinalEditable) return;
    setSubmitting(true);
    await onSubmitFinal(activeVerse.row, finalReadingText.trim(), 'N');
    setSubmitting(false);
    setActionNotice(`↩ Returned ${activeVerse.verse} to Committee.`);
    showToast('info', `Returned ${activeVerse.verse} to Committee for revisions.`);
  };

  const handleAdoptCommittee = () => {
    if (activeVerse.confirms.comm && activeVerse.reviews.conclusion) {
      setFinalReadingText(activeVerse.reviews.conclusion);
      showToast('success', 'Committee Conclusion text adopted.');
    } else if (!activeVerse.confirms.comm && activeVerse.reviews.conclusion) {
      showToast('info', `Committee has not concluded consensus yet. The current note is a re-review request: "${activeVerse.reviews.conclusion}".`);
    } else {
      showToast('info', 'No Committee Conclusion text found for this verse.');
    }
  };

  const handleAdoptProposed = () => {
    setFinalReadingText(activeVerse.proposed);
  };

  // WhatsApp announcement link celebrating completion
  const waCelebrationMessage = `🎉 *GLBC Translation Milestone!*
📖 *${currentBook} ${activeVerse.verse} Finalized & Locked!*
━━━━━━━━━━━━━━━━━━━━━━
👑 *Final Canonical Kannada Reading:*
${finalReadingText || activeVerse.proposed}

🙏 Thank you team for your faithful translation and rigorous reviews!`;

  const waCelebrationLink = `https://wa.me/?text=${encodeURIComponent(waCelebrationMessage)}`;

  return (
    <div className="final-editor-container">
      {/* Header Bar */}
      <div className="chamber-header">
        <div className="chamber-title-group">
          <div className="chamber-icon-badge final-badge">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="chamber-title">Final Editor Sign-off &amp; Lock Studio</h2>
            <p className="chamber-subtitle">
              Authoritative final reading sign-off, canonical locking, and Google Sheets row protection.
            </p>
          </div>
        </div>

        {!isFinalEditable && (
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
            <span><b>Read-Only Observation View:</b> You can view translations and deliberations. Final sign-off is restricted for your role.</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="chamber-filters">
          <button
            className={`chamber-filter-pill ${filter === 'needs_final' ? 'active' : ''}`}
            onClick={() => {
              setFilter('needs_final');
              setSelectedVerseIndex(0);
            }}
          >
            Needs Final <span className="pill-badge">{needsFinalVerses.length}</span>
          </button>
          <button
            className={`chamber-filter-pill ${filter === 'finalized' ? 'active' : ''}`}
            onClick={() => {
              setFilter('finalized');
              setSelectedVerseIndex(0);
            }}
          >
            Finalized &amp; Locked <span className="pill-badge">{finalizedVerses.length}</span>
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

      {/* Navigation Strip */}
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
          {isFinalized ? (
            <span className="pill-finalized-lock">
              <Lock size={14} /> Sheet Row Locked
            </span>
          ) : (
            <span className="pill-ready-consensus">
              <Unlock size={14} /> Ready for Editorial Sign-Off
            </span>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="chamber-notice-banner final-notice">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)}>✕</button>
        </div>
      )}

      {/* Audit Trail & Editorial Grid */}
      <div className="final-editor-grid">
        {/* Left Column: Translation Evolution Audit Trail */}
        <div className="audit-trail-col">
          <div className="audit-section-title">TRANSLATION EVOLUTION &amp; AUDIT TRAIL</div>

          {/* Step 1: Old Reading (KJV) */}
          <div className="audit-card">
            <div className="audit-card-badge step-1">Old Reading (KJV)</div>
            <div className="audit-text kjv-audit">{activeVerse.oldReading}</div>
          </div>

          {/* Step 2: Drafter Proposed Reading */}
          <div className="audit-card">
            <div className="audit-card-badge step-2">STAGE 2: DRAFTER PROPOSED READING</div>
            <div
              className="audit-text kannada-audit"
              dangerouslySetInnerHTML={{
                __html: activeVerse.proposedHtml || activeVerse.proposed
              }}
            />
            {/* Structured Back-Translation Word Pairs */}
            {parsedDrafter.wordPairs.length > 0 && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--theme-border)' }}>
                <span className="source-label notes" style={{ marginBottom: '0.375rem', display: 'inline-block' }}>BACK-TRANSLATION (WORD PAIRS)</span>
                <div className="word-pairs">
                  {parsedDrafter.wordPairs.map((pair, idx) => (
                    <div key={idx} className="word-pair-item">
                      <span
                        lang="kn"
                        className="word-pair-kannada"
                        dangerouslySetInnerHTML={{ __html: pair.kannadaHtml || pair.kannada }}
                      />
                      <small
                        className="word-pair-english"
                        dangerouslySetInnerHTML={{ __html: pair.englishHtml || pair.english }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Structured Investigation Notes */}
            {parsedDrafter.notes.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {parsedDrafter.notes.map((note, idx) => (
                  <div key={idx} className="investigation-note">
                    <span className={`note-type ${note.type}`}>
                      <Sparkles size={12} /> {note.title}
                    </span>
                    <p dangerouslySetInnerHTML={{ __html: note.html || note.text }} />
                  </div>
                ))}
              </div>
            )}
            {parsedDrafter.wordPairs.length === 0 && parsedDrafter.notes.length === 0 && activeVerse.drafterCmt && (
              <div className="audit-subnote">
                <strong>Drafter Notes:</strong> {activeVerse.drafterCmt}
              </div>
            )}
          </div>

          {/* Step 3: Committee Agreed Conclusion */}
          <div className="audit-card highlight-committee">
            <div className="audit-card-badge step-3">STAGE 3: COMMITTEE CONCLUSION</div>
            {activeVerse.confirms.comm && activeVerse.reviews.conclusion ? (
              <div className="audit-text kannada-audit conclusion-highlight">
                {activeVerse.reviews.conclusion}
              </div>
            ) : !activeVerse.confirms.comm && activeVerse.reviews.conclusion ? (
              <div className="audit-missing-text" style={{ color: '#b45309' }}>
                <AlertTriangle size={14} /> Re-review requested by Committee: "{activeVerse.reviews.conclusion}" (Not yet concluded).
              </div>
            ) : (
              <div className="audit-missing-text">
                <AlertTriangle size={14} /> Committee has not finalized consensus for this verse yet.
              </div>
            )}

            {/* Compact summary of 4 reviewer agreements */}
            <div className="reviewers-summary-strip">
              <div className={`rev-pill ${activeVerse.confirms.tech ? 'ok' : 'wait'}`}>
                Tech: {activeVerse.confirms.tech ? 'Y' : 'N'}
              </div>
              <div className={`rev-pill ${activeVerse.confirms.style ? 'ok' : 'wait'}`}>
                Style: {activeVerse.confirms.style ? 'Y' : 'N'}
              </div>
              <div className={`rev-pill ${activeVerse.confirms.ortho ? 'ok' : 'wait'}`}>
                Ortho: {activeVerse.confirms.ortho ? 'Y' : 'N'}
              </div>
              <div className={`rev-pill ${activeVerse.confirms.theo ? 'ok' : 'wait'}`}>
                Theo: {activeVerse.confirms.theo ? 'Y' : 'N'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Final Sign-off Workspace */}
        <div className="final-signoff-col">
          <div className="audit-section-title">CANONICAL FINAL READING</div>

          <div className="final-editor-card">
            <div className="final-editor-top">
              <div className="adopt-buttons-group">
                <button
                  type="button"
                  className="btn-adopt"
                  onClick={handleAdoptCommittee}
                  title="Copy Committee Conclusion"
                >
                  <Copy size={13} /> Adopt Committee Text
                </button>
                <button
                  type="button"
                  className="btn-adopt"
                  onClick={handleAdoptProposed}
                  title="Copy Drafter Proposed"
                >
                  <Copy size={13} /> Adopt Drafter Text
                </button>
              </div>

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

            <textarea
              className="final-reading-textarea"
              placeholder="Enter final canonical Kannada reading..."
              value={finalReadingText}
              onChange={(e) => setFinalReadingText(e.target.value)}
              rows={5}
              style={{ fontSize: `${fontSize}px` }}
            />

            {/* Editorial Verification Checklist */}
            <div className="editorial-checklist">
              <div className="checklist-title">EDITORIAL PRE-FLIGHT VERIFICATION</div>
              <div className="checklist-items">
                <label className="checklist-label">
                  <input
                    type="checkbox"
                    checked={checklist.faithful}
                    onChange={(e) => setChecklist({ ...checklist, faithful: e.target.checked })}
                  />
                  <span>Accurate fidelity to King James Bible 1611 textual meaning</span>
                </label>
                <label className="checklist-label">
                  <input
                    type="checkbox"
                    checked={checklist.grammar}
                    onChange={(e) => setChecklist({ ...checklist, grammar: e.target.checked })}
                  />
                  <span>Grammatically natural Kannada syntax, euphonic sandhi &amp; formal register</span>
                </label>
                <label className="checklist-label">
                  <input
                    type="checkbox"
                    checked={checklist.theology}
                    onChange={(e) => setChecklist({ ...checklist, theology: e.target.checked })}
                  />
                  <span>Orthodox theological terminology (vocatio, sanctification, sonship) verified</span>
                </label>
                <label className="checklist-label">
                  <input
                    type="checkbox"
                    checked={checklist.orthography}
                    onChange={(e) => setChecklist({ ...checklist, orthography: e.target.checked })}
                  />
                  <span>Standard Kannada orthography &amp; conjunct letters (ottakshara) confirmed</span>
                </label>
              </div>
            </div>

            {/* Actions Dock */}
            <div className="final-actions-dock">
              <div className="dock-left">
                {!isFinalized && (
                  <button
                    type="button"
                    className="btn-return-comm"
                    disabled={submitting}
                    onClick={handleReturnToCommittee}
                    title="Send back to Committee for changes"
                  >
                    <RotateCcw size={15} /> Return to Committee
                  </button>
                )}
              </div>

              <div className="dock-right">
                <button
                  type="button"
                  className="btn-final-signoff"
                  disabled={submitting}
                  onClick={handleSignOff}
                >
                  <Lock size={16} />
                  <span>{isFinalized ? 'Update & Re-Lock Verse' : 'Final Sign-Off & Lock'}</span>
                </button>

                {isFinalized && (
                  <a
                    href={waCelebrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-wa-broadcast"
                    title="Celebrate completion with team on WhatsApp"
                  >
                    <Send size={15} /> WhatsApp Broadcast
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
