import React, { useState, useMemo } from 'react';
import {
  Eye,
  BarChart3,
  Sliders,
  Menu,
  X,
  BookOpen,
  HelpCircle,
  Palette,
  Sparkles,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { ActiveTab, BgTheme } from '../types';
import type { TeamMember } from '../types';
import { getSmartInitials, getRoleAvatarColor } from '../utils/userUtils';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingCount: number;
  currentBook: string;
  currentUser?: TeamMember;
  team?: TeamMember[];
  completedVerses?: number;
  totalVerses?: number;
  bgTheme: BgTheme;
  onSelectBgTheme?: (theme: BgTheme) => void;
  onOpenBookModal: () => void;
  onOpenHelp: () => void;
  onOpenAssistant?: () => void;
  onToggleFloatingProgress?: () => void;
  onOpenTeamModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  currentBook,
  currentUser,
  team = [],
  completedVerses = 0,
  totalVerses = 0,
  bgTheme,
  onSelectBgTheme,
  onOpenBookModal,
  onOpenHelp,
  onOpenAssistant,
  onToggleFloatingProgress,
  onOpenTeamModal
}) => {
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [reviewersExpanded, setReviewersExpanded] = useState(true);
  const [committeeExpanded, setCommitteeExpanded] = useState(true);

  const themeOptions: { id: BgTheme; label: string; swatch: string }[] = [
    { id: 'default', label: 'Default Slate', swatch: '#f8fafc' },
    { id: 'sepia', label: 'Warm Sepia', swatch: '#f6eee3' },
    { id: 'mist', label: 'Cool Mist', swatch: '#edf2f7' },
    { id: 'obsidian', label: 'Night Obsidian', swatch: '#020617' }
  ];

  // Group team members into Reviewers and Committee
  const reviewers = useMemo(() => {
    return team.filter((m) => {
      const r = (m.role || '').toLowerCase();
      return r.includes('review') || r.includes('tech') || r.includes('style') || r.includes('ortho') || r.includes('theo');
    });
  }, [team]);

  const committee = useMemo(() => {
    return team.filter((m) => {
      const r = (m.role || '').toLowerCase();
      return r.includes('comm');
    });
  }, [team]);

  const percentComplete = totalVerses > 0 ? Math.round((completedVerses / totalVerses) * 100) : 0;

  return (
    <>
      {/* ── Fixed Mobile Bottom Navigation Bar (Thumb Zone) ── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'none', // Shown only via mobile.css media query
          height: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          borderTop: '1px solid var(--theme-border, #e2e8f0)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: '3.5rem', width: '100%' }}>
          {/* 1. Focus Mode Tab */}
          <button
            type="button"
            onClick={() => onTabChange('focus')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'focus' ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text-muted, #64748b)',
              position: 'relative'
            }}
          >
            <Eye size={18} strokeWidth={activeTab === 'focus' ? 2.4 : 1.8} />
            <span style={{ fontSize: '0.6875rem', fontWeight: activeTab === 'focus' ? 700 : 500 }}>
              Focus
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: 'calc(50% - 16px)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: '1.5px solid var(--theme-card-bg, #ffffff)'
                }}
              />
            )}
          </button>

          {/* 2. Analytics Tab */}
          <button
            type="button"
            onClick={() => onTabChange('analytics')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'analytics' ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text-muted, #64748b)'
            }}
          >
            <BarChart3 size={18} strokeWidth={activeTab === 'analytics' ? 2.4 : 1.8} />
            <span style={{ fontSize: '0.6875rem', fontWeight: activeTab === 'analytics' ? 700 : 500 }}>
              Analytics
            </span>
          </button>

          {/* 3. Settings Hub Tab */}
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'settings' ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text-muted, #64748b)'
            }}
          >
            <Sliders size={18} strokeWidth={activeTab === 'settings' ? 2.4 : 1.8} />
            <span style={{ fontSize: '0.6875rem', fontWeight: activeTab === 'settings' ? 700 : 500 }}>
              Settings
            </span>
          </button>

          {/* 4. Slide-Up More Menu */}
          <button
            type="button"
            onClick={() => setShowMenuSheet(true)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: showMenuSheet ? 'var(--theme-accent, #2563eb)' : 'var(--theme-text-muted, #64748b)'
            }}
          >
            <Menu size={18} strokeWidth={1.8} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 500 }}>Menu</span>
          </button>
        </div>
      </nav>

      {/* ── Slide-Up Mobile Quick Menu Sheet ── */}
      {showMenuSheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => setShowMenuSheet(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--theme-card-bg, #ffffff)',
              borderTop: '1px solid var(--theme-border, #e2e8f0)',
              borderRadius: '1.25rem 1.25rem 0 0',
              padding: '1.25rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px)) 1.25rem',
              boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.25)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div
              style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'var(--theme-border, #cbd5e1)',
                margin: '0 auto 1rem auto'
              }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--theme-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '0.375rem', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                    GLBC Translation Hub
                  </h4>
                  {currentUser && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                      {currentUser.name} · <strong style={{ color: '#2563eb' }}>{currentUser.role}</strong>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuSheet(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* ── 1. YOUR TEAM DIRECTORY (Mirroring Desktop Left Sidebar) ── */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={14} color="var(--theme-text-muted)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-text-muted)', letterSpacing: '0.05em' }}>
                    YOUR TEAM ({team.length} members)
                  </span>
                </div>
                {onOpenTeamModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuSheet(false);
                      onOpenTeamModal();
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ⚙ Manage
                  </button>
                )}
              </div>

              {/* Reviewers Group */}
              <div style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewersExpanded((v) => !v)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.5rem',
                    background: 'var(--theme-box-bg, #f8fafc)',
                    border: '1px solid var(--theme-border, #e2e8f0)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--theme-text)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {reviewersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>REVIEWERS</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                    {reviewers.length}
                  </span>
                </button>

                {reviewersExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.35rem', paddingLeft: '0.5rem' }}>
                    {reviewers.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'var(--theme-card-bg, #ffffff)',
                          border: '1px solid var(--theme-border, #e2e8f0)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: getRoleAvatarColor(m.role),
                              color: '#ffffff',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {getSmartInitials(m.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-text)' }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>
                              {m.role}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: m.active ? '#10b981' : '#94a3b8'
                          }}
                          title={m.active ? 'Active' : 'Inactive'}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Committee Group */}
              <div>
                <button
                  type="button"
                  onClick={() => setCommitteeExpanded((v) => !v)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.5rem',
                    background: 'var(--theme-box-bg, #f8fafc)',
                    border: '1px solid var(--theme-border, #e2e8f0)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--theme-text)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {committeeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>COMMITTEE</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                    {committee.length}
                  </span>
                </button>

                {committeeExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.35rem', paddingLeft: '0.5rem' }}>
                    {committee.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'var(--theme-card-bg, #ffffff)',
                          border: '1px solid var(--theme-border, #e2e8f0)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#f59e0b',
                              color: '#ffffff',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {getSmartInitials(m.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-text)' }}>
                              {m.name}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>
                              Committee
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: m.active ? '#10b981' : '#94a3b8'
                          }}
                          title={m.active ? 'Active' : 'Inactive'}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── 2. BOOK & OVERALL PROGRESS (Mirroring Desktop Left Sidebar) ── */}
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--theme-box-bg, #f8fafc)', borderRadius: '0.5rem', border: '1px solid var(--theme-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BookOpen size={15} color="#2563eb" />
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--theme-text)', textTransform: 'uppercase' }}>
                    {currentBook}
                  </strong>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                  {percentComplete}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--theme-border, #cbd5e1)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ width: `${percentComplete}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                <span>{completedVerses} of {totalVerses} verses done</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuSheet(false);
                    onOpenBookModal();
                  }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Switch Book →
                </button>
              </div>
            </div>

            {/* ── 3. THEME PICKER (Mirroring Desktop Left Sidebar Theme Dots) ── */}
            {onSelectBgTheme && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Palette size={14} color="var(--theme-text-muted)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase' }}>
                    THEME PALETTE
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectBgTheme(opt.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.45rem 0.25rem',
                        borderRadius: '0.375rem',
                        backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                        border: bgTheme === opt.id ? '2px solid #2563eb' : '1px solid var(--theme-border, #e2e8f0)',
                        cursor: 'pointer'
                      }}
                    >
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: opt.swatch,
                          border: '1px solid #cbd5e1'
                        }}
                      />
                      <span style={{ fontSize: '0.625rem', fontWeight: bgTheme === opt.id ? 700 : 500, color: 'var(--theme-text)' }}>
                        {opt.label.split(' ')[1] || opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {onOpenAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuSheet(false);
                    onOpenAssistant();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                    border: '1px solid var(--theme-border, #e2e8f0)',
                    color: 'var(--theme-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={16} color="#9333ea" />
                  <span>Open Smart Translation Assistant</span>
                </button>
              )}

              {onToggleFloatingProgress && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuSheet(false);
                    onToggleFloatingProgress();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                    border: '1px solid var(--theme-border, #e2e8f0)',
                    color: 'var(--theme-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <TrendingUp size={16} color="#059669" />
                  <span>Toggle Live Book Progress Bar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenuSheet(false);
                  onOpenHelp();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--theme-box-bg, #f8fafc)',
                  border: '1px solid var(--theme-border, #e2e8f0)',
                  color: 'var(--theme-text)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={16} color="#6366f1" />
                <span>Translation Rules &amp; Color Guidelines</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
