/**
 * User and Team Member Display Utilities for GLBC Translation System
 */

/**
 * Strips common religious / honorific titles and generates clean, intelligent initials.
 * e.g. "Pastor Zack" -> "PZ", "Brother Kishore" -> "BK", "Sister Nancy" -> "SN", "Pastor Raju" -> "PR"
 */
export function getSmartInitials(name: string): string {
  if (!name) return '??';
  const cleaned = name
    .replace(/^(Pastor|Brother|Sister|Dr\.|Dr|Fr\.|Fr|Rev\.|Rev|Pr\.|Pr)\s+/i, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return name.slice(0, 2).toUpperCase();
  }
  const hasTitle = /^(Pastor|Brother|Sister|Dr\.|Dr|Fr\.|Fr|Rev\.|Rev|Pr\.|Pr)\s+/i.test(name);
  if (hasTitle) {
    const titleInitial = name.trim().charAt(0).toUpperCase();
    return (titleInitial + parts[0].charAt(0)).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Maps a role display string or role title to a consistent, pleasing Tailwind background color class.
 */
export function getRoleAvatarColor(roleDisplay?: string): string {
  const r = (roleDisplay || '').toLowerCase();
  if (r.includes('theo')) return 'bg-purple-600';
  if (r.includes('ortho')) return 'bg-indigo-600';
  if (r.includes('style') || r.includes('lang')) return 'bg-teal-600';
  if (r.includes('tech')) return 'bg-sky-600';
  if (r.includes('comm')) return 'bg-amber-600';
  if (r.includes('final')) return 'bg-rose-600';
  if (r.includes('draft')) return 'bg-emerald-600';
  return 'bg-blue-600';
}

/**
 * Accurately determines if a comment was authored by the currently logged-in user.
 * Compares exact names or honorific-stripped names (e.g. "Pastor Zack" vs "Zack").
 */
export function isCommentByCurrentUser(cmtAuthor?: string, currentUserName?: string): boolean {
  if (!cmtAuthor || !currentUserName) return false;
  const a = cmtAuthor.toLowerCase().trim();
  const u = currentUserName.toLowerCase().trim();
  if (a === u) return true;
  const cleanA = a.replace(/^(pastor|brother|sister|dr\.|dr|fr\.|fr|rev\.|rev|pr\.|pr)\s+/i, '').trim();
  const cleanU = u.replace(/^(pastor|brother|sister|dr\.|dr|fr\.|fr|rev\.|rev|pr\.|pr)\s+/i, '').trim();
  return cleanA.length > 0 && cleanA === cleanU;
}
