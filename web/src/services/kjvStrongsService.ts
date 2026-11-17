/**
 * Authentic KJV Strong's Greek Concordance Service
 * Pre-bundled offline dataset providing exact King James Version sentence flow,
 * authentic Strong's Greek concordance numbers (G1-G5624), Greek lemmas,
 * transliterations, pronunciations, and lexical definitions for all 27 New Testament books.
 * Zero external API latency, 100% offline, matching KJV 100%.
 */

export interface KjvPhraseWord {
  text: string;
  strongs: string;
  allStrongs?: string[];
  lemma: string;
  translit: string;
  pronounce: string;
  definition: string;
  kjvGloss: string;
}

export interface KjvStrongsBookData {
  book: string;
  code: string;
  chapters: Record<string, Record<string, KjvPhraseWord[]>>;
}

const BOOK_CODE_MAP: Record<string, string> = {
  matthew: 'MAT',
  mat: 'MAT',
  mt: 'MAT',
  mark: 'MAR',
  mar: 'MAR',
  mrk: 'MAR',
  mk: 'MAR',
  luke: 'LUK',
  luk: 'LUK',
  lk: 'LUK',
  john: 'JOH',
  joh: 'JOH',
  jhn: 'JOH',
  jn: 'JOH',
  acts: 'ACT',
  act: 'ACT',
  romans: 'ROM',
  rom: 'ROM',
  rm: 'ROM',
  '1 corinthians': '1CO',
  '1corinthians': '1CO',
  '1co': '1CO',
  '1 cor': '1CO',
  '2 corinthians': '2CO',
  '2corinthians': '2CO',
  '2co': '2CO',
  '2 cor': '2CO',
  galatians: 'GAL',
  gal: 'GAL',
  ephesians: 'EPH',
  eph: 'EPH',
  philippians: 'PHI',
  phi: 'PHI',
  php: 'PHI',
  colossians: 'COL',
  col: 'COL',
  '1 thessalonians': '1TH',
  '1thessalonians': '1TH',
  '1th': '1TH',
  '2 thessalonians': '2TH',
  '2thessalonians': '2TH',
  '2th': '2TH',
  '1 timothy': '1TI',
  '1timothy': '1TI',
  '1ti': '1TI',
  '2 timothy': '2TI',
  '2timothy': '2TI',
  '2ti': '2TI',
  titus: 'TIT',
  tit: 'TIT',
  philemon: 'PHM',
  phm: 'PHM',
  hebrews: 'HEB',
  heb: 'HEB',
  james: 'JAM',
  jam: 'JAM',
  jas: 'JAM',
  '1 peter': '1PE',
  '1peter': '1PE',
  '1pe': '1PE',
  '2 peter': '2PE',
  '2peter': '2PE',
  '2pe': '2PE',
  '1 john': '1JO',
  '1john': '1JO',
  '1jo': '1JO',
  '1jn': '1JO',
  '2 john': '2JO',
  '2john': '2JO',
  '2jo': '2JO',
  '2jn': '2JO',
  '3 john': '3JO',
  '3john': '3JO',
  '3jo': '3JO',
  '3jn': '3JO',
  jude: 'JUD',
  jud: 'JUD',
  revelation: 'REV',
  rev: 'REV'
};

// In-memory cache for loaded book data
const bookCache: Record<string, KjvStrongsBookData> = {};

/**
 * Normalizes book name to standard 3-letter uppercase book code
 */
export function getBookCode(bookName: string): string {
  const clean = bookName.trim().toLowerCase();
  return BOOK_CODE_MAP[clean] || 'ROM';
}

/**
 * Loads authentic KJV Strong's dataset for a New Testament book from web/public/kjv-strongs/
 */
export async function loadKjvStrongsBook(bookName: string): Promise<KjvStrongsBookData | null> {
  const code = getBookCode(bookName);
  if (bookCache[code]) {
    return bookCache[code];
  }

  // Check sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(`kjv_strongs_${code}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        bookCache[code] = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  try {
    const res = await fetch(`/kjv-strongs/${code}.json`);
    if (res.ok) {
      const data: KjvStrongsBookData = await res.json();
      bookCache[code] = data;
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`kjv_strongs_${code}`, JSON.stringify(data));
        }
      } catch (e) {}
      return data;
    }
  } catch (err) {
    console.warn(`Failed to fetch local KJV Strong's data for ${code}:`, err);
  }

  return null;
}

/**
 * Retrieves the exact KJV phrases with aligned Strong's Greek definitions for an individual verse
 */
export async function getVerseKjvStrongsWords(
  bookName: string,
  chapter: number,
  verseNumber: number
): Promise<KjvPhraseWord[]> {
  const bookData = await loadKjvStrongsBook(bookName);
  if (!bookData || !bookData.chapters) return [];

  const chData = bookData.chapters[String(chapter)];
  if (!chData) return [];

  return chData[String(verseNumber)] || [];
}

/**
 * Reconstructs the complete canonical KJV English text from the KJV Strong's phrases
 */
export function buildKjvSentence(words: KjvPhraseWord[]): string {
  if (!words || words.length === 0) return '';
  return words.map((w) => w.text).join(' ');
}
