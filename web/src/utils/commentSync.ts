import type { CommentItem, VerseReviews, ReviewerRole } from '../types';

interface DisciplineConfig {
  key: keyof VerseReviews;
  discipline: string;
  roleName: string;
  avatarColor: string;
}

const DISCIPLINES: DisciplineConfig[] = [
  { key: 'tech', discipline: 'Technical', roleName: 'Technical Reviewer', avatarColor: 'bg-blue-600' },
  { key: 'style', discipline: 'Style & Language', roleName: 'Style & Language Reviewer', avatarColor: 'bg-amber-600' },
  { key: 'ortho', discipline: 'Orthographic', roleName: 'Orthographic Reviewer', avatarColor: 'bg-indigo-600' },
  { key: 'theo', discipline: 'Theological', roleName: 'Theological Reviewer', avatarColor: 'bg-rose-600' },
  { key: 'conclusion', discipline: 'Committee', roleName: 'Committee', avatarColor: 'bg-purple-600' },
  { key: 'final', discipline: 'Final Editor', roleName: 'Final Editor', avatarColor: 'bg-emerald-600' },
];

/**
 * Parses all review columns from Google Sheets into structured CommentItem objects.
 * Handles both web-app generated comments ("Pastor Raju: hello") and direct sheet entries ("test").
 */
export function parseAllReviewsToComments(reviews?: Partial<VerseReviews>, verseRef = 'verse'): CommentItem[] {
  if (!reviews) return [];

  const comments: CommentItem[] = [];

  for (const disc of DISCIPLINES) {
    const rawVal = reviews[disc.key];
    if (!rawVal || typeof rawVal !== 'string' || !rawVal.trim()) continue;

    // Split cell into individual comment blocks by double newlines, or single newlines if no double newlines exist
    const rawBlocks = rawVal.includes('\n\n')
      ? rawVal.split(/\n\s*\n/)
      : rawVal.split(/\n/);

    for (let i = 0; i < rawBlocks.length; i++) {
      const block = rawBlocks[i].trim();
      if (!block) continue;

      // Check if block starts with "Author Name: Comment Text"
      const authorMatch = block.match(/^([A-Za-z0-9\s.]+?):\s*([\s\S]+)$/);

      if (authorMatch) {
        const authorName = authorMatch[1].trim();
        let text = authorMatch[2].trim();
        // Strip legacy or accidental "[Request Edit]" prefixes
        text = text.replace(/^\[Request Edit\]\s*[-–:]?\s*/i, '').trim();

        const isApproval = /\[✓\s*Approved\]|^Approved/i.test(text);
        if (isApproval) {
          text = text.replace(/^\[✓\s*Approved\]\s*[-–:]?\s*/i, '').trim() || 'Approved';
        }

        comments.push({
          id: `${verseRef}-${disc.key}-${i}`,
          authorName,
          authorRole: disc.roleName,
          avatarColor: disc.avatarColor,
          timeAgo: 'Saved in Sheet',
          text,
          isApproval
        });
      } else {
        let blockText = block.replace(/^\[Request Edit\]\s*[-–:]?\s*/i, '').trim();
        // Direct sheet entry without author name prefix (e.g. "test")
        comments.push({
          id: `${verseRef}-${disc.key}-${i}`,
          authorName: `${disc.roleName}`,
          authorRole: disc.roleName,
          avatarColor: disc.avatarColor,
          timeAgo: 'Direct Sheet Entry',
          text: blockText
        });
      }
    }
  }

  return comments;
}

/**
 * Maps a review role to the corresponding key in VerseReviews
 */
export function roleToReviewKey(role: ReviewerRole): keyof VerseReviews {
  switch (role) {
    case 'TECH': return 'tech';
    case 'STYLE': return 'style';
    case 'ORTHO': return 'ortho';
    case 'THEO': return 'theo';
    case 'COMM': return 'conclusion';
    case 'FINAL': return 'final';
    default: return 'tech';
  }
}
