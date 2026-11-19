import React, { useState, useMemo, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Check,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Info,
  Sliders,
  FileCheck
} from 'lucide-react';
import type {
  TeamMember,
  GovernedModule,
  AccessLevel,
  MemberPermissions,
  TeamPermissionsMap
} from '../types';
import { DEFAULT_MEMBER_PERMISSIONS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getSmartInitials, getRoleAvatarColor } from '../utils/userUtils';
import { showToast } from '../utils/toast';

interface SecurityConsoleProps {
  team: TeamMember[];
  currentUser: TeamMember | null;
  onNavigateToTab?: (tab: string) => void;
}

interface ModuleDef {
  key: GovernedModule;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

const GOVERNED_MODULES: ModuleDef[] = [
  {
    key: 'focus',
    label: 'Focus Mode Reviewing',
    shortLabel: 'Focus Mode',
    description: '4-Discipline Review, Drafter Notes, and Verse Confirmations',
    icon: '📖'
  },
  {
    key: 'committee',
    label: 'Committee Chamber',
    shortLabel: 'Committee',
    description: 'Consensus Deliberation and Committee Stage Confirmation',
    icon: '⚖️'
  },
  {
    key: 'final',
    label: 'Final Editor Sign-off',
    shortLabel: 'Final Editor',
    description: 'Final Kannada Text Sign-off and Chapter Locking',
    icon: '🖋️'
  },
  {
    key: 'analytics',
    label: 'Coordinator Analytics',
    shortLabel: 'Analytics',
    description: 'Stage Funnels, Velocity Burndown, and WhatsApp Alerts',
    icon: '📊'
  },
  {
    key: 'settings',
    label: 'Settings & Setup Tools',
    shortLabel: 'Settings',
    description: 'Book Initialization, Word Doc Import, and Sheet Protections',
    icon: '⚙️'
  },
  {
    key: 'admin',
    label: 'Security & Governance',
    shortLabel: 'Admin Control',
    description: 'Access to this Security Console to Govern App Permissions',
    icon: '🛡️'
  }
];

export const SecurityConsole: React.FC<SecurityConsoleProps> = ({
  team,
  currentUser,
  onNavigateToTab
}) => {
  const {
    authUser,
    isSuperAdmin,
    hasAdminAccess,
    permissions: globalPermissions,
    updatePermissions
  } = useAuth();

  const superAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'roshcrst@gmail.com').toLowerCase().trim();

  // Deduplicate team members by lowercase email (excluding Super Admin)
  const uniqueMembers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      email: string;
      phone: string;
      avatar?: string;
      avatarColor?: string;
      roles: Set<string>;
    }>();

    team.forEach((m) => {
      const email = (m.email || '').trim().toLowerCase();
      if (!email || email === superAdminEmail) return;
      if (!map.has(email)) {
        map.set(email, {
          name: m.name,
          email,
          phone: m.phone,
          avatar: m.avatar,
          avatarColor: m.avatarColor,
          roles: new Set(m.roles || [m.role])
        });
      } else {
        const existing = map.get(email)!;
        if (m.roles) m.roles.forEach((r) => existing.roles.add(r));
        else existing.roles.add(m.role);
      }
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      roles: Array.from(item.roles),
      roleDisplay: Array.from(item.roles).join(', ')
    }));
  }, [team, superAdminEmail]);

  // Working state for the permissions matrix
  const [localMap, setLocalMap] = useState<TeamPermissionsMap>(() => {
    return { ...globalPermissions };
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Detect dirty state (unsaved modifications)
  const isDirty = useMemo(() => {
    return JSON.stringify(localMap) !== JSON.stringify(globalPermissions);
  }, [localMap, globalPermissions]);

  // Helper to get permission for a member & module
  const getPerm = useCallback(
    (email: string, module: GovernedModule): AccessLevel => {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === superAdminEmail) return 'edit';
      const userPerms = localMap[cleanEmail];
      if (userPerms && userPerms[module]) return userPerms[module];
      return DEFAULT_MEMBER_PERMISSIONS[module];
    },
    [localMap, superAdminEmail]
  );

  // Toggle a member's permission for a module
  const handleSetPerm = useCallback(
    (email: string, module: GovernedModule, level: AccessLevel) => {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === superAdminEmail) {
        showToast('Super Admin permissions are permanently locked to full access.', 'info');
        return;
      }

      setLocalMap((prev) => {
        const currentMemberPerms: MemberPermissions = {
          ...(prev[cleanEmail] || DEFAULT_MEMBER_PERMISSIONS)
        };
        currentMemberPerms[module] = level;
        return {
          ...prev,
          [cleanEmail]: currentMemberPerms
        };
      });
      setSaveSuccess(false);
    },
    [superAdminEmail]
  );

  // Presets
  const applyPreset = useCallback(
    (preset: 'open' | 'roleStandard' | 'readOnlyLock') => {
      setLocalMap((prev) => {
        const next: TeamPermissionsMap = { ...prev };

        uniqueMembers.forEach((member) => {
          const email = member.email.toLowerCase().trim();
          if (email === superAdminEmail) return;

          if (preset === 'open') {
            next[email] = {
              focus: 'edit',
              committee: 'edit',
              final: 'edit',
              analytics: 'edit',
              settings: 'edit',
              admin: prev[email]?.admin === 'edit' ? 'edit' : 'none'
            };
          } else if (preset === 'readOnlyLock') {
            next[email] = {
              focus: 'read',
              committee: 'read',
              final: 'read',
              analytics: 'read',
              settings: 'read',
              admin: 'none'
            };
          } else if (preset === 'roleStandard') {
            const rolesLower = member.roles.map((r) => r.toLowerCase()).join(' ');
            const isReviewer = rolesLower.includes('review') || rolesLower.includes('draft');
            const isCommittee = rolesLower.includes('comm');
            const isFinalEditor = rolesLower.includes('final');

            next[email] = {
              focus: isReviewer ? 'edit' : 'read',
              committee: isCommittee ? 'edit' : 'read',
              final: isFinalEditor ? 'edit' : 'read',
              analytics: 'read',
              settings: 'read',
              admin: prev[email]?.admin === 'edit' ? 'edit' : 'none'
            };
          }
        });

        return next;
      });
      setSaveSuccess(false);
      showToast(`Preset "${preset}" applied to team matrix. Click "Save & Sync" to persist.`, 'info');
    },
    [uniqueMembers, superAdminEmail]
  );

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const ok = await updatePermissions(localMap);
      if (ok) {
        setSaveSuccess(true);
        showToast('Permissions synced to Google Apps Script successfully!', 'success');
      } else {
        showToast('Failed to sync permissions. Saved locally.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Error syncing permissions to backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Revert changes
  const handleReset = () => {
    setLocalMap({ ...globalPermissions });
    setSaveSuccess(false);
    showToast('Reverted unsaved changes to active backend permissions.', 'info');
  };

  return (
    <div className="security-console-container" style={{ width: '100%', margin: '0 auto', color: 'var(--theme-text)' }}>
      {/* Header Banner */}
      <div
        className="security-header-banner"
        style={{
          background: 'var(--theme-card-bg-elevated)',
          borderRadius: '0.75rem',
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--theme-border)',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--theme-card-shadow, 0 4px 12px rgba(0, 0, 0, 0.08))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)',
              flexShrink: 0
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                Security & Access Control Console
              </h1>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)'
                }}
              >
                RBAC Active
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
              Granular whole-app workspace permission matrix governing editing, deliberation, and app control.
            </p>
          </div>
        </div>

        {/* Admin Identity Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: 'var(--theme-box-bg)',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.625rem',
            border: '1px solid var(--theme-border)'
          }}
        >
          <div
            style={{
              width: '1.85rem',
              height: '1.85rem',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '0.6875rem',
              fontWeight: 800,
              flexShrink: 0
            }}
          >
            {getSmartInitials(authUser?.displayName || 'Admin')}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <b style={{ fontSize: '0.75rem', color: 'var(--theme-text)' }}>
                {authUser?.displayName || 'Super Admin'}
              </b>
              <span style={{ fontSize: '0.625rem', color: '#60a5fa', fontWeight: 700 }}>
                {isSuperAdmin ? '(Super Admin)' : '(Authorized Admin)'}
              </span>
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)' }}>
              {authUser?.email || superAdminEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Info Callout: Open by Default Philosophy & Admin Delegation */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '0.625rem',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <Info size={18} color="#3b82f6" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        <div style={{ fontSize: '0.75rem', color: 'var(--theme-text)', lineHeight: 1.45 }}>
          <b>Role-Based Access Governance:</b> By default, all team members enjoy open collaboration across scripture workspaces. Tailor access below:
          <span style={{ display: 'block', marginTop: '0.2rem', color: 'var(--theme-text-muted)' }}>
            • <b>Edit:</b> Write comments &amp; confirm stages &nbsp;|&nbsp;
            • <b>View:</b> Read-only scripture &amp; findings &nbsp;|&nbsp;
            • <b>None:</b> Hidden from navigation &nbsp;|&nbsp;
            • <b>Admin Control:</b> Grants this Security Console to delegate app governance.
          </span>
        </div>
      </div>

      {/* Quick Presets Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--theme-text-muted)', marginRight: '0.2rem' }}>
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('open')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Unlock size={12} color="#22c55e" />
            <span>Open Access (All Edit)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('roleStandard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={12} color="#3b82f6" />
            <span>Role Standard</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('readOnlyLock')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border)',
              backgroundColor: 'var(--theme-box-bg)',
              color: 'var(--theme-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Lock size={12} color="#eab308" />
            <span>Strict Read-Only Lock</span>
          </button>
        </div>

        {/* Member Count Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
          <Users size={13} />
          <span><b>{uniqueMembers.length}</b> team members</span>
        </div>
      </div>

      {/* Main Permissions Matrix Table */}
      <div
        style={{
          background: 'var(--theme-box-bg)',
          border: '1px solid var(--theme-border)',
          borderRadius: '0.625rem',
          overflowX: 'auto',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--theme-border)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
              <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--theme-text-muted)', minWidth: '170px' }}>
                Team Member
              </th>
              {GOVERNED_MODULES.map((mod) => (
                <th
                  key={mod.key}
                  style={{
                    padding: '0.65rem 0.4rem',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--theme-text-muted)',
                    textAlign: 'center',
                    minWidth: '96px'
                  }}
                  title={mod.description}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem' }}>{mod.icon}</span>
                    <span>{mod.shortLabel}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Unique Team Member Rows */}
            {uniqueMembers.map((member) => {
              const isMemberSuperAdmin = member.email === superAdminEmail;
              if (isMemberSuperAdmin) return null; // Super Admin is not a team roster member

              return (
                <tr
                  key={member.email}
                  style={{
                    borderBottom: '1px solid var(--theme-border)',
                    transition: 'background-color 0.15s ease'
                  }}
                  className="table-row-hover"
                >
                  {/* Member Bio */}
                  <td style={{ padding: '0.55rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className={`avatar small ${member.avatarColor || getRoleAvatarColor(member.roleDisplay)}`}
                        style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.625rem', flexShrink: 0 }}
                      >
                        {member.avatar || getSmartInitials(member.name)}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <b style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.name}
                          </b>
                          {getPerm(member.email, 'admin') === 'edit' && (
                            <span
                              style={{
                                fontSize: '0.5rem',
                                fontWeight: 800,
                                backgroundColor: '#7c3aed',
                                color: '#ffffff',
                                padding: '1px 3px',
                                borderRadius: '2px'
                              }}
                              title="Authorized Admin (can manage permissions and control app)"
                            >
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.625rem', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.email}
                        </div>
                        <div style={{ fontSize: '0.5625rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.roleDisplay}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3-State Controls for each module */}
                  {GOVERNED_MODULES.map((mod) => {
                    const currentLevel = getPerm(member.email, mod.key);

                    return (
                      <td key={mod.key} style={{ padding: '0.55rem 0.35rem', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            borderRadius: '0.3rem',
                            border: '1px solid var(--theme-border)',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(0, 0, 0, 0.08)'
                          }}
                        >
                          {/* Edit / Confirm Button */}
                          <button
                            type="button"
                            onClick={() => handleSetPerm(member.email, mod.key, 'edit')}
                            style={{
                              padding: '0.22rem 0.38rem',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: currentLevel === 'edit' ? '#16a34a' : 'transparent',
                              color: currentLevel === 'edit' ? '#ffffff' : 'var(--theme-text-muted)',
                              transition: 'all 0.12s ease'
                            }}
                            title={`Grant Edit & Confirm access to ${mod.shortLabel}`}
                          >
                            Edit
                          </button>

                          {/* Read Only Button (Not applicable to Admin module) */}
                          {mod.key !== 'admin' ? (
                            <button
                              type="button"
                              onClick={() => handleSetPerm(member.email, mod.key, 'read')}
                              style={{
                                padding: '0.22rem 0.38rem',
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                borderLeft: '1px solid var(--theme-border)',
                                borderRight: '1px solid var(--theme-border)',
                                borderTop: 'none',
                                borderBottom: 'none',
                                cursor: 'pointer',
                                backgroundColor: currentLevel === 'read' ? '#2563eb' : 'transparent',
                                color: currentLevel === 'read' ? '#ffffff' : 'var(--theme-text-muted)',
                                transition: 'all 0.12s ease'
                              }}
                              title={`Grant Read-Only observation access to ${mod.shortLabel}`}
                            >
                              View
                            </button>
                          ) : null}

                          {/* No Access Button */}
                          <button
                            type="button"
                            onClick={() => handleSetPerm(member.email, mod.key, 'none')}
                            style={{
                              padding: '0.22rem 0.38rem',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: currentLevel === 'none' ? '#ef4444' : 'transparent',
                              color: currentLevel === 'none' ? '#ffffff' : 'var(--theme-text-muted)',
                              transition: 'all 0.12s ease'
                            }}
                            title={`Deny access to ${mod.shortLabel}`}
                          >
                            None
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sticky Bottom Dock: Dirty State Tracker & Save Controls */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.625rem',
          background: isDirty
            ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(202, 138, 4, 0.05))'
            : 'var(--theme-box-bg)',
          border: isDirty ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--theme-border)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          {isDirty ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#eab308' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <b style={{ fontSize: '0.8125rem' }}>Unsaved Permission Modifications</b>
                <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  You have pending changes that have not yet been synced to Google Apps Script.
                </div>
              </div>
            </div>
          ) : saveSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>
                <b style={{ fontSize: '0.8125rem' }}>All Permissions Synced</b>
                <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  Active matrix is synced with Google Apps Script Script Properties.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--theme-text-muted)' }}>
              <ShieldCheck size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
              <div>
                <b style={{ fontSize: '0.8125rem' }}>Permission Matrix Synchronized</b>
                <div style={{ fontSize: '0.6875rem' }}>
                  Select any cell above to modify access levels for team members.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--theme-border)',
                backgroundColor: 'var(--theme-box-bg)',
                color: 'var(--theme-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <RotateCcw size={13} />
              <span>Discard Changes</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: isDirty ? '#2563eb' : '#64748b',
              color: '#ffffff',
              cursor: isDirty && !isSaving ? 'pointer' : 'not-allowed',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: isDirty ? '0 4px 10px rgba(37, 99, 235, 0.35)' : 'none',
              opacity: isDirty ? 1 : 0.6,
              transition: 'all 0.15s ease'
            }}
          >
            {isSaving ? (
              <>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#ffffff',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>Syncing…</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save & Sync</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};