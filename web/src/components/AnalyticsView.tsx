import React, { useState, useEffect, useMemo } from 'react';
import type { BookAnalytics, TeamMember } from '../types';
import {
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Users,
  BookOpen,
  Target,
  Clock,
  Sliders,
  Lock
} from 'lucide-react';
import { generateWeeklySummaryText } from '../services/api';
import { CoordinatorWhatsAppModal } from './CoordinatorWhatsAppModal';
import { calculatePacingStats } from '../utils/pacingEngine';
import { showToast } from '../utils/toast';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsViewProps {
  analytics: BookAnalytics;
  currentBook: string;
  team: TeamMember[];
  availableBooks?: string[];
  onNavigateToSettings?: () => void;
  onRefresh?: () => void;
}

// ─── Stage funnel definition ───────────────────────────────────────────────
const STAGE_CONFIGS = [
  {
    label: '1. Not Started',
    desc: 'Draft text or drafter confirmation pending',
    key: 'notStarted' as const,
    color: 'var(--analytics-stage-grey)'
  },
  {
    label: '2. Awaiting Review',
    desc: 'Drafter confirmed (Y), waiting for 1st reviewer',
    key: 'awaitingReview' as const,
    color: 'var(--analytics-stage-blue-lt)'
  },
  {
    label: '3. Under Active Review',
    desc: '1–3 reviewers confirmed (Tech, Style, Ortho, Theo)',
    key: 'underReview' as const,
    color: 'var(--analytics-stage-blue)'
  },
  {
    label: '4. Awaiting Committee',
    desc: 'All 4 reviewers confirmed, ready for consensus',
    key: 'awaitingCommittee' as const,
    color: 'var(--analytics-stage-amber)'
  },
  {
    label: '5. Needs Final Editor',
    desc: 'Committee confirmed (Y), awaiting Final Editor sign-off',
    key: 'needsFinal' as const,
    color: 'var(--analytics-stage-orange)'
  },
  {
    label: '6. Completed (Done)',
    desc: 'Final Reading entered & Final Confirm is Y',
    key: 'done' as const,
    color: 'var(--analytics-stage-green)'
  }
] as const;

// ─── Bottleneck card definition ─────────────────────────────────────────────
const BOTTLENECK_CONFIGS = [
  { key: 'orthographic', title: 'Orthographic Review' },
  { key: 'style',        title: 'Style & Language Review' },
  { key: 'technical',   title: 'Technical Review' },
  { key: 'theological', title: 'Theological Review' },
  { key: 'committee',   title: 'Committee Consensus' },
  { key: 'final',       title: 'Final Editor Sign-Off' }
] as const;

type BottleneckKey = typeof BOTTLENECK_CONFIGS[number]['key'];

function getBottleneckCount(
  key: BottleneckKey,
  bottlenecks: BookAnalytics['bottlenecks'],
  stages: BookAnalytics['stages']
): number {
  if (key === 'committee') return bottlenecks.committee || stages.awaitingCommittee;
  if (key === 'final') return bottlenecks.finalEditor || stages.needsFinal;
  return bottlenecks[key as keyof typeof bottlenecks] ?? 0;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  currentBook,
  team,
  availableBooks,
  onNavigateToSettings,
  onRefresh
}) => {
  const { canEdit } = useAuth();
  const isAnalyticsEditable = canEdit('analytics');
  const { total, completed, completionRate, stages, bottlenecks } = analytics;

  const [copied, setCopied]                   = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);

  // ── Target Date Synchronization (Per Book with Storage Event Listener) ──
  const [targetDateStr, setTargetDateStr] = useState<string>(() => {
    return localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
  });

  useEffect(() => {
    const updateTargetDate = () => {
      const saved = localStorage.getItem(`glbc_target_date_${currentBook}`) || '';
      setTargetDateStr(saved);
    };
    updateTargetDate();
    window.addEventListener('storage', updateTargetDate);
    return () => window.removeEventListener('storage', updateTargetDate);
  }, [currentBook]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopySummary = async () => {
    const text = generateWeeklySummaryText(currentBook, analytics);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('error', 'Could not copy summary to clipboard');
    }
  };

  // Match both primary role and all secondary roles, active team members only
  const getAssignedMembers = (roleKey: string): TeamMember[] => {
    const k = roleKey.toLowerCase();
    return team.filter((m) => {
      if (m.active === false) return false;
      const combinedRoles = [...(m.roles || []), m.role].map((r) => r.toLowerCase());
      return combinedRoles.some((r) => {
        if (k === 'orthographic') return r.includes('ortho');
        if (k === 'style')        return r.includes('style') || r.includes('lang');
        if (k === 'technical')   return r.includes('tech');
        if (k === 'theological') return r.includes('theo');
        if (k === 'committee')   return r.includes('comm');
        if (k === 'final')       return r.includes('final') || r.includes('edit');
        return false;
      });
    });
  };

  // ── Derived KPI values ────────────────────────────────────────────────────
  const remaining = Math.max(0, total - completed);

  // Active team members count (unique people, not role rows)
  const uniqueActiveMembers = useMemo(() => {
    const seen = new Set<string>();
    return team.filter((m) => {
      if (m.active === false) return false;
      const key = m.email || m.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).length;
  }, [team]);

  // Pipeline health: verses that are "in motion" (not stuck at Not Started, not done)
  const inMotion = stages.awaitingReview + stages.underReview + stages.awaitingCommittee + stages.needsFinal;

  // Unified Target Date & Velocity Stats (matches FocusModeCard countdownEngine)
  const targetStats = useMemo(() => {
    return calculatePacingStats(targetDateStr, total, completed);
  }, [targetDateStr, total, completed]);

  // ── Check if Book is Uninitialized (Sheet not created in Google Sheets) ──
  const isBookUninitialized =
    analytics.isUninitialized ||
    (availableBooks && availableBooks.length > 0 && !availableBooks.includes(currentBook));

  if (isBookUninitialized) {
    return (
      <div className="analytics-root">
        {/* Page Header */}
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              COORDINATOR COMMAND CENTER
            </div>
            <h1>Live Translation Analytics</h1>
            <p>Real-time completion funnels, reviewer bottleneck monitoring, and weekly reporting.</p>
          </div>

          <div className="analytics-header-actions">
            {onRefresh && (
              <button onClick={onRefresh} className="analytics-btn-secondary">
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Uninitialized Book Empty State Card */}
        <div
          className="analytics-card analytics-card--padded"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            gap: '1.25rem',
            border: '1px dashed var(--theme-border)',
            background: 'var(--theme-box-bg)'
          }}
        >
          <div
            style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: '9999px',
              backgroundColor: 'color-mix(in srgb, #f59e0b 16%, var(--theme-card-bg))',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
            }}
          >
            <BookOpen size={28} />
          </div>

          <div style={{ maxWidth: '32rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--theme-text)', margin: '0 0 0.5rem 0' }}>
              {currentBook} has not been initialized yet
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)', margin: 0, lineHeight: 1.6 }}>
              No worksheet for <strong>{currentBook}</strong> exists in Google Sheets yet. To begin drafting, reviewer assignments, and track live analytics, initialize this book sheet in Settings.
            </p>
          </div>

          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px -1px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Sliders size={16} />
              <span>Initialize {currentBook} in Settings</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="analytics-root">

      {/* ── Page Header ── */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            COORDINATOR COMMAND CENTER
          </div>
          <h1>Live Translation Analytics</h1>
          <p>Real-time completion funnels, reviewer bottleneck monitoring, and weekly reporting.</p>
        </div>

        <div className="analytics-header-actions">
          {onRefresh && (
            <button onClick={onRefresh} className="analytics-btn-secondary">
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {!isAnalyticsEditable && (
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.875rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#60a5fa'
          }}
        >
          <Lock size={14} />
          <span><b>Read-Only Observation View:</b> You can monitor funnels and reports. WhatsApp alert dispatch is restricted for your role.</span>
        </div>
      )}

      {/* ── KPI Metrics Grid ── */}
      <div className="analytics-kpi-grid">

        {/* 1. Target Completion Date & Pace (Primary KPI Card - Non-Editable) */}
        <div className={`analytics-card${!targetStats.hasTargetDate ? ' analytics-card--muted' : ''}`}>
          <div className="analytics-kpi-label analytics-kpi-label--rose">
            <Target size={12} className="analytics-kpi-icon" /> TARGET COMPLETION
          </div>
          {targetStats.hasTargetDate ? (
            <>
              <div className={`analytics-kpi-value${targetStats.isPast ? ' analytics-kpi-value--red' : ' analytics-kpi-value--rose'}`}>
                {targetStats.isComplete
                  ? 'Goal Reached 🎉'
                  : targetStats.isPast
                  ? `${targetStats.daysOverdue}d overdue`
                  : `${targetStats.daysRemaining}d left`}
              </div>
              <div className="analytics-kpi-sub">
                {targetStats.isComplete ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>All {total} verses completed</span>
                ) : (
                  <>
                    <strong>{targetStats.requiredDailyPace} verses/day</strong> pace · Target: {targetStats.formattedTarget}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="analytics-kpi-value analytics-kpi-value--muted">—</div>
              <div className="analytics-kpi-sub">No target date set for {currentBook}</div>
            </>
          )}
        </div>

        {/* 2. Completed */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--green">COMPLETED (DONE)</div>
          <div className="analytics-kpi-value analytics-kpi-value--green">{completed}</div>
          <div className="analytics-kpi-sub analytics-kpi-sub--green">{completionRate}% Milestone Reached</div>
        </div>

        {/* 3. Total Verses */}
        <div className="analytics-card">
          <div className="analytics-kpi-label">
            <BookOpen size={12} className="analytics-kpi-icon" /> TOTAL VERSES
          </div>
          <div className="analytics-kpi-value">{total}</div>
          <div className="analytics-kpi-sub">Canonical Book of {currentBook}</div>
        </div>

        {/* 4. Pipeline — In Motion */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--blue">IN PIPELINE</div>
          <div className="analytics-kpi-value analytics-kpi-value--blue">{inMotion}</div>
          <div className="analytics-kpi-sub">
            {stages.underReview} reviewing · {stages.awaitingCommittee + stages.needsFinal} editorial
          </div>
        </div>

        {/* 5. Not Started */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--slate">NOT STARTED</div>
          <div className="analytics-kpi-value analytics-kpi-value--slate">{stages.notStarted}</div>
          <div className="analytics-kpi-sub">Drafting not yet begun or confirmed</div>
        </div>

        {/* 6. Editorial Sign-Off */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--amber">EDITORIAL SIGN-OFF</div>
          <div className="analytics-kpi-value analytics-kpi-value--amber">
            {stages.awaitingCommittee + stages.needsFinal}
          </div>
          <div className="analytics-kpi-sub">Committee &amp; Final Editor queue</div>
        </div>

        {/* 7. Active Team */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--teal">
            <Users size={12} className="analytics-kpi-icon" /> ACTIVE TEAM
          </div>
          <div className="analytics-kpi-value analytics-kpi-value--teal">{uniqueActiveMembers}</div>
          <div className="analytics-kpi-sub">Team members across {team.length} role assignments</div>
        </div>

        {/* 8. Burn-Down / Remaining */}
        <div className="analytics-card">
          <div className="analytics-kpi-label analytics-kpi-label--purple">
            <Zap size={12} className="analytics-kpi-icon" /> REMAINING
          </div>
          <div className="analytics-kpi-value analytics-kpi-value--purple">{remaining}</div>
          <div className="analytics-kpi-sub">
            {targetStats.hasTargetDate ? (
              <>
                Target: <strong className="analytics-kpi-date">{targetStats.formattedTarget}</strong>{' '}
                ({targetStats.isPast ? `${targetStats.daysOverdue}d overdue` : `${targetStats.daysRemaining}d left`})
              </>
            ) : (
              <>
                <strong>{completed} of {total}</strong> verses completed
              </>
            )}
          </div>
        </div>

        {/* 9. Required Daily Pace (Synchronized with Focus Mode) */}
        <div className={`analytics-card${!targetStats.hasTargetDate ? ' analytics-card--muted' : ''}`}>
          <div className="analytics-kpi-label analytics-kpi-label--indigo">
            <Clock size={12} className="analytics-kpi-icon" /> REQUIRED DAILY PACE
          </div>
          <div className={`analytics-kpi-value${targetStats.hasTargetDate ? ' analytics-kpi-value--indigo' : ' analytics-kpi-value--muted'}`}>
            {targetStats.hasTargetDate ? `${targetStats.requiredDailyPace} v/d` : '—'}
          </div>
          <div className="analytics-kpi-sub">
            {targetStats.hasTargetDate
              ? 'Verses / working day to meet target'
              : 'Set target date in Settings to calculate pace'}
          </div>
        </div>

      </div>

      {/* ── WhatsApp Link Banner (Identical to Focus Mode) ── */}
      {isAnalyticsEditable ? (
        <button
          type="button"
          className="whatsapp-link"
          onClick={() => setShowWhatsAppModal(true)}
        >
          <span className="whatsapp-mark" style={{ backgroundColor: '#25D366', color: '#ffffff' }}>↗</span>
          <span>
            <b>Send WhatsApp Alert</b>
            <small>Notify next reviewers and active stage queues on WhatsApp</small>
          </span>
          <ArrowUpRight size={18} />
        </button>
      ) : (
        <div
          className="whatsapp-link"
          style={{ opacity: 0.65, cursor: 'not-allowed' }}
          title="WhatsApp notification dispatch is restricted for your role"
        >
          <span className="whatsapp-mark" style={{ backgroundColor: '#64748b', color: '#ffffff' }}>🔒</span>
          <span>
            <b>Send WhatsApp Alert (Read-Only)</b>
            <small>Notification dispatch is restricted by administrator policy</small>
          </span>
        </div>
      )}

      {/* ── WhatsApp Alert Modal (Identical to Focus Mode working) ── */}
      {showWhatsAppModal && (
        <CoordinatorWhatsAppModal
          analytics={analytics}
          book={currentBook}
          team={team}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* ── Stage Progression Funnel ── */}
      <div className="analytics-card analytics-card--padded">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">
            <TrendingUp size={18} className="analytics-icon-blue" />
            Full 6-Stage Translation Funnel
          </h3>
          <span className="analytics-section-meta">
            Overall: <strong className="analytics-pct-green">{completionRate}% Complete</strong>
          </span>
        </div>

        <div className="analytics-funnel">
          {STAGE_CONFIGS.map((stage, i) => {
            const count = stages[stage.key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={stage.key}
                className={`analytics-funnel-row${i < 5 ? ' analytics-funnel-row--border' : ''}`}
              >
                <div className="analytics-funnel-meta">
                  <div>
                    <span className="analytics-funnel-label">{stage.label}</span>
                    <span className="analytics-funnel-desc">({stage.desc})</span>
                  </div>
                  <span className="analytics-funnel-count">
                    <strong>{count}</strong> verses ({pct}%)
                  </span>
                </div>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${pct}%`, backgroundColor: stage.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottleneck Detector — Info Cards Only ── */}
      <div className="analytics-card analytics-card--padded">
        <div className="analytics-section-header analytics-section-header--stacked">
          <h3 className="analytics-section-title">
            <AlertTriangle size={18} className="analytics-icon-amber" />
            Bottleneck Detector
          </h3>
          <p className="analytics-section-desc">
            Queue dwell counts across all 4 reviewer roles, Committee, and Final Editor.
            Use the <strong>Send WhatsApp Alert</strong> card above to nudge any team member directly.
          </p>
        </div>

        <div className="analytics-bottleneck-grid">
          {BOTTLENECK_CONFIGS.map((item) => {
            const count    = getBottleneckCount(item.key, bottlenecks, stages);
            const assigned = getAssignedMembers(item.key);
            const isHeavy    = count >= 10;
            const isModerate = count >= 5 && count < 10;
            const severityClass = isHeavy ? 'heavy' : isModerate ? 'moderate' : 'clear';

            return (
              <div
                key={item.key}
                className={`analytics-bottleneck-card analytics-bottleneck-card--${severityClass}`}
              >
                {/* Title + badge */}
                <div className="analytics-bottleneck-header">
                  <strong className="analytics-bottleneck-title">{item.title}</strong>
                  <span className={`analytics-status-badge analytics-status-badge--${severityClass}`}>
                    {isHeavy ? 'Heavy' : isModerate ? 'Moderate' : 'On Track'}
                  </span>
                </div>

                {/* Pending count */}
                <div className={`analytics-bottleneck-count${isHeavy ? ' analytics-bottleneck-count--heavy' : ''}`}>
                  {count}{' '}
                  <span className="analytics-bottleneck-count-label">verses pending</span>
                </div>

                {/* Assigned members — info only */}
                <div className="analytics-assigned">
                  {assigned.length > 0 ? (
                    <>
                      <span className="analytics-assigned-label">Assigned: </span>
                      <div className="analytics-assigned-pills">
                        {assigned.map((m) => (
                          <span key={m.email || m.name} className="analytics-member-pill">
                            <span className="analytics-member-dot" />
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="analytics-unassigned-warning">
                      ⚠️ No active team member assigned in ⚙ Config
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Weekly Summary — Copy Only ── */}
      <div className="analytics-card analytics-card--padded">
        <div className="analytics-broadcast-header">
          <div>
            <h3 className="analytics-section-title">
              <Sparkles size={18} className="analytics-icon-purple" />
              Weekly Summary Report
            </h3>
            <p className="analytics-broadcast-desc">
              Copy the formatted progress report and paste it directly into the team WhatsApp group.
            </p>
          </div>

          <button
            onClick={handleCopySummary}
            className={`analytics-btn-copy${copied ? ' analytics-btn-copy--done' : ''}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>

        {/* Preview */}
        <pre className="analytics-preview-code">
          {generateWeeklySummaryText(currentBook, analytics)}
        </pre>
      </div>

    </div>
  );
};
