import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Check,
  Mail,
  Phone,
  Edit2,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { TeamMember } from '../types';

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

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamMember[];
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
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  team,
  onSaveMember,
  onSyncProtections
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingMember, setEditingMember] = useState<{
    name: string;
    email: string;
    phone: string;
    active: boolean;
    roles: string[];
    originalEmail?: string;
    originalName?: string;
    isNew?: boolean;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Group members by email/name so people with multiple roles appear as a single unified card
  const unifiedMembers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      email: string;
      phone: string;
      active: boolean;
      avatar?: string;
      avatarColor?: string;
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
          avatar: m.avatar,
          avatarColor: m.avatarColor,
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

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return unifiedMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery) ||
        m.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (roleFilter === 'all') return true;
      if (roleFilter === 'active') return m.active;
      if (roleFilter === 'inactive') return !m.active;

      return m.roles.some((r) => r.toLowerCase().includes(roleFilter.toLowerCase()));
    });
  }, [unifiedMembers, searchQuery, roleFilter]);

  const handleOpenAdd = () => {
    setEditingMember({
      name: '',
      email: '',
      phone: '',
      active: true,
      roles: ['Theological Reviewer'],
      isNew: true
    });
  };

  const handleOpenEdit = (m: typeof unifiedMembers[0]) => {
    setEditingMember({
      name: m.name,
      email: m.email,
      phone: m.phone,
      active: m.active,
      roles: m.roles.length > 0 ? [...m.roles] : ['Drafter'],
      originalEmail: m.email,
      originalName: m.name,
      isNew: false
    });
  };

  const handleToggleRoleInEditor = (role: string) => {
    if (!editingMember) return;
    const exists = editingMember.roles.includes(role);
    let newRoles: string[];
    if (exists) {
      if (editingMember.roles.length === 1) {
        showToast('error', 'A team member must have at least one assigned role.');
        return;
      }
      newRoles = editingMember.roles.filter((r) => r !== role);
    } else {
      newRoles = [...editingMember.roles, role];
    }
    setEditingMember({ ...editingMember, roles: newRoles });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editingMember.name.trim()) {
      showToast('error', 'Please enter member name.');
      return;
    }
    if (!editingMember.email.trim()) {
      showToast('error', 'Please enter Google email address for column permissions.');
      return;
    }
    if (editingMember.roles.length === 0) {
      showToast('error', 'Please select at least one role.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryRole = editingMember.roles[0];
      const res = await onSaveMember({
        name: editingMember.name.trim(),
        role: primaryRole,
        phone: editingMember.phone.trim(),
        email: editingMember.email.trim().toLowerCase(),
        active: editingMember.active,
        roles: editingMember.roles,
        originalEmail: editingMember.originalEmail,
        originalName: editingMember.originalName
      });

      if (res.success) {
        showToast('success', res.message || `Member ${editingMember.name} saved successfully!`);
        setEditingMember(null);
      } else {
        showToast('error', res.error || 'Failed to save member.');
      }
    } catch (err) {
      showToast('error', String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncProtectionsNow = async () => {
    setIsSyncing(true);
    try {
      const res = await onSyncProtections();
      if (res.success) {
        showToast('success', res.message || 'Column protections successfully synced in Google Sheets!');
      } else {
        showToast('error', res.error || 'Failed to sync column protections.');
      }
    } catch (err) {
      showToast('error', String(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          backgroundColor: 'var(--theme-card-bg)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--theme-border)',
          position: 'relative',
          color: 'var(--theme-text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              backgroundColor: toastMessage.type === 'success' ? '#065f46' : '#991b1b',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {toastMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--theme-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--theme-card-bg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.625rem',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--theme-text)', margin: 0 }}>
                Team Directory &amp; Role Access Control
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', margin: '2px 0 0 0' }}>
                Synced directly with <b>⚙ Config</b> sheet &bull; Grants native Google Sheets column edit permissions
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleOpenAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <UserPlus size={15} />
              Add Team Member
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--theme-box-bg)',
            borderBottom: '1px solid var(--theme-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--theme-input-bg)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.75rem'
              }}
            >
              <Search size={15} color="var(--theme-text-muted)" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.8125rem',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-text)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncProtectionsNow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: 'var(--theme-card-bg)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--theme-text)',
                cursor: isSyncing ? 'not-allowed' : 'pointer'
              }}
              title="Force sync column permissions across all book sheets"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing Protections…' : 'Sync Protections'}
            </button>
          </div>

          {/* Role Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: `All (${unifiedMembers.length})` },
              { id: 'active', label: 'Active Only' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'Theological', label: 'Theological' },
              { id: 'Style', label: 'Style' },
              { id: 'Orthographic', label: 'Ortho' },
              { id: 'Technical', label: 'Tech' },
              { id: 'Committee', label: 'Committee' },
              { id: 'Drafter', label: 'Drafter' },
              { id: 'Final', label: 'Final Editor' }
            ].map((f) => {
              const isSelected = roleFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRoleFilter(f.id)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid #3b82f6' : '1px solid var(--theme-border)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.18)' : 'var(--theme-card-bg)',
                    color: isSelected ? '#3b82f6' : 'var(--theme-text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members List Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--theme-text-muted)' }}>
              <Users size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No team members match your filter.</p>
              <small>Try clearing your search query or role filter.</small>
            </div>
          ) : (
            filteredMembers.map((m) => (
              <div
                key={m.email || m.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.625rem',
                  border: '1px solid var(--theme-border)',
                  backgroundColor: m.active ? 'var(--theme-card-bg)' : 'var(--theme-box-bg)',
                  opacity: m.active ? 1 : 0.7,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                  <span
                    className={`avatar ${m.avatarColor || 'bg-blue-600'}`}
                    style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.875rem', flexShrink: 0 }}
                  >
                    {m.avatar || m.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--theme-text)' }}>{m.name}</span>
                      {!m.active && (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '0.25rem',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c'
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                      {m.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} title="Google Email used for Sheet column permissions">
                          <Mail size={12} color="#94a3b8" />
                          <span style={{ fontFamily: 'monospace' }}>{m.email}</span>
                        </span>
                      )}
                      {m.phone && (
                        <a
                          href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: '#15803d',
                            textDecoration: 'none',
                            fontWeight: 600
                          }}
                          title="Open WhatsApp chat"
                        >
                          <Phone size={12} />
                          <span>+{m.phone}</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    {/* Roles Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
                      {m.roles.map((r) => {
                        const styleCfg = ROLE_COLORS[r] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
                        return (
                          <span
                            key={r}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.375rem',
                              backgroundColor: styleCfg.bg,
                              color: styleCfg.text,
                              border: `1px solid ${styleCfg.border}`
                            }}
                          >
                            {r}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(m)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--theme-border)',
                      backgroundColor: 'var(--theme-box-bg)',
                      color: 'var(--theme-text)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={13} />
                    Edit Roles
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            backgroundColor: 'var(--theme-box-bg)',
            borderTop: '1px solid var(--theme-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--theme-text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="#15803d" />
            <span>
              <b>Column Protections:</b> Each role locks corresponding columns to active Google Account emails in Google Sheets.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--theme-text)',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Edit / Add Member Sub-Dialog Overlay */}
        {editingMember && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 110,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
            onClick={() => setEditingMember(null)}
          >
            <form
              onSubmit={handleSave}
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: 'var(--theme-card-bg)',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--theme-border)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                color: 'var(--theme-text)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--theme-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                  {editingMember.isNew ? 'Add Team Member' : `Edit Roles for ${editingMember.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--theme-text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="e.g. Dr. Paul Anand"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>
                  GOOGLE ACCOUNT EMAIL (Required for Sheet Permissions)
                </label>
                <input
                  type="email"
                  required
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  placeholder="e.g. paul.anand@gmail.com"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text)'
                  }}
                />
                <small style={{ color: 'var(--theme-text-muted)', fontSize: '0.6875rem', marginTop: '2px', display: 'block' }}>
                  Must be an active Google email so Google Sheets locks editing to this user.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.25rem' }}>
                  PHONE NUMBER (Digits only with country code, no + sign)
                </label>
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="e.g. 919876543210"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--theme-input-bg)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>

              {/* Roles Multi-Check */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: '0.35rem' }}>
                  ASSIGNED ROLES (Select all that apply)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {ALL_ROLES.map((role) => {
                    const isChecked = editingMember.roles.includes(role);
                    return (
                      <label
                        key={role}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: isChecked ? '1px solid #3b82f6' : '1px solid var(--theme-border)',
                          backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.15)' : 'var(--theme-box-bg)',
                          cursor: 'pointer',
                          fontSize: '0.8125rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRoleInEditor(role)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? '#3b82f6' : 'var(--theme-text)' }}>
                          {role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Status Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--theme-text)' }}>
                <input
                  type="checkbox"
                  checked={editingMember.active}
                  onChange={(e) => setEditingMember({ ...editingMember, active: e.target.checked })}
                />
                <b>Active Member</b> (Decheck to temporarily disable access without deleting)
              </label>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid var(--theme-border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--theme-border)',
                    backgroundColor: 'var(--theme-box-bg)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--theme-text)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isSaving ? 'Saving & Syncing…' : (editingMember.isNew ? 'Create Member' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};