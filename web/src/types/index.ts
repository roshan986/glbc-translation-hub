export type ReviewerRole =
  | 'DRAFTER'
  | 'TECH'
  | 'STYLE'
  | 'ORTHO'
  | 'THEO'
  | 'COMM'
  | 'FINAL';

export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  email: string;
  active: boolean;
  avatar?: string;
  avatarColor?: string;
  roles?: string[]; // All assigned roles for this person across multiple Config sheet rows
}

export interface VerseConfirms {
  drafter: boolean;
  tech: boolean;
  style: boolean;
  ortho: boolean;
  theo: boolean;
  comm: boolean;
  final: boolean;
}

export interface VerseReviews {
  tech: string;
  style: string;
  ortho: string;
  theo: string;
  conclusion: string;
  final: string;
}

export interface WordPair {
  kannada: string;
  english: string;
  kannadaHtml?: string;
  englishHtml?: string;
}

export interface InvestigationNote {
  type: 'grammar' | 'variant' | 'lexical' | 'style';
  title: string;
  text: string;
  html?: string;
}

export interface RoleApprovalStatus {
  totalRequired: number;
  approvedCount: number;
  approvedMembers: string[];
  pendingMembers: string[];
  isFullyApproved: boolean;
}

export interface VerseApprovals {
  tech: RoleApprovalStatus;
  style: RoleApprovalStatus;
  ortho: RoleApprovalStatus;
  theo: RoleApprovalStatus;
  comm: RoleApprovalStatus;
}

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: string;
  avatarColor?: string;
  timeAgo: string;
  text: string;
  isApproval?: boolean;
}

export interface VerseItem {
  row: number;
  verse: string; // e.g. "Rom 1:1"
  chapter: number;
  verseNumber: number;
  status: 'Not Started' | 'Awaiting Review' | 'Under Review' | 'Awaiting Committee' | 'Needs Final' | 'Done';
  oldReading: string; // KJV
  proposed: string; // Kannada
  proposedHtml?: string;
  drafterCmt: string;
  drafterCmtHtml?: string;
  version: string;
  lastEdited: string;
  confirms: VerseConfirms;
  reviews: VerseReviews;
  wordPairs?: WordPair[];
  notes?: InvestigationNote[];
  comments?: CommentItem[];
  approvals?: VerseApprovals;
  isReferenceOnly?: boolean;
}

export interface BookAnalytics {
  book?: string;
  isUninitialized?: boolean;
  total: number;
  completed: number;
  completionRate: number;
  stages: {
    notStarted: number;
    awaitingReview: number;
    underReview: number;
    awaitingCommittee: number;
    needsFinal: number;
    done: number;
  };
  bottlenecks: {
    technical: number;
    style: number;
    orthographic: number;
    theological: number;
    committee: number;
    finalEditor: number;
  };
}

export interface RichTextRunPayload {
  text: string;
  color?: string | null;
  bold?: boolean;
  italic?: boolean;
}

export interface RichTextSectionPayload {
  text: string;
  runs: RichTextRunPayload[];
}

export interface ParsedImportVerse {
  verse: string;
  chapter: number;
  verseNumber: number;
  oldReading: string;
  oldReadingSection?: RichTextSectionPayload;
  proposed: string;
  proposedHtml?: string;
  proposedSection?: RichTextSectionPayload;
  drafterCmt: string;
  drafterCmtHtml?: string;
  drafterCmtSection?: RichTextSectionPayload;
  wordPairs?: WordPair[];
  notes?: InvestigationNote[];
  status: 'ready' | 'conflict' | 'unmatched';
  existingRow?: number;
  existingProposed?: string;
  selectedForImport: boolean;
}

export type BgTheme = 'default' | 'sepia' | 'mist' | 'obsidian';
