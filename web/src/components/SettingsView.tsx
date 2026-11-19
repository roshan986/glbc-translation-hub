import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { TeamMember, VerseItem, ParsedImportVerse } from '../types';
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
  Lock
} from 'lucide-react';
import { extractDocxBlocks, groupBlocksIntoVerses, parsePastedText } from '../services/docxParser';
import { downloadDrafterTemplate } from '../services/templateGenerator';
import { getBookChaptersCount } from '../services/kjvService';
import { getSmartInitials, getRoleAvatarColor, getRoleAvatarHex } from '../utils/userUtils';
import { showToast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

export type SettingsSubTab = 'team' | 'books' | 'drafter' | 'connection';

export const ALL_ROLES = [
  'Drafter',
  'Technical Reviewer',
  'Style & Language Reviewer',
  'Orthographic Reviewer',
  'Theological Reviewer',
  'Committee',
  'Final Editor'
] as const;

export type SupportedRole = typeof ALL_ROLES[number];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Drafter': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Technical Reviewer': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  'Style & Language Reviewer': { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  'Orthographic Reviewer': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  'Theological Reviewer': { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  'Committee': { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
  'Final Editor': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }
};

interface SettingsViewProps {
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

export const SettingsView: React.FC<SettingsViewProps> = ({
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
  const { canEdit } = useAuth();
  const isSettingsEditable = canEdit('settings');
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
    if (!isSettingsEditable) {
      showToast('warning', 'Read-only access: Column protection sync is restricted.');
      return;
    }
    setIsSyncingProtections(true);
    setSyncStatus({ type: 'idle', message: '' });
    try {
      const res = await onSyncProtections();
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message || 'Column protections successfully synced to all sheets based on Config emails!'
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.error || 'Failed to sync column protections.'
        });
      }
    } catch (err) {
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
    if (!isSettingsEditable) {
      showToast('warning', 'Read-only access: Modifying team members is restricted.');
      return;
    }
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
  // SUB-TAB 2: BOOK & SHEET SETUP STATE (WITH TARGET DATE ENGINE - TASK 6.1)
  // --------------------------------------------------------------------------
  const isCurrentBookActive = useMemo(() => {
    return books.some((b) => b.toLowerCase() === currentBook.toLowerCase());
  }, [books, currentBook]);
  const [isInitializingSheet, setIsInitializingSheet] = useState(false);
  const [sheetOpNotice, setSheetOpNotice] = useState<string | null>(null);

  // Target Date Engine State (Task 6.1) - Strictly opt-in, no fabricated defaults
  const [savedTargetDate, setSavedTargetDate] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
    setSavedTargetDate(saved);
    setTargetDateStr(saved);
  }, [currentBook]);

  const handleSaveTargetDate = () => {
    if (!targetDateStr) {
      handleClearTargetDate();
      return;
    }
    localStorage.setItem(`glbc_target_date_${currentBook}`, targetDateStr);
    setSavedTargetDate(targetDateStr);
    window.dispatchEvent(new Event('storage'));
    setSheetOpNotice(`Target completion date locked as ${targetDateStr} for ${currentBook}.`);
  };

  const handleClearTargetDate = () => {
    localStorage.removeItem(`glbc_target_date_${currentBook}`);
    setSavedTargetDate('');
    setTargetDateStr('');
    window.dispatchEvent(new Event('storage'));
    setSheetOpNotice(`Target completion date cleared for ${currentBook}.`);
  };

  const handleInitBookSubmit = async () => {
    setIsInitializingSheet(true);
    setSheetOpNotice(null);
    try {
      await onInitBook(currentBook);
      setSheetOpNotice(`Book "${currentBook}" initialized successfully in Google Sheets with all 18 colored columns and validations!`);
    } catch (err) {
      setSheetOpNotice(`Error initializing book: ${String(err)}`);
    } finally {
      setIsInitializingSheet(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: DRAFTER STUDIO & WORD IMPORT STATE (REUSED FROM DRAFTERPORTAL)
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const totalChapters = getBookChaptersCount(currentBook);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setDocxParseError('Please upload a Microsoft Word document (.docx).');
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
      }
    } catch (err) {
      console.error('Docx parse error:', err);
      setDocxParseError('Failed to parse Word document: ' + String(err));
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
      setImportSuccessNotice(`Successfully imported ${selected.length} verse(s) into Google Sheets!`);
      setParsedVerses(null);
      setPastedText('');
    } catch (err) {
      setDocxParseError('Import failed: ' + String(err));
    } finally {
      setIsImportingDocx(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadDrafterTemplate(currentBook, templateChapter);
    } catch (err) {
      showToast('error', 'Failed to generate template: ' + String(err));
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      {/* ── Page Header (Identical to Coordinator Analytics) ── */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            SETTINGS &amp; OPERATIONS
          </div>
          <h1>Translation Settings &amp; Operations Hub</h1>
          <p>Centralized Google Sheets controls, team directory, drafter intake, and project reports</p>
        </div>

        <div className="analytics-header-actions">
          <button
            type="button"
            onClick={onNavigateToFocus}
            className="analytics-btn-secondary"
            title="Return to active translation focus mode"
          >
            <BookOpen size={14} />
            <span>Return to Focus Mode</span>
          </button>
        </div>
      </div>

      {!isSettingsEditable && (
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#60a5fa'
          }}
        >
          <Lock size={14} />
          <span><b>Read-Only Observation View:</b> You can inspect settings and directory data. Modifications and sheet operations are restricted for your role.</span>
        </div>
      )}

      {/* Top 5 Sub-Tabs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '0.25rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('team')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: activeSubTab === 'team' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'team' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={16} />
          <span>Team &amp; Access</span>
          <span style={{
            fontSize: '0.6875rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '9999px',
            backgroundColor: activeSubTab === 'team' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeSubTab === 'team' ? '#ffffff' : '#475569'
          }}>
            {groupedTeam.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('books')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: activeSubTab === 'books' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'books' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={16} />
          <span>Book &amp; Sheet Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('drafter')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: activeSubTab === 'drafter' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'drafter' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <FileUp size={16} />
          <span>Drafter Studio &amp; Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('connection')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            backgroundColor: activeSubTab === 'connection' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'connection' ? '#ffffff' : '#64748b',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={16} />
          <span>Connection &amp; API</span>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isLiveConnected ? '#10b981' : '#f59e0b'
          }} />
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. TAB CONTENT: TEAM & ACCESS (CONFIG SHEET DIRECTORY & PROTECTIONS) */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--theme-text-muted, #94a3b8)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search team members by name, email, or role…"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    border: '1px solid var(--theme-border, #cbd5e1)',
                    background: 'var(--theme-input-bg, #ffffff)',
                    color: 'var(--theme-text, #0f172a)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem'
                  }}
                />
              </div>

              {/* Role filter dropdown */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--theme-border, #cbd5e1)',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  background: 'var(--theme-input-bg, #ffffff)',
                  color: 'var(--theme-text, #334155)',
                  outline: 'none'
                }}
              >
                <option value="All" style={{ backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)', color: 'var(--theme-text, #334155)' }}>All Roles ({groupedTeam.length})</option>
                <option value="Reviewer" style={{ backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)', color: 'var(--theme-text, #334155)' }}>Reviewers</option>
                <option value="Committee" style={{ backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)', color: 'var(--theme-text, #334155)' }}>Committee</option>
                <option value="Drafter" style={{ backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)', color: 'var(--theme-text, #334155)' }}>Drafters</option>
                <option value="Final Editor" style={{ backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)', color: 'var(--theme-text, #334155)' }}>Final Editors</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                Add Member
              </button>

              <button
                type="button"
                onClick={handleSyncProtections}
                disabled={isSyncingProtections}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: isSyncingProtections ? 'not-allowed' : 'pointer'
                }}
                title="Lock role-specific columns in Google Sheets to assigned Google Emails"
              >
                {isSyncingProtections ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Syncing Protections…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Sync Column Protections
                  </>
                )}
              </button>
            </div>
          </div>

          {syncStatus.message && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              backgroundColor: syncStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: syncStatus.type === 'success' ? '#166534' : '#991b1b',
              border: `1px solid ${syncStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {syncStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{syncStatus.message}</span>
            </div>
          )}

          {/* Member Edit Modal Form */}
          {editingMember && (
            <div style={{
              backgroundColor: 'var(--theme-box-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '0.625rem',
              padding: '1.25rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                {editingMember.originalEmail || editingMember.originalName ? 'Edit Team Member' : 'Add New Team Member'}
              </h3>
              <form onSubmit={handleSaveMemberSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pastor Zack"
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--theme-border)', borderRadius: '0.375rem', fontSize: '0.8125rem', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>Google Email (for Sheets access) *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. zack@gmail.com"
                      value={editingMember.email}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--theme-border)', borderRadius: '0.375rem', fontSize: '0.8125rem', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>WhatsApp Phone (with country code)</label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--theme-border)', borderRadius: '0.375rem', fontSize: '0.8125rem', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>Status</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--theme-text)' }}>
                      <input
                        type="checkbox"
                        checked={editingMember.active}
                        onChange={(e) => setEditingMember({ ...editingMember, active: e.target.checked })}
                      />
                      <span>Active in Translation Workflow</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.35rem' }}>
                    Assigned Roles (A member can hold multiple roles) *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ALL_ROLES.map((r) => {
                      const isSelected = editingMember.roles.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            const newRoles = isSelected
                              ? editingMember.roles.filter((x) => x !== r)
                              : [...editingMember.roles, r];
                            setEditingMember({ ...editingMember, roles: newRoles });
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: `1px solid ${isSelected ? ROLE_COLORS[r]?.border || '#0284c7' : 'var(--theme-border)'}`,
                            backgroundColor: isSelected ? ROLE_COLORS[r]?.bg || '#e0f2fe' : 'var(--theme-card-bg)',
                            color: isSelected ? ROLE_COLORS[r]?.text || '#0369a1' : 'var(--theme-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '}{r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {saveMemberError && (
                  <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.75rem' }}>{saveMemberError}</p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <button
                    type="submit"
                    disabled={isSavingMember}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: isSavingMember ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSavingMember ? 'Saving…' : 'Save Member to ⚙ Config'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--theme-box-bg)',
                      color: 'var(--theme-text)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: '0.375rem',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directory Table */}
          <div style={{
            background: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--theme-box-bg, #f8fafc)', borderBottom: '1px solid var(--theme-border, #e2e8f0)', color: 'var(--theme-text-muted, #475569)', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Team Member</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Roles</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Google Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phone / WhatsApp</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((member) => (
                  <tr key={member.email || member.name} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          backgroundColor: getRoleAvatarHex(member.roles[0]),
                          color: '#ffffff',
                          flexShrink: 0,
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                        }}>
                          {getSmartInitials(member.name)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--theme-text)' }}>{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {member.roles.map((r) => {
                          const c = ROLE_COLORS[r] || { bg: 'var(--theme-box-bg)', text: 'var(--theme-text)', border: 'var(--theme-border)' };
                          return (
                            <span
                              key={r}
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                backgroundColor: c.bg,
                                color: c.text,
                                border: `1px solid ${c.border}`
                              }}
                            >
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--theme-text-muted)' }}>
                      <span style={{ fontFamily: 'monospace' }}>{member.email || '—'}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {member.phone ? (
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            color: '#059669',
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                        >
                          <Phone size={13} />
                          <span>{member.phone}</span>
                        </a>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: member.active ? '#15803d' : '#94a3b8'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: member.active ? '#22c55e' : '#cbd5e1'
                        }} />
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
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
                          padding: '0.3rem 0.6rem',
                          backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
                          border: '1px solid var(--theme-border, #cbd5e1)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--theme-text, #334155)'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. TAB CONTENT: BOOK & SHEET SETUP (WITH TARGET DATE ENGINE - 6.1)   */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Date Configuration Card */}
          <div style={{
            background: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Calendar size={18} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                    Target Completion Date
                  </h3>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--theme-box-bg, #dbeafe)',
                    color: 'var(--theme-accent, #2563eb)',
                    border: '1px solid var(--theme-border, #bfdbfe)'
                  }}>
                    {currentBook.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-text-muted)' }}>
                  Sets the locked target completion date for {currentBook}. Synchronizes the running countdown, daily velocity, and pace status in Focus Mode and Coordinator Analytics.
                </p>
                {savedTargetDate ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={13} /> Active Locked Target: <strong>{savedTargetDate}</strong>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    ⚪ No target date configured for {currentBook}. Select and save a date below to activate pacing analytics.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={targetDateStr}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="target-date-input"
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid var(--theme-border, #cbd5e1)',
                    background: 'var(--theme-input-bg, #ffffff)',
                    color: 'var(--theme-text, #0f172a)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveTargetDate}
                  disabled={!targetDateStr || targetDateStr === savedTargetDate}
                  style={{
                    padding: '0.5rem 0.85rem',
                    backgroundColor: targetDateStr && targetDateStr !== savedTargetDate ? '#2563eb' : 'var(--theme-box-bg, #f1f5f9)',
                    color: targetDateStr && targetDateStr !== savedTargetDate ? '#ffffff' : 'var(--theme-text-muted, #94a3b8)',
                    border: '1px solid var(--theme-border, #cbd5e1)',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: targetDateStr && targetDateStr !== savedTargetDate ? 'pointer' : 'default',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Save Target Date
                </button>
                {savedTargetDate && (
                  <button
                    type="button"
                    onClick={handleClearTargetDate}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid var(--theme-border, #fca5a5)',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Translation Sheet Status & 1-Click Initializer */}
          <div style={{
            background: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
              Translation Sheet Status &amp; Initializer
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--theme-text-muted, #64748b)' }}>
              Worksheet configuration in Google Sheets with complete 18-column colored schema, validations, and frozen panes for <strong>{currentBook}</strong>.
            </p>

            {isCurrentBookActive ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                background: 'var(--theme-box-bg, #f8fafc)',
                border: '1px solid var(--theme-border, #e2e8f0)',
                borderRadius: '0.5rem'
              }}>
                <CheckCircle2 size={22} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
                    "{currentBook}" is active and initialized in Google Sheets
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)' }}>
                    Worksheet tab, 18-column colored schema, dropdown validations, and column protections are synchronized.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.875rem',
                padding: '0.875rem 1.25rem',
                background: 'var(--theme-box-bg, #fffbeb)',
                border: '1px dashed var(--theme-border, #fcd34d)',
                borderRadius: '0.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#d97706' }}>
                    ⚠️ "{currentBook}" is not yet initialized in Google Sheets
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)' }}>
                    Click below to create the worksheet tab with 18-column colored schema, dropdown validations, and frozen panes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleInitBookSubmit}
                  disabled={isInitializingSheet}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isInitializingSheet ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isInitializingSheet ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Initializing {currentBook}…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Initialize "{currentBook}" in Google Sheets
                    </>
                  )}
                </button>
              </div>
            )}

            {sheetOpNotice && (
              <p style={{
                marginTop: '0.85rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--theme-box-bg, #f0fdf4)',
                border: '1px solid var(--theme-border, #bbf7d0)',
                borderRadius: '0.375rem',
                color: 'var(--theme-text, #166534)',
                fontSize: '0.8125rem'
              }}>
                {sheetOpNotice}
              </p>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. TAB CONTENT: DRAFTER STUDIO & WORD IMPORT (.DOCX INTAKE)          */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'drafter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {importSuccessNotice && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1.25rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '0.625rem',
              fontWeight: 500
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>{importSuccessNotice}</span>
              </div>
              <button
                type="button"
                onClick={onNavigateToFocus}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>Jump to Focus Mode</span>
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Word Upload Dropzone */}
            <div style={{
              background: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FileUp size={20} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
                    Import Drafter Word Document (.docx)
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
                  Upload drafter Word documents. Preserves font colors, character highlights, and Kannada-English back-translation tables.
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--theme-border, #93c5fd)',
                    backgroundColor: 'var(--theme-box-bg, #eff6ff)',
                    borderRadius: '0.5rem',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileUp size={36} color="var(--theme-accent, #38bdf8)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--theme-text, #1e40af)' }}>
                    Click or drag Word .docx file here
                  </div>
                  <small style={{ color: 'var(--theme-accent, #60a5fa)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                    Target: {currentBook} (Chapter {currentChapter})
                  </small>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {isParsingDocx && (
                  <p style={{ textAlign: 'center', color: '#2563eb', fontSize: '0.8125rem', marginTop: '0.75rem' }}>
                    Parsing document blocks &amp; font highlights…
                  </p>
                )}

                {docxParseError && (
                  <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={15} />
                    <span>{docxParseError}</span>
                  </p>
                )}
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setPasteMode(!pasteMode)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {pasteMode ? 'Hide Paste Box' : 'Or Paste Raw Text'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowColorModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Palette size={13} />
                  <span>Color Rules</span>
                </button>
              </div>

              {pasteMode && (
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    rows={4}
                    placeholder="Paste verse text here with 'Proposed Reading:' and 'Drafter Comments:'..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleParsePasted}
                    style={{ marginTop: '0.35rem', padding: '0.35rem 0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Parse Pasted Text
                  </button>
                </div>
              )}
            </div>

            {/* Template Generator Card */}
            <div style={{
              background: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Download size={20} color="#059669" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
                    Download Drafter Word Template (.docx)
                  </h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
                  Generate an authentic `.docx` template for drafters pre-filled with KJV text, required section headers, and back-translation tables.
                </p>

                <div style={{
                  backgroundColor: 'var(--theme-box-bg, #f0fdf4)',
                  border: '1px solid var(--theme-border, #bbf7d0)',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--theme-text, #166534)',
                    marginBottom: '0.35rem'
                  }}>
                    Select Chapter for {currentBook}:
                  </label>
                  <select
                    value={templateChapter}
                    onChange={(e) => setTemplateChapter(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      border: '1px solid var(--theme-border, #86efac)',
                      borderRadius: '0.375rem',
                      fontSize: '0.8125rem',
                      backgroundColor: 'var(--theme-input-bg, #ffffff)',
                      color: 'var(--theme-text, #0f172a)',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                      <option
                        key={ch}
                        value={ch}
                        style={{
                          backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)',
                          color: 'var(--theme-text, #0f172a)'
                        }}
                      >
                        {currentBook} Chapter {ch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: isDownloadingTemplate ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Download size={16} />
                  <span>{isDownloadingTemplate ? 'Generating .docx…' : `Download ${currentBook} Ch ${templateChapter} Template`}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Verses Preview Matrix */}
          {parsedVerses && parsedVerses.length > 0 && (
            <div style={{
              background: 'var(--theme-card-bg, #ffffff)',
              borderRadius: '0.625rem',
              border: '1px solid var(--theme-border, #e2e8f0)',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
                    Detected Verses ({parsedVerses.filter((v) => v.selectedForImport).length} of {parsedVerses.length} selected)
                  </h4>
                  <small style={{ color: '#64748b' }}>Select verses to import directly into Google Sheets.</small>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImportingDocx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    cursor: isImportingDocx ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isImportingDocx ? 'Writing to Google Sheets…' : 'Import Selected Verses to Sheets'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {parsedVerses.map((pv, idx) => (
                  <div
                    key={pv.verse}
                    style={{
                      border: `1px solid ${pv.selectedForImport ? 'var(--theme-accent, #93c5fd)' : 'var(--theme-border, #e2e8f0)'}`,
                      backgroundColor: pv.selectedForImport ? 'var(--theme-box-bg, #f8fafc)' : 'var(--theme-card-bg, #ffffff)',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--theme-text)' }}>
                        <input
                          type="checkbox"
                          checked={pv.selectedForImport}
                          onChange={() => toggleSelectVerse(idx)}
                        />
                        <span>{pv.verse}</span>
                      </label>
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: pv.status === 'conflict' ? '#fef3c7' : pv.existingRow ? '#dcfce7' : '#e0f2fe',
                        color: pv.status === 'conflict' ? '#92400e' : pv.existingRow ? '#166534' : '#0369a1',
                        fontWeight: 700
                      }}>
                        {pv.status === 'conflict'
                          ? `⚠️ Row ${pv.existingRow} (has existing draft)`
                          : pv.existingRow
                          ? `✅ Matches Row ${pv.existingRow}`
                          : '✨ New row will be created in Sheets'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--theme-text, #1e293b)', fontFamily: 'var(--font-kannada, "Noto Sans Kannada", sans-serif)', marginTop: '0.25rem' }}>
                      <b>Proposed: </b> {pv.proposed || <span style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>None</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color Rules Modal */}
          {showColorModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem'
            }}>
              <div
                className="app-modal-card"
                style={{
                  backgroundColor: 'var(--theme-card-bg-elevated, #ffffff)',
                  borderRadius: '0.75rem',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '1.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  color: 'var(--theme-text)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--theme-text)' }}>Official GLBC Translation Color Rules</h3>
                  <button
                    type="button"
                    onClick={() => setShowColorModal(false)}
                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#fef9c3', border: '1px solid #fef08a' }}>
                    <b style={{ color: '#854d0e' }}>Yellow:</b> English words omitted in Kannada are highlighted with yellow.
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd' }}>
                    <b style={{ color: '#0369a1' }}>Blue / Turquoise:</b> Added words are highlighted with blue in Kannada verse.
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#fce7f3', border: '1px solid #fbcfe8' }}>
                    <b style={{ color: '#9d174d' }}>Pink:</b> Corrected Kannada words are highlighted with pink.
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <b style={{ color: '#475569' }}>Grey:</b> Italicized words to be highlighted with grey in Kannada &amp; English.
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
                    <b style={{ color: '#166534' }}>Green:</b> Incorrect Kannada word to be highlighted with green.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. TAB CONTENT: CONNECTION & API STATUS                              */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'connection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            background: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border, #e2e8f0)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
              Google Sheets Headless Bridge Connection
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Configure and test the Google Apps Script Web App JSON API endpoint connecting this app to your Google Spreadsheet.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderRadius: '0.5rem',
              backgroundColor: isLiveConnected ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${isLiveConnected ? '#bbf7d0' : '#fde68a'}`,
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isLiveConnected ? '#22c55e' : '#f59e0b'
                }} />
                <div>
                  <b style={{ color: isLiveConnected ? '#15803d' : '#b45309', fontSize: '0.875rem' }}>
                    {isLiveConnected ? 'Connected to Live Google Spreadsheet' : 'Running in Offline / Demo Mode'}
                  </b>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: isLiveConnected ? '#166534' : '#92400e' }}>
                    {isLiveConnected ? 'All reviews, comments, and imports write directly to Google Sheets in real time.' : 'Using local canonical King James datasets and offline storage.'}
                  </p>
                </div>
              </div>

              {onOpenConnectionModal && (
                <button
                  type="button"
                  onClick={onOpenConnectionModal}
                  style={{
                    padding: '0.45rem 0.85rem',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Configure API URL
                </button>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                Auto-Sync Installable Triggers
              </h4>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'var(--theme-text-muted)' }}>
                Whenever team members or Google emails are modified in the <code>⚙ Config</code> sheet, Google Apps Script automatically re-syncs column edit protections across all active translation sheets.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
