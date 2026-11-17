/**
 * GLBC Translation System — Unified Target Pacing & Velocity Engine
 * Single source of truth for target date pacing calculations across Focus Mode,
 * Coordinator Analytics, and Settings Hub.
 */

export interface PacingStats {
  hasTargetDate: boolean;
  targetDateStr: string;
  daysRemaining: number;
  daysOverdue: number;
  isPast: boolean;
  isComplete: boolean;
  requiredDailyPace: string;
  formattedTarget: string;
  status: 'complete' | 'overdue' | 'high_pace' | 'on_track' | 'unset';
}

/**
 * Calculates unified target pacing, countdown days, and required daily pace.
 * Returns clean 'unset' status if no target date is configured.
 */
export function calculatePacingStats(
  targetDateStr: string | null | undefined,
  totalVerses: number,
  completedVerses: number
): PacingStats {
  const isComplete = totalVerses > 0 && completedVerses >= totalVerses;

  if (!targetDateStr || !targetDateStr.trim()) {
    return {
      hasTargetDate: false,
      targetDateStr: '',
      daysRemaining: 0,
      daysOverdue: 0,
      isPast: false,
      isComplete,
      requiredDailyPace: '0',
      formattedTarget: '',
      status: isComplete ? 'complete' : 'unset'
    };
  }

  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) {
    return {
      hasTargetDate: false,
      targetDateStr: '',
      daysRemaining: 0,
      daysOverdue: 0,
      isPast: false,
      isComplete,
      requiredDailyPace: '0',
      formattedTarget: '',
      status: isComplete ? 'complete' : 'unset'
    };
  }

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isPast = daysRemaining < 0;
  const daysOverdue = Math.abs(daysRemaining);

  const remainingVerses = Math.max(0, totalVerses - completedVerses);

  const requiredDailyPace = daysRemaining > 0
    ? (remainingVerses / daysRemaining).toFixed(1)
    : remainingVerses > 0 ? remainingVerses.toFixed(0) : '0';

  const formattedTarget = target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  let status: PacingStats['status'] = 'on_track';
  if (isComplete) {
    status = 'complete';
  } else if (isPast) {
    status = 'overdue';
  } else if (parseFloat(requiredDailyPace) > 15) {
    status = 'high_pace';
  } else {
    status = 'on_track';
  }

  return {
    hasTargetDate: true,
    targetDateStr,
    daysRemaining,
    daysOverdue,
    isPast,
    isComplete,
    requiredDailyPace,
    formattedTarget,
    status
  };
}
