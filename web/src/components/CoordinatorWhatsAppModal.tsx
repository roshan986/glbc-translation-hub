import React, { useState } from 'react';
import type { BookAnalytics, TeamMember } from '../types';
import { X, ArrowUpRight, MessageCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { generateWhatsAppLink } from '../services/api';
import { getSmartInitials, getRoleAvatarColor } from '../utils/userUtils';

interface CoordinatorWhatsAppModalProps {
  analytics: BookAnalytics;
  book: string;
  team: TeamMember[];
  onClose: () => void;
}

export const CoordinatorWhatsAppModal: React.FC<CoordinatorWhatsAppModalProps> = ({
  analytics,
  book,
  team,
  onClose
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);
  const { bottlenecks, stages, total, completed } = analytics;

  // Determine stage requirements and targeted bottleneck roles across the book
  const targetRoles: string[] = [];
  const neededList: string[] = [];

  if (bottlenecks.orthographic > 0) {
    targetRoles.push('ortho');
    neededList.push(`Orthographic (${bottlenecks.orthographic})`);
  }
  if (bottlenecks.style > 0) {
    targetRoles.push('style');
    neededList.push(`Style (${bottlenecks.style})`);
  }
  if (bottlenecks.technical > 0) {
    targetRoles.push('tech');
    neededList.push(`Technical (${bottlenecks.technical})`);
  }
  if (bottlenecks.theological > 0) {
    targetRoles.push('theo');
    neededList.push(`Theological (${bottlenecks.theological})`);
  }
  const commPending = bottlenecks.committee || stages.awaitingCommittee;
  if (commPending > 0) {
    targetRoles.push('comm');
    neededList.push(`Committee (${commPending})`);
  }
  const finalPending = bottlenecks.finalEditor || stages.needsFinal;
  if (finalPending > 0) {
    targetRoles.push('final');
    neededList.push(`Final Editor (${finalPending})`);
  }
  if (stages.notStarted > 0 && targetRoles.length === 0) {
    targetRoles.push('drafter');
    neededList.push(`Drafters (${stages.notStarted} not started)`);
  }

  let stageDescription = '';
  if (completed === total && total > 0) {
    stageDescription = 'All Stages Completed (Canonical Lock)';
  } else if (neededList.length > 0) {
    stageDescription = `Awaiting Review & Consensus: ${neededList.join(', ')}`;
  } else {
    stageDescription = 'Active Pipeline: All stage queues currently on track';
  }

  // Filter recommended team members matching active bottleneck roles
  const isMemberTargeted = (m: TeamMember): boolean => {
    if (m.active === false) return false;
    const combinedRoles = [...(m.roles || []), m.role].map((r) => r.toLowerCase());
    return targetRoles.some((tr) => {
      return combinedRoles.some((r) => {
        if (tr === 'drafter') return r.includes('drafter');
        if (tr === 'tech') return r.includes('tech');
        if (tr === 'style') return r.includes('style') || r.includes('lang');
        if (tr === 'ortho') return r.includes('ortho');
        if (tr === 'theo') return r.includes('theo');
        if (tr === 'comm') return r.includes('comm');
        if (tr === 'final') return r.includes('final') || r.includes('edit');
        return false;
      });
    });
  };

  const getMemberPendingCount = (member: TeamMember): number => {
    if (member.active === false) return 0;
    const combinedRoles = [...(member.roles || []), member.role].map((r) => r.toLowerCase());
    let maxPending = 0;
    for (const r of combinedRoles) {
      if (r.includes('ortho')) maxPending = Math.max(maxPending, bottlenecks.orthographic);
      if (r.includes('style') || r.includes('lang')) maxPending = Math.max(maxPending, bottlenecks.style);
      if (r.includes('tech')) maxPending = Math.max(maxPending, bottlenecks.technical);
      if (r.includes('theo')) maxPending = Math.max(maxPending, bottlenecks.theological);
      if (r.includes('comm')) maxPending = Math.max(maxPending, bottlenecks.committee || stages.awaitingCommittee);
      if (r.includes('final') || r.includes('edit')) maxPending = Math.max(maxPending, bottlenecks.finalEditor || stages.needsFinal);
    }
    return maxPending;
  };

  const activeTeam = team.filter((m) => m.active !== false);
  const recommendedMembers = activeTeam.filter(isMemberTargeted);
  const otherMembers = activeTeam.filter((m) => !isMemberTargeted(m));

  // If no recommended match found, show all active members
  const displayRecommended = recommendedMembers.length > 0 ? recommendedMembers : activeTeam;
  const displayOther = recommendedMembers.length > 0 ? otherMembers : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="app-modal-card"
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '0.875rem',
          maxWidth: '28rem',
          width: '100%',
          maxHeight: 'min(540px, 85vh)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--theme-border, #e2e8f0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--theme-border, #f1f5f9)',
            background: 'var(--theme-box-bg, #ffffff)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                padding: '0.45rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--theme-text)', margin: 0 }}>
                Send WhatsApp Alert
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', margin: '0.125rem 0 0 0' }}>
                <b>{book}</b> · <span style={{ color: '#2563eb', fontWeight: 600 }}>Coordinator Stage Dispatch</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'var(--theme-box-bg)',
              border: 'none',
              borderRadius: '9999px',
              width: '1.75rem',
              height: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--theme-text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem'
          }}
        >
          {/* Active Stage Banner */}
          <div
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#1e40af'
            }}
          >
            <Sparkles size={14} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>
              Next Action: <b>{stageDescription}</b>
            </span>
          </div>

          {/* Recommended Section */}
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <CheckCircle2 size={12} color="#16a34a" />
              <span>RECOMMENDED NEXT REVIEWERS</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {displayRecommended.map((member) => {
                const pending = getMemberPendingCount(member);
                const statusNotice = pending > 0 ? `${pending} verses awaiting confirm` : 'Awaiting Stage Review';
                const link = generateWhatsAppLink(
                  member.phone,
                  'Active Queue',
                  book,
                  statusNotice,
                  member.role,
                  member.name
                );

                return (
                  <a
                    key={`${member.email}-${member.role}`}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.625rem 0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      color: 'var(--theme-text)',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`avatar small ${getRoleAvatarColor(member.role)}`}>
                        {getSmartInitials(member.name)}
                      </span>
                      <div>
                        <b style={{ fontSize: '0.8125rem', display: 'block', color: 'var(--theme-text)' }}>
                          {member.name}
                        </b>
                        <small style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>
                          {member.role}{pending > 0 ? ` · ${pending} pending` : ''}
                        </small>
                      </div>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <span>Send</span>
                      <ArrowUpRight size={12} />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Collapsible Other Team Members Section */}
          {displayOther.length > 0 && (
            <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '0.625rem' }}>
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--theme-text-muted)',
                  cursor: 'pointer',
                  padding: '0.375rem 0'
                }}
              >
                <span>Other team members ({displayOther.length})</span>
                {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAll && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                  {displayOther.map((member) => {
                    const link = generateWhatsAppLink(
                      member.phone,
                      'Progress Update',
                      book,
                      'Translation Progress Update',
                      member.role,
                      member.name
                    );

                    return (
                      <a
                        key={`${member.email}-${member.role}`}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.625rem',
                          border: '1px solid var(--theme-border)',
                          borderRadius: '0.375rem',
                          textDecoration: 'none',
                          color: 'var(--theme-text)',
                          backgroundColor: 'var(--theme-box-bg)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`avatar small ${getRoleAvatarColor(member.role)}`}>
                            {getSmartInitials(member.name)}
                          </span>
                          <div>
                            <b style={{ fontSize: '0.75rem', display: 'block', color: 'var(--theme-text)' }}>
                              {member.name}
                            </b>
                            <small style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                              {member.role}
                            </small>
                          </div>
                        </div>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: '#16a34a'
                          }}
                        >
                          <span>wa.me</span>
                          <ArrowUpRight size={11} />
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div
          style={{
            padding: '0.625rem 1.25rem',
            borderTop: '1px solid var(--theme-border)',
            backgroundColor: 'var(--theme-box-bg)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.4rem 0.875rem',
              border: '1px solid var(--theme-border)',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--theme-card-bg)',
              color: 'var(--theme-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
