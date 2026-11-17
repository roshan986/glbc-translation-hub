import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TeamMember, VerseItem, ParsedImportVerse } from '../../types';
import {
  Users,
  BookOpen,
  FileUp,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Phone,
  Calendar,
  Sliders,
  Palette,
  X,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { extractDocxBlocks, groupBlocksIntoVerses, parsePastedText } from '../../services/docxParser';
import { downloadDrafterTemplate } from '../../services/templateGenerator';
import { getBookChaptersCount, CANONICAL_BOOKS } from '../../services/kjvService';
import { getSmartInitials, getRoleAvatarColor } from '../../utils/userUtils';
import { showToast } from '../../utils/toast';
import { calculatePacingStats } from '../../utils/pacingEngine';
import { ALL_ROLES, type SettingsSubTab } from '../SettingsView';

interface TabletSettingsViewProps {
  currentBook: string;
  books: string[];
  team: TeamMember[];
  verses: VerseItem[];
  currentChapter: number;
  initialSubTab?: SettingsSubTab;
  onSaveMember: (member: {
    name: string;
    role: string;
    phone: string;
    email: string;
    active: boolean;
    roles: string[];
    originalEmail?: string;
    originalName?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onSyncProtections: () => Promise<{ success: boolean; message?: string; error?: string }>;
  onInitBook: (bookName: string) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  onImportSuccess: (importedVerses: ParsedImportVerse[]) => Promise<void>;
  onNavigateToFocus: () => void;
  isLiveConnected: boolean;
  onOpenConnectionModal?: () => void;
}

export const TabletSettingsView: React.FC<TabletSettingsViewProps> = ({
  currentBook,
  books,
  team,
  verses,
  currentChapter,
  initialSubTab = 'team',
  onSaveMember,
  onSyncProtections,
  onInitBook,
  onRefreshData,
  onImportSuccess,
  onNavigateToFocus,
  isLiveConnected,
  onOpenConnectionModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // --------------------------------------------------------------------------
  // SUB-TAB 1: TEAM & ACCESS STATE
  // --------------------------------------------------------------------------
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [isSyncingProtections, setIsSyncingProtections] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [editingMember, setEditingMember] = useState<{
    name: string;
    phone: string;
    email: string;
    active: boolean;
    roles: string[];
    originalEmail?: string;
    originalName?: string;
  } | null>(null);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [saveMemberError, setSaveMemberError] = useState<string | null>(null);

  // Grouped members for directory
  const groupedTeam = useMemo(() => {
    const map = new Map<string, {
      name: string;
      email: string;
      phone: string;
      active: boolean;
      roles: Set<string>;
    }>();

    team.forEach((m) => {
      const key = (m.email && m.email.trim()) ? m.email.toLowerCase().trim() : m.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: m.name,
          email: m.email || '',
          phone: m.phone || '',
          active: m.active !== false,
          roles: new Set(m.roles && m.roles.length > 0 ? m.roles : (m.role ? [m.role] : []))
        });
      } else {
        const existing = map.get(key)!;
        if (m.role) existing.roles.add(m.role);
        if (m.roles) m.roles.forEach((r) => existing.roles.add(r));
        if (m.phone && !existing.phone) existing.phone = m.phone;
        if (m.active !== undefined) existing.active = m.active !== false;
      }
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      roles: Array.from(item.roles)
    }));
  }, [team]);

  const filteredTeam = useMemo(() => {
    return groupedTeam.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
        m.phone.includes(teamSearch) ||
        m.roles.some((r) => r.toLowerCase().includes(teamSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedRoleFilter === 'All') return true;
      return m.roles.some((r) => r.toLowerCase().includes(selectedRoleFilter.toLowerCase()));
    });
  }, [groupedTeam, teamSearch, selectedRoleFilter]);

  const handleSyncProtections = async () => {
    setIsSyncingProtections(true);
    setSyncStatus({ type: 'idle', message: '' });
    try {
      const res = await onSyncProtections();
      if (res.success) {
        showToast('success', res.message || 'Column protections successfully synced to all sheets!');
        setSyncStatus({
          type: 'success',
          message: res.message || 'Column protections successfully synced to all sheets based on Config emails!'
        });
      } else {
        showToast('error', res.error || 'Failed to sync column protections.');
        setSyncStatus({
          type: 'error',
          message: res.error || 'Failed to sync column protections.'
        });
      }
    } catch (err) {
      showToast('error', 'Error syncing protections: ' + String(err));
      setSyncStatus({
        type: 'error',
        message: 'Error during protection sync: ' + String(err)
      });
    } finally {
      setIsSyncingProtections(false);
    }
  };

  const handleSaveMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editingMember.name.trim()) {
      setSaveMemberError('Name is required');
      return;
    }
    if (editingMember.roles.length === 0) {
      setSaveMemberError('Please select at least one role');
      return;
    }

    setIsSavingMember(true);
    setSaveMemberError(null);
    try {
      const res = await onSaveMember({
        name: editingMember.name.trim(),
        role: editingMember.roles[0],
        roles: editingMember.roles,
        phone: editingMember.phone.trim(),
        email: editingMember.email.trim(),
        active: editingMember.active,
        originalEmail: editingMember.originalEmail,
        originalName: editingMember.originalName
      });

      if (res.success) {
        showToast('success', `Saved ${editingMember.name} successfully!`);
        setEditingMember(null);
        if (onRefreshData) await onRefreshData();
      } else {
        setSaveMemberError(res.error || 'Failed to save member.');
      }
    } catch (err) {
      setSaveMemberError(String(err));
    } finally {
      setIsSavingMember(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 2: BOOK & SHEET SETUP STATE
  // --------------------------------------------------------------------------
  const [selectedInitBook, setSelectedInitBook] = useState<string>(currentBook);
  const [isInitializingSheet, setIsInitializingSheet] = useState(false);
  const [sheetOpNotice, setSheetOpNotice] = useState<string | null>(null);

  const [savedTargetDate, setSavedTargetDate] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });

  useEffect(() => {
    const saved = localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
    setSavedTargetDate(saved);
    setTargetDateStr(saved);
  }, [currentBook]);

  const targetStats = useMemo(() => {
    const total = CANONICAL_BOOKS.find((b) => b.name === currentBook)?.versesCount || 433;
    const completed = verses.filter((v) => v.status === 'Done').length;
    return calculatePacingStats(targetDateStr, total, completed);
  }, [targetDateStr, currentBook, verses]);

  const handleSaveTargetDate = () => {
    if (!targetDateStr) {
      handleClearTargetDate();
      return;
    }
    localStorage.setItem(`glbc_target_date_${currentBook}`, targetDateStr);
    setSavedTargetDate(targetDateStr);
    window.dispatchEvent(new Event('storage'));
    showToast('success', `Target completion date locked as ${targetDateStr} for ${currentBook}.`);
    setSheetOpNotice(`Target completion date locked as ${targetDateStr} for ${currentBook}.`);
  };

  const handleClearTargetDate = () => {
    localStorage.removeItem(`glbc_target_date_${currentBook}`);
    setSavedTargetDate('');
    setTargetDateStr('');
    window.dispatchEvent(new Event('storage'));
    showToast('info', `Target date cleared for ${currentBook}.`);
    setSheetOpNotice(`Target completion date cleared for ${currentBook}.`);
  };

  const handleInitBookSubmit = async () => {
    setIsInitializingSheet(true);
    setSheetOpNotice(null);
    try {
      await onInitBook(selectedInitBook);
      showToast('success', `Book "${selectedInitBook}" initialized in Google Sheets!`);
      setSheetOpNotice(`Book "${selectedInitBook}" initialized successfully in Google Sheets!`);
    } catch (err) {
      showToast('error', `Error initializing book: ${String(err)}`);
      setSheetOpNotice(`Error initializing book: ${String(err)}`);
    } finally {
      setIsInitializingSheet(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: DRAFTER STUDIO & TEMPLATES STATE
  // --------------------------------------------------------------------------
  const [templateChapter, setTemplateChapter] = useState<number>(currentChapter);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isParsingDocx, setIsParsingDocx] = useState<boolean>(false);
  const [isImportingDocx, setIsImportingDocx] = useState<boolean>(false);
  const [docxParseError, setDocxParseError] = useState<string | null>(null);
  const [parsedVerses, setParsedVerses] = useState<ParsedImportVerse[] | null>(null);
  const [pasteMode, setPasteMode] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);
  const [showColorModal, setShowColorModal] = useState<boolean>(false);
  const [inspectingParsedVerse, setInspectingParsedVerse] = useState<ParsedImportVerse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalChapters = getBookChaptersCount(currentBook);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setDocxParseError('Please upload a Microsoft Word document (.docx).');
      showToast('error', 'Please upload a Microsoft Word document (.docx).');
      return;
    }

    try {
      setIsParsingDocx(true);
      setDocxParseError(null);
      setImportSuccessNotice(null);

      const blocks = await extractDocxBlocks(file);
      const results = groupBlocksIntoVerses(blocks, currentBook, verses);

      if (results.length === 0) {
        setDocxParseError('No verse sections found in the document. Ensure sections start with "Verse: Rom 1:1" and include "Proposed Reading:".');
      } else {
        setParsedVerses(results);
        showToast('success', `Parsed ${results.length} verses from document!`);
      }
    } catch (err) {
      setDocxParseError('Failed to parse Word document: ' + String(err));
      showToast('error', 'Failed to parse Word document');
    } finally {
      setIsParsingDocx(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      setDocxParseError('Please paste verse text to parse.');
      return;
    }
    setDocxParseError(null);
    setImportSuccessNotice(null);
    const results = parsePastedText(pastedText, currentBook, verses);
    if (results.length === 0) {
      setDocxParseError('No verses could be detected in pasted text.');
    } else {
      setParsedVerses(results);
      showToast('success', `Parsed ${results.length} verses from text!`);
    }
  };

  const toggleSelectVerse = (idx: number) => {
    if (!parsedVerses) return;
    setParsedVerses(
      parsedVerses.map((v, i) => (i === idx ? { ...v, selectedForImport: !v.selectedForImport } : v))
    );
  };

  const handleExecuteImport = async () => {
    if (!parsedVerses) return;
    const selected = parsedVerses.filter((v) => v.selectedForImport);
    if (selected.length === 0) {
      setDocxParseError('No verses selected for import.');
      return;
    }

    try {
      setIsImportingDocx(true);
      setDocxParseError(null);
      await onImportSuccess(selected);
      showToast('success', `Successfully imported ${selected.length} verse(s) into Google Sheets!`);
      setImportSuccessNotice(`Successfully imported ${selected.length} verse(s) into Google Sheets!`);
      setParsedVerses(null);
      setPastedText('');
    } catch (err) {
      setDocxParseError('Import failed: ' + String(err));
      showToast('error', 'Import failed: ' + String(err));
    } finally {
      setIsImportingDocx(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadDrafterTemplate(currentBook, templateChapter);
      showToast('success', `Downloaded template for ${currentBook} Chapter ${templateChapter}`);
    } catch (err) {
      showToast('error', 'Failed to generate template: ' + String(err));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5.5rem' }}>

      {/* ── 1. Tablet Header Banner ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        borderRadius: '0.625rem',
        border: '1px solid var(--theme-border, #e2e8f0)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
              Settings &amp; Operations Hub
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
              Centralized Google Sheets controls, team directory, and drafter tools
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToFocus}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.85rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <BookOpen size={15} />
          <span>Return to Focus</span>
        </button>
      </div>

      {/* ── 2. Tablet Subtab Navigation Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '2px solid var(--theme-border, #e2e8f0)',
        paddingBottom: '0.25rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('team')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: activeSubTab === 'team' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'team' ? '#ffffff' : 'var(--theme-text-muted)',
            border: 'none',
            borderRadius: '0.375rem 0.375rem 0 0',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Users size={15} />
          <span>Team &amp; Access ({groupedTeam.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('books')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: activeSubTab === 'books' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'books' ? '#ffffff' : 'var(--theme-text-muted)',
            border: 'none',
            borderRadius: '0.375rem 0.375rem 0 0',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <BookOpen size={15} />
          <span>Book &amp; Sheet Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('drafter')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: activeSubTab === 'drafter' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'drafter' ? '#ffffff' : 'var(--theme-text-muted)',
            border: 'none',
            borderRadius: '0.375rem 0.375rem 0 0',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <FileUp size={15} />
          <span>Drafter Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('connection')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            backgroundColor: activeSubTab === 'connection' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'connection' ? '#ffffff' : 'var(--theme-text-muted)',
            border: 'none',
            borderRadius: '0.375rem 0.375rem 0 0',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Zap size={15} />
          <span>API Connection</span>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isLiveConnected ? '#10b981' : '#f59e0b'
          }} />
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ── SUB-TAB 1: TEAM & ACCESS (2-Column Card Grid) ── */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="var(--theme-text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search scholars by name, role, email…"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                    border: '1px solid var(--theme-border)',
                    background: 'var(--theme-box-bg)',
                    color: 'var(--theme-text)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  background: 'var(--theme-box-bg)',
                  color: 'var(--theme-text)'
                }}
              >
                <option value="All">All Roles ({groupedTeam.length})</option>
                <option value="Reviewer">Reviewers</option>
                <option value="Committee">Committee</option>
                <option value="Drafter">Drafters</option>
                <option value="Final Editor">Final Editors</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setEditingMember({
                  name: '',
                  phone: '',
                  email: '',
                  active: true,
                  roles: ['Technical Reviewer']
                })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Add Member</span>
              </button>

              <button
                type="button"
                onClick={handleSyncProtections}
                disabled={isSyncingProtections}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: isSyncingProtections ? 'not-allowed' : 'pointer'
                }}
              >
                <ShieldCheck size={14} />
                <span>{isSyncingProtections ? 'Syncing…' : 'Sync Protections'}</span>
              </button>
            </div>
          </div>

          {syncStatus.message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              backgroundColor: syncStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: syncStatus.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${syncStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {syncStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* 2-Column Responsive Card Grid for Team Members */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            {filteredTeam.map((member) => (
              <div
                key={member.email || member.name}
                style={{
                  backgroundColor: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  borderRadius: '0.625rem',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: getRoleAvatarColor(member.roles[0] || 'Drafter'),
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.875rem'
                      }}>
                        {getSmartInitials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                          {member.email || 'No Google Email set'}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '9999px',
                      backgroundColor: member.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                      color: member.active ? '#10b981' : '#64748b'
                    }}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                    {member.roles.map((r) => (
                      <span
                        key={r}
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '0.25rem',
                          backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
                          color: 'var(--theme-text)',
                          border: '1px solid var(--theme-border, #e2e8f0)'
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--theme-border, #e2e8f0)', paddingTop: '0.625rem' }}>
                  {member.phone && (
                    <a
                      href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${member.name}, message from GLBC translation coordinator regarding ${currentBook}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={12} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditingMember({
                      name: member.name,
                      phone: member.phone,
                      email: member.email,
                      active: member.active,
                      roles: member.roles,
                      originalEmail: member.email,
                      originalName: member.name
                    })}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      padding: '0.4rem 0.6rem',
                      backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={12} />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* ── SUB-TAB 2: BOOK & SHEET SETUP ── */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {/* Target Completion Date Card */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} color="#e11d48" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                  Target Completion: {currentBook}
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.45 }}>
                Locks target deadline to synchronize running daily pace and countdown in Focus Mode and Analytics.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.65rem',
                    border: '1px solid var(--theme-border)',
                    background: 'var(--theme-box-bg)',
                    color: 'var(--theme-text)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    colorScheme: 'light dark'
                  }}
                />

                <button
                  type="button"
                  onClick={handleSaveTargetDate}
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>

                {savedTargetDate && (
                  <button
                    type="button"
                    onClick={handleClearTargetDate}
                    style={{
                      padding: '0.45rem 0.65rem',
                      backgroundColor: 'transparent',
                      color: 'var(--theme-text-muted)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {targetStats.hasTargetDate && (
                <div style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: 'var(--theme-text-muted)' }}>
                    {targetStats.isPast ? `${targetStats.daysOverdue}d overdue` : `${targetStats.daysRemaining}d left`}
                  </span>
                  <span style={{ fontWeight: 800, color: '#0284c7' }}>
                    {targetStats.requiredDailyPace} verses/day pace
                  </span>
                </div>
              )}
            </div>

            {/* 1-Click Translation Sheet Initializer */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={18} color="#0284c7" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                  Initialize Book Sheet
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.45 }}>
                Creates a canonical 18-column translation worksheet with validations and protections in Google Sheets.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select
                  value={selectedInitBook}
                  onChange={(e) => setSelectedInitBook(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.65rem',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    background: 'var(--theme-box-bg)',
                    color: 'var(--theme-text)'
                  }}
                >
                  {CANONICAL_BOOKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.chaptersCount} ch, {b.versesCount} v)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleInitBookSubmit}
                  disabled={isInitializingSheet}
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isInitializingSheet ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isInitializingSheet ? 'Initializing…' : 'Initialize'}
                </button>
              </div>

              {sheetOpNotice && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  fontSize: '0.75rem'
                }}>
                  {sheetOpNotice}
                </div>
              )}
            </div>
          </div>

          {/* 3-Column Grid of All 66 Canonical Books */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 0.25rem 0.35rem 0.25rem'
            }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Canonical Books Directory (All 66 Books)
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              maxHeight: '340px',
              overflowY: 'auto'
            }}>
              {CANONICAL_BOOKS.map((b) => {
                const isActive = books.some((active) => active.toLowerCase() === b.name.toLowerCase());
                return (
                  <div
                    key={b.name}
                    style={{
                      backgroundColor: 'var(--theme-card-bg, #ffffff)',
                      border: `1px solid ${isActive ? '#0284c7' : 'var(--theme-border, #e2e8f0)'}`,
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.35rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--theme-text-muted)' }}>
                          {b.testament}
                        </span>
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                          color: isActive ? '#10b981' : '#64748b'
                        }}>
                          {isActive ? 'Active Sheet' : 'Not Init'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--theme-text)', marginTop: '0.2rem' }}>
                        {b.name}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                      {b.chaptersCount} ch · {b.versesCount} verses
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* ── SUB-TAB 3: DRAFTER STUDIO & TEMPLATES ── */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'drafter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            {/* Word Document Import Card */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileUp size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                    Import Drafter Document
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setPasteMode((p) => !p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {pasteMode ? 'Upload File' : 'Paste Text'}
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.45 }}>
                Parses Word (.docx) documents, extracting color codes and 2-row Kannada/English back-translation tables into Google Sheets.
              </p>

              {!pasteMode ? (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsingDocx}
                    style={{
                      width: '100%',
                      padding: '1.5rem 1rem',
                      border: '2px dashed var(--theme-border, #cbd5e1)',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                      color: 'var(--theme-text)',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: isParsingDocx ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <FileUp size={24} color="#0284c7" />
                    <span>{isParsingDocx ? 'Parsing document…' : 'Tap to select Word (.docx) file'}</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <textarea
                    rows={4}
                    placeholder={`Paste text with format:\nVerse: Rom 1:1\nProposed Reading: ...\nDrafter Comments: ...`}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      background: 'var(--theme-box-bg)',
                      color: 'var(--theme-text)',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleParsePasted}
                    style={{
                      padding: '0.45rem',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Parse Pasted Verses
                  </button>
                </div>
              )}

              {docxParseError && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: '0.75rem'
                }}>
                  {docxParseError}
                </div>
              )}

              {importSuccessNotice && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontSize: '0.75rem'
                }}>
                  {importSuccessNotice}
                </div>
              )}
            </div>

            {/* Download Drafter Template Card */}
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <Download size={18} color="#0284c7" />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                    Download Drafter Word Template
                  </h3>
                </div>

                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--theme-text-muted)', lineHeight: 1.45 }}>
                  Generates a pre-formatted .docx document with required section labels and back-translation tables for drafters.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
                  <select
                    value={templateChapter}
                    onChange={(e) => setTemplateChapter(parseInt(e.target.value, 10))}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.65rem',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      background: 'var(--theme-box-bg)',
                      color: 'var(--theme-text)'
                    }}
                  >
                    {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                      <option key={ch} value={ch}>
                        {currentBook} Chapter {ch}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: isDownloadingTemplate ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Download size={14} />
                    <span>{isDownloadingTemplate ? 'Downloading…' : 'Download'}</span>
                  </button>
                </div>
              </div>

              {/* Translation Color Rules Button */}
              <button
                type="button"
                onClick={() => setShowColorModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  borderRadius: '0.5rem',
                  color: 'var(--theme-text)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Palette size={16} color="#7c3aed" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      Color Code Translation Rules
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                      View grammatical and theological color conventions
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--theme-text-muted)" />
              </button>
            </div>
          </div>

          {/* Parsed Verses Grid */}
          {parsedVerses && parsedVerses.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.25rem 0.35rem 0.25rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                  Parsed Verses ({parsedVerses.filter((v) => v.selectedForImport).length} of {parsedVerses.length} selected)
                </span>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImportingDocx}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isImportingDocx ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isImportingDocx ? 'Importing…' : 'Import Selected Verses'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem'
              }}>
                {parsedVerses.map((v, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--theme-card-bg, #ffffff)',
                      border: '1px solid var(--theme-border, #e2e8f0)',
                      borderRadius: '0.625rem',
                      padding: '0.875rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={v.selectedForImport}
                            onChange={() => toggleSelectVerse(idx)}
                          />
                          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                            {v.verseRef}
                          </span>
                        </label>

                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          backgroundColor: v.statusInSheet === 'ready' ? 'rgba(16, 185, 129, 0.15)' : v.statusInSheet === 'conflict' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.2)',
                          color: v.statusInSheet === 'ready' ? '#10b981' : v.statusInSheet === 'conflict' ? '#d97706' : '#64748b'
                        }}>
                          {v.statusInSheet === 'ready' ? '✅ Ready' : v.statusInSheet === 'conflict' ? '⚠️ Conflict' : '❓ New'}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--theme-text)',
                        lineHeight: 1.4,
                        maxHeight: '65px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {v.proposedText || '(No proposed text)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingParsedVerse(v)}
                      style={{
                        padding: '0.35rem',
                        backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
                        color: 'var(--theme-text)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Inspect Full Verse ↗
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* ── SUB-TAB 4: CONNECTION & API ── */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'connection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '1.25rem',
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap size={20} color={isLiveConnected ? '#10b981' : '#f59e0b'} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                Google Apps Script Web App API
              </h3>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.375rem',
              backgroundColor: isLiveConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isLiveConnected ? '#10b981' : '#d97706',
              fontSize: '0.8125rem',
              fontWeight: 700
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLiveConnected ? '#10b981' : '#f59e0b'
              }} />
              <span>{isLiveConnected ? 'Connected & Live Sync Active' : 'Disconnected / Standalone Mode'}</span>
            </div>

            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-text-muted)', lineHeight: 1.5 }}>
              The GLBC Web App communicates seamlessly with Google Sheets as a headless transactional database via serverless Google Apps Script JSON endpoints.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {onRefreshData && (
                <button
                  type="button"
                  onClick={async () => {
                    await onRefreshData();
                    showToast('success', 'Data re-synchronized from Google Sheets!');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 1rem',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Reload Data</span>
                </button>
              )}

              {onOpenConnectionModal && (
                <button
                  type="button"
                  onClick={onOpenConnectionModal}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: 'transparent',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-border)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Configure URL
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit / Add Member Modal ── */}
      {editingMember && (
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
          <form
            onSubmit={handleSaveMemberSubmit}
            style={{
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.875rem',
              width: '100%',
              maxWidth: '420px',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                {editingMember.originalEmail || editingMember.originalName ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {saveMemberError && (
              <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '0.75rem'
              }}>
                {saveMemberError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={editingMember.name}
                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                placeholder="e.g. Dr. Paul"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  background: 'var(--theme-box-bg)',
                  color: 'var(--theme-text)',
                  boxSizing: 'border-box',
                  marginTop: '0.2rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                GOOGLE EMAIL (FOR COLUMN PROTECTIONS)
              </label>
              <input
                type="email"
                value={editingMember.email}
                onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                placeholder="scholar@gmail.com"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  background: 'var(--theme-box-bg)',
                  color: 'var(--theme-text)',
                  boxSizing: 'border-box',
                  marginTop: '0.2rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                WHATSAPP PHONE (WITH COUNTRY CODE, NO '+')
              </label>
              <input
                type="tel"
                value={editingMember.phone}
                onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                placeholder="919876543210"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  background: 'var(--theme-box-bg)',
                  color: 'var(--theme-text)',
                  boxSizing: 'border-box',
                  marginTop: '0.2rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                ASSIGNED ROLES *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.35rem', marginTop: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                {ALL_ROLES.map((role) => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingMember.roles.includes(role)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...editingMember.roles, role]
                          : editingMember.roles.filter((r) => r !== role);
                        setEditingMember({ ...editingMember, roles: newRoles });
                      }}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--theme-text)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editingMember.active}
                onChange={(e) => setEditingMember({ ...editingMember, active: e.target.checked })}
              />
              <span>Active Team Member</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-text-muted)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingMember}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: isSavingMember ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingMember ? 'Saving…' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Parsed Verse Preview Modal ── */}
      {inspectingParsedVerse && (
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
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                {inspectingParsedVerse.verseRef} Preview
              </h3>
              <button
                type="button"
                onClick={() => setInspectingParsedVerse(null)}
                style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                Proposed Reading (Kannada)
              </div>
              <div style={{
                fontFamily: 'Noto Sans Kannada, sans-serif',
                fontSize: '1rem',
                lineHeight: 1.65,
                color: 'var(--theme-text)',
                padding: '0.625rem',
                backgroundColor: 'var(--theme-box-bg)',
                borderRadius: '0.375rem',
                marginTop: '0.25rem'
              }}>
                {inspectingParsedVerse.proposedText || '(No proposed text)'}
              </div>
            </div>

            {inspectingParsedVerse.drafterComments && (
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                  Drafter Notes &amp; Back-Translation
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  lineHeight: 1.45,
                  color: 'var(--theme-text-muted)',
                  padding: '0.625rem',
                  backgroundColor: 'var(--theme-box-bg)',
                  borderRadius: '0.375rem',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  marginTop: '0.25rem'
                }}>
                  {inspectingParsedVerse.drafterComments}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setInspectingParsedVerse(null)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Translation Color Rules Modal ── */}
      {showColorModal && (
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
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Palette size={18} color="#7c3aed" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                  Color-Code Translation Rules
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColorModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '260px', overflowY: 'auto' }}>
              {[
                { color: '#ef4444', label: 'Red', meaning: 'Grammatical or lexical issue; strong revision needed' },
                { color: '#3b82f6', label: 'Blue', meaning: 'Kannada syntax or word-order rearrangement' },
                { color: '#10b981', label: 'Green', meaning: 'Approved rendering or verified literal back-translation' },
                { color: '#f59e0b', label: 'Yellow / Orange', meaning: 'Theological nuance requiring committee discussion' },
                { color: '#8b5cf6', label: 'Purple', meaning: 'Textual variant (Textus Receptus vs Critical Text)' }
              ].map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.color, flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <strong style={{ color: 'var(--theme-text)' }}>{c.label}: </strong>
                    <span style={{ color: 'var(--theme-text-muted)' }}>{c.meaning}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowColorModal(false)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
