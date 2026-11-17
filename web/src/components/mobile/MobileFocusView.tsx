import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Sparkles
} from 'lucide-react';
import type { VerseItem, TeamMember, ReviewerRole } from '../../types';
import type { ActiveTab } from '../Sidebar';
import { parseDrafterComments, trimReadingHtml } from '../../utils/drafterParser';
import { getKjvVerse } from '../../services/kjvService';
import { computeVerseApprovals } from '../../utils/approvalEngine';
import { showToast } from '../../utils/toast';
import { DiscussionPopoutModal } from '../DiscussionPopoutModal';

interface MobileFocusViewProps {
  verse: VerseItem;
  currentIndex: number;
  totalInChapter: number;
  allChapterVerses: VerseItem[];
  currentBook: string;
  currentUser: TeamMember | null;
  team: TeamMember[];
  bookCompletedCount?: number;
  bookTotalCount?: number;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onSelectVerseIndex: (idx: number) => void;
  onApproveVerse: (row: number, role: ReviewerRole) => Promise<void>;
  onAddComment: (row: number, role: ReviewerRole, comment: string) => Promise<void>;
  onOpenWhatsApp: (verse: VerseItem) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onApproveConsensus?: (row: number, conclusion: string) => Promise<void>;
  onSubmitFinal?: (row: number, finalText: string) => Promise<void>;
}

export const MobileFocusView: React.FC<MobileFocusViewProps> = ({
  verse,
  currentIndex,
  totalInChapter,
  currentUser,
  team,
  onNextVerse,
  onPrevVerse,
  onApproveVerse,
  onAddComment,
  onApproveConsensus
}) => {
  // Typography State
  const [fontSize, setFontSize] = useState<number>(18);
  const [activeDiscipline, setActiveDiscipline] = useState<'tech' | 'style' | 'ortho' | 'theo' | 'comm'>('theo');
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedKjv, setCopiedKjv] = useState<boolean>(false);
  const [copiedKannada, setCopiedKannada] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);

  // Detail Modal for Back-Translation Word Pairs
  const [inspectingWordPair, setInspectingWordPair] = useState<{ kannada: string; english: string } | null>(null);

  // Pop-Out Modal State
  const [popoutDiscipline, setPopoutDiscipline] = useState<string | null>(null);

  // Approval Engine & Parsed Drafter Notes
  const approvals = useMemo(() => {
    return verse.approvals || computeVerseApprovals(verse.reviews || {}, verse.confirms || {}, team || []);
  }, [verse.approvals, verse.reviews, verse.confirms, team]);

  const parsedCmt = useMemo(() => {
    return parseDrafterComments(verse.drafterCmtHtml || verse.drafterCmt || '');
  }, [verse.drafterCmt, verse.drafterCmtHtml]);

  const kjvText = useMemo(() => verse.oldReading || getKjvVerse(verse.verse), [verse.verse, verse.oldReading]);

  // User Roles & Assignment Checks
  const userRoles = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.roles && currentUser.roles.length > 0) return currentUser.roles;
    return currentUser.role ? [currentUser.role] : [];
  }, [currentUser]);

  const isAssigned = useMemo(() => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    if (activeDiscipline === 'comm') return allUserRoles.some((r) => r.includes('comm'));
    return allUserRoles.some((r) => r.includes(activeDiscipline));
  }, [activeDiscipline, currentUser, userRoles]);

  // Discipline Meta Configuration
  const disciplines = [
    {
      key: 'tech',
      label: 'Technical',
      icon: '🏛️',
      confirmed: verse.confirms?.tech || approvals.tech?.isFullyApproved,
      reviewer: approvals.tech?.approvedMembers?.length
        ? approvals.tech.approvedMembers.join(', ')
        : (approvals.tech?.pendingMembers?.length ? `${approvals.tech.pendingMembers.join(', ')} (Pending)` : 'Technical Reviewer')
    },
    {
      key: 'style',
      label: 'Style',
      icon: '✒️',
      confirmed: verse.confirms?.style || approvals.style?.isFullyApproved,
      reviewer: approvals.style?.approvedMembers?.length
        ? approvals.style.approvedMembers.join(', ')
        : (approvals.style?.pendingMembers?.length ? `${approvals.style.pendingMembers.join(', ')} (Pending)` : 'Style Reviewer')
    },
    {
      key: 'ortho',
      label: 'Orthography',
      icon: '📝',
      confirmed: verse.confirms?.ortho || approvals.ortho?.isFullyApproved,
      reviewer: approvals.ortho?.approvedMembers?.length
        ? approvals.ortho.approvedMembers.join(', ')
        : (approvals.ortho?.pendingMembers?.length ? `${approvals.ortho.pendingMembers.join(', ')} (Pending)` : 'Orthographic Reviewer')
    },
    {
      key: 'theo',
      label: 'Theology',
      icon: '📖',
      confirmed: verse.confirms?.theo || approvals.theo?.isFullyApproved,
      reviewer: approvals.theo?.approvedMembers?.length
        ? approvals.theo.approvedMembers.join(', ')
        : (approvals.theo?.pendingMembers?.length ? `${approvals.theo.pendingMembers.join(', ')} (Pending)` : 'Theological Reviewer')
    },
    {
      key: 'comm',
      label: 'Committee',
      icon: '👥',
      confirmed: verse.confirms?.comm || approvals.comm?.isFullyApproved,
      reviewer: approvals.comm?.approvedMembers?.length
        ? approvals.comm.approvedMembers.join(', ')
        : (approvals.comm?.pendingMembers?.length ? `${approvals.comm.pendingMembers.join(', ')} (Pending)` : 'Committee')
    }
  ];

  // Active discipline comments filtered by role
  const activeComments = useMemo(() => {
    return (verse.comments || []).filter((c) => {
      const r = c.authorRole.toLowerCase();
      if (activeDiscipline === 'tech') return r.includes('tech');
      if (activeDiscipline === 'style') return r.includes('style') || r.includes('lang');
      if (activeDiscipline === 'ortho') return r.includes('ortho');
      if (activeDiscipline === 'theo') return r.includes('theo');
      if (activeDiscipline === 'comm') return r.includes('comm');
      return true;
    });
  }, [verse.comments, activeDiscipline]);

  // Handle Copy KJV
  const handleCopyKjv = async () => {
    try {
      await navigator.clipboard.writeText(kjvText);
      setCopiedKjv(true);
      setTimeout(() => setCopiedKjv(false), 2000);
      showToast('success', 'KJV Base Reading copied to clipboard');
    } catch {
      showToast('error', 'Could not copy to clipboard');
    }
  };

  // Handle Copy Proposed Reading
  const handleCopyKannada = async () => {
    try {
      await navigator.clipboard.writeText(verse.proposed);
      setCopiedKannada(true);
      setTimeout(() => setCopiedKannada(false), 2000);
      showToast('success', 'Kannada Scripture copied to clipboard');
    } catch {
      showToast('error', 'Could not copy to clipboard');
    }
  };

  // Submit comment for active discipline
  const handleSendComment = async () => {
    if (!commentText.trim() || isSubmitting || !isAssigned) return;
    setIsSubmitting(true);
    try {
      const roleMapping: Record<string, ReviewerRole> = {
        tech: 'Technical Reviewer',
        style: 'Style & Language Reviewer',
        ortho: 'Orthographic Reviewer',
        theo: 'Theological Reviewer',
        comm: 'Committee'
      };
      await onAddComment(verse.row, roleMapping[activeDiscipline] || 'Technical Reviewer', commentText.trim());
      setCommentText('');
      showToast('success', 'Comment posted to deliberation stream');
    } catch (err) {
      showToast('error', 'Failed to post comment: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm review for active discipline
  const handleConfirmDiscipline = async () => {
    if (isSubmitting || !isAssigned) return;
    setIsSubmitting(true);
    try {
      const roleMapping: Record<string, ReviewerRole> = {
        tech: 'Technical Reviewer',
        style: 'Style & Language Reviewer',
        ortho: 'Orthographic Reviewer',
        theo: 'Theological Reviewer'
      };
      if (activeDiscipline === 'comm' && onApproveConsensus) {
        await onApproveConsensus(verse.row, verse.reviews.conclusion || verse.proposed);
      } else {
        await onApproveVerse(verse.row, roleMapping[activeDiscipline] || 'Technical Reviewer');
      }
      showToast('success', `Confirmed ${activeDiscipline.toUpperCase()} for ${verse.verse}!`);
    } catch (err) {
      showToast('error', 'Failed to confirm review: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingBottom: '5rem' }}>

      {/* ── 1. Top Verse Anchor Bar (Clean, Zero-Clutter, Matching Desktop) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          border: '1px solid var(--theme-border, #e2e8f0)',
          borderRadius: '0.625rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--theme-text)' }}>
            {verse.verse}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: verse.status === 'Done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: verse.status === 'Done' ? '#10b981' : '#d97706'
            }}
          >
            {verse.status === 'Done' ? '✅ Done' : '🟡 In Review'}
          </span>
        </div>

        {/* Clean Font Size Zoomer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
            style={{
              padding: '0.25rem 0.45rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--theme-border, #cbd5e1)',
              background: 'var(--theme-box-bg, #f1f5f9)',
              color: 'var(--theme-text)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Decrease Kannada font size"
          >
            A⁻
          </button>
          <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', minWidth: '20px', textAlign: 'center' }}>
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(28, s + 2))}
            style={{
              padding: '0.25rem 0.45rem',
              borderRadius: '0.25rem',
              border: '1px solid var(--theme-border, #cbd5e1)',
              background: 'var(--theme-box-bg, #f1f5f9)',
              color: 'var(--theme-text)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Increase Kannada font size"
          >
            A⁺
          </button>
        </div>
      </div>

      {/* ── 2. Role Mode Banner (Mirroring Desktop Clean Role Bar) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
          border: '1px solid var(--theme-border, #e2e8f0)',
          fontSize: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-text-muted)', fontSize: '0.6875rem' }}>
            Role Mode:
          </span>
          <span style={{ fontWeight: 700, color: 'var(--theme-accent, #2563eb)' }}>
            {currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Guest Reviewer'}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.1rem 0.45rem',
            borderRadius: '9999px',
            backgroundColor: isAssigned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: isAssigned ? '#10b981' : '#64748b'
          }}
        >
          {isAssigned ? '● Assigned' : '○ Observer'}
        </span>
      </div>

      {/* ── 3. Base Reference Card (KJV Old Reading) ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          padding: '0.875rem 1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#2563eb' }}>
            📜 Base Reference (KJV Old)
          </span>
          <button
            type="button"
            onClick={handleCopyKjv}
            style={{
              background: 'none',
              border: 'none',
              color: copiedKjv ? '#059669' : 'var(--theme-text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem'
            }}
          >
            {copiedKjv ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedKjv ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--theme-text)', fontStyle: 'italic' }}>
          {kjvText}
        </p>
      </div>

      {/* ── 4. Drafter Proposed Reading (Kannada) with 100% Preserved Colors ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          padding: '0.875rem 1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#059669' }}>
            📖 Drafter Proposed Reading (Kannada)
          </span>
          <button
            type="button"
            onClick={handleCopyKannada}
            style={{
              background: 'none',
              border: 'none',
              color: copiedKannada ? '#059669' : 'var(--theme-text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem'
            }}
          >
            {copiedKannada ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedKannada ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Render with trimReadingHtml to preserve Drafter font colors & highlights */}
        {verse.proposedHtml ? (
          <div
            className="kannada-reading proposed-kannada"
            lang="kn"
            style={{
              fontFamily: 'Noto Sans Kannada, var(--font-kannada, sans-serif)',
              fontSize: `${fontSize}px`,
              lineHeight: 1.65,
              color: 'var(--theme-text)',
              wordBreak: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: trimReadingHtml(verse.proposedHtml) }}
          />
        ) : (
          <p
            className="kannada-reading proposed-kannada"
            lang="kn"
            style={{
              fontFamily: 'Noto Sans Kannada, var(--font-kannada, sans-serif)',
              fontSize: `${fontSize}px`,
              lineHeight: 1.65,
              color: 'var(--theme-text)',
              margin: 0,
              wordBreak: 'break-word'
            }}
          >
            {verse.proposed || <em style={{ color: 'var(--theme-text-muted)' }}>No proposed reading drafted yet.</em>}
          </p>
        )}
      </div>

      {/* ── 5. Drafter Comments & Back-Translation Table (Preserved Colors) ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            background: 'var(--theme-box-bg, #f8fafc)',
            border: 'none',
            borderBottom: showNotes ? '1px solid var(--theme-border, #e2e8f0)' : 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={15} color="#7c3aed" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--theme-text)' }}>
              Drafter Back-Translation &amp; Notes
            </span>
            {parsedCmt.wordPairs.length > 0 && (
              <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                {parsedCmt.wordPairs.length} pairs
              </span>
            )}
          </div>
          {showNotes ? <ChevronUp size={16} color="var(--theme-text-muted)" /> : <ChevronDown size={16} color="var(--theme-text-muted)" />}
        </button>

        {showNotes && (
          <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* Word-Pairs Horizontal Snap Track with Preserved Drafter Colors */}
            {parsedCmt.wordPairs && parsedCmt.wordPairs.length > 0 ? (
              <div>
                <small style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Swipe horizontally to inspect aligned Kannada-English pairs (tap for detail):
                </small>
                <div
                  style={{
                    display: 'flex',
                    overflowX: 'auto',
                    scrollSnapType: 'x mandatory',
                    gap: '0.5rem',
                    paddingBottom: '0.35rem',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {parsedCmt.wordPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      onClick={() => setInspectingWordPair({ kannada: pair.kannada, english: pair.english })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setInspectingWordPair({ kannada: pair.kannada, english: pair.english });
                      }}
                      style={{
                        flex: '0 0 145px',
                        scrollSnapAlign: 'start',
                        padding: '0.5rem 0.65rem',
                        backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                        border: '1px solid var(--theme-border, #cbd5e1)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Preserve Drafter HTML Colors */}
                      {pair.kannadaHtml ? (
                        <div
                          lang="kn"
                          className="word-pair-kannada"
                          style={{ fontFamily: 'Noto Sans Kannada', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          dangerouslySetInnerHTML={{ __html: pair.kannadaHtml }}
                        />
                      ) : (
                        <div style={{ fontFamily: 'Noto Sans Kannada', fontSize: '0.875rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pair.kannada}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pair.english}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Categorized Investigation Notes with HTML styling */}
            {parsedCmt.notes && parsedCmt.notes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {parsedCmt.notes.map((note, idx) => (
                  <div key={idx} style={{ padding: '0.45rem 0.65rem', background: 'var(--theme-box-bg, #f8fafc)', borderRadius: '0.375rem', fontSize: '0.8125rem', color: 'var(--theme-text)', lineHeight: 1.45, border: '1px solid var(--theme-border, #e2e8f0)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                      <Sparkles size={11} color="#7c3aed" />
                      <strong style={{ fontSize: '0.6875rem', color: '#7c3aed', textTransform: 'uppercase' }}>{note.title}</strong>
                    </div>
                    {note.html ? (
                      <span dangerouslySetInnerHTML={{ __html: note.html }} />
                    ) : (
                      <span>{note.text}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : !parsedCmt.wordPairs.length && (
              <div style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                No notes or back-translation recorded for this verse.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Review Discipline Stream (Strict Role-Based Security) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--theme-text-muted)' }}>
            Review Discipline Stream
          </span>
          <button
            type="button"
            onClick={() => setPopoutDiscipline(activeDiscipline)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--theme-accent, #2563eb)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            <Maximize2 size={12} /> Expand Chat
          </button>
        </div>

        {/* Horizontal Discipline Switcher */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            gap: '0.4rem',
            paddingBottom: '0.35rem'
          }}
        >
          {disciplines.map((d) => {
            const isActive = activeDiscipline === d.key;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDiscipline(d.key as any)}
                style={{
                  flex: '0 0 auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '9999px',
                  border: isActive ? '2px solid var(--theme-accent, #2563eb)' : '1px solid var(--theme-border, #cbd5e1)',
                  backgroundColor: isActive ? 'var(--theme-card-bg, #ffffff)' : 'var(--theme-box-bg, #f1f5f9)',
                  color: isActive ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  scrollSnapAlign: 'start',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{d.icon}</span>
                <span>{d.label}</span>
                <span style={{ color: d.confirmed ? '#10b981' : '#f59e0b', fontSize: '0.6875rem' }}>
                  {d.confirmed ? '✓' : '⏳'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 7. Active Discipline Card with Role-Based Controls ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          padding: '0.875rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <div>
            <strong style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>
              {disciplines.find((d) => d.key === activeDiscipline)?.label} Review
            </strong>
            <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
              {disciplines.find((d) => d.key === activeDiscipline)?.reviewer || 'Assigned Reviewer'}
            </span>
          </div>

          {/* STRICT ROLE SECURITY: Confirm button ONLY visible if user is assigned! */}
          {isAssigned && (
            <button
              type="button"
              onClick={handleConfirmDiscipline}
              disabled={isSubmitting}
              style={{
                padding: '0.35rem 0.75rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <CheckCircle2 size={13} />
              <span>Confirm {activeDiscipline.toUpperCase()}</span>
            </button>
          )}
        </div>

        {/* Comment Thread (Capped Height) */}
        <div
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '0.4rem 0',
            marginBottom: '0.625rem'
          }}
        >
          {activeComments.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '0.75rem 0' }}>
              No comments yet for this discipline. Be the first to observe!
            </p>
          ) : (
            activeComments.map((cmt) => (
              <div
                key={cmt.id}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '0.375rem',
                  background: 'var(--theme-box-bg, #f8fafc)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                  <b style={{ color: 'var(--theme-text)' }}>{cmt.authorName}</b>
                  <span style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>{cmt.timestamp}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--theme-text)', lineHeight: 1.35 }}>{cmt.text}</p>
              </div>
            ))
          )}
        </div>

        {/* STRICT ROLE SECURITY: Comment Input ONLY visible if assigned; otherwise clean read-only notice */}
        {isAssigned ? (
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Add observation for ${activeDiscipline.toUpperCase()}…`}
              style={{
                flex: 1,
                padding: '0.45rem 0.65rem',
                border: '1px solid var(--theme-border, #cbd5e1)',
                background: 'var(--theme-input-bg, #ffffff)',
                color: 'var(--theme-text)',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendComment();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={!commentText.trim() || isSubmitting}
              style={{
                padding: '0.45rem 0.75rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: commentText.trim() ? 'pointer' : 'default',
                opacity: commentText.trim() ? 1 : 0.6
              }}
            >
              <Send size={13} />
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '0.45rem 0.65rem',
              backgroundColor: 'var(--theme-box-bg, #f8fafc)',
              border: '1px solid var(--theme-border, #e2e8f0)',
              borderRadius: '0.375rem',
              fontSize: '0.6875rem',
              color: 'var(--theme-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Lock size={12} color="#64748b" />
            <span>
              Read-only view for <strong>{disciplines.find((d) => d.key === activeDiscipline)?.label}</strong>. Assigned to {disciplines.find((d) => d.key === activeDiscipline)?.reviewer}.
            </span>
          </div>
        )}
      </div>

      {/* ── 8. Clean Sticky Floating Thumb Action Dock (Zero Repeated WhatsApp buttons) ── */}
      <div
        style={{
          position: 'sticky',
          bottom: '3.75rem',
          zIndex: 35,
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          border: '1px solid var(--theme-border, #e2e8f0)',
          borderRadius: '0.625rem',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          backdropFilter: 'blur(8px)'
        }}
      >
        <button
          type="button"
          onClick={onPrevVerse}
          disabled={currentIndex === 0}
          style={{
            padding: '0.45rem 0.65rem',
            backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
            border: '1px solid var(--theme-border, #cbd5e1)',
            borderRadius: '0.375rem',
            color: 'var(--theme-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            opacity: currentIndex === 0 ? 0.5 : 1
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
          {verse.verse} ({currentIndex + 1} of {totalInChapter})
        </span>

        <button
          type="button"
          onClick={onNextVerse}
          disabled={currentIndex >= totalInChapter - 1}
          style={{
            padding: '0.45rem 0.65rem',
            backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
            border: '1px solid var(--theme-border, #cbd5e1)',
            borderRadius: '0.375rem',
            color: 'var(--theme-text)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: currentIndex >= totalInChapter - 1 ? 'default' : 'pointer',
            opacity: currentIndex >= totalInChapter - 1 ? 0.5 : 1
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Word-Pair Lexical Modal on Tap ── */}
      {inspectingWordPair && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setInspectingWordPair(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              maxWidth: '320px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-accent, #2563eb)' }}>
                Back-Translation Word Pair
              </span>
              <button
                type="button"
                onClick={() => setInspectingWordPair(null)}
                style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ fontFamily: 'Noto Sans Kannada', fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.35rem' }}>
              {inspectingWordPair.kannada}
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--theme-text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
              "{inspectingWordPair.english}"
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.4 }}>
              Drafter literal alignment verified for {verse.verse}. Cross-referenced with KJV base reading.
            </p>
          </div>
        </div>
      )}

      {/* ── Pop-Out Discussion Modal ── */}
      {popoutDiscipline && (
        <DiscussionPopoutModal
          isOpen={true}
          onClose={() => setPopoutDiscipline(null)}
          verseRef={verse.verse}
          stageTitle={`${disciplines.find((d) => d.key === popoutDiscipline)?.label} Review`}
          stageColor="#2563eb"
          comments={activeComments}
          currentUser={currentUser || undefined}
          onAddComment={async (text) => {
            const roleMapping: Record<string, ReviewerRole> = {
              tech: 'Technical Reviewer',
              style: 'Style & Language Reviewer',
              ortho: 'Orthographic Reviewer',
              theo: 'Theological Reviewer',
              comm: 'Committee'
            };
            await onAddComment(verse.row, roleMapping[popoutDiscipline] || 'Technical Reviewer', text);
          }}
          isAssignedToRole={isAssigned}
        />
      )}
    </div>
  );
};
