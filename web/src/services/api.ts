import type {
  VerseItem,
  TeamMember,
  BookAnalytics,
  ReviewerRole,
  RichTextSectionPayload,
  TeamPermissionsMap,
  PermissionsApiResponse
} from '../types';
import { SAMPLE_VERSES, SAMPLE_TEAM, SAMPLE_ANALYTICS } from '../data/sampleData';
import { parseAllReviewsToComments } from '../utils/commentSync';
import { computeVerseApprovals } from '../utils/approvalEngine';
import { getKjvChapterVerses, getBookTotalVerses } from './kjvService';

let cachedTeam: TeamMember[] = SAMPLE_TEAM;
let cachedActiveBooks: string[] = ['Romans'];

// In-memory Verse Cache: key = `${book.toLowerCase()}:${chapter}`
const verseMemoryCache = new Map<string, VerseItem[]>();

function getSessionCacheKey(book: string, chapter: number): string {
  return `glbc_verses_${book.toLowerCase()}_${chapter}`;
}

export function clearVerseCache(book?: string): void {
  if (book) {
    const prefix = `${book.toLowerCase()}:`;
    for (const key of verseMemoryCache.keys()) {
      if (key.startsWith(prefix)) verseMemoryCache.delete(key);
    }
    if (typeof window !== 'undefined') {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(`glbc_verses_${book.toLowerCase()}_`)) {
            sessionStorage.removeItem(k);
          }
        }
      } catch (e) {}
    }
  } else {
    verseMemoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('glbc_verses_')) {
            sessionStorage.removeItem(k);
          }
        }
      } catch (e) {}
    }
  }
}

export function updateVerseInCache(book: string, chapter: number, updatedVerse: VerseItem): void {
  const key = `${book.toLowerCase()}:${chapter}`;
  const existing = verseMemoryCache.get(key);
  if (existing) {
    const idx = existing.findIndex((v) => v.row === updatedVerse.row || v.verse === updatedVerse.verse);
    if (idx !== -1) {
      existing[idx] = updatedVerse;
      verseMemoryCache.set(key, [...existing]);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const sKey = getSessionCacheKey(book, chapter);
      const raw = sessionStorage.getItem(sKey);
      if (raw) {
        const parsed: VerseItem[] = JSON.parse(raw);
        const idx = parsed.findIndex((v) => v.row === updatedVerse.row || v.verse === updatedVerse.verse);
        if (idx !== -1) {
          parsed[idx] = updatedVerse;
          sessionStorage.setItem(sKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {}
  }
}

export function isBookInActiveSheets(book: string): boolean {
  const clean = book.trim().toLowerCase();
  return cachedActiveBooks.some((b) => b.trim().toLowerCase() === clean);
}

function filterValidBookNames(books: string[]): string[] {
  return books.filter((b) => {
    if (!b || typeof b !== 'string') return false;
    const clean = b.trim();
    // Exclude default Google Sheet names like "Sheet5", "Sheet 6", "⚙ Config"
    if (/^sheet\s*\d+$/i.test(clean)) return false;
    if (clean.toLowerCase().includes('config')) return false;
    return true;
  });
}

const ENV_APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

export function getAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('glbc_apps_script_url');
    if (saved && saved.startsWith('https://script.google.com')) return saved;
  }
  return ENV_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('glbc_apps_script_url', url.trim());
  }
}

export const isLiveApiConfigured = (): boolean => {
  const url = getAppsScriptUrl();
  return typeof url === 'string' && url.startsWith('https://script.google.com');
};

let currentIdToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  currentIdToken = token;
}

export function getApiAuthToken(): string | null {
  return currentIdToken;
}

export async function testConnection(testUrl?: string): Promise<{ success: boolean; books?: string[]; error?: string }> {
  const targetUrl = (testUrl || getAppsScriptUrl()).trim();
  if (!targetUrl.startsWith('https://script.google.com')) {
    return { success: false, error: 'URL must start with https://script.google.com/macros/s/...' };
  }

  try {
    const res = await fetch(`${targetUrl}?action=getBooks`, { redirect: 'follow' });
    const data = await res.json();
    if (data.success && Array.isArray(data.books)) {
      const validBooks = filterValidBookNames(data.books);
      cachedActiveBooks = validBooks.length > 0 ? validBooks : ['Romans'];
      return { success: true, books: validBooks };
    }
    return { success: false, error: data.error || 'Invalid API response format' };
  } catch (err) {
    return { success: false, error: 'Network error or CORS block: ' + String(err) };
  }
}

export async function fetchBooks(): Promise<string[]> {
  const url = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    cachedActiveBooks = ['Romans'];
    return ['Romans'];
  }
  try {
    const res = await fetch(`${url}?action=getBooks`, { redirect: 'follow' });
    const data = await res.json();
    if (data.success && Array.isArray(data.books)) {
      const validBooks = filterValidBookNames(data.books);
      cachedActiveBooks = validBooks.length > 0 ? validBooks : ['Romans'];
      return cachedActiveBooks;
    }
  } catch (err) {
    console.warn('Failed to fetch books from Apps Script, falling back to local list:', err);
  }
  cachedActiveBooks = ['Romans'];
  return ['Romans'];
}

export function unifyTeamMembers(rawMembers: TeamMember[]): TeamMember[] {
  const map = new Map<string, TeamMember>();

  for (const m of rawMembers) {
    if (!m.name) continue;
    // Use email as primary key, or name if email is empty
    const key = (m.email && m.email.trim()) ? m.email.trim().toLowerCase() : m.name.trim().toLowerCase();
    
    if (map.has(key)) {
      const existing = map.get(key)!;
      const combinedRoles = existing.roles ? [...existing.roles] : [existing.role];
      if (m.role && !combinedRoles.includes(m.role)) {
        combinedRoles.push(m.role);
      }
      existing.roles = combinedRoles;
      if (!existing.phone && m.phone) existing.phone = m.phone;
      if (m.active !== undefined) existing.active = m.active !== false;
    } else {
      map.set(key, {
        ...m,
        active: m.active !== false,
        roles: m.roles ? [...m.roles] : (m.role ? [m.role] : [])
      });
    }
  }

  return Array.from(map.values());
}

export async function fetchConfig(): Promise<TeamMember[]> {
  const url = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    cachedTeam = unifyTeamMembers(SAMPLE_TEAM);
    return cachedTeam;
  }
  try {
    const res = await fetch(`${url}?action=getConfig`, { redirect: 'follow' });
    const data = await res.json();
    if (data.success && Array.isArray(data.team)) {
      cachedTeam = unifyTeamMembers(data.team);
      return cachedTeam;
    }
  } catch (err) {
    console.warn('Failed to fetch config from Apps Script:', err);
  }
  cachedTeam = unifyTeamMembers(SAMPLE_TEAM);
  return cachedTeam;
}

function normalizeVerse(v: VerseItem): VerseItem {
  const parsedComments = parseAllReviewsToComments(v.reviews, v.verse || String(v.row));
  const existingComments = Array.isArray(v.comments) ? v.comments : [];
  
  // Combine parsed comments from reviews with any existing comments without duplicating
  const seenTexts = new Set<string>();
  const mergedComments = [...existingComments, ...parsedComments].filter((c) => {
    const key = `${c.authorName.toLowerCase()}-${c.text.trim()}`;
    if (seenTexts.has(key)) return false;
    seenTexts.add(key);
    return true;
  });

  const approvals = computeVerseApprovals(v.reviews, v.confirms, cachedTeam);

  return {
    ...v,
    comments: mergedComments,
    approvals
  };
}

export async function getCanonicalReferenceVerses(book: string, chapter = 1): Promise<VerseItem[]> {
  const kjvVerses = await getKjvChapterVerses(book, chapter);
  if (!kjvVerses || kjvVerses.length === 0) {
    return [];
  }
  return kjvVerses.map((kv) => ({
    row: kv.verseNumber + 1,
    verse: `${book} ${chapter}:${kv.verseNumber}`,
    chapter,
    verseNumber: kv.verseNumber,
    status: 'Not Started' as const,
    oldReading: kv.text,
    proposed: '',
    drafterCmt: '',
    version: '1.0',
    lastEdited: '',
    confirms: {
      drafter: false,
      tech: false,
      style: false,
      ortho: false,
      theo: false,
      comm: false,
      final: false
    },
    reviews: {
      tech: '',
      style: '',
      ortho: '',
      theo: '',
      conclusion: '',
      final: ''
    },
    comments: [],
    isReferenceOnly: true
  }));
}

export async function fetchVerses(book = 'Romans', chapter?: number): Promise<VerseItem[]> {
  const chNum = chapter || 1;
  const memKey = `${book.toLowerCase()}:${chNum}`;

  // 1. Instant In-Memory Cache Check (0ms)
  const memCached = verseMemoryCache.get(memKey);
  if (memCached && memCached.length > 0) {
    return memCached;
  }

  // 2. Instant Session Storage Check (0ms)
  if (typeof window !== 'undefined') {
    try {
      const sRaw = sessionStorage.getItem(getSessionCacheKey(book, chNum));
      if (sRaw) {
        const parsed = JSON.parse(sRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          verseMemoryCache.set(memKey, parsed);
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 3. Demo / Local mode fallback
  if (!isLiveApiConfigured()) {
    if (book.toLowerCase() === 'romans') {
      const raw = SAMPLE_VERSES.filter((v) => v.chapter === chNum);
      const normalized = raw.map(normalizeVerse);
      verseMemoryCache.set(memKey, normalized);
      return normalized;
    }
    const refVerses = await getCanonicalReferenceVerses(book, chNum);
    verseMemoryCache.set(memKey, refVerses);
    return refVerses;
  }

  // 4. Performance Optimizer: If book is not an initialized active translation sheet,
  // skip the 2.4s Apps Script network roundtrip and load canonical reference verses instantly!
  if (!isBookInActiveSheets(book) && book.toLowerCase() !== 'romans') {
    const refVerses = await getCanonicalReferenceVerses(book, chNum);
    verseMemoryCache.set(memKey, refVerses);
    return refVerses;
  }

  // 5. Live Apps Script Network Fetch for Active Translation Sheets
  try {
    const endpoint = getAppsScriptUrl();
    const url = new URL(endpoint);
    url.searchParams.set('action', 'getVerses');
    url.searchParams.set('book', book);
    url.searchParams.set('chapter', String(chNum));

    const res = await fetch(url.toString(), { redirect: 'follow' });
    const data = await res.json();
    if (data.success && Array.isArray(data.verses) && data.verses.length > 0) {
      const normalized = data.verses.map(normalizeVerse);
      verseMemoryCache.set(memKey, normalized);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(getSessionCacheKey(book, chNum), JSON.stringify(normalized));
        } catch (e) {}
      }
      return normalized;
    }
  } catch (err) {
    console.warn('Failed to fetch verses from Apps Script:', err);
  }

  // Fallback: If Romans, use sample data; otherwise load authentic canonical KJV verses for this book/chapter
  if (book.toLowerCase() === 'romans') {
    const fallback = SAMPLE_VERSES.filter((v) => v.chapter === chNum).map(normalizeVerse);
    verseMemoryCache.set(memKey, fallback);
    return fallback;
  }
  const fallbackRef = await getCanonicalReferenceVerses(book, chNum);
  verseMemoryCache.set(memKey, fallbackRef);
  return fallbackRef;
}

export async function submitReview(payload: {
  book: string;
  row: number;
  role: ReviewerRole;
  comment?: string;
  confirm?: 'Y' | 'N';
  userName: string;
  userEmail: string;
}): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    // Optimistic local update simulation
    return { success: true, newStatus: payload.confirm === 'Y' ? 'Under Review' : 'Needs Review' };
  }

  try {
    // text/plain avoids CORS preflight OPTIONS request rejected by Apps Script
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'submitReview',
        idToken: currentIdToken || undefined,
        ...payload
      }),
      redirect: 'follow'
    });
    return await res.json();
  } catch (err) {
    console.error('Submit review error:', err);
    return { success: false, error: String(err) };
  }
}

export async function submitFinal(payload: {
  book: string;
  row: number;
  finalReading: string;
  confirm?: 'Y' | 'N';
}): Promise<{ success: boolean; newStatus?: string; locked?: boolean; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    return {
      success: true,
      newStatus: payload.confirm === 'Y' ? 'Done' : 'Needs Final',
      locked: payload.confirm === 'Y'
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'submitFinal',
        idToken: currentIdToken || undefined,
        ...payload
      }),
      redirect: 'follow'
    });
    return await res.json();
  } catch (err) {
    console.error('Submit final error:', err);
    return { success: false, error: String(err) };
  }
}

export async function importVersesApi(payload: {
  book: string;
  verses: Array<{
    row?: number;
    verse: string;
    oldReading?: string;
    oldReadingSection?: RichTextSectionPayload;
    proposed: string;
    proposedSection?: RichTextSectionPayload;
    drafterCmt?: string;
    drafterCmtSection?: RichTextSectionPayload;
  }>;
}): Promise<{ success: boolean; importedCount?: number; newRowsCreated?: number; message?: string; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    clearVerseCache(payload.book);
    const newRows = payload.verses.filter((v) => !v.row).length;
    return {
      success: true,
      importedCount: payload.verses.length,
      newRowsCreated: newRows,
      message: `Demo Mode: Successfully simulated import of ${payload.verses.length} verse(s).`
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'importVerses',
        idToken: currentIdToken || undefined,
        ...payload
      }),
      redirect: 'follow'
    });
    const result = await res.json();
    if (result.success) {
      clearVerseCache(payload.book);
    }
    return result;
  } catch (err) {
    console.error('Import verses error:', err);
    return { success: false, error: String(err) };
  }
}

export async function fetchAnalytics(book = 'Romans'): Promise<BookAnalytics> {
  const endpoint = getAppsScriptUrl();
  const total = getBookTotalVerses(book);

  if (!isLiveApiConfigured()) {
    if (book.toLowerCase().includes('romans')) {
      return {
        ...SAMPLE_ANALYTICS,
        book,
        total,
        isUninitialized: false
      };
    }
    return {
      book,
      isUninitialized: true,
      total,
      completed: 0,
      completionRate: 0,
      stages: {
        notStarted: total,
        awaitingReview: 0,
        underReview: 0,
        awaitingCommittee: 0,
        needsFinal: 0,
        done: 0
      },
      bottlenecks: {
        technical: 0,
        style: 0,
        orthographic: 0,
        theological: 0,
        committee: 0,
        finalEditor: 0
      }
    };
  }

  try {
    const res = await fetch(`${endpoint}?action=getAnalytics&book=${encodeURIComponent(book)}`, { redirect: 'follow' });
    const data = await res.json();
    if (data.success) {
      return {
        book,
        isUninitialized: false,
        total: data.total || total,
        completed: data.completed || 0,
        completionRate: data.completionRate || 0,
        stages: data.stages,
        bottlenecks: data.bottlenecks
      };
    }
  } catch (err) {
    console.warn('Failed to fetch analytics:', err);
  }

  // If sheet not found in backend or error occurred, treat as uninitialized book
  return {
    book,
    isUninitialized: true,
    total,
    completed: 0,
    completionRate: 0,
    stages: {
      notStarted: total,
      awaitingReview: 0,
      underReview: 0,
      awaitingCommittee: 0,
      needsFinal: 0,
      done: 0
    },
    bottlenecks: {
      technical: 0,
      style: 0,
      orthographic: 0,
      theological: 0,
      committee: 0,
      finalEditor: 0
    }
  };
}

export async function syncProtectionsApi(): Promise<{ success: boolean; message?: string; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    return {
      success: true,
      message: 'Demo Mode: Column protections simulated as synced across 3 sheets.'
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'syncProtections' }),
      redirect: 'follow'
    });
    return await res.json();
  } catch (err) {
    console.error('Sync protections API error:', err);
    return { success: false, error: String(err) };
  }
}

export async function initBookSheetApi(bookName: string): Promise<{ success: boolean; book?: string; message?: string; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    if (!cachedActiveBooks.some((b) => b.toLowerCase() === bookName.toLowerCase())) {
      cachedActiveBooks.push(bookName);
    }
    clearVerseCache(bookName);
    return {
      success: true,
      book: bookName,
      message: `Demo Mode: Sheet "${bookName}" successfully initialized with 18 GLBC columns and validations!`
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'initBookSheet', book: bookName }),
      redirect: 'follow'
    });
    const data = await res.json();
    if (data.success) {
      if (!cachedActiveBooks.some((b) => b.toLowerCase() === bookName.toLowerCase())) {
        cachedActiveBooks.push(bookName);
      }
      clearVerseCache(bookName);
    }
    return data;
  } catch (err) {
    console.error('initBookSheetApi error:', err);
    return { success: false, error: String(err) };
  }
}

export async function saveMemberApi(member: {
  name: string;
  role: string;
  phone: string;
  email: string;
  active: boolean;
  originalEmail?: string;
  originalName?: string;
}): Promise<{ success: boolean; message?: string; team?: TeamMember[]; error?: string }> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    const idx = cachedTeam.findIndex(
      (m) => (member.originalEmail && m.email === member.originalEmail) || m.name === member.originalName || m.name === member.name
    );
    if (idx !== -1) {
      cachedTeam[idx] = { ...cachedTeam[idx], ...member };
    } else {
      cachedTeam.push({ ...member, roles: [member.role] });
    }
    return {
      success: true,
      message: `Demo Mode: Team member "${member.name}" saved and role protections synced.`,
      team: cachedTeam
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'saveMember', idToken: currentIdToken || undefined, ...member }),
      redirect: 'follow'
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.team)) {
      cachedTeam = unifyTeamMembers(data.team);
    }
    return data;
  } catch (err) {
    console.error('saveMemberApi error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Generates dynamic wa.me link with contextual message matching the active verse state
 * and deep-links directly to the exact verse card in the web app
 */
export function generateWhatsAppLink(
  phone: string,
  verseRef: string,
  book: string,
  status: string,
  roleNeeded: string,
  recipientName: string,
  chapter?: number
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://glbc-hub.vercel.app';
  
  // Extract chapter from verseRef if not passed directly (e.g. "Rom 1:5" -> 1)
  let chap = chapter;
  if (!chap) {
    const m = verseRef.match(/(\d+):/);
    if (m) chap = parseInt(m[1], 10);
  }

  const deepLink = `${baseUrl}?book=${encodeURIComponent(book)}${chap ? `&chapter=${chap}` : ''}&verse=${encodeURIComponent(verseRef)}`;

  const message = `Hello ${recipientName}! 🙏
GLBC Translation Update:
📖 Book: ${book}
📍 Verse: ${verseRef}
🏷️ Current Status: ${status}
⚡ Action needed: ${roleNeeded}

👉 Review & Approve directly in GLBC Hub:
${deepLink}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface InitialBundle {
  books: string[];
  team: TeamMember[];
  verses: VerseItem[];
  analytics: BookAnalytics | null;
  permissions?: TeamPermissionsMap;
}

export function getCachedInitialBundle(book = 'Romans', chapter = 1): InitialBundle | null {
  if (typeof window === 'undefined') return null;
  const cacheKey = `glbc_bundle_${book}_${chapter}`;
  try {
    const item = sessionStorage.getItem(cacheKey);
    if (item) {
      const parsed = JSON.parse(item);
      if (parsed && Array.isArray(parsed.verses) && parsed.verses.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export async function fetchInitialBundle(book = 'Romans', chapter = 1): Promise<InitialBundle> {
  const url = getAppsScriptUrl();
  const cacheKey = `glbc_bundle_${book}_${chapter}`;

  if (!isLiveApiConfigured()) {
    let verses: VerseItem[];
    if (book.toLowerCase() === 'romans') {
      const raw = SAMPLE_VERSES.filter((v) => v.chapter === chapter);
      verses = raw.map(normalizeVerse);
    } else {
      verses = await getCanonicalReferenceVerses(book, chapter);
    }
    const team = unifyTeamMembers(SAMPLE_TEAM);
    return {
      books: ['Romans'],
      team,
      verses,
      analytics: SAMPLE_ANALYTICS
    };
  }

  try {
    const endpoint = new URL(url);
    endpoint.searchParams.set('action', 'getInitialBundle');
    endpoint.searchParams.set('book', book);
    endpoint.searchParams.set('chapter', String(chapter));

    const res = await fetch(endpoint.toString(), { redirect: 'follow' });
    const data = await res.json();
    if (data.success) {
      const unifiedTeam = unifyTeamMembers(data.team || []);
      cachedTeam = unifiedTeam;
      let normalizedVerses = Array.isArray(data.verses) ? data.verses.map(normalizeVerse) : [];
      if (normalizedVerses.length === 0 && book.toLowerCase() !== 'romans') {
        normalizedVerses = await getCanonicalReferenceVerses(book, chapter);
      }
      const validBooks = filterValidBookNames(Array.isArray(data.books) ? data.books : [book]);
      cachedActiveBooks = validBooks.length > 0 ? validBooks : ['Romans'];
      const bundle: InitialBundle = {
        books: cachedActiveBooks,
        team: unifiedTeam,
        verses: normalizedVerses,
        analytics: data.analytics || null,
        permissions: data.permissions || undefined
      };

      const memKey = `${book.toLowerCase()}:${chapter}`;
      verseMemoryCache.set(memKey, normalizedVerses);

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(bundle));
      } catch (e) {}

      return bundle;
    }
  } catch (err) {
    console.warn('Initial bundle fetch failed, falling back to parallel endpoints:', err);
  }

  // Fallback to parallel individual endpoints
  const [fetchedBooks, fetchedTeam, fetchedVerses, fetchedAnalytics] = await Promise.all([
    fetchBooks(),
    fetchConfig(),
    fetchVerses(book, chapter),
    fetchAnalytics(book)
  ]);

  const bundle: InitialBundle = {
    books: fetchedBooks,
    team: fetchedTeam,
    verses: fetchedVerses,
    analytics: fetchedAnalytics
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(bundle));
  } catch (e) {}

  return bundle;
}

/**
 * Generates formatted text summary for coordinator weekly WhatsApp broadcast
 * (Migrates Google Sheets "Generate Weekly Summary" menu action)
 */
export function generateWeeklySummaryText(book: string, analytics: BookAnalytics): string {
  const { total, completed, completionRate, stages, bottlenecks } = analytics;
  const underReviewTotal = stages.underReview + stages.awaitingReview;

  return `📊 *GLBC Translation — Weekly Progress Report*
📖 *Book: ${book}*
━━━━━━━━━━━━━━━━━━━━━━
✅ *Completed (Done):* ${completed} / ${total} verses (${completionRate}%)
🟡 *Under Review:* ${underReviewTotal} verses
🟡 *Awaiting Committee:* ${stages.awaitingCommittee} verses
🟡 *Needs Final Sign-Off:* ${stages.needsFinal} verses
🔴 *Not Started:* ${stages.notStarted} verses

⚠️ *Current Reviewer Bottlenecks:*
• Orthographic: ${bottlenecks.orthographic} pending
• Style & Language: ${bottlenecks.style} pending
• Technical: ${bottlenecks.technical} pending
• Theological: ${bottlenecks.theological} pending

━━━━━━━━━━━━━━━━━━━━━━
🌐 *Review directly on the Web App:*
${typeof window !== 'undefined' ? window.location.origin : 'https://glbc-hub.vercel.app'}?book=${encodeURIComponent(book)}`;
}

// ================================================================
//  RBAC & SECURITY CONSOLE APIS (Tasks 6.3 & 6.5)
// ================================================================

let cachedPermissions: TeamPermissionsMap = {};

export async function fetchPermissionsApi(): Promise<PermissionsApiResponse> {
  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    try {
      const stored = localStorage.getItem('glbc_rbac_permissions');
      if (stored) {
        cachedPermissions = JSON.parse(stored);
      }
    } catch (e) {}
    return { success: true, permissions: cachedPermissions };
  }

  try {
    const res = await fetch(`${endpoint}?action=getPermissions`, { redirect: 'follow' });
    const data: PermissionsApiResponse = await res.json();
    if (data.success && data.permissions) {
      cachedPermissions = data.permissions;
      try {
        localStorage.setItem('glbc_rbac_permissions', JSON.stringify(data.permissions));
      } catch (e) {}
    }
    return data;
  } catch (err) {
    console.warn('fetchPermissionsApi error, fallback to local:', err);
    try {
      const stored = localStorage.getItem('glbc_rbac_permissions');
      if (stored) cachedPermissions = JSON.parse(stored);
    } catch (e) {}
    return { success: true, permissions: cachedPermissions };
  }
}

export async function savePermissionsApi(
  permissions: TeamPermissionsMap,
  userEmail?: string
): Promise<PermissionsApiResponse> {
  cachedPermissions = { ...permissions };
  try {
    localStorage.setItem('glbc_rbac_permissions', JSON.stringify(permissions));
  } catch (e) {}

  const endpoint = getAppsScriptUrl();
  if (!isLiveApiConfigured()) {
    return {
      success: true,
      permissions,
      message: 'Demo Mode: Permissions saved locally.',
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'demo-admin'
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'savePermissions',
        idToken: currentIdToken || undefined,
        userEmail: userEmail || undefined,
        permissions
      }),
      redirect: 'follow'
    });
    const data: PermissionsApiResponse = await res.json();
    return data;
  } catch (err) {
    console.error('savePermissionsApi error:', err);
    return { success: false, error: String(err) };
  }
}
