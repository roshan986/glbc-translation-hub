import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  FileText,
  Sparkles,
  Users,
  CheckCheck
} from 'lucide-react';
import type { VerseItem, TeamMember, ReviewerRole, CommentItem } from '../../types';
import type { ActiveTab } from '../Sidebar';
import { parseDrafterComments, trimReadingHtml } from '../../utils/drafterParser';
import { getKjvVerse, getBookTotalVerses } from '../../services/kjvService';
import { computeVerseApprovals } from '../../utils/approvalEngine';
import { calculatePacingStats } from '../../utils/pacingEngine';
import { showToast } from '../../utils/toast';
import { DiscussionPopoutModal } from '../DiscussionPopoutModal';

interface TabletFocusViewProps {
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
  onSelectUserRole?: (role: string) => void;
}

export const TabletFocusView: React.FC<TabletFocusViewProps> = ({
  verse,
  currentIndex,
  totalInChapter,
  allChapterVerses,
  currentBook,
  currentUser,
  team,
  bookCompletedCount,
  bookTotalCount,
  onNextVerse,
  onPrevVerse,
  onSelectVerseIndex,
  onApproveVerse,
  onAddComment,
  onOpenWhatsApp,
  onNavigateTab,
  onApproveConsensus,
  onSubmitFinal,
  onSelectUserRole
}) => {
  // Tablet Typography State
  const [fontSize, setFontSize] = useState<number>(18);
  const [copiedKannada, setCopiedKannada] = useState<boolean>(false);
  const [copiedKjv, setCopiedKjv] = useState<boolean>(false);

  // Committee & Final Editor States
  const [commConclusionText, setCommConclusionText] = useState<string>(verse.reviews.conclusion || '');
  const [finalReadingText, setFinalReadingText] = useState<string>(verse.finalReading || verse.proposed || '');
  const [isSubmittingComm, setIsSubmittingComm] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);

  useEffect(() => {
    setCommConclusionText(verse.reviews.conclusion || '');
    setFinalReadingText(verse.finalReading || verse.proposed || '');
  }, [verse]);

  // Pop-Out Discussion Modal State
  const [popoutDiscipline, setPopoutDiscipline] = useState<string | null>(null);

  // Submitting States per discipline card
  const [submittingDiscipline, setSubmittingDiscipline] = useState<string | null>(null);

  // Draft Comment text state per discipline
  const [draftComments, setDraftComments] = useState<Record<string, string>>({
    tech: '',
    style: '',
    ortho: '',
    theo: ''
  });

  // Modal inspection for Back-Translation Word-Pairs
  const [inspectingWordPair, setInspectingWordPair] = useState<{ kannada: string; english: string } | null>(null);

  // Target Date Popover state
  const [showTargetPopover, setShowTargetPopover] = useState<boolean>(false);

  // Target Date & Countdown Engine
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });

  useEffect(() => {
    const updateTargetDate = () => {
      const saved = localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
      setTargetDateStr(saved);
    };
    updateTargetDate();
    window.addEventListener('storage', updateTargetDate);
    return () => window.removeEventListener('storage', updateTargetDate);
  }, [currentBook]);

  const countdownStats = useMemo(() => {
    const total = bookTotalCount || getBookTotalVerses(currentBook);
    const completed = bookCompletedCount !== undefined
      ? bookCompletedCount
      : allChapterVerses.filter((v) => v.status === 'Done').length;
    const remainingVerses = Math.max(0, total - completed);
    const pacing = calculatePacingStats(targetDateStr, total, completed);

    return {
      hasTargetDate: pacing.hasTargetDate,
      formattedTarget: pacing.formattedTarget,
      daysRemaining: pacing.daysRemaining,
      daysOverdue: pacing.daysOverdue,
      isPast: pacing.isPast,
      isLagging: pacing.status === 'high_pace',
      isComplete: pacing.isComplete,
      total,
      completed,
      remainingVerses,
      requiredDailyPace: pacing.requiredDailyPace,
      percentDone: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [targetDateStr, currentBook, bookTotalCount, bookCompletedCount, allChapterVerses]);

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

  const isUserAssignedToDiscipline = (discKey: 'tech' | 'style' | 'ortho' | 'theo'): boolean => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    return allUserRoles.some((r) => r.includes(discKey));
  };

  const isUserAssignedToCommittee = (): boolean => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    return allUserRoles.some((r) => r.includes('comm'));
  };

  const isUserAssignedToFinalEditor = (): boolean => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    return allUserRoles.some((r) => r.includes('final'));
  };

  // Submit committee consensus
  const handleConfirmCommittee = async () => {
    if (isSubmittingComm || !isUserAssignedToCommittee() || !onApproveConsensus) return;
    setIsSubmittingComm(true);
    try {
      await onApproveConsensus(verse.row, commConclusionText.trim() || verse.proposed);
      showToast('success', `Committee consensus confirmed for ${verse.verse}!`);
    } catch (err) {
      showToast('error', `Failed to confirm committee consensus: ${String(err)}`);
    } finally {
      setIsSubmittingComm(false);
    }
  };

  // Submit final editor sign-off
  const handleConfirmFinal = async () => {
    if (isSubmittingFinal || !isUserAssignedToFinalEditor() || !onSubmitFinal) return;
    setIsSubmittingFinal(true);
    try {
      await onSubmitFinal(verse.row, finalReadingText.trim());
      showToast('success', `Final Editor sign-off completed for ${verse.verse}!`);
    } catch (err) {
      showToast('error', `Failed to submit final sign-off: ${String(err)}`);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

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

  // Submit comment for a discipline
  const handleSendDisciplineComment = async (roleKey: 'tech' | 'style' | 'ortho' | 'theo', roleName: ReviewerRole) => {
    const text = draftComments[roleKey]?.trim();
    if (!text || submittingDiscipline || !isUserAssignedToDiscipline(roleKey)) return;

    setSubmittingDiscipline(roleKey);
    try {
      await onAddComment(verse.row, roleName, text);
      setDraftComments((prev) => ({ ...prev, [roleKey]: '' }));
      showToast('success', `Comment posted to ${roleName} deliberation stream!`);
    } catch (err) {
      showToast('error', `Failed to post comment: ${String(err)}`);
    } finally {
      setSubmittingDiscipline(null);
    }
  };

  // Affirmative confirmation for a discipline
  const handleConfirmDiscipline = async (roleKey: 'tech' | 'style' | 'ortho' | 'theo', roleName: ReviewerRole) => {
    if (submittingDiscipline || !isUserAssignedToDiscipline(roleKey)) return;
    setSubmittingDiscipline(roleKey);
    try {
      await onApproveVerse(verse.row, roleName);
      showToast('success', `Confirmed ${roleName} for ${verse.verse}!`);
    } catch (err) {
      showToast('error', `Failed to confirm review: ${String(err)}`);
    } finally {
      setSubmittingDiscipline(null);
    }
  };

  // Filter comments for specific role
  const getCommentsForRole = (roleKey: string): CommentItem[] => {
    return (verse.comments || []).filter((c) => {
      const r = c.authorRole.toLowerCase();
      if (roleKey === 'tech') return r.includes('tech');
      if (roleKey === 'style') return r.includes('style') || r.includes('lang');
      if (roleKey === 'ortho') return r.includes('ortho');
      if (roleKey === 'theo') return r.includes('theo');
      return false;
    });
  };

  const disciplinesConfig: {
    key: 'tech' | 'style' | 'ortho' | 'theo';
    roleName: ReviewerRole;
    title: string;
    icon: string;
    confirmed: string;
    approverName?: string;
    isAssigned: boolean;
  }[] = [
    {
      key: 'tech',
      roleName: 'Technical Reviewer',
      title: 'Technical Review',
      icon: '🏛️',
      confirmed: verse.confirms?.tech || (approvals.tech?.isFullyApproved ? 'Y' : 'N'),
      approverName: approvals.tech?.approvedMembers?.length
        ? approvals.tech.approvedMembers.join(', ')
        : (approvals.tech?.pendingMembers?.length ? `${approvals.tech.pendingMembers.join(', ')} (Pending)` : 'Technical Reviewer'),
      isAssigned: isUserAssignedToDiscipline('tech')
    },
    {
      key: 'style',
      roleName: 'Style & Language Reviewer',
      title: 'Style & Language',
      icon: '✒️',
      confirmed: verse.confirms?.style || (approvals.style?.isFullyApproved ? 'Y' : 'N'),
      approverName: approvals.style?.approvedMembers?.length
        ? approvals.style.approvedMembers.join(', ')
        : (approvals.style?.pendingMembers?.length ? `${approvals.style.pendingMembers.join(', ')} (Pending)` : 'Style Reviewer'),
      isAssigned: isUserAssignedToDiscipline('style')
    },
    {
      key: 'ortho',
      roleName: 'Orthographic Reviewer',
      title: 'Orthographic Review',
      icon: '📝',
      confirmed: verse.confirms?.ortho || (approvals.ortho?.isFullyApproved ? 'Y' : 'N'),
      approverName: approvals.ortho?.approvedMembers?.length
        ? approvals.ortho.approvedMembers.join(', ')
        : (approvals.ortho?.pendingMembers?.length ? `${approvals.ortho.pendingMembers.join(', ')} (Pending)` : 'Orthographic Reviewer'),
      isAssigned: isUserAssignedToDiscipline('ortho')
    },
    {
      key: 'theo',
      roleName: 'Theological Reviewer',
      title: 'Theological Review',
      icon: '📖',
      confirmed: verse.confirms?.theo || (approvals.theo?.isFullyApproved ? 'Y' : 'N'),
      approverName: approvals.theo?.approvedMembers?.length
        ? approvals.theo.approvedMembers.join(', ')
        : (approvals.theo?.pendingMembers?.length ? `${approvals.theo.pendingMembers.join(', ')} (Pending)` : 'Theological Reviewer'),
      isAssigned: isUserAssignedToDiscipline('theo')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', paddingBottom: '5.5rem' }}>

      {/* ── 1. Tablet Review Toolbar (Clean, Uncluttered, Zero Repeated WhatsApp) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.625rem 1rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        borderRadius: '0.625rem',
        border: '1px solid var(--theme-border, #e2e8f0)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Verse Reference & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--theme-text)' }}>
            {verse.verse}
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: verse.status === 'Done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: verse.status === 'Done' ? '#10b981' : '#d97706'
          }}>
            {verse.status === 'Done' ? '✅ Done' : '🟡 In Review'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
            Verse {currentIndex + 1} of {totalInChapter}
          </span>
        </div>

        {/* Center Target Countdown Capsule */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowTargetPopover((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Calendar size={13} color="#e11d48" />
            <span>
              {countdownStats.hasTargetDate
                ? countdownStats.isComplete
                  ? '🎉 Goal Reached'
                  : countdownStats.isPast
                  ? `⚠️ ${countdownStats.daysOverdue}d overdue`
                  : `⏱️ ${countdownStats.daysRemaining}d left · ${countdownStats.requiredDailyPace} v/d`
                : 'Target Date Unset'}
            </span>
          </button>

          {/* Target Countdown Popover */}
          {showTargetPopover && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              width: '280px',
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              padding: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-text-muted)' }}>
                  Target Pacing ({currentBook})
                </span>
                <button
                  type="button"
                  onClick={() => setShowTargetPopover(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>

              {countdownStats.hasTargetDate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Target Deadline:</span>
                    <strong style={{ color: 'var(--theme-text)' }}>{countdownStats.formattedTarget}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Status:</span>
                    <strong style={{ color: countdownStats.isPast ? '#e11d48' : '#10b981' }}>
                      {countdownStats.isPast ? `${countdownStats.daysOverdue} days overdue` : `${countdownStats.daysRemaining} days left`}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Required Pace:</span>
                    <strong style={{ color: '#0284c7' }}>{countdownStats.requiredDailyPace} verses/day</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--theme-text-muted)' }}>Completed:</span>
                    <span>{countdownStats.completed} / {countdownStats.total} ({countdownStats.percentDone}%)</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                  Set a target completion date in Settings to calculate daily pacing.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Clean Font Zoomers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(16, s - 2))}
              style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--theme-border)',
                background: 'var(--theme-box-bg)',
                color: 'var(--theme-text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Smaller Kannada text"
            >
              A⁻
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', minWidth: '22px', textAlign: 'center' }}>
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              style={{
                padding: '0.3rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--theme-border)',
                background: 'var(--theme-box-bg)',
                color: 'var(--theme-text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Larger Kannada text"
            >
              A⁺
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Role Mode Banner (Mirroring Desktop Clean Role Bar) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 1rem',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
          border: '1px solid var(--theme-border, #e2e8f0)',
          fontSize: '0.8125rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-text-muted)', fontSize: '0.6875rem' }}>
            Role Mode:
          </span>
          <span style={{ fontWeight: 700, color: 'var(--theme-accent, #2563eb)' }}>
            {currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Guest Reviewer'}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            backgroundColor: disciplinesConfig.some((d) => d.isAssigned) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: disciplinesConfig.some((d) => d.isAssigned) ? '#10b981' : '#64748b'
          }}
        >
          {disciplinesConfig.some((d) => d.isAssigned) ? '● Assigned Reviewer' : '○ Observer Mode'}
        </span>
      </div>

      {/* ── 3. Balanced 2-Column Base Reading Comparison Split ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.875rem'
      }}>
        {/* Left Column: Kannada Proposed Scripture + KJV Reference */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem'
        }}>
          {/* Proposed Reading with Drafter Colors */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                📖 Proposed Reading (Kannada)
              </span>
              <button
                type="button"
                onClick={handleCopyKannada}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedKannada ? '#059669' : 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.6875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                {copiedKannada ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKannada ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Preserved HTML Highlights */}
            {verse.proposedHtml ? (
              <div
                className="kannada-reading proposed-kannada"
                lang="kn"
                style={{
                  fontFamily: 'Noto Sans Kannada, sans-serif',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.7,
                  color: 'var(--theme-text)',
                  minHeight: '80px',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: trimReadingHtml(verse.proposedHtml) }}
              />
            ) : (
              <div style={{
                fontFamily: 'Noto Sans Kannada, sans-serif',
                fontSize: `${fontSize}px`,
                lineHeight: 1.7,
                color: 'var(--theme-text)',
                minHeight: '80px',
                wordBreak: 'break-word'
              }}>
                {verse.proposed || <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>No proposed Kannada draft entered yet.</span>}
              </div>
            )}
          </div>

          {/* KJV Base Reading */}
          <div style={{ borderTop: '1px solid var(--theme-border, #e2e8f0)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                📜 King James Version (KJV Old)
              </span>
              <button
                type="button"
                onClick={handleCopyKjv}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedKjv ? '#059669' : 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.6875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                {copiedKjv ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKjv ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div style={{
              fontSize: '0.875rem',
              lineHeight: 1.5,
              color: 'var(--theme-text)',
              fontStyle: 'italic'
            }}>
              {kjvText}
            </div>
          </div>
        </div>

        {/* Right Column: Drafter Notes & Back-Translation Word-Pairs Rail */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
              <FileText size={15} color="#7c3aed" />
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Drafter Comments &amp; Back-Translation
              </span>
              {parsedCmt.wordPairs.length > 0 && (
                <span style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem', borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                  {parsedCmt.wordPairs.length} pairs
                </span>
              )}
            </div>

            {/* Back-Translation Word Pairs Horizontal Snap Rail with Preserved Colors */}
            {parsedCmt.wordPairs && parsedCmt.wordPairs.length > 0 ? (
              <div style={{ marginBottom: '0.625rem' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>
                  Back-Translation Word Pairs (Swipe ↔):
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.35rem',
                    scrollSnapType: 'x mandatory',
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
                        borderRadius: '0.375rem',
                        border: '1px solid var(--theme-border, #e2e8f0)',
                        backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      {/* Preserve Drafter HTML Colors */}
                      {pair.kannadaHtml ? (
                        <div
                          lang="kn"
                          style={{
                            fontFamily: 'Noto Sans Kannada, sans-serif',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          dangerouslySetInnerHTML={{ __html: pair.kannadaHtml }}
                        />
                      ) : (
                        <div style={{
                          fontFamily: 'Noto Sans Kannada, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: 'var(--theme-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {pair.kannada}
                        </div>
                      )}
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--theme-text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {pair.english}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Drafter Investigation Notes with preserved color runs */}
            <div style={{
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              color: 'var(--theme-text)',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {parsedCmt.notes && parsedCmt.notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {parsedCmt.notes.map((note, idx) => (
                    <div key={idx} style={{ padding: '0.35rem 0.5rem', background: 'var(--theme-box-bg)', borderRadius: '0.25rem', border: '1px solid var(--theme-border, #e2e8f0)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
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
                <span style={{ color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>
                  No investigation notes recorded for this verse.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. 2x2 Grid of 4 Review Discipline Cards with Strict Role Security ── */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.25rem 0.35rem 0.25rem'
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Review Matrix (2×2 Discipline Grid)
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#0284c7', fontWeight: 600 }}>
            Role-Based Gated Permissions Active
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.875rem'
        }}>
          {disciplinesConfig.map((item) => {
            const comments = getCommentsForRole(item.key);
            const isConfirmed = item.confirmed === 'Y';
            const isSubmittingThis = submittingDiscipline === item.key;

            return (
              <div
                key={item.key}
                style={{
                  backgroundColor: 'var(--theme-card-bg, #ffffff)',
                  borderRadius: '0.625rem',
                  border: isConfirmed ? '1px solid #10b981' : '1px solid var(--theme-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  padding: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem'
                }}
              >
                {/* Discipline Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                        {item.approverName || 'Assigned Reviewer'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '9999px',
                      backgroundColor: isConfirmed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: isConfirmed ? '#10b981' : '#d97706'
                    }}>
                      {isConfirmed ? '✓ Approved' : '⏳ Pending'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPopoutDiscipline(item.key)}
                      title="Expand deliberation history"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--theme-text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Deliberation Comments List (Auto-capped 110px) */}
                <div style={{
                  maxHeight: '110px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  padding: '0.25rem 0'
                }}>
                  {comments.length === 0 ? (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--theme-text-muted)',
                      fontStyle: 'italic',
                      padding: '0.5rem 0',
                      textAlign: 'center'
                    }}>
                      No observations recorded yet.
                    </div>
                  ) : (
                    comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        style={{
                          padding: '0.35rem 0.5rem',
                          backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--theme-border, #e2e8f0)',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                          <strong style={{ color: 'var(--theme-text)', fontSize: '0.6875rem' }}>{cmt.authorName}</strong>
                          <span style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>{cmt.timestamp}</span>
                        </div>
                        <div style={{ color: 'var(--theme-text)', lineHeight: 1.35 }}>{cmt.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* STRICT ROLE SECURITY: Comment composer and Confirm button ONLY shown for assigned scholar */}
                {item.isAssigned ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <input
                        type="text"
                        value={draftComments[item.key] || ''}
                        onChange={(e) => setDraftComments((prev) => ({ ...prev, [item.key]: e.target.value }))}
                        placeholder={`Add ${item.title} observation…`}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--theme-border, #cbd5e1)',
                          borderRadius: '0.375rem',
                          backgroundColor: 'var(--theme-input-bg, #ffffff)',
                          color: 'var(--theme-text)'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendDisciplineComment(item.key, item.roleName);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSendDisciplineComment(item.key, item.roleName)}
                        disabled={!draftComments[item.key]?.trim() || isSubmittingThis}
                        style={{
                          padding: '0.35rem 0.6rem',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: draftComments[item.key]?.trim() ? 'pointer' : 'default',
                          opacity: draftComments[item.key]?.trim() ? 1 : 0.6
                        }}
                      >
                        <Send size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmDiscipline(item.key, item.roleName)}
                      disabled={isSubmittingThis || isConfirmed}
                      style={{
                        width: '100%',
                        padding: '0.4rem',
                        backgroundColor: isConfirmed ? '#10b981' : '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: (isSubmittingThis || isConfirmed) ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>{isConfirmed ? 'Approved ✓' : `Confirm ${item.title}`}</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '0.4rem 0.5rem',
                      backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                      borderRadius: '0.375rem',
                      fontSize: '0.6875rem',
                      color: 'var(--theme-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      border: '1px solid var(--theme-border, #e2e8f0)',
                      marginTop: 'auto'
                    }}
                  >
                    <Lock size={12} color="#64748b" />
                    <span>Read-only deliberation. Assigned to {item.approverName}.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Committee Consensus & Deliberation (Role-Gated) ── */}
      {(isUserAssignedToCommittee() || verse.status === 'Awaiting Committee' || verse.status === 'Needs Final' || verse.status === 'Done' || (verse.comments && verse.comments.some((c) => c.authorRole.toLowerCase().includes('comm')))) && (
        <div
          style={{
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: verse.confirms?.comm === 'Y' ? '1px solid #9333ea' : '1px solid var(--theme-border, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={18} color="#9333ea" />
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                  Committee Deliberation &amp; Consensus
                </strong>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  {approvals.comm?.approvedMembers?.length
                    ? `Approved by: ${approvals.comm.approvedMembers.join(', ')}`
                    : (approvals.comm?.pendingMembers?.length ? `Awaiting: ${approvals.comm.pendingMembers.join(', ')}` : 'Committee assigned in Config')}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: verse.confirms?.comm === 'Y' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: verse.confirms?.comm === 'Y' ? '#9333ea' : '#d97706'
              }}
            >
              {verse.confirms?.comm === 'Y' ? '✓ Committee Approved' : '⏳ Committee Pending'}
            </span>
          </div>

          {/* Committee Deliberation Comments */}
          {verse.comments && verse.comments.filter((c) => c.authorRole.toLowerCase().includes('comm')).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {verse.comments.filter((c) => c.authorRole.toLowerCase().includes('comm')).map((cmt) => (
                <div
                  key={cmt.id}
                  style={{
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border, #e2e8f0)',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <strong style={{ color: 'var(--theme-text)' }}>{cmt.authorName}</strong>
                    <span style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>{cmt.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--theme-text)', lineHeight: 1.35 }}>{cmt.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Conclusion Text Area & Action */}
          {isUserAssignedToCommittee() ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                value={commConclusionText}
                onChange={(e) => setCommConclusionText(e.target.value)}
                placeholder="Enter committee conclusion notes or agreed text reading…"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.8125rem',
                  border: '1px solid var(--theme-border, #cbd5e1)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--theme-input-bg, #ffffff)',
                  color: 'var(--theme-text)',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={handleConfirmCommittee}
                disabled={isSubmittingComm}
                style={{
                  alignSelf: 'flex-end',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#9333ea',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CheckCircle2 size={14} />
                <span>Confirm Committee Consensus</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '0.45rem 0.65rem',
                backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                color: 'var(--theme-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                border: '1px solid var(--theme-border, #e2e8f0)'
              }}
            >
              <Lock size={12} color="#64748b" />
              <span>Read-only committee deliberation. Only assigned Committee members can confirm consensus.</span>
            </div>
          )}
        </div>
      )}

      {/* ── 6. Final Editor Sign-off (Role-Gated) ── */}
      {(isUserAssignedToFinalEditor() || verse.status === 'Needs Final' || verse.status === 'Done' || !!verse.finalReading) && (
        <div
          style={{
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: verse.confirms?.final === 'Y' ? '1px solid #10b981' : '1px solid #be123c',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCheck size={18} color="#be123c" />
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                  Final Editor Sign-Off
                </strong>
                <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  Published canonical reading for {verse.verse}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: verse.confirms?.final === 'Y' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(190, 18, 60, 0.15)',
                color: verse.confirms?.final === 'Y' ? '#10b981' : '#be123c'
              }}
            >
              {verse.confirms?.final === 'Y' ? '✓ Final Signed Off' : '⏳ Awaiting Final Sign-Off'}
            </span>
          </div>

          {/* Final Reading Editor */}
          {isUserAssignedToFinalEditor() ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setFinalReadingText(verse.proposed)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Adopt Drafter Proposed Text ↵
                </button>
              </div>

              <textarea
                value={finalReadingText}
                onChange={(e) => setFinalReadingText(e.target.value)}
                placeholder="Enter final canonical Kannada text…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  fontSize: '0.9375rem',
                  fontFamily: 'Noto Sans Kannada, sans-serif',
                  lineHeight: 1.6,
                  border: '1px solid var(--theme-border, #cbd5e1)',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--theme-input-bg, #ffffff)',
                  color: 'var(--theme-text)',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <button
                type="button"
                onClick={handleConfirmFinal}
                disabled={isSubmittingFinal}
                style={{
                  alignSelf: 'flex-end',
                  padding: '0.45rem 1rem',
                  backgroundColor: '#be123c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CheckCircle2 size={14} />
                <span>Sign Off &amp; Lock Verse</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'Noto Sans Kannada, sans-serif',
                lineHeight: 1.6,
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-border, #e2e8f0)'
              }}
            >
              {verse.finalReading || <em style={{ color: 'var(--theme-text-muted)' }}>Final reading has not yet been submitted by Final Editor.</em>}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Sticky Tablet Bottom Action Dock (Clean, Zero Repeated WhatsApp) ── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 'var(--sidebar-width, 64px)',
        right: 0,
        zIndex: 40,
        padding: '0.5rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        borderTop: '1px solid var(--theme-border, #e2e8f0)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onPrevVerse}
            disabled={currentIndex === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
            {verse.verse} ({currentIndex + 1} of {totalInChapter})
          </span>

          <button
            type="button"
            onClick={onNextVerse}
            disabled={currentIndex >= totalInChapter - 1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: currentIndex >= totalInChapter - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex >= totalInChapter - 1 ? 0.5 : 1
            }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
          {currentBook} Focus Mode
        </span>
      </div>

      {/* ── Word-Pair Detail Modal ── */}
      {inspectingWordPair && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.875rem',
            width: '100%',
            maxWidth: '380px',
            padding: '1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                Back-Translation Word Pair
              </span>
              <button
                type="button"
                onClick={() => setInspectingWordPair(null)}
                style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--theme-box-bg, #f8fafc)',
              borderRadius: '0.5rem',
              border: '1px solid var(--theme-border, #e2e8f0)'
            }}>
              <div style={{ fontFamily: 'Noto Sans Kannada, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.35rem' }}>
                {inspectingWordPair.kannada}
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>
                "{inspectingWordPair.english}"
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.45 }}>
              Literal Kannada-to-English alignment mapped from drafter back-translation notes for {verse.verse}.
            </div>
          </div>
        </div>
      )}

      {/* ── Pop-Out Deliberation Modal ── */}
      {popoutDiscipline && (
        <DiscussionPopoutModal
          isOpen={true}
          onClose={() => setPopoutDiscipline(null)}
          verseRef={verse.verse}
          stageTitle={`${disciplinesConfig.find((d) => d.key === popoutDiscipline)?.title || 'Discipline'} Review`}
          stageColor="#0284c7"
          comments={getCommentsForRole(popoutDiscipline)}
          currentUser={currentUser || undefined}
          onAddComment={async (text) => {
            const disc = disciplinesConfig.find((d) => d.key === popoutDiscipline);
            if (disc) {
              await onAddComment(verse.row, disc.roleName, text);
            }
          }}
          isAssignedToRole={disciplinesConfig.find((d) => d.key === popoutDiscipline)?.isAssigned || false}
        />
      )}
    </div>
  );
};
