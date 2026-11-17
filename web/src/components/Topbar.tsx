import React from 'react';
import { BookOpen, HelpCircle, ChevronDown, Sparkles, Users } from 'lucide-react';
import type { TeamMember } from '../types';
import { getBookTotalVerses } from '../services/kjvService';
import { getSmartInitials, getRoleAvatarColor } from '../utils/userUtils';

interface TopbarProps {
  currentBook: string;
  books: string[];
  onSelectBook: (book: string) => void;
  onOpenBookModal?: () => void;
  currentUser: TeamMember;
  team: TeamMember[];
  onSelectUser: (user: TeamMember) => void;
  onOpenHelp: () => void;
  onOpenAssistant?: () => void;
  isLiveConnected: boolean;
  onOpenConnection: () => void;
  onOpenTeamModal?: () => void;
  onOpenSettings?: (subtab?: 'team' | 'books' | 'drafter' | 'connection') => void;
  totalVerses?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentBook,
  books: _books,
  onSelectBook: _onSelectBook,
  onOpenBookModal,
  currentUser,
  team,
  onSelectUser,
  onOpenHelp,
  onOpenAssistant,
  isLiveConnected,
  onOpenConnection,
  onOpenTeamModal,
  onOpenSettings: _onOpenSettings,
  totalVerses
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showUserDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserDropdown]);

  return (
    <header className="topbar">
      {/* Left: Brand with Centered Title & Interactive Live Sheet Connected Pill */}
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <a className="brand" href="#home" aria-label="GLBC Translation Hub home" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span className="brand-mark">
            <BookOpen size={20} />
          </span>
          <span className="brand-title" style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
            <strong style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>
              GLBC <em style={{ fontStyle: 'normal', color: '#60a5fa', fontWeight: 600, marginLeft: '0.2rem' }}>Translation Hub</em>
            </strong>
          </span>
        </a>

        {/* Live Sheet Connected Pill immediately to the right of Title */}
        <button
          onClick={onOpenConnection}
          className="btn-live-connection"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            border: `1px solid ${isLiveConnected ? '#065f46' : '#78350f'}`,
            backgroundColor: isLiveConnected ? '#064e3b' : '#451a03',
            color: isLiveConnected ? '#a7f3d0' : '#fde68a',
            fontSize: '0.6875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Google Sheet Connection Status (Click to configure)"
        >
          <span
            style={{
              width: '0.45rem',
              height: '0.45rem',
              borderRadius: '9999px',
              backgroundColor: isLiveConnected ? '#10b981' : '#f59e0b',
              boxShadow: isLiveConnected ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
            }}
          />
          <span>{isLiveConnected ? 'Live Sheet Connected' : 'Demo Mode (Click to Connect)'}</span>
        </button>
      </div>

      {/* Center: Book Select with Total Verses */}
      <div
        className="book-select topbar-center"
        onClick={() => {
          if (onOpenBookModal) onOpenBookModal();
        }}
        style={{
          cursor: onOpenBookModal ? 'pointer' : 'default',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#1e293b',
          padding: '0.35rem 0.85rem',
          borderRadius: '0.5rem',
          border: '1px solid #334155',
          color: '#e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.15s ease'
        }}
        title="Change Book or Chapter (Click to open picker)"
      >
        <BookOpen size={16} color="#38bdf8" />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff' }}>
          {currentBook}
        </span>
        <span className="book-count" style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: '#0f172a', padding: '0.125rem 0.45rem', borderRadius: '0.25rem' }}>
          {totalVerses || getBookTotalVerses(currentBook)} verses
        </span>
        <ChevronDown size={14} color="#94a3b8" />
      </div>

      {/* Right: Smart Assistant, Help, Profile */}
      <div className="topbar-right">
        {onOpenAssistant && (
          <button
            className="btn-assistant-trigger"
            onClick={onOpenAssistant}
            title="Open Smart Translation Coach & Greek Lexical Assistant"
            style={{ marginRight: '0.25rem' }}
          >
            <Sparkles size={13} color="#9333ea" />
            <span>Smart Assistant</span>
          </button>
        )}

        <button
          className="icon-button help-button"
          aria-label="Help"
          onClick={onOpenHelp}
          title="Shortcuts & Workflow Guide"
        >
          <HelpCircle size={18} />
        </button>

        <span className="top-divider"></span>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="profile"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            title="Switch Reviewer Persona"
          >
            <span className={`avatar ${currentUser.avatarColor || getRoleAvatarColor(currentUser.role)}`}>
              {currentUser.avatar || getSmartInitials(currentUser.name)}
            </span>
            <span className="profile-copy">
              <b>{currentUser.name}</b>
              <small>
                {currentUser.role}
                {currentUser.roles && currentUser.roles.length > 1 && (
                  <span style={{ marginLeft: '0.25rem', opacity: 0.8 }}>({currentUser.roles.length} roles)</span>
                )}
              </small>
            </span>
            <ChevronDown size={14} />
          </button>

          {showUserDropdown && (
            <div
              className="app-modal-card persona-dropdown-card"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                backgroundColor: 'var(--theme-card-bg)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                padding: '0.5rem',
                zIndex: 50,
                minWidth: '18rem',
                maxHeight: '80vh',
                overflowY: 'auto',
                color: 'var(--theme-text)'
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', padding: '0.25rem 0.5rem', letterSpacing: '0.05em' }}>
                SWITCH ACTIVE TEAM MEMBER
              </div>
              {team.map((member) => {
                const isSelectedPerson = member.email ? member.email === currentUser.email : member.name === currentUser.name;
                const assignedRoles = member.roles && member.roles.length > 0 ? member.roles : [member.role];

                return (
                  <div
                    key={member.email || member.name}
                    style={{
                      borderRadius: '0.375rem',
                      background: isSelectedPerson ? 'var(--theme-box-bg)' : 'transparent',
                      border: isSelectedPerson ? '1px solid var(--theme-border)' : '1px solid transparent',
                      padding: '0.4rem',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        onSelectUser(member);
                        setShowUserDropdown(false);
                      }}
                    >
                      <span className={`avatar small ${member.avatarColor || getRoleAvatarColor(assignedRoles[0] || member.role)}`}>
                        {member.avatar || getSmartInitials(member.name)}
                      </span>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>{member.name}</b>
                      </div>
                    </div>

                    {/* Role Badges: If person has multiple roles, click directly to act as that role */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem', paddingLeft: '2rem' }}>
                      {assignedRoles.map((r) => {
                        const isCurrentActive = isSelectedPerson && currentUser.role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectUser({ ...member, role: r });
                              setShowUserDropdown(false);
                            }}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              border: isCurrentActive ? '1px solid #3b82f6' : '1px solid var(--theme-border)',
                              backgroundColor: isCurrentActive ? 'rgba(59, 130, 246, 0.18)' : 'var(--theme-card-bg)',
                              color: isCurrentActive ? '#3b82f6' : 'var(--theme-text-muted)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title={`Act as ${r}`}
                          >
                            {isCurrentActive && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>}
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {onOpenTeamModal && (
                <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenTeamModal();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--theme-border)',
                      backgroundColor: 'var(--theme-box-bg)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#3b82f6',
                      cursor: 'pointer'
                    }}
                  >
                    <Users size={13} />
                    <span>Manage Team &amp; Roles</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
