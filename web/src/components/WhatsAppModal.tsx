import React, { useState } from 'react';
import type { VerseItem, TeamMember } from '../types';
import { X, ArrowUpRight, MessageCircle, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { generateWhatsAppLink } from '../services/api';

interface WhatsAppModalProps {
  verse: VerseItem;
  book: string;
  team: TeamMember[];
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  verse,
  book,
  team,
  onClose
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  // Determine stage requirement and targeted roles
  let stageDescription = '';
  const targetRoles: string[] = [];

  if (!verse.confirms.drafter) {
    stageDescription = 'Awaiting Drafter Confirmation';
    targetRoles.push('drafter');
  } else if (!verse.confirms.tech || !verse.confirms.style || !verse.confirms.ortho || !verse.confirms.theo) {
    const neededList: string[] = [];
    if (!verse.confirms.tech) {
      targetRoles.push('tech');
      neededList.push('Technical');
    }
    if (!verse.confirms.style) {
      targetRoles.push('style');
      neededList.push('Style');
    }
    if (!verse.confirms.ortho) {
      targetRoles.push('ortho');
      neededList.push('Orthographic');
    }
    if (!verse.confirms.theo) {
      targetRoles.push('theo');
      neededList.push('Theological');
    }
    stageDescription = `Awaiting Review: ${neededList.join(', ')}`;
  } else if (!verse.confirms.comm) {
    stageDescription = 'Awaiting Committee Consensus';
    targetRoles.push('comm');
  } else if (!verse.confirms.final) {
    stageDescription = 'Awaiting Final Editor Sign-Off';
    targetRoles.push('final');
  } else {
    stageDescription = 'All Stages Completed (Canonical Lock)';
  }

  // Filter recommended team members
  const isMemberTargeted = (m: TeamMember): boolean => {
    const r = m.role.toLowerCase();
    return targetRoles.some((tr) => {
      if (tr === 'drafter') return r.includes('drafter');
      if (tr === 'tech') return r.includes('tech');
      if (tr === 'style') return r.includes('style') || r.includes('lang');
      if (tr === 'ortho') return r.includes('ortho');
      if (tr === 'theo') return r.includes('theo');
      if (tr === 'comm') return r.includes('comm');
      if (tr === 'final') return r.includes('final') || r.includes('edit');
      return false;
    });
  };

  const recommendedMembers = team.filter(isMemberTargeted);
  const otherMembers = team.filter((m) => !isMemberTargeted(m));

  // If no recommended match found, show all members
  const displayRecommended = recommendedMembers.length > 0 ? recommendedMembers : team;
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
                <b>{verse.verse}</b> · <span style={{ color: '#2563eb', fontWeight: 600 }}>{verse.status}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                const link = generateWhatsAppLink(
                  member.phone,
                  verse.verse,
                  book,
                  verse.status,
                  member.role,
                  member.name,
                  verse.chapter
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
                      <span className={`avatar small ${member.avatarColor || 'bg-blue-600'}`}>
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <b style={{ fontSize: '0.8125rem', display: 'block', color: 'var(--theme-text)' }}>{member.name}</b>
                        <small style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600 }}>{member.role}</small>
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
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem' }}>
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
                  color: '#64748b',
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
                      verse.verse,
                      book,
                      verse.status,
                      member.role,
                      member.name,
                      verse.chapter
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
                          <span className={`avatar small ${member.avatarColor || 'bg-blue-600'}`}>
                            {member.avatar || member.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <b style={{ fontSize: '0.75rem', display: 'block', color: 'var(--theme-text)' }}>{member.name}</b>
                            <small style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>{member.role}</small>
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
