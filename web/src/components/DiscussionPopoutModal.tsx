import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  Users,
  Lock
} from 'lucide-react';
import type { CommentItem, TeamMember } from '../types';
import { getSmartInitials, getRoleAvatarColor, isCommentByCurrentUser } from '../utils/userUtils';

interface DiscussionPopoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  verseRef: string;
  comments: CommentItem[];
  currentUser?: TeamMember;
  activeRole: string;
  commentText: string;
  onCommentChange: (text: string) => void;
  onSendComment: () => Promise<void>;
  isSubmitting: boolean;
  isFinalized?: boolean;
  isAssigned?: boolean;
}

export const DiscussionPopoutModal: React.FC<DiscussionPopoutModalProps> = ({
  isOpen,
  onClose,
  title,
  verseRef,
  comments,
  currentUser,
  activeRole,
  commentText,
  onCommentChange,
  onSendComment,
  isSubmitting,
  isFinalized,
  isAssigned = true
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll to bottom on open or new comments
  useEffect(() => {
    if (isOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, comments.length]);

  // Filter comments by search query
  const filteredComments = useMemo(() => {
    if (!searchQuery.trim()) return comments;
    const q = searchQuery.toLowerCase().trim();
    return comments.filter((c) =>
      c.authorName.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      c.authorRole.toLowerCase().includes(q)
    );
  }, [comments, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        className="chat-popout-card app-modal-card"
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '46rem',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--theme-border, #cbd5e1)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="chat-popout-header"
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--theme-border, #e2e8f0)',
            background: 'var(--theme-box-bg, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.625rem',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--theme-accent, #818cf8)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                  {title}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: 'var(--theme-accent, #38bdf8)',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {verseRef}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--theme-text-muted, #64748b)' }}>
                Full-screen deliberation stream. Your notes appear on the right; peer team members on the left.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--theme-text-muted, #64748b)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            padding: '0.625rem 1.25rem',
            borderBottom: '1px solid var(--theme-border, #e2e8f0)',
            background: 'var(--theme-card-bg, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Search size={16} color="var(--theme-text-muted, #94a3b8)" />
          <input
            type="text"
            placeholder="Search discussion notes by member name or keyword…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.8125rem',
              color: 'var(--theme-text)',
              backgroundColor: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                fontSize: '0.75rem',
                color: 'var(--theme-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Scrollable Chat Stream */}
        <div
          className="chat-popout-stream"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--theme-canvas-bg, #fcfcfd)'
          }}
        >
          {filteredComments.length > 0 ? (
            filteredComments.map((cmt) => {
              const isMe = isCommentByCurrentUser(cmt.authorName, currentUser?.name);

              return (
                <div
                  key={cmt.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      maxWidth: '82%',
                      flexDirection: isMe ? 'row-reverse' : 'row'
                    }}
                  >
                    {/* Avatar */}
                    <span
                      className={`avatar small ${cmt.avatarColor || getRoleAvatarColor(isMe ? activeRole : cmt.authorRole)}`}
                      style={{
                        flexShrink: 0,
                        width: '2rem',
                        height: '2rem',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                      title={isMe ? `${currentUser?.name} (You)` : cmt.authorName}
                    >
                      {getSmartInitials(isMe ? (currentUser?.name || cmt.authorName) : cmt.authorName)}
                    </span>

                    {/* Bubble Container */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Byline / Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginBottom: '0.25rem',
                          fontSize: '0.6875rem'
                        }}
                      >
                        {isMe ? (
                          <>
                            <span style={{ fontWeight: 700, color: 'var(--theme-accent, #6366f1)' }}>
                              You
                            </span>
                            <span
                              style={{
                                padding: '0.05rem 0.35rem',
                                borderRadius: '0.25rem',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: 'var(--theme-accent, #818cf8)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                fontWeight: 600
                              }}
                            >
                              {activeRole || 'Committee'}
                            </span>
                          </>
                        ) : (
                          <>
                            <b style={{ color: 'var(--theme-text)' }}>{cmt.authorName}</b>
                            <span
                              style={{
                                padding: '0.05rem 0.35rem',
                                borderRadius: '0.25rem',
                                backgroundColor: 'var(--theme-box-bg)',
                                color: 'var(--theme-text-muted)',
                                border: '1px solid var(--theme-border)',
                                fontWeight: 600
                              }}
                            >
                              {cmt.authorRole}
                            </span>
                          </>
                        )}
                        {cmt.isApproval && (
                          <span
                            style={{
                              padding: '0.05rem 0.35rem',
                              borderRadius: '0.25rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <CheckCircle2 size={10} /> Approved
                          </span>
                        )}
                        <time style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>{cmt.timeAgo}</time>
                      </div>

                      {/* Chat Message Bubble */}
                      <div
                        className={`chat-bubble-box ${isMe ? 'me' : 'other'}`}
                        style={{
                          padding: '0.75rem 1rem',
                          fontSize: '0.875rem',
                          lineHeight: 1.55,
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {cmt.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 1rem',
                color: 'var(--theme-text-muted, #94a3b8)',
                textAlign: 'center'
              }}
            >
              <MessageSquare size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {searchQuery ? 'No comments match your search filter.' : 'No discussion comments recorded yet for this verse.'}
              </p>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Modal Composer (Bottom) */}
        {!isFinalized && currentUser && (
          isAssigned ? (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--theme-border)',
                backgroundColor: 'var(--theme-card-bg)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-end',
                  backgroundColor: 'var(--theme-box-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '0.75rem',
                  padding: '0.625rem 0.875rem'
                }}
              >
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (commentText.trim() && !isSubmitting) {
                        onSendComment();
                      }
                    }
                  }}
                  placeholder={`Post as You (${activeRole}) in English or ಕನ್ನಡ … (Ctrl + Enter to send)`}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    resize: 'none',
                    fontSize: '0.875rem',
                    color: 'var(--theme-text)',
                    lineHeight: 1.5
                  }}
                />
                <button
                  type="button"
                  disabled={!commentText.trim() || isSubmitting}
                  onClick={onSendComment}
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.5rem',
                    backgroundColor: commentText.trim() && !isSubmitting ? '#4f46e5' : 'var(--theme-border)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: commentText.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                  title="Send note (Ctrl + Enter)"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Sending…' : 'Send'}</span>
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.35rem',
                  fontSize: '0.6875rem',
                  color: 'var(--theme-text-muted)'
                }}
              >
                <span>Posting as <b>{currentUser.name}</b> ({activeRole})</span>
                <span>Syncs instantly to Google Sheets</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '0.875rem 1.25rem',
                borderTop: '1px solid var(--theme-border)',
                backgroundColor: 'var(--theme-box-bg)',
                fontSize: '0.75rem',
                color: 'var(--theme-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <Lock size={14} color="var(--theme-text-muted)" />
              <span>
                Read-only deliberation · Only assigned <b>{title}</b> team members can post discussion notes or confirm this stage.
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
