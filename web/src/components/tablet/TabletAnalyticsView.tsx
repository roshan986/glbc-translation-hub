import React, { useState, useEffect, useMemo } from 'react';
import type { BookAnalytics, TeamMember } from '../../types';
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
  X,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { generateWeeklySummaryText } from '../../services/api';
import { CoordinatorWhatsAppModal } from '../CoordinatorWhatsAppModal';
import { calculatePacingStats } from '../../utils/pacingEngine';
import { showToast } from '../../utils/toast';
import { getSmartInitials, getRoleAvatarColor } from '../../utils/userUtils';

interface TabletAnalyticsViewProps {
  analytics: BookAnalytics;
  currentBook: string;
  team: TeamMember[];
  availableBooks?: string[];
  onNavigateToSettings?: () => void;
  onRefresh?: () => void;
}

const STAGE_CONFIGS = [
  { label: '1. Not Started', desc: 'Draft text or drafter confirmation pending', key: 'notStarted' as const, color: '#94a3b8' },
  { label: '2. Awaiting Review', desc: 'Drafter confirmed (Y), waiting for 1st reviewer', key: 'awaitingReview' as const, color: '#38bdf8' },
  { label: '3. Under Active Review', desc: '1–3 reviewers confirmed (Tech, Style, Ortho, Theo)', key: 'underReview' as const, color: '#2563eb' },
  { label: '4. Awaiting Committee', desc: 'All 4 reviewers confirmed, ready for consensus', key: 'awaitingCommittee' as const, color: '#f59e0b' },
  { label: '5. Needs Final Editor', desc: 'Committee confirmed (Y), awaiting Final Editor sign-off', key: 'needsFinal' as const, color: '#ea580c' },
  { label: '6. Completed (Done)', desc: 'Final Reading entered & Final Confirm is Y', key: 'done' as const, color: '#10b981' }
] as const;

const BOTTLENECK_CONFIGS = [
  { key: 'orthographic', title: 'Orthographic Review', shortTitle: 'Orthography', icon: '📝' },
  { key: 'style',        title: 'Style & Language Review', shortTitle: 'Style', icon: '✒️' },
  { key: 'technical',   title: 'Technical Review', shortTitle: 'Technical', icon: '🏛️' },
  { key: 'theological', title: 'Theological Review', shortTitle: 'Theology', icon: '📖' },
  { key: 'committee',   title: 'Committee Consensus', shortTitle: 'Committee', icon: '👥' },
  { key: 'final',       title: 'Final Editor Sign-Off', shortTitle: 'Final Editor', icon: '✍️' }
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

interface KpiInspectionData {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  details: string[];
  actionLabel?: string;
  actionHandler?: () => void;
}

export const TabletAnalyticsView: React.FC<TabletAnalyticsViewProps> = ({
  analytics,
  currentBook,
  team,
  availableBooks,
  onNavigateToSettings,
  onRefresh
}) => {
  const { total, completed, completionRate, stages, bottlenecks } = analytics;

  const [copied, setCopied] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [inspectingKpi, setInspectingKpi] = useState<KpiInspectionData | null>(null);
  const [inspectingBottleneck, setInspectingBottleneck] = useState<{
    key: BottleneckKey;
    title: string;
    icon: string;
    count: number;
    severity: 'heavy' | 'moderate' | 'clear';
    assigned: TeamMember[];
  } | null>(null);

  // Target Date Synchronization
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

  const remaining = Math.max(0, total - completed);

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

  const inMotion = stages.awaitingReview + stages.underReview + stages.awaitingCommittee + stages.needsFinal;

  const targetStats = useMemo(() => {
    return calculatePacingStats(targetDateStr, total, completed);
  }, [targetDateStr, total, completed]);

  const handleCopySummary = async () => {
    const text = generateWeeklySummaryText(currentBook, analytics);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast('success', 'Weekly summary copied to clipboard');
    } catch {
      showToast('error', 'Could not copy summary to clipboard');
    }
  };

  const getAssignedMembers = (roleKey: string): TeamMember[] => {
    const k = roleKey.toLowerCase();
    return team.filter((m) => {
      if (m.active === false) return false;
      const combinedRoles = [...(m.roles || []), m.role].map((r) => r.toLowerCase());
      return combinedRoles.some((r) => {
        if (k === 'orthographic') return r.includes('ortho');
        if (k === 'style') return r.includes('style') || r.includes('lang');
        if (k === 'technical') return r.includes('tech');
        if (k === 'theological') return r.includes('theo');
        if (k === 'committee') return r.includes('comm');
        if (k === 'final') return r.includes('final') || r.includes('edit');
        return false;
      });
    });
  };

  // Check if Book is Uninitialized
  const isBookUninitialized =
    analytics.isUninitialized ||
    (availableBooks && availableBooks.length > 0 && !availableBooks.includes(currentBook));

  if (isBookUninitialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', paddingBottom: '5rem' }}>
        <div style={{
          padding: '2.5rem 1.5rem',
          backgroundColor: 'var(--theme-card-bg, #ffffff)',
          borderRadius: '0.75rem',
          border: '1px dashed var(--theme-border, #e2e8f0)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '3.75rem',
            height: '3.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--theme-text)' }}>
              {currentBook} has not been initialized yet
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--theme-text-muted)', lineHeight: 1.5, maxWidth: '28rem' }}>
              No worksheet for {currentBook} exists in Google Sheets yet. Initialize this book in Settings to track live analytics.
            </p>
          </div>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer'
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

  // 9 KPI Metric Items
  const kpiItems = [
    {
      id: 'target',
      title: 'TARGET COMPLETION',
      icon: <Target size={13} />,
      value: targetStats.hasTargetDate
        ? targetStats.isComplete
          ? 'Goal Reached 🎉'
          : targetStats.isPast
          ? `${targetStats.daysOverdue}d overdue`
          : `${targetStats.daysRemaining}d left`
        : '—',
      sub: targetStats.hasTargetDate
        ? `${targetStats.requiredDailyPace} v/d pace · Target: ${targetStats.formattedTarget}`
        : `No target date set for ${currentBook}`,
      color: '#e11d48',
      details: targetStats.hasTargetDate
        ? [
            `Target Deadline: ${targetStats.formattedTarget}`,
            targetStats.isPast
              ? `Elapsed overdue by ${targetStats.daysOverdue} calendar days`
              : `${targetStats.daysRemaining} calendar days remaining to reach goal`,
            `Required Velocity: ${targetStats.requiredDailyPace} verses per day`,
            `Completed: ${completed} of ${total} verses (${completionRate}%)`
          ]
        : ['Setting a target date activates the daily pacing calculation engine.', 'Configurable in Settings > Book & Sheet Setup.'],
      actionLabel: 'Configure Target Date in Settings',
      actionHandler: onNavigateToSettings
    },
    {
      id: 'completed',
      title: 'COMPLETED (DONE)',
      icon: <CheckCircle2 size={13} />,
      value: completed,
      sub: `${completionRate}% Milestone Reached`,
      color: '#10b981',
      details: [
        `Total Completed: ${completed} verses`,
        `Milestone Progress: ${completionRate}% of canonical ${currentBook}`,
        `Sign-off Status: Final Reading verified & Final Confirm marked 'Y'`,
        `Remaining to complete: ${remaining} verses`
      ]
    },
    {
      id: 'total',
      title: 'TOTAL VERSES',
      icon: <BookOpen size={13} />,
      value: total,
      sub: `Canonical Book of ${currentBook}`,
      color: '#64748b',
      details: [
        `Canonical Length: ${total} verses in ${currentBook}`,
        `Source Text: King James Version (KJV) 1611`,
        `Target Language: Kannada Translation`
      ]
    },
    {
      id: 'pipeline',
      title: 'IN PIPELINE',
      icon: <TrendingUp size={13} />,
      value: inMotion,
      sub: `${stages.underReview} reviewing · ${stages.awaitingCommittee + stages.needsFinal} editorial`,
      color: '#2563eb',
      details: [
        `Active Pipeline Verses: ${inMotion}`,
        `• Under Active Review: ${stages.underReview} verses (1–3 disciplines approved)`,
        `• Awaiting Committee: ${stages.awaitingCommittee} verses (all 4 disciplines approved)`,
        `• Awaiting Final Editor: ${stages.needsFinal} verses (Committee approved)`,
        `• Waiting for 1st Reviewer: ${stages.awaitingReview} verses`
      ]
    },
    {
      id: 'not_started',
      title: 'NOT STARTED',
      icon: <Clock size={13} />,
      value: stages.notStarted,
      sub: 'Draft text or confirm pending',
      color: '#64748b',
      details: [
        `Verses Not Started: ${stages.notStarted}`,
        'Draft text missing or drafter has not yet marked confirmation (Col F = "Y")'
      ]
    },
    {
      id: 'editorial',
      title: 'EDITORIAL SIGN-OFF',
      icon: <Sparkles size={13} />,
      value: stages.awaitingCommittee + stages.needsFinal,
      sub: 'Committee & Final Editor queue',
      color: '#f59e0b',
      details: [
        `Total in Editorial Pipeline: ${stages.awaitingCommittee + stages.needsFinal}`,
        `• Awaiting Committee Consensus: ${stages.awaitingCommittee} verses`,
        `• Awaiting Final Editor Sign-Off: ${stages.needsFinal} verses`
      ]
    },
    {
      id: 'team',
      title: 'ACTIVE TEAM',
      icon: <Users size={13} />,
      value: uniqueActiveMembers,
      sub: `Across ${team.length} role assignments`,
      color: '#0d9488',
      details: [
        `Active Team Members: ${uniqueActiveMembers} unique scholars`,
        `Total Role Slots: ${team.length} configured in ⚙ Config`
      ],
      actionLabel: 'View Team Directory in Settings',
      actionHandler: onNavigateToSettings
    },
    {
      id: 'remaining',
      title: 'REMAINING',
      icon: <Zap size={13} />,
      value: remaining,
      sub: targetStats.hasTargetDate
        ? `${targetStats.daysRemaining}d left to target`
        : `${completed} of ${total} finished`,
      color: '#7c3aed',
      details: [
        `Verses Remaining: ${remaining} of ${total}`,
        `Percentage Remaining: ${total > 0 ? 100 - completionRate : 0}%`
      ]
    },
    {
      id: 'pace',
      title: 'REQUIRED DAILY PACE',
      icon: <Clock size={13} />,
      value: targetStats.hasTargetDate ? `${targetStats.requiredDailyPace} v/d` : '—',
      sub: targetStats.hasTargetDate ? 'Verses / day to meet target' : 'Set target date in Settings',
      color: '#4f46e5',
      details: [
        targetStats.hasTargetDate
          ? `Daily Burn-Down Velocity: ${targetStats.requiredDailyPace} verses per calendar day`
          : 'Pacing calculation requires a target completion date.'
      ],
      actionLabel: 'Configure Target Date in Settings',
      actionHandler: onNavigateToSettings
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '5.5rem' }}>

      {/* ── 1. Tablet Header Banner ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        borderRadius: '0.625rem',
        border: '1px solid var(--theme-border, #e2e8f0)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.6875rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
            COORDINATOR COMMAND CENTER
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: 'var(--theme-text)' }}>
            Live Translation Analytics: {currentBook}
          </h2>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--theme-border, #cbd5e1)',
              background: 'var(--theme-box-bg, #f8fafc)',
              color: 'var(--theme-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* ── 2. Balanced 3x3 KPI Metrics Grid for Tablet ── */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.25rem 0.35rem 0.25rem'
        }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Core Metrics (Tap any tile for breakdown)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem'
        }}>
          {kpiItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setInspectingKpi(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setInspectingKpi(item); }}
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--theme-card-bg, #ffffff)',
                border: '1px solid var(--theme-border, #e2e8f0)',
                borderRadius: '0.625rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.4rem',
                transition: 'transform 0.1s ease, border-color 0.15s ease'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: item.color,
                  letterSpacing: '0.04em'
                }}>
                  {item.icon}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: item.color,
                  lineHeight: 1.2,
                  marginTop: '0.25rem'
                }}>
                  {item.value}
                </div>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--theme-text-muted)',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. WhatsApp Quick Alert Banner ── */}
      <button
        type="button"
        onClick={() => setShowWhatsAppModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.25rem',
          backgroundColor: '#25D366',
          color: '#ffffff',
          border: 'none',
          borderRadius: '0.625rem',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            color: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.125rem'
          }}>
            ↗
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, lineHeight: 1.2 }}>
              Send WhatsApp Coordinator Alert
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              Instantly notify active reviewers and editorial stages on WhatsApp
            </div>
          </div>
        </div>
        <ArrowUpRight size={20} />
      </button>

      {/* ── 4. Full 6-Stage Translation Funnel ── */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        border: '1px solid var(--theme-border, #e2e8f0)',
        borderRadius: '0.625rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <TrendingUp size={18} color="#2563eb" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
              Full 6-Stage Translation Funnel
            </h3>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#10b981' }}>
            Overall: {completionRate}% Complete
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {STAGE_CONFIGS.map((stage) => {
            const count = stages[stage.key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--theme-text)' }}>
                    {stage.label} <span style={{ color: 'var(--theme-text-muted)', fontWeight: 400 }}>({stage.desc})</span>
                  </span>
                  <span style={{ color: 'var(--theme-text-muted)' }}>
                    <strong>{count}</strong> verses ({pct}%)
                  </span>
                </div>
                <div style={{
                  height: '7px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--theme-box-bg, #e2e8f0)',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: stage.color,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Bottleneck Detector (3x2 Balanced Grid for Tablet) ── */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        border: '1px solid var(--theme-border, #e2e8f0)',
        borderRadius: '0.625rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          marginBottom: '0.875rem'
        }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
              Bottleneck Detector
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
              Queue dwell counts across all 4 reviewer disciplines, Committee, and Final Editor
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem'
        }}>
          {BOTTLENECK_CONFIGS.map((item) => {
            const count = getBottleneckCount(item.key, bottlenecks, stages);
            const assigned = getAssignedMembers(item.key);
            const isHeavy = count >= 10;
            const isModerate = count >= 5 && count < 10;
            const severity: 'heavy' | 'moderate' | 'clear' = isHeavy ? 'heavy' : isModerate ? 'moderate' : 'clear';
            const badgeColor = isHeavy ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
            const badgeBg = isHeavy ? 'rgba(239, 68, 68, 0.15)' : isModerate ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';

            return (
              <div
                key={item.key}
                onClick={() => setInspectingBottleneck({
                  key: item.key,
                  title: item.title,
                  icon: item.icon,
                  count,
                  severity,
                  assigned
                })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setInspectingBottleneck({
                      key: item.key,
                      title: item.title,
                      icon: item.icon,
                      count,
                      severity,
                      assigned
                    });
                  }
                }}
                style={{
                  padding: '0.875rem',
                  backgroundColor: 'var(--theme-card-bg, #ffffff)',
                  border: `1px solid ${isHeavy ? 'rgba(239, 68, 68, 0.35)' : 'var(--theme-border, #e2e8f0)'}`,
                  borderRadius: '0.625rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--theme-text)' }}>
                      {item.icon} {item.shortTitle}
                    </span>
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px',
                      backgroundColor: badgeBg,
                      color: badgeColor
                    }}>
                      {isHeavy ? 'Heavy' : isModerate ? 'Moderate' : 'On Track'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: badgeColor, lineHeight: 1.2 }}>
                    {count} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--theme-text-muted)' }}>verses</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                  {assigned.length > 0 ? (
                    <span style={{ color: 'var(--theme-text)' }}>
                      👤 {assigned.map((m) => m.name.split(' ')[0]).join(', ')}
                    </span>
                  ) : (
                    <span style={{ color: '#d97706' }}>⚠️ Unassigned in Config</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. Weekly Summary Report Preview & Copy ── */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--theme-card-bg, #ffffff)',
        border: '1px solid var(--theme-border, #e2e8f0)',
        borderRadius: '0.625rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.625rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={18} color="#7c3aed" />
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, margin: 0, color: 'var(--theme-text)' }}>
                Weekly Summary Report
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)' }}>
                Copy formatted weekly milestone report to clipboard for team WhatsApp group
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              backgroundColor: copied ? '#10b981' : '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>
        </div>

        <pre style={{
          margin: 0,
          padding: '0.75rem',
          backgroundColor: 'var(--theme-box-bg, #f1f5f9)',
          color: 'var(--theme-text)',
          borderRadius: '0.375rem',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          {generateWeeklySummaryText(currentBook, analytics)}
        </pre>
      </div>

      {/* ── KPI Detail Inspection Popover Modal ── */}
      {inspectingKpi && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.875rem',
            width: '100%',
            maxWidth: '420px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: inspectingKpi.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Metric Detail
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: 'var(--theme-text)' }}>
                  {inspectingKpi.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingKpi(null)}
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

            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--theme-box-bg, #f8fafc)',
              border: '1px solid var(--theme-border, #e2e8f0)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: inspectingKpi.color }}>
                {inspectingKpi.value}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--theme-text-muted)', marginTop: '0.25rem' }}>
                {inspectingKpi.subtitle}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {inspectingKpi.details.map((line, idx) => (
                <div key={idx} style={{ fontSize: '0.8125rem', color: 'var(--theme-text)', lineHeight: 1.45 }}>
                  {line}
                </div>
              ))}
            </div>

            {inspectingKpi.actionLabel && inspectingKpi.actionHandler && (
              <button
                type="button"
                onClick={() => {
                  setInspectingKpi(null);
                  inspectingKpi.actionHandler!();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Sliders size={15} />
                <span>{inspectingKpi.actionLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInspectingKpi(null)}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Bottleneck Action Modal ── */}
      {inspectingBottleneck && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--theme-card-bg, #ffffff)',
            borderRadius: '0.875rem',
            width: '100%',
            maxWidth: '440px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: inspectingBottleneck.severity === 'heavy' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: inspectingBottleneck.severity === 'heavy' ? '#ef4444' : '#d97706',
                  textTransform: 'uppercase'
                }}>
                  {inspectingBottleneck.severity} Bottleneck
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0 0 0', color: 'var(--theme-text)' }}>
                  {inspectingBottleneck.icon} {inspectingBottleneck.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBottleneck(null)}
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

            <div style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--theme-box-bg, #f8fafc)',
              border: '1px solid var(--theme-border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--theme-text-muted)' }}>
                Verses Awaiting Sign-Off:
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: inspectingBottleneck.severity === 'heavy' ? '#ef4444' : '#d97706' }}>
                {inspectingBottleneck.count} verses
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                Assigned Team Members ({inspectingBottleneck.assigned.length})
              </div>

              {inspectingBottleneck.assigned.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {inspectingBottleneck.assigned.map((member) => (
                    <div
                      key={member.email || member.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid var(--theme-border, #e2e8f0)',
                        backgroundColor: 'var(--theme-card-bg, #ffffff)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          backgroundColor: getRoleAvatarColor(member.role),
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {getSmartInitials(member.name)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--theme-text)' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--theme-text-muted)' }}>
                            {member.phone || member.email}
                          </div>
                        </div>
                      </div>

                      {member.phone && (
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${member.name}, you have ${inspectingBottleneck.count} verses pending in ${inspectingBottleneck.title} for ${currentBook}. Please review in GLBC translation workspace.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#25D366',
                            color: '#ffffff',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={12} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '0.875rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#d97706',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4
                }}>
                  ⚠️ No active team member is currently assigned to this role in ⚙ Config.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setInspectingBottleneck(null)}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Coordinator WhatsApp Modal ── */}
      {showWhatsAppModal && (
        <CoordinatorWhatsAppModal
          analytics={analytics}
          book={currentBook}
          team={team}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

    </div>
  );
};
