import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  MessageSquare,
  LayoutGrid,
  Calendar
} from 'lucide-react';
import type { VerseItem, TeamMember, ReviewerRole } from '../../types';
import type { ActiveTab } from '../Sidebar';
import { parseDrafterComments, trimReadingHtml } from '../../utils/drafterParser';
import { getKjvVerse } from '../../services/kjvService';
import { computeVerseApprovals } from '../../utils/approvalEngine';
import { calculatePacingStats } from '../../utils/pacingEngine';
import { showToast } from '../../utils/toast';

const formatVerseRefOnly = (ref: string): string => {
  if (!ref) return '';
  const match = ref.match(/(\d+:\d+)/);
  return match ? match[1] : ref;
};

const getShortRoleName = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('tech')) return 'Tech';
  if (r.includes('style') || r.includes('lang')) return 'Style';
  if (r.includes('ortho')) return 'Ortho';
  if (r.includes('theo')) return 'Theo';
  if (r.includes('comm')) return 'Comm';
  if (r.includes('final')) return 'Final';
  if (r.includes('draft')) return 'Draft';
  return role;
};

const getRoleEmoji = (role: string): string => {
  const r = (role || '').toLowerCase();
  if (r.includes('tech')) return '🏛️';
  if (r.includes('style') || r.includes('lang')) return '✍️';
  if (r.includes('ortho')) return '📐';
  if (r.includes('theo')) return '🕊️';
  if (r.includes('comm')) return '👥';
  if (r.includes('final')) return '👑';
  if (r.includes('draft')) return '📝';
  return '👤';
};

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
  onSelectUserRole?: (role: string) => void;
}

export const MobileFocusView: React.FC<MobileFocusViewProps> = ({
  verse,
  currentIndex,
  totalInChapter,
  allChapterVerses = [],
  currentBook = 'Romans',
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
  const [showDisciplineModal, setShowDisciplineModal] = useState<boolean>(false);
  const [expandVerseSnippet, setExpandVerseSnippet] = useState<boolean>(false);
  const [drawerCommentText, setDrawerCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail Modal for Back-Translation Word Pairs
  const [inspectingWordPair, setInspectingWordPair] = useState<{ kannada: string; english: string } | null>(null);

  // Pop-up Modal for Role Switching (Mobile)
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  // Canonical Status Badge Color matching Desktop
  const statusBadgeColor = useMemo(() => {
    if (!verse) return 'red';
    switch (verse.status) {
      case 'Done': return 'green';
      case 'Awaiting Review': return 'blue';
      case 'Under Review': return 'amber';
      case 'Awaiting Committee': return 'blue';
      case 'Needs Final': return 'amber';
      default: return 'red';
    }
  }, [verse?.status]);

  // Jump to Verse Popover State
  const [showJumpGrid, setShowJumpGrid] = useState<boolean>(false);
  const jumpGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showJumpGrid) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (jumpGridRef.current && !jumpGridRef.current.contains(e.target as Node)) {
        setShowJumpGrid(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showJumpGrid]);

  // Target Date & Completion Pacing State
  const [targetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });
  const [showTargetPopover, setShowTargetPopover] = useState<boolean>(false);
  const targetPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTargetPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (targetPopoverRef.current && !targetPopoverRef.current.contains(e.target as Node)) {
        setShowTargetPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTargetPopover]);

  const countdownStats = useMemo(() => {
    const total = bookTotalCount || allChapterVerses?.length || 1;
    const completed = bookCompletedCount !== undefined
      ? bookCompletedCount
      : (allChapterVerses || []).filter((v) => v.status === 'Done').length;
    const pacing = calculatePacingStats(targetDateStr, total, completed);
    return {
      hasTargetDate: pacing.hasTargetDate,
      daysRemaining: pacing.daysRemaining,
      daysOverdue: pacing.daysOverdue,
      isComplete: pacing.isComplete,
      isPast: pacing.isPast,
      isLagging: pacing.isLagging,
      dailyVelocityRequired: pacing.dailyVelocityRequired,
      targetDateStr: pacing.targetDateStr,
      progressPercent: pacing.progressPercent,
      completed,
      total,
      remainingVerses: Math.max(0, total - completed)
    };
  }, [targetDateStr, currentBook, bookTotalCount, bookCompletedCount, allChapterVerses]);

  // Role Switcher Dropdown State
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState<boolean>(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRoleMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRoleMenuOpen]);

  // Synchronize drawer discipline when active role changes
  useEffect(() => {
    if (!currentUser?.role) return;
    const r = currentUser.role.toLowerCase();
    if (r.includes('tech')) setDrawerDiscipline('tech');
    else if (r.includes('style') || r.includes('lang')) setDrawerDiscipline('style');
    else if (r.includes('ortho')) setDrawerDiscipline('ortho');
    else if (r.includes('theo')) setDrawerDiscipline('theo');
    else if (r.includes('comm')) setDrawerDiscipline('comm');
  }, [currentUser?.role]);

  // Canonical KJV English verse resolution (instant if oldReading is English, else fetch from kjvService)
  const isOldReadingEnglish = useMemo(() => {
    return Boolean(verse?.oldReading && !/[\u0C80-\u0CFF]/.test(verse.oldReading));
  }, [verse?.oldReading]);

  const [kjvText, setKjvText] = useState<string>(() => (isOldReadingEnglish ? (verse?.oldReading || '') : ''));

  useEffect(() => {
    if (!verse) return;
    if (isOldReadingEnglish) {
      setKjvText(verse.oldReading || '');
      return;
    }
    let isMounted = true;
    getKjvVerse(currentBook, verse.chapter, verse.verseNumber)
      .then((text) => {
        if (isMounted) setKjvText(text);
      })
      .catch((err) => {
        console.warn('Failed to load KJV verse:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [currentBook, verse?.chapter, verse?.verseNumber, isOldReadingEnglish, verse?.oldReading]);

  // Old Kannada text (if available in oldReading)
  const oldKannadaText = useMemo(() => {
    if (verse?.oldReading && /[\u0C80-\u0CFF]/.test(verse.oldReading)) {
      return verse.oldReading;
    }
    return '';
  }, [verse?.oldReading]);

  // Approval Engine & Parsed Drafter Notes
  const approvals = useMemo(() => {
    if (!verse) return {} as any;
    return verse.approvals || computeVerseApprovals(verse.reviews || {}, verse.confirms || {}, team || []);
  }, [verse?.approvals, verse?.reviews, verse?.confirms, team]);

  const parsedCmt = useMemo(() => {
    if (!verse) return { wordPairs: [], notes: [], totalNotesCount: 0 };
    return parseDrafterComments(verse.drafterCmtHtml || verse.drafterCmt || '') || { wordPairs: [], notes: [], totalNotesCount: 0 };
  }, [verse?.drafterCmt, verse?.drafterCmtHtml]);

  // User Roles & Assignment Checks
  const userRoles = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.roles && currentUser.roles.length > 0) return currentUser.roles;
    return currentUser.role ? [currentUser.role] : [];
  }, [currentUser]);

  // Overall assignment check for current user
  const isAssigned = useMemo(() => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => String(r || '').toLowerCase());
    if (drawerDiscipline === 'comm') return allUserRoles.some((r) => r.includes('comm'));
    return allUserRoles.some((r) => r.includes(drawerDiscipline));
  }, [drawerDiscipline, currentUser, userRoles]);

  // Discipline Meta Configuration for Drawer
  const disciplines = [
    {
      key: 'tech',
      label: 'Technical',
      icon: '🏛️',
      confirmed: Boolean(verse?.confirms?.tech || approvals?.tech?.isFullyApproved),
      reviewer: approvals?.tech?.approvedMembers?.length
        ? approvals.tech.approvedMembers.join(', ')
        : (approvals?.tech?.pendingMembers?.length ? `${approvals.tech.pendingMembers.join(', ')} (Pending)` : 'Technical Reviewer')
    },
    {
      key: 'style',
      label: 'Style',
      icon: '✒️',
      confirmed: Boolean(verse?.confirms?.style || approvals?.style?.isFullyApproved),
      reviewer: approvals?.style?.approvedMembers?.length
        ? approvals.style.approvedMembers.join(', ')
        : (approvals?.style?.pendingMembers?.length ? `${approvals.style.pendingMembers.join(', ')} (Pending)` : 'Style Reviewer')
    },
    {
      key: 'ortho',
      label: 'Orthography',
      icon: '📝',
      confirmed: Boolean(verse?.confirms?.ortho || approvals?.ortho?.isFullyApproved),
      reviewer: approvals?.ortho?.approvedMembers?.length
        ? approvals.ortho.approvedMembers.join(', ')
        : (approvals?.ortho?.pendingMembers?.length ? `${approvals.ortho.pendingMembers.join(', ')} (Pending)` : 'Orthographic Reviewer')
    },
    {
      key: 'theo',
      label: 'Theology',
      icon: '📖',
      confirmed: Boolean(verse?.confirms?.theo || approvals?.theo?.isFullyApproved),
      reviewer: approvals?.theo?.approvedMembers?.length
        ? approvals.theo.approvedMembers.join(', ')
        : (approvals?.theo?.pendingMembers?.length ? `${approvals.theo.pendingMembers.join(', ')} (Pending)` : 'Theological Reviewer')
    },
    {
      key: 'comm',
      label: 'Committee',
      icon: '👥',
      confirmed: Boolean(verse?.confirms?.comm || approvals?.comm?.isFullyApproved),
      reviewer: approvals?.comm?.approvedMembers?.length
        ? approvals.comm.approvedMembers.join(', ')
        : (approvals?.comm?.pendingMembers?.length ? `${approvals.comm.pendingMembers.join(', ')} (Pending)` : 'Committee')
    }
  ];

  // Total comments count across all disciplines
  const totalCommentsCount = useMemo(() => {
    return (verse?.comments || []).length;
  }, [verse?.comments]);

  // Comments filtered for the active drawer discipline
  const drawerComments = useMemo(() => {
    return (verse?.comments || []).filter((c) => {
      if (!c) return false;
      const r = String(c.authorRole || '').toLowerCase();
      if (drawerDiscipline === 'tech') return r.includes('tech');
      if (drawerDiscipline === 'style') return r.includes('style') || r.includes('lang');
      if (drawerDiscipline === 'ortho') return r.includes('ortho');
      if (drawerDiscipline === 'theo') return r.includes('theo');
      if (drawerDiscipline === 'comm') return r.includes('comm');
      return true;
    });
  }, [verse?.comments, drawerDiscipline]);

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
        await onApproveConsensus(verse.row, verse.reviews?.conclusion || verse.proposed);
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

  if (!verse) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--theme-text-muted)' }}>
        No verse selected.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingBottom: '5rem' }}>

      {/* ── 0. Reviewer Role Ribbon (Between Topbar and Verse Card) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.65rem',
          backgroundColor: 'var(--theme-card-bg, #0f172a)',
          border: '1px solid var(--theme-border, #1e293b)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {/* Left: Role Indicator & Switcher ("Role Mode:") */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 800,
              color: 'var(--theme-text-muted)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            Role Mode:
          </span>

          {userRoles.length > 1 ? (
            /* Multi-role button opening role switch pop-up modal */
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-box-bg, #142037)',
                border: '1px solid var(--theme-border, #1e293b)',
                color: 'var(--theme-text)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
              title="Tap to switch between your assigned roles"
            >
              <span>{getRoleEmoji(currentUser?.role || 'Reviewer')}</span>
              <span>{currentUser?.role || 'Reviewer'}</span>
              <ChevronDown size={12} style={{ color: 'var(--theme-accent, #60a5fa)', opacity: 0.8 }} />
            </button>
          ) : (
            /* Single role static badge matching desktop exactly */
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.22rem 0.55rem',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--theme-box-bg, #142037)',
                border: '1px solid var(--theme-border, #1e293b)',
                color: 'var(--theme-text)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <span>{getRoleEmoji(currentUser?.role || 'Reviewer')}</span>
              <span>{currentUser?.role || 'Reviewer'}</span>
            </span>
          )}
        </div>

        {/* Right: Target Date Capsule & Popover */}
        <div ref={targetPopoverRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowTargetPopover((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.45rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--theme-box-bg, #142037)',
              border: '1px solid var(--theme-border, #1e293b)',
              color: 'var(--theme-text-muted)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Target completion date and pacing"
          >
            <Calendar size={12} />
            <span style={{ whiteSpace: 'nowrap' }}>
              {!countdownStats.hasTargetDate
                ? 'No Target'
                : countdownStats.isComplete
                ? '100% Done'
                : countdownStats.isPast
                ? `${countdownStats.daysOverdue}d overdue`
                : `${countdownStats.daysRemaining}d left`}
            </span>
            <ChevronDown size={10} style={{ opacity: 0.6 }} />
          </button>

          {/* Target Date Pacing Popover */}
          {showTargetPopover && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                background: 'var(--theme-card-bg, #0f172a)',
                border: '1px solid var(--theme-border, #1e293b)',
                borderRadius: '0.625rem',
                boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.45)',
                padding: '0.85rem',
                zIndex: 60,
                width: '18rem',
                maxWidth: 'calc(100vw - 2rem)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', letterSpacing: '0.05em' }}>
                  📅 TARGET COMPLETION PACE
                </span>
                <button
                  type="button"
                  onClick={() => setShowTargetPopover(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer', padding: '0.15rem' }}
                >
                  <X size={14} />
                </button>
              </div>

              {!countdownStats.hasTargetDate ? (
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.25rem' }}>
                    No Target Date Set for {currentBook}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.4, marginBottom: '0.6rem' }}>
                    A target completion date has not been configured. Coordinators can set a target date in Settings to activate the real-time countdown.
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)', marginBottom: '0.25rem' }}>
                    {currentBook} Target: {countdownStats.targetDateStr}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: countdownStats.isPast ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {countdownStats.isComplete
                      ? 'Target Achieved! 100% Complete'
                      : countdownStats.isPast
                      ? `Overdue by ${countdownStats.daysOverdue} days`
                      : `${countdownStats.daysRemaining} days remaining (${countdownStats.dailyVelocityRequired} verses/day required)`}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--theme-border, #1e293b)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--theme-text-muted)' }}>Progress:</span>
                <span style={{ fontWeight: 700, color: 'var(--theme-text)' }}>
                  {countdownStats.completed} / {countdownStats.total} ({countdownStats.progressPercent}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 1. Verse Navigation Card & Jump to Verse ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.65rem',
          backgroundColor: 'var(--theme-card-bg, #0f172a)',
          border: '1px solid var(--theme-border, #1e293b)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {/* Left: Verse Navigation (Only Verse Ref e.g. 1:1) & Canonical Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
            <button
              type="button"
              onClick={onPrevVerse}
              disabled={currentIndex === 0}
              style={{
                padding: '0.2rem 0.35rem',
                backgroundColor: 'var(--theme-box-bg, #142037)',
                border: '1px solid var(--theme-border, #1e293b)',
                borderRadius: '0.375rem',
                color: 'var(--theme-text)',
                cursor: currentIndex === 0 ? 'default' : 'pointer',
                opacity: currentIndex === 0 ? 0.35 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Previous verse"
            >
              <ChevronLeft size={14} />
            </button>
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: 'var(--theme-text)',
                padding: '0 0.25rem',
                letterSpacing: '0.02em'
              }}
              title={verse.verse}
            >
              {formatVerseRefOnly(verse.verse)}
            </span>
            <button
              type="button"
              onClick={onNextVerse}
              disabled={currentIndex >= totalInChapter - 1}
              style={{
                padding: '0.2rem 0.35rem',
                backgroundColor: 'var(--theme-box-bg, #142037)',
                border: '1px solid var(--theme-border, #1e293b)',
                borderRadius: '0.375rem',
                color: 'var(--theme-text)',
                cursor: currentIndex >= totalInChapter - 1 ? 'default' : 'pointer',
                opacity: currentIndex >= totalInChapter - 1 ? 0.35 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Next verse"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Canonical Status Badge Matching Desktop (Exact Text & Color) */}
          <span className={`status-badge ${statusBadgeColor}`} style={{ fontSize: '0.6875rem' }}>
            <i></i> {verse.status}
          </span>
        </div>

        {/* Right: [ ⊞ Verse ⌵ ] Button */}
        <button
          type="button"
          className="btn-verse-jump"
          onClick={() => setShowJumpGrid(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.22rem 0.5rem',
            borderRadius: '0.375rem',
            backgroundColor: 'var(--theme-box-bg, #142037)',
            border: '1px solid var(--theme-border, #1e293b)',
            color: 'var(--theme-text)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Select verse in chapter"
        >
          <LayoutGrid size={13} style={{ color: 'var(--theme-accent, #60a5fa)' }} />
          <span>Verse</span>
          <ChevronDown size={11} style={{ opacity: 0.7 }} />
        </button>
      </div>

      {/* ── Pop-up Modal for Verse Navigation (Centered Dialog with Backdrop) ── */}
      {showJumpGrid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => setShowJumpGrid(false)}
        >
          <div
            ref={jumpGridRef}
            style={{
              width: '100%',
              maxWidth: '340px',
              maxHeight: '78vh',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '1rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                backgroundColor: 'var(--theme-box-bg, #142037)'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    color: 'var(--theme-text)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}
                >
                  Chapter {verse.chapter} Verses
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    color: 'var(--theme-text-muted)',
                    marginTop: '2px'
                  }}
                >
                  {allChapterVerses.length} total verses · Tap to navigate
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowJumpGrid(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close verse picker"
              >
                <X size={18} />
              </button>
            </div>

            {/* Verse Grid */}
            <div
              style={{
                padding: '0.85rem',
                overflowY: 'auto',
                scrollbarWidth: 'thin'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '0.45rem'
                }}
              >
                {allChapterVerses.map((v, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isDone = v.status === 'Done';
                  const isUnderReview =
                    v.status === 'Under Review' ||
                    v.status === 'Awaiting Review' ||
                    v.status === 'Awaiting Committee';
                  return (
                    <button
                      key={v.row}
                      type="button"
                      onClick={() => {
                        onSelectVerseIndex(idx);
                        setShowJumpGrid(false);
                      }}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.45rem',
                        fontSize: '0.8125rem',
                        fontWeight: isCurrent ? 800 : 600,
                        border: isCurrent
                          ? '2px solid #2563eb'
                          : '1px solid var(--theme-border, #1e293b)',
                        backgroundColor: isCurrent
                          ? '#2563eb'
                          : isDone
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isUnderReview
                          ? 'rgba(2, 132, 199, 0.15)'
                          : 'var(--theme-box-bg, #142037)',
                        color: isCurrent
                          ? '#ffffff'
                          : isDone
                          ? '#10b981'
                          : isUnderReview
                          ? '#38bdf8'
                          : 'var(--theme-text)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                      title={`Verse ${idx + 1} (${v.status})`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pop-up Modal for Switching User Role (Mobile) ── */}
      {showRoleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => setShowRoleModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '1rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                backgroundColor: 'var(--theme-box-bg, #142037)'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    color: 'var(--theme-text)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Switch Role Mode
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    color: 'var(--theme-text-muted)',
                    marginTop: '2px'
                  }}
                >
                  Assigned roles for {currentUser?.name || 'your profile'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close role switcher"
              >
                <X size={18} />
              </button>
            </div>

            {/* Roles List */}
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {userRoles.map((roleName) => {
                const isActive = (currentUser?.role || '').toLowerCase() === roleName.toLowerCase();
                return (
                  <button
                    key={roleName}
                    type="button"
                    onClick={() => {
                      if (onSelectUserRole) onSelectUserRole(roleName);
                      setShowRoleModal(false);
                      showToast('success', `Switched to ${roleName} mode`);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '0.5rem',
                      border: isActive
                        ? '1.5px solid #2563eb'
                        : '1px solid var(--theme-border, #1e293b)',
                      backgroundColor: isActive
                        ? 'rgba(37, 99, 235, 0.15)'
                        : 'var(--theme-box-bg, #142037)',
                      color: isActive ? '#60a5fa' : 'var(--theme-text)',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{getRoleEmoji(roleName)}</span>
                      <span>{roleName}</span>
                    </div>
                    {isActive && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '9999px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff'
                        }}
                      >
                        Active ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            aria-label="Copy base reference text"
            title={copiedBaseRef ? 'Copied!' : 'Copy reference text'}
            style={{
              background: 'none',
              border: 'none',
              color: copiedBaseRef ? '#10b981' : 'var(--theme-text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              transition: 'all 0.15s ease'
            }}
          >
            {copiedBaseRef ? <Check size={13} /> : <Copy size={13} />}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Font Zoomers: clean desktop-style A⁻ / A⁺ without numeric label */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--theme-box-bg, #142037)',
                padding: '2px',
                borderRadius: '0.375rem',
                border: '1px solid var(--theme-border, #1e293b)'
              }}
            >
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                style={{
                  padding: '0.125rem 0.35rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-text)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  lineHeight: 1
                }}
                aria-label="Decrease Kannada text size"
                title="Smaller Kannada text"
              >
                A<sup>−</sup>
              </button>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                style={{
                  padding: '0.125rem 0.35rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--theme-text)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  lineHeight: 1
                }}
                aria-label="Increase Kannada text size"
                title="Larger Kannada text"
              >
                A<sup>+</sup>
              </button>
            </div>

            {/* Icon-only copy button matching desktop */}
            <button
              type="button"
              onClick={handleCopyKannada}
              aria-label="Copy proposed Kannada text"
              title={copiedKannada ? 'Copied!' : 'Copy proposed reading'}
              style={{
                background: 'none',
                border: 'none',
                color: copiedKannada ? '#10b981' : 'var(--theme-text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.375rem',
                transition: 'all 0.15s ease'
              }}
            >
              {copiedKannada ? <Check size={13} /> : <Copy size={13} />}
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
            padding: '0.65rem 0.875rem',
            background: 'var(--theme-box-bg, #142037)',
            border: 'none',
            borderBottom: showNotes ? '1px solid var(--theme-border, #1e293b)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={15} color="#f59e0b" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  color: 'var(--theme-text)',
                  lineHeight: 1.2
                }}
              >
                Drafter comments &amp; back-translation
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--theme-text-muted)',
                  marginTop: '1px'
                }}
              >
                {(parsedCmt?.wordPairs || []).length > 0 || (parsedCmt?.notes || []).length > 0
                  ? `${(parsedCmt?.wordPairs || []).length} pairs · ${(parsedCmt?.notes || []).length} notes`
                  : 'Investigation notes & lexical choices'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {showNotes ? (
              <ChevronUp size={18} color="var(--theme-text-muted)" />
            ) : (
              <ChevronDown size={18} color="var(--theme-text-muted)" />
            )}
          </div>
        </button>

        {showNotes && (
          <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {/* Word-Pairs Horizontal Snap Track with Preserved Drafter Colors */}
            {(parsedCmt?.wordPairs || []).length > 0 ? (
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
                  {(parsedCmt?.wordPairs || []).map((pair, idx) => (
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
            {(parsedCmt?.notes || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {(parsedCmt?.notes || []).map((note, idx) => (
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
            {(!parsedCmt?.wordPairs || parsedCmt.wordPairs.length === 0) && (!parsedCmt?.notes || parsedCmt.notes.length === 0) && (
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

      {/* ── 5. Fixed Deliberate Action Dock (Centered just above bottom navigation) ── */}
      <div
        className="mobile-action-dock"
        style={{
          position: 'fixed',
          bottom: 'calc(3.85rem + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '380px',
          zIndex: 40,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => {
            const r = (currentUser?.role || '').toLowerCase();
            if (r.includes('tech')) setDrawerDiscipline('tech');
            else if (r.includes('style') || r.includes('lang')) setDrawerDiscipline('style');
            else if (r.includes('ortho')) setDrawerDiscipline('ortho');
            else if (r.includes('theo')) setDrawerDiscipline('theo');
            else if (r.includes('comm')) setDrawerDiscipline('comm');
            setShowDisciplineModal(false);
            setShowDeliberationDrawer(true);
          }}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.625rem 1rem',
            backgroundColor: 'var(--theme-card-bg, #0f172a)',
            border: '1px solid var(--theme-border, #334155)',
            borderRadius: '0.75rem',
            color: 'var(--theme-accent, #38bdf8)',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={17} />
          <span>Deliberate</span>
          {totalCommentsCount > 0 && (
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.08rem 0.45rem',
                borderRadius: '9999px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 800
              }}
            >
              {totalCommentsCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 6. Deliberation Pop-up Modal (Centered Dialog with Dimmed Backdrop) ── */}
      {showDeliberationDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => {
            setShowDeliberationDrawer(false);
            setShowDisciplineModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '82vh',
              maxHeight: '620px',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              border: '1px solid var(--theme-border, #1e293b)',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Consolidated Header (Row 1 & Row 2) ── */}
            <div
              style={{
                backgroundColor: 'var(--theme-box-bg, #142037)',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                padding: '0.65rem 0.85rem',
                flexShrink: 0
              }}
            >
              {/* Row 1: Active Discipline + Switcher Button + Close ✕ */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowDisciplineModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--theme-card-bg, #0f172a)',
                      border: '1px solid var(--theme-border, #334155)',
                      color: 'var(--theme-text)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Tap to switch discipline"
                  >
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {disciplines.find((d) => d.key === drawerDiscipline)?.label} Review
                    </span>
                    <ChevronDown size={13} style={{ color: '#38bdf8' }} />
                  </button>

                  <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>
                    ({verse.verse})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeliberationDrawer(false)}
                  style={{
                    backgroundColor: 'var(--theme-card-bg, #0f172a)',
                    border: '1px solid var(--theme-border, #334155)',
                    color: 'var(--theme-text)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  aria-label="Close deliberation modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Row 2: Status Pill + Expandable Proposed Reading Snippet Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.45rem',
                  paddingTop: '0.35rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '0.6875rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: disciplines.find((d) => d.key === drawerDiscipline)?.confirmed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(56, 189, 248, 0.15)',
                      color: disciplines.find((d) => d.key === drawerDiscipline)?.confirmed
                        ? '#10b981'
                        : '#38bdf8',
                      border: disciplines.find((d) => d.key === drawerDiscipline)?.confirmed
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {disciplines.find((d) => d.key === drawerDiscipline)?.confirmed
                      ? '● Confirmed (Y)'
                      : '○ Awaiting Review'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandVerseSnippet((v) => !v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: expandVerseSnippet ? 'rgba(56, 189, 248, 0.15)' : 'var(--theme-card-bg, #0f172a)',
                    border: '1px solid var(--theme-border, #334155)',
                    color: '#38bdf8',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Proposed</span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: expandVerseSnippet ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </button>
              </div>

              {/* Expandable Kannada Proposed Reading Snippet with Preserved Rich Text Colors & Highlights */}
              {expandVerseSnippet && (
                <div
                  style={{
                    marginTop: '0.45rem',
                    padding: '0.55rem 0.75rem',
                    backgroundColor: 'var(--theme-card-bg, #0f172a)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--theme-border, #1e293b)',
                    fontSize: '0.8125rem',
                    lineHeight: 1.6
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.3rem',
                      paddingBottom: '0.25rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#38bdf8' }}>
                      📖 Drafter Proposed Reading ({verse.verse})
                    </span>
                  </div>
                  {verse.proposedHtml ? (
                    <div
                      className="kannada-reading rich-cell-content"
                      style={{
                        fontFamily: 'Noto Sans Kannada',
                        fontSize: '0.875rem',
                        lineHeight: '1.7',
                        color: 'var(--theme-text)'
                      }}
                      dangerouslySetInnerHTML={{ __html: trimReadingHtml(verse.proposedHtml) }}
                    />
                  ) : (
                    <div
                      style={{
                        fontFamily: 'Noto Sans Kannada',
                        fontSize: '0.875rem',
                        color: 'var(--theme-text)'
                      }}
                    >
                      {verse.proposed || 'No proposed reading'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Modern Chat Bubbles Discussion Feed ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.75rem 0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                backgroundColor: 'var(--theme-canvas-bg, #020617)'
              }}
            >
              {drawerComments.length === 0 ? (
                <div style={{ margin: 'auto 0', textAlign: 'center', padding: '2rem 1rem', color: 'var(--theme-text-muted)' }}>
                  <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                    💬 No observations yet for {disciplines.find((d) => d.key === drawerDiscipline)?.label} Review.
                  </p>
                  <small style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                    Share your linguistic or theological insight below or proceed with Confirm (Y).
                  </small>
                </div>
              ) : (
                drawerComments.map((cmt) => {
                  const isSelf =
                    (cmt.authorName || '').trim().toLowerCase() ===
                    (currentUser?.name || '').trim().toLowerCase();
                  return (
                    <div
                      key={cmt.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSelf ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: isSelf ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginBottom: '2px',
                          padding: '0 4px',
                          fontSize: '0.625rem',
                          color: 'var(--theme-text-muted)'
                        }}
                      >
                        <b style={{ color: isSelf ? '#60a5fa' : '#38bdf8' }}>
                          {isSelf ? 'You' : cmt.authorName}
                        </b>
                        <span>·</span>
                        <span>{cmt.timestamp}</span>
                      </div>
                      <div
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: isSelf ? '0.875rem 0.875rem 0.2rem 0.875rem' : '0.875rem 0.875rem 0.875rem 0.2rem',
                          backgroundColor: isSelf ? '#2563eb' : 'var(--theme-box-bg, #142037)',
                          color: isSelf ? '#ffffff' : 'var(--theme-text)',
                          border: isSelf ? 'none' : '1px solid var(--theme-border, #1e293b)',
                          fontSize: '0.8125rem',
                          lineHeight: 1.45,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        {cmt.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Dual-Action Bottom Bar: Row 1 Composer, Row 2 Confirm (Y) ── */}
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--theme-card-bg, #0f172a)',
                borderTop: '1px solid var(--theme-border, #1e293b)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flexShrink: 0
              }}
            >
              {/* Row 1: Comment Composer */}
              {isAssigned ? (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={drawerCommentText}
                    onChange={(e) => setDrawerCommentText(e.target.value)}
                    placeholder={`Comment on ${disciplines.find((d) => d.key === drawerDiscipline)?.label}…`}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.75rem',
                      border: '1px solid var(--theme-border, #1e293b)',
                      background: 'var(--theme-input-bg, #0b1220)',
                      color: 'var(--theme-text)',
                      borderRadius: '0.5rem',
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
                      padding: '0.55rem 0.85rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: drawerCommentText.trim() ? 'pointer' : 'default',
                      opacity: drawerCommentText.trim() ? 1 : 0.5,
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

              {/* Row 2: Confirm (Y) Action Button */}
              {isAssigned && (
                <div>
                  {disciplines.find((d) => d.key === drawerDiscipline)?.confirmed ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem 0.85rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '0.5rem',
                        color: '#10b981',
                        fontSize: '0.8125rem',
                        fontWeight: 700
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Confirmed (Y) for {verse.verse}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmDiscipline}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1rem',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm (Y)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Discipline Switcher Pop-up Modal ── */}
      {showDisciplineModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => setShowDisciplineModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: 'var(--theme-card-bg, #0f172a)',
              border: '1px solid var(--theme-border, #334155)',
              borderRadius: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--theme-border, #1e293b)',
                paddingBottom: '0.6rem'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                Select Review Discipline
              </h3>
              <button
                type="button"
                onClick={() => setShowDisciplineModal(false)}
                style={{
                  backgroundColor: 'var(--theme-card-bg, #0f172a)',
                  border: '1px solid var(--theme-border, #334155)',
                  color: 'var(--theme-text)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                aria-label="Close discipline selector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Disciplines List with Individual Assigned Names Cleanly Under Each */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {disciplines.map((d) => {
                const isSelected = drawerDiscipline === d.key;
                
                // Get all active members assigned to this discipline, supporting both single role and dual roles (m.role and m.roles)
                const assignedMembers = (team || [])
                  .filter((m) => {
                    if (!m) return false;
                    if (m.active === false || m.active === 'No') return false;
                    const allRoles = [
                      m.role,
                      ...(Array.isArray(m.roles) ? m.roles : [])
                    ].filter(Boolean).map((r) => String(r).toLowerCase());

                    return allRoles.some((r) => {
                      if (d.key === 'tech') return r.includes('tech');
                      if (d.key === 'style') return r.includes('style') || r.includes('lang');
                      if (d.key === 'ortho') return r.includes('ortho');
                      if (d.key === 'theo') return r.includes('theo');
                      if (d.key === 'comm') return r.includes('comm');
                      return false;
                    });
                  })
                  .map((m) => String(m.name || '').trim())
                  .filter(Boolean);

                const uniqueMembers = Array.from(new Set(assignedMembers));
                const memberDisplay = uniqueMembers.length > 0
                  ? uniqueMembers.join(', ')
                  : d.reviewer;

                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setDrawerDiscipline(d.key as any);
                      setShowDisciplineModal(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      border: isSelected
                        ? '1px solid #38bdf8'
                        : '1px solid var(--theme-border, #334155)',
                      backgroundColor: isSelected
                        ? 'rgba(56, 189, 248, 0.12)'
                        : 'var(--theme-box-bg, #142037)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1, marginRight: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: isSelected ? '#38bdf8' : 'var(--theme-text)'
                        }}
                      >
                        {d.label} Review
                      </span>
                      {/* Individual names cleanly arranged under each discipline title - no icon, no ellipsis */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--theme-text-muted)',
                          lineHeight: 1.35
                        }}
                      >
                        {memberDisplay}
                      </span>
                    </div>

                    {/* Only show Confirmed status; Awaiting status and message counts removed */}
                    {d.confirmed && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          ● Confirmed
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
