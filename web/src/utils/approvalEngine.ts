import type { VerseReviews, VerseConfirms, TeamMember, VerseApprovals, RoleApprovalStatus } from '../types';

interface RoleMapping {
  key: keyof VerseReviews;
  confirmKey: keyof VerseConfirms;
  roleMatch: string;
}

const ROLE_MAPPINGS: Record<keyof VerseApprovals, RoleMapping> = {
  tech: { key: 'tech', confirmKey: 'tech', roleMatch: 'technical' },
  style: { key: 'style', confirmKey: 'style', roleMatch: 'style' },
  ortho: { key: 'ortho', confirmKey: 'ortho', roleMatch: 'ortho' },
  theo: { key: 'theo', confirmKey: 'theo', roleMatch: 'theo' },
  comm: { key: 'conclusion', confirmKey: 'comm', roleMatch: 'comm' },
};

/**
 * Parses approval signatures from review columns and calculates live multi-member approval progress.
 * Rule: All active members assigned to a role must approve before the stage is considered fully approved.
 */
export function computeVerseApprovals(
  reviews: Partial<VerseReviews>,
  confirms: Partial<VerseConfirms>,
  team: TeamMember[]
): VerseApprovals {
  const result: Partial<VerseApprovals> = {};

  const roleKeys: (keyof VerseApprovals)[] = ['tech', 'style', 'ortho', 'theo', 'comm'];

  for (const rk of roleKeys) {
    const mapping = ROLE_MAPPINGS[rk];
    
    // Find all active team members assigned to this role (supporting both raw rows and unified persons with roles[])
    const assignedMembers = team.filter((m) => {
      if (m.active === false) return false;
      const allRoles = m.roles && m.roles.length > 0 ? m.roles : [m.role];
      return allRoles.some((r) => r.toLowerCase().includes(mapping.roleMatch));
    });

    const uniqueMemberNames = Array.from(new Set(assignedMembers.map((m) => m.name.trim())));
    const totalRequired = uniqueMemberNames.length;

    const cellText = reviews[mapping.key] || '';
    const isSheetFlagConfirmed = confirms[mapping.confirmKey] === true;

    const approvedMembers: string[] = [];
    const pendingMembers: string[] = [];

    // Parse each member's approval status
    for (const memberName of uniqueMemberNames) {
      // Check for approval signature in the cell
      // Patterns: "Pastor Matt: [✓ Approved]" or "Pastor Matt: Approved" or sheet confirm is true
      const regex = new RegExp(`(^|\\n)${escapeRegex(memberName)}:\\s*(\\[✓\\s*Approved\\]|Approved|approved)`, 'i');
      const hasSignature = regex.test(cellText);

      if (hasSignature || isSheetFlagConfirmed) {
        approvedMembers.push(memberName);
      } else {
        pendingMembers.push(memberName);
      }
    }

    const approvedCount = approvedMembers.length;
    const isFullyApproved = isSheetFlagConfirmed || (totalRequired > 0 && approvedCount >= totalRequired);

    const status: RoleApprovalStatus = {
      totalRequired,
      approvedCount,
      approvedMembers,
      pendingMembers,
      isFullyApproved
    };

    result[rk] = status;
  }

  return result as VerseApprovals;
}

/**
 * Formats a standardized approval signature string to log in Google Sheets.
 */
export function formatApprovalSignature(notes?: string): string {
  const cleanNotes = notes?.trim();
  if (cleanNotes) {
    return `[✓ Approved] - ${cleanNotes}`;
  }
  return `[✓ Approved]`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
