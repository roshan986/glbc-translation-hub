import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  BookOpen,
  Zap,
  BookmarkCheck,
  Award,
  ChevronRight,
  Search,
  Sparkles,
  Loader2
} from 'lucide-react';
import type { VerseItem, TeamMember, VerseApprovals } from '../types';
import { computeVerseApprovals } from '../utils/approvalEngine';
import { parseDrafterComments } from '../utils/drafterParser';
import { SAMPLE_TEAM } from '../data/sampleData';
import { getVerseKjvStrongsWords } from '../services/kjvStrongsService';
import type { KjvPhraseWord } from '../services/kjvStrongsService';

interface SmartAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  verse: VerseItem;
  currentBook: string;
  currentUser: TeamMember | null;
  team: TeamMember[];
  allChapterVerses?: VerseItem[];
}

type AssistantTab = 'diagnostic' | 'lexicon' | 'guidance' | 'milestones';

// Official 5 Color Rules from Color_Code_Translation_Rules.pdf
const OFFICIAL_COLOR_RULES = [
  {
    name: 'Yellow Highlight',
    meaning: 'Omitted in Kannada',
    desc: 'The English words that are Omitted in Kannada are highlighted with yellow.',
    bg: '#fef9c3',
    border: '#fde047',
    color: '#854d0e'
  },
  {
    name: 'Blue / Turquoise Highlight',
    meaning: 'Added in Kannada',
    desc: 'The added words are highlighted with blue in Kannada verse (another name for it is turquoise).',
    bg: '#e0f2fe',
    border: '#7dd3fc',
    color: '#0369a1'
  },
  {
    name: 'Pink Highlight',
    meaning: 'Corrected Kannada Words',
    desc: 'The corrected Kannada words are highlighted with pink.',
    bg: '#fce7f3',
    border: '#f472b6',
    color: '#9d174d'
  },
  {
    name: 'Grey Highlight',
    meaning: 'Italicized Words in KJB',
    desc: 'The Italicized words to be highlighted with grey in Kannada & English.',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    color: '#475569'
  },
  {
    name: 'Green Highlight',
    meaning: 'Incorrect Kannada Word',
    desc: 'Incorrect Kannada word to be highlighted with green.',
    bg: '#dcfce7',
    border: '#86efac',
    color: '#166534'
  }
];

export const SmartAssistantDrawer: React.FC<SmartAssistantDrawerProps> = ({
  isOpen,
  onClose,
  verse,
  currentBook,
  currentUser: _currentUser,
  team,
  allChapterVerses
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('diagnostic');
  const [referenceVersion, setReferenceVersion] = useState<string>('kjv');
  const [lexiconSearch, setLexiconSearch] = useState<string>('');
  const [kjvWords, setKjvWords] = useState<KjvPhraseWord[]>([]);
  const [loadingGreek, setLoadingGreek] = useState<boolean>(false);

  // Scroll Lock: Lock background body and main container scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('assistant-drawer-open');
    return () => {
      document.body.classList.remove('assistant-drawer-open');
    };
  }, [isOpen]);

  // Fetch authentic KJV Strong's Greek words from pre-bundled dataset
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    async function fetchGreek() {
      setLoadingGreek(true);
      const words = await getVerseKjvStrongsWords(currentBook, verse.chapter, verse.verseNumber);
      if (!isCancelled) {
        setKjvWords(words);
        setLoadingGreek(false);
      }
    }
    fetchGreek();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentBook, verse.chapter, verse.verseNumber]);

  // Ensure valid team fallback
  const activeTeam = useMemo(() => {
    if (team && Array.isArray(team) && team.length > 0) return team;
    return SAMPLE_TEAM;
  }, [team]);

  // Compute live multi-member approvals
  const approvals: VerseApprovals = useMemo(() => {
    return verse.approvals || computeVerseApprovals(verse.reviews, verse.confirms, activeTeam);
  }, [verse, activeTeam]);

  // Parse active verse drafter back-translation tables and notes
  const parsedDrafter = useMemo(() => {
    return parseDrafterComments(verse.drafterCmtHtml || verse.drafterCmt || '');
  }, [verse.drafterCmt, verse.drafterCmtHtml]);

  // Filtered KJV Greek words by search query
  const filteredKjvWords = useMemo(() => {
    if (!kjvWords || kjvWords.length === 0) return [];
    if (!lexiconSearch.trim()) return kjvWords;
    const q = lexiconSearch.toLowerCase();
    return kjvWords.filter(
      (w) =>
        w.text.toLowerCase().includes(q) ||
        (w.lemma && w.lemma.toLowerCase().includes(q)) ||
        (w.translit && w.translit.toLowerCase().includes(q)) ||
        (w.strongs && w.strongs.toLowerCase().includes(q)) ||
        (w.definition && w.definition.toLowerCase().includes(q)) ||
        (w.kjvGloss && w.kjvGloss.toLowerCase().includes(q))
    );
  }, [kjvWords, lexiconSearch]);

  // Filtered active verse word pairs from drafter table
  const filteredWordPairs = useMemo(() => {
    if (!parsedDrafter.wordPairs || parsedDrafter.wordPairs.length === 0) return [];
    if (!lexiconSearch.trim()) return parsedDrafter.wordPairs;
    const q = lexiconSearch.toLowerCase();
    return parsedDrafter.wordPairs.filter(
      (wp) => wp.kannada.toLowerCase().includes(q) || wp.english.toLowerCase().includes(q)
    );
  }, [parsedDrafter.wordPairs, lexiconSearch]);

  // Chapter metrics
  const chapterVersesList = allChapterVerses && allChapterVerses.length > 0 ? allChapterVerses : [verse];
  const chapterCompleted = chapterVersesList.filter((v) => v.status === 'Done' || v.confirms.final).length;
  const chapterTotal = chapterVersesList.length || 1;
  const chapterPercent = Math.round((chapterCompleted / chapterTotal) * 100);

  const awaitingCommitteeCount = chapterVersesList.filter(
    (v) =>
      v.status === 'Awaiting Committee' ||
      (!v.confirms.comm && v.confirms.tech && v.confirms.style && v.confirms.ortho && v.confirms.theo)
  ).length;

  const awaitingFinalCount = chapterVersesList.filter(
    (v) => v.status === 'Needs Final' || (!v.confirms.final && v.confirms.comm)
  ).length;

  // Diagnostic breakdown
  const getDiagnosticMessage = () => {
    if (verse.isReferenceOnly) {
      return {
        title: 'Reference & Study Mode',
        statusType: 'blue',
        summary: `Authentic Canonical KJV, Greek Textus Receptus, and Berean Interlinear are available for study. Translation worksheet setup in Google Sheets is pending for ${currentBook}.`,
        nextStep: `Once the coordinator creates a worksheet for ${currentBook} in Google Sheets, drafters and reviewers will be able to submit translations and reviews.`
      };
    }
    if (verse.status === 'Done' || verse.confirms.final) {
      return {
        title: 'Verse Finalized & Locked',
        statusType: 'success',
        summary: 'This verse has completed all review stages, committee consensus, and final editorial sign-off.',
        nextStep: 'No action needed. Row is permanently protected in Google Sheets.'
      };
    }
    if (verse.confirms.comm) {
      return {
        title: 'Awaiting Final Canonical Sign-off',
        statusType: 'amber',
        summary: 'Committee consensus has concluded. The verse is in the hands of the Final Editor.',
        nextStep: 'Final Editor checks the 4-point Pre-Flight Guidelines and publishes the canonical Kannada reading.'
      };
    }
    if (
      approvals.tech.isFullyApproved &&
      approvals.style.isFullyApproved &&
      approvals.ortho.isFullyApproved &&
      approvals.theo.isFullyApproved
    ) {
      return {
        title: 'Awaiting Committee Deliberation',
        statusType: 'blue',
        summary: 'All 4 discipline reviews (Technical, Style, Orthographic, Theological) are 100% complete.',
        nextStep: 'Committee members deliberate in Committee Chamber and confirm consensus.'
      };
    }

    return {
      title: 'Under Review by Translation Specialists',
      statusType: 'blue',
      summary: 'Specialist discipline reviewers are examining the proposed Kannada reading against the Greek and KJV.',
      nextStep: 'Assigned reviewers write their notes in their section and click Confirm Review.'
    };
  };

  const diagnostic = getDiagnosticMessage();

  // Dynamic Team Momentum Appreciation Text with broken paragraphs and no bible emoji
  const dynamicAppreciation = useMemo(() => {
    if (chapterCompleted > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div><b>Praise God for translation progress!</b></div>
          <div><b>{chapterCompleted} of {chapterTotal} verses</b> in {currentBook} Chapter {verse.chapter} are fully finalized.</div>
          <div>Active review continues on remaining verses!</div>
        </div>
      );
    }
    if (awaitingCommitteeCount > 0 || awaitingFinalCount > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div><b>Strong momentum in {currentBook} Chapter {verse.chapter}!</b></div>
          <div><b>{awaitingCommitteeCount + awaitingFinalCount} verses</b> have advanced to Committee &amp; Final Editor stages.</div>
          <div>Faithful work by all discipline reviewers!</div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div><b>Translation underway for {currentBook} Chapter {verse.chapter}.</b></div>
        <div><b>{chapterTotal} verses</b> loaded with active multi-disciplinary review in progress.</div>
        <div>Great diligence by the team!</div>
      </div>
    );
  }, [chapterCompleted, chapterTotal, awaitingCommitteeCount, awaitingFinalCount, currentBook, verse.chapter]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        touchAction: 'none'
      }}
      onClick={onClose}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="smart-assistant-drawer"
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header: Smart Assistant / Romans X:Y */}
        <div
          style={{
            padding: '1.125rem 1.25rem',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #3730a3'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(192, 132, 252, 0.2)',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} color="#e9d5ff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Smart Assistant
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                {currentBook} {verse.chapter}:{verse.verseNumber}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#c7d2fe',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--theme-border, #e2e8f0)',
            background: 'var(--theme-box-bg, #f8fafc)',
            padding: '0 0.5rem'
          }}
        >
          <button
            onClick={() => setActiveTab('diagnostic')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'diagnostic' ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === 'diagnostic' ? '#4f46e5' : 'var(--theme-text-muted, #64748b)',
              fontWeight: activeTab === 'diagnostic' ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Zap size={14} />
            <span>Diagnostic</span>
          </button>

          <button
            onClick={() => setActiveTab('lexicon')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'lexicon' ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === 'lexicon' ? '#4f46e5' : 'var(--theme-text-muted, #64748b)',
              fontWeight: activeTab === 'lexicon' ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <BookOpen size={14} />
            <span>Greek &amp; KJV</span>
          </button>

          <button
            onClick={() => setActiveTab('guidance')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'guidance' ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === 'guidance' ? '#4f46e5' : 'var(--theme-text-muted, #64748b)',
              fontWeight: activeTab === 'guidance' ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <BookmarkCheck size={14} />
            <span>Kannada Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'milestones' ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === 'milestones' ? '#4f46e5' : 'var(--theme-text-muted, #64748b)',
              fontWeight: activeTab === 'milestones' ? 700 : 500,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <Award size={14} />
            <span>Progress</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', scrollbarWidth: 'thin', background: 'var(--theme-canvas-bg)' }}>
          {/* TAB 1: DIAGNOSTIC & CURRENT VERSE STATUS */}
          {activeTab === 'diagnostic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Primary Diagnostic Banner */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        diagnostic.statusType === 'success'
                          ? '#10b981'
                          : diagnostic.statusType === 'amber'
                            ? '#f59e0b'
                            : '#3b82f6'
                    }}
                  />
                  <b style={{ fontSize: '0.875rem', color: 'var(--theme-text, #0f172a)' }}>{diagnostic.title}</b>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-text-muted, #475569)', lineHeight: 1.55 }}>
                  {diagnostic.summary}
                </p>
              </div>

              {/* What Happens Next Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <ChevronRight size={15} color="#2563eb" />
                  <b style={{ fontSize: '0.8125rem', color: '#2563eb' }}>WHAT HAPPENS NEXT</b>
                </div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-text, #1e3a8a)', lineHeight: 1.5 }}>
                  {diagnostic.nextStep}
                </p>
              </div>

              {/* Team Discipline Confirmation Status Table */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)'
                }}
              >
                <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text, #0f172a)', display: 'block', marginBottom: '0.75rem' }}>
                  DISCIPLINE CONFIRMATION STATUS
                </b>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { label: 'Technical Review', status: approvals.tech },
                    { label: 'Style & Language Review', status: approvals.style },
                    { label: 'Orthographic Review', status: approvals.ortho },
                    { label: 'Theological Review', status: approvals.theo },
                    { label: 'Committee Consensus', status: approvals.comm }
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        background: row.status.isFullyApproved ? 'rgba(16, 185, 129, 0.12)' : 'var(--theme-box-bg, #fafafa)',
                        border: `1px solid ${row.status.isFullyApproved ? '#86efac' : 'var(--theme-border, #f1f5f9)'}`
                      }}
                    >
                      {/* Top line: Role label on left, Status badge on right */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text, #1e293b)' }}>{row.label}</span>
                        {row.status.isFullyApproved ? (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#dcfce7',
                              color: '#166534'
                            }}
                          >
                            ✓ Confirmed
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e'
                            }}
                          >
                            ⏳ In Progress
                          </span>
                        )}
                      </div>

                      {/* Bottom line: Committee / reviewer names placed BELOW their roles */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.1rem' }}>
                        {row.status.approvedMembers && row.status.approvedMembers.map((m) => (
                          <span
                            key={m}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#dcfce7',
                              color: '#166534'
                            }}
                          >
                            {m} ✓
                          </span>
                        ))}
                        {row.status.pendingMembers && row.status.pendingMembers.map((m) => (
                          <span
                            key={m}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e'
                            }}
                          >
                            {m} ⏳
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GREEK LEXICON & KJV TOOLS */}
          {activeTab === 'lexicon' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Reference Version Selector Dropdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: 'var(--theme-card-bg, #f1f5f9)',
                  border: '1px solid var(--theme-border, #e2e8f0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={15} color="#2563eb" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text, #1e293b)' }}>
                    Reference Version:
                  </span>
                </div>
                <select
                  value={referenceVersion}
                  onChange={(e) => setReferenceVersion(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border, #cbd5e1)',
                    background: 'var(--theme-input-bg, #ffffff)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--theme-text, #0f172a)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="kjv">KJV (King James Version - Canonical)</option>
                </select>
              </div>

              {/* Search filter option at the top */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={15}
                  color="var(--theme-text-muted, #94a3b8)"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Filter Greek lemma, Strong's, English gloss..."
                  value={lexiconSearch}
                  onChange={(e) => setLexiconSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--theme-border, #cbd5e1)',
                    background: 'var(--theme-input-bg, #ffffff)',
                    color: 'var(--theme-text, #0f172a)',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Old Kannada Reading Text Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <b style={{ fontSize: '0.75rem', color: '#2563eb', letterSpacing: '0.04em' }}>
                    OLD KANNADA READING
                  </b>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #64748b)' }}>
                    {currentBook} {verse.chapter}:{verse.verseNumber}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontFamily: 'var(--font-kannada, "Noto Sans Kannada", sans-serif)',
                    color: 'var(--theme-text, #0f172a)',
                    lineHeight: 1.65
                  }}
                >
                  {verse.oldReading || 'Old Kannada Reading not loaded in sheet.'}
                </p>
              </div>

              {/* 1. Drafter's Kannada-English back-translation */}
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.625rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  1. Drafter's Kannada-English back-translation
                </span>
                {filteredWordPairs.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {filteredWordPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '0.375rem',
                          background: 'var(--theme-box-bg, #f8fafc)',
                          border: '1px solid var(--theme-border, #e2e8f0)',
                          minWidth: '70px'
                        }}
                      >
                        {pair.kannadaHtml ? (
                          <span
                            lang="kn"
                            style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}
                            dangerouslySetInnerHTML={{ __html: pair.kannadaHtml }}
                          />
                        ) : (
                          <span lang="kn" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--theme-text, #0f172a)' }}>
                            {pair.kannada}
                          </span>
                        )}
                        {pair.englishHtml ? (
                          <span
                            style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #475569)', fontStyle: 'italic', marginTop: '0.15rem' }}
                            dangerouslySetInnerHTML={{ __html: pair.englishHtml }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted, #475569)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                            {pair.english}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #94a3b8)', fontStyle: 'italic', padding: '0.4rem 0' }}>
                    {verse.isReferenceOnly
                      ? `Drafter back-translation notes will appear here once translation begins for ${currentBook}.`
                      : 'No drafter back-translation pairs recorded for this verse.'}
                  </div>
                )}
              </div>

              {/* 2. GREEK LEMMAS IN KJV SENTENCE FLOW */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text, #475569)' }}>
                    2. GREEK LEMMAS IN KJV SENTENCE FLOW ({filteredKjvWords.length} words):
                  </span>
                  {loadingGreek && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--theme-text-muted, #64748b)' }}>
                      <Loader2 size={12} className="spin" /> Loading Greek...
                    </span>
                  )}
                </div>

                {filteredKjvWords.length > 0 ? (
                  filteredKjvWords.map((word: KjvPhraseWord, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: 'var(--theme-card-bg, #ffffff)',
                        border: '1px solid var(--theme-border, #e2e8f0)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.9375rem',
                              fontWeight: 700,
                              color: 'var(--theme-text, #0f172a)'
                            }}
                          >
                            {word.text}
                          </span>
                          {word.lemma && (
                            <span
                              style={{
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                fontFamily: 'Georgia, serif',
                                color: '#4f46e5'
                              }}
                            >
                              {word.lemma}
                            </span>
                          )}
                          {word.translit && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)', fontStyle: 'italic' }}>
                              ({word.translit})
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '0.25rem'
                            }}
                          >
                            #{idx + 1} in KJV flow
                          </span>
                          {word.strongs && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                color: '#4338ca',
                                backgroundColor: '#e0e7ff',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '0.25rem'
                              }}
                            >
                              {word.strongs}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Definition */}
                      {word.definition ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--theme-text, #475569)', lineHeight: 1.45, marginTop: '0.2rem' }}>
                          <b style={{ color: 'var(--theme-text-muted, #64748b)', fontSize: '0.6875rem' }}>Definition: </b>
                          <span>{word.definition}</span>
                        </div>
                      ) : null}

                      {/* KJV Gloss / Renderings */}
                      {word.kjvGloss ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--theme-text, #0f172a)', marginTop: '0.2rem' }}>
                          <b style={{ color: 'var(--theme-text-muted, #64748b)', fontSize: '0.6875rem' }}>KJV Renderings: </b>
                          <span style={{ fontWeight: 600, color: 'var(--theme-text, #1e293b)' }}>{word.kjvGloss}</span>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--theme-text-muted, #94a3b8)', fontSize: '0.875rem' }}>
                    {lexiconSearch ? `No Greek words match "${lexiconSearch}".` : 'No Greek words loaded.'}
                  </div>
                )}
              </div>

              {/* 3. Translational Guidance (advisory box) */}
              <div
                style={{
                  padding: '0.75rem 0.875rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.75rem',
                  color: '#166534',
                  lineHeight: 1.5,
                  marginTop: '0.25rem'
                }}
              >
                <b>3. Translational Guidance:</b> Kannada lexical suggestions and interlinear aids are provided to reduce translational burden; final review and doctrinal rendering rest with the translation committee.
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL KANNADA COLOR RULES (Clean without header/TBS boxes as requested) */}
          {activeTab === 'guidance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {OFFICIAL_COLOR_RULES.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 0.875rem',
                    borderRadius: '0.5rem',
                    backgroundColor: rule.bg,
                    border: `1px solid ${rule.border}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <b style={{ fontSize: '0.8125rem', color: rule.color }}>{rule.name}</b>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: rule.color }}>{rule.meaning}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: rule.color, lineHeight: 1.45, opacity: 0.95 }}>
                    "{rule.desc}"
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: CHAPTER MILESTONES & REAL DYNAMIC APPRECIATIONS */}
          {activeTab === 'milestones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Chapter Milestone Card */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  background: 'var(--theme-card-bg, #ffffff)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <b style={{ fontSize: '0.9375rem', color: 'var(--theme-text, #0f172a)' }}>
                    {currentBook} Chapter {verse.chapter} Milestone
                  </b>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#4f46e5' }}>{chapterPercent}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    width: '100%',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--theme-box-bg, #e2e8f0)',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div
                    style={{
                      width: `${chapterPercent}%`,
                      height: '100%',
                      backgroundColor: '#4f46e5',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)' }}>
                  {chapterCompleted} of {chapterTotal} verses finalized and published.
                </span>
              </div>

              {/* Pipeline Queues Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.625rem'
                }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', color: '#1d4ed8', fontWeight: 600, display: 'block' }}>
                    AWAITING COMMITTEE
                  </span>
                  <b style={{ fontSize: '1.25rem', color: '#1e40af' }}>{awaitingCommitteeCount}</b>
                  <span style={{ fontSize: '0.6875rem', color: '#3b82f6', display: 'block' }}>verses ready</span>
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#fdf2f8',
                    border: '1px solid #fbcfe8'
                  }}
                >
                  <span style={{ fontSize: '0.6875rem', color: '#be185d', fontWeight: 600, display: 'block' }}>
                    AWAITING FINAL
                  </span>
                  <b style={{ fontSize: '1.25rem', color: '#9d174d' }}>{awaitingFinalCount}</b>
                  <span style={{ fontSize: '0.6875rem', color: '#ec4899', display: 'block' }}>verses ready</span>
                </div>
              </div>

              {/* Team Appreciations & Momentum with Real Dynamic Numbers */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.625rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Award size={18} color="#15803d" />
                  <b style={{ fontSize: '0.8125rem', color: '#166534' }}>TEAM MOMENTUM APPRECIATIONS</b>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#14532d', lineHeight: 1.55 }}>
                  {dynamicAppreciation}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
