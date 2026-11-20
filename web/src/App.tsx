import React, { useState, useEffect, useRef } from 'react';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import type { ActiveTab } from './components/Sidebar';
import { FocusModeCard } from './components/FocusModeCard';
import { AnalyticsView } from './components/AnalyticsView';
import { CommitteeChamber } from './components/CommitteeChamber';
import { FinalEditorView } from './components/FinalEditorView';
import { WhatsAppModal } from './components/WhatsAppModal';
import { HelpModal } from './components/HelpModal';
import { ConnectionModal } from './components/ConnectionModal';
import { SmartAssistantDrawer } from './components/SmartAssistantDrawer';
import { BookChapterModal } from './components/BookChapterModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { FloatingBookProgress } from './components/FloatingBookProgress';
import { ToastContainer } from './components/ToastContainer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SettingsView, type SettingsSubTab } from './components/SettingsView';
import { useMediaQuery } from './hooks/useMediaQuery';
import { MobileFocusView } from './components/mobile/MobileFocusView';
import { MobileAnalyticsView } from './components/mobile/MobileAnalyticsView';
import { MobileSettingsView } from './components/mobile/MobileSettingsView';
import { TabletFocusView } from './components/tablet/TabletFocusView';
import { TabletAnalyticsView } from './components/tablet/TabletAnalyticsView';
import { TabletSettingsView } from './components/tablet/TabletSettingsView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { AdminPinModal } from './components/AdminPinModal';
import { SecurityConsole } from './components/SecurityConsole';
import type { VerseItem, TeamMember, ReviewerRole, BookAnalytics, ParsedImportVerse, VerseApprovals, VerseConfirms, BgTheme } from './types';
import {
  fetchVerses,
  fetchInitialBundle,
  getCachedInitialBundle,
  fetchBooks,
  fetchConfig,
  submitReview,
  submitFinal,
  importVersesApi,
  initBookSheetApi,
  saveMemberApi,
  syncProtectionsApi,
  updateVerseInCache,
  isLiveApiConfigured,
  fetchAnalytics
} from './services/api';
import { roleToReviewKey } from './utils/commentSync';
import { computeVerseApprovals, formatApprovalSignature } from './utils/approvalEngine';
import { getBookTotalVerses } from './services/kjvService';
import { Eye, BarChart3, Sliders } from 'lucide-react';

interface AppContentProps {
  onTeamSync?: (team: TeamMember[]) => void;
}

const AppContent: React.FC<AppContentProps> = ({ onTeamSync }) => {
  const {
    authUser,
    currentUser: authCurrentUser,
    isSuperAdmin,
    showPinModal,
    verifyAdminPin,
    dismissPinModal,
    signInWithGoogle,
    signOut,
    isLoading: authLoading,
    error: authError,
    unregisteredEmail,
    clearError,
    bypassForDemo,
    availableRoles,
    setActiveRole,
    hasAdminAccess,
    canView
  } = useAuth();

  // Read deep link params from URL if present
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialBook = initialParams?.get('book') || 'Romans';
  const initialChapRaw = initialParams?.get('chapter');
  const initialChapter = (initialChapRaw && !isNaN(parseInt(initialChapRaw, 10))) ? parseInt(initialChapRaw, 10) : 1;
  const initialVerseTarget = initialParams?.get('verse') || null;

  const initialBundle = getCachedInitialBundle(initialBook, initialChapter);

  const [books, setBooks] = useState<string[]>(initialBundle?.books || ['Romans', 'Galatians', 'Ephesians']);
  const [currentBook, setCurrentBook] = useState<string>(initialBook);
  const [currentChapter, setCurrentChapter] = useState<number>(initialChapter);
  const [team, setTeam] = useState<TeamMember[]>(initialBundle?.team || []);
  // ===========================================================================
  // LAYMAN EXPLANATION FOR CURRENT USER BINDING:
  // The current active user is strictly tied to the verified Google session
  // (authCurrentUser). If no user is logged in, currentUser is null, which
  // immediately activates the <LoginPage> gate.
  // ===========================================================================
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => authCurrentUser);

  useEffect(() => {
    setCurrentUser(authCurrentUser);
  }, [authCurrentUser]);
  const [verses, setVerses] = useState<VerseItem[]>(initialBundle?.verses || []);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('focus');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('team');
  const [analytics, setAnalytics] = useState<BookAnalytics | null>(initialBundle?.analytics || null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('glbc_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('glbc_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
        if (!isInput) {
          e.preventDefault();
          handleToggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [whatsAppVerse, setWhatsAppVerse] = useState<VerseItem | null>(null);
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [showFloatingProgress, setShowFloatingProgress] = useState<boolean>(true);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!initialBundle);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(isLiveApiConfigured());
  const [pendingTargetVerse, setPendingTargetVerse] = useState<string | null>(initialVerseTarget);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');

  // Background Theme Screen Changer State (Default: Obsidian Tela Dark, Sepia: Obsidian Wasp, Mist: Blue Topaz, Obsidian: Obsidian Nebula)
  const [bgTheme, setBgTheme] = useState<BgTheme>(() => {
    if (typeof window !== 'undefined') {
      // Auto-activate Obsidian Tela Dark as the active default on update
      const version = localStorage.getItem('glbc_theme_release');
      if (version !== 'tela-dark-v2') {
        localStorage.setItem('glbc_theme_release', 'tela-dark-v2');
        localStorage.setItem('glbc_bg_theme', 'default');
        return 'default';
      }
      return (localStorage.getItem('glbc_bg_theme') as BgTheme) || 'default';
    }
    return 'default';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-bg-theme', bgTheme);
      localStorage.setItem('glbc_bg_theme', bgTheme);
    }
  }, [bgTheme]);

  const isInitialMount = useRef(true);

  const reloadData = async () => {
    if (!initialBundle) setLoading(true);
    setIsLiveConnected(isLiveApiConfigured());
    const bundle = await fetchInitialBundle(currentBook, currentChapter);

    setBooks(bundle.books);
    setTeam(bundle.team);
    if (onTeamSync) onTeamSync(bundle.team);
    if (bundle.team.length > 0) {
      setCurrentUser((prev) => {
        if (authCurrentUser) return authCurrentUser;
        if (prev) {
          const matched = bundle.team.find((m) => m.name === prev.name || m.email === prev.email);
          if (matched) return matched;
        }
        return bundle.team.find((m) => m.name.includes('Paul')) || bundle.team[0];
      });
    }
    setVerses(bundle.verses);
    setAnalytics(bundle.analytics);
    setLoading(false);

    // Handle deep-linked verse targeting
    if (pendingTargetVerse && bundle.verses.length > 0) {
      const cleanTarget = pendingTargetVerse.toLowerCase().replace(/\s+/g, '');
      const idx = bundle.verses.findIndex(
        (v) => v.verse.toLowerCase().replace(/\s+/g, '') === cleanTarget ||
               v.verse.toLowerCase().includes(cleanTarget)
      );
      if (idx !== -1) {
        setCurrentVerseIndex(idx);
        setPendingTargetVerse(null);
      }
    }
  };

  // RBAC Access Level Dynamic Fallback:
  // If user is currently on a tab they do not have permission to view, automatically route to permitted tab
  useEffect(() => {
    if (activeTab === 'focus' && !canView('focus')) {
      if (canView('analytics')) setActiveTab('analytics');
      else if (canView('settings')) setActiveTab('settings');
      else if (hasAdminAccess) setActiveTab('security');
    } else if (activeTab === 'analytics' && !canView('analytics')) {
      if (canView('focus')) setActiveTab('focus');
      else if (canView('settings')) setActiveTab('settings');
    } else if (activeTab === 'settings' && !canView('settings')) {
      if (canView('focus')) setActiveTab('focus');
      else if (canView('analytics')) setActiveTab('analytics');
    } else if (activeTab === 'security' && !hasAdminAccess) {
      setActiveTab('focus');
    }
  }, [activeTab, canView, hasAdminAccess]);

  // Initial load
  useEffect(() => {
    reloadData();
  }, []);

  // When chapter or book changes (skip initial mount to prevent redundant duplicate fetch)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    async function loadChapterVerses() {
      const data = await fetchVerses(currentBook, currentChapter);
      setVerses(data);
      fetchAnalytics(currentBook).then(setAnalytics).catch(() => {});

      if (pendingTargetVerse && data.length > 0) {
        const cleanTarget = pendingTargetVerse.toLowerCase().replace(/\s+/g, '');
        const idx = data.findIndex(
          (v) => v.verse.toLowerCase().replace(/\s+/g, '') === cleanTarget ||
                 v.verse.toLowerCase().includes(cleanTarget)
        );
        if (idx !== -1) {
          setCurrentVerseIndex(idx);
          setPendingTargetVerse(null);
          return;
        }
      }

      // Smart Resume: automatically land on the first pending verse for the active user
      const isVersePendingForUser = (v: VerseItem, user: TeamMember | null): boolean => {
        if (!user || !user.role) return false;
        const r = user.role.toLowerCase();
        if (r.includes('tech')) return !v.confirms.tech;
        if (r.includes('style')) return !v.confirms.style;
        if (r.includes('ortho')) return !v.confirms.ortho;
        if (r.includes('theo')) return !v.confirms.theo;
        if (r.includes('comm')) return !v.confirms.comm;
        if (r.includes('final')) return !v.confirms.final;
        return false;
      };

      const firstPendingIdx = data.findIndex((v) => isVersePendingForUser(v, currentUser) && v.status !== 'Done');
      setCurrentVerseIndex(firstPendingIdx !== -1 ? firstPendingIdx : 0);
    }
    loadChapterVerses();
  }, [currentBook, currentChapter]);

  // Re-trigger floating progress card on book switch with blast entrance
  useEffect(() => {
    setShowFloatingProgress(true);
  }, [currentBook]);

  // Handle 1-Click Translation Sheet Setup Wizard (Task 4.2)
  const handleInitBookSheet = async (bookToInit: string) => {
    setLoading(true);
    try {
      const res = await initBookSheetApi(bookToInit);
      if (res.success) {
        const updatedBooks = await fetchBooks();
        setBooks(updatedBooks);
        const newVerses = await fetchVerses(bookToInit, currentChapter);
        setVerses(newVerses);
        setCurrentVerseIndex(0);
        alert(res.message || `Book "${bookToInit}" initialized successfully in Google Sheets!`);
      } else {
        alert(`Failed to initialize book: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error initializing book: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Save / Edit Member in Team Directory (Task 4.3)
  const handleSaveMember = async (memberData: {
    name: string;
    role: string;
    phone: string;
    email: string;
    active: boolean;
    roles: string[];
    originalEmail?: string;
    originalName?: string;
  }) => {
    const res = await saveMemberApi(memberData);
    if (res.success) {
      const updatedTeam = await fetchConfig();
      setTeam(updatedTeam);
      if (currentUser && (currentUser.email === memberData.email || currentUser.name === memberData.name)) {
        const match = updatedTeam.find((m) => m.email === memberData.email || m.name === memberData.name);
        if (match) setCurrentUser(match);
      }
    }
    return res;
  };

  // Handle Sync Column Protections
  const handleSyncProtections = async () => {
    return await syncProtectionsApi();
  };

  const handleNavigateToSettings = (subtab: SettingsSubTab = 'team') => {
    setSettingsSubTab(subtab);
    setActiveTab('settings');
  };

  // Synchronize browser address bar for seamless sharing / deep-linking
  useEffect(() => {
    if (typeof window === 'undefined' || verses.length === 0) return;
    const currentVerse = verses[currentVerseIndex];
    if (currentVerse) {
      const newUrl = `${window.location.pathname}?book=${encodeURIComponent(currentBook)}&chapter=${currentChapter}&verse=${encodeURIComponent(currentVerse.verse)}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentBook, currentChapter, currentVerseIndex, verses]);

  // Handle Approve Verse
  const handleApproveVerse = async (row: number, role: ReviewerRole, comment?: string) => {
    if (!currentUser) return;

    const approvalSig = formatApprovalSignature(comment);
    const revKey = roleToReviewKey(role);

    // Optimistic update
    setVerses((prev) =>
      prev.map((v) => {
        if (v.row === row) {
          const updatedReviews = { ...v.reviews };
          const formattedSig = `${currentUser.name}: ${approvalSig}`;
          const currentCell = updatedReviews[revKey] || '';
          updatedReviews[revKey] = currentCell ? `${currentCell}\n\n${formattedSig}` : formattedSig;

          const updatedComments = v.comments ? [...v.comments] : [];
          updatedComments.push({
            id: `c_${Date.now()}`,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            avatarColor: currentUser.avatarColor,
            timeAgo: 'Just now',
            text: approvalSig,
            isApproval: true
          });

          // Live multi-member approval calculation
          const newApprovals = computeVerseApprovals(updatedReviews, v.confirms, team);
          const newConfirms: VerseConfirms = { ...v.confirms };

          const roleKey = role.toLowerCase() as keyof VerseApprovals;
          if (newApprovals[roleKey]) {
            newConfirms[roleKey as keyof VerseConfirms] = newApprovals[roleKey].isFullyApproved;
          }

          // Stage status recalculation
          let newStatus = v.status;
          if (newConfirms.final) {
            newStatus = 'Done';
          } else if (newConfirms.comm) {
            newStatus = 'Needs Final';
          } else if (newConfirms.tech && newConfirms.style && newConfirms.ortho && newConfirms.theo) {
            newStatus = 'Awaiting Committee';
          } else {
            newStatus = 'Under Review';
          }

          const updatedVerse = {
            ...v,
            confirms: newConfirms,
            status: newStatus,
            reviews: updatedReviews,
            comments: updatedComments,
            approvals: newApprovals
          };
          updateVerseInCache(currentBook, currentChapter, updatedVerse);
          return updatedVerse;
        }
        return v;
      })
    );

    // Call API write-back
    await submitReview({
      book: currentBook,
      row,
      role,
      comment,
      confirm: 'Y',
      userName: currentUser.name,
      userEmail: currentUser.email
    });

    // Auto-advance to next verse in Focus Mode
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex((idx) => idx + 1);
    }
  };

  // Handle Add Discussion Note / Review Observation (Clean Natural Deliberation)
  const handlePostComment = async (row: number, role: ReviewerRole, comment: string) => {
    if (!currentUser) return;

    const trimmed = comment.trim();
    if (!trimmed) return;
    const revKey = roleToReviewKey(role);

    setVerses((prev) =>
      prev.map((v) => {
        if (v.row === row) {
          const updatedReviews = { ...v.reviews };
          const formattedSig = `${currentUser.name}: ${trimmed}`;
          const currentCell = updatedReviews[revKey] || '';
          updatedReviews[revKey] = currentCell ? `${currentCell}\n\n${formattedSig}` : formattedSig;

          const updatedComments = v.comments ? [...v.comments] : [];
          updatedComments.push({
            id: `c_${Date.now()}`,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            avatarColor: currentUser.avatarColor,
            timeAgo: 'Just now',
            text: trimmed
          });

          const updatedVerse = {
            ...v,
            reviews: updatedReviews,
            comments: updatedComments
          };
          updateVerseInCache(currentBook, currentChapter, updatedVerse);
          return updatedVerse;
        }
        return v;
      })
    );

    await submitReview({
      book: currentBook,
      row,
      role,
      comment: trimmed,
      confirm: 'N',
      userName: currentUser.name,
      userEmail: currentUser.email
    });
  };

  // Handle Committee Consensus Approval (Col O & P)
  const handleApproveConsensus = async (row: number, conclusionNotes: string) => {
    if (!currentUser) return;

    const approvalSig = formatApprovalSignature(conclusionNotes);

    setVerses((prev) =>
      prev.map((v) => {
        if (v.row === row) {
          const updatedReviews = { ...v.reviews };
          const formattedSig = `${currentUser.name}: ${approvalSig}`;
          const currentCell = updatedReviews.conclusion || '';
          updatedReviews.conclusion = currentCell ? `${currentCell}\n\n${formattedSig}` : formattedSig;

          const updatedComments = v.comments ? [...v.comments] : [];
          updatedComments.push({
            id: `c_${Date.now()}`,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            avatarColor: currentUser.avatarColor,
            timeAgo: 'Just now',
            text: approvalSig,
            isApproval: true
          });

          const newApprovals = computeVerseApprovals(updatedReviews, v.confirms, team);
          const newConfirms: VerseConfirms = { ...v.confirms };
          const isCommFullyApproved = newApprovals.comm?.isFullyApproved ?? true;
          newConfirms.comm = isCommFullyApproved;

          return {
            ...v,
            status: isCommFullyApproved ? 'Needs Final' : 'Awaiting Committee',
            confirms: newConfirms,
            reviews: updatedReviews,
            comments: updatedComments,
            approvals: newApprovals
          };
        }
        return v;
      })
    );

    await submitReview({
      book: currentBook,
      row,
      role: 'COMM',
      comment: conclusionNotes,
      confirm: 'Y',
      userName: currentUser.name,
      userEmail: currentUser.email
    });
  };

  // Handle Committee Request Re-Review / Deliberation Notes
  const handleRequestReReview = async (row: number, notes: string) => {
    if (!currentUser) return;

    const trimmed = notes.trim();
    if (!trimmed) return;

    setVerses((prev) =>
      prev.map((v) => {
        if (v.row === row) {
          const updatedReviews = { ...v.reviews };
          const formattedSig = `${currentUser.name}: ${trimmed}`;
          const currentCell = updatedReviews.conclusion || '';
          updatedReviews.conclusion = currentCell ? `${currentCell}\n\n${formattedSig}` : formattedSig;

          const updatedComments = v.comments ? [...v.comments] : [];
          updatedComments.push({
            id: `c_${Date.now()}`,
            authorName: currentUser.name,
            authorRole: currentUser.role,
            avatarColor: currentUser.avatarColor,
            timeAgo: 'Just now',
            text: trimmed
          });

          const newConfirms: VerseConfirms = { ...v.confirms, comm: false };
          const newApprovals = computeVerseApprovals(updatedReviews, newConfirms, team);

          return {
            ...v,
            status: 'Under Review',
            confirms: newConfirms,
            reviews: updatedReviews,
            comments: updatedComments,
            approvals: newApprovals
          };
        }
        return v;
      })
    );

    await submitReview({
      book: currentBook,
      row,
      role: 'COMM',
      comment: notes,
      confirm: 'N',
      userName: currentUser.name,
      userEmail: currentUser.email
    });
  };

  // Handle Final Editor Sign-off (Col Q & R)
  const handleSubmitFinal = async (row: number, finalReading: string, confirm: 'Y' | 'N') => {
    setVerses((prev) =>
      prev.map((v) => {
        if (v.row === row) {
          const newConfirms: VerseConfirms = { ...v.confirms, final: confirm === 'Y' };
          const updatedReviews = { ...v.reviews, final: finalReading };
          const newApprovals = computeVerseApprovals(updatedReviews, newConfirms, team);

          return {
            ...v,
            status: confirm === 'Y' ? 'Done' : 'Needs Final',
            confirms: newConfirms,
            reviews: updatedReviews,
            approvals: newApprovals
          };
        }
        return v;
      })
    );

    await submitFinal({
      book: currentBook,
      row,
      finalReading,
      confirm
    });
  };

  // Handle Drafter Batch Import
  const handleImportSuccess = async (importedVerses: ParsedImportVerse[]) => {
    setVerses((prev) => {
      const updated = [...prev];
      for (const iv of importedVerses) {
        const idx = updated.findIndex(
          (v) => (iv.existingRow && v.row === iv.existingRow) || v.verse === iv.verse
        );
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            oldReading: iv.oldReading || updated[idx].oldReading,
            proposed: iv.proposed,
            proposedHtml: iv.proposedHtml,
            drafterCmt: iv.drafterCmt,
            drafterCmtHtml: iv.drafterCmtHtml,
            wordPairs: iv.wordPairs || updated[idx].wordPairs,
            confirms: { ...updated[idx].confirms, drafter: true },
            status: updated[idx].status === 'Not Started' ? 'Awaiting Review' : updated[idx].status
          };
        } else {
          // If the verse belongs to the active chapter, add it to the state list
          const chapNum = iv.chapter || currentChapter;
          if (chapNum === currentChapter) {
            const maxRow = updated.length > 0 ? Math.max(...updated.map((u) => u.row)) : 1;
            updated.push({
              row: iv.existingRow || maxRow + 1,
              verse: iv.verse,
              chapter: currentChapter,
              verseNumber: iv.verseNumber || updated.length + 1,
              status: 'Awaiting Review',
              oldReading: iv.oldReading || '',
              proposed: iv.proposed,
              proposedHtml: iv.proposedHtml,
              drafterCmt: iv.drafterCmt,
              drafterCmtHtml: iv.drafterCmtHtml,
              wordPairs: iv.wordPairs,
              version: '1.0',
              lastEdited: 'Just now',
              confirms: {
                drafter: true,
                tech: false,
                style: false,
                ortho: false,
                theo: false,
                comm: false,
                final: false
              },
              reviews: {
                tech: '',
                style: '',
                ortho: '',
                theo: '',
                conclusion: '',
                final: ''
              },
              comments: []
            });
          }
        }
      }
      return updated;
    });

    await importVersesApi({
      book: currentBook,
      verses: importedVerses.map((iv) => ({
        row: iv.existingRow,
        verse: iv.verse,
        oldReading: iv.oldReading,
        oldReadingSection: iv.oldReadingSection,
        proposed: iv.proposed,
        proposedSection: iv.proposedSection,
        drafterCmt: iv.drafterCmt,
        drafterCmtSection: iv.drafterCmtSection
      }))
    });

    fetchAnalytics(currentBook).then(setAnalytics).catch(() => {});
  };

  const currentVerse = verses[currentVerseIndex] || verses[0];

  // Count pending verses for active reviewer
  const pendingCount = verses.filter((v) => {
    if (!currentUser) return false;
    const r = currentUser.role.toLowerCase();
    if (r.includes('tech')) return !v.confirms.tech;
    if (r.includes('style')) return !v.confirms.style;
    if (r.includes('ortho')) return !v.confirms.ortho;
    if (r.includes('theo')) return !v.confirms.theo;
    if (r.includes('comm')) return !v.confirms.comm;
    if (r.includes('final')) return !v.confirms.final;
    return false;
  }).length;

  const committeePendingCount = verses.filter(
    (v) => v.status === 'Awaiting Committee' || (!v.confirms.comm && v.confirms.tech && v.confirms.style && v.confirms.ortho && v.confirms.theo)
  ).length;

  const finalPendingCount = verses.filter(
    (v) => v.status === 'Needs Final' || (!v.confirms.final && v.confirms.comm)
  ).length;

  if (!authUser) {
    return (
      <LoginPage
        onSignInWithGoogle={signInWithGoogle}
        isLoading={authLoading}
        error={authError}
        unregisteredEmail={unregisteredEmail}
        onClearError={clearError}
        onBypassForDemo={bypassForDemo}
      />
    );
  }

  if (loading || !currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.25rem', backgroundColor: '#0b1120', color: '#f8fafc' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid #1e293b', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <b style={{ display: 'block', fontSize: '1.125rem', color: '#ffffff', marginBottom: '0.25rem' }}>GLBC Translation Hub</b>
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Connecting to translation database…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <ToastContainer />
      <AdminPinModal
        isOpen={showPinModal}
        userEmail={authUser.email || ''}
        userName={authUser.displayName || undefined}
        onConfirmPin={verifyAdminPin}
        onContinueAsRegular={dismissPinModal}
      />
      {/* Topbar */}
      <Topbar
        currentBook={currentBook}
        books={books}
        onSelectBook={setCurrentBook}
        onOpenBookModal={() => setShowBookModal(true)}
        currentUser={currentUser}
        team={team}
        onSelectUser={setCurrentUser}
        onOpenHelp={() => setShowHelp(true)}
        onOpenAssistant={() => setShowAssistant(true)}
        isLiveConnected={isLiveConnected}
        onOpenConnection={() => setShowConnectionModal(true)}
        onOpenTeamModal={() => handleNavigateToSettings('team')}
        onOpenSettings={handleNavigateToSettings}
        totalVerses={analytics?.total || getBookTotalVerses(currentBook)}
        isSuperAdmin={isSuperAdmin}
        onSignOut={signOut}
        availableRoles={availableRoles}
        onChangeRole={(newRole) => {
          setActiveRole(newRole);
          setCurrentUser((u) => (u ? { ...u, role: newRole } : null));
        }}
      />

      <div className="workspace">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingQueueCount={pendingCount}
          committeePendingCount={committeePendingCount}
          finalPendingCount={finalPendingCount}
          team={team}
          currentUser={currentUser || undefined}
          currentBook={currentBook}
          completedVerses={analytics !== null ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
          totalVerses={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
          onOpenHelp={() => setShowHelp(true)}
          onOpenTeamModal={() => handleNavigateToSettings('team')}
          onToggleFloatingProgress={() => setShowFloatingProgress((v) => !v)}
          bgTheme={bgTheme}
          onSelectBgTheme={setBgTheme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content Area in Full-Width Viewport Aligned to Browser Edge */}
        <div className="main-viewport">
          <main className={`main-content ${activeTab === 'security' ? 'main-content--wide' : ''}`}>
          {/* Mobile responsive tabs */}
          <div className="mobile-tabs">
            <button
              type="button"
              className={activeTab === 'focus' ? 'active' : ''}
              onClick={() => setActiveTab('focus')}
            >
              <Eye size={16} /> Focus
            </button>
            <button
              type="button"
              className={activeTab === 'settings' || activeTab === 'drafter' ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              <Sliders size={16} /> Settings
            </button>
            <button
              type="button"
              className={activeTab === 'analytics' ? 'active' : ''}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} /> Analytics
            </button>
          </div>

          {activeTab === 'focus' && currentVerse && (
            isMobile ? (
              <MobileFocusView
                verse={currentVerse}
                currentIndex={currentVerseIndex}
                totalInChapter={verses.length}
                allChapterVerses={verses}
                currentBook={currentBook}
                currentUser={currentUser}
                team={team}
                bookCompletedCount={analytics !== null && analytics.book === currentBook ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
                bookTotalCount={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
                onNextVerse={() => {
                  if (currentVerseIndex < verses.length - 1) {
                    setCurrentVerseIndex((idx) => idx + 1);
                  }
                }}
                onPrevVerse={() => {
                  if (currentVerseIndex > 0) {
                    setCurrentVerseIndex((idx) => idx - 1);
                  }
                }}
                onSelectVerseIndex={(idx) => setCurrentVerseIndex(idx)}
                onApproveVerse={handleApproveVerse}
                onAddComment={handlePostComment}
                onOpenWhatsApp={(v) => setWhatsAppVerse(v)}
                onNavigateTab={setActiveTab}
                onApproveConsensus={handleApproveConsensus}
                onSubmitFinal={(row, finalReading) => handleSubmitFinal(row, finalReading, 'Y')}
                onSelectUserRole={(newRole) => {
                  setCurrentUser((u) => u ? { ...u, role: newRole } : null);
                }}
              />
            ) : isTablet ? (
              <TabletFocusView
                verse={currentVerse}
                currentIndex={currentVerseIndex}
                totalInChapter={verses.length}
                allChapterVerses={verses}
                currentBook={currentBook}
                currentUser={currentUser}
                team={team}
                bookCompletedCount={analytics !== null && analytics.book === currentBook ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
                bookTotalCount={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
                onNextVerse={() => {
                  if (currentVerseIndex < verses.length - 1) {
                    setCurrentVerseIndex((idx) => idx + 1);
                  }
                }}
                onPrevVerse={() => {
                  if (currentVerseIndex > 0) {
                    setCurrentVerseIndex((idx) => idx - 1);
                  }
                }}
                onSelectVerseIndex={(idx) => setCurrentVerseIndex(idx)}
                onApproveVerse={handleApproveVerse}
                onAddComment={handlePostComment}
                onOpenWhatsApp={(v) => setWhatsAppVerse(v)}
                onNavigateTab={setActiveTab}
                onApproveConsensus={handleApproveConsensus}
                onSubmitFinal={(row, finalReading) => handleSubmitFinal(row, finalReading, 'Y')}
                onSelectUserRole={(newRole) => {
                  setCurrentUser((u) => u ? { ...u, role: newRole } : null);
                }}
              />
            ) : (
              <FocusModeCard
                verse={currentVerse}
                currentIndex={currentVerseIndex}
                totalInChapter={verses.length}
                allChapterVerses={verses}
                currentBook={currentBook}
                currentUser={currentUser}
                team={team}
                bookCompletedCount={analytics !== null && analytics.book === currentBook ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
                bookTotalCount={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
                onNextVerse={() => {
                  if (currentVerseIndex < verses.length - 1) {
                    setCurrentVerseIndex((idx) => idx + 1);
                  }
                }}
                onPrevVerse={() => {
                  if (currentVerseIndex > 0) {
                    setCurrentVerseIndex((idx) => idx - 1);
                  }
                }}
                onSelectVerseIndex={(idx) => setCurrentVerseIndex(idx)}
                onApproveVerse={handleApproveVerse}
                onAddComment={handlePostComment}
                onRequestEdit={handlePostComment}
                onOpenWhatsApp={(v) => setWhatsAppVerse(v)}
                onOpenShortcuts={() => setShowHelp(true)}
                onNavigateTab={setActiveTab}
                onSelectUserRole={(newRole) => {
                  setCurrentUser((u) => u ? { ...u, role: newRole } : null);
                }}
                onApproveConsensus={handleApproveConsensus}
                onRequestReReview={handleRequestReReview}
                onSubmitFinal={(row, finalReading) => handleSubmitFinal(row, finalReading, 'Y')}
                onOpenPicker={() => setShowBookModal(true)}
                onInitBook={handleInitBookSheet}
              />
            )
          )}

          {activeTab === 'committee' && (
            <CommitteeChamber
              verses={verses}
              currentBook={currentBook}
              team={team}
              currentUser={currentUser}
              onApproveConsensus={handleApproveConsensus}
              onRequestReReview={handleRequestReReview}
            />
          )}

          {activeTab === 'final' && (
            <FinalEditorView
              verses={verses}
              currentBook={currentBook}
              team={team}
              currentUser={currentUser}
              onSubmitFinal={(row, finalReading) => handleSubmitFinal(row, finalReading, 'Y')}
            />
          )}

          {(activeTab === 'settings' || activeTab === 'drafter') && (
            isMobile ? (
              <MobileSettingsView
                currentBook={currentBook}
                books={books}
                team={team}
                verses={verses}
                currentChapter={currentChapter}
                initialSubTab={settingsSubTab}
                onSaveMember={handleSaveMember}
                onSyncProtections={handleSyncProtections}
                onInitBook={handleInitBookSheet}
                onRefreshData={reloadData}
                onImportSuccess={handleImportSuccess}
                onNavigateToFocus={() => setActiveTab('focus')}
                isLiveConnected={isLiveConnected}
                onOpenConnectionModal={() => setShowConnectionModal(true)}
              />
            ) : isTablet ? (
              <TabletSettingsView
                currentBook={currentBook}
                books={books}
                team={team}
                verses={verses}
                currentChapter={currentChapter}
                initialSubTab={settingsSubTab}
                onSaveMember={handleSaveMember}
                onSyncProtections={handleSyncProtections}
                onInitBook={handleInitBookSheet}
                onRefreshData={reloadData}
                onImportSuccess={handleImportSuccess}
                onNavigateToFocus={() => setActiveTab('focus')}
                isLiveConnected={isLiveConnected}
                onOpenConnectionModal={() => setShowConnectionModal(true)}
              />
            ) : (
              <SettingsView
                currentBook={currentBook}
                books={books}
                team={team}
                verses={verses}
                currentChapter={currentChapter}
                initialSubTab={settingsSubTab}
                onSaveMember={handleSaveMember}
                onSyncProtections={handleSyncProtections}
                onInitBook={handleInitBookSheet}
                onRefreshData={reloadData}
                onImportSuccess={handleImportSuccess}
                onNavigateToFocus={() => setActiveTab('focus')}
                isLiveConnected={isLiveConnected}
                onOpenConnectionModal={() => setShowConnectionModal(true)}
              />
            )
          )}

          {activeTab === 'analytics' && analytics && (
            isMobile ? (
              <MobileAnalyticsView
                analytics={analytics}
                currentBook={currentBook}
                team={team}
                availableBooks={books}
                onNavigateToSettings={() => {
                  setSettingsSubTab('books');
                  setActiveTab('settings');
                }}
                onRefresh={reloadData}
              />
            ) : isTablet ? (
              <TabletAnalyticsView
                analytics={analytics}
                currentBook={currentBook}
                team={team}
                availableBooks={books}
                onNavigateToSettings={() => {
                  setSettingsSubTab('books');
                  setActiveTab('settings');
                }}
                onRefresh={reloadData}
              />
            ) : (
              <AnalyticsView
                analytics={analytics}
                currentBook={currentBook}
                team={team}
                availableBooks={books}
                onNavigateToSettings={() => {
                  setSettingsSubTab('books');
                  setActiveTab('settings');
                }}
                onRefresh={reloadData}
              />
            )
          )}

          {activeTab === 'security' && hasAdminAccess && (
            <SecurityConsole
              team={team}
              currentUser={currentUser}
              onNavigateToTab={setActiveTab}
            />
          )}
        </main>
        </div>
      </div>

      {/* Native Mobile Bottom Navigation Bar (Thumb Zone for <= 640px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        currentBook={currentBook}
        currentUser={currentUser || undefined}
        team={team}
        completedVerses={analytics !== null && analytics.book === currentBook ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
        totalVerses={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
        bgTheme={bgTheme}
        onSelectBgTheme={setBgTheme}
        onOpenBookModal={() => setShowBookModal(true)}
        onOpenHelp={() => setShowHelp(true)}
        onOpenAssistant={() => setShowAssistant(true)}
        onToggleFloatingProgress={() => setShowFloatingProgress((v) => !v)}
        onOpenTeamModal={() => handleNavigateToSettings('team')}
      />

      {/* WhatsApp Modal */}
      {whatsAppVerse && (
        <WhatsAppModal
          verse={whatsAppVerse}
          book={currentBook}
          team={team}
          onClose={() => setWhatsAppVerse(null)}
        />
      )}

      {/* Help & Keyboard Shortcuts Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Google Sheet Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          onClose={() => setShowConnectionModal(false)}
          onConnected={reloadData}
        />
      )}

      {/* Global Smart Assistant Drawer */}
      {showAssistant && currentVerse && (
        <SmartAssistantDrawer
          isOpen={showAssistant}
          onClose={() => setShowAssistant(false)}
          verse={currentVerse}
          currentBook={currentBook}
          currentUser={currentUser}
          team={team}
          allChapterVerses={verses}
        />
      )}

      {/* Bible Book & Chapter Selector Modal (YouVersion Style) */}
      <BookChapterModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onSelect={(b, c) => {
          setCurrentBook(b);
          setCurrentChapter(c);
        }}
        availableBooks={books}
      />

      {/* Team Directory & Role Management Modal (Task 4.3) */}
      <TeamManagementModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        team={team}
        onSaveMember={handleSaveMember}
        onSyncProtections={handleSyncProtections}
      />

      {/* Floating Book Progress Card with Blast Entrance & 6s Auto-Close */}
      <FloatingBookProgress
        book={currentBook}
        completedVerses={analytics !== null ? analytics.completed : verses.filter((v) => v.status === 'Done').length}
        totalVerses={analytics?.total && analytics.book === currentBook ? analytics.total : getBookTotalVerses(currentBook)}
        isOpen={showFloatingProgress}
        onClose={() => setShowFloatingProgress(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  const [syncedTeam, setSyncedTeam] = useState<TeamMember[]>(() => {
    const bundle = getCachedInitialBundle('Romans', 1);
    return bundle?.team || [];
  });

  return (
    <AuthProvider team={syncedTeam}>
      <AppContent onTeamSync={setSyncedTeam} />
    </AuthProvider>
  );
};

export default App;
