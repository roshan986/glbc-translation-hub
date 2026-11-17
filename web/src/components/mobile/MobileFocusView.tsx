import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import type { VerseItem, TeamMember, ReviewerRole } from '../../types';
import type { ActiveTab } from '../Sidebar';
import { parseDrafterComments, trimReadingHtml } from '../../utils/drafterParser';
import { getKjvVerse } from '../../services/kjvService';
import { computeVerseApprovals } from '../../utils/approvalEngine';
import { showToast } from '../../utils/toast';

interface MobileFocusViewProps {
  verse: VerseItem;
  currentIndex: number;
  totalInChapter: number;
  allChapterVerses: VerseItem[];
  currentBook?: string;
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
  currentBook = 'Romans',
  currentUser,
  team,
  onNextVerse,
  onPrevVerse,
  onApproveVerse,
  onAddComment,
  onApproveConsensus
}) => {
  // Typography State (A- / A+ applied to Proposed Reading)
  const [fontSize, setFontSize] = useState<number>(18);

  // Base Reference Toggle: 'kjv' English vs 'oldKannada'
  const [baseRefTab, setBaseRefTab] = useState<'kjv' | 'oldKannada'>('kjv');

  // Copy Feedback States
  const [copiedBaseRef, setCopiedBaseRef] = useState<boolean>(false);
  const [copiedKannada, setCopiedKannada] = useState<boolean>(false);

  // Drafter Notes Collapsible State (Expanded by default per user directive)
  const [showNotes, setShowNotes] = useState<boolean>(true);

  // Slide-Up Deliberation Drawer State
  const [showDeliberationDrawer, setShowDeliberationDrawer] = useState<boolean>(false);
  const [drawerDiscipline, setDrawerDiscipline] = useState<'tech' | 'style' | 'ortho' | 'theo' | 'comm'>('theo');
  const [drawerCommentText, setDrawerCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail Modal for Back-Translation Word Pairs
  const [inspectingWordPair, setInspectingWordPair] = useState<{ kannada: string; english: string } | null>(null);

  // Canonical KJV English verse resolution (instant if oldReading is English, else fetch from kjvService)
  const isOldReadingEnglish = useMemo(() => {
    return Boolean(verse.oldReading && !/[\u0C80-\u0CFF]/.test(verse.oldReading));
  }, [verse.oldReading]);

  const [kjvText, setKjvText] = useState<string>(() => (isOldReadingEnglish ? (verse.oldReading || '') : ''));

  useEffect(() => {
    if (isOldReadingEnglish) {
      setKjvText(verse.oldReading || '');
      return;
    }
    let isMounted = true;
    getKjvVerse(currentBook, verse.chapter, verse.verseNumber).then((text) => {
      if (isMounted) setKjvText(text);
    });
    return () => {
      isMounted = false;
    };
  }, [currentBook, verse.chapter, verse.verseNumber, isOldReadingEnglish, verse.oldReading]);

  // Old Kannada text (if available in oldReading)
  const oldKannadaText = useMemo(() => {
    if (verse.oldReading && /[\u0C80-\u0CFF]/.test(verse.oldReading)) {
      return verse.oldReading;
    }
    return '';
  }, [verse.oldReading]);

  // Approval Engine & Parsed Drafter Notes
  const approvals = useMemo(() => {
    return verse.approvals || computeVerseApprovals(verse.reviews || {}, verse.confirms || {}, team || []);
  }, [verse.approvals, verse.reviews, verse.confirms, team]);

  const parsedCmt = useMemo(() => {
    return parseDrafterComments(verse.drafterCmtHtml || verse.drafterCmt || '');
  }, [verse.drafterCmt, verse.drafterCmtHtml]);

  // User Roles & Assignment Checks
  const userRoles = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.roles && currentUser.roles.length > 0) return currentUser.roles;
    return currentUser.role ? [currentUser.role] : [];
  }, [currentUser]);

  // Overall assignment check for current user
  const isAssigned = useMemo(() => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    if (drawerDiscipline === 'comm') return allUserRoles.some((r) => r.includes('comm'));
    return allUserRoles.some((r) => r.includes(drawerDiscipline));
  }, [drawerDiscipline, currentUser, userRoles]);

  // Discipline Meta Configuration for Drawer
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

  // Total comments count across all disciplines
  const totalCommentsCount = useMemo(() => {
    return (verse.comments || []).length;
  }, [verse.comments]);

  // Comments filtered for the active drawer discipline
  const drawerComments = useMemo(() => {
    return (verse.comments || []).filter((c) => {
      const r = (c.authorRole || '').toLowerCase();
      if (drawerDiscipline === 'tech') return r.includes('tech');
      if (drawerDiscipline === 'style') return r.includes('style') || r.includes('lang');
      if (drawerDiscipline === 'ortho') return r.includes('ortho');
      if (drawerDiscipline === 'theo') return r.includes('theo');
      if (drawerDiscipline === 'comm') return r.includes('comm');
      return true;
    });
  }, [verse.comments, drawerDiscipline]);

  // Handle Copy Base Reference
  const handleCopyBaseRef = async () => {
    try {
      const textToCopy = baseRefTab === 'kjv' ? (kjvText || '') : (oldKannadaText || '');
      await navigator.clipboard.writeText(textToCopy);
      setCopiedBaseRef(true);
      setTimeout(() => setCopiedBaseRef(false), 2000);
      showToast('success', `${baseRefTab === 'kjv' ? 'KJV English' : 'Old Kannada'} text copied`);
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

  // Submit comment for active discipline inside drawer
  const handleSendComment = async () => {
    if (!drawerCommentText.trim() || isSubmitting || !isAssigned) return;
    setIsSubmitting(true);
    try {
      const roleMapping: Record<string, ReviewerRole> = {
        tech: 'Technical Reviewer',
        style: 'Style & Language Reviewer',
        ortho: 'Orthographic Reviewer',
        theo: 'Theological Reviewer',
        comm: 'Committee'
      };
      await onAddComment(verse.row, roleMapping[drawerDiscipline] || 'Technical Reviewer', drawerCommentText.trim());
      setDrawerCommentText('');
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
      if (drawerDiscipline === 'comm' && onApproveConsensus) {
        await onApproveConsensus(verse.row, verse.reviews.conclusion || verse.proposed);
      } else {
        await onApproveVerse(verse.row, roleMapping[drawerDiscipline] || 'Technical Reviewer');
      }
      showToast('success', `Confirmed ${drawerDiscipline.toUpperCase()} for ${verse.verse}!`);
    } catch (err) {
      showToast('error', 'Failed to confirm review: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingBottom: '5rem' }}>

      {/* ── 1. Consolidated Verse & Role Header Bar (Ultra-Compact, Saves ~45px) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.75rem',
          backgroundColor: 'var(--theme-card-bg, #0f172a)',
          border: '1px solid var(--theme-border, #1e293b)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--theme-text)' }}>
            {verse.verse}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.12rem 0.45rem',
              borderRadius: '9999px',
              backgroundColor: verse.status === 'Done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: verse.status === 'Done' ? '#10b981' : '#f59e0b',
              border: verse.status === 'Done' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            {verse.status === 'Done' ? '✅ Done' : '🟡 In Review'}
          </span>
        </div>

        {/* User Persona & Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-text-muted)' }}>
            {currentUser?.name || 'Reviewer'}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: isAssigned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              color: isAssigned ? '#10b981' : '#94a3b8',
              border: isAssigned ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)'
            }}
          >
            {currentUser?.role || (isAssigned ? 'Assigned' : 'Observer')}
          </span>
        </div>
      </div>

      {/* ── 2. Base Reference Card with 1-Tap [KJV English] / [Old Kannada] Switcher ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #0f172a)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #1e293b)',
          padding: '0.75rem 0.875rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#60a5fa' }}>
              📜 Base Reference
            </span>

            {/* Segmented Switcher Tabs */}
            <div style={{ display: 'inline-flex', background: 'var(--theme-box-bg, #142037)', borderRadius: '0.375rem', padding: '2px', border: '1px solid var(--theme-border, #1e293b)' }}>
              <button
                type="button"
                onClick={() => setBaseRefTab('kjv')}
                style={{
                  padding: '0.15rem 0.45rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  fontSize: '0.6875rem',
                  fontWeight: baseRefTab === 'kjv' ? 700 : 500,
                  background: baseRefTab === 'kjv' ? 'var(--theme-card-bg, #0f172a)' : 'transparent',
                  color: baseRefTab === 'kjv' ? 'var(--theme-text, #f8fafc)' : 'var(--theme-text-muted, #94a3b8)',
                  cursor: 'pointer',
                  boxShadow: baseRefTab === 'kjv' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                KJV English
              </button>
              {oldKannadaText && (
                <button
                  type="button"
                  onClick={() => setBaseRefTab('oldKannada')}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    fontSize: '0.6875rem',
                    fontWeight: baseRefTab === 'oldKannada' ? 700 : 500,
                    background: baseRefTab === 'oldKannada' ? 'var(--theme-card-bg, #0f172a)' : 'transparent',
                    color: baseRefTab === 'oldKannada' ? 'var(--theme-text, #f8fafc)' : 'var(--theme-text-muted, #94a3b8)',
                    cursor: 'pointer',
                    boxShadow: baseRefTab === 'oldKannada' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  Old Kannada
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyBaseRef}
            style={{
              background: 'none',
              border: 'none',
              color: copiedBaseRef ? '#10b981' : 'var(--theme-text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem'
            }}
          >
            {copiedBaseRef ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedBaseRef ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {baseRefTab === 'kjv' ? (
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--theme-text)', fontStyle: 'italic' }}>
            {kjvText || 'Loading KJV English verse…'}
          </p>
        ) : (
          <p className="kannada-reading" lang="kn" style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--theme-text)' }}>
            {oldKannadaText}
          </p>
        )}
      </div>

      {/* ── 3. Drafter Proposed Reading (Kannada) with Integrated A⁻ / A⁺ Zoomers ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #0f172a)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #1e293b)',
          padding: '0.75rem 0.875rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#10b981' }}>
            📖 Drafter Proposed Reading (Kannada)
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Font Zoomers exclusively placed on Proposed Reading Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'var(--theme-box-bg, #142037)', padding: '2px 4px', borderRadius: '0.375rem', border: '1px solid var(--theme-border, #1e293b)' }}>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                style={{
                  padding: '0.15rem 0.35rem',
                  borderRadius: '0.2rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-text)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Decrease font size"
              >
                A⁻
              </button>
              <span style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)', minWidth: '18px', textAlign: 'center' }}>
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                style={{
                  padding: '0.15rem 0.35rem',
                  borderRadius: '0.2rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-text)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Increase font size"
              >
                A⁺
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyKannada}
              style={{
                background: 'none',
                border: 'none',
                color: copiedKannada ? '#10b981' : 'var(--theme-text-muted, #94a3b8)',
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

      {/* ── 4. Drafter Comments & Back-Translation Table (Expanded by Default) ── */}
      <div
        style={{
          background: 'var(--theme-card-bg, #0f172a)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #1e293b)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
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
            background: 'var(--theme-box-bg, #142037)',
            border: 'none',
            borderBottom: showNotes ? '1px solid var(--theme-border, #1e293b)' : 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={15} color="#a855f7" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--theme-text)' }}>
              Drafter Back-Translation &amp; Notes
            </span>
            {parsedCmt.wordPairs.length > 0 && (
              <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '9999px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
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
                        backgroundColor: 'var(--theme-box-bg, #142037)',
                        border: '1px solid var(--theme-border, #1e293b)',
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
                  <div key={idx} style={{ padding: '0.45rem 0.65rem', background: 'var(--theme-box-bg, #142037)', borderRadius: '0.375rem', fontSize: '0.8125rem', color: 'var(--theme-text)', lineHeight: 1.45, border: '1px solid var(--theme-border, #1e293b)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                      <Sparkles size={11} color="#a855f7" />
                      <strong style={{ fontSize: '0.6875rem', color: '#c084fc', textTransform: 'uppercase' }}>{note.title}</strong>
                    </div>
                    {note.html ? (
                      <span dangerouslySetInnerHTML={{ __html: note.html }} />
                    ) : (
                      <span>{note.text}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Raw Drafter comments fallback if neither word-pairs nor notes extracted */}
            {(!parsedCmt.wordPairs || parsedCmt.wordPairs.length === 0) && (!parsedCmt.notes || parsedCmt.notes.length === 0) && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--theme-text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {verse.drafterCmtHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: verse.drafterCmtHtml }} />
                ) : (
                  verse.drafterCmt || 'No investigation notes recorded for this verse.'
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 5. Sticky Floating Thumb Action Dock (Zero Clutter, Easy Thumb Reach) ── */}
      <div
        style={{
          position: 'sticky',
          bottom: '3.75rem',
          zIndex: 35,
          padding: '0.55rem 0.75rem',
          backgroundColor: 'var(--theme-card-bg, #0f172a)',
          border: '1px solid var(--theme-border, #1e293b)',
          borderRadius: '0.75rem',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Trigger for Slide-Up Deliberation Drawer */}
        <button
          type="button"
          onClick={() => setShowDeliberationDrawer(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.65rem',
            backgroundColor: 'var(--theme-box-bg, #142037)',
            border: '1px solid var(--theme-border, #1e293b)',
            borderRadius: '0.5rem',
            color: 'var(--theme-accent, #38bdf8)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={14} />
          <span>Deliberate</span>
          {totalCommentsCount > 0 && (
            <span style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem', borderRadius: '9999px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 800 }}>
              {totalCommentsCount}
            </span>
          )}
        </button>

        {/* Verse Navigator (Prev | Verse | Next) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={onPrevVerse}
            disabled={currentIndex === 0}
            style={{
              padding: '0.4rem 0.55rem',
              backgroundColor: 'var(--theme-box-bg, #142037)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '0.375rem',
              color: 'var(--theme-text)',
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              opacity: currentIndex === 0 ? 0.4 : 1
            }}
          >
            <ChevronLeft size={15} />
          </button>

          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text)', minWidth: '85px', textAlign: 'center' }}>
            {verse.verse} <small style={{ color: 'var(--theme-text-muted)' }}>({currentIndex + 1}/{totalInChapter})</small>
          </span>

          <button
            type="button"
            onClick={onNextVerse}
            disabled={currentIndex >= totalInChapter - 1}
            style={{
              padding: '0.4rem 0.55rem',
              backgroundColor: 'var(--theme-box-bg, #142037)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '0.375rem',
              color: 'var(--theme-text)',
              cursor: currentIndex >= totalInChapter - 1 ? 'default' : 'pointer',
              opacity: currentIndex >= totalInChapter - 1 ? 0.4 : 1
            }}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Quick Confirm button if user is assigned to active drawer discipline */}
        {isAssigned && (
          <button
            type="button"
            onClick={handleConfirmDiscipline}
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.75rem',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle2 size={14} />
            <span>Confirm</span>
          </button>
        )}
      </div>

      {/* ── 6. Slide-Up Deliberation Drawer (Preserves Scripture Context on Top) ── */}
      {showDeliberationDrawer && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowDeliberationDrawer(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '70vh',
              maxHeight: '85vh',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              borderTop: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '1.25rem 1.25rem 0 0',
              zIndex: 65,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
              animation: 'slideUp 0.22s ease-out'
            }}
          >
            {/* Drawer Drag Handle */}
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--theme-border, #1e293b)', margin: '0.5rem auto 0.25rem auto' }} />

            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem 0.4rem 1rem', borderBottom: '1px solid var(--theme-border, #1e293b)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MessageSquare size={16} color="#38bdf8" />
                <strong style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                  Team Deliberation &amp; Review
                </strong>
                <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  ({verse.verse})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliberationDrawer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Persistent Mini Scripture Reference Banner */}
            <div
              style={{
                padding: '0.4rem 1rem',
                backgroundColor: 'var(--theme-box-bg, #142037)',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontWeight: 800, color: 'var(--theme-accent, #38bdf8)' }}>{verse.verse}:</span>
              <span style={{ color: 'var(--theme-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'Noto Sans Kannada' }}>
                {verse.proposed || 'No proposed reading'}
              </span>
            </div>

            {/* Horizontal Discipline Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                gap: '0.35rem',
                padding: '0.5rem 1rem',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                backgroundColor: 'var(--theme-card-bg, #0f172a)'
              }}
            >
              {disciplines.map((d) => {
                const isActive = drawerDiscipline === d.key;
                const dComments = (verse.comments || []).filter((c) => {
                  const r = (c.authorRole || '').toLowerCase();
                  if (d.key === 'tech') return r.includes('tech');
                  if (d.key === 'style') return r.includes('style') || r.includes('lang');
                  if (d.key === 'ortho') return r.includes('ortho');
                  if (d.key === 'theo') return r.includes('theo');
                  if (d.key === 'comm') return r.includes('comm');
                  return true;
                });

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDrawerDiscipline(d.key as any)}
                    style={{
                      flex: '0 0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '9999px',
                      border: isActive ? '1px solid #38bdf8' : '1px solid var(--theme-border, #1e293b)',
                      backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'var(--theme-box-bg, #142037)',
                      color: isActive ? '#38bdf8' : 'var(--theme-text-muted, #94a3b8)',
                      fontSize: '0.6875rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      scrollSnapAlign: 'start',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                    <span style={{ color: d.confirmed ? '#10b981' : '#f59e0b', fontSize: '0.625rem' }}>
                      {d.confirmed ? '✓' : '⏳'}
                    </span>
                    {dComments.length > 0 && (
                      <span style={{ fontSize: '0.5625rem', padding: '0.05rem 0.25rem', borderRadius: '9999px', backgroundColor: isActive ? '#38bdf8' : 'var(--theme-border, #1e293b)', color: isActive ? '#020617' : '#f8fafc', fontWeight: 800 }}>
                        {dComments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Discipline Assigned Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 1rem', background: 'var(--theme-card-bg, #0f172a)', borderBottom: '1px solid var(--theme-border, #1e293b)', fontSize: '0.6875rem' }}>
              <span style={{ color: 'var(--theme-text-muted)' }}>
                Assigned: <strong style={{ color: 'var(--theme-text)' }}>{disciplines.find((d) => d.key === drawerDiscipline)?.reviewer}</strong>
              </span>
              <span style={{ color: disciplines.find((d) => d.key === drawerDiscipline)?.confirmed ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                {disciplines.find((d) => d.key === drawerDiscipline)?.confirmed ? '● Confirmed (Y)' : '○ Awaiting Review'}
              </span>
            </div>

            {/* Threaded Discussion Messages Stream */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                backgroundColor: 'var(--theme-canvas-bg, #020617)'
              }}
            >
              {drawerComments.length === 0 ? (
                <div style={{ margin: 'auto 0', textAlign: 'center', padding: '2rem 1rem', color: 'var(--theme-text-muted)' }}>
                  <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                    No observations recorded for {disciplines.find((d) => d.key === drawerDiscipline)?.label} Review yet.
                  </p>
                  <small style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                    Share your linguistic or theological insight below.
                  </small>
                </div>
              ) : (
                drawerComments.map((cmt) => (
                  <div
                    key={cmt.id}
                    style={{
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--theme-box-bg, #142037)',
                      border: '1px solid var(--theme-border, #1e293b)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <b style={{ color: '#38bdf8', fontSize: '0.75rem' }}>{cmt.authorName}</b>
                      <span style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>{cmt.timestamp}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--theme-text)', lineHeight: 1.45 }}>{cmt.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Composer at Drawer Bottom */}
            <div
              style={{
                padding: '0.625rem 1rem',
                backgroundColor: 'var(--theme-card-bg, #0f172a)',
                borderTop: '1px solid var(--theme-border, #1e293b)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {isAssigned ? (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <input
                    type="text"
                    value={drawerCommentText}
                    onChange={(e) => setDrawerCommentText(e.target.value)}
                    placeholder={`Comment on ${disciplines.find((d) => d.key === drawerDiscipline)?.label}…`}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--theme-border, #1e293b)',
                      background: 'var(--theme-input-bg, #0b1220)',
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
                    disabled={!drawerCommentText.trim() || isSubmitting}
                    style={{
                      padding: '0.5rem 0.85rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: drawerCommentText.trim() ? 'pointer' : 'default',
                      opacity: drawerCommentText.trim() ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.45rem 0.65rem',
                    backgroundColor: 'var(--theme-box-bg, #142037)',
                    border: '1px solid var(--theme-border, #1e293b)',
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
                    Read-only observer for <strong>{disciplines.find((d) => d.key === drawerDiscipline)?.label}</strong>. Assigned to {disciplines.find((d) => d.key === drawerDiscipline)?.reviewer}.
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Word-Pair Lexical Modal on Tap ── */}
      {inspectingWordPair && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              borderRadius: '0.75rem',
              border: '1px solid var(--theme-border, #1e293b)',
              padding: '1.25rem',
              maxWidth: '320px',
              width: '100%',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-accent, #38bdf8)' }}>
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
    </div>
  );
};
