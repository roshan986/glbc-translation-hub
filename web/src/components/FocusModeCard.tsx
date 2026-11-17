import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Send,
  SkipForward,
  CheckCircle,
  CheckCircle2,
  LayoutGrid,
  Users,
  Lock,
  FileUp,
  Sliders,
  Palette,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  SpellCheck,
  Maximize2,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import type { VerseItem, TeamMember, ReviewerRole, CommentItem } from '../types';
import type { ActiveTab } from './Sidebar';
import { parseDrafterComments } from '../utils/drafterParser';
import { getKjvVerse, getBookTotalVerses } from '../services/kjvService';
import { computeVerseApprovals } from '../utils/approvalEngine';
import { getSmartInitials, getRoleAvatarColor, isCommentByCurrentUser } from '../utils/userUtils';
import { calculatePacingStats } from '../utils/pacingEngine';
import { showToast } from '../utils/toast';
import { DiscussionPopoutModal } from './DiscussionPopoutModal';
import { ApprovalImpactModal, type ApprovalActionType } from './ApprovalImpactModal';

interface FocusModeCardProps {
  verse: VerseItem;
  currentIndex: number;
  totalInChapter: number;
  allChapterVerses: VerseItem[];
  currentBook: string;
  currentUser: TeamMember;
  team: TeamMember[];
  bookCompletedCount?: number;
  bookTotalCount?: number;
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onSelectVerseIndex: (index: number) => void;
  onApproveVerse: (row: number, role: ReviewerRole, comment?: string) => void;
  onAddComment?: (row: number, role: ReviewerRole, comment: string) => void;
  onRequestEdit?: (row: number, role: ReviewerRole, comment: string) => void;
  onOpenWhatsApp: (verse: VerseItem) => void;
  onOpenShortcuts: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onSelectUserRole?: (role: string) => void;
  onApproveConsensus?: (row: number, conclusionNotes: string) => Promise<void>;
  onRequestReReview?: (row: number, notes: string) => Promise<void>;
  onSubmitFinal?: (row: number, finalReading: string) => Promise<void>;
  onOpenPicker?: () => void;
  onInitBook?: (bookName: string) => Promise<void>;
}

// Clean trailing empty breaks, whitespace, and empty spans from imported sheet text
const trimReadingHtml = (html?: string): string => {
  if (!html) return '';
  return html
    .replace(/(?:<br\s*\/?>|\s|&nbsp;|<span[^>]*>\s*<\/span>)+$/gi, '')
    .replace(/^(?:<br\s*\/?>|\s|&nbsp;)+/gi, '')
    .trim();
};

const trimReadingText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/(?:\r\n|\r|\n|\s)+$/g, '').trim();
};

export const FocusModeCard: React.FC<FocusModeCardProps> = ({
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
  onRequestEdit,
  onOpenWhatsApp,
  onOpenShortcuts: _onOpenShortcuts,
  onNavigateTab,
  onSelectUserRole,
  onApproveConsensus,
  onRequestReReview: _onRequestReReview,
  onSubmitFinal,
  onOpenPicker,
  onInitBook: _onInitBook
}) => {
  const [fontSize, setFontSize] = useState<number>(16);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showJumpGrid, setShowJumpGrid] = useState<boolean>(false);
  const [referenceTab, setReferenceTab] = useState<'kjv' | 'oldKannada'>('kjv');

  // Target Date & Countdown Engine (Synced with Settings)
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });
  const [showTargetPopover, setShowTargetPopover] = useState<boolean>(false);
  const targetPopoverRef = useRef<HTMLDivElement>(null);

  // Synchronize target date reactively when currentBook changes or settings are updated
  useEffect(() => {
    const updateTargetDate = () => {
      const saved = localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
      setTargetDateStr(saved);
    };
    updateTargetDate();
    window.addEventListener('storage', updateTargetDate);
    return () => window.removeEventListener('storage', updateTargetDate);
  }, [currentBook]);

  // Click outside and ESC key listener to dismiss the target popover
  useEffect(() => {
    if (!showTargetPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (targetPopoverRef.current && !targetPopoverRef.current.contains(e.target as Node)) {
        setShowTargetPopover(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTargetPopover(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTargetPopover]);

  const countdownStats = useMemo(() => {
    const total = bookTotalCount || getBookTotalVerses(currentBook);
    const completed = bookCompletedCount !== undefined
      ? bookCompletedCount
      : allChapterVerses.filter((v) => v.status === 'Done').length;
    const remainingVerses = Math.max(0, total - completed);
    const pacing = calculatePacingStats(targetDateStr, total, completed);

    return {
      hasTargetDate: pacing.hasTargetDate,
      targetDateStr: pacing.targetDateStr,
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

  // Final editor form state: Col Q starts EMPTY unless an existing published final text is already saved in Google Sheets!
  const [finalText, setFinalText] = useState<string>('');
  const [checklist, setChecklist] = useState({
    fidelity: false,
    register: false,
    theology: false,
    ortho: false
  });

  // User's assigned roles
  const userRoles = useMemo(() => {
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles;
    }
    return [currentUser.role];
  }, [currentUser]);

  // Active role tab inside Focus Mode
  const [activeRole, setActiveRole] = useState<string>(currentUser.role);

  // Sync if currentUser.role changes externally
  useEffect(() => {
    if (currentUser.role && currentUser.role !== activeRole) {
      setActiveRole(currentUser.role);
    }
  }, [currentUser.role]);

  // Sync final text: strictly Col Q from sheet, NEVER Col O comments!
  useEffect(() => {
    setFinalText(verse.reviews.final || '');
  }, [verse.row, verse.reviews.final]);

  // Compute live multi-member approval progress
  const approvals = useMemo(() => {
    return verse.approvals || computeVerseApprovals(verse.reviews, verse.confirms, team);
  }, [verse, team]);

  // Chat window state (Committee) - collapsed by default for reading ease
  const [isCommitteeChatCollapsed, setIsCommitteeChatCollapsed] = useState<boolean>(true);

  // Accordion collapse state for each discipline card - collapsed by default
  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Record<string, boolean>>({
    tech: true,
    style: true,
    ortho: true,
    theo: true
  });

  const toggleDisciplineCollapse = (key: string) => {
    setCollapsedDisciplines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Draft comments per discipline composer
  const [disciplineCommentDrafts, setDisciplineCommentDrafts] = useState<Record<string, string>>({
    tech: '',
    style: '',
    ortho: '',
    theo: '',
    comm: ''
  });

  // Dedicated Popout Modal state
  const [popoutData, setPopoutData] = useState<{
    isOpen: boolean;
    title: string;
    disciplineKey?: 'tech' | 'style' | 'ortho' | 'theo' | 'comm';
    roleKey: ReviewerRole;
    roleLabel: string;
  }>({
    isOpen: false,
    title: '',
    roleKey: 'TECH',
    roleLabel: 'Technical Reviewer'
  });

  // Check if current user is an assigned reviewer for this discipline
  const isUserAssignedToDiscipline = (discKey: 'tech' | 'style' | 'ortho' | 'theo'): boolean => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    return allUserRoles.some((r) => r.includes(discKey));
  };

  // Check if current user is an assigned committee member
  const isUserAssignedToCommittee = (): boolean => {
    if (!currentUser) return false;
    const allUserRoles = [currentUser.role, ...userRoles].filter(Boolean).map((r) => r.toLowerCase());
    return allUserRoles.some((r) => r.includes('comm'));
  };

  // Local storage key for tracking read comments per user
  const readCommentsStorageKey = useMemo(() => {
    return `glbc_read_comments_${currentUser?.email || currentUser?.name || 'user'}`;
  }, [currentUser]);

  // Read comments map: Record<`${verseRef}_${cardKey}`, number>
  const [readCommentsMap, setReadCommentsMap] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(`glbc_read_comments_${currentUser?.email || currentUser?.name || 'user'}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const markCommentsAsRead = (cardKey: string, totalCount: number) => {
    const mapKey = `${verse.verse}_${cardKey}`;
    setReadCommentsMap((prev) => {
      const updated = { ...prev, [mapKey]: totalCount };
      try {
        localStorage.setItem(readCommentsStorageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not persist read comments map', err);
      }
      return updated;
    });
  };

  const getUnreadCommentsCount = (cardKey: string, comments: CommentItem[]): number => {
    if (!comments || comments.length === 0) return 0;
    const mapKey = `${verse.verse}_${cardKey}`;
    const otherComments = comments.filter((c) => !isCommentByCurrentUser(c.authorName, currentUser?.name));
    const lastReadCount = readCommentsMap[mapKey] ?? 0;
    return Math.max(0, otherComments.length - lastReadCount);
  };

  // Auto-mark open discussion cards as read on verse change
  useEffect(() => {
    if (!isCommitteeChatCollapsed) {
      const commComments = (verse.comments || []).filter((c) => c.authorRole.toLowerCase().includes('comm'));
      markCommentsAsRead('comm', commComments.length);
    }
    ['tech', 'style', 'ortho', 'theo'].forEach((key) => {
      if (!collapsedDisciplines[key]) {
        const discComments = (verse.comments || []).filter((c) => c.authorRole.toLowerCase().includes(key));
        markCommentsAsRead(key, discComments.length);
      }
    });
  }, [verse.row, verse.verse, isCommitteeChatCollapsed, collapsedDisciplines]);

  // Is verse finalized and locked?
  const isFinalized = verse.confirms.final || verse.status === 'Done';

  // Check if a verse is confirmed by a specific role
  const isVerseConfirmedForRole = (v: VerseItem, rName: string): boolean => {
    const lr = rName.toLowerCase();
    if (lr.includes('tech')) return Boolean(v.confirms.tech);
    if (lr.includes('style')) return Boolean(v.confirms.style);
    if (lr.includes('ortho')) return Boolean(v.confirms.ortho);
    if (lr.includes('theo')) return Boolean(v.confirms.theo);
    if (lr.includes('comm')) return Boolean(v.confirms.comm);
    if (lr.includes('final')) return Boolean(v.confirms.final);
    return false;
  };

  // Check if a verse is pending for activeRole
  const isVersePendingForActiveRole = (v: VerseItem): boolean => {
    return !isVerseConfirmedForRole(v, activeRole) && v.status !== 'Done';
  };

  // Find next pending verse in current chapter
  const nextPendingVerse = useMemo(() => {
    for (let i = currentIndex + 1; i < allChapterVerses.length; i++) {
      if (isVersePendingForActiveRole(allChapterVerses[i])) {
        return { verse: allChapterVerses[i], index: i };
      }
    }
    for (let i = 0; i < currentIndex; i++) {
      if (isVersePendingForActiveRole(allChapterVerses[i])) {
        return { verse: allChapterVerses[i], index: i };
      }
    }
    return null;
  }, [allChapterVerses, currentIndex, activeRole]);

  // State for Y/N Impact Confirmation Modal
  const [showImpactModal, setShowImpactModal] = useState<boolean>(false);
  const [impactConfig, setImpactConfig] = useState<{
    actionType: ApprovalActionType;
    stageTitle: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Determine role type of active role tab
  const roleUpper = activeRole.toUpperCase();
  const isDisciplineReviewer =
    roleUpper.includes('TECH') ||
    roleUpper.includes('STYLE') ||
    roleUpper.includes('ORTHO') ||
    roleUpper.includes('THEO');
  const isCommittee = roleUpper.includes('COMM');
  const isFinalEditor = roleUpper.includes('FINAL');
  const isDrafter = roleUpper.includes('DRAFT');

  // Map to ReviewerRole for API
  const reviewerRole: ReviewerRole = useMemo(() => {
    if (roleUpper.includes('TECH')) return 'TECH';
    if (roleUpper.includes('STYLE')) return 'STYLE';
    if (roleUpper.includes('ORTHO')) return 'ORTHO';
    if (roleUpper.includes('THEO')) return 'THEO';
    if (roleUpper.includes('COMM')) return 'COMM';
    if (roleUpper.includes('FINAL')) return 'FINAL';
    return 'DRAFTER';
  }, [roleUpper]);

  // Confirmation status for tabs
  const getRoleConfirmInfo = (roleName: string) => {
    const up = roleName.toUpperCase();
    if (up.includes('TECH')) return { isConfirmed: approvals.tech.isFullyApproved, label: 'Technical' };
    if (up.includes('STYLE')) return { isConfirmed: approvals.style.isFullyApproved, label: 'Style & Language' };
    if (up.includes('ORTHO')) return { isConfirmed: approvals.ortho.isFullyApproved, label: 'Orthographic' };
    if (up.includes('THEO')) return { isConfirmed: approvals.theo.isFullyApproved, label: 'Theological' };
    if (up.includes('COMM')) return { isConfirmed: approvals.comm.isFullyApproved, label: 'Committee' };
    if (up.includes('FINAL')) return { isConfirmed: verse.confirms.final, label: 'Final Editor' };
    if (up.includes('DRAFT')) return { isConfirmed: verse.confirms.drafter, label: 'Drafter' };
    return { isConfirmed: false, label: roleName };
  };

  const getRoleIcon = (roleName: string) => {
    const up = roleName.toUpperCase();
    if (up.includes('TECH')) return <Sliders size={14} />;
    if (up.includes('STYLE')) return <Palette size={14} />;
    if (up.includes('ORTHO')) return <SpellCheck size={14} />;
    if (up.includes('THEO')) return <BookOpen size={14} />;
    if (up.includes('COMM')) return <Users size={14} />;
    if (up.includes('FINAL')) return <Lock size={14} />;
    return <FileUp size={14} />;
  };

  const handleRoleTabClick = (newRole: string) => {
    setActiveRole(newRole);
    if (onSelectUserRole) {
      onSelectUserRole(newRole);
    }
  };

  // Canonical KJV English verse text (instant synchronous resolution if verse.oldReading is English)
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

  // Parsed drafter notes and back-translations
  const parsedContent = useMemo(() => {
    return parseDrafterComments(verse.drafterCmtHtml || verse.drafterCmt || '');
  }, [verse.drafterCmt, verse.drafterCmtHtml]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (isInput) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleSendComment();
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        onNextVerse();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevVerse();
      } else if (e.key === 'Enter' && !isFinalized) {
        e.preventDefault();
        if (isDisciplineReviewer) handleApproveDiscipline();
        else if (isCommittee) handleApproveCommittee();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        const textarea = document.getElementById('review-comment') as HTMLTextAreaElement;
        if (textarea) textarea.focus();
      } else if (e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setShowJumpGrid((v) => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verse, commentText, currentUser, activeRole, isFinalized, isDisciplineReviewer, isCommittee]);

  // Copy reference text
  const handleCopyReference = () => {
    const textToCopy = referenceTab === 'kjv'
      ? (kjvText || verse.oldReading || '')
      : (verse.oldReading || '');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Actions for Discipline Reviewers - Opens Impact Confirmation Modal
  const handleApproveDiscipline = () => {
    if (isSubmitting || isFinalized) return;
    setImpactConfig({
      actionType: 'reviewer',
      stageTitle: getRoleConfirmInfo(activeRole).label,
      onConfirm: async () => {
        setIsSubmitting(true);
        await onApproveVerse(verse.row, reviewerRole, commentText.trim() || undefined);
        setCommentText('');
        setIsSubmitting(false);
        if (nextPendingVerse) {
          onSelectVerseIndex(nextPendingVerse.index);
        }
      }
    });
    setShowImpactModal(true);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || isSubmitting || isFinalized) return;
    setIsSubmitting(true);
    if (onAddComment) {
      await onAddComment(verse.row, reviewerRole, commentText.trim());
    } else if (onRequestEdit) {
      await onRequestEdit(verse.row, reviewerRole, commentText.trim());
    }
    setCommentText('');
    setIsSubmitting(false);
  };

  // Send comment to specific discipline
  const handleSendDisciplineComment = async (discKey: 'tech' | 'style' | 'ortho' | 'theo', roleKey: ReviewerRole) => {
    const text = (disciplineCommentDrafts[discKey] || '').trim();
    if (!text || isSubmitting || isFinalized) return;
    setIsSubmitting(true);
    if (onAddComment) {
      await onAddComment(verse.row, roleKey, text);
    } else if (onRequestEdit) {
      await onRequestEdit(verse.row, roleKey, text);
    }
    setDisciplineCommentDrafts((prev) => ({ ...prev, [discKey]: '' }));
    setIsSubmitting(false);
  };

  // Approve specific discipline directly from its card
  const handleApproveDisciplineFromCard = (discKey: 'tech' | 'style' | 'ortho' | 'theo', roleKey: ReviewerRole, roleLabel: string) => {
    if (isSubmitting || isFinalized) return;
    const text = (disciplineCommentDrafts[discKey] || '').trim();
    setImpactConfig({
      actionType: 'reviewer',
      stageTitle: `${roleLabel} Stage`,
      onConfirm: async () => {
        setIsSubmitting(true);
        await onApproveVerse(verse.row, roleKey, text || undefined);
        setDisciplineCommentDrafts((prev) => ({ ...prev, [discKey]: '' }));
        setIsSubmitting(false);
      }
    });
    setShowImpactModal(true);
  };

  const DISCIPLINES_LIST = useMemo(() => [
    {
      key: 'tech' as const,
      roleKey: 'TECH' as ReviewerRole,
      roleName: 'Technical Reviewer',
      title: 'Technical Review',
      columns: 'Cols G & H',
      color: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      icon: <Sparkles size={16} />
    },
    {
      key: 'style' as const,
      roleKey: 'STYLE' as ReviewerRole,
      roleName: 'Style & Language Reviewer',
      title: 'Style & Language Review',
      columns: 'Cols I & J',
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      icon: <FileText size={16} />
    },
    {
      key: 'ortho' as const,
      roleKey: 'ORTHO' as ReviewerRole,
      roleName: 'Orthographic Reviewer',
      title: 'Orthographic Review',
      columns: 'Cols K & L',
      color: '#4f46e5',
      bgColor: '#eef2ff',
      borderColor: '#c7d2fe',
      icon: <BookOpen size={16} />
    },
    {
      key: 'theo' as const,
      roleKey: 'THEO' as ReviewerRole,
      roleName: 'Theological Reviewer',
      title: 'Theological Review',
      columns: 'Cols M & N',
      color: '#e11d48',
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
      icon: <CheckCircle2 size={16} />
    }
  ], []);

  const getDisciplineComments = (discKey: 'tech' | 'style' | 'ortho' | 'theo'): CommentItem[] => {
    return (verse.comments || []).filter((c) =>
      c.authorRole.toLowerCase().includes(discKey)
    );
  };

  const renderDisciplineCard = (disc: typeof DISCIPLINES_LIST[0]) => {
    const isAssigned = isUserAssignedToDiscipline(disc.key);
    const approvalStatus = approvals[disc.key];
    const isFullyApproved = approvalStatus.isFullyApproved;
    const isMeApproved = approvalStatus.approvedMembers.some((m) => isCommentByCurrentUser(m, currentUser?.name));
    const isCollapsed = collapsedDisciplines[disc.key];
    const draftText = disciplineCommentDrafts[disc.key] || '';
    const comments = getDisciplineComments(disc.key);
    const unreadCount = getUnreadCommentsCount(disc.key, comments);

    return (
      <div
        key={disc.key}
        className="discipline-card"
        style={{
          background: 'var(--theme-card-bg)',
          border: `1px solid ${isFullyApproved ? '#a7f3d0' : 'var(--theme-border)'}`,
          borderLeft: `4px solid ${disc.color}`,
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: '0.75rem',
          overflow: 'hidden',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Discipline Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            background: isFullyApproved ? 'rgba(16, 185, 129, 0.12)' : 'var(--theme-box-bg, #fafafa)',
            borderBottom: isCollapsed ? 'none' : '1px solid var(--theme-border, #f1f5f9)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          {/* 2-Line Header: Line 1 Title, Line 2 Status & Named Members */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {/* Line 1: Icon and Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ color: disc.color, display: 'flex', alignItems: 'center' }}>{disc.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                {disc.title}
              </span>
            </div>

            {/* Line 2: Status pill + Named Member Chips directly below on the left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              {isFullyApproved ? (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle2 size={12} /> Confirmed
                </span>
              ) : (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  border: '1px solid #c7d2fe',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  Pending
                </span>
              )}

              {/* Named Member Chips */}
              {approvalStatus.approvedMembers.map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '0.25rem',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}
                  title={`${m} confirmed this stage`}
                >
                  {m} ✓
                </span>
              ))}
              {approvalStatus.pendingMembers.map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.1rem 0.35rem',
                    borderRadius: '0.25rem',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a'
                  }}
                  title={`${m} pending review`}
                >
                  {m} ⏳
                </span>
              ))}
              {approvalStatus.approvedMembers.length === 0 && approvalStatus.pendingMembers.length === 0 && (
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No reviewer assigned
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Unread badge, Popout & Collapse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.45rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title={`${unreadCount} unread comments`}
              >
                ● {unreadCount} unread
              </span>
            )}
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                markCommentsAsRead(disc.key, comments.length);
                setPopoutData({
                  isOpen: true,
                  title: disc.title,
                  disciplineKey: disc.key,
                  roleKey: disc.roleKey,
                  roleLabel: disc.roleName
                });
              }}
              title="Open full conversation in popup modal"
            >
              <Maximize2 size={13} />
              <span>Pop Out</span>
            </button>
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => {
                if (isCollapsed) {
                  markCommentsAsRead(disc.key, comments.length);
                }
                toggleDisciplineCollapse(disc.key);
              }}
              title={isCollapsed ? 'Expand discipline discussion' : 'Collapse discipline discussion'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>{isCollapsed ? `Expand (${comments.length})` : 'Collapse'}</span>
            </button>
          </div>
        </div>

        {/* Card Body (when expanded) */}
        {!isCollapsed && (
          <div style={{ padding: '0.75rem 1rem' }}>
            {/* Comment Stream */}
            <div className="comment-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '0.75rem' }}>
              {comments.length > 0 ? (
                comments.map((cmt) => {
                  const isMe = isCommentByCurrentUser(cmt.authorName, currentUser?.name);
                  return (
                    <div key={cmt.id} className={`chat-bubble-row ${isMe ? 'me' : 'other'}`}>
                      <div className={`chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                        <span
                          className={`avatar small ${cmt.avatarColor || getRoleAvatarColor(isMe ? disc.roleName : cmt.authorRole)}`}
                          style={{ width: '1.65rem', height: '1.65rem', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}
                          title={isMe ? `${currentUser?.name} (You)` : cmt.authorName}
                        >
                          {getSmartInitials(isMe ? (currentUser?.name || cmt.authorName) : cmt.authorName)}
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', fontSize: '0.6875rem' }}>
                            {isMe ? (
                              <>
                                <span style={{ fontWeight: 700, color: '#4338ca' }}>You</span>
                                <span style={{ padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                                  {disc.roleName}
                                </span>
                              </>
                            ) : (
                              <>
                                <b style={{ color: 'var(--theme-text)' }}>{cmt.authorName}</b>
                                <span style={{ padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: 'var(--theme-box-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)', fontWeight: 600 }}>
                                  {cmt.authorRole}
                                </span>
                              </>
                            )}
                            {cmt.isApproval && (
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#dcfce7', color: '#166534' }}>
                                ✓ Approved
                              </span>
                            )}
                            <time style={{ color: '#94a3b8' }}>{cmt.timeAgo}</time>
                          </div>

                          <div className={`chat-bubble-box ${isMe ? 'me' : 'other'}`}>
                            {cmt.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>
                  No deliberation notes recorded yet for {disc.title}.
                </div>
              )}
            </div>

            {/* Strict Intra-Team Commenting Boundary */}
            {isAssigned && !isFinalized && !verse.isReferenceOnly ? (
              <div className="comment-composer" style={{ marginTop: '0.5rem' }}>
                <textarea
                  rows={2}
                  value={draftText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDisciplineCommentDrafts((prev) => ({ ...prev, [disc.key]: val }));
                  }}
                  placeholder={`Add a review observation as You (${disc.title}) in English or ಕನ್ನಡ …`}
                  style={{ fontSize: '0.8125rem' }}
                />
                <div className="composer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                    Posting as <b>You</b> ({disc.title})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="send-comment"
                      disabled={!draftText.trim() || isSubmitting}
                      onClick={() => handleSendDisciplineComment(disc.key, disc.roleKey)}
                      aria-label="Send note"
                      title="Post note to column"
                    >
                      <Send size={13} />
                    </button>
                    {!isMeApproved && (
                      <button
                        type="button"
                        onClick={() => handleApproveDisciplineFromCard(disc.key, disc.roleKey, disc.title)}
                        disabled={isSubmitting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={`Confirm approval for ${disc.title} (Y)`}
                      >
                        <CheckCircle2 size={13} /> Confirm (Y)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !isAssigned && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--theme-text-muted)',
                  backgroundColor: 'var(--theme-box-bg)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px dashed var(--theme-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem'
                }}>
                  <Lock size={13} color="var(--theme-text-muted)" />
                  <span>
                    Read-only deliberation · Only assigned <b>{disc.title}</b> members ({[...approvalStatus.approvedMembers, ...approvalStatus.pendingMembers].join(', ') || 'assigned in Config'}) can post observations or confirm this stage.
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Memoized Deliberation Hub Stats for Engaging Team Presence
  const deliberationStats = useMemo(() => {
    const comments = verse.comments || [];
    const uniqueMap = new Map<string, { name: string; role: string }>();
    comments.forEach((c) => {
      const trimmed = (c.authorName || '').trim();
      if (trimmed && !uniqueMap.has(trimmed)) {
        uniqueMap.set(trimmed, { name: trimmed, role: c.authorRole || 'Team Member' });
      }
    });
    const contributors = Array.from(uniqueMap.values());
    const reviewerDisciplinesConfirmed = [
      approvals.tech.isFullyApproved,
      approvals.style.isFullyApproved,
      approvals.ortho.isFullyApproved,
      approvals.theo.isFullyApproved
    ].filter(Boolean).length;

    return {
      totalComments: comments.length,
      contributors,
      reviewerDisciplinesConfirmed
    };
  }, [verse.comments, approvals]);

  // Engaging Live Team Deliberation Hub Header (Option A)
  const renderDeliberationHubHeader = () => {
    const { totalComments, contributors, reviewerDisciplinesConfirmed } = deliberationStats;
    return (
      <div
        className="deliberation-hub-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.625rem 0.875rem',
          backgroundColor: 'var(--theme-box-bg)',
          borderRadius: '0.625rem',
          border: '1px solid var(--theme-border)',
          marginBottom: '0.875rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Icon + Title + Contributor Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.65rem',
                height: '1.65rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6'
              }}
            >
              <Users size={14} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
              Team Deliberations
            </span>
          </div>

          {/* Active Contributors Avatars & Names */}
          {contributors.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-0.15rem' }}>
                {contributors.map((c, i) => {
                  const initials = getSmartInitials(c.name);
                  return (
                    <div
                      key={i}
                      title={`${c.name} (${c.role})`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.45rem',
                        height: '1.45rem',
                        borderRadius: '9999px',
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        fontSize: '0.5625rem',
                        fontWeight: 700,
                        border: '2px solid var(--theme-box-bg)',
                        marginLeft: i > 0 ? '-0.3rem' : '0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        cursor: 'default'
                      }}
                    >
                      {initials}
                    </div>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', fontWeight: 500 }}>
                {contributors.map((c) => c.name).join(', ')}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              No notes recorded yet
            </span>
          )}
        </div>

        {/* Right: Notes Count & Approval Progress Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: totalComments > 0 ? 'rgba(2, 132, 199, 0.12)' : 'var(--theme-box-bg)',
              color: totalComments > 0 ? '#0284c7' : 'var(--theme-text-muted)',
              border: `1px solid ${totalComments > 0 ? 'rgba(2, 132, 199, 0.25)' : 'var(--theme-border)'}`
            }}
          >
            <MessageSquare size={12} />
            <span>{totalComments} {totalComments === 1 ? 'Note' : 'Notes'}</span>
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: reviewerDisciplinesConfirmed === 4
                ? 'rgba(16, 185, 129, 0.12)'
                : reviewerDisciplinesConfirmed > 0
                ? 'rgba(245, 158, 11, 0.12)'
                : 'var(--theme-box-bg)',
              color: reviewerDisciplinesConfirmed === 4
                ? '#10b981'
                : reviewerDisciplinesConfirmed > 0
                ? '#f59e0b'
                : 'var(--theme-text-muted)',
              border: `1px solid ${reviewerDisciplinesConfirmed === 4
                ? 'rgba(16, 185, 129, 0.25)'
                : reviewerDisciplinesConfirmed > 0
                ? 'rgba(245, 158, 11, 0.25)'
                : 'var(--theme-border)'}`
            }}
          >
            {reviewerDisciplinesConfirmed === 4 ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            <span>{reviewerDisciplinesConfirmed} of 4 Reviewers Approved</span>
          </span>
        </div>
      </div>
    );
  };

  const renderAllDisciplineCards = () => (
    <div className="all-discipline-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MessageSquare size={14} style={{ color: 'var(--theme-text-muted)' }} />
          4-DISCIPLINE TEAM REVIEW DELIBERATIONS
        </b>
        <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
          Strict intra-team commenting · Read-only across disciplines
        </span>
      </div>
      {DISCIPLINES_LIST.map((disc) => renderDisciplineCard(disc))}
    </div>
  );

  const renderCommitteeCard = () => {
    const isAssigned = isUserAssignedToCommittee();
    const isFullyApproved = approvals.comm.isFullyApproved;
    const isMeApproved = approvals.comm.approvedMembers.some((m) => isCommentByCurrentUser(m, currentUser?.name));
    const commComments = (verse.comments || []).filter((c) => c.authorRole.toLowerCase().includes('comm'));
    const unreadCount = getUnreadCommentsCount('comm', commComments);

    return (
      <section
        className="discussion-card"
        style={{
          borderLeft: '4px solid #9333ea',
          marginBottom: '1.25rem'
        }}
      >
        <div className="discussion-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* 2-Line Header: Line 1 Title, Line 2 Status & Committee Members */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {/* Line 1: Icon and Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div className="section-icon discussion-icon" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#9333ea', width: '1.75rem', height: '1.75rem' }}>
                <Users size={16} />
              </div>
              <b style={{ fontSize: '0.875rem', color: 'var(--theme-text)' }}>Committee Discussions</b>
            </div>

            {/* Line 2: Status pill + Committee Named Member Chips directly below on the left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              {isFullyApproved ? (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle2 size={12} /> Confirmed
                </span>
              ) : (
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#f3e8ff',
                  color: '#7e22ce',
                  border: '1px solid #e9d5ff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  In Progress
                </span>
              )}

              {/* Committee Named Member Chips */}
              {approvals.comm.approvedMembers.map((m) => (
                <span key={m} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#dcfce7', color: '#166534' }}>
                  {m} ✓
                </span>
              ))}
              {approvals.comm.pendingMembers.map((m) => (
                <span key={m} style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.1rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                  {m} ⏳
                </span>
              ))}
            </div>
          </div>

          <div className="discussion-more" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.45rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title={`${unreadCount} unread comments`}
              >
                ● {unreadCount} unread
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                markCommentsAsRead('comm', commComments.length);
                setPopoutData({
                  isOpen: true,
                  title: 'Committee Discussions',
                  disciplineKey: 'comm',
                  roleKey: 'COMM',
                  roleLabel: 'Committee'
                });
              }}
              className="chat-action-btn"
              title="Open full conversation in popup modal"
            >
              <Maximize2 size={13} />
              <span>Pop Out</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isCommitteeChatCollapsed) {
                  markCommentsAsRead('comm', commComments.length);
                }
                setIsCommitteeChatCollapsed(!isCommitteeChatCollapsed);
              }}
              className="chat-action-btn"
              title={isCommitteeChatCollapsed ? 'Expand deliberation window' : 'Collapse deliberation window'}
            >
              {isCommitteeChatCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>{isCommitteeChatCollapsed ? `Expand (${commComments.length})` : 'Collapse'}</span>
            </button>
          </div>
        </div>

        {!isCommitteeChatCollapsed && (
          <div style={{ marginTop: '0.5rem' }}>
            <div className="comment-list" style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '0.75rem' }}>
              {commComments.length > 0 ? (
                commComments.map((cmt) => {
                  const isMe = isCommentByCurrentUser(cmt.authorName, currentUser?.name);
                  return (
                    <div key={cmt.id} className={`chat-bubble-row ${isMe ? 'me' : 'other'}`}>
                      <div className={`chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                        <span
                          className={`avatar small ${cmt.avatarColor || getRoleAvatarColor(isMe ? 'Committee' : cmt.authorRole)}`}
                          style={{ width: '1.65rem', height: '1.65rem', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}
                          title={isMe ? `${currentUser?.name} (You)` : cmt.authorName}
                        >
                          {getSmartInitials(isMe ? (currentUser?.name || cmt.authorName) : cmt.authorName)}
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', fontSize: '0.6875rem' }}>
                            {isMe ? (
                              <>
                                <span style={{ fontWeight: 700, color: '#4338ca' }}>You</span>
                                <span style={{ padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                                  Committee
                                </span>
                              </>
                            ) : (
                              <>
                                <b style={{ color: 'var(--theme-text)' }}>{cmt.authorName}</b>
                                <span style={{ padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: 'var(--theme-box-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)', fontWeight: 600 }}>
                                  Committee
                                </span>
                              </>
                            )}
                            {cmt.isApproval && (
                              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.05rem 0.35rem', borderRadius: '0.25rem', backgroundColor: '#dcfce7', color: '#166534' }}>
                                ✓ Approved
                              </span>
                            )}
                            <time style={{ color: '#94a3b8' }}>{cmt.timeAgo}</time>
                          </div>

                          <div className={`chat-bubble-box ${isMe ? 'me' : 'other'}`}>
                            {cmt.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0', textAlign: 'center' }}>
                  No committee deliberation notes recorded yet for this verse.
                </div>
              )}
            </div>

            {/* If user is in Committee */}
            {isAssigned && !isFinalized && !verse.isReferenceOnly ? (
              <div className="comment-composer">
                <textarea
                  id="committee-comment-composer"
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a deliberation note or discussion comment as You (Committee)..."
                  style={{ fontSize: '0.8125rem' }}
                />
                <div className="composer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                    Posting as <b style={{ color: 'var(--theme-text)' }}>You</b> (Committee)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="send-comment"
                      disabled={!commentText.trim() || isSubmitting}
                      onClick={handleSendComment}
                      aria-label="Send committee note"
                      title="Post deliberation note"
                    >
                      <Send size={13} />
                    </button>
                    {!isMeApproved && (
                      <button
                        type="button"
                        onClick={handleApproveCommittee}
                        disabled={isSubmitting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          backgroundColor: '#7e22ce',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Confirm committee approval for this verse"
                      >
                        <CheckCircle2 size={13} /> Confirm Consensus (Y)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !isAssigned && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--theme-text-muted)',
                  backgroundColor: 'var(--theme-box-bg)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px dashed var(--theme-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem'
                }}>
                  <Lock size={13} color="var(--theme-text-muted)" />
                  <span>
                    Read-only deliberation · Only assigned <b>Committee</b> members ({[...approvals.comm.approvedMembers, ...approvals.comm.pendingMembers].join(', ') || 'assigned in Config'}) can post deliberation notes or confirm consensus.
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>
    );
  };

  // Pending disciplines summary for inline guidance
  const pendingDisciplineSummary = useMemo(() => {
    const list: string[] = [];
    if (!approvals.tech.isFullyApproved) {
      const p = approvals.tech.pendingMembers.join(', ');
      list.push(`Technical (${p || 'Pending'})`);
    }
    if (!approvals.style.isFullyApproved) {
      const p = approvals.style.pendingMembers.join(', ');
      list.push(`Style (${p || 'Pending'})`);
    }
    if (!approvals.ortho.isFullyApproved) {
      const p = approvals.ortho.pendingMembers.join(', ');
      list.push(`Orthographic (${p || 'Pending'})`);
    }
    if (!approvals.theo.isFullyApproved) {
      const p = approvals.theo.pendingMembers.join(', ');
      list.push(`Theological (${p || 'Pending'})`);
    }
    return list.length > 0 ? list.join(' · ') : 'All 4 disciplines confirmed!';
  }, [approvals]);

  // Actions for Committee - Opens Impact Confirmation Modal
  const handleApproveCommittee = () => {
    if (isSubmitting || isFinalized) return;
    setImpactConfig({
      actionType: 'committee',
      stageTitle: 'Committee Consensus Verdict',
      onConfirm: async () => {
        if (onApproveConsensus) {
          setIsSubmitting(true);
          await onApproveConsensus(verse.row, commentText.trim());
          setCommentText('');
          setIsSubmitting(false);
          if (nextPendingVerse) {
            onSelectVerseIndex(nextPendingVerse.index);
          }
        }
      }
    });
    setShowImpactModal(true);
  };

  // Actions for Final Editor - Opens Impact Confirmation Modal
  const handleFinalSignOff = () => {
    if (isSubmitting || isFinalized) return;
    if (!finalText.trim()) {
      showToast('warning', 'Please enter or adopt the final canonical Kannada Scripture text before sign-off.');
      return;
    }
    setImpactConfig({
      actionType: 'final',
      stageTitle: 'Final Publication & Canonical Lock',
      onConfirm: async () => {
        if (onSubmitFinal) {
          setIsSubmitting(true);
          await onSubmitFinal(verse.row, finalText.trim());
          setIsSubmitting(false);
          if (nextPendingVerse) {
            onSelectVerseIndex(nextPendingVerse.index);
          }
        }
      }
    });
    setShowImpactModal(true);
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalInChapter) * 100);

  const statusBadgeColor = useMemo(() => {
    switch (verse.status) {
      case 'Done': return 'green';
      case 'Awaiting Review': return 'blue';
      case 'Under Review': return 'amber';
      case 'Awaiting Committee': return 'blue';
      case 'Needs Final': return 'amber';
      default: return 'red';
    }
  }, [verse.status]);

  // Filtered comments for discipline views
  const disciplineComments = useMemo(() => {
    if (!verse.comments) return [];
    if (isCommittee) {
      return verse.comments.filter((c) => c.authorRole.toLowerCase().includes('comm'));
    }
    return verse.comments;
  }, [verse.comments, isCommittee]);

  return (
    <div className="focus-card">
      {/* Top Review Toolbar */}
      <div className="review-toolbar">
        <div className="verse-title">
          <div
            className="verse-icon"
            onClick={onOpenPicker}
            style={{ cursor: onOpenPicker ? 'pointer' : 'default' }}
            title="Click to switch book or chapter"
          >
            <BookOpen size={20} />
          </div>
          <div>
            <h2
              onClick={onOpenPicker}
              style={{
                cursor: onOpenPicker ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Click to select book and chapter"
            >
              <span>{verse.verse}</span>
              {onOpenPicker && <ChevronDown size={18} style={{ opacity: 0.6 }} />}
            </h2>
            <div className="verse-meta">
              <span className={`status-badge ${statusBadgeColor}`}>
                <i></i> {verse.status}
              </span>
              <span className="meta-divider"></span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  className="btn-verse-jump"
                  onClick={() => setShowJumpGrid(!showJumpGrid)}
                  title="Jump to verse in chapter (J)"
                >
                  <LayoutGrid size={13} />
                  <span>Jump to verse</span>
                  <ChevronDown size={12} />
                </button>

                {showJumpGrid && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '125%',
                      left: 0,
                      background: 'var(--theme-card-bg, #ffffff)',
                      border: '1px solid var(--theme-border, #e2e8f0)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                      padding: '0.75rem',
                      zIndex: 50,
                      width: '18rem',
                      maxHeight: '20rem',
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <b style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>CHAPTER {verse.chapter} VERSES</b>
                      <button
                        type="button"
                        onClick={() => setShowJumpGrid(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.375rem' }}>
                      {allChapterVerses.map((v, idx) => {
                        const isCurrent = idx === currentIndex;
                        const isDone = v.status === 'Done';
                        const isUnderReview = v.status === 'Under Review';
                        return (
                          <button
                            key={v.row}
                            type="button"
                            onClick={() => {
                              onSelectVerseIndex(idx);
                              setShowJumpGrid(false);
                            }}
                            style={{
                              padding: '0.375rem 0.25rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: isCurrent ? 800 : 600,
                              border: isCurrent ? '2px solid #2563eb' : '1px solid var(--theme-border)',
                              backgroundColor: isCurrent
                                ? 'rgba(37, 99, 235, 0.18)'
                                : isDone
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isUnderReview
                                ? 'rgba(2, 132, 199, 0.12)'
                                : 'var(--theme-box-bg)',
                              color: isCurrent
                                ? '#3b82f6'
                                : isDone
                                ? '#10b981'
                                : isUnderReview
                                ? '#0284c7'
                                : 'var(--theme-text)',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                            title={`${v.verse} (${v.status})`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Running Target Date Countdown & Velocity Capsule (Proposal 1) */}
        <div className="toolbar-center-countdown" ref={targetPopoverRef}>
          <button
            type="button"
            className={`countdown-capsule-btn ${
              !countdownStats.hasTargetDate
                ? 'state-unset'
                : countdownStats.isComplete
                ? 'state-complete'
                : countdownStats.isPast
                ? 'state-overdue'
                : countdownStats.isLagging
                ? 'state-lagging'
                : 'state-ontrack'
            }`}
            onClick={() => setShowTargetPopover((v) => !v)}
            title="Click to view target completion details and pacing"
            aria-expanded={showTargetPopover}
          >
            {!countdownStats.hasTargetDate ? (
              <>
                <Calendar size={13} style={{ color: 'var(--theme-text-muted)' }} />
                <span className="capsule-full-label" style={{ color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                  No Target Date Set
                </span>
                <span className="capsule-short-label" style={{ color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                  No Target
                </span>
              </>
            ) : countdownStats.isComplete ? (
              <>
                <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                <span className="capsule-full-label">
                  <strong>Complete</strong> · 100% Done
                </span>
                <span className="capsule-short-label">100% Done</span>
              </>
            ) : countdownStats.isPast ? (
              <>
                <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                <span className="capsule-full-label">
                  <strong>Overdue by {countdownStats.daysOverdue}d</strong> · Target Passed
                </span>
                <span className="capsule-short-label">
                  <strong>-{countdownStats.daysOverdue}d</strong> Overdue
                </span>
              </>
            ) : countdownStats.isLagging ? (
              <>
                <Clock size={13} style={{ color: '#f59e0b' }} />
                <span className="capsule-full-label">
                  <strong>{countdownStats.daysRemaining}d left</strong> · {countdownStats.requiredDailyPace} v/d · <em className="status-dot amber">●</em> High Pace
                </span>
                <span className="capsule-short-label">
                  <strong>{countdownStats.daysRemaining}d</strong> · {countdownStats.requiredDailyPace} v/d
                </span>
              </>
            ) : (
              <>
                <Clock size={13} style={{ color: '#10b981' }} />
                <span className="capsule-full-label">
                  <strong>{countdownStats.daysRemaining}d left</strong> · {countdownStats.requiredDailyPace} v/d · <em className="status-dot green">●</em> On Track
                </span>
                <span className="capsule-short-label">
                  <strong>{countdownStats.daysRemaining}d</strong> · On Track
                </span>
              </>
            )}
            <ChevronDown size={11} style={{ opacity: 0.7, marginLeft: '0.15rem' }} />
          </button>

          {/* Interactive Dropdown Popover */}
          {showTargetPopover && (
            <div className="countdown-popover-card">
              <div className="countdown-popover-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--theme-text-muted)' }}>
                    Target Completion Pace
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTargetPopover(false)}
                  className="countdown-popover-close"
                  aria-label="Close popover"
                >
                  ✕
                </button>
              </div>

              <div className="countdown-popover-body">
                {!countdownStats.hasTargetDate ? (
                  <div style={{ padding: '0.25rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <Calendar size={15} color="#3b82f6" />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                        No Target Date Set for {currentBook}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.4 }}>
                      A target completion date has not been configured. Coordinators can lock a date in Settings to activate the real-time countdown, required daily velocity, and pacing tracking.
                    </p>

                    {/* Book Completion Progress */}
                    <div className="countdown-progress-block">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--theme-text-muted)' }}>{currentBook} Progress</span>
                        <span style={{ fontWeight: 700, color: 'var(--theme-text)' }}>
                          {countdownStats.completed} / {countdownStats.total} verses ({countdownStats.percentDone}%)
                        </span>
                      </div>
                      <div className="countdown-progress-track">
                        <div
                          className="countdown-progress-fill ontrack"
                          style={{ width: `${Math.min(100, countdownStats.percentDone)}%` }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--theme-text-muted)', marginTop: '0.25rem' }}>
                        <span>{countdownStats.remainingVerses} verses remaining</span>
                        <span>Target: {countdownStats.total}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Target Date Row */}
                    <div className="countdown-stat-row">
                      <span className="stat-label">Locked Target Date</span>
                      <div className="stat-value-group">
                        <b className="stat-value">{countdownStats.formattedTarget}</b>
                        {countdownStats.isPast ? (
                          <span className="status-pill-badge overdue">
                            Expired ({countdownStats.daysOverdue}d ago)
                          </span>
                        ) : (
                          <span className={`status-pill-badge ${countdownStats.isLagging ? 'lagging' : 'ontrack'}`}>
                            {countdownStats.daysRemaining === 0 ? 'Today' : `${countdownStats.daysRemaining} days remaining`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Book Completion Progress */}
                    <div className="countdown-progress-block">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--theme-text-muted)' }}>{currentBook} Progress</span>
                        <span style={{ fontWeight: 700, color: 'var(--theme-text)' }}>
                          {countdownStats.completed} / {countdownStats.total} verses ({countdownStats.percentDone}%)
                        </span>
                      </div>
                      <div className="countdown-progress-track">
                        <div
                          className={`countdown-progress-fill ${countdownStats.isPast ? 'overdue' : countdownStats.isLagging ? 'lagging' : 'ontrack'}`}
                          style={{ width: `${Math.min(100, countdownStats.percentDone)}%` }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--theme-text-muted)', marginTop: '0.25rem' }}>
                        <span>{countdownStats.remainingVerses} verses remaining</span>
                        <span>Target: {countdownStats.total}</span>
                      </div>
                    </div>

                    {/* Required Velocity Metric */}
                    <div className="countdown-velocity-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--theme-text-muted)' }}>
                          Required Daily Velocity
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: countdownStats.isPast ? '#ef4444' : countdownStats.isLagging ? '#d97706' : '#10b981' }}>
                          {countdownStats.isPast ? 'Overdue' : countdownStats.isLagging ? 'High Velocity' : 'Manageable Pace'}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme-text)', marginTop: '0.25rem' }}>
                        {countdownStats.requiredDailyPace}{' '}
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--theme-text-muted)' }}>
                          verses/day
                        </span>
                      </div>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.4 }}>
                        {countdownStats.isPast
                          ? `The target deadline passed ${countdownStats.daysOverdue} days ago. Reset the target date in Settings.`
                          : countdownStats.isLagging
                          ? `Team requires a throughput of > 15 verses/day to meet the target date. Accelerate review workflow.`
                          : `Pacing is on track! Maintaining ${countdownStats.requiredDailyPace} verses/day will achieve timely completion.`}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <span className="verse-position">
            <b>{currentIndex + 1}</b> of {totalInChapter}
          </span>
          <div className="mini-progress">
            <span style={{ width: `${progressPercent}%` }}></span>
          </div>

          <button
            type="button"
            className="next-verse"
            onClick={onPrevVerse}
            disabled={currentIndex === 0}
            style={{ opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
            aria-label="Previous verse"
            title="Previous verse (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="next-verse"
            onClick={onNextVerse}
            aria-label="Next verse"
            title="Next verse (Right Arrow / Space)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Post-Finalization Lock Banner */}
      {isFinalized && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0.625rem',
          color: 'var(--theme-text)',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Lock size={18} color="#10b981" />
            <span>
              <b>This verse is finalized and published.</b> All 18 columns are locked.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenWhatsApp(verse)}
            style={{
              padding: '0.3rem 0.75rem',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Request Re-Opening via WhatsApp
          </button>
        </div>
      )}

      {/* Reference & Study Mode Banner (for uninitialized books) */}
      {verse.isReferenceOnly && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: '0.625rem',
          color: 'var(--theme-text)',
          fontSize: '0.8125rem',
          boxShadow: '0 1px 2px rgba(37, 99, 235, 0.05)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: '240px' }}>
            <BookOpen size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
            <span>
              <b>Reference &amp; Study Mode:</b> Authentic Canonical KJV text and Strong's Concordance are active for study. Translation sheet setup for <b>{currentBook}</b> can be configured from Settings.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('settings' as ActiveTab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  color: 'var(--theme-text, #2563eb)',
                  border: '1px solid var(--theme-border, #bfdbfe)',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Open Settings to initialize book sheet or configure target dates"
              >
                <Sliders size={13} />
                <span>Configure in Settings</span>
              </button>
            )}
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '0.25rem',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              flexShrink: 0
            }}>
              Reference Only
            </span>
          </div>
        </div>
      )}

      {/* Horizontal Role Tabs Bar */}
      <nav className="focus-role-tabs-bar" aria-label="Reviewer roles">
        <span className="focus-role-tabs-label">
          {userRoles.length > 1 ? 'YOUR ROLES:' : 'ROLE MODE:'}
        </span>
        <div className="focus-role-tabs-list">
          {userRoles.map((roleName) => {
            const isActive = activeRole === roleName;
            const confirmInfo = getRoleConfirmInfo(roleName);
            const isComm = roleName.toLowerCase().includes('comm');
            const isFin = roleName.toLowerCase().includes('final');
            const isDr = roleName.toLowerCase().includes('draft');

            let roleThemeClass = '';
            if (isComm) roleThemeClass = 'committee';
            else if (isFin) roleThemeClass = 'final';
            else if (isDr) roleThemeClass = 'drafter';

            return (
              <button
                key={roleName}
                type="button"
                className={`focus-role-tab ${isActive ? `active ${roleThemeClass}` : ''}`}
                onClick={() => handleRoleTabClick(roleName)}
                title={`Switch review mode to ${roleName}`}
              >
                <span className="role-tab-icon">{getRoleIcon(roleName)}</span>
                <span>{roleName}</span>
                <span className={`role-tab-badge ${confirmInfo.isConfirmed ? 'confirmed' : 'pending'}`}>
                  {confirmInfo.isConfirmed ? '✓ Approved' : 'Pending'}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Comparison Grid: Base Reference & Proposed Translation */}
      <div className="comparison-grid">
        {/* Base Reference (KJV English vs Old Kannada KJV) */}
        <article className="reading-card base-card">
          <div className="reading-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="overline">BASE REFERENCE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setReferenceTab('kjv')}
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    border: referenceTab === 'kjv' ? '1px solid #3b82f6' : '1px solid var(--theme-border)',
                    backgroundColor: referenceTab === 'kjv' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: referenceTab === 'kjv' ? '#3b82f6' : 'var(--theme-text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Source King James Version (English)"
                >
                  📖 KJV
                </button>

                {verse.oldReading && (
                  <button
                    type="button"
                    onClick={() => setReferenceTab('oldKannada')}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem',
                      border: referenceTab === 'oldKannada' ? '1px solid #8b5cf6' : '1px solid var(--theme-border)',
                      backgroundColor: referenceTab === 'oldKannada' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      color: referenceTab === 'oldKannada' ? '#8b5cf6' : 'var(--theme-text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Historical Old Kannada (KJV) reading from Column C"
                  >
                    📜 Old Kannada
                  </button>
                )}
              </div>
            </div>
            <button type="button" className="text-icon-button" onClick={handleCopyReference} style={{ padding: '0.15rem 0.35rem' }}>
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span style={{ fontSize: '0.6875rem' }}>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {referenceTab === 'kjv' ? (
            <p className="english-reading">
              {trimReadingText(kjvText || (verse.oldReading && !/[\u0C80-\u0CFF]/.test(verse.oldReading) ? verse.oldReading : 'Loading KJV English verse…'))}
            </p>
          ) : (
            <p className="kannada-reading" lang="kn" style={{ fontSize: '0.875rem', color: 'var(--theme-text)', lineHeight: 1.5 }}>
              {trimReadingText(verse.oldReading)}
            </p>
          )}
        </article>

        {/* Proposed Translation (Kannada) */}
        <article className="reading-card kannada-card">
          <div className="reading-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="overline">DRAFTER PROPOSED READING (KANNADA)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                className="size-control"
                onClick={() => setFontSize((f) => Math.max(13, f - 2))}
                aria-label="Decrease Kannada text size"
                title="Smaller Kannada text"
                style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem' }}
              >
                A<sup>−</sup>
              </button>
              <button
                type="button"
                className="size-control"
                onClick={() => setFontSize((f) => Math.min(30, f + 2))}
                aria-label="Increase Kannada text size"
                title="Larger Kannada text"
                style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem' }}
              >
                A<sup>+</sup>
              </button>
            </div>
          </div>

          {verse.proposedHtml ? (
            <div
              className="kannada-reading proposed-kannada"
              lang="kn"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
              dangerouslySetInnerHTML={{ __html: trimReadingHtml(verse.proposedHtml) }}
            />
          ) : (
            <p
              className="kannada-reading proposed-kannada"
              lang="kn"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.55,
                color: !verse.proposed && verse.isReferenceOnly ? '#94a3b8' : undefined,
                fontStyle: !verse.proposed && verse.isReferenceOnly ? 'italic' : undefined
              }}
            >
              {trimReadingText(verse.proposed) || (verse.isReferenceOnly
                ? `Translation drafting has not yet started for ${currentBook}. Canonical KJV and Greek references are loaded for preparation.`
                : 'No proposed translation entered yet.')
              }
            </p>
          )}
        </article>
      </div>

      {/* Drafter Comments & Interlinear Back-Translation */}
      {(verse.drafterCmt || parsedContent.wordPairs.length > 0 || parsedContent.notes.length > 0) && (
        <section className="notes-card">
          <button
            type="button"
            className="section-heading"
            onClick={() => setShowNotes(!showNotes)}
          >
            <div className="section-icon notes-icon">
              <FileText size={18} />
            </div>
            <div className="section-heading-copy">
              <b style={{ color: 'var(--theme-text)' }}>Drafter comments &amp; back-translation</b>
              <small style={{ color: 'var(--theme-text-muted)' }}>
                {parsedContent.wordPairs.length > 0
                  ? `${parsedContent.wordPairs.length} aligned word pairs · Kannada top / English gloss below`
                  : 'Investigation notes & lexical choices'}
              </small>
            </div>
            <span className="note-count">
              {parsedContent.wordPairs.length > 0 ? `${parsedContent.wordPairs.length} pairs` : ''}
              {parsedContent.notes.length > 0 ? ` · ${parsedContent.notes.length} notes` : ''}
            </span>
            <ChevronDown size={18} className={`chevron-open ${showNotes ? 'open' : ''}`} />
          </button>

          {showNotes && (
            <div className="notes-body">
              {/* Aligned Word Pairs Table */}
              {parsedContent.wordPairs.length > 0 && (
                <div className="interlinear">
                  <div className="interlinear-heading">
                    <span>KANNADA-ENGLISH WORD PAIR GLOSSES</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Drafter Investigation Table</span>
                  </div>
                  <div className="word-pairs">
                    {parsedContent.wordPairs.map((pair, idx) => (
                      <div key={idx} className="word-pair-item">
                        {pair.kannadaHtml ? (
                          <span
                            lang="kn"
                            className="word-pair-kannada"
                            dangerouslySetInnerHTML={{ __html: pair.kannadaHtml }}
                          />
                        ) : (
                          <span lang="kn" className="word-pair-kannada">{pair.kannada}</span>
                        )}
                        <small className="word-pair-english">{pair.english}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized Investigation Notes */}
              {parsedContent.notes.length > 0 && (
                <div className="investigation-notes">
                  {parsedContent.notes.map((note, idx) => (
                    <div key={idx} className="investigation-note">
                      <span className={`note-type ${note.type}`}>
                        <Sparkles size={12} />
                        <span>{note.title}</span>
                      </span>
                      {note.html ? (
                        <div style={{ flex: 1, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: note.html }} />
                      ) : (
                        <div style={{ flex: 1, lineHeight: 1.6 }}>{note.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback raw view if parser extracted 0 items */}
              {parsedContent.wordPairs.length === 0 && parsedContent.notes.length === 0 && verse.drafterCmt && (
                <div
                  style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--theme-text)', whiteSpace: 'pre-wrap', padding: '0.5rem 0' }}
                  dangerouslySetInnerHTML={{ __html: verse.drafterCmtHtml || verse.drafterCmt }}
                />
              )}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* ROLE WORKSPACE SECTION (Adapts dynamically to the selected role tab)       */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* CASE 1: COMMITTEE MEMBER ROLE TAB                                          */}
      {/* ------------------------------------------------------------------------- */}
      {isCommittee && (
        <section className="committee-workspace">
          {/* Inline Smart Guidance Badge for Committee */}
          <div className="inline-guidance-card committee">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={15} color="#7e22ce" />
              <b style={{ color: '#581c87', fontSize: '0.75rem' }}>COMMITTEE DELIBERATION GUIDANCE</b>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#6b21a8', lineHeight: 1.45 }}>
              <b>Your Action:</b> Deliberate with fellow pastors/committee members on the 4 reviewer findings below. Post discussion notes or questions in the composer, and click <b>Confirm Committee Conclusion (Y)</b> to approve.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#7e22ce', flexWrap: 'wrap' }}>
              <span>
                <b>Status:</b>{' '}
                {approvals.comm.totalRequired > 1
                  ? `${approvals.comm.approvedCount} of ${approvals.comm.totalRequired} committee members confirmed.`
                  : approvals.comm.isFullyApproved
                    ? 'Committee consensus confirmed.'
                    : 'Awaiting committee confirmation.'}
              </span>
            </div>
          </div>

          {/* Engaging Live Team Deliberation Hub Header (Option A) */}
          {renderDeliberationHubHeader()}

          {/* Committee Discussions */}
          {renderCommitteeCard()}

          {/* 4-Discipline Reviewer Findings */}
          {renderAllDisciplineCards()}

          {/* Reference Mode Notice for Committee */}
          {!isFinalized && verse.isReferenceOnly && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--theme-box-bg)',
                borderRadius: '0.625rem',
                border: '1px dashed var(--theme-border)',
                color: 'var(--theme-text-muted)',
                fontSize: '0.8125rem'
              }}
            >
              <BookOpen size={16} color="var(--theme-text-muted)" />
              <span>Viewing in Reference &amp; Study Mode. Committee deliberation will activate once a worksheet for {currentBook} is created in Google Sheets.</span>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* CASE 2: FINAL EDITOR ROLE TAB                                              */}
      {/* ------------------------------------------------------------------------- */}
      {isFinalEditor && (
        <section className="final-editor-workspace">
          {/* Inline Smart Guidance Badge for Final Editor */}
          <div className="inline-guidance-card final">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={15} color="#be123c" />
              <b style={{ color: '#881337', fontSize: '0.75rem' }}>FINAL EDITORIAL PRE-FLIGHT GUIDANCE</b>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#9f1239', lineHeight: 1.45 }}>
              <b>Your Action:</b> Adopt the Drafter reading or craft the canonical Kannada Scripture text below. Verify quality guidelines, then click <b>Final Sign-Off &amp; Lock</b>.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#be123c' }}>
              <span><b>Next Stage:</b> Marks the verse as Done and protects all 18 columns in Google Sheets.</span>
            </div>
          </div>

          {/* Three Context Cards Before Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
            {/* Context Card 1: Drafter Proposed Reading */}
            <div className="reading-card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div className="reading-card-head">
                <div>
                  <span className="overline" style={{ color: '#2563eb' }}>CONTEXT 1: DRAFTER PROPOSED KANNADA READING</span>
                  <h4 style={{ margin: '0.2rem 0', fontSize: '0.875rem', color: 'var(--theme-text)' }}>
                    Baseline proposed Kannada translation drafted by drafter team
                  </h4>
                </div>
                {!verse.isReferenceOnly && (
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => setFinalText(verse.proposed)}
                    title="Adopt drafter proposed text into Final Editor below"
                  >
                    <Copy size={13} /> Adopt Drafter Reading
                  </button>
                )}
              </div>
              <p className="kannada-reading" lang="kn" style={{ fontSize: '1.125rem', color: 'var(--theme-text)', lineHeight: 1.7 }}>
                {verse.proposed || (verse.isReferenceOnly
                  ? `Translation drafting has not yet started for ${currentBook}.`
                  : 'No proposed reading recorded.')}
              </p>
            </div>

            {/* Engaging Live Team Deliberation Hub Header (Option A) */}
            {renderDeliberationHubHeader()}

            {/* Context Card 2: Committee Discussions */}
            {renderCommitteeCard()}

            {/* Context Card 3: 4-Discipline Reviewer Findings */}
            {renderAllDisciplineCards()}
          </div>

          {/* Pre-Flight Checklist Guidelines */}
          <div
            className="editorial-guidelines-card"
            style={{
              background: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#059669" />
                <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>EDITORIAL PRE-FLIGHT GUIDELINES</b>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)', fontStyle: 'italic' }}>
                Active quality reminders · Non-blocking guidelines
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.fidelity}
                  onChange={(e) => setChecklist({ ...checklist, fidelity: e.target.checked })}
                />
                <span>KJV 1611 Fidelity Verified</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.register}
                  onChange={(e) => setChecklist({ ...checklist, register: e.target.checked })}
                />
                <span>Kannada Register &amp; Syntax Checked</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.theology}
                  onChange={(e) => setChecklist({ ...checklist, theology: e.target.checked })}
                />
                <span>Theological Terminology Aligned</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checklist.ortho}
                  onChange={(e) => setChecklist({ ...checklist, ortho: e.target.checked })}
                />
                <span>Standard Orthography &amp; Punctuation</span>
              </label>
            </div>
          </div>

          {/* Final Reading Editor - Starts EMPTY unless finalized */}
          <div className="final-editor-card" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span className="overline" style={{ color: '#be123c' }}>STAGE 4: FINAL CANONICAL READING</span>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1rem', color: 'var(--theme-text)' }}>Official Published Scripture Text</h3>
              </div>
              <span className={`comm-confirmed-tag ${verse.confirms.final ? '' : 'pending'}`}>
                {verse.confirms.final ? '✓ Final Confirmed' : 'Pending Final Sign-Off'}
              </span>
            </div>

            {!verse.isReferenceOnly && (
              <textarea
                className="conclusion-textarea"
                placeholder="Enter final canonical Kannada reading or click 'Adopt Drafter Reading' above..."
                value={finalText}
                onChange={(e) => setFinalText(e.target.value)}
                disabled={isFinalized}
                rows={4}
                style={{ fontFamily: "'Noto Sans Kannada', sans-serif", fontSize: '1.125rem', lineHeight: '1.75' }}
              />
            )}

            {!isFinalized && (
              verse.isReferenceOnly ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--theme-box-bg)',
                  borderRadius: '0.5rem',
                  border: '1px dashed var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                  fontSize: '0.8125rem'
                }}>
                  <BookOpen size={15} color="var(--theme-text-muted)" />
                  <span>Reference Mode: Canonical sign-off will activate once a worksheet for {currentBook} is created in Google Sheets.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                    Approving will lock all 18 columns for row {verse.row} in Google Sheets.
                  </span>
                  <button
                    type="button"
                    className="btn-approve-consensus"
                    style={{ backgroundColor: '#be123c' }}
                    disabled={isSubmitting || !finalText.trim()}
                    onClick={handleFinalSignOff}
                  >
                    <Lock size={16} /> Final Sign-Off &amp; Lock
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* CASE 3: DRAFTER ROLE TAB                                                   */}
      {/* ------------------------------------------------------------------------- */}
      {isDrafter && (
        <section className="drafter-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Engaging Live Team Deliberation Hub Header (Option A) */}
          {renderDeliberationHubHeader()}

          {/* Committee Discussions */}
          {renderCommitteeCard()}

          {/* 4-Discipline Review Findings */}
          {renderAllDisciplineCards()}
        </section>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* CASE 4: DISCIPLINE REVIEWER ROLE TAB (Tech, Style, Ortho, Theo)            */}
      {/* ------------------------------------------------------------------------- */}
      {isDisciplineReviewer && (
        <>
          {/* Inline Smart Guidance Badge for Discipline */}
          <div className="inline-guidance-card discipline">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={15} color="#4f46e5" />
              <b style={{ color: '#312e81', fontSize: '0.75rem' }}>TRANSLATION GUIDANCE ({activeRole.toUpperCase()})</b>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#3730a3', lineHeight: 1.45 }}>
              <b>Your Action:</b> Review the proposed Kannada reading against the Greek and KJV text. Post linguistic observations in your discipline card below, or click <b>Confirm Review (Y)</b> if accurate.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.6875rem', color: '#4338ca', flexWrap: 'wrap' }}>
              <span><b>Next Stage:</b> Advances to Committee consensus once all 4 disciplines confirm.</span>
              <span>•</span>
              <span><b>Waiting On:</b> {pendingDisciplineSummary}</span>
            </div>
          </div>

          {/* Engaging Live Team Deliberation Hub Header (Option A) */}
          {renderDeliberationHubHeader()}

          {/* 4 Distinct Discipline Cards with Strict Intra-Team Commenting (Option 1) */}
          {renderAllDisciplineCards()}

          {/* Committee Deliberation Card (Collapsible, Max-Height 280px) */}
          {renderCommitteeCard()}

          {/* Reference Mode Notice for Discipline Reviewer */}
          {!isFinalized && verse.isReferenceOnly && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: 'var(--theme-box-bg)',
                borderRadius: '0.625rem',
                border: '1px dashed var(--theme-border)',
                color: 'var(--theme-text-muted)',
                fontSize: '0.8125rem'
              }}
            >
              <BookOpen size={16} color="var(--theme-text-muted)" />
              <span>Viewing in Reference &amp; Study Mode. Review actions will activate once a worksheet for {currentBook} is created in Google Sheets.</span>
            </div>
          )}
        </>
      )}

      {/* WhatsApp Link Banner */}
      {!verse.isReferenceOnly && (
        <button type="button" className="whatsapp-link" onClick={() => onOpenWhatsApp(verse)}>
          <span className="whatsapp-mark" style={{ backgroundColor: '#25D366', color: '#ffffff' }}>↗</span>
          <span>
            <b>Send WhatsApp Alert</b>
          </span>
          <ArrowUpRight size={18} />
        </button>
      )}

      {/* Pop-Out Modal for Full Discussion Reading */}
      <DiscussionPopoutModal
        isOpen={popoutData.isOpen}
        onClose={() => setPopoutData((p) => ({ ...p, isOpen: false }))}
        title={popoutData.title}
        verseRef={verse.verse}
        comments={
          popoutData.disciplineKey === 'comm'
            ? (verse.comments || []).filter((c) => c.authorRole.toLowerCase().includes('comm'))
            : popoutData.disciplineKey
              ? (verse.comments || []).filter((c) => c.authorRole.toLowerCase().includes(popoutData.disciplineKey!))
              : disciplineComments
        }
        currentUser={currentUser}
        activeRole={popoutData.roleLabel}
        commentText={
          popoutData.disciplineKey === 'comm'
            ? commentText
            : popoutData.disciplineKey
              ? (disciplineCommentDrafts[popoutData.disciplineKey] || '')
              : commentText
        }
        onCommentChange={(text) => {
          if (popoutData.disciplineKey === 'comm') {
            setCommentText(text);
          } else if (popoutData.disciplineKey) {
            setDisciplineCommentDrafts((prev) => ({ ...prev, [popoutData.disciplineKey!]: text }));
          }
        }}
        onSendComment={async () => {
          if (popoutData.disciplineKey === 'comm') {
            await handleSendComment();
          } else if (popoutData.disciplineKey) {
            await handleSendDisciplineComment(popoutData.disciplineKey, popoutData.roleKey);
          }
        }}
        isSubmitting={isSubmitting}
        isFinalized={isFinalized}
        isAssigned={
          popoutData.disciplineKey === 'comm'
            ? isUserAssignedToCommittee()
            : popoutData.disciplineKey
              ? isUserAssignedToDiscipline(popoutData.disciplineKey)
              : true
        }
      />

      {/* Y / N Impact Confirmation Modal */}
      {impactConfig && (
        <ApprovalImpactModal
          isOpen={showImpactModal}
          verseRef={verse.verse}
          actionType={impactConfig.actionType}
          stageTitle={impactConfig.stageTitle}
          roleName={activeRole}
          userName={currentUser.name}
          commentText={commentText}
          nextVerseRef={nextPendingVerse ? nextPendingVerse.verse.verse : null}
          onConfirmY={async () => {
            await impactConfig.onConfirm();
            setShowImpactModal(false);
          }}
          onDeclineN={() => {
            setShowImpactModal(false);
          }}
          onClose={() => setShowImpactModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Footer */}
      <footer className="page-footer">
        <span>GLBC Translation Hub · {currentBook} / Kannada</span>
        <span>
          All changes sync to your team <span className="tiny-dot green-dot"></span>
        </span>
      </footer>
    </div>
  );
};
