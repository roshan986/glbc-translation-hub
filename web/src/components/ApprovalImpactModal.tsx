import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';

export type ApprovalActionType = 'reviewer' | 'committee' | 'final';

interface ApprovalImpactModalProps {
  isOpen: boolean;
  verseRef: string;
  actionType: ApprovalActionType;
  stageTitle: string;
  roleName: string;
  userName: string;
  commentText?: string;
  nextVerseRef?: string | null;
  onConfirmY: () => void;
  onDeclineN: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export const ApprovalImpactModal: React.FC<ApprovalImpactModalProps> = ({
  isOpen,
  verseRef,
  actionType,
  stageTitle,
  roleName,
  userName,
  commentText,
  nextVerseRef,
  onConfirmY,
  onDeclineN,
  onClose,
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  // Derive dynamic impacts based on action type
  const getImpactDetails = () => {
    switch (actionType) {
      case 'reviewer':
        return {
          icon: <ShieldCheck size={24} color="#2563eb" />,
          title: `Confirm ${stageTitle} Approval?`,
          subtitle: `You are approving as ${roleName} (${userName}).`,
          yImpacts: [
            `Writes "Y" to your discipline confirmation column in Google Sheets.`,
            `Appends your reviewer observations into the shared deliberation thread.`,
            `When all 4 reviewers (Tech, Style, Ortho, Theo) confirm "Y", this verse automatically advances to the Committee Chamber for consensus.`,
            nextVerseRef ? `Automatically advances your screen to next pending verse (${nextVerseRef}).` : `Completes all pending verses for your role in this chapter!`
          ],
          nImpacts: [
            `Leaves confirmation as "N" (blank) in Google Sheets.`,
            `Verse remains under active review—you or fellow team members can continue dialogue.`,
            `Your comment (if written) can still be posted without locking stage approval.`
          ],
          yButtonText: 'Y — Confirm Approval & Advance',
          nButtonText: 'N — Keep Under Review (Cancel)',
          yTheme: '#2563eb'
        };

      case 'committee':
        return {
          icon: <Users size={24} color="#d97706" />,
          title: `Confirm Committee Consensus Verdict?`,
          subtitle: `You are confirming consensus on behalf of the Translation Committee.`,
          yImpacts: [
            `Writes "Y" to Committee Confirm (Col P) in Google Sheets.`,
            `Formally approves the Kannada consensus rendering in Column O.`,
            `Advances this verse to the Final Editor (David) for canonical publication sign-off.`,
            nextVerseRef ? `Automatically steps to the next verse awaiting committee review (${nextVerseRef}).` : `All chapter verses completed by Committee!`
          ],
          nImpacts: [
            `Leaves Committee Confirm as "N" in Google Sheets.`,
            `Verse remains open in Committee Chamber for further debate or clarification with reviewers.`,
            `Discussion thread remains unlocked for new observations.`
          ],
          yButtonText: 'Y — Confirm Committee Verdict',
          nButtonText: 'N — Continue Deliberation (Cancel)',
          yTheme: '#d97706'
        };

      case 'final':
        return {
          icon: <CheckCircle2 size={24} color="#16a34a" />,
          title: `Publish & Lock Canonical Reading?`,
          subtitle: `Final Editorial Sign-Off for canonical publication.`,
          yImpacts: [
            `Writes "Y" to Final Confirm (Col R) and publishes the official Kannada text into Column Q.`,
            `Turns verse status in Col A to "✅ Done" (highlighted green with white text).`,
            `Locks all 18 columns for this row in Google Sheets to safeguard against accidental edits.`,
            nextVerseRef ? `Advances you to next pending publication (${nextVerseRef}).` : `All chapter verses published and finalized!`
          ],
          nImpacts: [
            `Leaves Final Confirm as "N" in Google Sheets.`,
            `Verse does NOT turn green and will not be locked.`,
            `Allows further stylistic polishing or doctrinal re-examination.`
          ],
          yButtonText: 'Y — Publish & Finalize Canonical Verse',
          nButtonText: 'N — Do Not Publish (Keep Open)',
          yTheme: '#16a34a'
        };
    }
  };

  const details = getImpactDetails();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        animation: 'fadeIn 0.15s ease'
      }}
      onClick={onClose}
    >
      <div
        className="app-modal-card"
        style={{
          background: 'var(--theme-card-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderRadius: '0.875rem',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--theme-border, #cbd5e1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'var(--theme-box-bg, #f8fafc)',
          borderBottom: '1px solid var(--theme-border, #e2e8f0)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {details.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--theme-box-bg)', color: 'var(--theme-text)', border: '1px solid var(--theme-border)', textTransform: 'uppercase' }}>
                  {verseRef}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-text-muted)' }}>
                  {stageTitle}
                </span>
              </div>
              <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.0625rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                {details.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--theme-text-muted)',
              padding: '0.25rem',
              borderRadius: '0.25rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Side-by-Side Impact Comparison */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--theme-text-muted)' }}>
            {details.subtitle} Please review the workflow impact before confirming:
          </p>

          {commentText && commentText.trim() && (
            <div style={{
              padding: '0.6rem 0.85rem',
              backgroundColor: 'var(--theme-box-bg)',
              borderLeft: '3px solid #2563eb',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-border)',
              borderLeftWidth: '3px'
            }}>
              <b style={{ color: 'var(--theme-text)' }}>Your Note: </b>
              <span style={{ fontStyle: 'italic' }}>"{commentText.trim()}"</span>
            </div>
          )}

          {/* Impact Comparison Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Impact of Y (Confirm) */}
            <div className="impact-card-confirm" style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>WHAT HAPPENS IF YOU SELECT "Y" (CONFIRM):</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#14532d', lineHeight: '1.45' }}>
                {details.yImpacts.map((item, i) => (
                  <li key={i} style={{ marginTop: i > 0 ? '0.25rem' : 0 }}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Impact of N (Decline / Keep in Review) */}
            <div className="impact-card-decline" style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991b1b', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                <XCircle size={16} color="#dc2626" />
                <span>WHAT HAPPENS IF YOU SELECT "N" (CANCEL / KEEP OPEN):</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#7f1d1d', lineHeight: '1.45' }}>
                {details.nImpacts.map((item, i) => (
                  <li key={i} style={{ marginTop: i > 0 ? '0.25rem' : 0 }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--theme-box-bg)',
          borderTop: '1px solid var(--theme-border)',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={onDeclineN}
            disabled={isSubmitting}
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-border)',
              borderRadius: '0.375rem',
              color: 'var(--theme-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {details.nButtonText}
          </button>

          <button
            type="button"
            onClick={onConfirmY}
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              backgroundColor: details.yTheme,
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isSubmitting ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <span>Writing to Google Sheets…</span>
              </>
            ) : (
              <>
                <span>{details.yButtonText}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
