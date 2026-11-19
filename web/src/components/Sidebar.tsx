import React, { useState, useMemo, useEffect } from 'react';
import {
  Eye,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Sliders,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Shield
} from 'lucide-react';
import type { TeamMember, BgTheme } from '../types';
import { getSmartInitials, getRoleAvatarColor } from '../utils/userUtils';
import { useAuth } from '../contexts/AuthContext';

export type ActiveTab = 'focus' | 'committee' | 'final' | 'drafter' | 'analytics' | 'settings' | 'security';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingQueueCount?: number;
  committeePendingCount?: number;
  finalPendingCount?: number;
  team: TeamMember[];
  currentUser?: TeamMember;
  currentBook: string;
  completedVerses: number;
  totalVerses: number;
  onOpenHelp: () => void;
  onOpenTeamModal?: () => void;
  onToggleFloatingProgress?: () => void;
  bgTheme?: BgTheme;
  onSelectBgTheme?: (theme: BgTheme) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const THEME_OPTIONS: { id: BgTheme; label: string; swatchBg: string; swatchBorder: string }[] = [
  { id: 'default', label: 'Obsidian Tela', swatchBg: 'linear-gradient(135deg, #0d0e11 0%, #16171c 50%, #0091ff 100%)', swatchBorder: '#0091ff' },
  { id: 'sepia', label: 'Obsidian Wasp', swatchBg: 'linear-gradient(135deg, #f8c537, #d4922a)', swatchBorder: '#b87a1d' },
  { id: 'mist', label: 'Blue Topaz', swatchBg: 'linear-gradient(135deg, #181c28 0%, #202636 50%, #4da6ff 100%)', swatchBorder: '#4da6ff' },
  { id: 'obsidian', label: 'Obsidian Nebula', swatchBg: 'linear-gradient(135deg, #0b1018, #070b12)', swatchBorder: '#38bdf8' }
];

interface GroupedMember {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  avatarColor?: string;
  roles: string[];
  roleDisplay: string;
  isReviewer: boolean;
  isCommittee: boolean;
  isDrafter: boolean;
  isFinal: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingQueueCount: _pendingQueueCount = 0,
  committeePendingCount: _committeePendingCount = 0,
  finalPendingCount: _finalPendingCount = 0,
  team,
  currentUser,
  currentBook,
  completedVerses,
  totalVerses,
  onOpenHelp,
  onOpenTeamModal,
  onToggleFloatingProgress,
  bgTheme = 'default',
  onSelectBgTheme,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { hasAdminAccess, canView } = useAuth();
  const percent = totalVerses > 0 ? Math.round((completedVerses / totalVerses) * 100) : 0;

  // Deduplicate and group members by unique person with combined roles
  const groupedMembers = useMemo<GroupedMember[]>(() => {
    const map = new Map<string, {
      name: string;
      email: string;
      phone: string;
      avatar?: string;
      avatarColor?: string;
      roles: Set<string>;
    }>();

    team.forEach((m) => {
      const key = (m.email && m.email.trim()) ? m.email.toLowerCase().trim() : m.name.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          name: m.name,
          email: m.email,
          phone: m.phone,
          avatar: m.avatar,
          avatarColor: m.avatarColor,
          roles: new Set(m.roles && m.roles.length > 0 ? m.roles : (m.role ? [m.role] : []))
        });
      } else {
        const existing = map.get(key)!;
        if (m.role) existing.roles.add(m.role);
        if (m.roles) m.roles.forEach((r) => existing.roles.add(r));
      }
    });

    return Array.from(map.values()).map((item) => {
      const rolesArray = Array.from(item.roles);
      const isReviewer = rolesArray.some((r) => {
        const lr = r.toLowerCase();
        return lr.includes('tech') || lr.includes('style') || lr.includes('ortho') || lr.includes('theo') || lr.includes('review');
      });
      const isCommittee = rolesArray.some((r) => r.toLowerCase().includes('comm'));
      const isDrafter = rolesArray.some((r) => r.toLowerCase().includes('draft'));
      const isFinal = rolesArray.some((r) => r.toLowerCase().includes('final'));

      const roleDisplay = rolesArray
        .map((r) => r.replace(/ Reviewer/i, '').trim())
        .join(' · ');

      return {
        name: item.name,
        email: item.email,
        phone: item.phone,
        avatar: item.avatar,
        avatarColor: item.avatarColor,
        roles: rolesArray,
        roleDisplay,
        isReviewer,
        isCommittee,
        isDrafter,
        isFinal
      };
    });
  }, [team]);

  // Categorized team lists
  const reviewers = useMemo(() => groupedMembers.filter((m) => m.isReviewer), [groupedMembers]);
  const committee = useMemo(() => groupedMembers.filter((m) => m.isCommittee), [groupedMembers]);
  const drafters = useMemo(() => groupedMembers.filter((m) => m.isDrafter), [groupedMembers]);
  const finalEditors = useMemo(() => groupedMembers.filter((m) => m.isFinal), [groupedMembers]);

  // Collapsible category states
  const [expandedGroups, setExpandedGroups] = useState<{
    reviewers: boolean;
    committee: boolean;
    drafters: boolean;
    finalEditors: boolean;
  }>({
    reviewers: false,
    committee: false,
    drafters: false,
    finalEditors: false
  });

  // Smart Adaptive Auto-Expansion:
  // User's OWN team group is automatically expanded based on their active role or active workspace tab!
  useEffect(() => {
    const roleLower = (currentUser?.role || '').toLowerCase();
    const isRev = (activeTab === 'focus' && (roleLower.includes('tech') || roleLower.includes('style') || roleLower.includes('ortho') || roleLower.includes('theo') || roleLower.includes('review')));
    const isComm = activeTab === 'committee' || roleLower.includes('comm');
    const isDraft = activeTab === 'drafter' || roleLower.includes('draft');
    const isFin = activeTab === 'final' || roleLower.includes('final');

    setExpandedGroups({
      reviewers: isRev,
      committee: isComm,
      drafters: isDraft,
      finalEditors: isFin
    });
  }, [currentUser?.role, activeTab]);

  const toggleGroup = (key: 'reviewers' | 'committee' | 'drafters' | 'finalEditors') => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderTeamSection = (
    key: 'reviewers' | 'committee' | 'drafters' | 'finalEditors',
    title: string,
    members: GroupedMember[]
  ) => {
    if (members.length === 0) return null;
    const isExpanded = expandedGroups[key];

    return (
      <div key={key} style={{ marginBottom: '0.4rem' }}>
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          className="team-accordion-header"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.3rem 0.5rem',
            background: 'none',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--theme-text-muted)',
            transition: 'background-color 0.15s ease'
          }}
          title={`Click to ${isExpanded ? 'collapse' : 'expand'} ${title}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isExpanded ? <ChevronDown size={14} color="var(--theme-text-muted)" /> : <ChevronRight size={14} color="var(--theme-text-muted)" />}
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.05em', color: isExpanded ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}>
              {title}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: isExpanded ? 'rgba(37, 99, 235, 0.15)' : 'var(--theme-box-bg)',
              color: isExpanded ? '#2563eb' : 'var(--theme-text-muted)',
              border: '1px solid var(--theme-border)'
            }}
          >
            {members.length}
          </span>
        </button>

        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', paddingLeft: '0.35rem' }}>
            {members.map((member) => (
              <div key={member.email || member.name} className="team-person">
                <span className={`avatar small ${member.avatarColor || getRoleAvatarColor(member.roleDisplay)}`}>
                  {member.avatar || getSmartInitials(member.name)}
                </span>
                <span style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <b style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.name}</b>
                  <small
                    title={member.roleDisplay}
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      display: 'block'
                    }}
                  >
                    {member.roleDisplay}
                  </small>
                </span>
                <span className="presence" title="Active"></span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Scrollable upper section: Navigation & Team */}
      <div className="sidebar-scrollable">
        {/* Sidebar Header with Collapse Button */}
        <div
          className="sidebar-header-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0.25rem 0' : '0.25rem 0.625rem',
            borderBottom: '1px solid var(--theme-border)',
            marginBottom: '0.4rem'
          }}
        >
          {!isCollapsed && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--theme-text-muted)' }}>
              NAVIGATION
            </span>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="btn-sidebar-collapse"
              title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                background: 'var(--theme-box-bg)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.375rem',
                padding: '0.3rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--theme-text)',
                transition: 'all 0.15s ease'
              }}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
        </div>

        {canView('focus') && (
          <>
            {!isCollapsed && <div className="side-section-label">WORKSPACE</div>}
            <button
              className={`nav-item ${activeTab === 'focus' ? 'selected' : ''}`}
              onClick={() => onTabChange('focus')}
              title="Unified verse workspace for Reviewers, Committee & Final Editor (F)"
            >
              <Eye size={18} />
              {!isCollapsed && <span>Focus mode</span>}
              {!isCollapsed && <span className="nav-shortcut">F</span>}
            </button>
          </>
        )}

        {(canView('analytics') || canView('settings') || hasAdminAccess) && (
          <>
            {!isCollapsed && <div className="side-section-label" style={{ marginTop: '0.75rem' }}>MANAGEMENT</div>}

            {canView('analytics') && (
              <button
                className={`nav-item ${activeTab === 'analytics' ? 'selected' : ''}`}
                onClick={() => onTabChange('analytics')}
                title="Stage funnels, burn-down velocity, and WhatsApp nudges"
              >
                <BarChart3 size={18} />
                {!isCollapsed && <span>Coordinator analytics</span>}
              </button>
            )}

            {canView('settings') && (
              <button
                className={`nav-item ${activeTab === 'settings' ? 'selected' : ''}`}
                onClick={() => onTabChange('settings')}
                title="Consolidated team directory, Google Sheets controls, drafter intake, and reports"
              >
                <Sliders size={18} />
                {!isCollapsed && <span>Settings</span>}
              </button>
            )}

            {hasAdminAccess && (
              <button
                className={`nav-item ${activeTab === 'security' ? 'selected' : ''}`}
                onClick={() => onTabChange('security')}
                title="Granular RBAC matrix, permission toggles, and security governance"
                style={{
                  borderLeft: activeTab === 'security' ? '3px solid #7c3aed' : undefined
                }}
              >
                <Shield size={18} color={activeTab === 'security' ? '#7c3aed' : undefined} />
                {!isCollapsed && <span>Security & Permissions</span>}
                {!isCollapsed && (
                  <span
                    style={{
                      fontSize: '0.5625rem',
                      fontWeight: 800,
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      marginLeft: 'auto'
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </button>
            )}
          </>
        )}

        <div className="side-separator"></div>

        {/* Grouped Team Header or Collapsed Team Avatars */}
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--theme-text-muted)', letterSpacing: '0.05em' }}>
              TEAM
            </span>
            {groupedMembers.slice(0, 5).map((m) => (
              <span
                key={m.email || m.name}
                className={`avatar small ${m.avatarColor || getRoleAvatarColor(m.roleDisplay)}`}
                title={`${m.name} (${m.roleDisplay})`}
                style={{ width: '1.9rem', height: '1.9rem', fontSize: '0.6875rem', cursor: 'default' }}
              >
                {m.avatar || getSmartInitials(m.name)}
              </span>
            ))}
            {groupedMembers.length > 5 && (
              <span
                style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--theme-text-muted)' }}
                title={`${groupedMembers.length - 5} more team members`}
              >
                +{groupedMembers.length - 5}
              </span>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.625rem 0.125rem' }}>
              <div className="side-section-label" style={{ padding: 0 }}>YOUR TEAM</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600 }}>
                  {groupedMembers.length} members
                </span>
                {onOpenTeamModal && (
                  <button
                    type="button"
                    onClick={onOpenTeamModal}
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '1px 4px',
                      borderRadius: '3px'
                    }}
                    title="Manage Team Directory & Column Access in ⚙ Config"
                  >
                    ⚙ Manage
                  </button>
                )}
              </div>
            </div>

            {/* Grouped Collapsible Team Categories */}
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column' }}>
              {renderTeamSection('reviewers', 'REVIEWERS', reviewers)}
              {renderTeamSection('committee', 'COMMITTEE', committee)}
              {renderTeamSection('drafters', 'DRAFTERS', drafters)}
              {renderTeamSection('finalEditors', 'FINAL EDITORS', finalEditors)}
            </div>
          </>
        )}
      </div>

      {/* Pinned Sticky Bottom Block: Compact 1-Line Book Progress & Help */}
      <div className="sidebar-sticky-block">
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={onToggleFloatingProgress}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                padding: 0
              }}
              title={`${currentBook}: ${percent}% complete`}
            >
              <BookOpen size={16} color="#60a5fa" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!onSelectBgTheme) return;
                const themes: BgTheme[] = ['default', 'sepia', 'mist', 'obsidian'];
                const nextIdx = (themes.indexOf(bgTheme) + 1) % themes.length;
                onSelectBgTheme(themes[nextIdx]);
              }}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--theme-box-bg)',
                border: '1px solid var(--theme-border)',
                cursor: 'pointer',
                color: 'var(--theme-text)'
              }}
              title={`Active Theme: ${bgTheme}. Click to cycle theme.`}
            >
              <Palette size={16} />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleFloatingProgress}
              className="sidebar-compact-progress"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '0.625rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                textAlign: 'left',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
              title="Click to view floating book progress toast"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                <BookOpen size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <b style={{ fontSize: '0.75rem', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentBook.toUpperCase()}
                    </b>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#34d399' }}>{percent}%</span>
                  </div>
                  <div className="cover-progress" style={{ height: '3px', marginTop: '3px', backgroundColor: '#334155' }}>
                    <span style={{ width: `${percent}%`, height: '100%', display: 'block', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '9999px' }}></span>
                  </div>
                </div>
              </div>
              <Sparkles size={13} color="#93c5fd" style={{ flexShrink: 0 }} />
            </button>

            {/* Background Theme Selector Bar */}
            <div
              className="sidebar-theme-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.65rem',
                marginTop: '0.45rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--color-theme-bar-bg, rgba(0, 0, 0, 0.03))',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Palette size={13} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Theme
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = (bgTheme || 'default') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectBgTheme && onSelectBgTheme(opt.id)}
                      title={`${opt.label}${isSelected ? ' (Active)' : ''}`}
                      aria-label={opt.label}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '9999px',
                        background: opt.swatchBg,
                        border: `1.5px solid ${opt.swatchBorder}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        boxShadow: isSelected ? `0 0 0 2px ${opt.id === 'sepia' ? '#f8c537' : opt.id === 'obsidian' ? '#38bdf8' : opt.id === 'mist' ? '#4da6ff' : '#0091ff'}` : '0 1px 2px rgba(0,0,0,0.06)',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '9999px',
                            backgroundColor: opt.id === 'obsidian' ? '#38bdf8' : opt.id === 'sepia' ? '#191919' : opt.id === 'mist' ? '#4da6ff' : '#0091ff'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
